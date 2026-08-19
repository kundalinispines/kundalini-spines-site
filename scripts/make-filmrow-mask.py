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

# How much of the vertebral rhythm replaces the noise where it applies, for
# --vertebrae.  1.0 is a clean stack and reads as machined; 0.0 is the shipped
# cloud.  0.55 keeps the noise breaking every segment up so it stays an EDGE
# that happens to have a rhythm, not a row of scallops.
VERT_MIX = 0.55


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


def make_mask(width, height, depth, softness, seed, wobble=WOBBLE, reach=REACH,
              vertebrae=0, vert_mix=VERT_MIX, corner=0.0):
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

    # CORNERS: WHY A PLAIN min() GROWS A HORN THERE.
    # min(dx, dy) makes the distance field SQUARE -- its contours are rectangles
    # with a diagonal crease running out of each corner, where dx == dy and
    # neither term wins. A noise lobe that happens to sit positive on that crease
    # is stretched along it, and because the crease is the one direction where
    # the field is not pulling the edge back, the lobe comes out as a thin spike
    # of video reaching into the corner. Mask 03 grew exactly that in its top
    # right and the owner called it: "too much of a point" (Aug 19 2026).
    #
    # `corner` is a polynomial smooth-min radius in band units, which rounds the
    # contours so the crease never forms and no wedge has a direction to grow
    # along. Measured on seed 3, first 50%-alpha pixel along the top-right
    # diagonal, then the first fully-opaque one:
    #
    #     corner 0.0   50% at 19px   opaque at 48px   <- the horn
    #     corner 0.3   50% at 26px   opaque at 80px
    #     corner 0.5   50% at 31px   opaque at 83px
    #     corner 0.7   50% at 39px   opaque at 85px
    #     corner 0.9   50% at 44px   opaque at 88px
    #     corner 1.1   50% at 49px   opaque at 91px   <- shipped on 03
    #
    # 0.3 was enough to stop it reading as a point. The owner then asked twice
    # for softer and chose 1.1 off the sweep, which is past where I would have
    # stopped -- I called 0.9 the last value that still reads as a CORNER, and
    # at 1.1 the two edges genuinely merge into one sweep. That is the look
    # they want on this row; it is a taste call, not an oversight, so do not
    # "restore" the corner here. The dial still defaults to 0.0 for everything
    # else.
    #
    # It is CHEAP: against the
    # same seed at corner 0.0 it moves 1.03% of pixels (max delta 67 of 255) and
    # every one of them is within a corner, so the silhouette you already liked
    # along the sides is the silhouette you keep.
    #
    # DEFAULT 0.0, so masks baked before this existed still bake byte-identical.
    if corner > 0.0:
        r = corner * band_px
        hh = np.clip(0.5 + 0.5 * (dy - dx) / r, 0.0, 1.0)
        dmin = dy * (1.0 - hh) + dx * hh - r * hh * (1.0 - hh)
    else:
        dmin = np.minimum(dx, dy)
    e = dmin / band_px

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

    # ---- THE VERTEBRAL RHYTHM (off unless --vertebrae is passed) ----------
    # A spine reads as a REGULAR STACK, and regularity is the one thing the
    # noise field above is built to destroy — so this is a separate term mixed
    # into n rather than another octave, which would just be more cloud.
    #
    # WEIGHTED TO THE SIDES, AND THAT IS NOT COSMETIC.  The rhythm is a
    # function of y alone, so on the top and bottom edges it is CONSTANT across
    # x: applied everywhere it rules a straight line across both, which is
    # exactly the rectangle this whole file exists to dissolve.  Measured at
    # 768x640, depth 0.11, seed 1, vertebrae 7, mix 1.0, scanning the 50%-alpha
    # contour along the middle 60% of each side:
    #
    #                 top          bottom       left / right
    #   unweighted    0.82-0.82    0.92-0.92    0.27-1.11
    #   weighted      0.30-0.85    0.40-1.07    0.27-1.11
    #
    # Unweighted the top and bottom spreads are 0.00 -- not "nearly straight",
    # DEAD straight, a ruled line at 0.82 of the band all the way across.
    # Weighting by which edge is nearest costs the sides nothing (0.27-1.11
    # either way) and hands top and bottom their walk back.
    if vertebrae > 0:
        seg = np.cos(2.0 * np.pi * vertebrae * (ys / height)
                     + (int(seed) % 16) * (np.pi / 8.0))
        # 1 where a SIDE is the nearest edge, 0 where the top/bottom is, with
        # half a band of crossfade so the corners do not switch abruptly.
        w = np.clip((dy - dx) / (0.5 * band_px), 0.0, 1.0)
        w = w * w * (3.0 - 2.0 * w)
        n = np.clip(n * (1.0 - vert_mix * w) + seg * (vert_mix * w), -1.0, 1.0)

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


