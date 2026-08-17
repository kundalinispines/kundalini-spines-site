# Kundalini Spines — Spine UI V2 Handoff 36

**Date:** August 17, 2026

Eighteenth handoff of the **Spine UI V2** track (branch `feature/spine-ui-v2`).
`35` owns the merged tuner and the film-row atmosphere as first built; `34` owns
the cloud sky and the film rows. The plain `HANDOFF 1`–`19` series documents the
dormant production site on `main`.

---

## The one-line version

**The film-row foreground stopped reading as a box — its own canvas was slicing
the wisps — the violet in it became blue, the owner's tuning from all four
`/?tune` tabs landed in the files, and two pages stopped painting their
pre-script fallback state on load.**

---

## Corrections to earlier handoffs

- **Every foreground number in 35 is stale.** It records "Ships at intensity
  0.70, spill 56px, reach 0.30, parallax 0.18, wisps 14, motes 90, edges top 1 /
  right 0.85 / bottom 0.45 / **left 0**". The shipping set is now intensity
  **0.06**, density **0.3**, spill **27**, reach **0.19**, parallax **0.28**,
  drift **0.85**, wisps **20**, motes **211**, edgeFeather **100**, edges
  **{top 1, right 0.9, bottom 0.9, left 1}**. Read `KSFilmrowFG.defaults`, never
  a handoff, for the live values.
- **35's "+168 max outside the box" was measured at intensity 0.70.** At 0.06
  the layer is roughly a twelfth as strong. The two guarantees in that same
  paragraph — centre lifted by exactly 0, darkest pixel 0 — are unaffected,
  because they hold at *every* row of that table and 0.06 is below all of them.
- **35 calls `--fr-glow-base: 0.5` "THE MEASURED TUNING". The glow is now
  dialled to 0** and paints nothing. It still mounts, sizes and clips exactly as
  before — including contributing scrollable overflow, which is why the
  `main { overflow-x: clip }` guard still matters at base 0.
- **35's "`resp` at its 0.35 maximum still opens the field at 65%" no longer
  describes the file.** `--fr-glow-resp` is 1.00, which spends that no-JS guard:
  the field would open at 0% and rise only with scroll. Costs nothing while base
  is 0; it is the first thing to re-check if the glow is ever raised.
- **35's tint list is stale.** `['#9DB2C0', '#E4E8EB', '#7A6BA8']` is now
  `['#9DB2C0', '#E4E8EB', '#7284B6']`. Do not put the violet back — see below.
- **35's open item 1 advanced but did not close.** The owner has now judged the
  atmosphere on the real page and tuned it hard. `LIVE` is **still `false`**.

## A METHOD CORRECTION THAT MATTERS MORE THAN ANY VALUE HERE

**The cloud sky cannot be measured by either obvious method on this box, and
both failures return a confident zero rather than an error.** This is the same
class of trap as the `python -m http.server` seek bug in V2HANDOFF 23.

Tried and INVALID, Aug 17 2026, Playwright/Chromium over `scripts/serve.py`:

1. **`drawImage(cloudCanvas, 0, 0)` into a 2D canvas, then `getImageData`.**
   Returns fully transparent — `meanLum 0`, `meanAlpha 0` — at **every** opacity
   including 1.0. `js/clouds.js` takes its output context as `webgl2` without
   `preserveDrawingBuffer`, so the drawing buffer is gone by the time anything
   reads it.
2. **Page screenshots, differenced.** `.ks-cloud-sky` shown vs `display:none`
   diffed to **exactly** `0.000` mean, `0.0` max, `0.00%` of pixels — and so did
   **opacity 1.00 vs 0.02**, which cannot both be true of a working measurement.
   The screenshot is not compositing the accelerated canvas.

**The layer is definitely running.** WebGL2 available (ANGLE / RTX 3090 Ti),
`.ks-cloud-sky` present, the visible canvas is a live `webgl2` context at
1440x900, `KSClouds` loaded, and **no bail warning** on the console (the warn
added in `c65bf0c` never fired).

