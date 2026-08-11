# Kundalini Spines — Spine UI V2 Handoff 25

**Date:** August 11, 2026

Seventh handoff of the **Spine UI V2** track (branch `feature/spine-ui-v2`).
`24` owns the wordmark and the coil; `23` owns the entrance redesign and the
Range server; `21` owns the coil's original reasoning; `19` owns the navigator
architecture. The plain `HANDOFF 1`–`19` series documents the dormant
production site on `main` and is background reading only.

---

## The one-line version

**The Music immersive wrap is built.** Open since handoff 19, specified in one
line by 23 — *"cards over the reactive sky, spine column off, music playing,
background animating"* — and it now exists as `music-lab.html` +
`js/music-wrap.js`, with the navigator collapsing to a rail whose seven nodes
change job inside Music. **`js/track-experience.js`, `js/spine-ui.js` and
`js/spine-bg.js` are all loaded UNMODIFIED and not one tuned number moved.**
One named defect ships with it. **`main` was not touched.**

---

## Corrections to earlier handoffs — and to things said inside this session

- **24's "Still open" item 5 is CLOSED.** The Music wrap is built.

- **THE PLAN SAID `--arc-h` WOULD HAVE TO SHRINK. IT DID NOT.** The prediction
  was that fitting the carousel into a 900px viewport would force `--arc-h`
  down from 640, which would in turn force re-deriving `.track-focus-panel`'s
  **−287.75px** top margin (the CSS derives one from the other). Measured
  against the real `index.html`: the four `display:none` trims free
  **162.06px** on their own — ink 949.9 → **787.86**, section box **819.86**
  with the page padding zeroed, **112.14px of slack**. Nothing was retuned.

- **"OPEN ON TRACK 1" WAS WRONG.** The carousel does
  `setFocus(Math.floor(tracks.length / 2), true)` at
  `js/track-experience.js:256`, so it opens on **index 14, Blue Pills**. The
  owner's instruction was "the same track as the current build", which
  therefore cost nothing to honour — the correct behaviour was to do nothing.

- **A CONTRAST TEST I RAN AND MISREAD.** Diagnosing the paused-after-jump
  defect, I compared a "programmatic jump" against a "real click" and concluded
  from identical results that the autoplay policy was not involved. The
  conclusion is right but the test was worthless: the "real click" was a click
  on an **index cell**, which calls the same `jumpTo()` → synthetic
  `card.click()`. Both arms were the same arm. The autoplay policy is still
  ruled out, but by the status text (`js:894-896` sets *"Sample unavailable"*
  when `play()` rejects, and it reads *"Play Sample"*), not by that comparison.

- **A FIX I SHIPPED AND THEN REMOVED.** A 140ms nudge — press the play button
  after a jump if nothing is playing — looked correct and caused a **double
  advance** under shuffle (15 → 25 → 26 on one completion). It is gone, and the
  comment at `jumpTo()` says so, because it will look like an obvious missing
  line to the next reader.

---

## Git state

- Branch `feature/spine-ui-v2`, worktree
  `C:\Users\Haight\Desktop\kundalini-spines-spine-ui`.
- Session start `bac4f72`; end **`7d61884`** plus this handoff, pushed, working
  tree clean, local and remote identical (`0 0`).
- `main` = `origin/main` = **`13083d9`**, untouched. No PR opened.
- Four commits. **Zero production files modified** — verified by
  `git diff bac4f72..HEAD` across `index.html`, `about.html`, `archive.html`,
  `music.html`, `transmissions.html`, all of `css/`, and `js/spine-bg.js`,
  `js/track-experience.js`, `js/spine-ui.js`. Empty.

---

## What shipped

1. **`music-collapse-lab.html`** — six readings of "the navigator collapses to
   a thin lit line", built so the choice could be made as motion rather than
   prose. Variants: RAIL (wireframe cropped to 74px) · CORD (thread only) ·
   GHOST (does not move; the outlier) · TICKS (cord plus six inert marks) ·
   NODES (the live node string) · **CONTEXT — settled.**
