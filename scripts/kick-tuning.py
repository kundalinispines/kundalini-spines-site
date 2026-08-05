#!/usr/bin/env python3
"""
Where the kick detector's numbers came from, and the mistake that produced two
of them.

Kept in the repo for the same reason raster-test.html is: it caught a real
error, and without it the next person tunes against one track by ear and calls
it done. That is exactly how build 23 shipped something that only worked 44% of
the time.

  REQUIRES  ffmpeg on PATH, numpy, scipy.  Run from the repo root.
  PRINTS    precision / recall / F1 per track for the shipped detector.


THE MISTAKE, because it is the useful part
------------------------------------------
Build 23 detected kicks from getByteFrequencyData: sum bins 40-120Hz, threshold
the frame-to-frame RISE. It was verified before shipping — but only on HIT RATE.
It fired 19-38 times per 20-second sample with nothing silent and nothing
strobing, which looked healthy and said NOTHING about whether it fired on a
drum. The owner listened and said it landed "maybe 40 percent of the time" and
"only picks up when the audio level is at its peak". Scored against a reference,
build 23 was precision 0.44 — his 40% was accurate to within the noise.

Three structural reasons, none of them fixable by tuning:

 1. AT fftSize 2048 A BIN IS 21.5Hz, so 40-120Hz is FOUR BINS. Every band tried
    — 30-90, 35-100, 40-120, 45-95 — resolved to the same four bins and scored
    identically to three decimal places. Two of the tuner's sliders were inert.
 2. getByteFrequencyData IS DECIBELS packed into 0..255, one level = 0.27dB. On
    a limited master a sustained bass note holds the low bins high, and a log
    scale crushes the drum transient sitting on top of it.
 3. It gated on `energy > runningAverage` — literally "only when this passage is
    louder than usual", which is the symptom he described, in code.

Raising fftSize does not rescue it: 8192 gives 5.4Hz bins but a 186ms window,
which smears the transient the detector exists to find. Measured F1 fell from
0.48 to 0.09.

WHAT REPLACED IT: a BiquadFilterNode lowpass side chain and plain RMS of the
TIME domain. A real filter with a real rolloff instead of four bins; linear
amplitude instead of decibels. Same reference, same tracks:

    build 23  FFT bins, rise threshold      precision 0.44   recall 0.54
    build 24  3x lowpass 90Hz Q1.0 + RMS    precision 0.76   recall 0.79


THE REFERENCE
-------------
Detectors are scored against it, so it has to be independent of them:
  1. Zero-phase bandpass 40-110Hz, envelope via rectify + 25Hz lowpass.
  2. Onsets = peaks in the positive derivative of that envelope.
  3. Corroborated by HPSS (Fitzgerald median filtering): a kick has a beater
     transient across the whole spectrum, a bass NOTE CHANGE has an attack only
     down low. Requiring broadband percussive support within +/-30ms is what
     separates them, and it is why this reference is worth scoring against.

It was wrong once too, and the check that caught it is worth repeating: at a
130ms minimum spacing the busiest inter-onset intervals were 100-200ms — 300 to
400 BPM, not a kick pattern but the same drum counted twice, on its attack and
again on its body. At 190ms the median gap became 827ms = 72.5 BPM, which
matches the ~70 BPM HANDOFF 4 measured for May 26th independently. THAT
agreement is the reason to trust it. If you change the reference, re-run that
check before believing any score it produces.
"""
import glob
import os
import subprocess
import sys

import numpy as np
from scipy.ndimage import maximum_filter1d, median_filter
from scipy.signal import butter, lfilter, sosfiltfilt

SR, FPS = 44100, 60.0
DT = 1000.0 / FPS
TOL_MS = 70.0            # a detection counts if it lands within this of a kick

# --- these must mirror js/spine-bg.js ---
CUTOFF_HZ = 90.0         # --kick-freq
Q = 1.0
STAGES = 3
SENS = 1.8               # --kick-sens
BASE_MS, PEAK_MS = 900.0, 3000.0
FLOOR_FRAC = 0.06
REFRACTORY = 190.0
WARMUP = 300.0