35 records a **+15.2 signed lift** from the sky opacity slider, so this HAS been
measured successfully before — by some method that is neither of the two above.
**Until someone re-establishes what that was, cloud-sky changes are owner's-eye
only, and a zero from a sky measurement should be treated as a broken instrument
until proven otherwise.**

Still true from 35 and used this session: **the visible cloud canvas is the
SECOND one** — `js/clouds-sky.js` builds a hidden `src` canvas first, so
`.ks-cloud-sky canvas` selects the wrong one.

## Git state

- Branch `feature/spine-ui-v2`. Session start `44d147d` (handoff 35).
- Two commits: **`f2457c7`** (foreground feather, palette, the owner's tuning)
  and **`554e1a4`** (the two reveal fixes). Both pushed.
- **No new files.** Ten modified: `about.html`, `css/filmrow-atmos.css`,
  `css/spine-bg.css`, `css/spine-doc.css`, `css/star-bg.css`,
  `js/about-feature.js`, `js/clouds-sky.js`, `js/filmrow-atmos-fg.js`,
  `js/filmrow-atmos.js`, `js/spine-doc.js`.
- Builds bumped: **`--spine-build` 39**, **`--star-build` 28**.
- `main` untouched at `13083d9`. No PR.

## THE FOREGROUND WAS A BOX — and the sprites were not the cause

The owner reported the foreground layer reading as a rectangle with a hard edge.
**The wisp sprites were already fine** — averaged over 24 baked sprites, the
radial alpha profile decays monotonically to 0 with a largest bin-to-bin step of
**7.17/255**. Chasing the sprite bake would have been a wasted session.

**The canvas was doing the cutting.** `fade(d)` fades a particle by the depth of
its **centre**, and a wisp is a sprite 92–233px across, up to ~490px on the
stretched long axis. A wisp centred at `d = 0.3` on the top edge sits 39px inside
a 56px spill at *full* alpha with ~100px of itself outside the backing store.
Nothing faded along `t` either, so wisps near the ends of an edge were sliced by
the left and right borders at full strength. Measured before: brightest pixel
sitting on the canvas's own right border **14.2/255**, mean **2.0** down the
whole column. Low — but a straight line at low luminance is still a straight
line, and the eye finds it.

**Fix: `edgeFeather`.** A margin added **outside** the spill, plus a baked
rectangular vignette composited `destination-in` after every particle is down.

- **The margin goes outside the spill, not carved out of it**, so the tuned
  crossing survives — the ramp only ever eats sprite tails, since `fade()`
  already guarantees no particle *centre* reaches that far.
- **The four ramps go on with `destination-out` so their alphas MULTIPLY**, which
  feathers corners on both axes for free. Summing them would over-erase corners
  to nothing.
- **Stops are a sampled smoothstep, not a two-stop linear ramp.** A linear ramp
  is continuous in value but not slope, and the kink shows on a dark page as a
  faint band — the exact artefact this exists to remove.
- **A mask pass, not per-particle maths, and that is load-bearing.** The cut is a
  function of a sprite's EXTENT, which changes every frame with breathe, sway,
  spin and stretch. Fading a particle by how close its centre sits to the border
  still slices the large ones — precisely the set that was slicing.
- **The ramp length is not the pad.** Where the viewport grants the full pad the
  two are equal and the spill is untouched; where it does not (a phone at 390px,
  where both `padL` and `padR` clamp to 0) the ramp falls back **into** the
  spill rather than collapsing to a cut.

**Verified:** max-on-edge **0 on all four sides, both rows, at 1440 / 1024 / 768
/ 390**. No horizontal overflow and `scrollBy(600,0)` still does not move the
page at any width, so 35's sideways-scroll guard stays closed. Dragging
`edgeFeather` to 0 puts the canvas back to 762x654 and the right border back to
**12.79** — the A/B proving the mask is what did it. rAF 477fps, inside 35's
no-layer baseline.

## THE VIOLET WAS 25 DEGREES OUTSIDE THE SITE'S OWN BAND

`#7A6BA8` is hue **255**. Measured Aug 17 2026, the page around a film row at
1440x900 averages **hsl(230 31% 15%)** and its lit highlights sit at
**hsl(210 14% 89%)** — so the site's whole cold band runs about **204–230**. The
violet sat outside it, which is why it read as purple against everything near it
rather than as part of the sky. 35's claim that it "ties the wisps to the nebula"
was the intent, not the result.

`#7284B6` = **hsl(224 32% 58%)**: the backdrop's own hue at wisp lightness, more
saturated than moonlight so the list still carries hue variety instead of three
shades of the same grey. RGB 114/132/182 — **B > G > R by a clear margin, and the
moment R climbs past G it is a violet again.**

**Verified: 0 purple pixels (R > G) across ~250,000 lit pixels**, all rows, all
four widths. The tint feeds motes as well as wisps, so both moved.

## WHAT THE OWNER TUNED — AND WHAT WAS DROPPED ON THE WAY IN

The owner pasted Copy output from all four tabs. **45 of the 47 page-scoped CSS
values were byte-identical to `:root` and were dropped**, per the rule spelled
out in `css/spine-bg.css`'s own `html.page-about` block: a page block repeating
the baseline is a stale number in waiting, because it silently pins that page to
today's value the day the baseline improves. **Diff every pasted Copy CSS block
against `:root` before writing it. This is not optional tidiness.**

What actually differed:

| file | landed |
|---|---|
| `css/spine-bg.css` | `--snare-decay: 410` (`--spine-on: 0` was already there) |
| `css/star-bg.css` | `--star-desync: 1`, `--star-cloud-bright: 2.1` |
| `css/base.css` | **nothing** — `--scroll-weight` already matched `:root`, so no block was created |
| `css/spine-doc.css` | `--ksd-field` 400px, `--node-ring` 38px, `--node-ring-active` 28px, `--ring-peak-a` 1, `--node-pulse-ms` 3350ms, `--ring-color` crimson |

`star-bg.css` and `spine-doc.css` had **no `html.page-home` block at all** before
this; the star one is that file's **first non-empty page block**. Both were
placed **above** the mobile block — load-bearing for the star file, whose
`@media (max-width: 600px)` sets `--star-cloud-bright: 1.27` and would have been
outranked by `html.page-home` (0,2,0 vs :root's 0,1,0) if source order had gone
the other way. **Verified 1.27 still wins at 390px.**

The Film tab's values went into **`DEFAULTS` in `js/filmrow-atmos-fg.js`**, not
into `fgShipped()`, as the Copy output itself recommends — the module stays the
one source. The panel now reports **"matches the files"**, which is the strongest
available proof the paste landed.

The mask PNGs were **not** regenerated: the printed commands are bare, so they
reproduce byte-identical files.

## TWO REVEAL BUGS OF THE SAME SHAPE — worth a general rule

The owner reported the same symptom on two pages: *something shows on load,
disappears, then comes back on scroll.* Both times **the reveal was working
correctly the whole time** — what the eye caught was the fallback being painted
first and then taken away.

**The rule, because a third one is likely: a pre-script fallback state that is
VISIBLE is a fallback that ships on every single load.** It is not a rarely-hit
safety net; it is the first thing every visitor sees. Check when it comes off,
not just that it is correct.

**1. about.html, the masthead.** Every hidden starting state in
`css/about-feature.css` is written so `.no-js` shows the FINISHED state — a
deliberate guard so a reveal whose script never loads does not leave a blank
page. But `.no-js` was only removed by `js/about-feature.js`, the last of nine
scripts before `</body>`. Measured: **first contentful paint 1176ms, `.no-js`
removed 1961ms — 785ms and 298 frames** of masthead painted fully visible.

Now dropped by an inline `<head>` script, pre-paint. **It is six lines and not
one because the fallback was not given up:** the head script arms a `load`
handler that puts `.no-js` back unless `js/about-feature.js` announced itself,
which it now does via `data-about-ready` on its first line, before anything below
can throw. Scripts off, the inline script does not run either — that path is
untouched.

**2. index.html, the doc rail.** Not the same mechanism — `.no-js` exists only on
about.html. The rail's position is **measured**: `js/spine-doc.js` reads the hero
video's bottom edge into `rail.style.top`. Until it ran, the stylesheet's
`top: 0` applied — and `top: 0` is not a neutral placeholder, it runs the cord
down the full height of the hero, which is what the Aug 15 2026 call took it off.
Measured: **874ms, 255 frames** of cord across the footage.

`.ksd-rail` now stays `visibility: hidden` until `measure()` adds `.is-placed`,
on the same line that sets `top`. **Hiding it when the script never arrives costs
nothing, and that is the part to remember: the markup ships ONE child, the
`.ksd-cord` line — 190 children after `measure()`, 1 before.** A scriptless rail
was never the design in miniature; it was a bare 1px gradient crossing the hero
with no nodes on it, and the rail is `aria-hidden` decoration either way.

## What is deliberate, so nobody fixes it

Everything in 30–35's lists still stands, except where corrected above.
Additionally:

- **`LIVE = false` in `js/filmrow-atmos.js`.** Still not judged for shipping.
- **The glow is OFF, not dim.** `--fr-glow-base: 0` zeroes the product. Do not
  "restore" 0.5 because the layer looks absent — it is absent on purpose.
- **`edges.left` is 1, and it faces the copy column.** The old reason for zeroing
  it was written at intensity 0.70; at 0.06 the material there is ~a twelfth as
  strong. **This is the option to re-examine first if intensity is ever raised**
  — the copy column is the one thing this layer can damage.
- **The doc rail's resting ring is BIGGER than its focused one** — 38px idle
  against 28px active, inverted from the 26/48 port. Focusing a node now
  *contracts* the ring. Owner's tuning; **not a transposition.**
- **The rail rings are crimson.** One of the two options the baseline's own note
  offers, and it spends one of the ~2-uses-per-page crimson budget that note
  names.
- **`--star-desync: 1` on home only.** The baseline's "do not tidy away
  `starfield-cores-1..4.webp`" banner applies at **both** settings.
- **`data-about-ready` and `.is-placed` are not decoration.** Each is the only
  thing standing between a failed fetch and a broken page.

## Do not do these

Everything in 19–35's lists still stands. Additionally:

- **Do not put the violet back** in `KSFilmrowFG.defaults.tint`, and do not add
  any tint whose R exceeds its G.
- **Do not paste a Copy CSS block into a page block without diffing it against
  `:root` first.** 45 of 47 values this session were noise.
- **Do not move a `html.page-*` block below a `@media (max-width: 600px)` block.**
- **Do not trust a zero from a cloud-sky measurement** — see the method
  correction above. Re-establish the instrument first.
- **Do not shrink `edgeFeather` to fix an overflow** — clip an ancestor, same as
  the glow's `inset: -90%`.
- **Do not move `rail.classList.add('is-placed')`** to the end of `measure()`;
  `top` is the only value that has to be right for the rail to be placed.
- Still: no `shadow` above 0 in the cloud OPTIONS, no scroll-linking the cloud
  field, no `data-ksd-section` on the hero, `-g 4` on every scrubbed clip, no
  Python text-mode writes to JS/CSS/HTML, no `body { overflow-x: clip }` for the
  glow's overflow.

## Verified vs. asserted

**Verified by tooling and looked at** (Aug 17 2026, Playwright/Chromium over
`scripts/serve.py`, 1440x900 unless noted):

- Feather: max-on-edge 0, four sides, both rows, four widths; the
  `edgeFeather: 0` A/B; overflow 0 and no side-scroll at every width; 477fps.
- Palette: 0 purple pixels across ~250k lit, all widths. Backdrop hue sampled.
- **47/47 computed CSS values correct** on index at 1440, read from the browser
  rather than the files. Builds report 39 / 28. Mobile still wins
  `--star-cloud-bright: 1.27` at 390. about.html baselines intact.
- Film tab reports "matches the files".
- Both reveal fixes: frame counts before and after, the reveal still working
  after scroll, the script-blocked path, and the scripts-disabled path.
- Visitor load still clean: no panel, no `has-fr-` classes, no `.ksfg` wrappers,
  overflow 0, no console errors on any page or viewport touched.
- Screenshots taken and looked at: foreground field alone before/after, the film
  row composited before/after, about.html at load and after scroll, the doc rail
  after scroll, the Film tab.

**Asserted / not verified:**

- **The cloud sky's on-page appearance.** Values are committed and the layer
  runs, but nothing was measured — see the method correction. **This is the one
  thing this session shipped without a working instrument, and it is named here
  rather than glossed.**
- **Whether the retuned foreground reads right.** It is very faint now — 2,233
  lit pixels on row 1 and **20** on row 2, against ~51,000 / 60,000 at the old
  0.70. That is the owner's tuning and the numbers are just numbers; nobody has
  said it looks right at that strength.
- The ring inversion and the crimson rails: applied as pasted, not confirmed as
  intended in words.
- Safari, real phone hardware: untested, unchanged.

## Still open

1. **Decide `LIVE`.** The owner has now tuned the atmosphere on the real page but
   has not said it ships. `LAYERS` still allows shipping static paint without the
   animating canvas. Note the glow is at base 0, so "feather + fg" is the live
   shape of the question now, not "feather + glow".
2. **Confirm the ring inversion** (38px resting over 28px focused) and the
   crimson rail colour are what the owner meant.
3. **Re-establish a working cloud-sky measurement**, or accept that layer is
   eye-only. Until then `opacity: 0.02` with `cover: 0` is unjudged — and the
   table in `js/clouds-sky.js` says cover 0 leaves 30–34% of sky with no cloud,
   so **if the sky reads bare, `cover` is the dial** (35's open item 4, still
   open and now more likely to be needed).
4. **The frame-budget decision.** Untouched from 35: p90 2.2 -> 4.1ms, p99
   16–23ms, every spike in the first 1–8% of a scroll burst. Two levers, neither
   applied on purpose. Owner's call.
5. **Three clips remain** for film rows: `rain-transmission-rooftop`,
   `last-train-below`, `the-black-archive` (folder: Desktop\Spine Home Photo and
   Video). The `kundalini-scrub-video` skill owns the pipeline. Owner names the
   section.
6. music.html still black; stale amber-era `?tune` TIPS prose; the two missing
   trivia files; the astral scrim parked with its banner; the inherited pile
   (webmanifest favicons, PURCHASE, lab staleness, deploy/DNS, Range layers,
   Archive wrap, messengers→webp).

---

## Starting the next V2 chat

Attach this file. The working folder is
`C:\Users\Haight\Desktop\kundalini-spines-spine-ui` on `feature/spine-ui-v2`.
Serve with `python scripts/serve.py`, browse `http://localhost:8000` — never
`file://`, never `python -m http.server`.

> Here's the latest V2 handoff. The film-row foreground no longer reads as a box,
> the palette is blue instead of violet, and the owner's tuning from all four
> tuner tabs is in the files — but the atmosphere is still behind `LIVE = false`
> and the cloud sky is unmeasurable with the tooling that was tried. Likely next:
> deciding `LIVE`, confirming the doc-rail ring inversion, or the remaining three
> clips.
