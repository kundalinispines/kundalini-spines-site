# Kundalini Spines — Spine UI V2 Handoff 32

**Date:** August 14, 2026

Fourteenth handoff of the **Spine UI V2** track (branch `feature/spine-ui-v2`).
`31` owns the full-system drop, the repalette, the nav collapse and the spine
document; `30` the deploy allowlist and the mark system. The plain `HANDOFF
1`–`19` series documents the dormant production site on `main`.

---

## The one-line version

**The eyeball pass ran and everything held; the owner then called three real
defects (nav hairline at rest, card-over-note collision, seed of life clipped
fullscreen) — all three fixed and measured; the rail got the graded tick field
and the lab's node ripple back; and all of it is now tunable from `?tune`
under a new RAIL group, including a palette-stop colour control.**

---

## Corrections to earlier handoffs

- **31's open item 3 ("`design_handoff_full_system/` tracking — owner's call")
  was ALREADY CLOSED before this session started** — commit `5e096c7` tracked
  it. The handoff was written before that commit landed.
- **31's "asserted / NOT verified" list is now mostly verified** (see the
  eyeball pass below). Still genuinely unverified: motion *feel* judged by a
  human eye, Safari/Firefox, a real phone.
- **31 said the vertebra field lights the current segment via `.is-active`
  (hard ±26px).** That mechanism is GONE — replaced by the graded `--vt` field
  this session. Any reading of `spine-doc.js`/`spine-doc.css` older than
  commit `[this session]` describes the binary version.

---

## Git state

- Branch `feature/spine-ui-v2`. Session start `5e096c7` (design drop tracked).
- Files touched this session: `css/components.css`, `css/spine-doc.css`,
  `js/site-footer.js`, `js/spine-doc.js`, `js/spine-bg.js`.
- `main` untouched. No PR.

---

## THE EYEBALL PASS (31's top open item)

One batched Playwright run at 1440×900 exercised everything 31 listed as
asserted-not-verified. All measured Aug 14 2026, zero console errors:

- **Hero video plays** — `currentTime` 1.98→3.18s while watched, 8.776s
  seekable over `scripts/serve.py`, loop on. Sound toggle flips `muted`,
  label and `aria-pressed` correctly.
- **Nav collapse is smooth in motion** — 92→80→68→58→47px measured at six
  scroll positions, `--nav-h` republished live at each, mid-travel frames
  inspected (links crisp, mark scales, rule fades in).
