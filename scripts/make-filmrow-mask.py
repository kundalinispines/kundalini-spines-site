#!/usr/bin/env python3
"""FILM-ROW FEATHER MASK — bakes the alpha PNG that dissolves a .ksd-filmrow__media
video into the nebula behind it.  Pairs with css/filmrow-atmos.css.

    python scripts/make-filmrow-mask.py                       # bake the shipped set
    python scripts/make-filmrow-mask.py --depth 0.13 --softness 0.40 --seed 5 \
        --out assets/atmos/filmrow-mask-04.png                # bake one, tuned

WHY A BAKED PNG AND NOT A LIVE EFFECT (owner's call, Aug 16 2026)
----------------------------------------------------------------
css/spine-doc.css pins `aspect-ratio: 1.2` on .ksd-filmrow__media at every
width, so ONE baked mask fits every viewport with `mask-size: 100% 100%` and no
distortion at all above the 900px breakpoint.  It costs nothing per frame, which
is the whole point: these two videos are SCRUBBED by the scroll
(js/spine-doc.js), so every wheel tick is a seek plus a decode plus a paint.

  - An SVG feTurbulence filter was rejected for exactly that reason: the filter
    re-runs on every painted frame, on top of the decode the scrub is already
    paying for.
  - Stacked radial-gradients were rejected because they read as overlapping
    circles.  A gradient stack cannot produce a wandering edge; noise can.

THE FIELD
---------
Value noise, 5 octaves, lattice hash below.  The edge is not a shape that is
then blurred — it is an EROSION of a distance field, so the boundary walks in
and out and never resolves into an oval:

    e      = distance to the nearest edge, in units of the feather band
             (0 at the true border, 1 at the inner lip of the band, >1 inside)
    taper  = 1 - smoothstep(e / reach)  1 at the border, 0 at e = reach
    eff    = e * (1 + wobble * n * taper)      n in -1..1, the noise
    alpha  = smoothstep(clamp(eff,0,1)) ** gamma

Every piece of that was arrived at by discarding something that looked right
first:

  - ADDITIVE erosion (eff = e + wobble*n) leaves alpha NON-ZERO at the true
    border wherever the noise is positive — 0.65 peak alpha ON the frame edge
    at wobble 0.6, i.e. the rectangle comes straight back as a dashed line.
    The multiplicative form is pinned to 0 at e=0 whatever the noise does.
  - MULTIPLICATIVE WITH NO TAPER AT ALL pushes the wobble to the middle of the
    frame: the guaranteed-opaque region only starts at e = 1/(1-wobble), which
    at wobble 0.6 is 2.5x the band and leaves the middle half of the frame as
    the only crisp part.
  - TAPER OVER ONE BAND (reach 1.0) was the first fix and it over-corrected.
    The erosion then cannot reach past the band at all, and the 50%-alpha
    contour only walks 0.29-0.76 of it.  Rendered over the real nebula that is
    a rounded rectangle with soft edges — the exact thing this exists to avoid.

`reach` is the dial between those last two, and 1.8 is where it landed.
Measured at 1024x853, depth 0.11 (a 93px nominal band), wobble 1.35, seed 1,
scanning the 50%-alpha contour inward along the middle 60% of all four sides:

    reach   contour walk        crisp core (always alpha 255)
    1.0     0.29-0.76 band   27- 71px    82% x 78% of the frame
    1.4     0.28-0.92        26- 86px    74% x 69%
    1.8     0.27-1.06        24- 98px    67% x 60%      <- shipped
    2.2     0.27-1.17        24-110px    60% x 52%
    2.8     0.27-1.50        24-141px    49% x 38%

At 1.8 the edge crosses its own nominal depth — some bites go past the band,
others hold the video out to a quarter of it — and that 4x spread is what stops
the outline resolving into geometry.  At 2.8 whole corners are gone and it
reads as damage, not atmosphere.  THE CRISP CORE IS GUARANTEED BY
CONSTRUCTION, not by luck: taper is exactly 0 at e >= reach, so eff = e >= 1
there and alpha is 255.  Every bake asserts it.

DEPTH IS A FRACTION OF THE SHORT SIDE, NOT OF EACH AXIS.  Referencing each axis
to its own dimension (dx/W, dy/H) looked right on paper and is wrong on screen:
at 1024x853 and depth 0.10 it makes the side bands 102px and the top/bottom
bands 85px, a 17% thinner feather across the top of every video.  Measuring
both against H gives one uniform ring, 85px all the way round.

ALPHA CHANNEL, NOT LUMINANCE.  `mask-image` defaults to `mask-mode:
match-source`, which for a raster image means ALPHA — hand it an opaque
greyscale PNG and the mask is a no-op that looks exactly like "the CSS did not
load".  The bake writes mode "LA" (greyscale + alpha) with the SAME value in
both channels, so it is correct under either mask-mode and survives anyone
adding `mask-mode: luminance` later.

RESOLUTION.  768x640 is EXACTLY 1.2:1 — 1024x853, the obvious first pick, is
1.2005 and leaves a third of a pixel of skew.  The element measures ~700px wide
at a 1440px viewport, so 768 is still oversampled, and the mask's steepest
gradient spans 60-odd source pixels at this size; there is nothing here for
more resolution to resolve.  Measured, LA PNG, optimize=True, depth 0.11:

    1024x853  62.1 KB      768x640  40.8 KB      512x427  23.6 KB

768 is the middle one and the only exact ratio of the three.  Two shipped masks
is 80 KB, against 2.2 MB for one of the clips they sit on.  (Encoding barely
moves it: RGBA costs 4 KB more, dropping the duplicated L channel saves 1 KB.
Resolution is the only real dial.)

BELOW 900px css/spine-doc.css drops the aspect-ratio and the element takes the
clip's own shape (black-tide 1176x780 = 1.508, spine-frequency 1108x828 =
1.338).  `mask-size: 100% 100%` then stretches this 1.2 mask horizontally by up
to 26%.  That is deliberate and is the right failure: a stretched cloud edge is
still a cloud edge, whereas `contain` would leave two unmasked bars and `cover`
would crop the feather off two sides entirely.

THE NOISE HASH IS DUPLICATED IN filmrow-atmos-lab.html ON PURPOSE.  The lab
regenerates the mask live in a canvas so depth/softness/seed can be dragged;
this file is what actually ships.  They are held in sync by a parity check in
the lab (button: "Check parity") which generates in JS at this resolution and
diffs against the baked PNG — if you change the maths here, change it there and
re-run that check.  Measured 2026-08-16: max per-pixel difference 0 of 255
across all 873,472 pixels.
"""

