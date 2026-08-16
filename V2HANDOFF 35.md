# Kundalini Spines — Spine UI V2 Handoff 35

**Date:** August 16, 2026

Seventeenth handoff of the **Spine UI V2** track (branch `feature/spine-ui-v2`).
`34` owns the cloud sky, the film rows and the true-alpha spine render. The plain
`HANDOFF 1`–`19` series documents the dormant production site on `main`.

---

## The one-line version

**The four `/?tune` panels are now one tabbed panel; the film-row videos got a
three-layer atmosphere treatment (feather mask, glow field, foreground smoke)
built by four agents and wired into index.html behind a `LIVE = false` flag; and
34's open item 2 turned out to be a measurement error, not a regression.**

---

## Corrections to earlier handoffs

- **34's open item 2 is CLOSED, and it was backwards.** "The merch spine render
  is much narrower than the version the owner approved — 143px vs ~242px"
  compares ELEMENT BOX widths, not spine widths. Measured Aug 16 2026 (alpha
  bounding box over 8 frames of each render, both at the 702px height the page
  gives them at 1440x900):

  | | element box | spine on screen |
  |---|---|---|
  | old (colorkey, crop 530x1540) | 241px | **104px wide, 575px tall** |
  | new (true alpha, crop 264x1296) | 143px | **122px wide, 682px tall** |

  Only 43% of the old box was content; the rest was transparent margin the
  colorkey could not trim. The new crop is 86% content. **The shipping render is
  17% wider and 19% taller on screen than the one the owner approved.** Nothing
  regressed. The owner saw the comparison plus three clamp options and said
  "leave it for now" — `height: clamp(540px, 78vh, 780px)` in `css/spine-doc.css`
  stays. 88vh was the measured alternative if presence is ever wanted (box 161px,
  spine 138px, keeps breathing room); 96vh crowds the sticky nav. **Do not
  re-raise this on the strength of the 143-vs-242 number.**
- **Every panel-position note in 30–34 is stale.** "js/spine-bg.js owns
  bottom-right", "the torch owns bottom-left", "no fourth corner" — there are no
  corners any more. See THE MERGED TUNER below.
- **`js/clouds-sky.js`'s "tuned only in clouds-lab.html" is stale.** The sky is
  tunable on the real page now.

## Git state

- Branch `feature/spine-ui-v2`. Session start `c755a8e` (handoff 34).
- New files: `js/tune-panel.js`, `js/filmrow-atmos.js`, `js/filmrow-atmos-fg.js`,
  `css/filmrow-atmos.css`, `css/filmrow-atmos-fg.css`,
  `scripts/make-filmrow-mask.py`, `assets/atmos/filmrow-mask-{01,02,03}.png`,
  `filmrow-atmos-lab.html`, `filmrow-fg-lab.html`.
- Modified: `index.html`, `about.html`, `archive.html`, `connect.html`,
  `merch.html`, `transmissions.html`, `js/spine-bg.js`, `js/site-footer.js`,
  `css/site-footer.css`, `js/clouds-sky.js`.
- `main` untouched. No PR.

## THE MERGED TUNER — read this before touching any panel

`/?tune` had grown a panel per subsystem, each with its own fixed box, its own
gate, its own hide button, and a comment about colliding with another. At
1440x900 every corner was used, which is why the film-row controls had nowhere
to go.

**`js/tune-panel.js` is now the shared shell** and is loaded FIRST on all six
pages that carry a tuner (index, about, archive, connect, merch, transmissions).
One panel on the right edge, a wrapping tab bar, `<details>` sections that
remember open/closed, one hide-to-chip button. Tabs in script order:
**Spine · Torch · Film · Sky**.

```js
KSTunePanel.on                                  // true at /?tune
KSTunePanel.tab(id, label, tip)                 // -> body, or NULL off /?tune
KSTunePanel.section(parent, id, label, openByDefault)
KSTunePanel.slider(parent, def, get, set)       // -> paint()
KSTunePanel.toggle(parent, text, get, set)      // -> paint()
KSTunePanel.row / button / note / copy
```

- **A tuner that loads before the shell renders nothing, silently.** Keep
  `tune-panel.js` first.
- **Do not give any tuner its own fixed box, panel chrome, or hide button
  again.** That is the whole point.
