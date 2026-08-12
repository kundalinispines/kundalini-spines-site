# Kundalini Spines — Spine UI V2 Handoff 30

**Date:** August 12, 2026

Twelfth handoff of the **Spine UI V2** track (branch `feature/spine-ui-v2`).
`29` owns the footer band, the about page's contrast and the `file://` lesson;
`28` the magazine about page and connect.html; `27` the navigator merge and
merch; `26` the footer, glass and field lab. The plain `HANDOFF 1`–`19` series
documents the dormant production site on `main`.

---

## The one-line version

**The deploy workflow's leak gap is closed, the navigator got the full motion
treatment from a design drop including a four-phase reroute the written brief
never mentioned, and the mark system was replaced with an anatomical spine.**
Four commits, all pushed. The session's expensive lesson: **a design handoff's
prose and its reference implementation disagreed, and building from the prose
produced something the owner did not recognise.**

---

## Corrections to earlier handoffs

- **29 SAID `--exclude='./HANDOFF*.md'` AND THE GUARD'S `-name 'HANDOFF*'`
  HAD THE SAME HOLE. Confirmed empirically, then fixed.** The old guard printed
  `Clean - nothing internal is being published` against a planted
  `V2HANDOFF 29.md`, and the old tar excluded `HANDOFF 19.md` while letting
  `V2HANDOFF 29.md` through. Both halves reproduced before either was touched.

- **29's "~17 `*-lab.html`" IS WRONG — there are 13.** The number being
  remembered is 18 internal root HTML files: 13 labs + `links.html` +
  `raster-test.html` + `raster-test-2.html` + `transmissions-options.html` +
  `transmissions-option5-v2.html`. 7 public + 18 internal = 25 root `.html`,
  checked against `git ls-files`.

- **`V2HANDOFF 1.md` HAS NEVER EXISTED.** The V2 series is `19`–`30`; the plain
  series is `HANDOFF 2`–`19`. There is no `HANDOFF 1.md` either.

- **29's "`--connector-active` is declared and read by nothing" (inherited from
  the design brief) IS WRONG.** It was being applied as an inline
  `connEl.style.stroke = 'var(--connector-active)'` at the end of the connector
  draw, which is why a settled connector had always been bone. It is now a
  class.

- **THE `kundalini-session-end` SKILL STILL SAID `python -m http.server 8000`.**
  `23` corrected `kundalini-session-start` and this file was missed, so every
  wrap-up since has been handing the next session the server that breaks video
  seeking. Fixed this session. **Grep both skills when a serving fact changes.**

---

## Git state

- Branch `feature/spine-ui-v2`. Session start `7467799` (V2HANDOFF 29).
- **Four commits, all pushed:**
  - `e2fe5ff` — deploy workflow: allowlist + rebuilt guard. 1 file, +191/−45.
  - `2c798ac` — navigator motion: reroute, geometry, crosshair, card, the pass.
    2 files, +703/−127.
  - `7dd6c8e` — the mark system. 21 files, +164/−54.
  - `<this handoff>` — docs.
- `main` untouched. No PR.
- **Nothing internal leaked** — checked per commit: no handoffs, no master
  prompt, no `.claude/` settings, no zips.

---

## THE DEPLOY WORKFLOW — CLOSED (29's top open item)

`.github/workflows/deploy-pages.yml` went from a 13-entry **denylist** to a
16-entry **allowlist**.

**Why allowlist.** A denylist fails *open* — forget a line and the file ships,
silently, which is what happened for eleven sessions. An allowlist fails
*closed*: forget a line and a page 404s, which is loud and reversible. The
public surface is 16 entries and grew by two pages in eleven sessions, so
enumeration is nearly free.

**Its usual objection is closed by a new step.** "A new page silently vanishes"
is answered by an accounting step: every root-level `.html` in `git ls-files`
must be either present in `_site` or match a known-internal pattern
(`*-lab.html|links.html|raster-test*|transmissions-option*`), or the build fails
and forces the classification. Verified: fed a hypothetical `tour.html` and
`My New Page.html`, both were named in the error; `index.html` and
`new-lab.html` were correctly skipped.

**The guard is deliberately NOT a mirror of the allowlist.** Mirroring is what
turned one hole into two. It names internal things directly and generously —
`-iname '*handoff*'`, unanchored and case-insensitive, plus `*master_prompt*`,
`*.md/.py/.mjs/.bat/.sh/.zip`, and the internal directories — so it still
catches arrivals through routes the allowlist never anticipated (an internal
`.md` dropped into `css/`, or someone "temporarily" adding `.` to `PUBLIC`). It
also fails if `_site/index.html` is missing or empty; the old guard passed
happily on an empty directory.

