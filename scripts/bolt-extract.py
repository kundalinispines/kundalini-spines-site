# bolt-extract.py — turn a "sky + painted filaments" candidate into a
# filament-only delta asset, the HANDOFF 14 pipeline, recreated so variants
# v2/v3 (HANDOFF 16) are built by the same machine that built v1.
#
# Usage:  python3 scripts/bolt-extract.py <candidate.png> <out-stem>
#         -> assets/hero/<out-stem>-4k.webp (3840x2144)
#         -> assets/hero/<out-stem>.webp    (1920x1072, half size)
#
# TWO MODES since the session after HANDOFF 16, dispatched on candidate size:
#   3840x2144 (or near)  -> main(), the generated-candidate path below,
#                           unchanged from HANDOFF 16.
#   1948x807             -> main_ref(), the REFERENCE-FRAME path at the end
#                           of this file: the owner's own target frames
#                           (reference/nebula-with-lightning-target-*.png)
#                           become patterns directly. Read its header before
#                           touching either path — the two differ for
#                           measured reasons, not by preference.
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


# ============================================================================
# REFERENCE-FRAME MODE — patterns d/e/f, built from the owner's own frames.
#
# The frames (reference/nebula-with-lightning-target-2/3/4.png, 1948x807) are
# NOT crops of our sky the way the original target was. Measured before
# anything was built: the original target matches the sky at fine (star)
# scale — band NCC 0.63 — which is why v1's exact subtraction worked. The
# three new frames match at coarse (cloud-mass) scale only: fine NCC -0.03,
# +0.09, 0.00 against the sky at their best warps; they are re-renders (video
# frames) of the scene, with their own stars and their own cloud texture.
# Exact subtraction therefore leaves the RENDER DIFFERENCE, not the
# lightning: warm star residuals everywhere plus broad cold texture mismatch
# that no hue gate can separate from glow. Three dead ends are recorded here
# so they are not retried:
#   (1) subtract + hue/size gates alone (the v1 recipe verbatim): the delta
#       reads as a brighter COPY of the clouds, not as strikes — the kept
#       light is mostly grade difference.  (2) vein-seeded KEEP with a wide
#       halo (sigma 24): near dense vein fields the halo union covers whole
#       cloud patches, and the warm-core recolor then keeps their wash —
#       reads as cloud brightening with jagged hue-gate edges. (3) a linear
#       delta asset (ref - fit): the layer composites with mix-blend-mode
#       SCREEN, which is sub-additive over a lit background — the same delta
#       that reproduces the reference under addition reads at roughly half
#       strength under screen. v1 never hit this because its painted bolts
#       saturated over dark lanes (asset peak 255); the frames' veins sit on
#       bright cloud. The asset must be the SCREEN-INVERSE,
#       q = 255*(ref-fit)/(255-fit), which reproduces the reference exactly
#       at opacity 1 by construction.
#
# What ships is the vein network and only the vein network:
#   veins = q - localMedian(q, 31px). The median kills every broad field —
#   grade mismatch AND the reference's own cloud illumination — and keeps
#   thin bright structure, which is what v1's approved look actually is
#   (veins + knots; on a strike the sky's own clouds light through the
#   screen blend, so broad illumination comes free at composite time). A
#   small synthesized halo (0.9*gauss sigma5 + 0.5*gauss sigma14) restores
#   the discharge glow the median takes with it. Everything is recolored to
#   the filament cold (0.72/0.82/1.0) at its own luminance — same rule and
#   same constant as the generated path's step 4, for the same reason: the
#   strike must be the nebula's own blue whatever the source painted. Small
#   mostly-warm components die as star residuals (the frames' own stars);
#   bolt-sized structure keeps its warm cores, recolored.
#
# CONTAINMENT IS GENTLER HERE, AND THAT IS A STATED DECISION: 25->60 gamma 1
# on the blurred-sky glow, not the generated path's 45->85 gamma 2. The
# shipped ramp exists to corral GENERATOR-INVENTED geometry that ran over
# faint sky (HANDOFF 16's containment story). These frames' geometry is the
# owner's own reference — the thing the ramp calibrates AGAINST — so the
# ramp's only job in this mode is killing subtraction noise on dark sky.
# 45->85 g2 measured against the frames crushes exactly what they add
# (-2's left-core crackle fell to 0.22% of frame lit, near-invisible; -4's
# arm emphasis died). Calibration remains the owner's eye on real hardware,
# per HANDOFF 16's closing line; if his eye says a pattern leaks, tighten
# THIS mode's ramp and rebuild — do not touch the generated path's.
#
# Registration: v1's constants (scale 0.60650, offset (28,326)) put each
# frame within ~10px; a per-frame ECC affine refinement on mid-band
# luminance closes the rest (cc 0.89-0.91 on all three frames; the affine
# terms are ~1% scale + subpixel shear, real frame drift, not noise).
# The gain is normalized so vein-core p99.7 -> 245 (v1's cores reach 255;
# an asset dimmer than its siblings would push the owner at the shared
# `bolt b` slider, which HANDOFF 16 forbids as a per-pattern lever).
# ============================================================================

