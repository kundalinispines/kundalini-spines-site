# Kundalini Spines — Spine UI V2 Handoff 20

**Date:** August 9, 2026

Second handoff of the **Spine UI V2** track (branch `feature/spine-ui-v2`). The
plain `HANDOFF 1`–`19` series documents the dormant **production site on `main`**
and is background reading only. Read `V2HANDOFF 19.md` alongside this one — it
still owns the description of the spine navigator's architecture, the design
package, and the reframe about the stack.

---

## The one-line version

The desktop idle-read of the spine navigator is now **settled by the owner on
their own hardware** using a new live tune panel; and a second, separate strand
opened — an owner-supplied spine artwork was split into two hero assets and given
a scroll-driven entrance (hero video scrubbed by scroll → spine assembles).
**`main` was not touched.**

---

## Corrections to V2HANDOFF 19

Handoff 19 was accurate when written. These parts are now out of date:

- **"The prototype is ONE isolated file"** — no longer true. There are now
  **three** isolated lab pages: `spine-lab.html` (navigator), `spine-aster-lab.html`
  (reveal in isolation), `hero-scrub-lab.html` (hero scrub → reveal sequence).
  Still zero production files modified.
- **The tuning values it records are superseded.** 19 lists
  `--spine-anat-opacity: 0.74`, `--node-ring-active: 62px`, `--node-pulse-ms: 1700ms`,
  ring scale `2.3`, `--node-idle-opacity: 0.6`. All changed — see the table below.
- **"Refine the desktop feel" (top of its Still-open list) is CLOSED** for the
  idle-read pass. The owner gave a verdict this session.
- **19's implied claim that non-active decorative points recede when a card
  opens was never true in the running page.** The rule that was supposed to do it
  was dead code. Fixed this session — details under Measured findings.
- **"Optimize `spine-ui-wire.png` → webp" is still open.** A webp *was* produced
  this session, but for the NEW aster asset only. `spine-ui-wire.png` is untouched
  at 640 KB.

---

## Git state

- Branch `feature/spine-ui-v2`, worktree `C:\Users\Haight\Desktop\kundalini-spines-spine-ui`.
- Session start: `fb3b83e`, level with `origin/feature/spine-ui-v2` (verified by
  `git fetch` + `git status -sb`, not assumed).
- `main` = `origin/main` = `13083d9`, untouched. The feature branch is a sibling
  and cannot reach main on its own. No PR opened.

---

## What shipped, part 1 — the tune panel and the settled idle read

**`spine-lab.html?tune`** — a prototype-local tuning panel, 32 fields in 7 groups.
Built because every earlier "feel" judgement had been made in an 800×450 assistant
browser pane, where `--spine-anat-w: clamp(240px, 28vw, 380px)` sits at its **floor**.
Judging the spine at 240px when the owner sees 380px is the mistake this corrects.

- Field descriptors are written in the **shape of the production `/?tune` panel**
  (`FIELDS` / `TIPS` / `GROUPS`, single-quoted tips with no apostrophes) so they can
  be lifted into `js/spine-bg.js` wholesale at refactor time rather than rewritten.
- Sliders write CSS variables, persist to `localStorage` (`spine-lab-tune-v1`),
  and mark changed fields amber. **Copy changed** emits a paste-ready `:root {}`
  block. **Reset all** returns to the authored values. **Restart motion** drops
  every animation to t=0 so comet/ping sync can be judged from a known phase.
- Moving **Rise period** re-derives all six ping delays via `window.__spineLab.resyncEnergy()`.
  Without that the node flashes slide off the comet head — the desync V2HANDOFF 19
  warns about.
- Panel occupies a 330px lane and slides the whole axis left by half that via
  `--axis-shift`, so the spine stays optically centred while being judged. Spine,
  nodes, hint **and cards** all read that one variable.

**The settled values** (owner-dialled, Aug 9 2026, on their own screen):

| variable | was | now |
|---|---|---|
| `--node-idle-opacity` | 0.6 | **0.79** |
| `--node-size` | 10px | **10.5px** |
| `--node-glow` | 7px | **10px** |
| `--node-glow-a` | 0.6 | **0.59** |
| `--node-mark-a` | 0.35 | **0.5** |
| `--node-dim-when-active` | 0.3 | **0.78** |
| `--point-size` | 4px | **5px** |
| `--point-dim-when-active` | (dead rule, 0.12) | **0.69** |
| `--node-ring-active` | 62px | **48px** |
| `--node-pulse-ms` | 1700ms | **1350ms** |
| `--ring-scale` | 2.3 | **1.55** |
| `--spine-anat-opacity` | 0.74 | **0.64** |
| `--spine-anat-contrast` | 1 | **0.7** |
| `--node-label-offset` | 210px | **180px** |

**The through-line, so a later pass does not undo it by halves:** every one of
these moves in the same direction — *the nodes carry the page, the wireframe is
backdrop*. Raising the spine back up or thinning the nodes will feel wrong even
though each change looks reasonable on its own.

---

## What shipped, part 2 — the spine aster and its entrance

