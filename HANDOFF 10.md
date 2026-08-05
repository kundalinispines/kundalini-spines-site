# Kundalini Spines — Session Handoff 10

**Date:** August 5, 2026

**Supersedes:** nothing wholesale. `HANDOFF 3`, `4`, `5` and `6` still own their material and remain required reading. `HANDOFF 7` still owns the spine layer's architecture. `HANDOFF 8` still owns the glow band and the 4K regeneration. `HANDOFF 9` still owns the four\-band star field, the desync proof and the cloud\-transform finding — but its kick\-reactive brief was followed and turned out to recommend the wrong instrument, and its star\-field frame\-rate claim no longer holds on this machine.

**Status:** The kick\-reactive spine is BUILT and working, at `--spine-build 25` / `--star-build 10`. It was also built WRONG first, shipped, heard to be wrong by the owner, and rebuilt on a different architecture — that sequence is the most useful thing in this document and it is written up in full below. A separate finding fell out of the frame\-time work and is now the largest open item on the project: **the star field is costing this page roughly 92% of its frame budget**, which flatly contradicts HANDOFF 9. The site still is not served anywhere — Pages is off and `kundalinispines.com` still does not resolve.

* * *

## Corrections to earlier handoffs — read first

**1\. HANDOFF 9's sample path is wrong.** It says the samples live at `assets/music/*-sample.mp3`. They live at **`assets/audio/samples/<slug>-sample.mp3`** — all 28 of them, relative and same\-origin, which is what makes frequency analysis possible at all.

**2\. There is no `js/star-bg.js`.** The star field is `css/star-bg.css` and nothing else — six pseudo\-elements, no script. Nothing in HANDOFF 9 says otherwise, but "star\-bg" reads like a JS/CSS pair and it is not one. `ls js/` is ten files, none star\-related.

**3\. HANDOFF 9's star\-field frame\-rate claim is no longer true.** It records "with `inset` in place, the full star field costs roughly 2 fps out of \~90". MEASURED 2026\-08\-05 in the owner's Chrome on the real page: **the star field alone runs the page at 20fps; with it hidden the page runs at 238fps.** See "The star field at 20fps" below. This is not a small drift, it is the single biggest thing on the page, and it should be the next session's work.

**4\. HANDOFF 9's kick brief recommended the wrong instrument, in good faith.** Its "NEXT SESSION" section specifies `AnalyserNode` \+ `getByteFrequencyData` summing 40–120Hz with an adaptive threshold. That was built exactly as described and it **only landed on a real kick 44% of the time.** The traps it lists are all real and all worth keeping — `createMediaElementSource` rerouting, call\-once\-per\-element, the suspended context, same\-origin. The *detector* it specifies is the part that does not work, for structural reasons given below.

* * *

## What changed this session

| Area | Before | Now |
| --- | --- | --- |
| Kick reactivity | nothing built | built, rebuilt, shipped at build 25 |
| Detector | — | biquad lowpass side chain \+ time\-domain RMS |
| Audio hand\-off | sample element private to `track-experience.js` | `ks:sample-ready` CustomEvent carrying the element |
| Spine response | breathing loop only | flash on the lit layer \+ sideways artwork throw |
| Sky response | deaf to playback (twinkle \=\= twinkle\-hi) | star cores answer the kick at ×1.25 |
| Tuner panel | 23 controls in one flat list, top cut off screen | 31 controls in 7 collapsible groups, scrollable |
| `--spine-build` | 22 | **25** |
| `--star-build` | 9 | **10** |

**Modified:** `js/spine-bg.js`, `js/track-experience.js`, `css/spine-bg.css`, `css/star-bg.css`.
**New:** `scripts/kick-tuning.py`, `scripts/measure-kick.js`.

`index.html` did not change. The feature needs no markup.

* * *

## The verification mistake — read this before trusting any measurement

This is the part worth carrying forward, more than the feature itself.

Build 23's detector was verified before shipping. The verification ran the real decoder over **all 28 samples**, simulated the browser's `AnalyserNode` faithfully — Blackman window, `smoothingTimeConstant`, the exact byte scaling — and reported that it fired 19–38 times per 20\-second sample, with **no track silent and no track strobing**. That looked like a healthy result and it was reported as one.