import argparse
import os
import sys

import numpy as np
from PIL import Image

# --------------------------------------------------------------------------
# The shared noise.  Integer-hashed value noise: no permutation table, so the
# JS side is a transcription rather than a port, and every constant here is a
# 32-bit odd number chosen only for being large and coprime.
# --------------------------------------------------------------------------

U32 = np.uint32

# How many standard deviations of the raw noise field map onto the full -1..1
# erosion swing.  See the block in make_mask that uses it.
NOISE_SIGMAS = 2.2

# Erosion amplitude, and how far out (in band widths) the erosion is allowed to
# reach.  Both are documented against measurements at the foot of this block —
# they are the two numbers that decide cloud versus rounded rectangle.
#
# WOBBLE, measured the same way as the reach table in the header (reach 1.8):
#     0.90 -> contour 0.33-0.95    1.35 -> 0.27-1.06    1.90 -> 0.21-1.15
# It is the weaker of the two dials — a 2x change in amplitude moves the walk
# by about a fifth of a band, where a 2x change in reach nearly doubles it.
# Raise reach for a wilder outline; wobble only sharpens the small bites.
WOBBLE = 1.35
REACH = 1.8


def _hash01(ix, iy, seed):
    """Lattice value in [0,1).  ix, iy, seed are uint32 arrays/scalars.

    JS twin:  h = Math.imul(...) chains, then h / 4294967296.
    uint32 multiply wraps in numpy exactly as Math.imul does in JS, and the
    final divide by 2**32 is exact in float64, so the two agree bit for bit.
    """
    # The seed term is folded in Python ints and reduced mod 2**32 first: as a
    # numpy uint32 scalar multiply it wraps correctly but raises
    # RuntimeWarning: overflow, once per octave per bake. Same bits, no noise
    # in the log.
    s = U32((int(seed) * 1274126177) & 0xFFFFFFFF)
    with np.errstate(over="ignore"):
        h = (ix * U32(374761393) + iy * U32(668265263) + s).astype(U32)
        h = (h ^ (h >> U32(13))).astype(U32)
        h = (h * U32(1274126177)).astype(U32)
        h = (h ^ (h >> U32(16))).astype(U32)
    return h.astype(np.float64) / 4294967296.0


