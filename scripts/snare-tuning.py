#!/usr/bin/env python3
"""
Where the SNARE detector's numbers came from. Companion to kick-tuning.py,
which owns the kick reference and the story of why these harnesses exist.

  REQUIRES  ffmpeg on PATH, numpy, scipy.  Run from the repo root.
  PRINTS    per-track hit counts and phase concentration for the shipped
            detector, the naive gate's failure for comparison, then the sweep
            the defaults were chosen from.

HANDOFF 13 measured the feasibility on 8 samples and stopped, on purpose:
"finish proving it in Python against all 28 samples first, then write browser
code. The failure mode is spending a session on the JS and discovering at the
end that it fires on hats." This file is that proof, and the snare code in
js/spine-bg.js was written after it ran, mirroring exactly what is here.

THE PROOF CAUGHT EXACTLY THAT FAILURE, so keep the negative result: the first
implementation read HANDOFF 13's "2 kHz noise rising AND 200 Hz body rising
together" as a frame-delta check — body RMS higher than last frame. A frame
delta is positive about half the time regardless of what the drums are doing,
so the "gate" passed nearly everything: 26 accepted onsets per 20s against
~22 kicks, phase concentration 0.30, 1 of 28 tracks above 0.5. In JS that
would have shipped as lightning striking on hats and vocals and read as "the
detector is jittery", which is a much harder bug to see than "it does not
work". The gate has to be a COINCIDENCE OF ONSETS, not of derivatives.

THE SHIPPED DESIGN:
  - 2.5 kHz HIGHPASS x3 (Q 1.0) -> RMS: the snare's noise burst. HANDOFF 13's
    reasoning for a high band stands: the obvious 150-400 Hz "snare body" band
    cross-triggers with the kick 27% of the time, the noise band 2.7%.
  - A 200 Hz BANDPASS -> RMS runs its own full onset machine (same base/peak/
    floor/rising/armed shape as the kick's). A high-band onset counts only if
    the body band produced its own onset within the last 45 ms — a snare is
    the one thing in these mixes that hits both bands at once. Hats and
    sibilance have no body; bass notes have no noise.
  - SYMMETRIC 45 ms KICK VETO, via deferral: an accepted candidate is held
    PENDING for 45 ms and cancelled if the kick machine fires while it waits.
    One-sided veto is not enough — the kick's own beater click crosses 2.5 kHz
    a few ms BEFORE the low band's RMS trips, so "no kick in the last 45 ms"
    still fires on the kick itself. The cost is a 45 ms (~3 frame) delay on
    the flash, well under the ~100 ms window where audio-visual sync reads as
    simultaneous; the win measured +0.02-0.05 concentration on most configs
    and it removes a failure mode rather than a tuning miss.

MEASURED, all 28 samples, shipped config (hz 2500, sens 2.2, body 1.5):
    mean concentration 0.66   worst track 0.42   >=0.5 on 25 of 28
    hits per 20s: mean 9, range 3-15, against 16-31 reference kicks
    naive delta-gate at the same sens:  concentration 0.42, hits 18/20s,
    >=0.5 on 9 of 28 — and at the 1.6 sens first tried, 0.30 and 26/20s
    HANDOFF 13's offline figure on its 8-track subset: 0.63, all >=0.5
The three tracks under 0.5 — extra-zoom 0.42, kabal 0.44, may-26th 0.44 —
are the busiest percussion on the record; their hits still land musically,
just at two places in the bar rather than one.

WHAT CONCENTRATION DOES AND DOES NOT PROVE — copied from HANDOFF 13 so it is
not lost: it measures CONSISTENCY, not correctness. A detector reliably firing
on a backbeat hi-hat would score identically. There is no hand-labelled snare
ground truth (the kick reference in kick-tuning.py has no snare equivalent),
so these numbers say "it fires at one stable place in the bar on every track",
and the owner's ear says whether that place is the snare. Phase is measured
against the REFERENCE kicks, which are independent of both detectors.
"""
import glob
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from importlib.machinery import SourceFileLoader

_kick = SourceFileLoader(
    "kick_tuning",
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "kick-tuning.py"),
).load_module()

SR, FPS, DT = _kick.SR, _kick.FPS, _kick.DT

# --- these must mirror js/spine-bg.js ---
SNARE_HZ = 2500.0        # --snare-freq, highpass cutoff of the noise band
SNARE_SENS = 2.2         # --snare-sens
BODY_HZ = 200.0          # fixed in JS, not a slider: the body corroborator
BODY_SENS = 1.5          # fixed in JS: the body onset machine's threshold
Q = 1.0
STAGES = 3               # highpass stages; the body band is a single bandpass
VETO_MS = 45.0           # symmetric suppression around a live kick
COINC_MS = 45.0          # how recent the body onset must be
REFRACTORY_S = 150.0     # accepted-onset spacing, snare band
BASE_MS, PEAK_MS = _kick.BASE_MS, _kick.PEAK_MS
FLOOR_FRAC = _kick.FLOOR_FRAC
WARMUP = _kick.WARMUP