It measured **how often the detector fired. It never once measured whether it fired on a drum.**

The owner played it and said it was landing "maybe 40 percent of the time" and "only picks up when the audio level is at its peak". Scored properly against a reference, build 23 was **precision 0.44**. His ear was accurate to within the noise of the instrument.

> A rate is not an accuracy. A detector that fires at the right *frequency* and a detector that fires at the right *moments* produce identical summary statistics, and only one of them works.

The fix in method was to build ground truth first and score against it — precision and recall — rather than count events. Everything below follows from doing that.

* * *

## Why the FFT detector could not work

Three reasons, none of them fixable by tuning. All MEASURED across all 28 samples.

**1\. At `fftSize` 2048 a bin is 21.5Hz, so the whole kick band was FOUR BINS.** Every band tried — 30–90, 35–100, 40–120, 45–95, 50–110 — resolved to the same four bins and scored **identically to three decimal places**. The `k lo` and `k hi` sliders that build 23 shipped were close to inert. They have been removed rather than left as controls that do not control anything.

**2\. `getByteFrequencyData` is decibels**, packed into 0–255, one level \= 0.27dB. On a limited master a sustained bass note holds the low bins high, and a log scale crushes the drum transient sitting on top of it. This is also why build 23's first threshold formulation (`energy > average × 1.35`) produced *two hits in twenty seconds* on four tracks: it was asking for \+14dB over the running mean.

**3\. It gated on `energy > runningAverage`** — literally "only when this passage is louder than usual." That is the owner's complaint, in code.

**Raising `fftSize` does not rescue it.** 8192 buys 5.4Hz bins but a 186ms window, which smears the transient the detector exists to find. F1 fell from 0.48 to **0\.09**. 16384 was worse.

**Removing the loudness gate alone made it WORSE**, which is counter\-intuitive and worth recording: F1 0.48 → 0.32. The extra false positives consumed the refractory window and blocked the real kicks behind them. In a detector with a refractory period, loosening one test can reduce recall.

* * *

## What replaced it

**A `BiquadFilterNode` lowpass side chain and plain RMS of the time domain.** No FFT anywhere in the detector.

- Three lowpass stages at **90Hz, Q 1.0** — an 18dB/octave skirt that actually rejects the bass line, instead of averaging four bins that contain it.
- `analyser.fftSize = 1024`, read with **`getFloatTimeDomainData`**. That is a time\-domain buffer length here, not a spectrum. Bigger only means a longer, laggier RMS window.
- Threshold: `max(runningPeak × 0.06, runningAverage × --kick-sens)`, everything one\-sided and streaming. Leading\-edge latched, 190ms refractory.
- Linear amplitude, not decibels, so `--kick-sens: 1.8` means genuinely 1.8×.

|  | precision | recall | F1 |
| --- | --- | --- | --- |
| build 23 — FFT bins, rise threshold | 0\.44 | 0\.54 | 0\.48 |
| build 25 — 3× lowpass 90Hz \+ RMS | **0\.76** | **0\.79** | **0\.77** |

### The graph shape is load\-bearing

```
src ──> ctx.destination                       DRY — the visitor's audio
 └────> lp1 -> lp2 -> lp3 -> analyser         side chain, output connected to NOTHING
```

An `AnalyserNode` observes without needing an onward connection. **Put the filters in the path to the destination and the visitor hears a kick drum and nothing else.** The dry connection is made first, deliberately.

`createMediaElementSource` is the one irreversible step in the feature — once called, that element's audio goes through the graph forever. So the code only routes an element **after confirming `ctx.state === 'running'`**. If autoplay policy refuses the resume, nothing is routed, the sample plays normally through the browser's own path, and there is no visualiser. That is the intended failure, and it is why every early return in `attach()` leaves playback untouched.

* * *

## The reference, and how to know whether to trust it

Detectors are scored against it, so it has to be independent of them. `scripts/kick-tuning.py` builds it:

