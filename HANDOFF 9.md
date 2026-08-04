# Kundalini Spines — Session Handoff 9

**Date:** August 4, 2026

**Supersedes:** nothing wholesale. `HANDOFF 3`, `4`, `5` and `6` all still own their material and remain required reading. `HANDOFF 7` still owns the spine layer's architecture. `HANDOFF 8` still owns the glow band, the star field's origin, the 4K regeneration and the MUSIC-jump fixes — but its twinkle section, its shipped-values block and two of its stated instrument limits are now out of date.

**Status:** The twinkle is rebuilt as four bands on four clocks, which closes HANDOFF 8's top open item, pending the owner's eye. A pre-existing frame-rate defect was found and fixed on the way — the star field used to cost about a third of the page's frame rate and now costs almost nothing. **This session had a new instrument: the Claude in Chrome extension, so measurements were taken in the owner's real browser on his real GPU with his real webfonts for the first time.** The site still is not served anywhere — Pages is off and `kundalinispines.com` still does not resolve.

* * *

## Corrections to earlier handoffs — read first

**1. The assistant is no longer blind to real hardware.** HANDOFF 7 and 8 both close on the cost of measuring in an environment that cannot exhibit the defect. That gap is now optional rather than structural: with the Claude in Chrome extension connected, the assistant can execute JavaScript in the live page in the owner's Chrome and take screenshots of what his GPU actually composited. See "The new instrument" below for what it can and cannot do — it does not replace him, and it did not eliminate the container's blind spots, it just made them avoidable when it matters.

**2. HANDOFF 8's nav height was measured in the wrong environment, and the real number is 79px.** HANDOFF 8 records `fonts.googleapis.com` being blocked in the assistant's container and the nav consequently measuring 89px at every breakpoint. Measured in the owner's browser with the real webfonts loaded: **`--nav-h` resolves to 79px**, and `.nav`'s box is 79.14px. The `--nav-h` fix HANDOFF 8 shipped is therefore doing exactly its job — but note the hardcoded `86px` that fix replaced would have been **7px too large** on this machine, not 3px too small as the 89px reading implied. Nothing needs changing; the fallback in `calc(var(--nav-h, 72px) - 4px)` is only ever used before the first measurement.

**3. "Do not trust `getComputedStyle` for anything animated" is true but incomplete, and the missing half is useful.** Three handoffs now record that it reads flat while pixels move. Two ways around it were found this session:

- **`document.getAnimations()`** returns the live CSS animations, and `anim.effect.getComputedTiming().progress` reports the real interpolated phase, 0–1, while the animation is running. This is what proved the four bands are out of phase, and it is a DOM number rather than a pixel measurement, so it works over the extension with no screenshot at all.
- **`getComputedStyle` reports correctly once the animation is PAUSED.** Pause it, set `currentTime`, and the computed opacity is exact. That is how the desync-0 identity was confirmed to six decimal places.

So the rule should read: do not trust `getComputedStyle` on a *running* animation. Pause it, or ask the Web Animations API.

**4. HANDOFF 8's shipped-values block gains `--star-desync` and loses nothing.** `--star-build` is now **8**. The rest of the star block is unchanged.

**5. HANDOFF 8's housekeeping claim about `_hf-*.png` is wrong.** They *are* gitignored and were never at risk of being committed. See "Housekeeping" at the end, which is audited against the actual remote rather than against the previous handoff.

* * *

## What changed this session

| Area | Before | Now |
| --- | --- | --- |
| Twinkle | one layer, every star on one clock | **four bands on four clocks**, `body::after` / `html::before` / `main::before` / `main::after` |
| Band artwork | — | `starfield-cores-1..4.webp`, lossless, 56 KB total |
| Desync | — | `--star-desync`, 0 = exactly build 6, 1 = shipped spread |
| Cloud layer overscan | `transform: scale(1.06)` | `inset: -3%` — **worth 28–40% of the page's frame rate** |
| Tuning panel | 22 controls | 23, plus a `star bands only (amp 1)` view mode |
| `stars off` view mode | hid the base sky only | hides all six star layers |
| Measurement | headless container only | real Chrome, real GPU, real webfonts |

