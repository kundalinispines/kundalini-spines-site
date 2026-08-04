# Kundalini Spines — Session Handoff 7

**Date:** August 4, 2026
**Supersedes:** nothing. `HANDOFF 3`, `4`, `5` and `6` all still own their material and remain required reading. This session touched the front page's visual layer and two files those handoffs describe.
**Status:** A scroll\-charged spine background is built, tuned and live on `index.html`. A tuning panel ships behind `?tune`. The site still is not served anywhere — Pages is off and `kundalinispines.com` still does not resolve. Nothing this session changed what a visitor sees, because there are still no visitors.

* * *

## Corrections to earlier handoffs

**1\. HANDOFF 3's headless warning is stronger than it reads.** It says headless Chromium "has no GPU, so it cannot reproduce raster problems at all." This session that warning was the difference between two wrong answers and one right one — see "The card\-shadow blob" below. Treat it as: *any* visual defect the owner reports and the assistant cannot measure should be assumed to be a real\-hardware compositing effect, and bisected on the owner's machine rather than reasoned about.

**2\. `js/track-experience.js` had a pre\-existing defect.** The card shadows were `rgba(0,0,0,...)` on a `#050505` page — they painted *below* the background. Invisible on flat black, and the source of a large soft blob once anything lit sat behind the cards. Not mentioned in any previous handoff because nothing lit had ever sat behind them.

**3\. `.track-experience` had a layout defect that only appears on tall displays.** `min-height: 100svh` with `justify-content: center` centred its \~1044px of content, so any viewport taller than that split the surplus above and below — about 123px of dead space between the hero video and the carousel on a 1290px window. At 900px tall it never triggers. Fixed.

* * *

## What changed this session

| Area | Before | Now |
| --- | --- | --- |
| Front\-page background below the hero | flat black | scroll\-charged spine column, `#tracks` to the footer |
| Artwork | — | `assets/hero/spine-column-moonlight.webp`, 1536×2752, WebP q84, 157 KB |
| `css/spine-bg.css`, `js/spine-bg.js` | did not exist | the layer, plus the tuning panel |
| `index.html` | — | **two added lines** — one stylesheet link, one script tag. No markup restructured |
| Card shadows in `track-experience.js` | `0 81px 118px rgba(0,0,0,0.62)` \+ a second layer | `none` |
| `.track-experience` sizing | `min-height: 100svh`, `justify-content: center` | `auto`, `flex-start` |
| `.newsletter` / `.footer` hairline rules | drawn | suppressed on `index.html` only |
| Tuning | — | 14 controls at `/?tune`, with copy/paste round\-trip |

* * *

## The spine layer

**Files:** `css/spine-bg.css`, `js/spine-bg.js`, `assets/hero/spine-column-moonlight.webp`. Loaded by `index.html` only.

The layer is a body child positioned in document space, built by JS from a single anchor (`#tracks`) and running to the bottom of the document. Two copies of the artwork are stacked: **DIM** always on, **LIT** revealed by a gradient mask whose stop tracks scroll. Only the mask moves — a scroll frame writes one custom property and triggers no layout.

### Measured constants — re\-measure if the artwork is replaced

- `--spine-frac: 0.2565` — the glowing column's width as a fraction of the artwork's. The shipped file measures 0.2572; the 0.3% gap is inside tolerance. **The CSS derives `background-size` from this**, so `--spine-w` means the column renders that wide, not the file.
- Artwork field reads `(6,7,7)`. Irrelevant in practice — see `mix-blend-mode: screen` below.
- **Hero video, frame 3** (the spine close\-up, the closest analogue): stroke core `#CDCCC6` at **7% saturation**, body `#A1A39D` at 3%, halo `#5E5E5A` at 2%, field `#091013`. **The hero is essentially colourless.** The first artwork was prompted for *"warm bone\-white and pale amber"* and came back distinctly orange — that was the entire colour mismatch. The shipped moonlight version measures `#EEF0F3` / `#9FA1A8` / `#5E626C`\: same luminances, cool instead of warm. **Do not re\-warm it.**