**Space handling is load-bearing.** `-print0` + `mapfile -d ''` in the guard,
`git ls-files -z` + `IFS= read -r -d ''` in the accounting step, `cp -R --` with
every path quoted. Every handoff filename has a space, and so does
`assets/messengers/ChatGPT Image Aug 11, 2026, 05_39_00 PM.png`. A fix that
breaks on the space would be worse than the bug.

**Verified** by replicating the copy and guard logic into a scratch directory:
239/239 public files land with **exact set equality** (no missing, no extra),
zero internal files land, and the guard exits 1 on a planted set of
`V2HANDOFF 29.md` + lab + `links.html` + master prompt + `scripts/` +
`design_handoff_navigator_motion/` + a `css/reference/` subdir — with the spaced
filename intact as **one** entry.

**Newly excluded, none of which were in the old list:** `.claude/` (tracked!),
`design/`, `reference/`, `scripts/`, and `assets/reference/` — an art-direction
source (`wordmark-teko-bold-letterpress.png`) sitting *inside* the otherwise
public `assets/` tree, named only in a CSS comment at `css/wordmark.css:179`.

### Left public, flagged, owner's call

- **Six unreferenced generator dumps under `assets/messengers/`** —
  `ChatGPT Image Aug 11, 2026, 05_39_00 PM.png`, `messangerassetsheet.png`,
  `messangerassetssheet2.png` and four `hf_2026….png`. Nothing in the repo
  references any of them; `data/messengers.json` names only the two
  `messenger-*-portrait.jpg`. Not secret, just raw source sheets — one with a
  filename that says "ChatGPT". Excluding by name is fragile, so they still
  ship.
- **`data/youtube-pending.json`** publishes as part of `data/`. Scraped from the
  channel's own public RSS, so nothing private, but it is a staging artifact on
  a public URL.

---

## THE NAVIGATOR — AND THE LESSON ABOUT THE DESIGN DROP

The owner dropped `design_handoff_navigator_motion/` (README, a patch CSS, and
`NavigatorReference.jsx` + `navigator-motion.css` marked "reference only"). The
README described six changes. **It was built from the README, and the owner's
response was that it did not land like the design did.**

**THE REFERENCE DOES SUBSTANTIALLY MORE THAN THE PROSE DESCRIBES, AND THE
BIGGEST PIECE IS IN NEITHER THE README NOR THE PATCH CSS.** Read
`NavigatorReference.jsx` first next time; the prose is a summary, not a spec.

What the prose omitted, all found by reading the JSX:

| | reference | what the README implied |
|---|---|---|
| choosing a second node | a four-phase **reroute** | nothing — an instant swap |
| hover preview | the **full dotted route** | (silent) |
| connector elbow | 55% of the run to the card | (silent) |
| card vertical placement | head row **level with the node** | "check whether `positionCard` already covers it" — it did not |
| endpoint square | rides the **tip** of the scaled rule, opacity .62 | (silent) |
| points between cards | **unmounted entirely** | the patch said `opacity: 0`; I talked the owner out of it and was wrong |
| flashes while a card is open | **none** | I "fixed" this into existence and was wrong |

### The reroute — the piece that makes it a system rather than a menu

Four phases in `activate()`. The point of all of them is that **nothing ever
disconnects from the axis**:

1. **RETRACT** `[draw]` — the established line pulls its fill back *into* the
   spine, **still lit** (`is-established` is deliberately left on).
2. **RELEASE** — card, connector and the whole ambient pass go dark.
3. **TRAVEL** `[draw * 0.75]` — a single 14px lamp (`.spine__pulse`) carries the
   focus along the column from the old node to the new one.
4. **FIRE** `[draw]` then **LAND** — the new line draws to where the card will
   be, then everything that says "this node is the one" happens on one frame.

Total ~2.75 × `--connector-draw-ms`. **Measured per animation frame:** release
at 527ms, lamp 51%→88% over 374ms, fire at 929ms, land at 1431ms — every phase
within a frame of the arithmetic. Retract confirmed by *computed*
`stroke-dashoffset` 0 → 205.3 over 515ms on the connector's ease curve (the
first attempt sampled the **inline** value and proved nothing). A first
activation enters at phase 3; reduced motion skips the sequence entirely.

Clicking a third node 300ms into a reroute restarts it cleanly — one active
node, right card, no stuck lamp.

### One geometry function

`geoFor()` is **pure in the node and the stage**. It never reads the card, which
is what lets phase 3 draw the line before the card exists. The preview and the
deployed line come from the same function, so the route the hover promises stays
true — verified **byte-identical path strings** for every node at two viewports.

