#!/usr/bin/env python3
"""
Where the SNARE detector's numbers came from. Companion to kick-tuning.py,
which owns the kick reference and the story of why these harnesses exist.

  REQUIRES  ffmpeg on PATH, numpy, scipy.  Run from the repo root.
  PRINTS    per-track onset, reject and hit counts with phase concentration
            for the shipped detector, where the rejected onsets went, what the
            body window buys, the naive gate's failure for comparison, then
            the sweep the defaults were chosen from.

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

THE SHIPPED DESIGN (the constants below are the LIVE values, which are the
owner's ear, not the sweep's pick - see THE OWNER'S CONFIG at the end):
  - A HIGHPASS x3 (Q 1.0) -> RMS: the snare's noise burst. 2.5 kHz is what the
    sweep picked and 1600 Hz is what ships. HANDOFF 13's reasoning for a high
    band stands either way: the obvious 150-400 Hz "snare body" band
    cross-triggers with the kick 27% of the time, the noise band 2.7%.
  - A 200 Hz BANDPASS -> RMS runs its own full onset machine (same base/peak/
    floor/rising/armed shape as the kick's). A high-band onset counts only if
    the body band produced its own onset within --snare-coinc ms — a
    snare is the one thing in these mixes that hits both bands at once. Hats
    and sibilance have no body; bass notes have no noise. THE WINDOW IS
    TWO-SIDED since 2026-08-23; see THE BODY GATE below, which is the section
    to read first if the detector is missing strikes.
  - SYMMETRIC 45 ms KICK VETO, via deferral: an accepted candidate is held
    PENDING for 45 ms and cancelled if the kick machine fires while it waits.
    One-sided veto is not enough — the kick's own beater click crosses 2.5 kHz
    a few ms BEFORE the low band's RMS trips, so "no kick in the last 45 ms"
    still fires on the kick itself. The cost is a 45 ms (~3 frame) delay on
    the flash, well under the ~100 ms window where audio-visual sync reads as
    simultaneous; the win measured +0.02-0.05 concentration on most configs
    and it removes a failure mode rather than a tuning miss.

MEASURED, all 28 samples, THE SWEPT CONFIG (hz 2500, sens 2.2, body 1.5,
coinc 45 two-sided) — the best config this file's own scoring can find:
    mean concentration 0.62   worst track 0.31   >=0.5 on 20 of 28
    hits per 20s: mean 10.9, range 3-15, against 16-31 reference kicks
    naive delta-gate at the same sens:  concentration 0.42, hits 18/20s,
    >=0.5 on 9 of 28 — and at the 1.6 sens first tried, 0.30 and 26/20s
    HANDOFF 13's offline figure on its 8-track subset: 0.63, all >=0.5
With the ONE-SIDED window this shipped with until 2026-08-23: 0.66 / 0.42 /
25 of 28, hits mean 9. Read that as a metric artefact before reading it as a
regression — concentration rewards firing at ONE phase, so recovering the
second snare in a bar lowers it. See THE BODY GATE.

THE OWNER'S CONFIG, which is what actually ships and what the constants below
are set to (hz 1600, sens 1.95, body 1.5, coinc 85 two-sided):
    mean concentration 0.45   worst track 0.16   >=0.5 on 12 of 28
    hits per 20s: mean 15.6, range 10-21, against the same 16-31 kicks
    940 noise onsets over the 28 samples against 609 at the swept config
This is a DECISION, not a drift, made on 2026-08-23 after listening to the
lightning against the record: 70% more strikes than the swept config, and
less agreement about where in the bar they land. Concentration cannot tell a
recovered snare from a recovered hat (see WHAT CONCENTRATION DOES AND DOES NOT
PROVE below), and the owner's ear is the tie-break this file has always
deferred to. Do not "restore" the swept numbers because they score better
here; re-run, show both rows, and ask.

THE BODY GATE, 2026-08-23 — THE OWNER SAID IT WAS ANSWERING ABOUT HALF THE
SNARES THEY COULD HEAR, AND THEY WERE RIGHT. The instinct was that the
threshold was too strict and the tuner slider needed to reach lower. The
measurement said otherwise, and this is the tally that is now printed on every
run:

    609 noise-band onsets over the 28 samples, 260 accepted.
    293 of them — 48% — were killed by the BODY GATE alone.
    Everything the threshold could reach took 43 between them:
    refractory 17, pending-busy 19, kick veto 7.

That tally is the ONE-SIDED gate being diagnosed, i.e. what this script used
to print. Two-sided at the same hz 2500 / sens 2.2 it reads 609 onsets, 306
strikes, body gate 214, refractory 21, pending-busy 29, kick veto 39; at the
owner's shipped hz 1600 / sens 1.95 / coinc 85 it reads 940 onsets, 437
strikes, body gate 367, refractory 54, pending-busy 24, kick veto 58. In every
one of those the body gate is still the biggest rejecter by a factor of five,
which is the point — the window moved the line, it did not remove the
corroborator.

The gate asked whether the body band had ALREADY fired. Of those 293 rejects,
the nearest body onset landed 0-45 ms AFTER the noise onset 63 times, and
45-100 ms after another 66. Which band crosses its threshold first is a
property of the mix, not of the drum, so a backward-only window discarded
every snare whose body was the slower half of it.

The fix costs nothing, because the candidate was already being held for the
kick veto: the coincidence is now tested when the PENDING candidate releases,
so the window is coinc ms backward and up to veto (45) ms forward. Same
latency, same state, no new machinery.

    one-sided 45 (before)   hits  9.0   conc 0.66 / 0.42   >=0.5 25/28
    two-sided 45 (now)           10.9        0.62 / 0.31          20/28
    two-sided 100                12.0        0.59 / 0.31          20/28
    two-sided 150                12.8        0.57 / 0.31          19/28

AND THE SLIDER THE INSTINCT REACHED FOR WOULD NOT HAVE WORKED. --snare-sens
at this window: 2.0 gives 13.2 hits at 0.57 concentration, 1.5 gives 19.1 at
0.32, 1.2 gives 22.6 at 0.20. Below 2.0 it is tripling the onsets to add a
third more strikes, which is this file's original failure — lightning on
hats — arriving by the front door. The tuner floor was lowered from 1.5 to
1.2 anyway, at the owner's request, with that written on the slider.

The three tracks under 0.5 on the old window — extra-zoom 0.42, kabal 0.44,
may-26th 0.44 — are the busiest percussion on the record; their hits still
land musically, just at two places in the bar rather than one.

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
SNARE_HZ = 1600.0        # --snare-freq, highpass cutoff of the noise band
SNARE_SENS = 1.95        # --snare-sens
BODY_HZ = 200.0          # fixed in JS, not a slider: the body corroborator
BODY_SENS = 1.5          # fixed in JS: the body onset machine's threshold
Q = 1.0
STAGES = 3               # highpass stages; the body band is a single bandpass
VETO_MS = 45.0           # symmetric suppression around a live kick
COINC_MS = 85.0          # --snare-coinc; two-sided, tested at release
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

    THE BODY COINCIDENCE IS TESTED WHEN THE CANDIDATE RELEASES, not when it
    starts, which is what makes the window two-sided — `coinc` ms backward and
    up to `veto` ms forward, the forward side free inside a hold that already
    existed. See THE BODY GATE section in the header for the measurement that
    changed it. Returns the reject tally as well, because "where did the
    onsets go" is the question that found this.

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
    # where the noise-band onsets went. 'nobody' is the body gate, and it is
    # the biggest number in here by an order of magnitude — see the header.
    why = dict(onsets=0, refr=0, busy=0, nobody=0, veto=0, ok=0)
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
                # the body test, two-sided, at the moment of release
                if not gate or abs(blast - pending) <= coinc:
                    snares.append(pending)
                    slast = pending
                    why['ok'] += 1
                else:
                    why['nobody'] += 1
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
        sb = sb * a + s * (1 - a)
        sp = max(sp * pd, s)
        sthr = max(sp * FLOOR_FRAC, sb * sens)
        srising, sprev = s > sprev, s
        if s > sthr and srising and sarmed:
            sarmed = False
            if t > WARMUP:
                why['onsets'] += 1
                if not gate:
                    # The comparison row, unchanged in behaviour: no hold and
                    # NO BODY GATE AT ALL. It is named for the delta test the
                    # first attempt used, but that test reduces to "was this
                    # frame louder than itself" by the time it runs, so what
                    # this row has always measured is the detector with the
                    # corroborator removed. That is the honest comparison
                    # anyway - it is the thing the body gate is worth.
                    if t - slast < refr or pending is not None:
                        pass
                    elif t - klast < veto:
                        vetoed += 1
                    else:
                        snares.append(t)
                        slast = t
                        why['ok'] += 1
                elif t - slast < refr:
                    why['refr'] += 1
                elif pending is not None:
                    why['busy'] += 1
                elif t - klast < veto:
                    why['veto'] += 1
                    vetoed += 1
                else:
                    pending = t
        elif s <= sthr:
            sarmed = True
    return np.array(kicks), np.array(snares), vetoed, why


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
        coinc=COINC_MS, table=False):
    rows = []
    for name, x, ref, e_kick in cache:
        e_hi = envelope(x, rbj_highpass(hz, Q), STAGES)
        e_body = envelope(x, rbj_bandpass(BODY_HZ, Q), 1)
        kicks, snares, nveto, why = detect(
            e_hi, e_body, e_kick, sens=sens, sens_b=sens_b, coinc=coinc,
            gate=gate)
        conc, used = concentration(snares, ref)
        rows.append((name, len(ref), len(kicks), len(snares), nveto, conc, why))
        if table:
            print(f"{name:<24}{len(ref):>6}{len(kicks):>7}"
                  f"{why['onsets']:>8}{why['nobody']:>8}{nveto:>7}"
                  f"{len(snares):>8}"
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
    print(f"{'track':<24}{'kicks':>6}{'live k':>7}{'onsets':>8}{'nobody':>8}"
          f"{'vetoed':>7}{'snares':>8}{'conc':>8}")
    print("-" * 76)
    rows = run(cache, table=True)
    conc = np.array([r[5] for r in rows if not np.isnan(r[5])])
    hits = np.array([r[3] for r in rows])
    print("-" * 76)
    tot = {k: sum(r[6][k] for r in rows) for k in rows[0][6]}
    print(f"{'MEAN':<24}{'':>6}{'':>7}{tot['onsets'] / len(rows):>8.1f}"
          f"{tot['nobody'] / len(rows):>8.1f}{'':>7}{hits.mean():>8.1f}"
          f"{conc.mean():>8.2f}")
    print(f"{'WORST TRACK':<24}{'':>6}{'':>7}{'':>8}{'':>8}{'':>7}"
          f"{hits.min():>8}{conc.min():>8.2f}")
    print(f"tracks with concentration >= 0.5: {(conc >= 0.5).sum()} / "
          f"{len(conc)}   (HANDOFF 13: 8/8 on its 8-sample subset, mean 0.63)")

    print("\nWHERE THE NOISE-BAND ONSETS GO - the body gate is the whole story,"
          " and the reason the window is two-sided. Everything the"
          " threshold could fix is in the noise of the other columns:")
    print(f"  {tot['onsets']} onsets over {len(rows)} tracks -> "
          f"{tot['ok']} strikes")
    print(f"  rejected: body gate {tot['nobody']}, refractory {tot['refr']}, "
          f"pending-busy {tot['busy']}, kick veto {tot['veto']} early + "
          f"{tot['onsets'] - tot['ok'] - tot['nobody'] - tot['refr'] - tot['busy'] - tot['veto']} on release")

    print("\nTHE BODY WINDOW - what --snare-coinc buys, everything else shipped."
          " THIS is the recall control; the sens rows in the sweep below"
          " buy hits by loosening what counts as a drum at all:")
    for co in (30.0, 45.0, 70.0, 85.0, 100.0, 150.0):
        rows_c = run(cache, coinc=co)
        c = np.array([r[5] for r in rows_c if not np.isnan(r[5])])
        h = np.array([r[3] for r in rows_c])
        mark = " <- shipped" if co == COINC_MS else ""
        print(f"  coinc {co:>5.0f}ms:  hits {h.mean():>5.1f} "
              f"({h.min()}-{h.max()})  conc {c.mean():.2f} / {c.min():.2f}  "
              f">=0.5 {(c >= 0.5).sum()}/{len(c)}{mark}")

    print("\nTHE NAIVE DELTA-GATE, for the record — what shipping without "
          "this proof would\nhave shipped:")
    naive = run(cache, gate=False)
    nconc = np.array([r[5] for r in naive if not np.isnan(r[5])])
    nhits = np.array([r[3] for r in naive])
    print(f"  concentration {nconc.mean():.2f}, hits {nhits.mean():.0f}/20s, "
          f">=0.5 on {(nconc >= 0.5).sum()}/{len(nconc)} tracks")

    print("\nTHE SWEEP the defaults came from (mean conc / worst conc / "
          "tracks >=0.5 / hit range):")
    for hz in (1600.0, 2000.0, 2500.0, 3000.0):
        for sens in (1.95, 2.2):
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