### Load\-bearing — read before editing

1. **`mix-blend-mode: screen` on `.spine-bg__art`.** This is what removes the visible lighter\-panel edge. `screen(page, black)` leaves the page untouched, so the artwork can only ever *add* light and its own black stops existing. It also means the artwork's black no longer has to match anything.
2. **No `z-index` on `.spine-bg`.** `z-index: 0` on a positioned element creates a stacking context, and the blend would then apply against that box's transparent backdrop instead of the page — silently restoring the grey rectangle. `z-index: auto` is deliberate.
3. **The DIM layer is masked with the complement of the charge front.** Under normal blending the lit copy simply covered the dim one; under `screen` they *add*, and the charged section comes out roughly twice as bright as tuned.
4. **`--mask-sides`.** `screen` stops the field darkening the page but cannot stop it *lightening* it, so the artwork's rectangle sat 1–2 levels above `(5,5,5)` — invisible on most screens, clearly visible on a good one in a dark room. The side fade removes it.
5. **`background-repeat: repeat-y`.** At 1440×900 one copy is taller than the region and never tiles, so this looks like a no\-op. At 390×844 the region grows while the artwork shrinks and **the bottom third of the page had no spine on it at all.**
6. **Charge is mapped over the SCROLL RANGE, not a reading line.** The obvious formula — progress \= `(readingLine - regionTop) / regionHeight` — can never reach 1, because the region ends at the document bottom and can never be scrolled past. It topped out at **81%** on a 1440×900 page and the last fifth of the column stayed dark forever.
7. **`ResizeObserver` on `document.body`.** The carousel fetches `tracks.json` and builds its cards *after* the script runs, changing document height. Without this the column stopped short of the footer on first paint and only corrected on the next resize.
8. **`.track-experience` background forced transparent.** It was opaque black and hid the column entirely behind the carousel.

### Scrims: attenuate, never paint

The section scrims use `backdrop-filter: brightness()`, not an `rgba` fill. **Matching the page colour is the wrong target** — the scrims were already exactly `#050505` and still read as a dark halo, because over a column at L 70 a near\-black overlay is far darker than its surroundings. Any opaque overlay has this problem at any colour. `brightness()` scales instead: page black is near the floor and barely moves, the lit column is pulled down hard, nothing is added.

They are **bands, not ellipses** — edge to edge, feathered only top and bottom. Measured, the radial version added *no detectable step* (steepest 20px gradient 14.6 against 18.8 for no scrim at all — it was *smoothing* the artwork), which is exactly why softening it never helped. The problem was that an ellipse is an object.

The feather needs long overhang (`-7rem`). At `-1.75rem` it produced a visible horizontal band edge — the same problem rotated 90°.

**There is no scrim on `.track-focus-panel`.** It had one and it was the blob behind the track cards: the panel's `margin-top` is `calc(--card-w * 1.425 - --arc-h - 4px)` \= **−288px** at the shipped card size, so its box already overlaps the carousel, and the feather overhang reached a further 112px up. The whole section gets one band instead.

* * *

## The card\-shadow blob — how this was actually found

Worth recording in full, because two confident, correctly\-measured answers were both wrong.

The owner reported a large soft dark blob around the centre card, "almost reaching to the cards on either side", plus a second beneath it. It survived turning **every** tuning slider to zero.

- **First answer:** the hero card's shadow was `0 81px 118px rgba(0,0,0,0.62)` plus a 44px layer — pure black on a `#050505` page, painting *below* the background at `(2,2,2)`. True, real, worth fixing. Not the cause.
- **Second answer:** recolour to `rgba(5,5,5,...)`, where `5` over `5` composites to exactly `5` at any alpha, making the shadow mathematically invisible on flat black while still grounding the cards against anything lit. Correct arithmetic. **False on real hardware.**
- **What settled it:** a leave\-one\-out bisect run by the owner in his own browser. Everything suppressed → blobs gone. Restoring the card shadows *alone*, with the spine layer hidden, brought them straight back. Colour\-managed GPU compositing does not round 5\-over\-5 to 5, and an 81px\-offset 118px\-blur shadow turns that error into a visible disc.
- **Fix:** `const shadow = 'none'`. They cost nothing — on a page whose background is flat black everywhere the cards sit, a shadow has nothing to fall on. Depth comes from the arch transform, the per\-card scale and the 1px border.

