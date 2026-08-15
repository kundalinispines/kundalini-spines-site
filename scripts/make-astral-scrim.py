#!/usr/bin/env python
"""Generate the Astral Scrim NOISE tile — the dot matrix and streak layer.

WHY THIS IS GENERATED AND NOT SUPPLIED ART
------------------------------------------
The owner's package (Aug 15 2026) carried `astral-scrim-2k-transparent.png`, a
2560x1440 elliptical vignette. Measured, it was a pure radial gradient: plateau
alpha 163 with sd 0.52, radially symmetric to within 0.73/255, 310 unique RGB
colours in 3.7M pixels. It was also not the look the owner wanted.

The look he wanted arrived as a second reference — a slab of near-black full of
horizontal data-streaks and coloured speckle, edges dissolving in blocks. That
image had NO alpha channel: its transparency checkerboard was baked into the RGB
and then resampled (checker period 16,16,16,16,21,17), so the matte could not be
recovered either. Style reference, not asset — the owner confirmed as much.

WHAT THIS FILE PRODUCES, AND WHAT IT DOES NOT
---------------------------------------------
This tile is MARKS ONLY. It carries no dark base. The darkening under the copy
is a CSS radial-gradient in css/astral-scrim.css, on its own element and its own
token, and that split is the point: the owner asked to dial noise up without
dialling darkness with it, so the two cannot share an opacity. Adding a dark
wash back into this tile would silently re-couple them.

The marks are three things:

1. A DOT MATRIX on a regular ~5px lattice — the owner's word, and regularity is
   what makes it read as a screen or a readout rather than as film grain. The
   dots are drawn OPAQUE and are thinned by the envelope below, not by being
   painted faint; a faint dot and a thinned dot look different at these sizes.
2. Horizontal streaks. The reference measured row-to-row luminance variation of
   5.48 against column-to-column 1.74 — strongly directional, and that is most
   of why it reads as data rather than texture.
3. Colour from the site's own palette (tokens.css), NOT the reference's cyan.
   The reference speckle sat at hue 180; tokens.css has no such colour, and the
   owner's call was to use the project's palette. Signal Red is in the mix at a
   deliberately tiny share — tokens.css calls it "a rare interruption: two uses
   per page is the budget", so it is seasoning here, not a colourway.

THE RAGGED DISSOLVE IS A MULTIPLICATION
---------------------------------------
There is no second mask asset and no `mask-composite`. Marks are modulated by a
COARSE, BLOCKY, HIGH-CONTRAST envelope (~24px cells) before they are written.
The CSS applies a smooth gradient mask for the edge falloff, and the product of
the two is the dissolve: thin cells fall out of sight long before dense ones, so
the layer breaks into blocks as it fades instead of dimming evenly. Flatten
either half and it becomes an ordinary vignette — the asset the owner already
turned down.

Everything is drawn with wraparound so the tile repeats seamlessly; a seam in a
layer that sits under running text is glaring once you have seen it.

Usage:
    python scripts/make-astral-scrim.py
    python scripts/make-astral-scrim.py --dot-step 4 --red 0.05 --seed 7
"""
import argparse
import numpy as np
from PIL import Image


def hex_rgb(s):
    s = s.lstrip('#')
    return tuple(int(s[i:i + 2], 16) for i in (0, 2, 4))


def tileable_noise(size, cells, rng):
    """Value noise on a periodic lattice, smoothstepped. Wraps by construction:
    the lattice index is taken modulo `cells`, so the right edge interpolates
    back into the left."""
    lat = rng.random((cells, cells))
    ys, xs = np.mgrid[0:size, 0:size].astype(np.float64)
    gx, gy = xs * cells / size, ys * cells / size
    x0, y0 = np.floor(gx).astype(int), np.floor(gy).astype(int)
    fx, fy = gx - x0, gy - y0
    sx, sy = fx * fx * (3 - 2 * fx), fy * fy * (3 - 2 * fy)
    x0m, y0m = x0 % cells, y0 % cells
    x1m, y1m = (x0 + 1) % cells, (y0 + 1) % cells
    a = lat[y0m, x0m] * (1 - sx) + lat[y0m, x1m] * sx
    b = lat[y1m, x0m] * (1 - sx) + lat[y1m, x1m] * sx
    return a * (1 - sy) + b * sy