def rbj_highpass(f0, q, fs=SR):
    """Exactly what BiquadFilterNode type='highpass' implements."""
    w0 = 2 * np.pi * f0 / fs
    alpha = np.sin(w0) / (2 * q)
    c = np.cos(w0)
    b = np.array([(1 + c) / 2, -(1 + c), (1 + c) / 2])
    a = np.array([1 + alpha, -2 * c, 1 - alpha])
    return b / a[0], a / a[0]


def rbj_bandpass(f0, q, fs=SR):
    """BiquadFilterNode type='bandpass' — constant 0 dB peak gain form."""
    w0 = 2 * np.pi * f0 / fs
    alpha = np.sin(w0) / (2 * q)
    c = np.cos(w0)
    b = np.array([alpha, 0.0, -alpha])
    a = np.array([1 + alpha, -2 * c, 1 - alpha])
    return b / a[0], a / a[0]


def envelope(x, ba, stages):
    from scipy.signal import lfilter
    y = x.copy()
    for _ in range(stages):
        y = lfilter(ba[0], ba[1], y)      # causal, exactly like the live graph
    hop = int(round(SR / FPS))
    n = len(y) // hop
    return np.sqrt((y[:n * hop].reshape(n, hop) ** 2).mean(axis=1))


def detect(env_hi, env_body, env_kick, sens=SNARE_SENS, sens_b=BODY_SENS,
           veto=VETO_MS, coinc=COINC_MS, refr=REFRACTORY_S, gate=True):
    """One streaming pass over all three envelopes — the kick machine, the
    body machine and the snare machine run side by side exactly as the
    browser's frame loop does, and the veto reads the kick machine's own last
    hit. Nothing here may look at a frame the browser has not heard yet; the
    only forward reference is the 45 ms PENDING hold, which the browser pays
    for as flash latency, not as foresight.
    gate=False reproduces the naive delta-gate failure for the comparison
    printout — do not ship anything measured with it."""
    a, pd = np.exp(-DT / BASE_MS), np.exp(-DT / PEAK_MS)
    # kick machine (mirrors kick-tuning.detect / the js frame loop)
    kb = kp = 0.0
    kprev = env_kick[0] if len(env_kick) else 0.0
    karmed, klast, kicks = True, -1e9, []
    # body onset machine
    bb = bp = 0.0
    bprev = env_body[0] if len(env_body) else 0.0
    barmed, blast = True, -1e9
    # snare machine
    sb = sp = 0.0
    sprev = env_hi[0] if len(env_hi) else 0.0
    sarmed, slast, snares, vetoed = True, -1e9, [], 0
    pending = None
    for i in range(min(len(env_hi), len(env_body), len(env_kick))):
        t = i * DT
        # kick first, so a same-frame kick can cancel a pending snare
        v = env_kick[i]
        kb = kb * a + v * (1 - a)
        kp = max(kp * pd, v)
        kthr = max(kp * FLOOR_FRAC, kb * _kick.SENS)
        krising, kprev = v > kprev, v
        if v > kthr and krising and karmed:
            karmed = False
            if t > WARMUP and t - klast >= _kick.REFRACTORY:
                kicks.append(t)
                klast = t
        elif v <= kthr:
            karmed = True
        # pending snare: cancel on a kick inside the window, accept after it
        if pending is not None:
            if klast > pending - veto:
                pending = None
                vetoed += 1
            elif t - pending >= veto:
                snares.append(pending)
                slast = pending
                pending = None
        # body
        b = env_body[i]
        bb = bb * a + b * (1 - a)
        bp = max(bp * pd, b)
        bthr = max(bp * FLOOR_FRAC, bb * sens_b)
        brising, bprev = b > bprev, b
        if b > bthr and brising and barmed:
            barmed = False
            if t > WARMUP:
                blast = t
        elif b <= bthr:
            barmed = True
        # snare
        s = env_hi[i]
        body_ok = (t - blast) <= coinc if gate else b > bprev
        sb = sb * a + s * (1 - a)
        sp = max(sp * pd, s)
        sthr = max(sp * FLOOR_FRAC, sb * sens)
        srising, sprev = s > sprev, s
        if s > sthr and srising and sarmed:
            sarmed = False
            if t > WARMUP and t - slast >= refr and pending is None:
                if not gate:
                    if t - klast >= veto:
                        snares.append(t)
                        slast = t
                    else:
                        vetoed += 1
                elif body_ok:
                    if t - klast < veto:
                        vetoed += 1
                    else:
                        pending = t
        elif s <= sthr:
            sarmed = True
    return np.array(kicks), np.array(snares), vetoed


