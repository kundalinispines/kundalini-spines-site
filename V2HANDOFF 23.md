# Kundalini Spines — Spine UI V2 Handoff 23

**Date:** August 10, 2026

Fifth handoff of the **Spine UI V2** track (branch `feature/spine-ui-v2`).
`V2HANDOFF 22` owns the Playwright install; `21` owns the navigator-in-entrance
warning and the coil's original geometry; `20` owns the settled desktop idle
read; `19` owns the navigator architecture and the stack reframe. The plain
`HANDOFF 1`–`19` series documents the dormant production site on `main` and is
background reading only.

---

## The one-line version

**The scroll-scrubbed entrance was abandoned and rebuilt.** The hero now
free-plays to the nebula, the headline shutter-reveals, an amber ENTER decodes,
and the real navigator takes over with the twin serpents running once. The
navigator was extracted into shared modules on the way. **`main` was not
touched.**

---

## READ THIS FIRST: the serving command in every earlier handoff is wrong

Handoffs 19–22 all tell you to serve with `python -m http.server 8000`. **That
server has no HTTP Range support**, and the consequence is silent and severely
misleading:

```
python -m http.server 8000        scripts/serve.py
video.buffered -> [[0, 8.768]]    video.buffered -> [[0, 8.768]]
video.seekable -> [[0, 0]]        video.seekable -> [[0, 8.768]]
currentTime = 5.469  ->  0        currentTime = 5.469 -> 5.469
```

Every `currentTime` write clamps to 0. No console error. `seeking` and `seeked`
both fire and `seeked` reports 0.

**Use `python scripts/serve.py`** (new this session, defaults to port 8000, so
it is a drop-in). `.claude/launch.json` and the `kundalini-session-start` skill
were both corrected. The older handoffs are historical records and were not
rewritten — when you read their serve line, ignore it.

---

## Corrections to earlier handoffs

- **22's finding 3 — "the page owns `video.currentTime`; a naive seek is
  overridden" — is WRONG.** Nothing was overriding it. It is the Range clamp
  above, and it hits the page's own seeks exactly as hard as a probe's.
- **22's finding 4 is RESOLVED, and it was not a bug.** The spine outline and
  flower-of-life geometry visible at scrub 0 are painted into the **hero
  video's own frame 0**, not the aster leaking through. Proved two ways: hiding
  `#heroVideo` removes them entirely, and at `scrollY 0` the aster's wipe box
  sat at document y 2400–3179 in a 900px viewport, 1,500px below the fold. The
  reveal's dark start was always correct.
- **21's finding 2 — "the wire is 22% wider than the aster, aspect 0.212 vs
  0.174" — measured the GLOW HALO, not the drawn bone.** At alpha threshold 24
  the two artworks are nearly identical: aster 345×1988, wire **348×1989**,
  both dead straight, sacral peaks within 1.4 units (172.6 vs 174.5).
  **Anything derived from that 22% figure is suspect, including the `0.95919`
  height-match factor.** The genuine difference is the waists: aster 55–57
  between vertebrae, wire 78–103.
- **21's dust arithmetic was right all along**, and 21 was right that it had
  never been seen. It had never been seen because `is-nav` ripped it off the
  screen — see finding 1.
- **20's aster asset split still stands as a record, but the aster is
  RETIRED.** `spine-aster.svg`, `spine-aster-mesh.webp`, the mask wipe and the
  dust are no longer part of the entrance. Files kept on disk deliberately.
- **21's entrance behaviour (intro-then-scrub at 5.469s) is SUPERSEDED.** So is
  20's scroll-scrub. There is no scroll anywhere in the new entrance.
- **22's still-open items 1, 2, 3 and 4 are closed** (finding 4 resolved, the
  entrance largely seen, the blue sliders fixed, the extraction done).

---

## Git state

- Branch `feature/spine-ui-v2`, worktree `C:\Users\Haight\Desktop\kundalini-spines-spine-ui`.
- Session start `51bb3f9`; end **`380621c`**, pushed, working tree clean,
  local and remote identical (`0 0`).
- `main` = `origin/main` = **`13083d9`**, untouched. No PR opened.
- Ten commits. **Zero production files modified** — no `index.html`, no
  `css/spine-bg.css`, no `js/spine-bg.js`.

---

## THE BIG CHANGE: the entrance was redesigned