1. Zero\-phase bandpass 40–110Hz; envelope via rectify \+ 25Hz lowpass.
2. Onsets \= peaks in the positive derivative of that envelope.
3. **Corroborated by HPSS** (Fitzgerald median filtering): a kick has a beater transient across the whole spectrum; a bass *note change* has an attack only down low. Requiring broadband percussive support within ±30ms is what separates them.

**The reference was wrong first, and the check that caught it should be repeated by anyone who changes it.** At a 130ms minimum spacing its busiest inter\-onset intervals were 100–200ms — 300–400 BPM, which is not a kick pattern, it is the same drum counted twice, once on its attack and once on its body. At 190ms the median gap became **827ms \= 72.5 BPM**, which matches the **\~70 BPM HANDOFF 4 measured for May 26th independently, months earlier and by a completely different method**.

That agreement is the entire reason the scores above mean anything. A reference that does not reproduce a known\-good number is not a reference.

* * *

## Frame\-time: the kick is free, and how to measure that here

MEASURED on the owner's machine, three paired alternating rounds, medians identical to 0.1ms across rounds:

```
    idle                             58.4 ms
    kick running, shake + flash on   62.4 ms
    kick running, both forced to 0   62.5 ms
```

**Paint cost — full against loop\-with\-visuals\-off — is 0.998. The shake and the flash cost nothing to composite.** `background-position` was the right call over a transform; this is not HANDOFF 9's cloud\-layer finding repeating. The remaining one refresh interval is loop overhead, and idle itself drifted by exactly that much during the same run, so it is at or below the noise floor.

Also verified: deleting the `:root.is-spine-kicking` rule from the live stylesheet and re\-measuring gave a byte\-identical 58.4ms. At idle the kick code does nothing at all — no class, no loop, no analyser.

### How to take this measurement, because three attempts failed first

- **Do NOT measure on `/?tune`.** The tuner panel carries `backdrop-filter: blur(8px)` and it caps the page at 40fps before anything else gets a chance to cost something. Every early attempt this session was measuring the panel.
- **The display is 240Hz.** Every frame time quantises to a multiple of 4.17ms. A median of exactly 66.7ms is sixteen intervals, not a workload.
- `document.hasFocus()` returning true is **not** sufficient. An early run read 15fps with focus reported as true.
- `scripts/measure-kick.js` does all of this correctly — paste it into DevTools on `localhost:8000`, window frontmost, nothing else running. It refuses to report if rAF is capped before it starts.

* * *

## THE STAR FIELD AT 20FPS — the largest open item on this project

MEASURED 2026\-08\-05, owner's Chrome, real GPU, plain page (not `?tune`), spine scrolled into view:

```
    everything hidden (no stars, no spine)     238 fps   ( 4.2 ms)
    spine visible, star field hidden           238 fps   ( 4.2 ms)
    star field visible, spine hidden            20 fps   (50.0 ms)
    as shipped                                  17 fps   (58.4 ms)
```

**The spine costs nothing. The star field is spending the entire frame budget.**

HANDOFF 9 says the full star field costs "roughly 2 fps out of \~90". That is no longer what this machine does.

### What is known, and what is not

- **My change is not implicated.** Deleting the `:root.is-spine-kicking` rule live gave an identical result. The rule does not match when nothing is playing.
- **It could not be attributed to a single layer.** Hiding any one of the six saved exactly one 4.17ms interval, no matter which one. That is consistent with the cost being spread across all six rather than concentrated in one.
- **The floor drifted badly between runs** — the identical all\-hidden condition read 4.2ms once and 20.8ms a few minutes later. Some of these numbers are inside that drift. The 20fps\-vs\-238fps gap is far outside it.
- **UNVERIFIED HYPOTHESIS, stated as such:** HANDOFF 9's frame\-rate work was done with `--star-cloud: 0.02`, which it describes as "effectively off". The owner then tuned it to **0\.36** — an 18× raise on a layer carrying `filter: blur(22px)` — *in the same session, after the measuring was finished.* Nobody re\-measured. The cloud tests run this session were inside the drift and settled nothing.

### The first thing to do next session