- **Section ids must be unique page-wide** — they share one store. Prefixes in
  use: `spine-`, `torch-`, `film-`, `sky-`.
- The shell owns the gate, read as data via `URLSearchParams`. `js/spine-bg.js`'s
  old gate was `/[?&]tune\b/` — exactly the regex shape this project has been
  bitten by, where a generator rewrote `\b` into a literal backspace. It is gone.

### Persistence — what survived the merge

Checked on every tab the same way (clear the profile, snapshot every control,
dial one hard, reload, Reset, reload). **A clean profile IS the committed state**,
which is what makes the check independent of where a value happens to live.

| tab | controls | key | dialled value survives reload | Reset restores committed |
|---|---|---|---|---|
| Spine | 46 | none (by design) | **no — correct** | no Reset button (never had one) |
| Torch | 3 | `ks.footerTorch` (unchanged) | yes | yes |
| Film | 15 | `ks.filmrowAtmos` (new) | yes | yes |
| Sky | 14 | `ks.cloudSky` (unchanged) | yes | yes |

- **Spine never persisted values and still does not.** Its only localStorage was
  booleans for group open/closed. The value round-trip has always been Copy CSS
  into `css/spine-bg.css`. Copy CSS was A/B'd byte-for-byte against the committed
  file — index 1282 chars, about 1075 chars, identical. Nothing was orphaned.
- Spine's 47 sliders still initialise from `getComputedStyle`, 0 mismatches
  across 47 fields on index and 40 on about.
- **Film reads its defaults from the CSSOM, not computed style** — under reduced
  motion the computed `--fr-glow-resp` is 0, and Copy would have rewritten the
  file's 0.35 to 0.
- One cosmetic casualty: spine's group open/closed moved from `ks-tune-<title>`
  to `ks.tunePanelSec.<id>`, so one session's remembered sections revert once.
- `ks.footerTunePanel` (added and removed the same day) may sit inert in the
  owner's browser. Nothing reads it. Deliberately not cleaned up in code.

## THE FILM-ROW ATMOSPHERE — three layers, not live yet

The two film-row videos sat as hard rectangles on the nebula. Three layers now
dissolve that, built to the owner's spec by three agents.

**`js/filmrow-atmos.js` decides whether any of it applies**, via
`var LIVE = false;` plus a `LAYERS = {feather, glow, fg}` literal. **`LIVE = false`
ships.** At `/?tune` the layers apply so they can be judged on the real page; a
visitor sees nothing — verified: no classes, `mask-image: none`, no `::before`,
no canvas, no listeners, overflow 0. **Going live is that one line.**

**1. Feather** — `scripts/make-filmrow-mask.py` bakes multi-octave value noise
driving an *erosion* of the edge distance field (`eff = e·(1 + wobble·n·taper)`),
multiplicative so it pins to 0 at the true border. Three seeds in
`assets/atmos/`, 768x640 (exactly 1.2:1), ~40KB each — one baked mask fits every
width because `.ksd-filmrow__media` pins `aspect-ratio: 1.2`.
- `reach 1.8` is the cloud-vs-rectangle dial: the 50%-alpha contour walks
  0.27–1.07 of the band, against 0.29–0.76 at reach 1.0 (a rounded rectangle).
  At 2.8 whole corners vanish.
- `NOISE_SIGMAS 2.2` because raw fbm has std 0.106 and never nears ±1, so wobble
  did nothing across 0.6→2.2.
- Sharpest top-edge luminance step **61.7 → 4.2** (15x); corners 125/148 → 5.8/7.7;
  crisp core max diff 1 of 255. Lab-vs-baked parity: **0 of 255 across all
  491,520 pixels.**
- **`depth` and `softness` are BAKE-TIME**, not runtime. They exist only in the
  lab (which regenerates in JS) and in the Python script. The Film tab prints the
  bake command instead of pretending to own them.

**2. Glow** — nine soft radial lobes per clip, colours sampled from 12 ffmpeg
frames each, clustered per 4x4 cell on top-quintile-luminance pixels. black-tide
has zero saturated lit pixels; spine-frequency has one warm source (327px, the
red rack readouts) and gets one red lobe.
- **`inset: -90%` (2.8x the clip) is headroom, not the field size**, because a
  gradient is clipped by its element box. A correctly-sized box cut all nine
  lobes off mid-falloff. Do not "fix" it.
