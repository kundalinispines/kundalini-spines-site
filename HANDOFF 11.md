# Kundalini Spines — Session Handoff 11

**Date:** August 5, 2026

**Supersedes:** nothing wholesale. `HANDOFF 3`, `4`, `5` and `6` still own their material. `HANDOFF 7` still owns the spine layer's architecture. `HANDOFF 8` still owns the glow band and the 4K regeneration. `HANDOFF 9` still owns the four-band star field, the desync proof and the cloud-transform *finding*. `HANDOFF 10` still owns the kick-reactive rebuild, the biquad detector and the verification lesson.

**What this document does:** it invalidates one thing, and it is a thing that runs through four handoffs and two source files. **Every frame-time number this project has ever recorded was measured with Chrome rendering in software.** Nothing else is affected. The star field is not slow, was never slow, and needs no work.

* * *

## The one-line version

`chrome://gpu` read **`Compositing: Software only`**, `GL_RENDERER` **`Microsoft Basic Render Driver`**, `Software Rendering: Yes`. The owner confirms hardware acceleration had been switched off in Chrome **the entire time**. The machine's actual card is an **RTX 3090 Ti** and it was never being used.

HANDOFF 10's largest open item — *"THE STAR FIELD AT 20FPS. Largest item on the project. Do this first."* — was a browser setting.

* * *

## Corrections to earlier handoffs — read first

**1. HANDOFF 10's star-field frame-rate claim is void.** "the star field alone runs the page at 20fps; with it hidden the page runs at 238fps" was WARP compositing eight full-viewport render passes on the CPU. With acceleration on, the same measurement cannot separate the star field from an empty page at all.

**2. HANDOFF 9's cloud-transform numbers are WARP numbers.** `transform: scale(1.06)` 63fps against `inset: -3%` 88fps, p95 29.9ms against 14.1ms, the "28-40% frame-rate cost" over five paired runs, "the full star field costs roughly 2 fps out of ~90", "89 fps either way with the bands added", "`.spine-bg` measured about 3ms/frame". All CPU.

**KEEP THE `inset: -3%` ANYWAY.** It is algebraically identical to the transform and provably free, so there is no upside to the transform even if the gap was an artifact. What changes is the *comment*, not the code. `css/star-bg.css` has been patched.

**3. HANDOFF 9's "the ceiling moved 88 → 60 between two measurement sessions with no code change" was not a flaky GPU.** It was CPU contention. There was no GPU in the loop to be flaky.

**4. `scripts/measure-kick.js`'s two mysteries are both explained.** "a ceiling of 38.7fps with the star field AND the spine both hidden, which a near-blank page should never do" — a near-blank page does exactly that on WARP. And "the tuner's `backdrop-filter` caps the page at 40fps" is true of a CPU and not of a GPU. Avoiding `/?tune` for frame timing is still good hygiene; the 40fps figure is not a hardware figure.

**5. HANDOFF 10's frame-time section for the kick is the one that probably survives.** 58.4 / 62.4 / 62.5ms are absolutes and are void, but the *paint ratio* of 0.998 was taken under identical conditions minutes apart and is a ratio. What does not survive is the inference: *"`background-position` was the right call over a transform"* was never tested on a GPU.

* * *

## What is NOT contaminated, and it is most of the archive

Every pixel measurement in the project stands, untouched. None of it involves a frame clock:

- HANDOFF 8's luminance tables, the 4K regeneration deltas, the black-clamp arithmetic
- `--star-black`'s whole table — the faint-dust band, the 58.45% share, the k=0/6/12 hue rows
- the four-band partition: 1143 blobs, 25.00% of light per band, nearest-neighbour 27.8% against 25.0%
- the ×1.250 twinkle scaling measured with `getAnimations()`
- the kick detector's precision and recall over all 28 samples, build 23's 0.44 and build 25's 0.76
- the reference's 827ms median gap matching HANDOFF 4's ~70 BPM by an independent method
- the tuner's overflow geometry, 1082px in a 537px window

The contamination is one family of measurements. It is not the archive.

* * *

## What was measured this session

### Three instruments, three different failure modes, one consistent answer

**1. Vsync-capped, acceleration on, 240Hz panel. SATURATED.**

```
    off  shipped  noBlend  noFilter  noAnim  cloudHidden  cloud002
    noBlur  bandsOff  skyOff  skyOnly
      -> ALL 11 conditions: 238.1 fps, 4.2 ms, spread < 0.1 ms
```

That is not eleven measurements of zero. It is one measurement of the vsync cap, repeated eleven times. Every condition finishes inside a 4.17ms refresh interval. It licenses only *"the whole star field costs less than the headroom at 240Hz"* and cannot rank the conditions.

**2. Uncapped (`--disable-gpu-vsync --disable-frame-rate-limit`). INVERTED.**

```
    off          58.1 fps   17.2 ms     <- EMPTY sky, slowest row in the table
    shipped     555.6 fps    1.8 ms     <- FULL star field, ten times faster
    noAnim       57.8 fps   17.3 ms
    skyOnly      57.8 fps   17.3 ms
    the other eight          1.8 ms
```

