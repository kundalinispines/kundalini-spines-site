# Kundalini Spines — Spine UI V2 Handoff 24

**Date:** August 11, 2026

Sixth handoff of the **Spine UI V2** track (branch `feature/spine-ui-v2`).
`V2HANDOFF 23` owns the entrance redesign, the Range server and the navigator
extraction; `21` owns the coil's original reasoning; `19` owns the navigator
architecture. The plain `HANDOFF 1`–`19` series documents the dormant production
site on `main` and is background reading only.

---

## The one-line version

**The entrance got its wordmark.** A two-line KUNDALINI SPINES lockup in Archivo
900/62, wearing a letterpress grain lifted out of the owner's own reference
image, landing on the frame where the right messenger's hand is fully raised.
Along the way: the entrance turned out to have been rendering **no webfont at
all**, and the coil got its first performance measurement ever. **`main` was not
touched.**

---

## Corrections to earlier handoffs — and to things said inside this session

- **23's "No performance measurement at all" is CLOSED for the coil.** `draw()`
  costs **0.21ms** per frame — 1.3% of a 60fps budget — and canvas `shadowBlur`,
  the usual suspect, contributes nothing measurable. With the new crossover
  blend it is 0.26ms. The scramble's per-frame DOM writes are still untimed.

- **23's still-open item 1, "watch the entrance run", is CLOSED.** The owner has
  now watched it repeatedly and driven several decisions from it — the arrival
  beat, the coil timing, the grain opacity.

- **`entrance-lab.html` LINKED NO WEBFONT AT ALL** until this session, and
  nothing said so. `'800 56px "Big Shoulders Display"'` measured **536.79px**
  for "KUNDALINI SPINES" there — byte-identical to a deliberately nonsense
  family — against **351.01px** on `shutter-lab.html`. `document.fonts.size`
  was 0. Every headline on the page was browser fallback, 53% wider than
  intended, for the whole time the entrance was being built and judged.

- **A CLAIM MADE MID-SESSION AND THEN DISPROVED: "the shutter reveal has only
  ever been judged against the wrong typeface."** That was wrong. Finding 4's
  five-band numbers came from the owner's reference recording, not from any page
  in this repo, and the sanity figures written into `js/shutter-text.js` (cap
  45px at 1440, pitch 9.2) match the **real** face exactly — the fallback's
  equivalents, cap 40 and pitch 8, appear nowhere in the source. Re-measured on
  live pixels: **every observed slat boundary lands within 0.9px of the
  five-slat prediction on both pages**, and the four-slat prediction misses all
  of them. The grid was always right.

- **A COMMENT I WROTE INTO `js/spine-coil.js` AND THEN HAD TO CORRECT.** It said
  blending the crossover past ~0.6 "is not a blend, it is a disappearance". The
  owner promptly settled on exactly 0.60, so the claim was checked against the
  module's own `ringAt()` instead of my arithmetic. It was overstated — see
  finding 12.

---

## Git state

- Branch `feature/spine-ui-v2`, worktree `C:\Users\Haight\Desktop\kundalini-spines-spine-ui`.
- Session start `04f5a9a`; end **`8de82b2`**, pushed, working tree clean,
  local and remote identical (`0 0`).
- `main` = `origin/main` = **`13083d9`**, untouched. No PR opened.
- Eleven commits, plus `b50f636` which is the owner's own upload of the
  reference image. **Zero production files modified** — verified by diffing
  `index.html`, `about.html`, `archive.html`, `music.html`,
  `transmissions.html`, `css/spine-bg.css`, `css/star-bg.css`,
  `css/tokens.css`, `css/base.css` and `js/spine-bg.js` across the whole
  session range. All empty.

---

## What shipped

1. **`css/wordmark.css` + `js/wordmark.js`** — the two-line lockup. Two stacked
   lines justified to a shared measure, a registration rule with tick marks and
   a centre reticle between them, a letterpress grain, and two arrivals.
2. **`assets/hero/wordmark-grain.png`** (117 KB) — the grain, extracted from the
   owner's reference. See finding 8.