- Stop ladder `1/.62/.28/.07/0` — terminating slope 0.29x peak, against 1.35 for
  a three-stop cut.
- Intensity rides `opacity`, NOT `calc()` in the alpha slots — the latter
  repainted nine gradients every scroll frame.

**3. Foreground** — `js/filmrow-atmos-fg.js`, a standalone module:
`KSFilmrowFG.attach(el, opts) -> {setOptions, getOptions, destroy}` plus
`.defaults`. Ships at intensity 0.70, spill 56px, reach 0.30, parallax 0.18,
wisps 14, motes 90, edges top 1 / right 0.85 / bottom 0.45 / **left 0** (left
faces the copy column). Procedural, no Higgsfield credits spent.
- **The centre is lifted by exactly 0**, not "a little", even at full strength,
  and the darkest pixel anywhere is 0 — screen cannot subtract, so no setting can
  put grime on the footage. Outside the box, +168 max: the material really does
  cross.

**Scrub proven unaffected** for all of it: identical scroll sequences with layers
on and off, worst `currentTime` divergence 0.0151s against the scrub's own
1/48s (0.0208s) write threshold.

## Bugs found by measuring, all fixed

1. **The glow put 499px of real horizontal scroll on the page** (241px at 390) —
   a trackpad swipe slid the whole site sideways. Invisible in a screenshot.
   **`body { overflow-x: clip }` — the line about.html uses — does NOT fix it:**
   body computed to `clip` and `scrollBy(500,0)` still moved to scrollX 499.
   Fixed with **`main { overflow-x: clip }`** in index.html's head, plus the same
   rule injected by `overflowGuard()` while the glow class is applied so the
   effect travels. `main` because it is the narrowest scope that is still exactly
   viewport-wide (1440 at left 0); `.ksd-doc__col` and `.ksd-filmrow` also stop
   it but start at x=136 and would cut visible glow. Clip, not hidden — hidden
   makes a scroll container and takes the sticky ancestry with it.
2. **`.ks-tune__toggle` was (0,1,0) and lost to `.ks-tune label` (0,1,1)**, so
   every toggle in every tab rendered as a stacked column. This is the third
   time this exact trap has landed in this codebase and the file documented it
   twice already. Fixed as `label.ks-tune__toggle`.
3. **`window.__sfTorch` had always published `null`** — assigned at the end of a
   closure that runs before `torchCtl` exists. Pre-existing; now at module scope,
   where the neighbouring comment always claimed it was.
4. **`STORE_KEY` hoisting in `js/filmrow-atmos.js`** — declared next to the panel
   but used by `restore()` earlier, so `getItem(undefined)` returned null and
   tuning silently stopped surviving reloads. Found by testing a reload, not by
   reading.
5. **A false measurement was nearly committed as a comment.** `html { overflow-x:
   clip }` was recorded as collapsing the cloud canvas to 0x0. It does not.
   `js/clouds-sky.js` builds a hidden `src` canvas BEFORE the visible `out` one,
   so `.ks-cloud-sky canvas` selects the hidden one. The visible canvas is
   1440x900 in every condition. **If you measure that layer, select the second
   canvas.** Both comments corrected.

## What is deliberate, so nobody fixes it

Everything in 30–34's lists still stands, except the panel-position notes.
Additionally:
- **`LIVE = false` in `js/filmrow-atmos.js`.** Not an oversight — the owner has
  not judged the look yet.
- **Three different scroll mappings on one element, on purpose.** The scrub's own
  `(p - 0.10) / 0.70` window in `js/spine-doc.js`; a second copy of it inside
  `js/filmrow-atmos-fg.js`; and the glow's response, which uses
  **distance-from-viewport-centre instead**, so reflected light peaks when the
  video is in front of you rather than when the clip runs out. They peak at
  different scroll positions. Flagged under a "DELIBERATE — DO NOT FIX" heading
  in `css/filmrow-atmos.css`. If the scrub window is ever retuned, the fg copy
  needs the same change; the glow does not.
- **Merch spine stays at 78vh.** See the correction at the top.
- The `data-fr-*` attributes on the two figures in index.html are inert on their
  own; the CSS only acts once `.has-fr-feather` / `.has-fr-glow` are present.