**New files:** `assets/hero/starfield-cores-1.webp` … `-4.webp`.
**Modified:** `css/star-bg.css` (build 6 → 8), `js/spine-bg.js`.

Nothing else was touched. `index.html` did not change — the four bands need no markup.

* * *

## The four bands

**Files:** `css/star-bg.css`, `assets/hero/starfield-cores-1..4.webp`.

### What was actually wrong

Registering the twinkle layer (HANDOFF 8's fix) put the light back on the real stars and left the actual complaint untouched: **one layer means one opacity animation, so every star in the sky brightens and dims on the same clock.** And the light is not evenly spread — MEASURED, **11 blobs larger than 1024px carry 50.2% of the whole layer's light**. Eleven big blooms pulsing in unison is what reads as the sky breathing as a single object rather than as weather.

### How the bands were built

1. `cores = contrast(9)` applied per channel to `starfield-deep-4k.webp` — exactly what build 6 did at runtime, now baked.
2. Connected-component label the survivors: **1,143 blobs**.
3. Deal blobs largest-light-first into whichever band is currently dimmest.
4. Write each band as its own full-frame image, black everywhere else.

**MEASURED result of step 3: every band carries 25.00% of the total light, and a star's nearest neighbour is in the same band 27.8% of the time against 25.0% for chance.** Balanced and spatially decorrelated at the same time.

**This is deliberately NOT what HANDOFF 8 proposed.** It suggested splitting by brightness — "sample the cores into a handful of alpha bands". That was tried on paper and rejected: brightness bands put every bright star on the same clock, and the bright stars are the ones you look at, so the lockstep would have survived exactly where it is most visible. Balancing light across bands while randomising which band each star lands in decorrelates what the eye actually reads.

### Why desync 0 is *exactly* build 6 — a proof, not a hope

The four images are **disjoint** and their union is byte-identical to build 6's crushed layer. A screen-blended element at opacity `o` composites to `(1-o)·backdrop + o·screen(backdrop, source)`; where `source` is black, `screen(backdrop, 0) = backdrop` and the whole expression collapses to `backdrop`. **A band is a perfect no-op everywhere it is black, at any opacity.** So at any pixel exactly one band is doing anything, and it does exactly what the single layer did.

Confirmed on real hardware: at `--star-desync: 0` all four animations report computed opacity **0.744712** — the same value to six decimal places, not merely close.

That identity is the whole reason `--star-desync` can be trusted as an A/B. Anything that breaks it — a second waveform for the even bands, per-band amplitude multipliers, lossy band images — makes the slider a comparison between two different things. A second waveform was considered and dropped for precisely this reason.

### Lossless is load-bearing, not a quality preference

The band images are **WebP lossless**. Lossy encoding rings around every star core, and ringing in a mostly-black frame is **light in the empty sky** — the exact failure mode HANDOFF 8's `+0.00` rows certify against. Lossless also happens to be **half the size** here (13 KB vs 27 KB per band) because the frame is mostly exact black and lossy spends its bits on the ringing. Verified: round-trip error `0.00000`, and zero lit pixels outside each band's own blobs.

### Six slots, all now spoken for

With no markup to add, animatable full-screen layers come only from pseudo-elements: `html::before`, `html::after`, `body::before`, `body::after`, `main::before`, `main::after`. **That is six and they are all used** — base sky, four bands, clouds. A fifth band needs markup or the clouds' slot. Do not go looking for a seventh.

`main::before` and `main::after` were verified usable **in the real browser before anything was built on them**, by rendering coloured probe layers from `html::before`, `main::before` and `main::after` at once and measuring the composite: all three screened against the page exactly as `body::after` does, and the page background came back at `(78, 78, 86)` against a predicted 73.6 plus the sky's own contribution. All six pages carry `<main id="main">`, and `main` is `position: static` with no transform, filter, opacity, isolation, contain or will-change anywhere.

**If anyone ever puts a transform on `main`**, bands 3 and 4 stop screening against the page and start screening against main's own transparent box — the same failure HANDOFF 7 records for `.spine-bg`. There is a comment saying so in `star-bg.css`.

### The visibility trap this created

`visibility` **inherits into pseudo-elements**. Two existing view modes (`spine only`, `mask only`) hide `main`, which as of build 8 would silently switch off half the sky — and that reads as "the twinkle broke", not as "this view mode hid it". Every mode that hides `main` now re-shows `main::before, main::after` explicitly via a shared `KEEP_BANDS` string. **Add that clause to any new view mode that hides `main`.**

* * *

## The cloud layer's transform — a third of the frame rate, for nothing

This was not the task. It was found because the four-band work prompted a frame-time baseline, and it is the most valuable thing in this document.

`html::after` — the cloud glow — carried `transform: scale(1.06)`. Its only purpose is overscan: `blur()` pulls transparency in from outside the element, which would otherwise thin the glow at the viewport edges.

**MEASURED, real GPU, `rAF` frame times, 180–240 frames per run:**

```
    blur removed entirely        no help
    blur reduced to 8px          no help
    animation paused             no help
    transform removed            FULL RECOVERY
    display: none                same as removing the transform
```

It is not the 22px blur, not the animation, and not the layer's existence. **A transform on this pseudo-element takes it off the cheap path and nothing else does.**

The fix is `inset: -3%`, which is algebraically identical — both give a fixed box 106% of the viewport in each axis, centred, and the measured geometry matches to 0.1px — and free.

**Paired runs, `inset` versus `transform`:**

```
    session A     88 fps  vs  63 fps     ratio 1.40
    session B     60 fps  vs  47 fps     ratio 1.28  (x3, identical)
```

**Read the ratio, not the absolute.** The machine's own ceiling moved between the two measurement sessions — 88 to 60 with no code change — so "the page runs at N fps" is not a quotable number on this hardware. The *ratio* reproduced across five paired runs and is the finding. Call it **a 28–40% frame-rate cost**.

The consequence is bigger than the fix: attributed by elimination, **the entire star field used to cost about a third of the frame rate and essentially all of it was this one transform.** With `inset` in place, the full star field costs roughly 2 fps out of ~90 — the four bands themselves are free (with clouds off, adding all four bands changed nothing: 89 fps either way).

And it had been shipping since build 5, on a layer tuned to `--star-cloud: 0.02`, which HANDOFF 8 itself describes as "effectively off". **The page was paying a third of its frame budget for something invisible.**

**Worth a future session:** the same audit on every other always-on transformed layer. `.spine-bg` measured about 3ms/frame in the same sweep and was not investigated.

* * *

## The new instrument — Claude in Chrome

Connected 2026-08-04. What it changes, honestly:

**What it does well**

- **Runs JavaScript in the live page** on the owner's GPU with his webfonts. DOM numbers — geometry, computed styles, animation phase, `rAF` frame times — are exact and free.
- **Screenshots what the GPU composited.** Flat regions round-trip losslessly through the JPEG: the opaque nav bar measured **exactly (5.00, 5.00, 5.00)**, so the page floor *can* be verified on real hardware.
- It would have caught the card-shadow blob of HANDOFF 7 on the first pass instead of costing most of a session.

**What it does not do**

- Screenshots arrive **JPEG, downscaled 1920 → 1568**. Flat areas are exact; **high-contrast edges ring**, so variance-of-Laplacian sharpness numbers are still not available this way and HANDOFF 3's native-resolution `Win + PrtScn` method still stands for those.
- **The window would not resize** — Chrome ignores it while maximized — so breakpoint sweeps still happen in the container, and mobile is still judged by eye on a device.
- It is not a shell. `git` is still the owner's to run.

**The cache trap, which cost three cycles this session.** Busting a stylesheet by rewriting its `href` with `?v=…` works, but it caches the fresh copy **under the query-string URL** — the bare URL still holds the stale response, so the very next plain navigation serves the old file again. The tuner header read `star 6` against a build-8 file on disk. The reliable move is:

```js
fetch(url, { cache: 'reload' })   // for every same-origin css AND js
```

then navigate. Note `fonts.googleapis.com` throws on `fetch` from this origin, so filter to same-origin before mapping or the whole `Promise.all` rejects.

**The build counters caught it every time.** `--star-build` and `css build` exist for exactly this and they earned their place three times in one session.

* * *

## Do not do these

- **Do not put a transform back on `html::after`.** If the glow needs more overscan, make the `inset` more negative. See the frame-rate section.
- **Do not break the desync-0 identity** — no second waveform, no per-band amplitude, no lossy band images. It is the only reason the slider is a valid A/B.
- **Do not re-encode the band images lossy.** Ringing in a black frame is light in the empty sky.
- **Do not put a transform, filter, opacity, isolation or containment on `main`.** Bands 3 and 4 live on its pseudo-elements.
- **Do not add a view mode that hides `main` without the `KEEP_BANDS` clause.** `visibility` inherits into pseudo-elements.
- **Do not trust `getComputedStyle` on a running animation** — but do pause it, or use `getAnimations()`, rather than reaching for a screenshot.
- **Do not quote an absolute fps figure for this machine.** The ceiling moved 88 → 60 between two measurement sessions with no code change.
- Everything in HANDOFF 7's and 8's "do not" lists still stands.

* * *

## Shipped values

Unchanged from HANDOFF 8 except the one new line. `css build` is still **22**; `--star-build` is now **8**.

```
/* css/star-bg.css */           build 8
--star-dim: 0.8;                --star-twinkle: 0.04;
--star-sat: 1;                  --star-twinkle-hi: 0.32;
--star-cloud: 0.02;             --star-twinkle-ms: 7700ms;
--star-desync: 1;
```

Band period multipliers are `1 / 1.37 / 1.79 / 2.31` with phase offsets `0 / -0.34 / -0.66 / -1.08` of the base period, all scaled by `--star-desync`. No pair of the multipliers is close to a ratio of small integers, so the four never realign on any timescale anyone will watch.

**Mobile (≤600px) is unchanged and still inferred** — `dim 0.46 / twinkle 0.03 / twinkle-hi 0.25`. `--star-desync` is deliberately **not** overridden there: the phone crop shows fewer stars, which makes lockstep more obvious rather than less, so it wants at least as much spread as the desktop.

* * *

## How this session verified things

Everything below was measured in the owner's own Chrome unless stated.

**Verified, not asserted:** that `html::before`, `main::before` and `main::after` composite against the page (coloured probe layers, measured composite against prediction); that `calc()` multiplying a time by a nested `var()` expression resolves — 7.7s/0s at desync 0 and 17.787s/−8.316s at desync 1, matching the arithmetic exactly; that all four bands bind their own image, blend `screen`, sit at `z-index: -1` and run at 7.7 / 10.549 / 13.783 / 17.787s; that they hold four *distinct* phases while running; that at desync 0 all four collapse to computed opacity 0.744712; that the band images are an exact partition with round-trip error 0.00000 and no lit pixels outside their own blobs; the transform's frame-rate cost, isolated by elimination and reproduced in five paired runs; that the tuner gained `desync` and the new view mode and still cycles back to normal.

**The floor invariant, on real hardware.** Two frozen frames of the bands-only view, desync 1 against desync 0, differenced and classified by base brightness:

```
                          n          mean delta
    empty sky (<=6)   1,028,188        +0.04
    faint                46,738        -1.71
    mid                  12,795        -4.19
    bright                3,578       -23.65
    cores                 4,733       -31.23
```

Median luminance is **exactly 5.00** in both frames. The empty sky moves by 0.04 of a level — nothing — while every real difference lands on the cores and the bright pixels. **The bands redistribute light only onto stars that were already there**, which is HANDOFF 8's invariant, now confirmed against real compositing rather than against the artwork alone.

**Asserted, not verified:** everything the owner judges by eye, including whether the twinkle is now right; the mobile values, and that the bands look correct at 390px, because the window would not resize; `prefers-reduced-motion` — the rule covers all five animated layers and was read, not exercised; that the four extra image decodes do not matter on a memory-constrained device.

* * *

## Still open

Carried forward, minus what this session closed.

- **Does the twinkle actually read right now?** The mechanism is fixed and measured; the judgement is the owner's. Open `/?tune`, take `desync` from 0 to 1 and back — 0 is literally the old sky. Use the `star bands only (amp 1)` view mode to see what the bands are doing, because at the shipped 0.04 amplitude the movement is far too small to judge directly.
- **DNS for `kundalinispines.com`** — unchanged, still the single blocker. Nothing on this site is reachable by anyone. Enable sequence in HANDOFF 5 under "Deployment"; do not enable Pages without the custom domain.
- **Frame-time audit of the remaining always-on layers.** `.spine-bg` costs roughly 3ms/frame and was never looked at. The cloud finding suggests it is worth an hour.
- **The star field and scroll weight are on `index.html` only** — now one `<link>` and one `<script>` per page, and the four bands ride along with the stylesheet for free.
- **The spine is on `index.html` only** — the other four pages are flat black, so the site still reads as two different sites.
- **Pre-existing mobile nav bug.** The closed menu panel is not fully off-screen: `Archive` at y=12 and `About` at y=73, bleeding behind the fixed header **on every page**.
- **Side-card blur is too heavy.** `track-experience.js` applies up to `blur(6px)` and `brightness(0.4)`, both multiplied by `BOX_K` (1.85).
- **Mobile values are inferred**, not judged on a device — the spine, the band, the stars, the twinkle and now the desync.
- **The earlier album is unacknowledged on the site** — nine YouTube videos, see HANDOFF 6.
- **The YouTube unit tests are not in the repo.**
- **Buttondown deliverability unverified** — still the highest-consequence unknown.
- **Instagram and X are owner-supplied, not verified.**
- **`explicit` is `null` on all 28 tracks;** streaming links all `null`; `data/releases.json` entirely `PLACEHOLDER`; download links and Stripe/Gumroad not started.
- **TikTok and Spotify accounts do not exist** — dead footer links by owner's decision.
- **Accent hue collisions** — may-26th / blue-pills, uzi-fruit / the-33rd-floor.
- **Video takes** chosen by name-matching; most tracks have 2–4.
- **May 26th's cover→video crossfade has still never been watched.**
- **The 885 MB masters folder is still backed up by nothing.**

**Closed since HANDOFF 8:** `README.md` was rewritten on 4 August and is no longer stale. It does not yet mention the band images.

### Housekeeping — audited against the actual remote, not against the last handoff

**CORRECTION TO HANDOFF 8, and to the first draft of this document.** HANDOFF 8 says the four `_hf-*.png` files are "44 MB of scratch files in the repo root, `.gitignore` does not currently exclude them, so `git add -A` would commit all four." **That is false and was already false when HANDOFF 8 was written.** `.gitignore` gained an `_hf-*.png` rule — with a comment explaining the Higgsfield round trip — about three minutes *before* HANDOFF 8 was saved. Confirmed twice: the rule is on line 20 of `.gitignore`, and a read of the remote's tree returns **zero** `_hf-*` blobs. The 44 MB is a local disk matter, never a git one.

This session repeated the claim without checking it, which is the exact failure the handoffs keep warning about, one level up: **a handoff is evidence about the past, not about the present.** Verify a housekeeping claim against the repo before acting on it.

**The remote, read directly 2026-08-04** (`git/trees/main?recursive=1`): **191 files, 89.9 MB, not truncated.**

| Tracked and dead | Size | Referenced by |
| --- | --- | --- |
| 27 × `assets/music/*-cover.jpg` | 826 KB | nothing — grepped all html/css/js/json |
| `assets/music/full-zoom-cover.webp` | 373 KB | nothing — the cut track |

That is the *entire* removable weight: **~1.2 MB of 89.9 MB, or 1.3%.** Worth doing because it is unambiguous, not because it matters to the repo's size.

**Not tracked, correctly:** `_hf-*.png`, `setup/`, the backup zips, the masters folder.

**Tracked and deliberately kept — do not "tidy" these:**

- `js/music-page.js`, `js/audio-player.js` — reference for a future all-tracks directory page.
- `raster-test.html`, `raster-test-2.html` — the sharpness harness. `.gitignore` names them under a heading that reads "Deliberately NOT ignored, so nobody tidies them away later". HANDOFF 7 and 8 both list them as safe to delete; **those two documents and `.gitignore` disagree, and `.gitignore` is the one a future session will not read.** 9 KB combined. Keeping them costs nothing and they found a real cause once.
- `transmissions-options.html`, `transmissions-option5-v2.html` — 76 KB. HANDOFF 4 says keep until the Spine rotation is settled, and **it is still not settled** (the plan is to rotate in above ~10 posts). Same `.gitignore` protection.
- `spine-bg-trials.html`, `spine-image-test.html` — 38 KB. These two are genuinely obsolete, superseded by the tuner's view modes, and are the only harnesses `.gitignore` does *not* protect. Deletable if the clutter bothers anyone; no argument either way beyond taste.

**Needs adding, not deleting:** the four `starfield-cores-*.webp` and `HANDOFF 9.md` are untracked as of this writing.

`assets/hero/starfield-deep.webp` and `spine-column-moonlight.webp` are the pre-4K originals, unreferenced, kept for comparison. `starfield-deep-4k.webp` is still used by the base sky and the clouds; **the four `starfield-cores-*.webp` are derived from it, so if the sky artwork is ever replaced the bands must be regenerated from the new file** or they will be registered to an image that no longer exists underneath them.

**On the `_to_delete/` ritual.** Earlier handoffs route every deletion through a `_to_delete/` folder because the device bridge cannot delete files. That is a constraint on the *assistant*, not on the owner, and it does not apply to tracked files at all: **`git rm` removes the working-tree file and stages the removal in one step.** Use `git rm` for anything tracked; `_to_delete/` is only for untracked files the assistant put there.

Higgsfield element IDs for new covers:
Messenger-A `46229f47-2d2f-45f7-a578-8d169ca5fbb7`,
Messenger-B `37f342de-2add-4f4c-bcc7-2aa3530676d3`

* * *

## The closing line, again

HANDOFF 5 and 6 ended on *measure it, do not eyeball it*. HANDOFF 7 added *know what your instrument cannot see*. HANDOFF 8 added *when a number refuses to move, ask what it is actually measuring*.

This session finally got a better instrument, and the first thing it found was not the thing it was pointed at. Nobody asked whether the page was dropping frames. The four-band work needed a frame-time baseline purely as a control — *does adding three layers cost anything?* — and the control turned up a defect three times larger than the thing being controlled for, sitting in a layer that had been tuned down to invisible and therefore stopped being looked at.

The bands cost nothing. The overscan on a layer nobody could see cost a third of the frame rate.

> Measure it. Know what your instrument cannot see. When a number refuses to move, ask what it is actually measuring. And take the baseline — the control is where the surprises are.