def pcm(path):
    raw = subprocess.run(
        ["ffmpeg", "-v", "quiet", "-i", path, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
        capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).astype(np.float64)


def reference_kicks(x, min_gap=190.0):
    env = np.abs(sosfiltfilt(butter(4, [40, 110], btype="band", fs=SR, output="sos"), x))
    env = sosfiltfilt(butter(2, 25, btype="low", fs=SR, output="sos"), env)
    hop = 128
    e = env[::hop]
    d = np.diff(e, prepend=e[0])
    d[d < 0] = 0
    if d.max() > 0:
        d /= d.max()

    n_fft, phop = 1024, 128
    n = 1 + (len(x) - n_fft) // phop
    win = np.hanning(n_fft)
    S = np.abs(np.array([np.fft.rfft(x[i * phop:i * phop + n_fft] * win) for i in range(n)])).T
    H, P = median_filter(S, size=(1, 21)), median_filter(S, size=(21, 1))
    Sp = S * ((P ** 2) / (P ** 2 + H ** 2 + 1e-12))
    fx = np.diff(Sp, axis=1, prepend=Sp[:, :1])
    fx[fx < 0] = 0
    perc = fx.sum(axis=0)
    if perc.max() > 0:
        perc /= perc.max()
    perc_t = np.arange(len(perc)) * phop / SR * 1000.0

    t = np.arange(len(d)) * hop / SR * 1000.0
    local = maximum_filter1d(d, size=int(1500 / (hop / SR * 1000)), mode="nearest")
    cand = np.flatnonzero((d > np.maximum(0.10, local * 0.30))
                          & (d >= maximum_filter1d(d, size=9, mode="nearest")))
    kicks, last = [], -1e9
    for i in cand:
        if t[i] - last < min_gap:
            continue
        j0, j1 = np.searchsorted(perc_t, [t[i] - 30, t[i] + 30])
        if j1 > j0 and perc[j0:j1].max() > 0.08:
            kicks.append(t[i])
            last = t[i]
    return np.array(kicks)


def rbj_lowpass(f0, q, fs=SR):
    """Exactly what BiquadFilterNode type='lowpass' implements (RBJ cookbook)."""
    w0 = 2 * np.pi * f0 / fs
    alpha = np.sin(w0) / (2 * q)
    c = np.cos(w0)
    b = np.array([(1 - c) / 2, 1 - c, (1 - c) / 2])
    a = np.array([1 + alpha, -2 * c, 1 - alpha])
    return b / a[0], a / a[0]


def rms_envelope(x, f0=CUTOFF_HZ, q=Q, stages=STAGES):
    b, a = rbj_lowpass(f0, q)
    y = x.copy()
    for _ in range(stages):
        y = lfilter(b, a, y)          # causal, exactly like the live graph
    hop = int(round(SR / FPS))
    n = len(y) // hop
    return np.sqrt((y[:n * hop].reshape(n, hop) ** 2).mean(axis=1))


def detect(env, sens=SENS):
    """The loop from js/spine-bg.js. Everything one-sided and streaming — no
    statistic here may look at a frame the browser has not heard yet."""
    a, pd = np.exp(-DT / BASE_MS), np.exp(-DT / PEAK_MS)
    base = peak = 0.0
    prev = env[0] if len(env) else 0.0
    armed, last, hits = True, -1e9, []
    for i, v in enumerate(env):
        t = i * DT
        base = base * a + v * (1 - a)
        peak = max(peak * pd, v)
        thr = max(peak * FLOOR_FRAC, base * sens)
        rising, prev = v > prev, v
        if v > thr and rising and armed:
            armed = False
            if t > WARMUP and t - last >= REFRACTORY:
                hits.append(t)
                last = t
        elif v <= thr:
            armed = True
    return np.array(hits)


def score(det, ref):
    used = np.zeros(len(ref), bool)
    tp = 0
    for t in det:
        j = int(np.argmin(np.abs(ref - t)))
        if abs(ref[j] - t) <= TOL_MS and not used[j]:
            used[j] = True
            tp += 1
    fp, fn = len(det) - tp, len(ref) - tp
    p = tp / max(1, tp + fp)
    r = tp / max(1, tp + fn)
    return p, r, (0 if p + r == 0 else 2 * p * r / (p + r))


def main(pattern="assets/audio/samples/*.mp3"):
    files = sorted(glob.glob(pattern))
    if not files:
        sys.exit(f"no samples matched {pattern} — run this from the repo root")
    print(f"lowpass {CUTOFF_HZ:.0f}Hz Q{Q} x{STAGES}, sens {SENS}, "
          f"refractory {REFRACTORY:.0f}ms\n")
    print(f"{'track':<24}{'kicks':>7}{'fired':>7}{'prec':>7}{'rec':>7}{'F1':>7}")
    print("-" * 59)
    rows, iois = [], []
    for p in files:
        x = pcm(p)
        ref = reference_kicks(x)
        if len(ref) > 1:
            iois.append(np.diff(ref))
        det = detect(rms_envelope(x))
        pr, rc, f1 = score(det, ref)
        rows.append((pr, rc, f1))
        print(f"{os.path.basename(p)[:-11]:<24}{len(ref):>7}{len(det):>7}"
              f"{pr:>7.2f}{rc:>7.2f}{f1:>7.2f}")
    r = np.array(rows)
    ioi = np.concatenate(iois)
    print("-" * 59)
    print(f"{'MEAN':<24}{'':>7}{'':>7}{r[:,0].mean():>7.2f}{r[:,1].mean():>7.2f}"
          f"{r[:,2].mean():>7.2f}")
    print(f"{'WORST TRACK':<24}{'':>7}{'':>7}{r[:,0].min():>7.2f}{r[:,1].min():>7.2f}"
          f"{r[:,2].min():>7.2f}")
    print(f"\nreference sanity: median gap {np.median(ioi):.0f}ms "
          f"= {60000/np.median(ioi):.1f} BPM "
          f"(HANDOFF 4 measured ~70 BPM for May 26th independently)")
    print("build 23, same reference, for comparison:  prec 0.44  rec 0.54  F1 0.48")


if __name__ == "__main__":
    main(*sys.argv[1:])