Every measurement available to the assistant said that region was within 1–2 levels of the page background. **The bisect on real hardware is the only thing that found it.**

* * *

## Do not do these

- **Do not reinstate the card shadows** in `js/track-experience.js` without reading the comment block there. If a lighter background ever appears behind the carousel, reintroduce them as a *small tight* shadow — a 118px blur is what made it read as a blob — and re\-check on real hardware, not headless.
- **Do not put `z-index` back on `.spine-bg`.** See load\-bearing \#2.
- **Do not re\-warm the artwork.** The hero measures 2–7% saturation. "Bone" alone reads as warm to an image model; the prompt bans amber three times for that reason. The full prompt and its rationale are in the session's `spine-artwork-prompt.md`.
- **Do not give `--spine-feather` a negative value.** A negative ramp length puts the gradient stops out of order and CSS clamps them into a hard line rather than mirroring the ramp. `--spine-bias` exists to move the ramp instead.
- **Do not judge the spine from a composite screenshot.** A luminance profile of the page is dominated by artwork content and will look like a change is working when it is not. Isolate the lit layer: set `--spine-dim: 0` and hide `main, .footer, .nav` (the tuner's "spine only" view mode does this).
- **Do not test scroll behaviour without disabling smooth scrolling.** `base.css` sets `html { scroll-behavior: smooth }`; every headless `scrollTo` measurement lands mid\-animation. Desktop reported 7% charge at the bottom of the page before this was caught.
- **Do not test the carousel without real cover art.** Without it `accentFromImage()` never runs and the dark `accentColor` fallback from `tracks.json` is used, which hides real contrast problems.

* * *

## Deliberate decisions

- **The tuning panel stays in the repo.** Owner's explicit decision, August 4 — more controls will be added as the project continues. It is gated behind `?tune`\: without the flag nothing below the guard executes, no markup is created and no listeners are attached. It is not debug scaffolding to be cleaned up.
- **`--spine-scrim: 0`.** The owner tuned the scrims off entirely. Text legibility over the column now rests wholly on the text\-shadows. Verified readable at 1440 and 390 with the shipped artwork; the thing to watch if the artwork ever gets brighter.
- **`--spine-feather: 10px` with `--spine-bias: -1`** is effectively a hard charge front rather than a ramp. Legitimate look, but it makes `bias` almost inert — raise `feather` first if a soft travelling front is ever wanted again.
- **The spine is on `index.html` only.** Transmissions, Archive and About are still flat black.
- **`assets/hero/spine-column.webp`** (the original warm version) is kept alongside the moonlight one for comparison. Nothing references it.
- **`accentFromImage()` was not touched.** The eyebrow and counter were fixed with `color-mix` toward white in `spine-bg.css` instead. That algorithm feeds the play button and sample bar on all 28 tracks, and the contrast problem exists only on this page.

* * *

## Legibility fixes made

- **`--track-accent` is clamped to L 55–66%**, chosen against flat black. Blue Pills resolves to `#3575E3` — **4\.66:1** on black, borderline for 13px tracked\-out mono and worse over a lit vertebra. Mixed toward white in `spine-bg.css`\: now **10\.7:1**, hue preserved.
- **`.label` eyebrows** (MUSIC / STAY CONNECTED / ABOUT) were `--text-muted` `#8F8F8F` — the least readable thing on the page over a lit vertebra. Caught only once the real artwork was in place; a desaturated stand\-in was not bright enough to expose it.
- **Ghost buttons** carry their own black at 72% plus a shadow, so they sit *on* the column rather than being cut out of it. Disabled state 0.45 → 0.62.
- **The footer** needed treatment, missed at 1440 because the column only crosses its middle third. At 390px the footer stacks straight onto the spine.
- **`.newsletter` / `.footer` hairline borders** removed on this page: with a continuous column running through, they read as page breaks.

* * *

## The tuning panel

`http://localhost:8000/?tune`. Fourteen controls; **Copy CSS** emits a `:root` block, and the paste box accepts any text containing `--spine-…` lines and clamps out\-of\-range values to each slider's own range.

```
width · dim · lit · glow · reach · shift · bias
flare · beam · scrim · puls lo · puls hi · puls ms
hide (view modes)
```

The header shows `css build N` from `--spine-build`, and a second line reports whether `track-experience.js` is current by reading the live card shadow. **CSS and JS cache independently** — this exists because "css build 10" was taken as proof the JS had reloaded, and it was not.

`hide` cycles view modes: normal page · cards ghosted 12% · cards hidden · cards \+ panel hidden · spine only · spine layer off · scrims off. **Cards ghosted** is the one for judging the glow against real card positions.

### Shipped values

```
--spine-w: 640px;        --spine-bias: -1;
--spine-dim: 0.31;       --spine-bloom: 0;
--spine-lit: 0.5;        --spine-beam: 0.1;
--spine-glow: 0.54;      --spine-scrim: 0;
--spine-feather: 10px;   --spine-pulse-lo: 0.26;
--spine-offset: -370px;  --spine-pulse-hi: 0.82;
                         --spine-pulse-ms: 5300ms;
```

**Mobile (≤600px) is inferred, not tuned** — `w 390 / lit 0.28 / dim 0.19`, scaled from desktop by the ratios the first pass used. The previous block was scaled off `--spine-lit: 1.06`, so against the tuned 0.5 it would have made the phone *brighter* than the desktop. **Re\-derive these whenever the desktop numbers change.**

* * *

## The playback pulse

While a sample plays, the charged column breathes between `--spine-pulse-lo` and `--spine-pulse-hi`; on stop it eases back to `--spine-lit` over 700ms.

`track-experience.js` already toggles `is-playing` on `.track-experience`. The spine layer is a body child, not a descendant, so no selector can reach it — `spine-bg.js` mirrors the flag onto `<html>` with a MutationObserver and CSS does the rest. **The sample is a detached `new Audio()` with no DOM node**, so there is nothing to listen to directly; patching its prototype would be worse.

It animates **`filter`, not the custom property**. A bare custom property cannot interpolate without `@property` registration, which would force the whole tuner through a typed property. Reduced motion holds it still.

**Testing note:** `getComputedStyle` reported a flat `brightness(0.48)` for the entire cycle, which looked like a failure. The rendered pixels oscillated 27.3 → 32.8. Computed style does not report interpolated animation values in that context — trust the screenshot.

* * *

## Attempted and reverted — the glow band

The lit region is a **half\-plane**\: everything above the charge front is lit, with no top edge. This is why the hero card always sits at the *edge* of the glow rather than inside it, and why `--spine-bias` saturates past about 2 — once the ramp clears the viewport everything visible is simply lit. Giving the zone a top edge would make it a band that `bias` could park on the card. **That is the open request.**

Attempted: two extra gradient stops above the front, guarded with `max()` so they could not cross the existing ones. The calc parsed correctly (verified in computed style) but had **no measurable effect on the rendered mask** — with the dim layer off and page content hidden, the lit layer still extended from the top of the viewport at every value from 4000px down to 80px. Cause not found. Reverted rather than shipped as a dead slider.

**Next attempt should use a second mask layer holding the band, intersected with the charge mask**, rather than more stops in the same gradient. Not tried.

* * *

## How this session verified things

Everything was checked in headless Chromium against a local server at 1440×900, 768×1024, 390×844 and under `prefers-reduced-motion`, plus 1440×1290 and 2530×1290 for the tall\-viewport gap. Card geometry was captured before and after the layout change and is byte\-identical at every breakpoint.

**Verified, not asserted:** the WebP encode (mean absolute difference **0\.888/255** against the source PNG); the artwork's spine fraction and centre; the hero video's colour, using the project's own `accentFromImage()` algorithm ported and validated first; contrast ratios before and after the accent fix; the seam at the artwork's edge (`(5,5,5)` continuous across the boundary); that the pulse actually moves, by pixel sampling; that the tuner does not run without `?tune`.

**Asserted, not verified:** that the moonlight artwork's *linework* looks right — the assistant could not fetch it from the Higgsfield CDN and judged the mechanics against a colour\-matched stand\-in until the owner saved the real file down. The mobile spine values. Everything the owner judged by eye.

* * *

## Still open

Carried forward, plus this session's.

- **DNS for `kundalinispines.com`** — unchanged, still the single blocker. Nothing on this site is reachable by anyone. Enable sequence in HANDOFF 5 under "Deployment"; do not enable Pages without the custom domain.
- **The glow band** — see "Attempted and reverted". The owner's most recent request and the top of the next session's list.
- **Pre\-existing mobile nav bug, unrelated to this work.** The closed menu panel is not fully off\-screen: `Archive` sits at y\=12 and `About` at y\=73, inside the viewport, bleeding through behind the fixed header **on every page**. Verified identical with `spine-bg.css` and `spine-bg.js` stripped out.
- **Side\-card blur is too heavy.** `track-experience.js` applies up to `blur(6px)` and `brightness(0.4)`, both multiplied by `BOX_K` (1.85). The owner observed the track art looks considerably better with filters off. Worth a pass.
- **The spine is on `index.html` only** — the other four pages are flat black, so the site reads as two different sites.
- **Mobile spine values are inferred**, not judged on a device.
- **`README.md` is badly stale** — predates HANDOFF 2, roughly half false. Now also omits `css/spine-bg.css` and `js/spine-bg.js`.
- **The earlier album is unacknowledged on the site** — nine YouTube videos, see HANDOFF 6.
- **The YouTube unit tests are not in the repo.**
- **Buttondown deliverability unverified** — still the highest\-consequence unknown.
- **Instagram and X are owner\-supplied, not verified.**
- **`explicit` is `null` on all 28 tracks;** streaming links all `null`; `data/releases.json` entirely `PLACEHOLDER`; download links and Stripe/Gumroad not started.
- **TikTok and Spotify accounts do not exist** — dead footer links by owner's decision.
- **Accent hue collisions** — may\-26th / blue\-pills, uzi\-fruit / the\-33rd\-floor.
- **Video takes** chosen by name\-matching; most tracks have 2–4.
- **May 26th's cover→video crossfade has still never been watched.**
- **The 885 MB masters folder is still backed up by nothing.**

### Housekeeping

`spine-bg-trials.html` and `spine-image-test.html` are this session's review harnesses — the SVG mockups and the standalone image test. Both obsolete now that the layer is on the real page; safe to delete. They join `raster-test.html`, `raster-test-2.html`, `transmissions-options.html` and `transmissions-option5-v2.html` in that category. The device bridge cannot delete files — move them to `_to_delete/` and delete by hand.

Higgsfield element IDs for new covers:
Messenger\-A `46229f47-2d2f-45f7-a578-8d169ca5fbb7`,
Messenger\-B `37f342de-2add-4f4c-bcc7-2aa3530676d3`

* * *

## The closing line, again

HANDOFF 5 and 6 both ended on *measure it, do not eyeball it*. This session earns a corollary.

Two of the three hardest findings — the card\-shadow blob and the stale\-JS misdiagnosis — were **wrong when measured correctly**, because the measurement was taken in an environment that could not exhibit the defect. HANDOFF 3 already warned about this and it still cost most of a session.

> Measure it. But know what your instrument cannot see.