**THE CARD'S HEIGHT MUST NEVER ENTER IT.** A height is only knowable after a
render, and a route that depends on one cannot be drawn before the card exists.
The card takes `maxH` as its budget and scrolls `.spine-card__body`.

### Where this deliberately departs from the reference

The reference hardcodes `yEnd = top + 46` (the card's head row). At the ends of
the rail that cannot be honoured — a 320px card's head row will not sit level
with a node at 88% of a 900px window — so it threw a long vertical leg.
**Measured legs with the reference's rule:** 190px at 1440×900, 206 at 1366×768,
212 at 1280×720, 220 at 1280×650, 168 at 1920×1080, and −35 to −45 at the *top*
node where the 90px floor pushes the card down instead.

The clamp on `top` is not the thing to relax. The **arrival point** is:

```js
var yEnd = Math.min(Math.max(y0, top + HEAD_ROW), top + want - HEAD_ROW);
```

**Worst leg falls from 220px to 45px**, and that 45 is the top node against the
90px floor — unavoidable without moving the floor. Everything else is 0; the
`V` in the path becomes a no-op.

**Why the bounds are safe, measured not assumed.** The window is
`[top + 46, top + want − 46]`, which only lands on the card if the card really
is `want` tall. Two cases: when the clamp bites, `maxH` *is* exactly `want` and
every card overflows it; when it does not, the card is its natural height — and
**all five cards were measured at six viewports from 1280×650 to 1920×1080 and
never came in under 361px against a `want` of 320.** Verified consequence: every
arrival lands on the card, with ≥46px clearance from its top and ≥54px from its
bottom.

> **ADD A ONE-PARAGRAPH NODE AND RE-CHECK THIS.** A card naturally shorter than
> `want` is the one case where the low end of that window could fall past the
> card's own bottom edge. `Stay Connected` (two paragraphs, 361px) is the
> current floor.

### Three corrections to the patch CSS, all recorded next to the code

1. **`--connector-active` was not unread** — see Corrections above.
2. **The patch's `transition` on `.spine-card.is-open` would have deleted the
   card's entrance.** It is (0,2,0) against the list on `.spine-card` (0,1,0),
   and a transition runs off the *after-change* style, so adding the class would
   have swapped the whole list and the card would snap in instead of rising. The
   full list now lives on `.spine-card` and **its order is load-bearing** —
   `activate()` writes a positional `transition-delay`.
3. **The patch's grouped reticle selector removed the crosshair's grow-out** by
   including the bare rest state at `scaleX(.62)`.

### The pass, and a trap worth keeping

The rising pass departs from the open node via a **negative** `animation-delay`,
stored as **the node's `y`, not milliseconds** — a millisecond offset is only
true for the period it was computed against, so dragging `--spine-ui-energy-ms`
in `?tune` with a card open would slide the pass off the node it is leaving.

**THE OFFSET CANNOT BE A CSS VARIABLE.** The design brief proposed
`animation-delay: var(--ks-phase-delay, 0ms)` on three selectors. On
`.spine__energy` that works; on `.spine-node__ping` and `.spine-point` it is
dead, because `js/spine-ui.js` has always written `style.animationDelay`
**inline** on those (the per-element sync to the comet head) and inline beats a
stylesheet. It would have moved the comet and left every flash behind, visible
only as "the flashes are wrong now". The phase is folded into the inline value.

**`animationName`, not the `animation` shorthand, for the restart.** The
shorthand's `none` writes every longhand inline including `animation-delay: 0s`,
which wipes the per-element sync and never restores it. The brief's snippet used
the shorthand.

---

## What is deliberate, so nobody fixes it

- **`animation-iteration-count: 1` means the ping and point flashes DO NOT FIRE
  while a card is open. Do not "fix" it to 2.** It looks like a bug and the
  arithmetic is genuinely counter-intuitive: the flash keyframes fire at 0%,
  every delay is negative so animation time starts past that 0%, and the next
  one is a full period away — which at 1 iteration is the end of the active
  duration. It was changed to 2 this session, which produced a beam accompanied
  by every node it passes flashing in sequence, and the owner said that was not
  what they had judged. Reverted. **An open card is one departing beam on an
  otherwise still column.**
- **The decorative points vanish entirely between cards** (`opacity: 0` under
  `.has-chosen:not(.is-card)`). Shipped visible for one revision on my
  recommendation; the owner reported it as not matching the reference, which
  unmounts them. Reverted.
- **The endpoint square's `left` is not transitioned.** The jump from the 0.62
  tip to the 1.0 tip happens at the same moment it fades to 0, so it is never
  seen moving. Adding `left` to the transition makes it a square that visibly
  slides out of a rule that already got there.
- **`assets/marks/spine-mark.svg` is referenced by nothing.** Every use moved to
  the solid cut. It is the large-size primary mark with no large-size home yet —
  not dead, waiting.

---

## THE MARKS

Owner-supplied revision, arriving as a self-extracting HTML bundle
(`Kundalini Spines Marks.html`, 578KB, mostly base64 webfonts). **It is not
readable statically** — it unpacks into blob URLs. Drive it in Playwright and
`fetch()` the blobs back as text.

Three assets, all installed with construction notes:

- **`spine-mark.svg`** — anatomical: vertebral bodies with transverse processes,
  widest at the middle of the column. The same read as the site's own wireframe
  spine rather than a separate abstraction of it. Replaces seven rounded bars.
- **`spine-mark-solid-cut.svg`** — NEW. Fill-based version for small sizes.
- **`primary-seal.svg`** — same construction (ring, vesica, hidden K, hidden S;
  the old file's notes were kept because they still describe it) with the new
  vertebra at its centre. The K diagonals moved x=88→80 and lost their round
  caps, which is what lets them read as *meeting* the column.

**The lockup in that bundle is not new type.** It is `var(--font-display)` —
Big Shoulders Display 700 at 19px — which the nav already uses. `css/wordmark.css`
and `js/wordmark.js` (the animated entrance wordmark) are untouched by this drop.

### The sub-pixel problem, and the owner's call

The primary cut is `stroke-width: 2.4` on a 100-unit viewBox — 2.4% of the
rendered box, so **0.38px at 16 and 0.43px at 18**, which is every size the site
uses it at. That is what the bundle's own note means by "below 16px use the solid
cut". Everything ≤24px moved to the solid cut: the SVG favicon link and
`.nav__mark` (18px) on nine pages, `.footer__brand` (16px) on index and music,
and spine-lab. Layout cannot have shifted — both SVGs are viewBox-only with no
intrinsic size and the `<img>` carries explicit `width`/`height`.

**THE SOLID CUT FIXES THE STRUCTURE, NOT THE WEIGHT.** Mean ink, old → new:

| | 16 | 32 | 48 | 180 | 512 |
|---|---|---|---|---|---|
| old | 0.62 | 0.68 | 0.75 | 0.89 | 0.93 |
| new | **0.41** | 0.59 | 0.68 | 0.85 | 0.91 |

The processes are 3.4 units tall — 0.54px at 16 — and grey out. The old
seven-bar mark was stronger there because it had no processes to lose. At 32px
and up the new drawing reads properly. **Owner's call after seeing the 6×
blow-ups.** If the tab is ever judged too soft the fix is a thickened micro cut,
not scaling this file down.

### `favicon.ico` was the one that mattered

**An earlier `<link rel="icon" href="favicon.ico" sizes="any">` sits BEFORE the
SVG link, and the root `favicon.ico` — not in `assets/marks/` — is the real tab
icon for anything that does not take the SVG.** It still held the old mark after
all seven PNGs had been regenerated. Rebuilt with its three embedded sizes
(16/32/48) preserved, each the exact render from its matching PNG, verified by
reading the sizes back out of the `.ico` and comparing ink per size rather than
trusting the write.

Icon conventions were **measured off the outgoing set**: opaque RGB on `#050505`
(not transparent), SVG rendered at the full icon box with no padding, and
`apple-touch-icon.png` byte-identical to `favicon-180.png`. Per size, two
rasterising routes were produced — browser AA at target size vs
render-at-1024-then-LANCZOS — and the stronger-inked one kept. They are not
equivalent at 16px.

---

## Do not do these

Everything in 19–29's lists still stands. Additionally:

- **Do not build a design drop from its README alone.** Read the reference
  implementation. The prose omitted the single most visible behaviour in it.
- **Do not put a `transition` on `.spine-card.is-open`.** It outranks the list
  on `.spine-card` and deletes the card's entrance.
- **Do not set `animation-delay` on `.spine-node__ping` or `.spine-point` from
  CSS.** Inline delays already own it.
- **Do not restart those layers with the `animation` shorthand.** Use
  `animationName`; the shorthand wipes the inline delay.
- **Do not raise the pass's iteration count to 2**, and do not restore the
  points between cards. Both were tried and rejected.
- **Do not let the card's height into `geoFor()`.**
- **Do not measure a transition from its inline target value.** Read the
  computed value; the first retract measurement proved nothing.
- **Do not assume `assets/marks/` is the whole icon set.** `favicon.ico` is at
  the repo root and is declared first.
- **Do not trust one `link[rel=icon]` from `querySelector`** — it returns the
  first in DOM order, not the one the browser uses.

---

## Verified vs. asserted

**Verified by tooling, and looked at:**
- Every navigator number above: reroute phases per animation frame, retract by
  computed `stroke-dashoffset`, preview/deployed path equality, connector legs
  and arrival clearances at six viewports, card heights at six viewports.
- Five navigator pages × five viewports (1920/1440/1366/1280/390): zero console
  errors, zero horizontal overflow, card 24px clear of the window bottom and
  inside the right edge, connector established everywhere except 390 (disabled
  by design). Reduced motion checked separately.
- The deploy workflow's three simulations, plus a control proving the OLD code
  broken rather than assuming it.
- All ten pages that reference a mark: every img loads, zero HTTP errors,
  `favicon.ico` / solid cut / `apple-touch-icon.png` all 200. Nav lockup
  captured at 5× and looked at. Icon ink measured per size.
- Two anomalies found during the sweep were **compared against the unmodified
  baseline by stashing** and are pre-existing, not this session's:
  `spine-card-glass-lab.html` overflows 920px at 390 (a fixed 400px card at
  `left: 910px`; that lab is already flagged stale in 28), and a 404 that did
  not reproduce in either run.

**Asserted / NOT verified:**
- **The `.footer__brand` mark was never seen.** The footer element reports zero
  height and is not in the viewport even after scrolling to the bottom — 29's
  "an element screenshot is not proof of visibility" caught it. The `<img>` is
  16×16 and loaded; whether it *looks* right at 16px on a real footer is
  unchecked.
- **The reroute has never been watched by a human.** Every phase is measured and
  the endpoints are screenshotted, but no one has looked at the lamp travelling.
- **The new marks on a real phone or a real browser tab.** All icon judgements
  are from rasterised alpha, not from a tab.
- Safari/Firefox anything — still not installed for Playwright.
- The deploy workflow has never actually run in CI.

---

## Still open

1. **Graduating the navigator to production** (29 item 4). The entrance +
   navigator + reading stack still has not replaced or joined `index.html`.
   This is now the top item, and the navigator is in much better shape for it.
2. **A large-size home for `spine-mark.svg`**, and any use at all for
   `primary-seal.svg`. Both are unreferenced.
3. **`favicon-16/32/48/192/512.png` are referenced by nothing** — they look like
   they were made for a `webmanifest` that does not exist. Either add one or
   delete them.
4. **A thickened micro cut** if the 16px tab icon is judged too soft.
5. **The about page's crimson** — parked by owner decision, evidence in the CSS.
6. **The footer's OPEN chip** — never judged (29 item 3).
7. The calibration frame clamp for cards (28 item 2); `music.html` and
   `hero-timeline-lab.html` still black; Safari/Firefox glass fallback; mobile
   pass on a real device; what PURCHASE should do (26 item 4); lab staleness
   (`music-collapse-lab.html`, `spine-card-glass-lab.html`,
   `hero-scrub-lab.html`); deploy/DNS; metadata + controls redesign;
   `assets/messengers/*.jpg` → webp; Range layers 2 and 5; tuner integration;
   Archive wrap — all unchanged.

**Closed since 29:** the deploy workflow leak gap (29's top item — shipped and
simulated); the navigator's six motion changes plus the reroute, the geometry
function and the arrival point; the mark system; the `session-end` skill's stale
server command; **`design_handoff_navigator_motion/` is now tracked** (`2acd411`,
owner's call) and carries `_IMPLEMENTATION-NOTES.md` recording where its README
misleads — read that before building anything else from that folder.

---

## Committing this

```
git add "V2HANDOFF 30.md" .claude/skills/kundalini-session-end/SKILL.md
git commit -m "docs: V2HANDOFF 30 - the leak gap closed, the navigator rerouted, the marks replaced"
git push
git status
```

`working tree clean` at the end is the proof.

---

## Starting the next V2 chat

Attach this file (`V2HANDOFF 30.md`). `29` still owns the footer band and the
about page's contrast; `28` the magazine about page and connect.html; `27` the
navigator merge and merch. The new session needs folder access to
`C:\Users\Haight\Desktop\kundalini-spines-spine-ui` (the V2 worktree, **not**
production) and should confirm `feature/spine-ui-v2` before editing.

**Serve with `python scripts/serve.py` and browse over `http://`. Not
`file://`, and not `python -m http.server`.**

A good opening message:

> Here's the latest V2 handoff for Kundalini Spines. The deploy leak gap is
> closed, the navigator has the full reroute, and the marks are replaced.
> Graduating the navigator to production is the top open item — start there.
