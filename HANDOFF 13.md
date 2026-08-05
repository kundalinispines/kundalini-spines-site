# Kundalini Spines — Session Handoff 13

**Date:** August 5, 2026

**Supersedes:** nothing wholesale. `HANDOFF 3`, `4`, `5`, `6` still own their material. `HANDOFF 7` still owns the spine layer's architecture. `HANDOFF 8` owns the glow band and the 4K regeneration. `HANDOFF 9` owns the four\-band star field and the desync proof. `HANDOFF 10` owns the kick\-reactive rebuild and the biquad detector. `HANDOFF 11` owns the WARP correction. `HANDOFF 12` owns the mirror tile and the cloud mask.

**What this document does:** it corrects a claim that has been shipping wrong since build 12, moves the drum response from the stars to the nebula, puts the spine on a second page, and records a feasibility measurement for something that was NOT built. It also documents a bug I introduced and the test that caught it, because the test is the transferable part.

* * *

## The one\-line version

**`--star-cloud` was above the CSS opacity ceiling, and the kick could not reach the nebula at all.** MEASURED: a full drum hit moved the nebula by **\+0.000** at the peak of the breath. Not subtly. Zero. The fix was to move the nebula's brightness out of an opacity (clamped) and into the cloud filter's `brightness()` (not clamped), which frees the opacity to be the kick channel. A hit now brightens the nebula **\+37%** across 37% of the frame.

* * *

## Corrections to earlier handoffs — read first

**1\. HANDOFF 12 says `--star-cloud` is 1.2 and that "the layer earns its keep" at that value. Both halves are misleading.** CSS clamps opacity to `[0,1]`, and `--star-cloud` feeds an opacity. MEASURED three ways:

- 1\.2 and 1.0 render **pixel\-identically** at the peak of the breath.
- 1\.2 is **strictly worse** than 1.0. The `cloud-glow` keyframe floor scales with the value while the ceiling does not, so 1.0 swings 0.40 → 1.00 and 1.2 swings only 0.48 → 1.00. A brighter floor and **13% less breath**.
- Under `.is-spine-pulsing` the ×1.8 took it to 2.16, so while a sample played the nebula was pinned at full opacity and effectively static.

**2\. Therefore HANDOFF 12's "the clouds get half as much" note on `--kick-stars` described something that never happened.** The cloud amplitude was already past the ceiling before the kick term was added, so the kick's contribution to the nebula was exactly nothing whenever a sample was playing.

**3\. HANDOFF 12's "STILL OPEN: the star field on a phone" now has a second and worse limb.** `brightness()` on the cloud filter went 0.85 → 2.2 this session and **that declaration is not inside any media query**, so the phone took the full lift with none of the compensating opacity cut. Scaling `--star-cloud` in the mobile block alone will not undo it.

**4\. The `--star-cloud` mobile override has inverted.** 0.21 was scaled off a desktop 0.36. Desktop is now 0.2, so the phone is **brighter** than the desktop — the HANDOFF 7 trap arrived at from the other direction. Left as\-is rather than guessed at; noted in the block.

* * *

## What was measured this session

### 1\. The blur on the large stars was two things, only one of them the artwork

The owner reported the big close\-up stars reading soft. Profiling the twelve largest cores in `starfield-deep-4k.webp`\: each has a **saturated flat plateau \~9 source px across**, falling to half at 24px and to 10% at 50px. That is intrinsic — the radial power spectrum rolls off smoothly with no cliff, so nothing was upscaled, and at 0.12 bpp what q86 is eating is the faint dust, not the low\-frequency big stars. Their cores are clipped flat, so **sharpening cannot recover them.**

Why it surfaced now: `cover` scale is **0\.42 at 1440×900 but 1.008 at 3840×2160**. On a small window the artwork is downscaled and the softness hides; on a 4K monitor it renders 1:1.

The other half was the cloud layer washing the space *around* each star. Core\-to\-halo contrast: **3\.12 clouds off, 2.60 at opacity 1.0** — a 17% loss.