An empty sky cannot cost more than a full one. The three slow rows are **exactly** the three where nothing is animating: all six hidden, `animation: none`, and base-sky-only (the base sky is static). Uncapped, the compositor only produces a frame when there is damage — the trace shows `DidNotProduceFrame` / `FrameSkippedReason: kNoDamage` — so a static page falls back to the display's cadence and an animating page free-runs.

**rAF interval measures frame PRODUCTION RATE, not frame cost.** Capped, production rate is the refresh interval. Uncapped, production rate is *"is anything moving"*. Neither is the cost of drawing a layer.

**But the eight animating rows ARE a valid comparison** — same damage regime, ranked against each other — and all eight read 1.8ms. Removing every blend mode, every filter, the 22px blur, the cloud layer, or four of the six layers changed the frame time by less than the instrument resolves.

**3. Structural trace, Chromium 141, headless.** Timings from that machine were discarded; compositing *decisions* are portable and these are MEASURED:

```
    cc RenderSurfaceReasonCount   {"root":1} {"backdrop scope":1} {"blend mode":6}
    render_surface_list_size()    8 with the star field, 2 without
    DrawRenderPass per frame      8.2 with, 2.0 without
```

`mix-blend-mode: screen` creates a render surface per element — six of them. Every drawn frame re-executes all eight passes, including `body::before`, the static base sky, whose content never changes. Chromium disables `GL_KHR_blend_equation_advanced` on all hardware (crbug.com/661715), which is why CSS blend modes take the render-surface path rather than a native GPU blend.

Also established and worth not re-investigating:

- **All five star animations are composited.** `compositeFailed: 0`, five of five, verified against a deliberate-failure control that did report `8224`. Zero main-thread animation frames in 1514.
- **`calc(var(--star-twinkle-amp) * …)` in keyframes costs nothing.** It does not prevent compositing and produces the same 5 style invalidations per main frame as literal keyframes.
- **Nothing re-rasters per frame.** `Paint` is 31 events with the star field and 31 without; raster is a single burst at load in both conditions.

### The conclusion

**REASONED, not measured:** six full-viewport blended surfaces at 1920×855 is about 10 megapixels of fill per frame, which on a 3090 Ti is tens of microseconds. Three independent instruments failed to find it, which is itself evidence about its size.

**MEASURED:** nothing removable from the star field changes the frame time on this machine, under any of the three instruments.

* * *

## The mistake, and it is not the one anyone was looking for

HANDOFF 10 closed on *"before you trust a measurement, check that it is measuring the thing you actually care about."* This session did that, twice, and both times the check passed — the method was sound, the pairing was right, the drift control worked, the numbers were internally consistent and reproducible.

The method was never the problem. **The machine underneath it was misconfigured, and a correct method on a misconfigured machine produces correct numbers about the wrong machine.**

The tell was there in HANDOFF 9 and nobody read it: *an 88fps ceiling.* Eighty-eight is not a divisor of 240, it is not a divisor of 60, it is not any panel on this desk. It is what WARP does. A ceiling that does not correspond to any refresh rate in the building is a statement about the renderer, and it sat in the record for two sessions being read as a property of the page.

The second tell was in `measure-kick.js`, written down explicitly and treated as a curiosity: *"a ceiling of 38.7fps with the star field AND the spine both hidden, which a near-blank page should never do."* That sentence is the diagnosis. It was filed as a reason to close other applications.

* * *

## Files changed this session

**New:**

- `scripts/measure-stars.js` — the eleven-condition sweep. Paired and alternated, re-measures the control at the top and bottom of every pass and voids the pass if it moved, calibrates against the detected refresh interval, and **aborts outright on a software renderer** by reading `WEBGL_debug_renderer_info`. Also carries the saturation and inversion detectors, so a future run that hits either failure says so instead of printing a table of zeroes. The three failure modes above are written into its header as comments.
- `scripts/gpu-test-chrome.bat` — launches Chrome on a throwaway `--user-data-dir` so acceleration and vsync can be changed without touching the daily profile. Takes `--uncapped`.
- `scripts/gpu-test-uncapped.bat` — double-clickable wrapper for the above.

**Patched, comments only, no behaviour change:**

- `css/star-bg.css` — the `html::after` block now carries the correction above the WARP table, the `--star-build` comment no longer states `63 -> 88 fps` as hardware fact, and the "DO NOT PUT A TRANSFORM BACK HERE" instruction is kept with its reasoning changed to "the inset is identical and free, so there is no upside either way".
- `scripts/measure-kick.js` — header now states that every number it has produced was software-rendered, and tells the next runner to confirm `chrome://gpu` first.

**Not changed:** no CSS values, no JS behaviour, no build numbers. `--spine-build` is still 25, `--star-build` still 10. Nothing about the page moved this session.

* * *

## Do not do these

