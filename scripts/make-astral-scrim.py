#!/usr/bin/env python
"""Generate the Astral Scrim texture tile.

WHY THIS IS GENERATED AND NOT SUPPLIED ART
------------------------------------------
The owner's package (Aug 15 2026) carried `astral-scrim-2k-transparent.png`, a
2560x1440 elliptical vignette. Measured, it was a pure radial gradient: plateau
alpha 163 with sd 0.52, radially symmetric to within 0.73/255, 310 unique RGB
colours in 3.7M pixels. It also was not the look the owner wanted.

The look the owner DID want arrived as a second reference image — a hard-edged
slab of near-black full of horizontal data-streaks and coloured speckle, edges
dissolving in blocks. That image had NO alpha channel: the transparency
checkerboard was baked into its RGB pixels, and it had been resampled after
baking (checker period ran 16,16,16,16,21,17), so the alpha could not be
recovered either. It was a style reference, not an asset — the owner confirmed
as much.

So the texture is built here instead. That buys three things a supplied slab
could not: it TILES (so two scrims of different heights are the same material
rather than the same picture stretched two ways), it carries real alpha, and it
is reproducible — change a flag, re-run, commit the new tile.

HOW THE RAGGED DISSOLVE WORKS — the important part
--------------------------------------------------
There is no second mask asset and no `mask-composite`. The tile's own alpha is
COARSE, BLOCKY and HIGH-CONTRAST (0.34..1.0 in ~24px cells). The CSS applies a
smooth gradient mask for the edge falloff, and the multiplication of the two is
what produces the dissolve: where the gradient is at a tenth a 0.34 cell lands
at 0.034 and vanishes while a 1.0 cell lands at 0.1 and hangs on. That reads as
blocks breaking apart, which is the reference's edge.

Do not "clean up" the tile's alpha to a flat value. A flat tile multiplied by a
smooth gradient gives a smooth fade, and the whole ragged quality — the entire
reason this look was chosen over the ellipse — disappears. The mottling visible
in the middle of the slab is the same variation doing its other job.

Everything is drawn with wraparound so the tile repeats seamlessly; a seam in a
layer that sits under running text is glaring once you have seen it.

Usage:
    python scripts/make-astral-scrim.py
    python scripts/make-astral-scrim.py --speck "#9DB2C0" --seed 7
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
    ap.add_argument('--size', type=int, default=512)
    ap.add_argument('--seed', type=int, default=11)
    # Moonlight (--color-moonlight) by default. The owner's reference used a
    # true cyan (hue 180); tokens.css has no such colour, and the owner's call
    # was to use the project's palette, so the marks are the site's cold blue.
    ap.add_argument('--speck', default='#9DB2C0')
    ap.add_argument('--ink', default='#03040F')       # --color-black
    ap.add_argument('--streak', default='#93A6B2')    # bright end of the marks
    ap.add_argument('--out', default='assets/scrim/astral-scrim-tile.png')
    a = ap.parse_args()

    S = a.size
    rng = np.random.default_rng(a.seed)
    ink, speck, streak = hex_rgb(a.ink), hex_rgb(a.speck), hex_rgb(a.streak)

    # --- alpha: coarse blocky field (the dissolve engine, see module docstring)
    coarse = tileable_noise(S, 24, rng)
    # np.ptp(), not coarse.ptp() — numpy 2 removed the ndarray method.
    coarse = (coarse - coarse.min()) / (np.ptp(coarse) + 1e-9)
    # CONTRAST FIRST, and this step is the dissolve. Interpolated value noise
    # piles up around its mean — raw, this field measured sd 0.219 and the
    # alpha built from it only 0.173, which multiplied by a smooth gradient
    # gives a smooth fade and no raggedness at all. Pushing it toward bimodal
    # before the alpha mapping is what puts the blocks back: measured across
    # k = 1.0/1.6/2.2/2.8 the alpha sd runs 0.225/0.293/0.325/0.344. 1.6 is the
    # chosen middle — at 2.2 and beyond a third of the tile is under 0.3 alpha
    # and the slab starts reading as holes rather than as weathering.
    coarse = np.clip((coarse - 0.5) * 1.6 + 0.5, 0, 1)
    coarse = coarse * coarse * (3 - 2 * coarse)
    # FLOOR 0.34, not 0.18. At 0.18 the slab averaged too thin to read as a
    # surface: on the page the bright marks were the only thing visible and the
    # darkening — the entire job of the layer — did not land. The floor sets how
    # solid the body is; the SPREAD above it is what still breaks the edge into
    # blocks when the gradient multiplies it down. 0.34..1.0 keeps a 3:1 ratio,
    # which is enough to chunk the dissolve while giving the middle something to
    # actually be.
    alpha = 0.34 + 0.66 * (coarse ** 0.85)
    # a finer break-up so the blocks are not obviously square
    alpha *= 0.82 + 0.18 * tileable_noise(S, 96, rng)

    rgb = np.zeros((S, S, 3), np.float64)
    rgb[:] = ink
    mark = np.zeros((S, S))          # 0..1 how "lit" a pixel is
    speckle = np.zeros((S, S))       # separate, so specks can take their own hue

    # --- horizontal streaks: the reference measured row-to-row variation of
    # 5.48 against column-to-column 1.74, i.e. strongly directional. Dashes are
    # drawn with wraparound in x.
    # Density is deliberately below the reference's: the reference is a title
    # card carrying two lines of type, and the same density behind four
    # paragraphs fights the words (owner's call — "sparser to start"). Raise
    # this count to go louder; --scrim-ink in the CSS dims it without changing
    # the grain, and that is the knob to reach for first.
    for _ in range(int(S * 0.85)):
        y = rng.integers(0, S)
        x = rng.integers(0, S)
        ln = int(abs(rng.normal(38, 34))) + 3
        th = 1 if rng.random() < 0.78 else 2
        # Dimmer than the first cut (0.42/0.30). The marks are seasoning, not
        # the dish — bright enough and they out-shout the darkening they are
        # supposed to be sitting in, which is exactly how the first render read
        # on the real nebula.
        val = min(1.0, abs(rng.normal(0.24, 0.19)) + 0.03)
        xs = (np.arange(x, x + ln)) % S
        for dy in range(th):
            yy = (y + dy) % S
            mark[yy, xs] = np.maximum(mark[yy, xs], val)

    # --- speckle: short 1-2px marks, denser than the streaks, carrying the
    # accent hue. This is what reads as "data" rather than "scratches".
    n = int(S * S * 0.0026)
    sy = rng.integers(0, S, n)
    sx = rng.integers(0, S, n)
    sv = np.clip(np.abs(rng.normal(0.30, 0.22, n)) + 0.05, 0, 1)
    speckle[sy, sx] = sv
    ext = rng.random(n) < 0.34          # a third of them run 2px wide
    speckle[sy[ext], (sx[ext] + 1) % S] = sv[ext]

    # compose colour: ink -> streak for the grey dashes, ink -> speck for the
    # accent marks. Specks win where they overlap, which keeps the hue readable.
    for c in range(3):
        rgb[:, :, c] = ink[c] + (streak[c] - ink[c]) * mark
        rgb[:, :, c] = np.where(speckle > 0,
                                ink[c] + (speck[c] - ink[c]) * speckle,
                                rgb[:, :, c])

    # The marks lift alpha where they land — otherwise a bright dash sitting in
    # a low-alpha cell is drawn and then thrown away — but they are lifted
    # THROUGH the same coarse envelope, not around it, so the blocks thin the
    # streaks too. The 0.4 floor stops them vanishing entirely in the thinnest
    # blocks. (This was once blamed for flattening the dissolve; it was not the
    # cause — the noise field's own contrast was, see above.)
    env = 0.4 + 0.6 * coarse
    alpha = np.clip(np.maximum(alpha, np.maximum(mark, speckle) * 0.92 * env), 0, 1)

    out = np.dstack([rgb, alpha * 255]).astype(np.uint8)
    im = Image.fromarray(out, 'RGBA')
    im.save(a.out)
    print('wrote %s  %dx%d  alpha mean %.3f sd %.3f' %
          (a.out, S, S, alpha.mean(), alpha.std()))


if __name__ == '__main__':
    main()