2. **`music-lab.html`** — the wrap.
3. **`js/music-wrap.js`** — its behaviour layer.

---

## The Music wrap, as settled

Every line below is the owner's decision, taken through a structured
interview before any code was written.

| | |
|---|---|
| Host | `music-lab.html`; loads `css/spine-bg.css` under `html.page-home` (`--spine-on: 0`) |
| Component | `js/track-experience.js` **verbatim**; markup is `index.html:85-118` verbatim |
| Tuned numbers | **none moved** — `--arc-h` 640, `--card-w` 250, the −287.75px margin |
| Trims (CSS only) | intro eyebrow + h2; `.track-focus-panel__actions` + its note; the dead `× Close` |
| Navigator | collapses to a rail at 54px, wireframe out, nodes live |
| Rail | `CLOSE · PURCHASE RISE UP · INDEX · DECODE · SHUFFLE · SHARE · SKY`, **unnumbered**, 111px apart |
| Plate | none — cards directly on the reactive sky |
| Open | beat = spine collapse + an overlay **above**, never an ancestor transform |
| On open | index 14 (Blue Pills), sample autoplays, sky comes alive |
| Exits | Esc (outright, no cascade), node 01 CLOSE, the rail |
| URL | `#music/<slug>` pushed once, `replaceState` as you browse, Back exits, deep links land |
| On close | sky goes still, navigator restored verbatim |
| Reduced motion | sky stays dead, beat becomes a cut |

**No `.spine-card` in Music, and that is the whole resolution of the owner's
"don't busy the tracks section" constraint.** The seven nodes are not the same
kind of thing: CLOSE, SHUFFLE and SKY are instant actions needing no surface;
PURCHASE and SHARE are toasts; DECODE **swaps** the focus panel's contents;
INDEX **replaces** the carousel. Only one wants a panel and it takes the
carousel's place rather than sitting on it. Nothing ever overlays the tracks.

---

## Measured findings (date + method, so nobody re-derives them)

All measured Aug 11 2026 via Playwright against `scripts/serve.py`, 1440×900.

1. **The fit.** As shipped, `.track-experience` is **1045.92** tall and
   overflows 900 by 145.92. The four trims free **162.06px**: ink 949.9 →
   787.86, section box 883.86 → **819.86** with page padding zeroed. Top 40.1,
   bottom 859.9, nothing scrolls. At 375×812 the untrimmed section is 998.6 and
   overflows by 186.6 — **mobile is still untouched.**

2. **Build cost.** Script start → 28 cards in the DOM and painted: **272ms
   median** over three runs (330.4 / 262.3 / 272.2), of which **255ms is the
   28KB `tracks.json` round trip** and **17.3ms is real JS**. Variance is
   entirely in the fetch.

3. **The carousel runs NO idle rAF loop.** Four registrations in an entire
   session; 0.00/s over a measured 2004.5ms window with nothing dragging and
   nothing playing. It parks itself and never wakes. It would not compete with
   an entrance video for frame budget.

4. **But the network would.** 13 of 28 covers download eagerly — **4.59 MB** —
   starting ~10ms after the cards enter the DOM. The file header's "hero +
   immediate neighbours" claim holds for **videos** (0 bytes; `data-src` +
   `preload="none"`, and the full library is 60.33 MB) and **fails for stills**
   (plain `src` + `loading="lazy"`; Chrome pulled hero±6, not ±1). `opacity: 0`
   does **not** suppress it.

5. **`visibility` is not `display`, and it cost three separate bugs.** A
   descendant can UN-hide itself, and `css/track-experience.css:195` does
   exactly that — `.track-hero-layer.is-showing { visibility: visible }`.
   Hiding `.music` left the settled 490×490 hero cover painting at z-index 900
   **over the entire navigator with Music closed** and **through the index
   grid**, while `getComputedStyle('.music').visibility` read `"hidden"` and
   47/47 automated checks passed. **Only looking at a screenshot found any of
   them.** Now written as default-hidden with one narrow re-enable, because a
   suppression list has to be extended for every new state.