def concentration(onsets, ref_kicks):
    """Circular concentration of onset phase between consecutive reference
    kicks. 1.0 = every onset at the same point in the bar, 0 = uniform."""
    if len(ref_kicks) < 2 or len(onsets) == 0:
        return float("nan"), 0
    ph = []
    for t in onsets:
        j = np.searchsorted(ref_kicks, t) - 1
        if j < 0 or j >= len(ref_kicks) - 1:
            continue
        k0, k1 = ref_kicks[j], ref_kicks[j + 1]
        if k1 > k0:
            ph.append((t - k0) / (k1 - k0))
    if not ph:
        return float("nan"), 0
    z = np.exp(2j * np.pi * np.array(ph))
    return float(np.abs(z.mean())), len(ph)


def _precompute(p):
    """Everything that does not depend on the config being swept — the decode,
    the kick reference (HPSS is the expensive part of this whole file) and the
    kick envelope. Cached once per track so the sweep is cheap passes rather
    than full recomputes, which is the difference between two minutes and
    twenty."""
    x = _kick.pcm(p)
    return os.path.basename(p)[:-11], x, _kick.reference_kicks(x), \
        _kick.rms_envelope(x)


def run(cache, hz=SNARE_HZ, sens=SNARE_SENS, sens_b=BODY_SENS, gate=True,
        table=False):
    rows = []
    for name, x, ref, e_kick in cache:
        e_hi = envelope(x, rbj_highpass(hz, Q), STAGES)
        e_body = envelope(x, rbj_bandpass(BODY_HZ, Q), 1)
        kicks, snares, nveto = detect(
            e_hi, e_body, e_kick, sens=sens, sens_b=sens_b, gate=gate)
        conc, used = concentration(snares, ref)
        rows.append((name, len(ref), len(kicks), len(snares), nveto, conc))
        if table:
            print(f"{name:<24}{len(ref):>6}{len(kicks):>7}"
                  f"{len(snares):>8}{nveto:>7}"
                  f"{'   n/a' if np.isnan(conc) else f'{conc:>8.2f}'}")
    return rows


def main(pattern="assets/audio/samples/*.mp3"):
    files = sorted(glob.glob(pattern))
    if not files:
        sys.exit(f"no samples matched {pattern} — run this from the repo root")

    from multiprocessing import Pool
    with Pool(min(8, os.cpu_count() or 1)) as pool:
        cache = pool.map(_precompute, files)

    print(f"SHIPPED CONFIG — highpass {SNARE_HZ:.0f}Hz Q{Q} x{STAGES} "
          f"sens {SNARE_SENS} + body {BODY_HZ:.0f}Hz onset sens {BODY_SENS}, "
          f"veto ±{VETO_MS:.0f}ms, refractory {REFRACTORY_S:.0f}ms\n")
    print(f"{'track':<24}{'kicks':>6}{'live k':>7}{'snares':>8}{'vetoed':>7}"
          f"{'conc':>8}")
    print("-" * 60)
    rows = run(cache, table=True)
    conc = np.array([r[5] for r in rows if not np.isnan(r[5])])
    hits = np.array([r[3] for r in rows])
    print("-" * 60)
    print(f"{'MEAN':<24}{'':>6}{'':>7}{hits.mean():>8.1f}{'':>7}"
          f"{conc.mean():>8.2f}")
    print(f"{'WORST TRACK':<24}{'':>6}{'':>7}{hits.min():>8}{'':>7}"
          f"{conc.min():>8.2f}")
    print(f"tracks with concentration >= 0.5: {(conc >= 0.5).sum()} / "
          f"{len(conc)}   (HANDOFF 13: 8/8 on its 8-sample subset, mean 0.63)")

    print("\nTHE NAIVE DELTA-GATE, for the record — what shipping without "
          "this proof would\nhave shipped:")
    naive = run(cache, gate=False)
    nconc = np.array([r[5] for r in naive if not np.isnan(r[5])])
    nhits = np.array([r[3] for r in naive])
    print(f"  concentration {nconc.mean():.2f}, hits {nhits.mean():.0f}/20s, "
          f">=0.5 on {(nconc >= 0.5).sum()}/{len(nconc)} tracks")

    print("\nTHE SWEEP the defaults came from (mean conc / worst conc / "
          "tracks >=0.5 / hit range):")
    for hz in (2000.0, 2500.0, 3000.0):
        for sens in (2.0, 2.2):
            for sens_b in (1.5, 1.8):
                rows_s = run(cache, hz=hz, sens=sens, sens_b=sens_b)
                c = np.array([r[5] for r in rows_s if not np.isnan(r[5])])
                h = np.array([r[3] for r in rows_s])
                mark = " <- shipped" if (hz, sens, sens_b) == \
                    (SNARE_HZ, SNARE_SENS, BODY_SENS) else ""
                print(f"  hz {hz:>4.0f} sens {sens} body {sens_b}:  "
                      f"{c.mean():.2f} / {c.min():.2f} / "
                      f"{(c >= 0.5).sum()}/28 / {h.min()}-{h.max()}{mark}")


if __name__ == "__main__":
    main(*sys.argv[1:])