- **Carousel drag/snap/audio works** — real mouse drag snapped 15/28→16/28,
  Enter played the sample (pause state + red progress + `is-playing`), the
  focused card top clears the clip (the addendum's headroom fix holds).
- **Reveals + node tracking** — all 7 sections reveal, active node + label
  follow the viewport midpoint.
- **Footer healthy** — full wordmark both copies at `textLength=940`,
  in-page links in NAVIGATE.

## THE OWNER'S THREE CALLS, AND THE FIXES

1. **A 1px near-black line under the resting nav, sitewide.** Root cause is
   subtle and documented in `css/components.css`: the bar's gradient is sized
   to the padding box, the transparent 1px `border-bottom` extends the paint
   area, and default `background-repeat` TILED THE GRADIENT'S FIRST ROW
   (alpha .78) into that strip. Isolated by toggling one property at a time
   and diffing the pixel row (border off +69.8 brightness, background off
   +69.8, tail/scrim/video 0). Fix: `background-repeat: no-repeat` on `.nav`.
   Verified: the dip fell to noise (≤2.4) at 1440/1920/390.
2. **The focused card covered the platform note** (overlap 121.7px, identical
   at 1440 and 1920 — scale-invariant). Fix: removed `.ksd-bleed`'s
   `margin-top:-140px` so the existing 140px headroom padding IS the gap.
   Note now clears the card by 18.3px desktop / 63.6px mobile. **Do not
   restore the negative margin** — the comment in `spine-doc.css` records
   this.
3. **The seed of life clipped at the top in a fullscreen footer.** The
   drawing overflows `0 0 1000 420`: outer circles reach cy±2R = −46..482.
   Narrow windows letterbox (`meet` fits by width) and hide it; wide footers
   fit by height and slice 45px off the crown circle. Fix in
   `js/site-footer.js`: the viewBox is now DERIVED from cy and R
   (`0 -50 1000 536`), so a retuned radius cannot reopen the gap. Verified:
   ring fully inside with ~3px clearance at 1440 and 1920.

## THE RAIL: GRADED FIELD + NODE RIPPLE

Owner's ask: more ticks reacting, and the node emitting light "as it did with
our older version" (the lab navigator).

- **Graded tick field.** `js/spine-doc.js` writes `--vt` (0..1, smoothstepped
  over the `--ksd-field` radius, default 160px ≈ 9 ticks) per tick each
  scroll frame; `css/spine-doc.css` interpolates reach/brightness/descender
  from it. Endpoints match the old binary states exactly (idle .16 → .82,
  arm +5px). Writes are skipped when the rounded value is unchanged.
  Transition dropped 520→200ms — at 520 the wave trailed the scroll by half
  a second. `.is-active` on verts is REMOVED; `.is-passed` survives (memory
  is a threshold, not a falloff).
- **Node ripple**, ported faithfully from `css/spine-ui.css`: two
  `.ksd-node__ring` spans per node, radar train (1350ms, ring 2 at −½ cycle
  — verified −0.675s), scale 0.3→1.55, peak alpha .9, reduced-motion hides
  rings. **The longhand animation lesson is ported with it** — do not
  collapse the animation longhands into the shorthand; the lab measured both
  rings in phase when the shorthand's delay:0 won.
- **The ripple lands UNDER the vertical labels — owner's explicit call,
  mid-session.** `.ksd-label` z-index 2 over `.ksd-node` z-index 1, pinned
  with a comment so a DOM reorder cannot regress it.
- Owner was offered ring colour / field width / ripple mode choices and did
  not pick; shipped with the recommended defaults (cold white, 160px,
  continuous train), every one a token.

## THE TUNER: RAIL GROUP IN ?tune

`js/spine-bg.js` grew a RAIL group (open by default, between SNARE and
COLUMN): `field`, `ring sz`, `ring on`, `reach`, `peak`, `pulse`, `colour`.
All verified end-to-end Aug 14 2026:

- **`colour` is a new CHOICES row type** — the range input's value is an
  index into five palette stops (white / bone / moon / crimson / deep red),
  shown by name. The build loop, Copy CSS and Apply pasted all branch on
  `choices`. Switching to moon turned the live ring border
  `rgba(157,178,192,.55)`; dial-tests: field 160→300 lit 9→17 ticks live,
  pulse 3000 → computed 3s.
- **Copy CSS** emits the seven under a `/* css/spine-doc.css */` heading
  (paste into that file's `:root`). **Apply pasted** round-trips, matching
  colour triplets against the palette (a foreign triplet is reported, not
  applied). Verified by stubbing `clipboard.writeText` — the earlier check
  read the panel note and proved nothing, because headless Chrome granted
  the clipboard and the fallback never fired.
- **The rail group hides whole on pages without `.ksd-rail`** (same pattern
  as kick/snare, with its own reason string), and Copy CSS SKIPS dead
  fields — on about.html the rail values do not exist (spine-doc.css not
  loaded) and emitting the slider's browser-default midpoint would paste a
  number nobody chose. `f._dead` is the flag.
- **`--ksd-field` moved from `.ksd-doc` to `:root` in spine-doc.css, and
  that is load-bearing**: the panel writes inline styles on `<html>`, which
  reach the rail's read only by inheritance — a local declaration on
  `.ksd-doc` beats the inherited value and the slider is dead. Same family
  as the html-vs-body trap in 30/31. The JS re-reads the token every scroll
  frame; the field slider dispatches a synthetic scroll to repaint live.
- Panel count is 47 sliders, all tips covered. **Tuner labels must be ≤7
  characters** — the 56px name column was measured for 7; my first 8-char
  labels wrapped (caught by screenshot) and were shortened.

---

## What is deliberate, so nobody fixes it

- Everything in 30–31's lists still stands.
- **The ripple renders under the vertical labels** (label z2 / node z1) —
  owner's call, do not "fix" the ring being cut by the label.
- **`.ksd-bleed` has padding-top 140px and NO negative margin** — the gap
  between the platform note and the risen card is that headroom. Restoring
  the margin restores the note collision.
- **`--ring-color` is a doc-only token** (not mirrored to spine-ui.css —
  the lab reads `--node-color` directly). The other five ring tokens ARE
  mirrored; retune both files per the standing rule.
- **The seven non-slider rail tokens** (`--node-color`, `--node-size`,
  `--node-glow`…) are silently ignored by Apply pasted on purpose, so a
  paste of spine-doc.css's whole :root block does not read as half-failed.

## Do not do these

Everything in 19–31's lists still stands. Additionally:

- **Do not restore `margin-top:-140px` on `.ksd-bleed`.**
- **Do not collapse the ripple's animation longhands into the `animation`
  shorthand** — the shorthand sets delay:0 and kills the radar train.
- **Do not move `--ksd-field` back onto `.ksd-doc`** — the tuner writes to
  `<html>` and a local declaration goes dead (documented in the token block).
- **Do not re-add binary `.is-active` styles to `.ksd-vert`** — the graded
  `--vt` field replaced them; a class cannot express a falloff.
- **Do not give a tuner FIELDS entry a label over 7 characters** — it wraps
  the name column (measured; the CSS note on `.spine-tune span` owns this).
- **Do not put `*/` inside a JS block comment** (e.g. writing `--node-*/--ring-*`
  in prose) — it terminates the comment and the syntax error takes the whole
  file with it. Caught live this session in spine-bg.js.

---

## Verified vs. asserted

**Verified by tooling, and looked at:**
- Everything in the eyeball pass list above (video, collapse, carousel,
  reveals, footer) — measured AND frames inspected.
- All three owner fixes at 1440/1920 (+390 for nav/overlap): numbers above,
  screenshots taken and looked at, zero console errors, zero horizontal
  overflow.
- The rail: 9 ticks lit with a clean bell profile (0.21→0.99→0.11), rings
  animating (frame-diff 91), label-over-ring stacking, reduced-motion rule
  present.
- The tuner: 47/47 tips, live drags, both round-trip directions, hide gate
  and dead-skip on about.html, no wrapped rows after the label fix.

**Asserted / NOT verified:**
- **Motion FEEL is still unjudged by a human eye in real time** — the wave,
  the ripple cadence, the collapse easing. Endpoints and frames are measured;
  nobody has watched it scroll. The owner has looked at stills only.
- Safari/Firefox — still not installed for Playwright.
- Real phone, real tab.
- The seed fix in a footer aspect BETWEEN the letterbox and height-fit
  regimes (~aspect 1.9–2.4) was reasoned, not screenshotted.

---

## Still open

1. **The owner judges the new rail by feel** — field width, ripple cadence,
   ring colour. The RAIL group in `?tune` exists precisely for this; values
   they land on get Copy CSS'd into `css/spine-doc.css` `:root`.
2. **music.html is still black** (pre-existing) and stale next to the
   document's music section. Fix or retire.
3. **Stale `?tune` TIPS prose from the amber era** (31 item 4) — the OLD
   descriptions; the new rail tips are current.
4. **The two missing trivia files** (TerminalRow.prompt.md,
   terminal.card.html) and `design_handoff_spine_document/` if it exists.
5. Everything inherited: webmanifest favicons, PURCHASE, lab staleness,
   deploy/DNS, Range layers, Archive wrap, `assets/messengers/*.jpg` → webp.

---

## Starting the next V2 chat

Attach this file. The working folder is
`C:\Users\Haight\Desktop\kundalini-spines-spine-ui` on `feature/spine-ui-v2`.
Serve with `python scripts/serve.py`, browse over `http://`. Open
`http://localhost:8000/?tune` for the RAIL group.

> Here's the latest V2 handoff. The eyeball pass is done, the owner's three
> fixes are in (nav hairline, note collision, seed clip), and the rail has
> the graded field + node ripple with a ?tune RAIL group. Top item: judge the
> rail by feel and lock in tuned values.