6. **The grey line from each node was the CONNECTOR overlay, not the reticle.**
   `js/spine-ui.js:133` calls `preFocus()` on `mouseenter`, drawing
   `.conn-active.is-preview` toward where that node's reading card would open —
   left for `data-side="left"` nodes, right for the others. **The diagnosis
   came from the one node that looked right:** `02 PURCHASE`'s id is not in
   `spine-ui.js`'s `NODES` table, so `preFocus('purchase')` matched nothing and
   drew nothing.

7. **`--node-label-offset` 180 → 30 → 55.** 180px was measured against the
   **centred** spine's glow; on the rail it threw labels to x 228.8–384.5 over
   panel ink starting at 194. At 30 (numbered) labels ran 78.8–159.7. Removing
   the numbering cost 19.5px of first-letter offset, and **50 — the arithmetic
   answer — measured wrong** (rule 36.8px, first letter 98.8 against 103.5):
   the offset resolves from the node's own box, not the axis. **55** restores
   the rule to 41.8px.

8. **Seven nodes need their ping delays recomputed.** `js/spine-ui.js` gives
   each node `animation-delay: -(y-8)/84 × energyMs` so its flash lands when
   the rising comet reaches it. Re-laid out at 14 → 88 in steps of 12.333
   (111px apart on screen), the delays are −500 / −1528 / −2556 / −3583 /
   −4611 / −5639 / −6667ms. Leave them alone and every flash desyncs.

9. **Arrow roving had to be taken over.** `js/spine-ui.js:189` bails with
   `if (i === -1) return` for any id not in its six-node table. Landing on
   `purchase` would have silently killed arrow navigation for the rest of the
   string, so Music owns roving over its seven while open.

10. **Three doors let the component be driven without editing it.**
    (a) `track-experience.js:160` binds click to the **viewport** and resolves
    with `e.target.closest('.track-card')`, so a synthetic click on **any**
    card — including one not rendered — runs `setFocus + playSample`. Stepping
    with prev/next would have been up to 27 animated hops.
    (b) `focusedIndex` is private, but `.track-focus-nav__index` is written
    from it, so a MutationObserver on the counter is a feed that cannot desync.
    (c) `.track-sample-player__btn` is already wired to `toggleSample`.

11. **The sky answers, and it needed nothing.** `--kick` peaked **0.781** and
    `--snare` **0.946** over 3s of a real sample. `spine-bg.js` attached
    through `ks:sample-ready` with no changes at all.

12. **Everything in the panel centres on the hero, not the viewport.** Hero,
    counter, player, decode title, decode rows and the toast all measure at
    exactly the same x. Two things were off before this was checked: the decode
    metadata sat **185px left** (a `<p>` inheriting a prose measure with
    `margin-left: 0`, so `justify-content: center` centred it inside an
    off-axis box), and the toast was on the viewport's centre rather than the
    panel's.

