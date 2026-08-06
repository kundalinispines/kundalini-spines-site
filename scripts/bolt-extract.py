# bolt-extract.py — turn a "sky + painted filaments" candidate into a
# filament-only delta asset, the HANDOFF 14 pipeline, recreated so variants
# v2/v3 (HANDOFF 16) are built by the same machine that built v1.
#
# Usage:  python3 scripts/bolt-extract.py <candidate.png> <out-stem>
#         -> assets/hero/<out-stem>-4k.webp (3840x2144)
#         -> assets/hero/<out-stem>.webp    (1920x1072, half size)
#
# The pipeline, per HANDOFF 14 "as built":
#   1. Register the candidate to assets/hero/starfield-deep-4k.webp
#      (nano banana edits preserve framing, so expect ~identity — but MEASURE
#      it, do not assume it: v1's target was scale 0.60650 offset (28,326)).
#   2. Robust per-channel photometric fit sky -> candidate (the model applies
#      a small grade; fit a*sky+b on the darker 80% so filaments don't bias).
#   3. Subtract the fitted sky. What remains is filaments + star residuals +
#      grade noise.
#   4. Discriminate filaments from star residuals by BLUENESS: filaments are
#      cold (B>R), star residuals are warm-to-neutral. Keep cold pixels.
#   5. Keep only connected components with bbox diagonal >= 25 px — dust
#      specks and single-star residuals go, filament runs stay.
#   6. Multiply by cloud-mask.webp alpha so the asset is PRE-CONTAINED: it
#      cannot leak light outside the nebula whatever the opacity does.
#      6b. ...then by the VISIBLE glow (blurred sky luminance, squared ramp
#      45->85) so filaments live strictly in the WHITE cloud mass, the way
#      the owner's reference paints them — the mask alone is a band far
#      wider than the clouds the viewer sees, and two looser ramps each
#      still read wrong on real hardware (long note at 6b).
#      6c. ...then drop the faint orphan stubs the weighting leaves behind.
#   7. Report the same numbers HANDOFF 14 reported (exact black %, residual
#      floor, %frame over thresholds, mean add at flash 0.35) — compare
#      against v1's: 96.72% black, floor 0/0/0, 3.14% > 0.5.
#
# Positive-delta only (screen layer): negatives are clipped, never crushed —
# there is nothing to crush if step 3 leaves the floor at true 0.

import sys, numpy as np, cv2
from PIL import Image

SKY = 'assets/hero/starfield-deep-4k.webp'
MASK = 'assets/hero/cloud-mask.webp'
W, H = 3840, 2144

def load(p, size=None):
    im = Image.open(p).convert('RGB')
    a = np.asarray(im).astype(np.float64)
    if size and (im.size != size):
        a = cv2.resize(a, size, interpolation=cv2.INTER_AREA if im.size[0] > size[0] else cv2.INTER_LINEAR)
    return a