def main():
    ap = argparse.ArgumentParser()
    # 480, not 512. The dot lattice has to divide the tile exactly or the matrix
    # steps at the wrap, and 512 only divides by powers of two — a 5px pitch
    # snapped straight to 8 and the dots came out visibly coarse. 480 takes
    # 4/5/6/8/10/12/16, so the pitch below is actually reachable.
    ap.add_argument('--size', type=int, default=480)
    ap.add_argument('--seed', type=int, default=11)
    ap.add_argument('--dot-step', type=int, default=5,
                    help='lattice pitch in px for the dot matrix')
    ap.add_argument('--red', type=float, default=0.025,
                    help='share of marks taking Signal Red. Tiny on purpose')
    ap.add_argument('--out', default='assets/scrim/astral-scrim-tile.png')
    a = ap.parse_args()

    S = a.size
    rng = np.random.default_rng(a.seed)

    # tokens.css, verbatim. Weighted so the cold blue leads, bone and white
    # carry the highlights, and red barely registers.
    PALETTE = [
        (hex_rgb('#9DB2C0'), 0.46),   # --color-moonlight
        (hex_rgb('#D6D5D0'), 0.22),   # --color-bone
        (hex_rgb('#E4E8EB'), 0.17),   # --color-white  (Spine Glow)
        (hex_rgb('#57676F'), 0.12),   # --color-gray-500, the dim end
        (hex_rgb('#7E2630'), 0.03),   # --color-crimson, replaced by --red below
    ]
    cols = np.array([c for c, _ in PALETTE], float)
    wts = np.array([w for _, w in PALETTE], float)
    wts[4] = a.red
    wts = wts / wts.sum()

    # --- the envelope: coarse, blocky, high-contrast (drives the dissolve)
    coarse = tileable_noise(S, 24, rng)
    coarse = (coarse - coarse.min()) / (np.ptp(coarse) + 1e-9)
    # Contrast BEFORE anything reads it. Interpolated value noise piles up
    # around its mean — raw it measured sd 0.219, which multiplied by a smooth
    # gradient gives a smooth fade and no raggedness at all. Pushing it toward
    # bimodal is what puts the blocks back.
    coarse = np.clip((coarse - 0.5) * 1.7 + 0.5, 0, 1)
    coarse = coarse * coarse * (3 - 2 * coarse)
    # a floor so the matrix never disappears completely mid-slab
    env = 0.30 + 0.70 * coarse

    alpha = np.zeros((S, S))
    rgb = np.zeros((S, S, 3))

    # --- 1. THE DOT MATRIX -------------------------------------------------
    # A regular lattice, jittered in presence but NOT in position: moving the
    # dots off the grid turns a readout into noise, and the grid is the thing
    # the owner asked for. S must divide by the step for the tile to wrap, so
    # the step is snapped to a divisor rather than trusted.
    step = a.dot_step
    while S % step:
        step += 1
    gy, gx = np.mgrid[0:S:step, 0:S:step]
    gy, gx = gy.ravel(), gx.ravel()
    n = gy.size
    # presence: the envelope decides which lattice sites are lit at all, so the
    # matrix thins in the same blocks the streaks do.
    live = rng.random(n) < (0.34 + 0.46 * env[gy, gx])
    gy, gx = gy[live], gx[live]
    idx = rng.choice(len(cols), size=gy.size, p=wts)
    # Opaque dots (the owner's word). Variation lives in WHICH sites are lit,
    # not in how faint each one is.
    dot_a = np.where(rng.random(gy.size) < 0.22, 1.0, 0.72)
    alpha[gy, gx] = dot_a
    rgb[gy, gx] = cols[idx]
    # a minority run 2px wide, which stops the lattice reading as a screen door
    wide = rng.random(gy.size) < 0.18
    alpha[gy[wide], (gx[wide] + 1) % S] = dot_a[wide] * 0.85
    rgb[gy[wide], (gx[wide] + 1) % S] = cols[idx[wide]]

    # --- 2. HORIZONTAL STREAKS, BROKEN INTO PHRASES -------------------------
    # Not solid runs. A line reads as a long segment, then a gap, then a few
    # dots, then another segment — the owner's description was "long line to dot
    # dot dot dot back to a long line", and that alternation is what makes it
    # scan as transmitted data rather than as a scratch. A solid dash of the
    # same length says nothing; the rhythm is the content.
    def emit(y, x, val, ci):
        xs = (np.arange(x, x + 1)) % S
        hit = val > alpha[y, xs]
        alpha[y, xs[hit]] = val
        rgb[y, xs[hit]] = cols[ci]

    for _ in range(int(S * 1.3)):
        y0 = int(rng.integers(0, S))
        cur = int(rng.integers(0, S))
        budget = int(abs(rng.normal(120, 90))) + 20
        th = 1 if rng.random() < 0.82 else 2
        val = min(1.0, abs(rng.normal(0.34, 0.24)) + 0.05) * env[y0, cur]
        ci = int(rng.choice(len(cols), p=wts))
        used = 0
        while used < budget:
            if rng.random() < 0.45:
                seg = int(rng.integers(8, 46))          # a long segment
                run = np.arange(cur, cur + seg) % S
                for dy in range(th):
                    yy = (y0 + dy) % S
                    hit = val > alpha[yy, run]
                    alpha[yy, run[hit]] = val
                    rgb[yy, run[hit]] = cols[ci]
                cur += seg
                used += seg
            else:
                for _d in range(int(rng.integers(2, 7))):   # dot dot dot dot
                    for dy in range(th):
                        emit((y0 + dy) % S, cur, val, ci)
                    gap = int(rng.integers(2, 5))
                    cur += gap
                    used += gap
            gap = int(rng.integers(3, 11))              # the breath between
            cur += gap
            used += gap

    # --- 3. a faint sub-grain so the gaps are not perfectly empty -----------
    fine = tileable_noise(S, 128, rng)
    grain = np.clip((fine - 0.62) * 2.4, 0, 1) * 0.18 * env
    take = grain > alpha
    alpha[take] = grain[take]
    rgb[take] = cols[3]

    out = np.dstack([rgb, alpha * 255]).astype(np.uint8)
    Image.fromarray(out, 'RGBA').save(a.out)
    lit = (alpha > 0.02).mean()
    print('wrote %s  %dx%d  step %dpx  lit %.1f%%  alpha mean %.3f sd %.3f  red %.1f%%'
          % (a.out, S, S, step, 100 * lit, alpha.mean(), alpha.std(), 100 * a.red))


if __name__ == '__main__':
    main()