def _value_noise(u, v, freq, seed):
    x = u * freq
    y = v * freq
    x0 = np.floor(x)
    y0 = np.floor(y)
    fx = x - x0
    fy = y - y0
    # smoothstep on the cell fraction — plain linear interpolation leaves the
    # lattice visible as a diamond grid once four octaves are stacked.
    sx = fx * fx * (3.0 - 2.0 * fx)
    sy = fy * fy * (3.0 - 2.0 * fy)
    ix = x0.astype(U32)
    iy = y0.astype(U32)
    one = U32(1)
    n00 = _hash01(ix, iy, seed)
    n10 = _hash01(ix + one, iy, seed)
    n01 = _hash01(ix, iy + one, seed)
    n11 = _hash01(ix + one, iy + one, seed)
    a = n00 + (n10 - n00) * sx
    b = n01 + (n11 - n01) * sx
    return a + (b - a) * sy


def fbm(u, v, seed, octaves=5, base=3.0, lacunarity=2.0, gain=0.5):
    """Fractional Brownian motion in [0,1].

    base 3.0 = three noise cells across the video's height.  That is the number
    that decides whether the edge reads as CLOUD or as FUR: at base 8 the
    wobble period is ~106px and the border turns into a ragged deckle; at base
    1.5 there are barely two lobes per side and the shape reads as a bent
    rectangle.  Three gives four or five big lobes around the perimeter with
    the higher octaves breaking each one up.
    """
    total = 0.0
    amp = 1.0
    norm = 0.0
    freq = base
    for o in range(octaves):
        # + o*101 rather than +o: adjacent seeds share the low bits of the hash
        # input, and octaves one apart then correlate visibly along the lattice.
        total = total + amp * _value_noise(u, v, freq, U32(seed + o * 101))
        norm += amp
        amp *= gain
        freq *= lacunarity
    return total / norm


# --------------------------------------------------------------------------