The owner supplied `spineaster1.svg` (1.05 MB, from `C:\Users\Haight\Pictures\`).
It opens as an apparently empty black rectangle, which is misleading.

**It contains two complementary layers, not duplicates:**
- a **raster** layer — a dense wireframe **mesh** over every vertebra, authored as
  pure-black RGB with the entire shape in the alpha channel (hence invisible on a
  dark site);
- a **vector** layer — 13 paths tracing the **outline** of the same spine, 82 KB
  of path data, total length 36,708 user units (path 1 alone is 32,527).

Split into two assets in `assets/hero/`, both keeping the source **1200×2150**
coordinate space so they stack in register:

- **`spine-aster.svg`** (84 KB) — the 13 paths **verbatim**, wrapped in
  `<g id="spine-aster">`, `fill="currentColor"` so CSS colours it. Art bbox is
  x 428–773, y 81–2069; the rest is empty margin, so size by height.
- **`spine-aster-mesh.webp`** (384 KB) — the mesh recoloured to white with the
  **alpha byte-identical to source** (verified: same extrema, same bbox, sampled
  abs-diff 0).

Together 468 KB versus the 1.05 MB original with nothing discarded.

**`spine-aster-lab.html`** — the reveal in isolation, with a Replay button and
sliders. **`hero-scrub-lab.html`** — the full sequence: hero video scrubbed by
scroll → aster assembles as its own beat → nav placeholder.

**Why a mask wipe and not `stroke-dashoffset`:** the outline is a single
2,089-command path. A dash draw traces it in *path* order, which wanders the
contour and reads as scribble. A mask advances in *space*, so the spine assembles
vertebra by vertebra. Do not "upgrade" this to a dash draw.

---

## Measured findings (date + method, so nobody re-derives them)

All measured Aug 9 2026 in a Chromium pane against the local `python -m http.server 8000`.

1. **The two hero encodes are NOT interchangeable for scrubbing.** Seek latency,
   six seeks each: **mp4 ≈ 0ms** after the first (57ms); **webm median 154ms,
   peaking at 250ms**. `index.html` lists **webm first**, so a scrub built on the
   production source order picks the slow one and stutters.
   `hero-scrub-lab.html` lists **mp4 first deliberately.** Do not "restore" source
   order to match index.html — webm-first is *correct* for the production page,
   which plays straight through where seek latency never shows.

2. **The hero video has a real audio track** — ~18.8 KB decoded in 0.9s of
   playback, roughly 167 kbps, in both encodes. The sound toggle is not
   decorative. The owner has since said the hero audio is expendable, so the
   scrub is silent; but the track is still in the files.

3. **`.spine-stage.is-card .spine-point { opacity: 0.12 }` was dead code** for the
   entire life of the prototype. `point-ping` sets `opacity` in every keyframe, and
   a running animation beats a normal declaration, so the decorative points never
   receded at all. Measured: opacity stayed on the animated value with a card open.
   Fixed by folding the dim **inside** the keyframes as a `--point-dim` multiplier.

4. **`--point-dim` is registered with `@property`** purely so it can *transition*.
   An unregistered custom property is not animatable, so the points would have
   snapped dark while the nodes beside them faded. Confirmed by observing a real
   `CSSTransition` on `--point-dim` alongside the running `CSSAnimation`.

5. **Media-event race in the scrub.** Attaching `loadedmetadata` / `canplay`
   listeners is not enough: on a warm cache the video is already `readyState: 4`
   before the script runs, the events never fire, and the scrub sits frozen at
   frame 0 while the scroll maths keeps working perfectly. Both now check
   `readyState` first. **This bug works on first load and dies on every reload
   after** — if scrubbing ever appears broken, check this first.

6. **`--p` must live on a common ancestor.** The scan line is a *sibling* of the
   wipe, so a `--p` set on the wipe never reached it and the leading edge sat
   motionless while the mask travelled. Same class of bug appeared twice.

---

## Do not do these

Everything in V2HANDOFF 19's list still stands. Additionally:

- **Do not restore `webm` before `mp4` in `hero-scrub-lab.html`.** See finding 1.
- **Do not replace the mask wipe with `stroke-dashoffset`.** See above.
- **Do not re-add `.spine-stage.is-card .spine-point { opacity: ... }`** as a plain
  declaration. It cannot work; the animation owns the property.
- **Do not remove the `readyState` checks** in the scrub in favour of listeners alone.
- **Do not strip the audio track from `messengers-hero-video.mp4/.webm`.**
  Production `index.html` still plays them with a working sound toggle. Stripping
  is only safe once the scrubbed hero actually replaces that hero (worth ~180 KB then).
- **Do not lower `--point-dim-when-active` back toward 0.12.** That number was the
  dead rule's untested intent; 0.69 is the first value anyone has actually judged.

---

## What is deliberate, so nobody "fixes" it

- **The `--scan-live` motion gate.** The leading edge is hidden unless the reader
  is actually moving, because under scroll-linking a motion cue otherwise parks
  mid-screen and glows at a standstill. Fast in (90ms), slow out (420ms).
  It is declared on `.aster`, **not** `.beat__stick` — that element already carries
  the `--p` transition in timed mode, and a second `transition` on the same element
  replaces rather than adds.
- **The reveal latches forward-only** (`Latch: on`). Raw scroll progress runs
  backwards, which disassembles the spine on scroll-up. A transmission that has
  arrived should not un-arrive. Reversible behaviour is kept behind the toggle for
  judging the wipe.
- **The hero dissolves into the star field** over the last 12% of the scrub
  (`--handoff`) rather than cutting. Nothing is painted behind the video, so fading
  it reveals the page's own sky — the same space the aster then draws onto.
- **Scrub length 260vh**, down from 340: at 340 the 8.77s hero costs ~18 wheel
  notches, which makes the entrance a chore.
- **Amber nodes, upward energy, continuous ripples** — all still deliberate per
  V2HANDOFF 19.

---

## Verified vs. asserted

**Verified by tooling this session:**
- Git isolation and branch parity — by running `git fetch` / `git status -sb`.
- Every one of the 14 settled values, read back as computed styles after a
  cache-busted reload; plus rendered proof (dot shadow, destination-ring colour,
  non-active node opacity 0.78 with a card open).
- All 14 decorative points reaching `--point-dim: 0.69` with a card open and
  returning to 1 on close.
- Scrub mapping, by scrolling: `scrub 0.34 → video 2.97s` (0.34 × 8.768 = 2.98),
  `scrub 1.00 → video 8.77s`.
- Latch: scrolled to `aster 0.66`, scrolled back up, value **held**.
- Motion gate: scan opacity 0 stopped, 1 moving, and visually absent after
  scrolling stopped mid-reveal.
- Handoff fade curve: flat at 1 through p=0.88, linear to 0 at p=1.
- No console errors on any lab page.

**Asserted / NOT verified:**
- **Nothing has been seen on the owner's own hardware except via their own
  judgement of the tune panel.** The assistant's pane is 800×450 and frequently
  does not composite frames, so transitions do not advance there and several
  readings had to be taken with transitions disabled.
- **No phone-width work at all** on any of the three labs. `hero-scrub-lab.html`
  in particular has had no mobile thought — sticky + scroll-scrub on iOS is its own
  problem (Safari throttles seeks and `100svh` behaves differently).
- **`prefers-reduced-motion` is coded on all three labs but never toggle-tested.**
- **Scrub smoothness is measured only on this machine, on localhost.** Over a real
  network with a cold cache the mp4 must buffer before it scrubs at all.
- The hero audio's *content* was never listened to — only proven to exist.

---

## Still open

1. **The motion cue becomes concentric rings** (owner, this session). Replace the
   flat scan line with amber concentric circles matching the navigation reticle —
   same `--node-color: 240, 165, 92`, same `node-pulse` ripple feel — oriented as a
   **hula hoop around the column**, travelling up it and beaming upward. Stated as a
   direction to work from, not a fixed spec. **Note:** a ring encircling the spine
   reads as an *ellipse* whose minor axis varies with height, so it likely wants a
   `rotateX` 3D transform or an animated SVG ellipse, not a flat circle. There is a
   comment marking the spot in `hero-scrub-lab.html`.
2. **Decide `Scroll-linked` vs `Timed once`** for the aster reveal — both are built
   and toggleable; the owner has not given a verdict.
3. **Mobile.** Two mobile prototypes for the navigator (§34) are still owed, and now
   the entrance needs a mobile answer too.
4. **Refactor** `spine-lab.html` into `css/spine-ui.css` + `js/spine-ui.js`, and
   lift the tune-panel descriptors into the production `/?tune`.
5. **Wire the entrance to the navigator** — currently `hero-scrub-lab.html` ends in
   a placeholder section; the owner chose "separate hero moment, nav comes after".
6. **Optimize `spine-ui-wire.png` → webp** (640 KB, untouched).
7. **Vercel preview** — still unchecked.
8. **Tuner integration**, **Music / Archive immersive wraps** — unchanged from 19.

**Closed since 19:** desktop idle-read refinement; the hero-entrance question
("what is the scrub down") — answered: scroll-scrubbed hero video, aster as its
own beat, nav after.

---

## Starting the next V2 chat

Attach this file (`V2HANDOFF 20.md`) and `V2HANDOFF 19.md` — 19 still owns the
navigator architecture and the stack reframe. The new session needs folder access
to `C:\Users\Haight\Desktop\kundalini-spines-spine-ui` (the V2 worktree, **not**
production `kundalini-spines`) and should confirm `feature/spine-ui-v2` before
editing. Serve with `python -m http.server 8000`; the labs link real CSS and
`hero-scrub-lab.html` fetches the SVG, so they need http, not `file://`.

**Reload note:** python's server sends 304s, and a stale HTML cache cost time this
session presenting as "the change did not work". Hard-reload (Ctrl+Shift+R) after
every edit.

A good opening message:

> Here's the latest V2 handoff for Kundalini Spines (Spine UI V2 branch). I want to
> work on the concentric-ring motion cue this session.
