# Kundalini Spines — Spine UI V2 Handoff 21

**Date:** August 9, 2026

Third handoff of the **Spine UI V2** track (branch `feature/spine-ui-v2`). Read
`V2HANDOFF 20.md` alongside this one — it still owns the aster asset split, the
tune panel, and the settled desktop idle read. `V2HANDOFF 19.md` still owns the
navigator architecture and the stack reframe. The plain `HANDOFF 1`–`19` series
documents the dormant production site on `main` and is background reading only.

---

## The one-line version

The entrance became a complete sequence — hero plays, scroll scrubs its last
3.3s, the aster assembles, then strips away as dust leaving the wire "bones"
with navigation nodes and the scroll ends. **`main` was not touched.**

---

## READ THIS FIRST: nothing this session was seen

Every visual judgement in this handoff is **arithmetic, not eyesight.** The
assistant's browser pane did not paint this page at all — proven, not assumed: a
screenshot with the HUD restored showed the HUD, fixed-position bone-coloured
text, equally invisible. `requestAnimationFrame` fired **once in 4.5 seconds**,
and CSS transitions never advanced, so several readings had to be taken with
transitions explicitly disabled.

So: the coil, the dust, the bones, the tooltips and the intro cut are all
**verified as numbers and unverified as pictures.** The owner asked at wrap-up
for an environment where the assistant can actually see rendering.

### …and it was solved before the session ended

**Headless Chrome works on this machine, needs no install, and the recipe is now
in the `kundalini-session-start` skill (step 8).** No Node, no npm and no
Playwright are present — do not try to install them — but Chrome and Edge are
both there and take a `--screenshot` flag whose output can be read directly.

It was proven the moment it ran: the first capture of `hero-scrub-lab.html`
showed **the HUD range sliders rendering in default browser blue**, sitting under
a bone-and-amber entrance. `accent-color` was set on some throwaway mockups
earlier in the session and never on the lab itself. Days of measurement had not
found it; ten seconds of looking did.

**So the "unseen" caveats above are now a to-do list, not a limitation.**
Everything in this handoff marked asserted-not-verified can be checked with a
screenshot once the `?cap=` parameter exists (see Still open).

---

## Corrections to V2HANDOFF 20

20 was accurate when written. These parts are now out of date:

- **Still-open item 1, "the motion cue becomes concentric rings", is CLOSED —
  but not as rings.** It was built as **twin serpents**: two coils half a turn
  apart winding around a lit central channel, with a beam thrown up the column
  ahead of the wavefront. The hoop idea was rejected for a measured reason, kept
  below under "what is deliberate".
- **`.aster__scan` no longer exists.** Every reference to the flat scan line as
  the leading edge is now describing deleted code. `--scan-a` and `--scan-h` are
  gone with it. **`--scan-live` survives unchanged** and still gates the cue.
- **The hero entrance decision recorded in 20 was superseded the same day.**
  20's head-comment description, "hero video, scrubbed by scroll (not
  autoplayed)", is no longer what the page does. The hero now **free-plays 0 →
  5.469s**, holds that frame, and scroll scrubs only the remaining 3.299s.
- **Still-open item 5, "wire the entrance to the navigator", is PARTLY closed.**
  The placeholder section is still in the DOM but the entrance now hands off to a
  **reduced** navigator. It is not the real one — see the warning below.
- **19's "steady radar-like train" of two offset ripples had never rendered.**
  Not a regression; it never once worked. Fixed this session. Details in
  findings.
- **20's Still-open item 6, `spine-ui-wire.png` → webp, is still open and now
  matters more** — that 640 KB PNG is no longer navigator-only, it is part of the
  entrance.

---

## Git state

- Branch `feature/spine-ui-v2`, worktree `C:\Users\Haight\Desktop\kundalini-spines-spine-ui`.
- Session start: `859b91a`, level with `origin/feature/spine-ui-v2`.
- `main` = `origin/main` = `13083d9`, untouched. No PR opened.
- Files touched: `hero-scrub-lab.html` (heavily), `spine-lab.html` (one rule),
  `hero-timeline-lab.html` (new). **Zero production files modified.**

---

## What shipped

### 1. The motion cue — twin serpents

Replaced the flat scan line in `hero-scrub-lab.html`. Two canvases, and **their
order in the markup is load-bearing**: `--back` sits before `.aster__wipe` so the
far half of each strand passes behind the spine, `--front` sits after so the near
half passes in front. That depth split is the entire illusion of winding *around*
rather than lying *on*. Canvas rather than SVG because each segment carries its
own width, colour and glow from its depth and recency.