- **Do not measure a frame time without checking `chrome://gpu` first.** `Compositing: Hardware accelerated` and a `GL_RENDERER` that names a real card. `scripts/measure-stars.js` enforces this; `scripts/measure-kick.js` does not yet.
- **Do not read a frame rate as a frame cost.** Capped, it reports the refresh interval. Uncapped, it reports whether anything is animating. Neither is a cost.
- **Do not quote an uncapped number as what the page runs at.** Nothing ships uncapped. Rank the conditions against each other or not at all.
- **Do not compare frame times across monitors.** Four panels here: 2560×1440 at 240Hz, and three at 59Hz. The window's panel sets the timebase. `measure-stars.js` logs `window.screenX/screenY` for exactly this reason. The 480Hz gaming mode changes it again.
- **Do not treat a table where every row is identical as a result.** HANDOFF 8 already said this and it caught the project again twice in one session.
- **Do not rebuild the star field for performance.** There is nothing there to recover on this hardware.
- **Do not put a transform back on `html::after`.** Unchanged instruction, changed reasoning — see above.
- Everything in HANDOFF 7's, 8's, 9's and 10's "do not" lists still stands, minus the frame-time figures corrected here.

* * *

## Still open

- **THE STAR FIELD ON A PHONE.** The one live descendant of HANDOFF 10's open item. Six full-viewport blended render surfaces at a phone's device pixel ratio is roughly nine times the fill per layer against a small fraction of a desktop's throughput. This is the workload that turns a page into a slideshow on mid-range Android, and **no amount of measuring on a 3090 Ti answers it.** It needs a device. Related: `--kick-shake` is a px value that has never been seen on a phone, and every mobile value in the project is inferred.
- **A GPU re-measurement of the transform-vs-inset question**, if anyone ever wants the real number. Low value — the inset is free and identical either way.
- **DNS for `kundalinispines.com`** — unchanged, still the single blocker on anything being reachable. Enable sequence in HANDOFF 5; do not enable Pages without the custom domain.
- **The spine-behind-the-stars idea.** HANDOFF 10 records it with its two traps. Note that trap 3's warning — *"the cloud layer is the prime suspect for the 20fps problem, and driving it harder is the opposite of what that investigation may conclude"* — is now withdrawn. There is no 20fps problem. Drive the clouds as hard as it looks good.
- **The spine and the star field are on `index.html` only** — the other four pages are flat black, so the site still reads as two different sites.
- **Pre-existing mobile nav bug.** Closed menu panel not fully off-screen, bleeding behind the fixed header on every page.
- **Side-card blur is too heavy.** `track-experience.js` applies up to `blur(6px)` and `brightness(0.4)`, both × `BOX_K` (1.85).
- **The earlier album is unacknowledged on the site** — nine YouTube videos, see HANDOFF 6.
- **The YouTube unit tests are not in the repo.**
- **Buttondown deliverability unverified** — still the highest-consequence unknown.
- **Instagram and X are owner-supplied, not verified.**
- **`explicit` is `null` on all 28 tracks;** streaming links all `null`; `data/releases.json` entirely `PLACEHOLDER`; downloads and Stripe/Gumroad not started.
- **TikTok and Spotify accounts do not exist** — dead footer links, owner's decision, do not "fix" them.
- **Accent hue collisions** — may-26th / blue-pills, uzi-fruit / the-33rd-floor.
- **May 26th's cover→video crossfade has still never been watched.**
- **The 885 MB masters folder is still backed up by nothing.**
- **27 × `assets/music/*-cover.jpg` and `full-zoom-cover.webp` are tracked and referenced by nothing** — ~1.2MB, removable with `git rm`.

**Closed since HANDOFF 10:** the star field's frame cost. It was a Chrome setting. No code was written to fix it and none should be.

* * *

## Housekeeping

`scripts/measure-stars.js`, `scripts/gpu-test-chrome.bat` and `scripts/gpu-test-uncapped.bat` belong in the repo for the same reason `raster-test.html`, `kick-tuning.py` and `measure-kick.js` do: they are the files that caught the error. None runs in the browser as part of the site; none is referenced by any page. **Do not "tidy" them away.** `.gitignore`'s protected-harness heading is the right place if that ever becomes a risk.

The `.bat` files contain a local Chrome path and write to `%TEMP%`. If Pages is ever enabled, they need adding to the workflow's internal-file excludes alongside the handoffs — the deploy job fails the build if internal material reaches the publish directory, so this will be caught rather than leaked, but it will fail the build.

* * *

## The closing line, again

HANDOFF 5 and 6 ended on *measure it, do not eyeball it*. HANDOFF 7 added *know what your instrument cannot see*. HANDOFF 8 added *when a number refuses to move, ask what it is actually measuring*. HANDOFF 9 added *take the baseline — the control is where the surprises are*. HANDOFF 10 added *check that it is measuring the thing you actually care about — a rate is not an accuracy*.

This session's method was right. The pairing was right, the alternation was right, the drift control worked, the numbers reproduced. Three sessions of careful measurement produced a coherent, consistent, entirely wrong picture of a page, because the browser had been quietly drawing everything on the CPU since before any of it started. The instrument was fine. Nobody had checked the bench it was bolted to.

> Measure it. Know what your instrument cannot see. When a number refuses to move, ask what it is actually measuring. Take the baseline. Check that it measures the thing you care about — a rate is not an accuracy. And check the machine: a correct method on a misconfigured machine produces correct numbers about the wrong machine.