Take the four\-condition measurement above with `--star-cloud` at 0.36 and at 0.02, paired and alternated, on a quiet machine. If the cloud layer is the cost, the lever is that one number and the fix is a cheaper glow, not a rebuild. If it is not, bisect the four bands against the base sky.

Do it before any new work. HANDOFF 9's own closing line is *take the baseline — the control is where the surprises are*, and this surprise came out of a control for something else entirely, twice in two sessions.

* * *

## The owner's next idea: the spine BEHIND the star field

Recorded 2026\-08\-05, not built, not tested. The owner wants to try putting the spine behind the star field and having it **pulse through the clouds**, with some opacity treatment on the sky.

Three things the next session needs to know before starting, because two of them are traps:

**1\. `.spine-bg` CANNOT SIMPLY BE GIVEN A NEGATIVE `z-index`.** `css/spine-bg.css` already carries this note, verified in an earlier session:

> NO z\-index HERE, deliberately. z\-index:0 on a positioned element creates a stacking context, and mix\-blend\-mode on the children below would then blend only against this box's own (transparent) backdrop instead of against the page — which silently defeats the whole thing and puts the grey rectangle back.

The star layers sit at `z-index: -1`. Pushing the spine below them means giving it a z\-index, which is exactly the thing that breaks it. **The route is probably to lift the star layers rather than to lower the spine** — but that has its own hazard, since `main::before` and `main::after` carry two of the four bands and `main` must stay `position: static` with no transform, filter, opacity, isolation, contain or will\-change.

**2\. REORDERING TWO SCREEN LAYERS MAY BE A VISUAL NO\-OP, and this is arithmetic rather than opinion.** `screen(a,b) = 1-(1-a)(1-b)` is commutative and associative, so where both layers are fully opaque, stacking order does not change the composite at all. Order *does* matter wherever either layer is partially transparent — which is everywhere the spine's masks feather and everywhere the twinkle is mid\-cycle. So the effect is real but it will be **subtler than "behind" suggests**, and concentrated in the soft regions. Worth a five\-minute probe before committing a session to it. (REASONED, not measured — measure it.)

**3\. The pulse\-through\-the\-clouds part is already half wired.** `:root.is-spine-kicking` in `css/star-bg.css` currently drives `--star-cloud-amp` at `--kick-stars × 0.5`, deliberately half the star response. If the clouds should carry more of the kick, that coefficient is the lever and it costs nothing to try. **But see the section above first** — the cloud layer is the prime suspect for the 20fps problem, and driving it harder is the opposite of what that investigation may conclude.

* * *

## The tuner panel

31 controls now, and the panel had outgrown the screen — it is fixed to the bottom right, so the top rows went off the top of the viewport and became unreachable *silently*, because a fixed element does not scroll the page to reveal itself.

Rebuilt as seven collapsible groups inside a scroll area, ordered by how often they get touched: **kick** (open by default) · column · band · flare \+ scrim · breathing pulse · sky · page feel.

- The build number, the JS\-staleness line, the `hide` view\-mode button, the meter, Copy CSS and the paste box all sit **outside** the scroller. The meter especially — it is what you watch while dragging.
- Which sections are open is remembered in `localStorage` across reloads, because the cache\-busting workflow means a lot of reloads.
- **Anything added to `FIELDS` and not listed in `GROUPS` lands in a red "ungrouped" section** rather than vanishing. An invisible slider reads as a broken slider, and that is a bug nobody would think to look for in a layout change.
- `min-height: 0` on the scroller is load\-bearing — a flex child defaults to `min-height: auto` and refuses to shrink below its content, and without it the box grows past the viewport again and the overflow never engages.

MEASURED: all groups open is 1082px of content in a 537px window and it scrolls; with only `kick` open the panel is 669px in an 855px viewport and never needs to.

### The meter

Two bars. The first is the envelope. The second is the live low\-band level against the live threshold, with a `^` caret where the threshold sits — **if the level never reaches the caret, `k sns` is too high; if it sits past it, too low.** The header line reports the `AudioContext` state, and "suspended" specifically means the resume was refused and *nothing was routed*, which is the safe failure rather than a broken one.

* * *