The owner rejected the scroll-scrub outright ("I don't know if I'm liking this
whole scrub down idea anymore"). The replacement was settled through a long
structured interview; **every decision below is the owner's, not inferred.**

| beat | behaviour |
|---|---|
| 1 | hero video **free-plays 0 → 8.768s**, muted, autoplay, no scroll |
| 2 | **"KUNDALINI SPINES" is the headline** while it plays |
| 3 | clip ends on the nebula; video settles onto the site's own star field |
| 4 | **"Knowledge Hidden in Plain Sight"** shutter-reveals |
| 5 | an amber **ENTER THE SIGNAL** appears and decodes |
| 6 | ENTER hands off to the navigator; twin serpents run once |

Settled alongside it:

- **One page, one URL.** The nav fades up in place. A second page would repaint
  the background at the one moment the design cannot afford a seam — the clip's
  last frame and `css/star-bg.css` are near-identical images.
- **The real navigator arrives complete** — cards, reticle, comet, keyboard
  toolbar. Music and Archive stay unwired stubs.
- **Serpents are a one-shot**, firing as soon as the nav is visible.
- **Skip = button, Enter key, or wheel**, all seeking to the last frame so the
  reveal still plays.
- **Muted, no audio.** The track is untouched in the files.
- **The reactive SKY is kept; the reactive SPINE COLUMN is not.** `--spine-on`
  already ships 0 on the home page. `css/star-bg.css` consumes the kick/snare
  envelopes 30 times independently of `css/spine-bg.css`, so "keep the sky,
  drop the column" is a clean split. **The sky is deliberately still through
  the entrance and the idle navigator** — it comes alive when Music opens.
- **Retired work is kept on disk**, not deleted.
- **This is the intended `index.html` replacement**, built as a lab for now.

---

## What shipped

1. **`scripts/serve.py`** — Range-capable static server. 206 + `Content-Range`,
   open-ended and suffix forms, 416 when unsatisfiable, `Cache-Control:
   no-store` (which also ends the 304 problem that has twice presented as "the
   edit did not work"). `.claude/launch.json` now runs it.
2. **`is-nav` fix in `hero-scrub-lab.html`** — see finding 1.
3. **Amber HUD sliders** in `hero-scrub-lab.html` and `spine-aster-lab.html`.
   `hero-timeline-lab.html` already had the rule; `spine-lab.html` deliberately
   does not use `accent-color` and now says why.
4. **The navigator extraction** — `css/spine-ui.css` + `js/spine-ui.js`.
   `spine-lab.html` 1534 → 581 lines, keeping its 32-field tune panel.
5. **`js/spine-coil.js` + `coil-lab.html`** — serpents re-hosted onto the wire
   as a one-shot.
6. **`js/shutter-text.js` + `css/shutter-text.css` + `shutter-lab.html`** — the
   headline reveal.
7. **`js/text-scramble.js` + `css/text-scramble.css` + `scramble-lab.html`** —
   the door label decode.
8. **`entrance-lab.html`** — the whole sequence assembled.

---

## Measured findings (date + method, so nobody re-derives them)

All measured Aug 10 2026 via Playwright against `scripts/serve.py`.

1. **`html.is-nav, html.is-nav body { overflow: hidden }` broke `position:
   sticky` and hid half the dust.** The two declarations together make body a
   scroll container; `.beat__stick` stops sticking and snaps to the top of
   `.beat`. At scrollY 3700 its viewport y goes **0 → −1360** the frame
   `is-nav` lands, scrollY unchanged. `showNav()` fires at dust t=0.35, so the
   entire second half of the erosion — including the crown's departure, the
   whole point of the base-first sweep — played 1,360px off-screen and had
   never once been seen.
   **Either declaration ALONE locks the scroll and leaves sticky intact**
   (html-only and body-only both hold scrollY against a 900px wheel). Only the
   pair breaks it. Fixed to html-only; verified at the stock 2200ms with
   `stickY` 0 across every sample, ink 10160 → 0, `yBot` 744 → 348 → gone.
2. **The Range/seekable clamp.** See the top of this file.
3. **Wire alpha profile.** bbox x 424–774, y 80–2069 at threshold 24; centre-x
   **599.2, sd 0.8**; widest halfwidth **174.5 at y=1729**; waists 78–103;
   biggest one-row jump 31.6 at y=1486. The coil's envelope is a smoothed
   **upper** bound verified against all 1990 drawn rows — worst sag 0.48 units.
4. **The shutter is FIVE bands, measured.** Ink-extent jumps at y=196/211/230/243
   against five-slat predictions of 196.2/212.4/228.6/244.8; four slats predict
   200/220/241 and miss all three.
5. **In the shutter reference the ghost LEADS, it does not trail** (band 4:
   text −271px, accent −108px), and decays faster than the motion.
6. **In the scramble reference the two-tone split IS the effect.** Settled
   characters render in the text colour, churning ones in the accent colour.
   Resolve is strictly left to right, one character at a time, never
   re-scrambling behind the front, at **1 char / 100ms**. A first build without
   the split needed four separate tricks to stop reading as a flicker; with it,
   none.
7. **`.notdef` in a monospaced font carries the same advance as a real glyph**,
   so the usual `measureText` width check reports full coverage on a face
   drawing nothing but boxes. Pixel identity against U+E000 is the test that
   works.
8. **`url()` resolves against the STYLESHEET, not the document.** Moving
   `background-image: url("assets/hero/spine-ui-wire.png")` into `css/`
   repointed it at `css/assets/hero/` and the wireframe 404'd away — 86,872
   differing pixels, bbox exactly the spine column.
9. **A cold renderer rasterises `star-bg`'s blurred gradients differently** —
   up to 3/255 across 3.5% of the frame. Any pixel-diff comparison needs a
   noise floor established by capturing the untouched page twice first.
10. **The video's lattice clears by ~8.0s** and the clip ends on a nebula that
    is nearly `star-bg.css` itself. That is why the handoff is invisible.

---

## Do not do these

Everything in 19–22's lists still stands except where corrected above.
Additionally:

- **Do not serve with `python -m http.server`.** Use `scripts/serve.py`.
- **Do not re-add `html.is-nav body` to the overflow rule.** The two
  declarations are individually harmless and only lethal together, which makes
  it exactly the kind of thing a tidy-up restores.
- **Do not trust 21's "22% wider" figure** or anything derived from it.
- **Do not delete the retired aster assets, `hero-scrub-lab.html`, or
  `spine-aster-lab.html`.** The owner chose to keep them.
- **Do not put the coil canvases straight into the navigator's `.spine`.** The
  coil maps a 1200×2150 viewBox onto its canvas; the navigator paints that PNG
  into a narrow strip at `background-size: auto 100%` with `overflow: hidden`.
  They need a wrapper reproducing the full-PNG box inside the same crop. They
  also cannot go inside `.spine__anat`, which carries a scaleY animation and a
  filter that would both inherit.
- **Do not assume `css/spine-ui.css` is optional for a consuming page** — it
  now owns the authored tokens. The `--kick`/`--snare` stubs deliberately did
  NOT move; they are per-page, and a page running the real detector must not
  ship zeroes as defaults.
- **Do not remove the `canSeek()` guard** in `entrance-lab.html`. Without it,
  Skip restarts the video from the beginning on any server without Range.
- **Do not expect `window.__scramble` to exist on a consuming page.** The lab
  sets it; the module does not. `entrance-lab.html` exposes its own instance on
  `window.__entrance`.
- **Do not write a raw NUL byte into a source file.** One in
  `js/shutter-text.js` made ripgrep classify it as binary and skip it silently.
  It was a deliberate cache-key separator and is now the escape `'\u0000'`.

---

## What is deliberate, so nobody "fixes" it

- **The sky is still during the entrance and the idle navigator.** It is the
  payoff for opening Music.
- **The reactive spine column stays off.** The owner disliked it and
  `--spine-on: 0` is already the home page's shipped value.
- **The serpents are a one-shot** — gone for the session once they have run.
- **The headline is `visibility: hidden` until the reveal**, not `opacity`
  (the shutter driver owns opacity) and not `display: none` (the slat grid is
  measured from the rendered box).
- **Spaces in the scramble are never substituted.** The reference eats the
  space — "VIEW WORK" renders `VIEWWORK` — which is survivable at one space and
  not at two.
- **The scramble's symbol pool is `# % & @`, not the full ASCII set.** Frozen
  at the same millisecond, 16 symbols read as the text having *broken*; thin
  diagonals are the offenders and `?`/`!` are worse because the eye tries to
  parse legible punctuation.
- **`spine-lab.html` keeps its tune panel and does not use `accent-color`** —
  it rebuilds the track and thumb, and `accent-color` is dead CSS once
  `appearance: none` is set.
- **Two decodes in four seconds** (shutter then scramble) — the owner's call
  with the risk stated. `openDoor()` is the single line to cut it.

---

## Verified vs. asserted

**Verified by tooling, and looked at:**
- Git isolation, ten commits, push parity, `main` at `13083d9`.
- The entrance at scrub 0 under both servers — the actual cause of 22's
  finding 4, seen not inferred.
- The `is-nav` sticky break isolated and re-measured independently, and the
  fixed dust sweep at the stock 2200ms.
- The extraction as a **zero** pixel diff against a proper noise floor, plus
  all 14 settled values, node/point counts and both ring delays read back.
- The tune panel round-trip after the token move: authored 10.5px → slider
  18px inline → Reset → 10.5px.
- The coil on the wire at three points plus a 3× wavefront crop.
- The shutter mid-reveal and settled, at 1440 and 375.
- The scramble: 40/40 glyph audit, width spread **0.000000px** over my own
  211-sample sweep, `aria-label` intact mid-decode.
- The assembled entrance end to end, including the frozen mid-decode door.
- Zero console errors on every page, every run.

**Asserted / NOT verified:**
- **Nothing has been judged in live motion** — every visual call this session
  was made from frozen frames and contact sheets. Timing choices (the shutter's
  588ms, the scramble's 1050ms, the coil's 2800ms) are grounded in measured
  rates from the owner's recordings, but the owner has not watched them run.
- **No performance measurement at all.** The coil's stroke count and the
  scramble's per-frame DOM writes are untimed.
- **The two-decodes-in-four-seconds question is unanswered** because it can
  only be answered in motion.
- **`prefers-reduced-motion` is coded everywhere and tested only on the
  scramble.**
- **No mobile work beyond 375px captures** of the shutter and scramble. The
  entrance and navigator have had no mobile design pass.
- **The production host has not been checked for Range support.**

---

## Still open

1. **Watch the entrance run** — the one thing tooling cannot do. Everything
   above is frozen frames.
2. **Decide on two decodes in four seconds.** Shutter then scramble.
3. **The ENTER button is now much wider** ("ENTER THE SIGNAL"). It may want to
   be a quieter full-width control rather than a small boxed one.
4. **The navigator still says "CONTINUE / SCROLL"** on its axis marker and its
   hint line **overlaps that marker** at 1440×900. Both reference a scroll that
   no longer exists.
5. **Layer 2 of the Range plan** — a loud console warning plus a lab badge when
   `seekable` is empty.
6. **Layer 5** — a regression check that drives Skip under both servers and
   asserts it never lands near `currentTime` 0.
7. **Layer 4** — confirm the production host answers 206 before this replaces
   `index.html`.
8. **The Music immersive wrap** — now properly specified for the first time:
   cards over the reactive sky, spine column off, music playing, background
   animating. Next build.
9. **Delete `NAV_NODES` from `hero-scrub-lab.html`** — `js/spine-ui.js` now
   exposes `nodes`, so the hand-synced duplicate can go.
10. **Six dead tokens** in the navigator's `:root`, a redundant
    `.spine-node__ring--2 { width; height }`, and `var stub = 70 * progress * 4`
    in `drawConnector` which is a roundabout way of writing 70.
11. **`spine-ui-wire.png` → webp.** 640 KB, and now in the entrance flow.
12. **Mobile**, **tuner integration**, **Archive wrap** — unchanged from 19.

**Closed since 22:** the Range/seekable mystery; 22's finding 4; the blue HUD
sliders (three handoffs old); the navigator extraction (overdue three
handoffs); the dust never having been seen; the entrance redesign; the
serpents' re-hosting; and the "22% wider" error in 21.

---

## Housekeeping

`scripts/serve.py` is the serving command now, in the skill and in
`.claude/launch.json`. A memory note records the Range failure mode.

Reference recordings for the shutter and the scramble live in the session
scratchpad and are disposable — both effects' measurements are written into
their source files' comments, which is where they belong.

---

## Starting the next V2 chat

Attach this file (`V2HANDOFF 23.md`). `21` still owns the reduced-navigator
warning and the coil's original reasoning; `20` owns the settled idle read;
`19` owns the navigator architecture and the stack reframe. The new session
needs folder access to `C:\Users\Haight\Desktop\kundalini-spines-spine-ui` (the
V2 worktree, **not** production `kundalini-spines`) and should confirm
`feature/spine-ui-v2` before editing.

**Serve with `python scripts/serve.py`, not `python -m http.server`.**

A good opening message:

> Here's the latest V2 handoff for Kundalini Spines (Spine UI V2 branch). I
> have watched the entrance run and here is what I think of it.