def make_mask(width, height, depth, softness, seed, wobble=WOBBLE, reach=REACH):
    """Return a uint8 array, 0 = fully transparent, 255 = fully opaque video."""
    ys, xs = np.mgrid[0:height, 0:width].astype(np.float64)

    # Square noise cells: both axes divided by the SAME number, so a 1.2-wide
    # frame simply sees 1.2 cells' worth more noise horizontally rather than
    # 1.2x-stretched noise.
    u = xs / height
    v = ys / height

    # Distance to the nearest edge in pixels, then in band units.
    dx = np.minimum(xs + 0.5, width - 0.5 - xs)
    dy = np.minimum(ys + 0.5, height - 0.5 - ys)
    band_px = depth * height
    e = np.minimum(dx, dy) / band_px

    f = fbm(u, v, seed)
    # STANDARDISE THE NOISE OVER THE BAND, do not just use 2*f-1.  Two measured
    # problems with the raw field (1024x853, seed 1):
    #   - it is NARROW. 5 octaves of value noise is a sum of independent
    #     samples, so it piles up around its mean: std 0.106, i.e. 2f-1 has std
    #     0.21 and never gets near +/-1. The 50%-alpha contour then only walked
    #     0.38-0.67 of the band whatever wobble was set to (measured across
    #     wobble 0.6 through 2.2 — a 4x change in amplitude moved the low end by
    #     0.09 of a band and nothing else). The edge was a soft rounded
    #     rectangle and no amount of wobble was going to fix it.
    #   - it is OFF-CENTRE, per seed. The base octave is only ~3 cells across
    #     the height, so its sample mean is luck: 0.606 at freq 3 against a true
    #     0.5. That DC offset makes `depth` mean something slightly different
    #     for every seed.
    # Both go away by measuring the field's own mean and spread inside the band
    # and mapping +/-NOISE_SIGMAS onto +/-1.  2.2 sigma keeps ~97% of the field
    # unclipped while giving n a std of 0.45 instead of 0.21; at 1.5 sigma the
    # field clips into flat plateaus and the outline gains straight segments,
    # at 3.5 it is back to barely moving.
    band_sel = e < reach
    fm = float(f[band_sel].mean())
    fs = float(f[band_sel].std()) or 1e-6
    n = np.clip((f - fm) / (NOISE_SIGMAS * fs), -1.0, 1.0)

    ec = np.clip(e / reach, 0.0, 1.0)
    taper = 1.0 - (ec * ec * (3.0 - 2.0 * ec))  # 1 at the border, 0 at e = reach
    eff = e * (1.0 + wobble * n * taper)

    t = np.clip(eff, 0.0, 1.0)
    t = t * t * (3.0 - 2.0 * t)

    # softness 0..1 -> gamma 0.55..2.75.  gamma < 1 drives alpha to opaque fast
    # (a torn, near-hard edge); gamma > 1 holds a long faint tail, which is the
    # "dissolves into the nebula" end.  0.55/2.75 are the ends where the look
    # stops changing: below 0.5 the edge is indistinguishable from a hard cut
    # with a nibbled outline, above 2.8 the outer third of the band is under
    # 4% alpha and contributes nothing but a dim halo.
    gamma = 0.55 + 2.20 * softness
    a = np.power(t, gamma)

    return np.clip(np.rint(a * 255.0), 0, 255).astype(np.uint8)


def write_mask(path, arr):
    """LA PNG: value in BOTH channels.  See the header — mask-mode match-source
    reads ALPHA, so an L-only PNG masks nothing."""
    img = Image.merge("LA", (Image.fromarray(arr, "L"), Image.fromarray(arr, "L")))
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    img.save(path, optimize=True)
    return os.path.getsize(path)


def contour_spread(arr, band_px):
    """How far the 50%-alpha contour wanders, in units of the nominal band,
    scanned inward from every pixel along all four sides.

    This is the ONE number that says whether the edge is a cloud or a shape.
    A perfect oval, or any smoothed rectangle, scans a narrow band here; the
    spread is what makes the outline unreadable as geometry.

    ONLY THE MIDDLE 60% OF EACH SIDE IS SCANNED.  Including the corners makes
    the number meaningless: a row that starts inside the top band has its
    distance set by dy, not dx, so scanning it from the left reports a contour
    9x the band and swamps everything else.  A first cut did include them, and
    every wobble from 0.6 to 1.9 then reported the same 9.0 maximum."""
    h, w = arr.shape
    ry = slice(int(h * 0.20), int(h * 0.80))
    rx = slice(int(w * 0.20), int(w * 0.80))

    def scan(lines):
        # lines: 2-D, each ROW a scan running inward from the edge
        hit = lines >= 128
        idx = np.argmax(hit, axis=1).astype(np.float64)
        idx[~hit.any(axis=1)] = np.nan
        return idx / band_px

    d = np.concatenate([
        scan(arr[ry, :]),                # inward from the left
        scan(arr[ry, ::-1]),             # inward from the right
        scan(arr.T[rx, :]),              # inward from the top
        scan(arr.T[rx, ::-1]),           # inward from the bottom
    ])
    d = d[~np.isnan(d)]
    return float(d.min()), float(d.max()), float(np.median(d))