3. **`assets/reference/wordmark-teko-bold-letterpress.png`** — the owner's
   reference, renamed to project conventions from
   `reference/Teko Bold Kundalini Spines Into Font.png`.
4. **`type-specimen-lab.html`** — four candidate faces as the real lockup, over
   the real footage, with a load badge that is a width comparison rather than
   `document.fonts.check()`.
5. **`entrance-lab.html`** — webfont links, the wordmark, a ten-field tune panel
   with a clip scrub and transport, the arrival cue, and a `fonts.ready` gate on
   the shutter.
6. **Shutter font-gate fixes** — `css/shutter-text.css`, `js/shutter-text.js`,
   `shutter-lab.html`. See finding 9.
7. **Navigator cleanup** — `css/spine-ui.css`, `js/spine-ui.js`,
   `spine-lab.html`, `hero-scrub-lab.html`. Closes 23's items 4, 9 and 10.
8. **Coil crossover blend, timing controls, and the owner's settled run** —
   `js/spine-coil.js`, `coil-lab.html`.

---

## The wordmark, as settled

Owner's values, read off the tuner against the live clip. They are in
`css/wordmark.css` and mirrored as the tune panel's defaults, so RESET is a real
revert.

```
--wm-font: "Archivo", "Arial Narrow", sans-serif;   --wm-weight: 900;
--wm-stretch: 62%;        --wm-track: 0.046em;
--wm-measure: 0.585;      --wm-bottom: 34.5%;       --wm-shift: 0px;
--wm-gap: 0em;            --wm-rule-on: 1;
--wm-grain-to: 180px;     --wm-grain-floor: 0.25;
--wm-snap: 7px;           --wm-snap-ms: 150ms;
```

**Arrival:** `WM_ARRIVAL = 'snap'`, fired at `WM_CUE_AT = 76/24` = **3.1667s**.

**Tracking is POSITIVE and that is deliberate.** The reference has letters
nearly touching, which suggested tightening. At this measure Archivo 900/62 is
heavy enough that tightening closes the counters and nine characters of
KUNDALINI stop reading. The reference gets away with it because it is printed at
roughly three times this cap height.

---

## The coil, as settled

In both `js/spine-coil.js` DEFAULTS and `coil-lab.html` tokens, because
`entrance-lab.html` declares no coil variables and therefore takes the module
defaults. Keep them in step.

```
turns 3.5   beam 0.10   hug 1.00   split 0.58   clear 9   far 0.64
blend 0.60  travel 2300ms   hold 0ms   fade 620ms
```

`hold: 0` — the coil begins dissolving the instant the wavefront reaches the
crown. The pause that used to sit there read as the serpents waiting.

---

## Measured findings (date + method, so nobody re-derives them)

All measured Aug 10–11 2026 via Playwright against `scripts/serve.py`.

1. **`document.fonts.check()` LIES.** It returned `true` on a page with
   `document.fonts.size === 0` and no webfont link. The reliable probe is a
   rendered width compared against a family that provably does not exist.
   `js/wordmark.js` implements it as `isLoadedOn(el, family)`, measuring a span
   that carries the element's own computed font properties.

2. **`font-stretch: 62%` is the MATCH KEY for Archivo's compressed cut**, not
   decoration. Google serves it as three `@font-face` blocks all declaring
   `font-weight: 900; font-stretch: 62%`. A rule asking for weight alone matches
   none of them and falls back silently to something ~20% wider.
   `font-variation-settings: "wdth" 62` is **not** a substitute — it sets the
   axis on a face already selected and plays no part in selecting one. A canvas
   probe that omits the stretch descriptor also reports FALLBACK for a font that
   loaded perfectly well; that happened here and was briefly believed.