Amber is quoted verbatim from the navigator's `--node-color: 240, 165, 92`.
Dials in the HUD: `turns` (5), `beam` (0.40), `hug` (1).

### 2. The hero intro, and the timeline tool that found it

**`hero-timeline-lab.html`** (new) — a utility for finding one number. Filmstrip
of 24 (or 48) seekable thumbnails, frame-accurate transport, fps measured via
`requestVideoFrameCallback` rather than assumed, a mark button, and a "preview
handoff" that plays from 0 and stops dead on the mark so the cut can be judged.

The owner marked **5.469s** — the frame where the camera enters the spine and
turns for the nebula. Fraction of duration **0.6238**, frame **131 at 24fps**,
leaving **3.299s** for the scrub.

Scroll now maps onto `INTRO_END..duration`, not `0..duration`.

### 3. The dust handoff to the bones

When the aster reveal completes, the aster is rasterised once (mesh + outline at
the opacities they were wearing), sampled into ~7,800 particles, and the DOM copy
is hidden — from then on one canvas draws **both** the intact remainder and the
particles that have left, which is what makes the column *erode* rather than have
a copy fly off an intact spine. The sweep runs **base first, crown last**.

The wire fades up at **35% through the dust**, while particles are still leaving,
so it reads as being *uncovered* rather than arriving. Then `is-nav` locks the
scroll: `overflow: hidden` on html and body. The entrance is a one-way door.

**The owner's framing, worth preserving because it drove the design:** the aster
is flesh, the wire is bone — "stripping away the old and leaving just the bones
of image".

### 4. Navigator ring-2 phase fix (`spine-lab.html`)

One rule, converted from the `animation` shorthand to longhands. See findings.

### 5. HUD tooltips and collapse

18 controls, one shared script-positioned tooltip, clamped to the viewport.

---

## ⚠ The navigator in the entrance is REDUCED, and the node table is duplicated

`hero-scrub-lab.html` now contains its **own** six-node table — same ids, order,
sides and y values as `spine-lab.html`, kept in step **by hand**. It renders dot,
mark ring, cord and label only. **No cards, no reticle, no rising comet, no
keyboard toolbar, no roving tabindex.**

It is enough to judge the handoff and nothing more. Do not mistake it for the
navigator, and do not evolve it in place — the right move is the
`css/spine-ui.css` + `js/spine-ui.js` extraction already on the list, which
deletes this duplication rather than growing it.

---

## Measured findings (date + method, so nobody re-derives them)

All measured Aug 9 2026 against `python -m http.server 8000`.

1. **`spine-aster.svg` geometry.** All 13 paths flattened at 24 samples per cubic
   (60,162 points), true scanline edge intersections, cross-checked against an
   independent Pillow raster (agreement within 2 units on 1907 of 1980 rows).
   - **The column is drawn DEAD STRAIGHT.** Centre x = **600.44**, sd 0.72 over
     y 100–2050; total drift 0.38 units over 1950 of height. There is no centre
     curve to follow. The apparent 17-unit lurches at y=562 and y=1376 are
     single-row artifacts where one wing of a transverse process enters the
     scanline a row before the other.
   - **The width profile has genuine ONE-ROW CLIFFS.** Halfwidth 94.3 at y=1660
     becomes 146.4 at y=1661. Any coil interpolating raw per-row widths jerks
     there. The `HALF` array in the script is therefore a smoothed **upper
     envelope**, not the raw profile.
   - Landmarks: sacral ala is the widest point (halfwidth **172.6 at y=1753**);
     the waists between each vertebra's processes are remarkably constant at
     **55–57**; and **the cervical region is not the narrowest part** — the
     cervical cap at y=127 is the second widest peak in the whole column.
   - `<g id="spine-aster">` carries **no transform**; path coords are viewBox
     coords 1:1.

2. **`spine-ui-wire.png` vs the aster — they cannot match on both axes.**
   Pillow alpha bbox: x 381–820, y 34–2107 in a 1200×2150 file.

   | | art size | aspect |
   |---|---|---|
   | `spine-aster.svg` | 345 × 1988 | 0.174 |
   | `spine-ui-wire.png` | 439 × 2073 | 0.212 |

   Height-matching factor is **1988.41/2073 = 0.95919**, expressed as a `calc()`
   off `--aster-h` so retuning one tracks the other. Verified in the browser:
   both art heights render at **572.65px, delta 0.001px**. The consequence — the
   wire renders **22% wider** — was shown to the owner and accepted.