# The shipped defaults.  depth 0.11 and softness 0.50 are the lab's start
# position; three seeds so the two rows on the page are not the same silhouette
# (index.html would take 01 and 02, leaving 03 for the next clip).
DEFAULT_DEPTH = 0.11
DEFAULT_SOFTNESS = 0.50
DEFAULT_W = 768
DEFAULT_H = 640
SHIPPED_SEEDS = [1, 2, 3]


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    p.add_argument("--depth", type=float, default=DEFAULT_DEPTH,
                   help="feather band as a fraction of the SHORT side. "
                        "The owner's range is 0.08-0.15 (default %(default)s)")
    p.add_argument("--softness", type=float, default=DEFAULT_SOFTNESS,
                   help="0 = torn hard edge, 1 = long faint tail (default %(default)s)")
    p.add_argument("--wobble", type=float, default=WOBBLE,
                   help="erosion amplitude (default %(default)s)")
    p.add_argument("--reach", type=float, default=REACH,
                   help="how far out the erosion may walk, in band widths. "
                        "The dial between rounded rectangle and cloud; see the "
                        "table in the module header (default %(default)s)")
    p.add_argument("--seed", type=int, default=None,
                   help="one seed. Omit to bake the shipped set %s" % SHIPPED_SEEDS)
    p.add_argument("--width", type=int, default=DEFAULT_W)
    p.add_argument("--height", type=int, default=DEFAULT_H)
    p.add_argument("--out", default=None,
                   help="output path for a single --seed bake")
    args = p.parse_args(argv)

    if not (0.02 <= args.depth <= 0.30):
        p.error("--depth %.3f is outside 0.02-0.30; the owner's range is 0.08-0.15"
                % args.depth)

    repo = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    jobs = ([(args.seed, args.out or os.path.join(
                repo, "assets", "atmos", "filmrow-mask-%02d.png" % args.seed))]
            if args.seed is not None else
            [(s, os.path.join(repo, "assets", "atmos", "filmrow-mask-%02d.png" % s))
             for s in SHIPPED_SEEDS])

    # The crisp core, in px: the erosion cannot touch anything at or beyond
    # e = reach, so the ring the mask may disturb is reach * depth * height on
    # every side (in PIXELS on both axes — depth is referenced to the short
    # side, see the header).
    ring = int(round(args.reach * args.depth * args.height))
    for seed, path in jobs:
        arr = make_mask(args.width, args.height, args.depth, args.softness,
                        seed, args.wobble, args.reach)

        # The contract the CSS depends on: the middle of the frame is untouched
        # video.  Assert it rather than trust it — this is a generator whose
        # output is judged by eye, and "the centre went very slightly milky" is
        # not something an eye catches against a nebula.
        core = arr[ring:args.height - ring, ring:args.width - ring]
        assert core.size and core.min() == 255, (
            "crisp core is not opaque (min alpha %d) — wobble %.2f / reach %.2f "
            "are reaching past the taper" % (core.min(), args.wobble, args.reach))

        size = write_mask(path, arr)
        lo, hi, med = contour_spread(arr, args.depth * args.height)
        print("%s  %dx%d  depth %.3f (%dpx band, %dpx ring)  softness %.2f  "
              "wobble %.2f  reach %.2f  seed %d  %.1f KB  crisp core %.0f%%x%.0f%%  "
              "50%%-alpha contour %.2f-%.2f (median %.2f) x band"
              % (os.path.relpath(path, repo), arr.shape[1], arr.shape[0],
                 args.depth, round(args.depth * args.height), ring,
                 args.softness, args.wobble, args.reach, seed, size / 1024.0,
                 100.0 * (args.width - 2 * ring) / args.width,
                 100.0 * (args.height - 2 * ring) / args.height, lo, hi, med))
    return 0


if __name__ == "__main__":
    sys.exit(main())