## Do not do these

- **Do not verify a detector by counting how often it fires.** Build 23 passed that test at 44% accuracy. Score precision and recall against a reference.
- **Do not put the filters in the path to `ctx.destination`.** The visitor would hear a kick drum and nothing else.
- **Do not call `createMediaElementSource` before confirming `ctx.state === 'running'`.** It cannot be undone, and routing into a suspended context makes the sample silent with no way back.
- **Do not re\-add `--kick-lo` / `--kick-hi`.** At the old `fftSize` they resolved to the same four bins whatever they were set to. The one honest control is the lowpass cutoff.
- **Do not raise `fftSize` to "fix" kick detection.** Measured: 8192 drops F1 from 0.48 to 0.09. The window gets longer than the transient.
- **Do not remove the write\-on\-change guard in the frame loop expecting a regression** — measured, it skips 0% of frames during playback, and the comment explains why (the envelope never settles between hits). It is there for silent passages.
- **Do not measure frame times on `/?tune`.** The panel's `backdrop-filter` caps the page at 40fps.
- **Do not quote an absolute fps figure for this machine.** Still true, and worse than HANDOFF 9 recorded: the identical all\-hidden condition read 4.2ms and 20.8ms minutes apart.
- **Do not give `.spine-bg` a z\-index.** See the spine\-behind\-stars section.
- Everything in HANDOFF 7's, 8's and 9's "do not" lists still stands.

* * *

## Shipped values

`css build` is **25**; `--star-build` is **10**. The star block is unchanged from HANDOFF 9 apart from the one new line.

```
/* css/spine-bg.css — the kick */
--kick-flash: 0.34;      how much brightness a hit adds to the lit column
--kick-shake: 6;         px the artwork throws sideways
--kick-gain: 1;          master multiplier on the envelope, 0 = off
--kick-decay: 260;       envelope time constant, ms
--kick-sens: 1.8;        threshold as a multiple of the running average
--kick-freq: 90;         lowpass cutoff of the analysis side chain, Hz

/* css/star-bg.css */
--kick-stars: 0.25;      how hard the star cores answer, per unit of envelope
```

**The shake moves BOTH art layers, and it has to.** They are the same image under complementary masks. Shifting only the lit layer tears at the band's hard top edge and double\-images across the 220px charge\-front crossfade. The FLASH is lit\-only, which is where "only the lit section reacts" actually lives. `--kick-shake: 0` removes the movement and leaves the flash, which is a complete look on its own.