REF_W, REF_H = 1948, 807
REF_SCALE, REF_OX, REF_OY = 0.60650, 28, 326   # HANDOFF 14, re-measured this session
COLD = (0.72, 0.82, 1.0)

def main_ref(cand_path, stem):
    sky = load(SKY)
    ref = load(cand_path)
    if ref.shape[:2] != (REF_H, REF_W):
        raise SystemExit(f'reference-frame mode expects {REF_W}x{REF_H}, got {ref.shape[1]}x{ref.shape[0]}')

    # -- 1. registration: v1 constants, then ECC affine refinement ----------
    sw, sh = round(W * REF_SCALE), round(H * REF_SCALE)
    sky_s = cv2.resize(sky, (sw, sh), interpolation=cv2.INTER_AREA)
    crop = sky_s[REF_OY:REF_OY + REF_H, REF_OX:REF_OX + REF_W]
    gray = lambda a: cv2.cvtColor(a.astype(np.float32), cv2.COLOR_RGB2GRAY)
    mid = lambda g: cv2.GaussianBlur(g, (0, 0), 2) - cv2.GaussianBlur(g, (0, 0), 20)
    warp = np.eye(2, 3, dtype=np.float32)
    cc, warp = cv2.findTransformECC(mid(gray(ref)), mid(gray(crop)), warp, cv2.MOTION_AFFINE,
        (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 200, 1e-7), None, 5)
    print(f'registration: ECC cc {cc:.4f} (expect ~0.9; below 0.8, stop and look)')
    bg = np.stack([cv2.warpAffine(crop[..., c], warp, (REF_W, REF_H),
                   flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REPLICATE)
                   for c in range(3)], -1)

    # -- 2. photometric fit, darker 80%, same as the generated path ---------
    gbg = gray(bg)
    sel = gbg < np.percentile(gbg, 80)
    fit = np.empty_like(bg)
    for c in range(3):
        a, b = np.polyfit(bg[..., c][sel], ref[..., c][sel], 1)
        fit[..., c] = np.clip(a * bg[..., c] + b, 0, 254)
        print(f'  channel {c}: ref = {a:.4f} * sky + {b:+.2f}')

    # -- 3. SCREEN-INVERSE delta (dead end 3 above) --------------------------
    lin = np.clip(ref - fit, 0, 255)
    q = np.clip(255.0 * lin / (255.0 - fit), 0, 255)
    g = q.max(-1)

    # -- 4. vein isolation: kill every broad field (dead ends 1 and 2) ------
    med = cv2.medianBlur(np.clip(g, 0, 255).astype(np.uint8), 31).astype(np.float64)
    v = np.clip(g - med, 0, 255)

    # -- 4b. star-residual cull, hue rule at component scale: a small
    #    mostly-warm component is one of the frame's own stars; bolt-sized
    #    structure keeps warm cores (they are painted core, recolored below —
    #    the generated path's step 4 lesson at vein scale). --
    vm = (v > 26).astype(np.uint8)
    cold_px = (lin[..., 2] + 2 >= lin[..., 0])
    n, lab, st, _ = cv2.connectedComponentsWithStats(vm, 8)
    culled = 0
    for i in range(1, n):
        w, h = st[i, cv2.CC_STAT_WIDTH], st[i, cv2.CC_STAT_HEIGHT]
        if w * w + h * h < 22 * 22:
            m = lab == i
            if cold_px[m].mean() < 0.6:
                vm[m] = 0; culled += 1
    v = v * vm
    print(f'vein isolation: {culled} warm speck components culled')

    # -- 5. synthesized discharge halo + cold recolor ------------------------
    #    (gain normalization happens AFTER the 4K warp, step 6b — the 1.65x
    #    upscale spreads 1-2px vein cores and eats ~20% of their peak, so
    #    normalizing here would ship dim cores no matter what this step does)
    halo = cv2.GaussianBlur(v, (0, 0), 5) * 0.9 + cv2.GaussianBlur(v, (0, 0), 14) * 0.5
    lum = np.clip(v + halo, 0, 255)
    out = np.stack([lum * f for f in COLD], -1)

    # -- 6. into the sky frame, then the generated path's gates -------------
    A = np.vstack([warp, [0, 0, 1]])
    T = np.array([[1, 0, REF_OX], [0, 1, REF_OY], [0, 0, 1]], float)
    S = np.array([[1 / REF_SCALE, 0, 0], [0, 1 / REF_SCALE, 0], [0, 0, 1]], float)
    M = (S @ T @ A)[:2].astype(np.float32)
    big = cv2.warpAffine(out, M, (W, H), flags=cv2.INTER_LINEAR, borderValue=0)

    on = (big.max(-1) > 8).astype(np.uint8)
    n2, lab2, st2, _ = cv2.connectedComponentsWithStats(on, 8)
    keep = np.zeros(n2, bool)
    for i in range(1, n2):
        w, h = st2[i, cv2.CC_STAT_WIDTH], st2[i, cv2.CC_STAT_HEIGHT]
        keep[i] = (w * w + h * h) >= 25 * 25
    big[~keep[lab2]] = 0

    m = np.asarray(Image.open(MASK))[:, :, 3].astype(np.float64) / 255.0
    m = cv2.resize(m, (W, H), interpolation=cv2.INTER_LINEAR)
    big *= m[..., None]

    # reference-mode ramp — see the header for why this is NOT 45->85 g2
    glow = cv2.GaussianBlur(sky.max(-1), (0, 0), 30)
    big *= np.clip((glow - 25.0) / 35.0, 0, 1)[..., None]

    on = (big.max(-1) > 4).astype(np.uint8)
    n3, lab3, st3, _ = cv2.connectedComponentsWithStats(on, 8)
    keep3 = np.zeros(n3, bool)
    for i in range(1, n3):
        w3, h3 = st3[i, cv2.CC_STAT_WIDTH], st3[i, cv2.CC_STAT_HEIGHT]
        if w3 * w3 + h3 * h3 >= 25 * 25:
            y3, x3 = st3[i, cv2.CC_STAT_TOP], st3[i, cv2.CC_STAT_LEFT]
            keep3[i] = big[y3:y3 + h3, x3:x3 + w3].max() >= 20
    big[~keep3[lab3]] = 0

    # -- 6b. gain, at final resolution and after containment: vein-core
    #    p99.7 -> 245 (v1's cores reach 255; a pattern dimmer than its
    #    siblings would push the owner at the shared `bolt b` slider, which
    #    HANDOFF 16 forbids as a per-pattern lever). --
    bg8 = big.max(-1)
    p = np.percentile(bg8[bg8 > 8], 99.7) if (bg8 > 8).any() else 245.0
    gain = min(245.0 / max(p, 1.0), 2.5)
    big = np.clip(big * gain, 0, 255)
    print(f'gain: x{gain:.2f} (vein-core p99.7 -> 245, post-warp)')

    # -- 7. measure + encode, identical to the generated path ---------------
    q8 = np.rint(np.clip(big, 0, 255)).astype(np.uint8)
    g8 = q8.max(-1)
    print(f'exact black          {(g8 == 0).mean()*100:.2f}%')
    print(f'residual floor       ' + ' / '.join(
        f'{np.min(q8[..., c][q8[..., c] > 0]) - 1 if (q8[..., c] > 0).any() else 0:.3f}' for c in range(3)))
    print(f'mean luminance       {g8.mean():.3f}')
    for t in (0.5, 2, 8):
        print(f'%frame > {t:<4}        {(g8 > t).mean()*100:.2f}')
    print(f'adds at flash 0.35   {g8.mean()*0.35:.3f} /255 mean')
    out4k = f'assets/hero/{stem}-4k.webp'
    out1k = f'assets/hero/{stem}.webp'
    Image.fromarray(q8).save(out4k, quality=90, method=6)
    half = cv2.resize(q8, (W // 2, H // 2), interpolation=cv2.INTER_AREA)
    Image.fromarray(half).save(out1k, quality=90, method=6)
    import os
    print(f'{out4k}  {os.path.getsize(out4k)/1024:.0f} KB')
    print(f'{out1k}  {os.path.getsize(out1k)/1024:.0f} KB')

if __name__ == '__main__':
    _im = Image.open(sys.argv[1])
    if _im.size == (REF_W, REF_H):
        main_ref(sys.argv[1], sys.argv[2])
    else:
        main(sys.argv[1], sys.argv[2])