def main(cand_path, stem):
    sky = load(SKY)
    cand = load(cand_path, (W, H))

    # -- 1. registration check (translation only via phase correlation on
    #       the high-passed luminance; nano banana holds scale, but verify) --
    gs = cv2.cvtColor(sky.astype(np.float32), cv2.COLOR_RGB2GRAY)
    gc = cv2.cvtColor(cand.astype(np.float32), cv2.COLOR_RGB2GRAY)
    hp = lambda g: g - cv2.GaussianBlur(g, (0, 0), 8)
    (dx, dy), resp = cv2.phaseCorrelate(hp(gs), hp(gc))
    print(f'registration: shift ({dx:+.2f}, {dy:+.2f}) px, response {resp:.3f}')
    if abs(dx) > 2 or abs(dy) > 2:
        M = np.float32([[1, 0, -dx], [0, 1, -dy]])
        cand = cv2.warpAffine(cand, M, (W, H), flags=cv2.INTER_LINEAR)
        print('  -> candidate shifted back to the sky frame')

    # -- 2. robust per-channel photometric fit on the darker 80% ------------
    lum = gs
    sel = lum < np.percentile(lum, 80)
    fit = np.empty_like(sky)
    for c in range(3):
        x, y = sky[..., c][sel], cand[..., c][sel]
        a, b = np.polyfit(x, y, 1)
        fit[..., c] = a * sky[..., c] + b
        print(f'  channel {c}: cand = {a:.4f} * sky + {b:+.2f}')

    # -- 3. subtract ---------------------------------------------------------
    delta = np.clip(cand - fit, 0, 255)

    # -- 4. hue gate, SIZE-AWARE. Plain "delete warm pixels" is the v1 rule
    #    and it is right for what it was built for — star residuals are
    #    warm, filaments are cold — but it silently DELETED the main bolt of
    #    _hf-wing.png: that candidate paints its primary core warm cream
    #    (raw delta 122 on the core line), the gate zeroed it, and the
    #    survivor cold halo read as lightning with a black crack down the
    #    middle. Two sessions of "hollow-core fill" machinery got built for
    #    what a stage-by-stage probe finally showed was never a hollow core
    #    at all (the probe: mean-on-line 122.8 before the gate, 49.7 after —
    #    stage 3b's crack mask covered 0.3% of the loss). The fix: a warm
    #    SPECK is a star residual — delete it, same as v1. A warm pixel
    #    inside a BOLT-SIZED structure (bbox diagonal >= 25px, the same
    #    threshold step 5 uses for filaments) is painted core — keep its
    #    luminance, RECOLOR it to the filament cold (0.72, 0.82, 1.0):
    #    the strike must be the nebula's own blue (hue 211.6-213.5,
    #    HANDOFF 14) whatever color the generator chose. --
    cold = (delta[..., 2] + 2 >= delta[..., 0])
    warm_on = ((~cold) & (delta.max(-1) > 8)).astype(np.uint8)
    nw, labw, statw, _ = cv2.connectedComponentsWithStats(warm_on, 8)
    bigw = np.zeros(nw, bool)
    for i in range(1, nw):
        w, h = statw[i, cv2.CC_STAT_WIDTH], statw[i, cv2.CC_STAT_HEIGHT]
        bigw[i] = (w * w + h * h) >= 25 * 25
    speck = (~cold) & ~bigw[labw]
    delta[speck] = 0
    recolor = (~cold) & bigw[labw]
    lum = delta.max(-1)
    for c, f in enumerate((0.72, 0.82, 1.0)):
        delta[..., c][recolor] = lum[recolor] * f
    print(f'hue gate: {int(speck.sum())} warm speck px deleted, '
          f'{int(recolor.sum())} bolt-core px recolored cold')

    # -- 5. connected components, bbox diagonal >= 25 px ---------------------
    on = (delta.max(-1) > 8).astype(np.uint8)
    n, lab, stats, _ = cv2.connectedComponentsWithStats(on, 8)
    keep = np.zeros(n, bool)
    for i in range(1, n):
        w, h = stats[i, cv2.CC_STAT_WIDTH], stats[i, cv2.CC_STAT_HEIGHT]
        keep[i] = (w * w + h * h) >= 25 * 25
    delta[~keep[lab]] = 0
    print(f'components: {n-1} found, {int(keep.sum())} kept (diag >= 25px)')

    # -- 6. pre-contain with the cloud mask ----------------------------------
    m = np.asarray(Image.open(MASK))[:, :, 3].astype(np.float64) / 255.0
    m = cv2.resize(m, (W, H), interpolation=cv2.INTER_LINEAR)
    delta *= m[..., None]

    # -- 6b. contain to the VISIBLE glow, not just the mask. The mask alpha
    #    is a broad diagonal band (0.84 well past the bright clouds); the
    #    clouds the viewer actually SEES are much tighter inside it. The
    #    first build of variants b/c stopped at step 6 and the owner called
    #    it on real hardware immediately: strikes over mask-covered-but-
    #    faint sky read as lightning OUTSIDE the clouds. Measured, his eye
    #    was exact: v1's filaments sit at filament-weighted local glow 72.9
    #    (25th pct 59); the first b sat at 54.8 (p25 38) and the first c at
    #    48.5 (p25 30). The weight: blurred sky luminance (sigma 30, so
    #    stars wash out and cloud mass remains) through a squared soft ramp,
    #    zero below 35, full above 70 — filaments live only in the BRIGHT
    #    WHITE cloud mass and fade as it fades, the way a discharge lighting
    #    the cloud from beneath must.
    #
    #    THE RAMP WAS TIGHTENED TWICE BY THE OWNER'S EYE, and each failed
    #    metric is recorded so it is not retried. (1) 20->50 gamma 1 was
    #    chosen so v1 retained 0.994 — measuring the wrong thing: v1 kept
    #    its energy because v1 was ALREADY in the bright clouds, while b/c
    #    kept riding the nebula's dim top edge ("running over the whole top
    #    of the nebula"). (2) 35->70 gamma 2 matched v1's filament-weighted
    #    glow DISTRIBUTION (72.9 mean / 59.1 p25) exactly — and still read
    #    wrong, because the metric is blind to GEOMETRY: b was one unbroken
    #    2000px run through mid-brightness cloud, where v1 is short dense
    #    bursts dying inside the white cores. Contrast was measured and is
    #    NOT the difference (b/c sit at delta/glow p50 0.28-0.33 vs v1's
    #    0.68 — softer than v1, not hotter). What matches the owner's
    #    reference (reference/nebula-with-lightning-target.png: veins
    #    threading the bright cores, every tip dying inside the glow) is
    #    living strictly in the WHITE cloud mass: 45->85 gamma 2, keeping
    #    ~0.31 of b and ~0.27 of c. A long run then survives only as
    #    separate strands in separate clumps — which is the look. --
    glow = cv2.GaussianBlur(sky.max(-1), (0, 0), 30)
    delta *= (np.clip((glow - 45.0) / 40.0, 0, 1) ** 2)[..., None]

    # -- 6c. orphan cleanup, AFTER the weighting: the ramp leaves behind
    #    faint disconnected stubs in mid-cloud (fragments of runs that lost
    #    their bright middle), and a stub too dim to read as lightning reads
    #    as noise. Drop components under 25px bbox diagonal or peaking
    #    under 20. --
    on = (delta.max(-1) > 4).astype(np.uint8)
    n3, lab3, st3, _ = cv2.connectedComponentsWithStats(on, 8)
    keep3 = np.zeros(n3, bool)
    for i in range(1, n3):
        w3, h3 = st3[i, cv2.CC_STAT_WIDTH], st3[i, cv2.CC_STAT_HEIGHT]
        if w3 * w3 + h3 * h3 >= 25 * 25:
            y3, x3 = st3[i, cv2.CC_STAT_TOP], st3[i, cv2.CC_STAT_LEFT]
            keep3[i] = delta[y3:y3 + h3, x3:x3 + w3].max() >= 20
    delta[~keep3[lab3]] = 0
    print(f'post-weight cleanup: {int(n3 - 1 - keep3.sum())} orphan fragments dropped')

    # -- 7. measure, in HANDOFF 14's terms ------------------------------------
    q = np.rint(delta).astype(np.uint8)
    g = q.max(-1)
    print(f'exact black          {(g == 0).mean()*100:.2f}%')
    nz = q.reshape(-1, 3)
    print(f'residual floor       ' + ' / '.join(
        f'{np.min(q[..., c][q[..., c] > 0]) - 1 if (q[..., c] > 0).any() else 0:.3f}' for c in range(3)))
    print(f'mean luminance       {g.mean():.3f}')
    for t in (0.5, 2, 8):
        print(f'%frame > {t:<4}        {(g > t).mean()*100:.2f}')
    print(f'adds at flash 0.35   {g.mean()*0.35:.3f} /255 mean')

    # -- encode: 4k + half, same convention as v1 -----------------------------
    out4k = f'assets/hero/{stem}-4k.webp'
    out1k = f'assets/hero/{stem}.webp'
    Image.fromarray(q).save(out4k, quality=90, method=6)
    half = cv2.resize(q, (W // 2, H // 2), interpolation=cv2.INTER_AREA)
    Image.fromarray(half).save(out1k, quality=90, method=6)
    import os
    print(f'{out4k}  {os.path.getsize(out4k)/1024:.0f} KB')
    print(f'{out1k}  {os.path.getsize(out1k)/1024:.0f} KB')

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