**`--kick-stars` scales the twinkle waveform, it does not add a flash on top.** MEASURED with the animations paused and stepped (HANDOFF 9's `getAnimations()` method): a trough band went 0.376 → 0.470 and a near\-peak band 0.645 → 0.807, both exactly ×1.250. Because `--star-twinkle-hi` is 1 and opacity cannot exceed 1, the exact top of each band's cycle clips and that band alone does not answer — with four bands on four clocks that is a small slice of the sky at any instant. If this is ever raised a long way, the fix is to lower `--star-twinkle-hi`, not to raise this further.

**The idle sky and the playing sky are still identical.** The owner's 2026\-08\-04 decision to set `--star-twinkle` equal to `--star-twinkle-hi` is untouched. The only thing that moves the stars now is an actual drum hit.

* * *

## How this session verified things

**Verified, not asserted.** 16 automated browser checks, run against a headless Chromium on every build: the flash raises lit brightness 0.52 → 0.86 and returns exactly; the shake's `calc()` resolves to `calc(50% - 6px) -520px` rather than silently falling back; four twinkle animations exist and respond ×1.250 at both trough and peak; `prefers-reduced-motion` neutralises the flash, the shake and the animation *even with `--kick` forced to 1*; the envelope moves from real decoded audio end to end (peak 0.938); and the sample still reports as playing, which is the check that catches the graph silencing it. The detector's precision and recall over all 28 samples. The frame\-time numbers, in the owner's own Chrome, paired and alternated. The tuner's overflow behaviour, measured at both extremes.

**Asserted, not verified.** That the kick now *feels* right — the owner's ear, which is the only instrument that matters here and the one that caught build 23. The mobile values, still inferred, still never judged on a device. Whether the cloud layer is the 20fps culprit. Whether reordering the spine and the sky will read as intended.

**A note on the instrument.** Two of this session's three verification failures were the harness, not the code: the `pseudoElement` probe read the element instead of the pseudo\-element and reported the sky as dead when it was fine, and the frame\-time runs were measuring the tuner panel. Both looked exactly like product bugs. Check the instrument before believing a surprising null result.

* * *

## Still open

- **THE STAR FIELD AT 20FPS.** Largest item on the project. Its own section above. Do this first.
- **The spine\-behind\-the\-stars idea.** Owner's, recorded above with its two traps.
- **DNS for `kundalinispines.com`** — unchanged, still the single blocker on anything being reachable by anyone. Enable sequence in HANDOFF 5; do not enable Pages without the custom domain.
- **Mobile values are inferred** — the spine, the band, the stars, the twinkle, the desync, and now the kick. `--kick-shake` in particular is a px value that has never been seen on a phone.
- **The spine and the star field are on `index.html` only** — the other four pages are flat black, so the site still reads as two different sites.
- **Pre\-existing mobile nav bug.** Closed menu panel not fully off\-screen, bleeding behind the fixed header on every page.
- **Side\-card blur is too heavy.** `track-experience.js` applies up to `blur(6px)` and `brightness(0.4)`, both × `BOX_K` (1.85).
- **The earlier album is unacknowledged on the site** — nine YouTube videos, see HANDOFF 6.
- **The YouTube unit tests are not in the repo.**
- **Buttondown deliverability unverified** — still the highest\-consequence unknown.
- **Instagram and X are owner\-supplied, not verified.**
- **`explicit` is `null` on all 28 tracks;** streaming links all `null`; `data/releases.json` entirely `PLACEHOLDER`; downloads and Stripe/Gumroad not started.
- **TikTok and Spotify accounts do not exist** — dead footer links, owner's decision, do not "fix" them.
- **Accent hue collisions** — may\-26th / blue\-pills, uzi\-fruit / the\-33rd\-floor.
- **May 26th's cover→video crossfade has still never been watched.**
- **The 885 MB masters folder is still backed up by nothing.**
- **27 × `assets/music/*-cover.jpg` and `full-zoom-cover.webp` are tracked and referenced by nothing** — \~1.2MB, removable with `git rm`, unchanged from HANDOFF 9.

**Closed since HANDOFF 9:** the kick\-reactive spine, built and measured. HANDOFF 9's three open design questions are answered and shipped — flash *and* jolt, lit section only for the flash, and the stars do react.

* * *

## Housekeeping

**New files this session, both deliberate, both belong in the repo:**

- `scripts/kick-tuning.py` — builds the reference and scores the detector over all 28 samples. Requires `ffmpeg`, `numpy`, `scipy`. This is the file that caught the 44%; it is kept for the same reason `raster-test.html` is kept.
- `scripts/measure-kick.js` — the frame\-time harness, pasted into DevTools. Refuses to report if rAF is capped before it starts.

Neither runs in the browser as part of the site. Neither is referenced by any page. **Do not "tidy" them away** — `.gitignore`'s protected\-harness heading is the right place for them if that ever becomes a risk.

* * *

## The closing line, again

HANDOFF 5 and 6 ended on *measure it, do not eyeball it*. HANDOFF 7 added *know what your instrument cannot see*. HANDOFF 8 added *when a number refuses to move, ask what it is actually measuring*. HANDOFF 9 added *take the baseline — the control is where the surprises are*.

This session measured carefully, reported a healthy result, and shipped something that worked 44% of the time. The measurement was not wrong; every number in it was correct. It was answering a question nobody had checked was the right question — *how often does it fire* rather than *does it fire on the drum*. A human listened for ten seconds and knew.

And once again the control found the bigger thing: nobody asked about the star field this session either.

> Measure it. Know what your instrument cannot see. When a number refuses to move, ask what it is actually measuring. Take the baseline. And before you trust a measurement, check that it is measuring the thing you actually care about — a rate is not an accuracy.