3. **The navigator's two pulse rings were running in phase.** The offset lived on
   `.spine-node .spine-node__ring--2` (specificity 0,2,0) but the rule starting
   the animation was `.spine-node:hover .spine-node__ring` etc. (0,3,0), and
   `animation` is a shorthand that also sets `animation-delay: 0s`. Higher
   specificity won. Both rings are the same size, so what rendered was one ring
   drawn twice. Now longhands; verified ring 1 `0s`, ring 2 `-0.675s` of a 1350ms
   period.

4. **A canvas is a REPLACED ELEMENT.** `position:absolute; inset:0` with
   `width:auto` resolves to its *intrinsic* size (the width/height attributes,
   default 300×150), not the containing block. Because the script sized the
   backing store from the measured box, the element fed its own measurement back
   in and the height ran away — measured **300×754 against an artwork box of
   345.6×619.2** before explicit `width/height: 100%` was added.

5. **`currentColor` DOES NOT RESOLVE inside an `<img>`.** An SVG loaded as an
   image is an independent document with no CSS context from the host page, so
   `fill="currentColor"` falls back to **black** and the outline vanishes against
   the sky. The dust rasteriser substitutes it explicitly on a clone. Verified:
   outline pixels measure RGB **(243,243,240)**, zero near-black.

6. **The assistant's pane does not composite.** rAF fired **once in 4.5s**;
   `requestVideoFrameCallback` never fired at all (it requires a frame to be
   *presented*); CSS transitions never advanced. A screenshot with the HUD
   visible was entirely black, proving the page was not painting rather than the
   effect being broken.

7. **`buildStrip` and `measureFps` raced over the same `<video>`.** Started
   together on `loadeddata`, the strip's `pause()` killed the playback the
   measurement needed, and fps silently stayed at the assumed 30 — worse than no
   measurement, because the frame counter then looks authoritative while being
   wrong. Now strictly sequential.

8. **Hero video facts.** 8.768s, 1920×1080, **24fps** (measured on the owner's
   machine via rVFC — the assistant could not measure it). mp4 is listed first in
   both `hero-scrub-lab.html` and `hero-timeline-lab.html`; the timeline tool
   seeks constantly, so webm-first would make it unusable.