- `filmrow-atmos-lab.html` and `filmrow-fg-lab.html` are kept — the lab is still
  where `depth`/`softness` are explored and where wild values are safe.

## Do not do these

Everything in 19–34's lists still stands. Additionally:
- **Do not give a tuner its own panel, gate, or hide button.** Register a tab.
- **Do not load a tuner before `js/tune-panel.js`.**
- **Do not shrink the glow's `inset: -90%`** to fix overflow — clip an ancestor.
- **Do not use `body { overflow-x: clip }` for this** — measured, it does not work.
- **Do not re-raise the merch spine width** on the 143-vs-242 number.
- **Do not raise the glow's intensity through `calc()` in alpha slots** — opacity.
- Still: no `shadow` above 0 in the cloud OPTIONS, no scroll-linking the cloud
  field, no `data-ksd-section` on the hero, `-g 4` on every scrubbed clip, no
  Python text-mode writes to JS/CSS/HTML.

## Verified vs. asserted

**Verified by tooling and looked at** (Aug 16 2026, Playwright/Chromium over
`scripts/serve.py`, 1440x900 unless noted):
- Merged panel: four tabs, zero pairwise overlap, hide chip collapses and
  restores on each, toggles render as rows, sections persist, no console errors,
  no horizontal overflow.
- Persistence table above, every row.
- Visitor load: no panel, no `has-fr-` classes, `mask-image: none`, overflow 0,
  cloud layer alive.
- Feather and glow: the numbers above, plus before/after pairs on both rows,
  looked at.
- Foreground: centre lift 0, darkest pixel 0, scrub deltas, 11 widths 1600→320.
- Cloud sky tab drives the shader: opacity slider produced a **+15.2 signed
  lift** against the sky (positive = lightening, the metric an earlier pass got
  wrong by using absolute difference).

**Asserted / not verified:**
- **The owner has not judged the film-row atmosphere on feel.** This is the
  gating question for `LIVE`.
- Rail feel, cloud drift, film-row scrub windows — carried from 32/33/34, still
  the owner's eye.
- Safari, real phone hardware: untested, unchanged.

## Still open

1. **Judge the film-row atmosphere and decide `LIVE`.** Open
   `index.html?tune`, Film tab, toggle the three layers. `LAYERS` allows shipping
   static paint (feather + glow) without the animating canvas if the foreground
   is not wanted.
2. **The frame-budget decision.** Median frame time is 2.1ms with layers on or
   off, but p90 goes 2.2 → 4.1ms and p99 to 16–23ms, with 7–12 frames over 16ms
   per scroll burst. **Every spike lands in the first 1–8% of the scroll and then
   nothing for the remaining 92%** — the layer being rastered and promoted when
   scrolling starts, once per burst, not a cost spread through the scroll. Two
   levers, **neither applied on purpose**: shrink the box (reintroduces the
   clipped-lobe cliff) or `will-change: opacity` (permanent memory cost). Owner's
   call.
3. **Three clips remain** for film rows: `rain-transmission-rooftop`,
   `last-train-below`, `the-black-archive` (folder: Desktop\Spine Home Photo and
   Video, all present and probed). The `kundalini-scrub-video` skill owns the
   pipeline; each is an encode plus markup. Owner names the section.
4. Cloud `cover` dial if the owner reports bare sky (table in `js/clouds-sky.js`).
5. The astral scrim, if ever revived — still parked with its banner.
6. music.html still black; stale amber-era `?tune` TIPS prose; the two missing
   trivia files; the inherited pile (webmanifest favicons, PURCHASE, lab
   staleness, deploy/DNS, Range layers, Archive wrap, messengers→webp).

---

## Starting the next V2 chat

Attach this file. The working folder is
`C:\Users\Haight\Desktop\kundalini-spines-spine-ui` on `feature/spine-ui-v2`.
Serve with `python scripts/serve.py`, browse `http://localhost:8000` — never
`file://`, never `python -m http.server`.

> Here's the latest V2 handoff. The four tuner panels are merged into one tabbed
> panel at /?tune, and the film-row atmosphere (feather, glow, foreground) is
> wired into the home page behind `LIVE = false`. Likely next: judging that look
> and deciding whether it goes live, the frame-budget call, or the remaining
> three clips.