13. **A finish and a pause are identical from the DOM.** Both drop
    `is-playing`, reset the fill to 0% and restore *"Play Sample"*. Three
    signals distinguish them: `userToggled` (capture-phase on the play button,
    set before the module's own handler), `jumping` (our own stop), and the
    fill peak. **The peak threshold is 70, not 95** — the 20s cap at `js:863`
    only fires when the FILE is longer than `sampleDuration`, so a shorter mp3
    simply `ended` at length/20 of the bar.

14. **Shuffle detects completion correctly.** Measured 15 → 19 at **t=18.0s**.
    See the defect below for what happens next.

15. **`data/tracks.json` is 28 uniform records with large dead columns.**
    `links` is **140 null cells** (all five fields, all 28 tracks) — the `<a>`
    branch at `js:796-798` has never executed. `transmissionNumber`, `explicit`
    and `visualTheme.lyricFragment` are null across all 28. `visualTheme` is
    **84 non-null values no line of code in the repo reads**; `effect` and
    `geometry` are 1:1 locked (geometry↔metatron, fog↔vignette,
    distortion↔vesica) so they encode one axis, not two. `duration` is
    populated on all 28 and rendered nowhere in the carousel. `id` is a
    byte-identical duplicate of `slug`. The **"$1"** download price is
    hardcoded in a template string at `js:804`, not in the data.

---

## THE DEFECT THAT SHIPPED — read this first

**Jumping to a track changes the track but leaves it PAUSED.**

Measured Aug 11 2026: two seconds after a synthetic `card.click()`, the section
has no `is-playing` class, `.track-sample-player__status` reads *"Play Sample"*
and the button is enabled showing the play glyph.

- **It is not shuffle-specific.** Every jump goes through `jumpTo()`, so
  **INDEX jumps, SHUFFLE advances and deep links all land paused.**
- **It is not the autoplay policy.** A rejected `play()` sets *"Sample
  unavailable"* (`js:894-896`); the status reads the idle string instead.
- **Likeliest cause, not yet proven:** ordering. `setFocus` rebuilds the panel
  and `wireSamplePlayer()` hands it a **fresh `Audio()`** element, so
  `playSample()` appears to act before the element it needs exists.
- **Do not re-try the obvious fix without reading this.** Pressing the play
  button 140ms after the jump, guarded on `is-playing`, produced a **double
  advance** (15 → 25 → 26 on one completion). The comment at `jumpTo()` records
  it.

Shuffle is otherwise correct: it toggles, reports `aria-pressed`, does not jump
on its own, does not advance on a deliberate pause, and detects completion.

---

## Do not do these

Everything in 19–24's lists still stands. Additionally:

- **Do not hide a container and assume its descendants are hidden.** See
  finding 5. `visibility: hidden` is overridable by a child; three bugs came
  from this in two files, and every one passed its automated check.
- **Do not inject `.track-experience` when Music opens.** `js/spine-bg.js:183`
  captures it **once** at load and line 234 guards the whole kick/snare
  detector on the result. Markup that arrives later means the reactive sky can
  never come alive.
- **Do not fade an ancestor of the carousel.** Any ancestor with `opacity < 1`,
  `filter`, `backdrop-filter`, `mask` or `contain: paint` forces an
  intermediate raster; `css/track-experience.css:169-183` measured the cost as
  **612 against 1087**. Use `visibility`, and put the beat's overlay **above**.
- **Do not position anything in Music with a bare `left: 50%`.** The stage's
  centre is not the panel's. This produced an off-screen exit label and a
  stack of ticks down the middle of the page in `music-collapse-lab.html`, and
  an off-centre toast here.
- **Do not renumber the rail.** See below.
- **Do not launch a second Chrome while one is running.** Still true, still
  costly.

---

## What is deliberate, so nobody "fixes" it

- **The rail is UNNUMBERED.** It carried 01–07 and the owner removed them: the
  navigator numbers a fixed set of **places**, which is a map; these are
  **actions**, and numbering actions implies an order that does not exist.
  There is a backstop rule (`.idx { display: none }`) so numbering can only
  return through a deliberate edit.
- **The connector overlay is hidden in Music**, not restyled. There are no
  reading cards there.
- **`.track-focus-panel__actions` is HIDDEN, NOT DELETED** — the owner asked to
  keep the five streaming/download buttons available. Two CSS rules bring the
  block back exactly as it was.
- **The `× Close` button is hidden.** `js:242` says *"Nothing to 'close' to any
  more"*; it calls `section.nextElementSibling.scrollIntoView()`, which would
  throw on null in a panel, and node 01 CLOSE is the close control.
- **Escape closes Music outright and does not cascade**, including from inside
  INDEX. `track-experience.js:252`'s unguarded document-level
  `Escape → stopSample()` fires alongside it and produces the wanted behaviour
  by accident — that is why the module needs no edit.
- **The seventh node is cloned, not hand-built**, and kept in the DOM
  `display: none` outside Music rather than removed — removing it would drop
  the ping animation's phase.
- **`music-collapse-lab.html` is kept.** Six variants, and variant 3 (GHOST) is
  deliberately the wrong answer, retained because seeing the boundary once was
  the point.

---

## Verified vs. asserted

**Verified by tooling, and looked at:**
- Git isolation, four commits, push parity, `main` at `13083d9`, zero
  production files touched across the whole session range.
- 61/64 checks in one Playwright run — the three failures are the defect above.
- The fit, the rail geometry, the label clearance, the hover rule's length and
  its 8px stop.
- The sample autoplaying and the sky answering with real envelope values.
- No raster-forcing ancestor of the carousel.
- All seven actions; the URL pushing, following jumps, Back exiting, deep
  links landing.
- The navigator restored verbatim on close — labels, aria, y positions, and
  non-Music nodes still opening their reading cards.
- Zero console errors.
- **Screenshots taken and actually looked at** at every stage; they found three
  bugs the 47-check suite passed.

**Asserted / NOT verified:**
- **The cause of the paused-after-jump defect.** The ordering explanation is
  the likeliest, not the proven one.
- **No mobile pass.** Nothing in this session was run below 1440×900 except one
  geometry reading.
- **Not integrated into `entrance-lab.html`.** The prefetch-during-entrance and
  build-at-handoff plan was designed and measured but not built; `music-lab.html`
  boots into the navigator and builds at load.
- **`prefers-reduced-motion` is coded and not tested** on this page.
- **The production host has still not been checked for Range support** — 23's
  item 7, untouched for three handoffs.

---

## Still open

1. **THE PAUSED-AFTER-JUMP DEFECT.** Top of the list. See its section above.
2. **Index covers stream in on a cold cache.** 28 full-size covers (10.1 MB,
   211–510 KB each) rendered into ~160px cells with `loading="lazy"`. The fix
   is a thumbnail set — an asset task. Loading eagerly would put 10 MB on every
   Music open to avoid ~1s of streaming.
3. **What PURCHASE should actually do.** It currently toasts *"Rise Up —
   purchase opens once payment is set up"*. `links.download` is null on all 28
   and the "$1" is hardcoded. Needs a decision: Bandcamp/Gumroad link, Stripe
   checkout, or email capture.
4. **Integrate Music into `entrance-lab.html`** — prefetch `tracks.json` during
   the entrance, build the carousel at the entrance→navigator handoff.
   Measured: that costs the entrance nothing and makes the open 0ms.
5. **The metadata + controls redesign.** Finding 15 is its spec. No seek, no
   volume, no time display, no track title on screen.
6. **Mobile** — the entrance headline breaks at 375px (24's item 1) and Music
   has never been run there.
7. **Layer 4** — confirm the production host answers 206. **Layer 2 and 5** of
   the Range plan.
8. **`spine-ui-wire.png` → webp.** 626 KB.
9. **Tuner integration, Archive wrap** — unchanged from 19.

**Closed since 24:** the Music immersive wrap (open since 19); the navigator's
collapse treatment; the contextual node string; and the question of what the
carousel costs to build, which had never been measured.

---

## Housekeeping

`scripts/serve.py` remains the serving command — **not `python -m
http.server`**. Playwright (Python) is installed and is the verification tool;
the recipe is in `.claude/skills/kundalini-session-start/SKILL.md`.

---

## Starting the next V2 chat

Attach this file (`V2HANDOFF 25.md`). `24` still owns the wordmark and the
coil; `23` owns the entrance redesign and the Range server; `19` owns the
navigator architecture. The new session needs folder access to
`C:\Users\Haight\Desktop\kundalini-spines-spine-ui` (the V2 worktree, **not**
production `kundalini-spines`) and should confirm `feature/spine-ui-v2` before
editing.

A good opening message:

> Here's the latest V2 handoff for Kundalini Spines (Spine UI V2 branch).
> Music jumps land paused — that's the top open item. Start there.