def from_alpha(path, width, height, depth, seed, reach=REACH, edge_blend=True,
               invert=False):
    """Bake a mask from a HAND-PAINTED PNG's alpha channel.

    The owner painted assets/reference/Untitled-2.png at exactly 768x640 with the
    silhouette in ALPHA -- the right channel, which is the part most hand-rolled
    masks get wrong.  Two things still needed doing, both measured Aug 19 2026:

    1. THE ALPHA WAS COMPRESSED TO 0..130, not 0..255.  Every pixel of the crisp
       core sat at 130, so the contract check read 0.0% opaque and the film row
       would have rendered at 51% transparency everywhere -- a washed-out video,
       not a feathered one, and not obviously a MASK fault when seen on the page.
       Stretching the observed range onto 0..255 puts the core at 255 and 100%.

    2. THE TOP AND BOTTOM EDGES WERE HARD.  Measured inward to full opacity:
       left 2-79px and right 8-84px (a real feather, comfortably inside the
       127px free zone), but top and bottom both had a MEDIAN OF 0 -- the video
       met the border at full strength across their whole width.  That is the
       rectangle this layer exists to dissolve, returning on two sides.

    So the sides are taken exactly as painted and an ordinary cloud edge is
    min()-ed in over the top and bottom only, crossfaded over half a band so the
    corners do not switch abruptly -- the same side-vs-top weighting the
    vertebral rhythm uses, and for the same reason.  After blending, top reaches
    full opacity at 40-202px (median 64) and the sides are untouched.

    Pass edge_blend=False to bake the painted alpha as-is, stretch only.

    INVERT EXISTS BECAUSE THE POLARITY IS NOT GUESSABLE FROM THE NUMBERS, and
    both polarities have now arrived from the same tool on the same shape.  The
    first painting had the silhouette the right way round with alpha capped at
    130; its re-export reaches a full 0..255 and is INVERTED -- opaque only in
    the edge strips, transparent through the middle, so as-is it keeps the teeth
    and throws the footage away.  Nothing in the range, the level count or the
    core check distinguishes the two: the second file scores a perfectly
    respectable 0..255 with 34 levels either way round.  Only looking does.
    Convention here: alpha 255 = KEEP THE VIDEO.
    """
    src = Image.open(path).convert("RGBA")
    if src.size != (width, height):
        raise SystemExit("--from-alpha %s is %dx%d, need %dx%d"
                         % (path, src.size[0], src.size[1], width, height))
    a = np.asarray(src)[..., 3].astype(np.float64)
    lo, hi = a.min(), a.max()
    if hi - lo < 1.0:
        raise SystemExit(
            "--from-alpha %s has a FLAT alpha channel (%d..%d). The silhouette "
            "must be in ALPHA, not luminance -- an opaque greyscale PNG masks "
            "nothing and looks exactly like the CSS failed to load." % (path, lo, hi))
    arr = np.clip((a - lo) * (255.0 / (hi - lo)), 0, 255)
    if invert:
        arr = 255.0 - arr

    if edge_blend:
        ys, xs = np.mgrid[0:height, 0:width].astype(np.float64)
        dx = np.minimum(xs + 0.5, width - 0.5 - xs)
        dy = np.minimum(ys + 0.5, height - 0.5 - ys)
        band_px = depth * height
        w = np.clip((dy - dx) / (0.5 * band_px), 0.0, 1.0)
        w = w * w * (3.0 - 2.0 * w)          # 1 where a SIDE is the nearest edge
        cloud = make_mask(width, height, depth, DEFAULT_SOFTNESS, seed).astype(np.float64)
        arr = arr * w + np.minimum(arr, cloud) * (1.0 - w)

    return np.clip(np.rint(arr), 0, 255).astype(np.uint8)


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
# position.  Five plain seeds, for CHOICE of silhouette rather than out of
# necessity: at three film rows the tuner's rotation already gives three
# distinct masks at every setting with only three baked, so nothing was
# repeating.  Checked against maskFor() Aug 19 2026, because the opposite claim
# was written here first and was wrong.  A repeat needs a FOURTH row.
#
# THREE OF THE SHIPPED MASKS ARE NOT REPRODUCED BY THIS LIST, because they are
# not plain seeds.  Running with no arguments re-bakes 01-05 and would QUIETLY
# FLATTEN 03 back to a square-cornered bake, so use its line, not the bare
# command:
#
#     03  python scripts/make-filmrow-mask.py --seed 3 --corner 1.1
#     06  python scripts/make-filmrow-mask.py --seed 6 --vertebrae 9 --vertebrae-mix 0.35
#     07  python scripts/make-filmrow-mask.py --seed 7 #             --from-alpha assets/reference/Untitled-2fix.png --invert
#
# These lines are the only record of how those three were made, exactly as the
# header's bake line is for the rest.  Keep them in step with the files.
DEFAULT_DEPTH = 0.11
DEFAULT_SOFTNESS = 0.50
DEFAULT_W = 768
DEFAULT_H = 640
SHIPPED_SEEDS = [1, 2, 3, 4, 5]


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
    p.add_argument("--corner", type=float, default=0.0,
                   help="smooth-min radius in band widths, which stops a noise "
                        "lobe growing into a spike at a corner. 0 = the plain "
                        "square distance field (default %(default)s)")
    p.add_argument("--vertebrae", type=int, default=0,
                   help="segments down each SIDE edge, spine-fashion. "
                        "0 = off, the shipped cloud (default %(default)s)")
    p.add_argument("--vertebrae-mix", type=float, default=VERT_MIX,
                   dest="vert_mix",
                   help="how much of the rhythm replaces the noise on the "
                        "sides, 0-1 (default %(default)s)")
    p.add_argument("--seed", type=int, default=None,
                   help="one seed. Omit to bake the shipped set %s" % SHIPPED_SEEDS)
    p.add_argument("--width", type=int, default=DEFAULT_W)
    p.add_argument("--height", type=int, default=DEFAULT_H)
    p.add_argument("--from-alpha", default=None, dest="from_alpha",
                   help="bake from a hand-painted PNG's ALPHA channel instead "
                        "of the noise field. Stretches the alpha to 0-255 and "
                        "blends a cloud edge over the top and bottom; see "
                        "from_alpha() for the measurements behind both")
    p.add_argument("--no-edge-blend", action="store_false", dest="edge_blend",
                   default=True,
                   help="with --from-alpha, bake the painted alpha as-is")
    p.add_argument("--invert", action="store_true", default=False,
                   help="with --from-alpha, flip the painted alpha. The "
                        "convention is alpha 255 = KEEP THE VIDEO; a mask that "
                        "is opaque only around its edges needs this")
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
        if args.from_alpha:
            arr = from_alpha(args.from_alpha, args.width, args.height,
                             args.depth, seed, args.reach, args.edge_blend,
                             args.invert)
        else:
            arr = make_mask(args.width, args.height, args.depth, args.softness,
                            seed, args.wobble, args.reach,
                            args.vertebrae, args.vert_mix, args.corner)

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
              "wobble %.2f  reach %.2f  seed %d  vertebrae %d/%.2f  %.1f KB  "
              "crisp core %.0f%%x%.0f%%  "
              "50%%-alpha contour %.2f-%.2f (median %.2f) x band"
              % (os.path.relpath(path, repo), arr.shape[1], arr.shape[0],
                 args.depth, round(args.depth * args.height), ring,
                 args.softness, args.wobble, args.reach, seed,
                 args.vertebrae, args.vert_mix, size / 1024.0,
                 100.0 * (args.width - 2 * ring) / args.width,
                 100.0 * (args.height - 2 * ring) / args.height, lo, hi, med))
    return 0


if __name__ == "__main__":
    sys.exit(main())