**The lever that works uses existing sliders.** The band layer adds \+113.66 on cores and \+0.00 on halos (HANDOFF 9's own table), so it is pure core light and lossless; the photograph is where the soft halo lives. Dimming the photograph and raising the cores buys sharpness:

```
                dim    twinkle   cloud     core:halo
as shipped      0.80     0.46     1.20        1.00x
moderate        0.65     0.70     0.70        1.17x
strong          0.50     1.00     0.70        1.38x
```

### 2\. Desync was healthy and almost irrelevant

At `--star-desync: 1` the four periods are 4600 / 6302 / 8234 / 10626 ms, the spread across bands averages **0\.506** of the waveform, and all four sit within 0.05 of each other only **0\.1%** of the time. The mechanism was never broken.

But per\-star swing is **29\.4% on tiny stars and 17.9% on the largest** — the big ones are near\-saturated in the base sky and `screen` cannot lift what is already bright. And over one full swing:

```
  four star bands   move light on   0.66% of the frame
  the cloud layer   move light on  50.62% of the frame
  clouds move 15.1x as much total light, on ONE clock
```

When the four\-band work was done `--star-cloud` was 0.36 and that ratio was 5.7×. The thing desync exists to prevent had been reintroduced by the cloud slider, not by the star layer.

### 3\. The nebula now answers the drum

Brightness moved from the opacity into the filter, **calibrated not picked**\: bisected for equal mean luminance over the top decile of cloud light, so the resting nebula is unchanged. MEASURED in a real browser, stylesheet values only, nothing overridden but `--kick`\:

```
                         no hit    on a hit
  before                  33.97      34.24    (+1%)
  after                   36.13      49.35   (+37%)
  brightest tenth         93.1  ->  121.4
```

`--kick-cloud` is a new variable because one knob could not serve both layers: filling the cloud headroom through the old `* 0.5` needed `--kick-stars` at 1.0, which puts the star cores at 1.46 against a ceiling of 1.

**The architecture note, because it looks like an inconsistency and is not.** Static brightness lives in the filter (unclamped, but a filter change repaints, and this layer carries a full\-viewport 22px blur); per\-frame movement lives in the opacity (compositor\-only, no repaint, but clamped at 1.0). Do not "simplify" by moving the kick onto the brightness — it would look right in a still frame and put a full\-screen gaussian blur on the every\-frame path.

### 4\. A snare detector is feasible. It was NOT built.

Tested offline against 8 samples using the existing detector architecture, `scripts/` style. The band separation is better than expected: a 2 kHz highpass cross\-triggers with the kick only **2\.7%** of the time (150–400 Hz, the obvious "snare body" choice, cross\-triggers 27%).

Raw high\-band onsets are not a snare, though — they are hats and sibilance too. A **two\-band gate** (2 kHz noise rising AND 200 Hz body rising together, veto anything within 45 ms of a kick) tightens it sharply:

```
  phase concentration between kicks:  raw 2kHz 0.28  ->  gated 0.63
  above 0.5 on every one of 8 tracks, 0.74 on the best
  hits per 20s: 7-19, against 19-25 kicks
```

**What that does and does not prove.** Concentration measures *consistency*, not correctness — a detector reliably firing on a hi\-hat that sits on the backbeat would score identically. There is no ground truth here. Getting real precision/recall means hand\-labelling, as was done for the kick. Recall also looks incomplete at 7–19 against 19–25.

**Sequencing if it is ever built:** finish proving it in Python against all 28 samples first, then write browser code. The failure mode is spending a session on the JS and discovering at the end that it fires on hats.

### 5\. Text legibility on about.html

The spine costs **−0.01 percentage points** of text area below 4.5:1. Of 70 text blocks over 6 scroll positions, one H2 degraded, by 0.32pp. The \~4% baseline is the star field, not the column.

Method matters here: the first attempt used *worst pixel* and returned nonsense (1.05:1) because a single star core dominates any bounding box. The right measure is **area below threshold sampled at glyph scale**, which is what HANDOFF 8 used for the sky.

* * *

## Lightning: what was explored, and what the owner actually wants

The idea was to turn the spine into lightning striking in the nebula. Two findings closed the obvious version.

**The spine artwork cannot be a bolt.** Rendered at four widths: at 150px and 60px the vertebrae read as a **chain**; at 24px and 10px they vanish and it reads as a **straight laser**. Lightning is jagged and branches; the spine is a smooth tapered column with regular segmentation. No transform adds branching.

**"Underneath the clouds" cannot be done with stacking order.** HANDOFF 12 proved screen\-blending commutes exactly, so a bolt layer below the cloud layer is a mathematical no\-op. It has to be the cloud *diffusing* the bolt — scatter by local cloud density, sharp at thin edges, a soft glow where thick.

A mockup on that basis works: strikes anchored by cloud density (weighted `dens³`), bolt \~90–220px, flash strength **0\.20–0.35** (0.10 vanishes, 0.55 blows out).

**But the owner then supplied a reference image, and it is a different design.** `reference/nebula-with-lightning-target.png` shows **eight to ten thin filaments discharging at once**, threaded along the nebula's diagonal and branching perpendicular into the lobes — capillary\-like, tracing through the cloud structure. Each is 5–15% of frame width. Colour is the nebula's own cold blue\-white.

**Recommended path for next session, and it is simpler than what was mocked:** in the reference the lightning is *baked into the nebula image*. So build a full\-frame "nebula \+ filaments" layer registered to the existing sky and screen it in on the kick. One asset, one layer, no positioning maths, no density anchoring — and it is automatically inside the clouds because it was drawn there. Every strike would be identical, which 2–3 variants fixes. This supersedes the sprite\-positioning approach.

Six bolt candidates were generated (Higgsfield / Recraft V4.1); three are in `reference/`. **They came back with a lifted floor of 17–28, not true black**, despite `background_color: #000000`. Under screen that would lift the whole page by 4× its own floor. Any generated asset needs the `--star-black` treatment — subtract the floor per channel and renormalise — before it can be used. After crushing, the angular one measured 90.3% exact black.

* * *

## The bug I shipped and the test that caught it

Baking the tuned values in, I added a comment block to `css/star-bg.css` that landed **after** the preceding comment's `*/`. The prose became bare CSS, the parser ate the declaration, and `--star-cloud` computed to **empty**.

What makes it worth recording: **braces stayed balanced, and there was no console error.** Every structural check passed. It would have looked exactly like "the change didn't do much." It surfaced only because the value was read back out of `getComputedStyle` in a real browser instead of trusting the edit.

The generalisation: in a file this comment\-dense, *a syntax error can present as a no\-op rather than as a failure.* Verify a CSS change by reading the computed value, not by re\-reading the file.

* * *

## Do not do these

- **Do not raise `--star-cloud` to make the nebula brighter.** It is the headroom split, not the brightness. Above `1 - (kick headroom)` it is dead range, and past 0.556 it clips outright. Use `--star-cloud-bright`.
- **Do not move `--star-cloud` and `--star-cloud-bright` independently.** They are a calibrated pair; either alone changes the nebula's brightness.
- **Do not move the kick onto the cloud's `brightness()`.** It removes the clamp and looks correct in a still frame, and it puts a full\-viewport gaussian blur on the every\-frame path.
- **Do not expect stacking order to put anything "behind" the clouds or the stars.** Screen commutes. Attenuate or diffuse instead.
- **Do not use a generated asset without checking its black floor.** `#000000` in the prompt does not produce it. Measure, then subtract per channel.
- **Do not delete `starfield-cores-1..4.webp` because `--star-desync` is 0.** They still render; desync is a one\-character change away from 1.
- **Do not verify a CSS edit by re\-reading the file.** Read the computed value in a browser. See above.
- **Do not rename the `HANDOFF N.md` files** to match the project's kebab\-case convention. They are referenced by name in dozens of stylesheet comments and are already excluded from the published site.
- Everything in HANDOFF 7–12's "do not" lists still stands.

* * *

## What is deliberate, so nobody "fixes" it

- **`--spine-lit: 0` is darker than `--spine-dim: 0.22`.** The charge front DARKENS the column. Paired with `--kick-flash: 0.72`, the charged region is invisible until a drum hit and then flashes out of black. The variable names now mean the opposite of what they say; they were kept because every mask and five handoffs of measurement refer to them.
- **`--kick-cloud: 1` is past its 0.64 ceiling on purpose** — hits above that are compressed to a common peak, so the nebula flash acts as a soft limiter. 0.64 restores linear tracking.
- **`--star-twinkle-hi: 1.5` clips two keyframe stops** (46% → 1.50 and 78% → 1.20, both clamped to 1.0), flattening the top of the cycle. \~0.95 keeps the waveform intact.
- **`--star-desync: 0`** puts all four bands back on one clock — an exact identity with build 6. Defensible now that the drum response has moved off the stars entirely.
- **`--kick-stars: 0`** retires the star cores from the kick.

* * *

## Files changed this session

**Changed:**

- `css/star-bg.css` — `--kick-cloud` and `--star-cloud-bright` added; brightness moved into the filter; all tuned values; \~8 comments rewritten where the new values inverted them. `--star-build` 12 → 15.
- `css/spine-bg.css` — all tuned values; `--spine-lit`/`--spine-dim` and `--spine-band` comments rewritten. `--spine-build` 28 → 29.
- `css/base.css` — `--scroll-weight` 0.15 → 1.
- `js/spine-bg.js` — hover tooltips on all 33 tuner sliders with a coverage check; label column 44 → 56px; `k neb` and `cloud b` sliders; anchor generalised to `[data-spine-from] || #tracks`.
- `about.html` — star field and spine wired in; `data-spine-from` on the Messengers section.

**New:** `reference/` — three generated bolt candidates and the owner's lightning target image. Moved out of `assets/hero` so they are not deployed as production assets.

**Values as shipped**, build 29 / star 15:

```
    spine   w 120px · dim 0.22 · lit 0 · glow 0 · feather 430px
            offset 140px · bias 1.3 · band 800px · band-feather 600px
            bloom 0 · beam 0 · scrim 0
            pulse-lo 0 · pulse-hi 0.2 · pulse-ms 4100ms
    kick    flash 0.72 · shake 15 · gain 1 · decay 260 · sens 1.8 · freq 90
    star    dim 1.4 · sat 0.7 · black 13 · twinkle 0.46 / hi 1.5
            twinkle-ms 8200ms · desync 0 · cloud 0.2 · cloud-bright 2.2
            kick-stars 0 · kick-cloud 1
    base    scroll-weight 1
```

* * *

## Still open

- **DNS for `kundalinispines.com`** — unchanged, still the single blocker on anything being reachable. Nothing on this site can be seen by anyone until this is done. Enable sequence in HANDOFF 5; do not enable Pages without the custom domain.
- **THE MOBILE OVERRIDES ARE STALE AND NOW INVERTED**, and the cloud `brightness()` is outside every media query so the phone cannot be corrected by scaling `--star-cloud` alone. Largest technical item.
- **The lightning layer is not built.** Reference image and recommended approach above.
- **The snare detector is measured but not built.** Prove against all 28 samples before writing browser code.
- **Three of five pages are still flat black.** `about.html` now has sky and spine; `archive.html`, `transmissions.html` and `music.html` do not. `css/star-bg.css` is one `<link>` with no markup or script, so the sky is cheap to add anywhere.
- **The spine on about.html is tuned for the home page.** The owner has said this is fine for now and will adjust it independently.
- **`--kick-decay` is one envelope for everything** — the spine flash, the shake and the nebula all share it. Splitting them needs a second envelope in `js/spine-bg.js`.
- **The combined legibility case at the new values has not been re\-measured.** The spine's cost on about.html was measured; the sky's own contribution at `--star-dim: 1.4` was not.
- **Pre\-existing mobile nav bug** — closed menu panel not fully off\-screen.
- **The earlier album is unacknowledged on the site** — nine YouTube videos, HANDOFF 6.
- **Buttondown deliverability unverified** — still the highest\-consequence unknown.
- **Instagram and X are owner\-supplied, not verified.**
- **`explicit` is `null` on all 28 tracks;** streaming links all `null`; `data/releases.json` entirely `PLACEHOLDER`.
- **TikTok and Spotify accounts do not exist** — dead footer links, owner's decision, do not "fix" them.
- **The 885 MB masters folder is still backed up by nothing.**
- **27 × `assets/music/*-cover.jpg` and `full-zoom-cover.webp` are tracked and referenced by nothing.**

**Closed since HANDOFF 12:**

- **The nebula not responding to the drum.** It never had; measured at \+0.000 and fixed.
- **`--star-cloud` above 1.0.** Diagnosed as dead range and strictly worse than 1.0, then retired as a brightness control entirely.
- **The tuner being unreadable at a glance.** All 33 sliders now carry hover tips with their variable name and source file, plus a load\-time coverage check.
- **"Can the spine go on another page."** Yes; the anchor was the only blocker.
- **"Can the spine become lightning."** No — measured, it reads as a chain or a laser. A separate layer is the answer.

* * *

## The closing line, again

HANDOFF 5 and 6 ended on *measure it, do not eyeball it*. 7 added *know what your instrument cannot see*. 8 added *when a number refuses to move, ask what it is actually measuring*. 9 added *take the baseline*. 10 added *check that it measures the thing you care about*. 11 added *check the machine*. 12 added *check the exception too*.

This session added one about ceilings. `--star-cloud` at 1.2 had been shipping for two builds, documented as earning its keep, and it was not merely too high — it was past the point where the number meant anything at all. Every value above 1.0 rendered the same, and the slider went to 1.2. The tell was there in the tuner the whole time and nobody dragged it to find out.

> Measure it. Know what your instrument cannot see. When a number refuses to move, ask what it is actually measuring. Take the baseline. Check that it measures the thing you care about. Check the machine. Check the exception too. And know where every control's ceiling is — a slider that goes past its own limit reads as headroom, and a value parked in that dead zone will be defended by the comment next to it.