3. **The clip is 24.000 fps** (frame duration 0.04167s, read from
   `requestVideoFrameCallback`'s own `mediaTime` deltas).

4. **The messengers→lattice CUT is frame 100, t = 4.1667s exactly.** Scanning
   4.10–4.25 at 0.01s, frames 4.14/4.15/4.16 are pixel-identical and 4.17 jumps
   37.4 mean levels.

5. **The right messenger's hand is fully raised across frames 74–77**
   (glove-top y 262–263), descending by f78. Frame 76 chosen, mid-plateau,
   fingers fully spread. **Frames 58–61 report a HIGHER value (y 230–233) and
   are a false peak** — that is the measuring window's own top edge, clipped by
   the messenger's shoulder while he is still far enough away to sit inside it.

6. **The face band is y 115–355 at 1440×900** across the whole time the
   messengers are present (t=0 to ~4.17s), sampled every 200ms. This is why the
   lockup is anchored low. By frame 76 they are close enough to camera that
   their heads sit **above** the lockup, which is why landing the arrival a
   second before the cut did not reintroduce the face problem.

7. **`url()` resolves against the STYLESHEET, not the document** — 23's finding
   8, hit again. `css/wordmark.css` needs `../assets/hero/wordmark-grain.png`.
   A missing **mask** fails even more quietly than a missing background:
   `mask-image: none` simply means no mask, so the type renders clean and looks
   merely untextured rather than broken.

8. **The grain could not be extracted by brightness.** In the reference, ink and
   paper are the SAME brightness — mean **224.8** inside the K stem against
   **227.2** on bare background. What separates them is texture: local standard
   deviation **15.2** inside ink, **0.7** outside. The glyph mask is therefore a
   variance mask, morphologically **closed** to fill the smooth patches inside
   strokes that would otherwise read as holes and erode away to nothing. The
   tile is quilted from 12 clean 32×224 strips, each normalised to a common mean
   and contrast, butted with **stochastic** seams and wrapped the same way.
   Unnormalised strips banded into corduroy; linear cross-fades averaged two
   speckle fields into soft grey columns, halving contrast at every seam.

9. **`.sh-hold` was declared only in `shutter-lab.html`.** The class is the
   shutter's font gate; the rule was never in `css/shutter-text.css`.
   `entrance-lab.html` applied it — with a comment describing the protection it
   provides — and computed **opacity 1**. Measured with fonts delayed ~3s and
   autoplay refused so the 1400ms watchdog fires: the entrance built its slat
   grid at **t=2977ms on the FALLBACK face** (pitch 8 against the real 9.2, cap
   40 against 45, boundaries 2–6px low, up to 0.67 of a slat) and ran the whole
   reveal in Arial Narrow. `shutter-lab.html` under identical conditions built
   zero slats and waited. Now fixed and re-verified: identical grid
   (10 / 20.5 / 29.5 / 38.5 / 47.5) whether the font is delayed or not, the
   delayed run simply building at 12971ms instead of 2960ms.

10. **`metricCache` outlived the face it measured.** The key was the CSS font
    shorthand, which is byte-identical before and after a webfont arrives — it
    is the declaration, not the face selected from it. One build before the font
    landed poisoned every later build for the life of the page. Key now includes
    a measured probe width.

11. **`transition` is not inherited**, and every transition in
    `css/wordmark.css` lives on a child of `.wm`. Writing
    `element.style.transition = 'none'` on `.wm` suppresses nothing — the
    module's `settle()` did exactly that and faded the lockup up over **1265ms**
    while reading, in code, as an instant jump. Fixed with an `.is-instant`
    class, applied → flushed → removed.

12. **The coil's crossover blend, geometrically.** `x = CX + rx·cos(θ)`, so
    `sin θ = 0` means `|cos θ| = 1`: the ring's extreme left and right. **The
    50/50 handoff sits there and is `--coil-clear` units outside the silhouette
    by construction**, so it is visible on both canvases at every height and at
    every blend width. The blend's TAILS do go behind the bone — at blend 0.60
    the arc spans `|cos| > 0.8`, innermost reach `0.8·rx = 0.8·half + 7.2`,
    inside the silhouette at all 61 sampled rows, worst **27.8 units in at
    y=1738**. That is harmless: only the BACK canvas is occluded there, and the
    far strand passing behind the bone is the entire point of the depth split.
    There is no cliff, only diminishing returns. Slider ceiling raised to 0.9.

13. **Grain floor, measured against a no-mask control.** Floor 0 renders at
    **84.2%** of the unmasked ink — so the grain removes 15.8%, the same 10–15%
    band the reference print sits in — climbing monotonically to exactly
    **100.0%** at floor 1.0.

14. **The registration snap.** KUNDALINI +7.00px x / −1.82px y, SPINES
    −5.74px, the rule +9.80px, all returning to exactly 0.00. **Back in register
    by 68–69ms**, not the nominal 150 — the easing front-loads the correction,
    so the visible movement is over inside two frames at 24fps.

15. **Coil performance, first ever measured.** `draw()` 0.21ms; 0.26ms with the
    blend. `shadowBlur` contributes nothing measurable.

16. **The entrance plays a SMALLER shutter gesture than `shutter-lab.html`.**
    Its headline line box is 394.44px against shutter-lab's 466.84px, so its
    longest slat throw is 209.1px against 247.4px — **15.5% less travel**. Not a
    grid error; the amplitudes are fractions of the line width. But what was
    judged on the lab is a bigger gesture than what the entrance runs.

---

## Do not do these

Everything in 19–23's lists still stands except where corrected above.
Additionally:

- **Do not pause the hero video to measure it without resetting the settle
  classes.** Pausing is exactly the condition the 1400ms watchdog reads as
  "autoplay refused", so it settles the page, fades the video out and reveals
  `css/star-bg.css` — which is near-identical to the clip's closing nebula by
  design. The result looks like the video is still there while showing a
  different layer. It cost a full measurement pass this session and produced a
  confident, wrong conclusion ("the messengers leave at 2.5s"). The `?tune`
  panel sets `tuneHold` for exactly this reason.
- **Do not trust `document.fonts.check()`.** See finding 1.
- **Do not declare a module's classes only in one lab.** See finding 9.
- **Do not use percentages for `mask-size` on the wordmark lines.** The two
  lines have very different box widths (533px and 352px) because justification
  scales the ink, not the box, so a shared percentage renders the grain at two
  physical scales — one lockup wearing two textures. Absolute lengths only.
- **Do not launch many headless Chrome instances at once.** This session made
  the owner's browser unusable doing it, including running two background agents
  concurrently. The coil was suspected and exonerated at 0.21ms.
- **Do not "tidy" the wordmark's settled values toward rounder numbers.** The
  halves and thousandths are where the owner left them.

---

## What is deliberate, so nobody "fixes" it

- **The wordmark's tracking is POSITIVE** (+0.046em) even though the reference
  is tight. See the wordmark section.
- **`--wm-grain-floor: 0.25`.** 0 lets the vertical striations read as
  scan-lines once the clip reaches the nebula; 1 removes the grain entirely.
- **The coil's `hold: 0`.**
- **The coil's `blend: 0.60`**, which sits above what an earlier comment in the
  file wrongly called the safe ceiling.
- **The ink-development arrival is fully implemented in `js/wordmark.js` and
  unused.** `WM_ARRIVAL` switches between `'snap'`, `'cut'`, `'develop'` and
  `'none'`. It costs nothing to keep and the tuner can play all three.
- **The `?tune` panel always shows the lockup**, regardless of arrival. Placement
  and timing are separate jobs; a lockup that does not exist for the clip's
  first 3.17s cannot be positioned.
- **Skip disarms the arrival cue.** It seeks past the cue, so the next presented
  frame would satisfy it and the lockup would flash on ~120ms before the shutter
  fades it out.
- **The navigator's axis markers are lab-only chrome now.** `entrance-lab.html`
  — the intended `index.html` replacement — drops them, so this session's
  "CONTINUE / ARROW KEYS" copy fix landed on a page that may never ship. Flagged
  rather than decided.

---

## Verified vs. asserted

**Verified by tooling, and looked at:**
- Git isolation, eleven commits, push parity, `main` at `13083d9`, and zero
  production files touched across the whole session range.
- The arrival landing on frame 76: last hidden frame 3.1250, first visible
  3.1667, **delta 0.00 frames**, nothing visible across the preceding 75 frames.
- Skip not flashing the lockup: 0.00 opacity across 14 samples.
- The snap's displacement, opposition and return to register.
- The shutter font gate under a reproduced 3s font delay with autoplay refused.
- The shutter's five-band grid on live pixels, both pages, within 0.9px.
- The grain extraction, the grain floor ladder, the tile's seamless 3×3 tiling.
- The coil's timing controls composing the gesture: 200/60/160 measured 423ms
  against a 420ms predicted sum.
- The navigator overlap: was 62.40px horizontal and fully nested, now clear by
  254.52px, with the entrance's markerless hint still centred at exactly 720.
- Zero console errors on `entrance-lab.html`, `spine-lab.html`,
  `hero-scrub-lab.html`, `coil-lab.html`, `type-specimen-lab.html`.

**Asserted / NOT verified:**
- **The `metricCache` fix is defence-in-depth, not end-to-end verified.** The
  font gate now prevents the poisoned build from happening at all, so the
  poisoning could not be reproduced to prove the new key clears it. What was
  confirmed is that the new key does not regress normal operation.
- **No mobile pass.** See "Still open" 1.
- **The production host has still not been checked for Range support** — 23's
  item 7, untouched.
- **The scramble's per-frame DOM writes are still untimed.**
- **`prefers-reduced-motion` is coded throughout the wordmark and tested only on
  the scramble**, unchanged from 23.

---

## Still open

1. **375px: the entrance headline breaks.** `.ent__copy` has
   `padding: 0 var(--space-24, 24px)` and `--space-24` is `6rem` = **96px**
   (confirmed: computed padding `0px 96px`). That leaves a 183px column,
   "Knowledge Hidden" measures 215.14px and wraps, and `build()`'s `wrapped`
   guard fires for line 1 only — 16px equal slices against line 2's 5.2px ink
   pitch. It reads as a solid amber block over an overlapping third row.
   `shutter-lab.html` at 375 gives the same headline a 327px column and is fine.
   **Pre-existing, not caused by the font work.** Belongs with a real mobile
   pass, which the entrance has never had.
2. **The entrance's shutter gesture is 15.5% smaller than the one judged on
   `shutter-lab.html`.** Finding 16. Decide whether to widen the entrance's
   line box or re-judge the amplitudes there.
3. **Layer 4 — confirm the production host answers 206** before this replaces
   `index.html`. Unchanged from 23.
4. **Layer 2 and 5 of the Range plan** — a loud console warning when `seekable`
   is empty, and a regression check driving Skip under both servers.
5. **The Music immersive wrap** — cards over the reactive sky, spine column off,
   music playing, background animating. Unchanged from 23.
6. **`spine-ui-wire.png` → webp.** 626 KB, and now in the entrance flow.
7. **Mobile**, **tuner integration**, **Archive wrap** — unchanged from 19.

**Closed since 23:** the entrance being watched in motion; the wordmark's face,
position, grain and arrival; the coil's performance question; the navigator's
scroll copy and its hint overlap; `NAV_NODES`; six dead tokens; the redundant
ring rule; the `70 * progress * 4` stub; and the shutter's font gate, which was
not on 23's list because nobody knew it was broken.

---

## Housekeeping

`scripts/serve.py` remains the serving command. Reference recordings for the
shutter and scramble live in a prior session's scratchpad and remain disposable.
The wordmark's own reference is now committed at
`assets/reference/wordmark-teko-bold-letterpress.png` and should stay — the
grain tile is derived from it and would need it again to be rebuilt.

---

## Starting the next V2 chat

Attach this file (`V2HANDOFF 24.md`). `23` still owns the entrance redesign and
the Range server; `21` owns the coil's original reasoning; `19` owns the
navigator architecture. The new session needs folder access to
`C:\Users\Haight\Desktop\kundalini-spines-spine-ui` (the V2 worktree, **not**
production `kundalini-spines`) and should confirm `feature/spine-ui-v2` before
editing.

**Serve with `python scripts/serve.py`, not `python -m http.server`.**

A good opening message:

> Here's the latest V2 handoff for Kundalini Spines (Spine UI V2 branch). I want
> to do the mobile pass on the entrance this session — the headline breaks at
> 375px.