9. **Headless Chrome captures, and what it can and cannot see.** Verified by
   capture and by pixel-differencing the results:
   - **Video does NOT render** — captures at `--virtual-time-budget=500` and
     `=6000` came back **byte-identical** (886,897 bytes each, pixel diff 0.00).
     You get the poster frame. `--autoplay-policy=no-user-gesture-required` does
     **not** change this; do not add that flag believing it helps.
   - **Canvas DOES render**, including `shadowBlur` and `putImageData` — tested
     with a synthetic canvas, 8.8% coverage. So the coil and the dust are
     capturable. SVG, CSS and images render too.
   - The output path must be **absolute** (relative fails with "Access is
     denied"), and Chrome **returns before the file is written**, so an immediate
     existence check reports nothing.
   - Chrome is at the **`Program Files (x86)`** path on this box, which is the
     less common location — detect it rather than assume.

10. **The HUD grew to 125px, 17.4% of a 720px viewport**, wrapping to three rows —
   sitting exactly where the sacrum is and where the dust starts leaving. Hence
   the collapse toggle (43px collapsed, 11.4% of screen recovered).

---

## Do not do these

Everything in V2HANDOFF 19 and 20's lists still stands. Additionally:

- **Do not move the coil's virtual eye to mid-screen.** It sits above the crown
  (`EYE_Y = Y_TOP - 420`) for a measured reason: with a mid-screen eye the
  ellipse's minor axis passes through **zero** exactly as the wavefront crosses
  centre, and the ring degenerates into a flat horizontal line — precisely the
  shape being replaced, arriving at the worst possible moment. Verified absent:
  minimum minor/major ratio across the whole column is **0.212**.
- **Do not collapse the `node-pulse` longhands back into the `animation`
  shorthand** in `spine-lab.html`. That is the bug, not tidier code.
- **Do not remove `width/height: 100%` from `.aster__coil` / `.aster__dust`.**
  See finding 4. It is not belt-and-braces.
- **Do not gate the scroll-mode coil redraw on rAF.** Chrome delivers scroll
  events at most once per frame already, and the wipe is pure CSS that keeps
  advancing when the frame loop is starved — an rAF-gated coil silently desyncs
  from the mask it is the leading edge of.
- **Do not put apostrophes in the `TIPS` strings.** They are single-quoted and
  written in the shape of the production `/?tune` panel so they can be lifted
  into `js/spine-bg.js` wholesale. One apostrophe kills that panel. Say "does
  not" rather than the contraction.
- **Do not non-uniformly scale `spine-ui-wire.png`** to close the 22% width gap.
  Squashing it to 345/439 of its width visibly thins every vertebra. If the gap
  ever needs closing, it needs a different artwork.
- **Do not map the nav nodes' y% onto the wire's 1200×2150 box.** They map onto
  its measured **art** bounds; using the box puts every node ~1.6% high and
  floats the top one clean off the bone.
- **Do not restore `prime()`.** The intro playback primes the decoder better than
  a play-and-instantly-pause ever did.
- **Do not treat `--dust-ms` / `--coil-turns` etc. as arbitrary.** They are CSS
  variables read and cached by JS at init and on HUD input, not read per frame.

---

## What is deliberate, so nobody "fixes" it

- **Twin serpents, not concentric hoops.** The owner combined two of four sketched
  ideas. A coil around nothing reads as decoration; the lit central channel gives
  it something to be about. Ida and pingala around sushumna — the band's own
  iconography.
- **Base-first dust sweep, crown last.** Same direction as the reveal and the
  coil. The column strips upward rather than collapsing.
- **The wire fades in DURING the dust, not after.** Bone is uncovered, not
  delivered.
- **The 22% width difference is accepted, not overlooked.** Under the owner's
  flesh-and-bone reading, a bare structure revealed underneath *should* sit
  differently from what covered it.
- **The scroll genuinely ends.** Consistent with the reveal's forward-only latch:
  a reader delivered to the navigation is not sent back up the tunnel. The HUD
  Reset is the way out and exists **because this is a lab** — production needs a
  considered answer instead.
- **A reader who scrolls during the intro gets a cut**, not a wait. Someone who
  scrolls is asking for control; ignoring them desyncs `--p` from the video and
  the handover jumps anyway, later and by more.
- **One shared tooltip, positioned by script.** A per-control `::after` would
  hang off the viewport at either end of the row, and the usual fix — clipping
  overflow on a wrapper — cannot be used because this page depends on
  `position: sticky` and making an ancestor a scroll container breaks it.
- **Amber nodes, upward energy, mask wipe not dash draw, mp4-before-webm** — all
  still deliberate per 19 and 20.

---

## Verified vs. asserted

**Verified by tooling this session:**
- Git isolation and branch parity.
- Coil axis at x=172.5px against a predicted 173.1px; max half-extent 185.6
  viewBox units against the sacral ala's 172.6 + 14 clearance = 186.6.
- `hug` 0 → constant radius 110 everywhere; `hug` 1 → 186.6 at the sacrum,
  116.1 at the thoracic waist.
- Minimum ellipse minor/major ratio 0.212 across the whole column.
- Intro stops at exactly 5.469s; scrub maps 0/0.25/0.5/0.75/1 → 5.469 / 6.294 /
  7.119 / 7.943 / 8.768, exact at every point.
- Mid-intro scroll: intro ends, video pauses, cuts to 5.469, scrub resumes 5.798.
- Aster and wire art heights both 572.65px, delta 0.001px.
- Dust: lit pixels 31,356 → 26,167 → 19,879 → 2,344 → 0 across t = 0…0.99, with
  the centroid rising monotonically 309.6 → 92.2. **t=0 matches the raster's
  31,413 to within 0.2%**, so the DOM→canvas swap is invisible.
- Outline rasterised as bone (243,243,240), not black.
- `is-nav` applies, `overflow: hidden` on html and body, Reset unwinds every
  piece of state and restores `--p` to 0 and scroll to 0.
- 18/18 tooltips wired, zero apostrophes, all clamped inside the viewport.
- HUD 125px open → 43px collapsed → 125px restored.
- No console errors on any lab page.

**Asserted / NOT verified:**
- **NOTHING WAS SEEN** — still true of everything this session shipped, but no
  longer a limitation, only an outstanding task. Headless Chrome capture was
  proven working at the very end of the session, too late to re-verify the work.
  No visual confirmation of the coil, the dust, the bones, the cut, or the
  tooltips' appearance. The one screenshot that was taken found a real defect
  immediately (blue HUD sliders), which is the best argument for doing this first
  next time.
- **Performance is entirely unmeasured** and there are now two suspects: the coil
  issues up to ~880 `stroke()` calls a frame, many with `shadowBlur`; the dust
  clears an ~857 KB buffer and writes ~7,800 particle blocks a frame. Both were
  written with the cheap path in mind (sample count trimmed 300→220; `ImageData`
  writes rather than 7,800 `fillRect` calls) and a bucketing fallback is
  documented in a comment, but neither has been timed.
- **`prefers-reduced-motion` is coded on all four labs and still never tested.**
- **No mobile work at all** on any of the four labs.
- The 24fps figure came from the owner's machine, not the assistant's.

---

## Still open

1. **Add the `?cap=` capture parameter to the labs.** Headless captures the page
   *as loaded*, so everything behind scroll position — the coil, the dust, the
   bones — is currently unreachable. A parameter that forces a state at load
   (`?cap=coil:0.6`, `?cap=dust:0.4`, `?cap=nav`) is maybe 15 lines and converts
   most of the asserted-not-verified list into something checkable. Varying
   `--virtual-time-budget` then frame-steps animation deterministically.
   **Do this first — it makes everything below cheaper.**
2. **LOOK AT IT.** The whole entrance is still unjudged visually.
3. **Fix the blue HUD sliders.** `.hud input[type=range] { accent-color: rgb(240,165,92); }`
   — one line, found by the first screenshot, not yet applied.
4. **Time the coil and the dust** on real hardware. Fallback documented in code.
5. **The `css/spine-ui.css` + `js/spine-ui.js` extraction.** Now overdue — the
   six-node table exists in two files and is kept in step by hand.
6. **Confirm the ring-2 fix.** It changes a look the owner already signed off on
   (two coincident rings become an alternating train). Owner's call to keep.
7. **`spine-ui-wire.png` → webp.** 640 KB, and now in the entrance flow.
8. **Scroll-linked vs Timed once** for the aster reveal — still no verdict.
9. **Mobile** — four labs, none has a mobile answer. `hero-scrub-lab.html` is the
   hard one (sticky + scroll-scrub on iOS, Safari seek throttling, `100svh`).
10. **Production scroll-unlock answer.** The lab's Reset button is not it.
11. **Tuner integration; Music / Archive immersive wraps** — unchanged from 19.

**Closed since 20:** the motion cue (as twin serpents, not rings); the hero
entrance behaviour (intro-then-scrub at 5.469s); the entrance→navigator wiring
(partially — reduced navigator only); the dead ring-2 offset; **and the
long-standing "the assistant cannot see anything" problem** — headless Chrome
works, recipe in the start skill.

---

## Housekeeping

The assistant's persistent memory note "next session: swap the flat scan line for
amber concentric rings" was **deleted** — the task is done and the note would
have misdirected the next session toward hoops.

**The session skills now live in the repo** at `.claude/skills/kundalini-session-start/`
and `.claude/skills/kundalini-session-end/`, alongside the `launch.json` that was
already tracked there. They were previously only under
`AppData\Roaming\Claude\local-agent-mode-sessions\skills-plugin\...`, which is
app-managed and can be overwritten — an edit made there this session was at risk
of being discarded. **The repo copies are canonical and each says so at the top.**
The AppData copies were deliberately left in place rather than deleted, because
they belong to the skills plugin; where both exist, the project-scoped copy wins
for this directory.

Both skills were also corrected: `kundalini-session-start` step 8 previously sent
a new session after Playwright at `/opt/pw-browsers/chromium` and
`npm install playwright`. **Neither Node nor npm exists on this machine** — that
guidance was a dead end and is replaced by the headless Chrome recipe.
`kundalini-session-end` gained a rule that "not seen" is no longer an acceptable
default, and a checklist line for it.

---

## Starting the next V2 chat

Attach this file (`V2HANDOFF 21.md`), `V2HANDOFF 20.md` and `V2HANDOFF 19.md` —
20 owns the aster asset split and the settled idle read, 19 owns the navigator
architecture and the stack reframe. The new session needs folder access to
`C:\Users\Haight\Desktop\kundalini-spines-spine-ui` (the V2 worktree, **not**
production `kundalini-spines`) and should confirm `feature/spine-ui-v2` before
editing. Serve with `python -m http.server 8000`; the labs link real CSS and
fetch the SVG, so they need http, not `file://`.

**Reload note:** python's server sends 304s. Hard-reload (Ctrl+Shift+R) after
every edit, or use a `?cb=` cache-buster.

A good opening message:

> Here's the latest V2 handoff for Kundalini Spines (Spine UI V2 branch). I have
> looked at the entrance and here is what I think of it.
