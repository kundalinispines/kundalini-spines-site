# Kundalini Spines — Spine UI V2 Handoff 31

**Date:** August 13, 2026

Thirteenth handoff of the **Spine UI V2** track (branch `feature/spine-ui-v2`).
`30` owns the deploy allowlist, the navigator reroute and the mark system; `29`
the footer band and the about page's contrast; `28` the magazine about page.
The plain `HANDOFF 1`–`19` series documents the dormant production site on `main`.

---

## The one-line version

**The owner dropped the full design system; the site is repaletted cold and
retyped to Archivo/Plex/Rajdhani, the nav collapses 92→47px continuously,
`index.html` is now the left-axis SPINE DOCUMENT with the protected carousel
inside it, and the navigator is retired to `spine-lab.html` by owner decision.**
Four commits, all pushed. Two expensive lessons: **chat attachments arrive with
systematically scrambled filenames**, and **PowerShell 5.1's `Get-Content`
silently mangles this repo's UTF-8 files.**

---

## Corrections to earlier handoffs

- **30's top open item ("graduating the navigator to production") IS RESOLVED
  THE OTHER WAY.** The owner's words: "retired as a lab. the spine doc should
  now be the hero replacement." The navigator lives on at `spine-lab.html`
  (repaletted, still functional); nothing from it moved to `index.html`.
- **30's "amber distinguishes nodes from the white spine" IS SUPERSEDED.** The
  owner repaletted wholesale; `--node-color` is `228, 232, 235` (cold white)
  in both `css/spine-ui.css` and `css/spine-doc.css`, confirmed with the owner
  before the change.
- **The `?tune` TIPS strings that describe node color as amber are now stale
  prose over correct values.** Names and wiring unchanged; only descriptions lie.

---

## Git state

- Branch `feature/spine-ui-v2`. Session start `0f6e3d7` (V2HANDOFF 30 docs).
- **Four commits, all pushed:**
  - `a39788c` — the cold repalette + type system. 18 files.
  - `204a2f0` — the continuous nav collapse. 2 files.
  - `2316f1f` — index.html is the spine document. 4 files (new:
    `css/spine-doc.css`, `js/spine-doc.js`, `.claude/launch.json`).
  - `0d1c131` — terminal tab face, showcase H1, six-item nav sitewide. 6 files.
- **`design_handoff_full_system/` is UNTRACKED** — the reconstructed spec
  (113 files under `reference/`). Tracking it is the owner's call, as it was
  for the navigator drop. Its `_RECONSTRUCTION-NOTES.md` is the provenance
  record: read it before trusting any file's history.
- `main` untouched. No PR.

---

## THE DROP, AND THE SCRAMBLE

The owner's `design_handoff_full_system/` arrived without its own spec —
the README points at `components/` (with `.prompt.md` behavioral specs per
component) and `ui_kits/website/` (seven screens) that the package deliberately
does not duplicate. They were then supplied through chat attachments, and
**the attachment pipeline scrambles filenames**: each batch's contents lag its
name list (leading names get dropped, trailing contents get truncated), so a
file named `SpineCard.prompt.md` actually held `Nav.jsx`, and four "svg" files
held binary webp. **Every file was renamed by content identity** — each JSX
declares its component, each `.d.ts` its props interface — and all 113
destinations were signature-verified by grep. If more design files ever need
to cross, **paste text into chat; do not attach.**

Still missing, none blocking: `components/terminal/TerminalRow.prompt.md`,
`components/terminal/terminal.card.html`, and the `design_handoff_spine_document/`
folder `reference/github.md` mentions (its content is fully covered by
`spine-doc.css` + `SpineDocScreen.jsx` + `Nav.jsx`, all heavily commented).
`ui_kits/website/navigator-motion.css` is a stand-in copied from
`design_handoff_navigator_motion/` — believed identical, never received.

## THE REPALETTE + RETYPE (`a39788c`)

- `css/tokens.css` rewritten: names unchanged, every value cold. Black `#03040F`,
  spine glow `#E4E8EB`, cold bone `#D6D5D0`, moonlight secondary `#9DB2C0`,
  slate grays, crimson `#7E2630`/`#A1333E` rationed to ~2 uses/page.
- Type: Archivo variable (display wdth 72/750, showcase wdth 110/800, wordmark
  wdth 62/900), IBM Plex Sans body, IBM Plex Mono readouts, **Rajdhani for ALL
  small interface type** (nav, buttons, chips, eyebrows), Anton on About only.
  `--font-display-stencil` survives as an ALIAS to the showcase face —
  `track-experience.css`, `transmissions.css` and `components.css` still read it.
- Warm literals swapped across eleven stylesheets (117 total): bone
  `216,208,190→214,213,208`, white `242,242,238→228,232,235`, black
  `5,5,5→3,4,15`, amber `240,165,92→228,232,235`, plus hex forms.
  **`css/track-experience.css` had zero and was not touched (protected).**
- **Build numbers bumped: `--spine-build: 38`, `--star-build: 27`.**
- Font `<link>` swapped on the six public pages + `spine-lab.html`. `music.html`
  and `links.html` load no Google fonts (music is still the known-black page).

**THE UTF-8 LESSON.** The first font-link swap used `Get-Content`/`WriteAllText`
and corrupted every non-ASCII character in seven HTML files (PS 5.1 reads
BOM-less UTF-8 as ANSI: `·` became `Â·`). Caught by a screenshot, fixed by
reverting and redoing with `[IO.File]::ReadAllText/WriteAllText` with an
explicit `UTF8Encoding($false)`. **Never touch this repo's files with
`Get-Content`/`Set-Content`/`Out-File`.**

## THE NAV COLLAPSE (`204a2f0`)

`js/nav.js` writes `--nav-p` (0..1 over a 150px ramp, rAF-throttled);
`css/components.css` derives everything by `calc()`: padding 30→9px, mark
19→14.5px, glyph 20→15px, gap 34→19px, veil/rule/tail on the full travel,
sizes damped ×0.55 on mobile. **Measured: 92px → 47px exactly, `--nav-h`
republished live** (the scroll handler calls `setNavH` — ResizeObserver watches
the content box and misses padding changes). The collapsed bar is FULLY OPAQUE
(the measured 2026-08-04 rule survives, restated in the file). `.is-scrolled`
is inert; markup keeps it harmlessly. Links are Rajdhani at
`rgba(228,232,235,.82)` + the two-pass shadow — `--text-secondary` is too dark
over footage now. Buttons moved to the label face with it.

## THE SPINE DOCUMENT (`2316f1f`) — index.html is the home

One long page, axis pinned at `6vw` left, everything reaching right.
`css/spine-doc.css` (designer's comments preserved; token block mirrors
`css/spine-ui.css` — **retune both or they drift**) + `js/spine-doc.js`
(vanilla port of `SpineDocScreen.jsx`).

- Sections: home (video hero), about, music (carousel), merch, transmissions
  teaser, archive teaser, connect (newsletter). Nav: About/Music/Merch scroll
  the document; Transmissions/Archive are pages; **the magazine about.html is
  reached from the document's "Read the Feature", not from the nav** — kit
  design, deliberate.
- Node placement is MEASURED per section (headline optical centre; the Home
  node at the footage's foot). **Verified: 7 nodes, 202 vertebrae, exactly 7
  anchor segments, active node + lit throw follow the viewport midpoint.**
- **Deliberate deviation from the reference:** positions come from
  `getBoundingClientRect` against the wrapper, not `offsetTop` — the hero is
  its own offset context after the escape margins, so offsetTop answers the
  wrong question there.
- **The `:not()` specificity trap, paid for once:** `.ksd-hero > :not(.ksd-hero__media)`
  is (0,2,0) and silently beat `.hero__sound-toggle`'s `position:absolute`,
  stretching the toggle into a full-width bar. The re-absolute rule sits next
  to it with the story. Watch this if any other absolutely-positioned child
  ever enters the hero.
- **The carousel is untouched.** Markup moved verbatim (minus the old intro
  div, recomposed onto the axis); `js/track-experience.js` unmodified; 28
  tracks verified rendering; the section keeps `id="tracks"` because
  `track-experience.css` computes `scroll-margin-top` from it and old
  `/#tracks` deep links exist. It bleeds RIGHT only — the axis is the one
  thing nothing may cover.
- The connect section uses `.ksd-connect`, NOT `.newsletter` — that class's
  centring belongs to connect.html where the block runs as a page.
- Merch section carries TWO ghost buttons ("View the Objects" → merch.html,
  "Be Told First" → #newsletter). The kit had only the second; merch.html
  would otherwise be orphaned. Deviation, flagged.

## TRANSMISSIONS + ARCHIVE + ABOUT (`0d1c131`)

All three turned out to already BE the kit spec — `github.md`'s screen map
shows the kit was traced FROM them. The cascade recolored them; the only real
changes: channel tabs moved from mono to the label face ("interface, not
data"), and the terminal H1 took the showcase cut. Archive's chips/cards and
About's whole magazine structure matched the spec value-for-value. **Crimson
budget on transmissions: exactly two (live dot + selected underline).**

---

## What is deliberate, so nobody fixes it

- Everything in 30's list still stands (navigator behaviors now apply to
  `spine-lab.html`).
- **`.is-scrolled` in subpage markup is inert.** Do not "clean it up" into a
  style again; the collapse model owns the bar.
- **about.html is not in the nav.** The About nav item scrolls the home
  document; the feature page is a destination inside it.
- **The comment in components.css describing the old bar as "rgba(3,4,15,0.92)
  with a 6px blur"** originally said `rgba(5,5,5,...)` — the literal sweep
  rewrote history inside a comment. Cosmetic; the measurement story is intact.
- **`--nav-h-max` lives in tokens.css (92px, 62px ≤760px).** Layout clearance
  reads it; the live `--nav-h` is only for scroll offsets. Feeding `--nav-h`
  into padding shortens the document as you read it.

## Do not do these

Everything in 19–30's lists still stands. Additionally:

- **Do not attach design files from Temp in chat** — the names scramble.
  Paste text, or verify by content before trusting a filename.
- **Do not touch site files with `Get-Content`/`Set-Content`/`Out-File`** in
  Windows PowerShell 5.1 — BOM-less UTF-8 reads as ANSI and every em-dash,
  middot and arrow corrupts. Use `[IO.File]` with explicit UTF-8, or the
  Edit/Write tools.
- **Do not define ksd tokens only in one place** — `css/spine-doc.css` mirrors
  a token subset of `css/spine-ui.css`; retune both.
- **Do not re-centre the connect section** with `.newsletter`.
- **Do not add blur to the collapsed nav.**

---

## Verified vs. asserted

**Verified by tooling, and looked at:**
- Repalette: computed heading/body fonts + background on 9 pages, zero console
  errors, zero horizontal overflow; merch/connect/index/spine-lab screenshots
  inspected; mojibake grep clean after the UTF-8 repair.
- Nav: 92→47px, `--nav-h` live, opacity 1 at p=1, Rajdhani links, expanded and
  collapsed states screenshotted and inspected.
- Spine document: 7 nodes / 202 verts / 7 anchors, active-follows-scroll at the
  music section, 28 carousel tracks render, sound toggle rect (1279, 842).
- Footer: instrument band, OPEN/STANDBY chips, outline wordmark — screenshotted
  cold, inspected.
- Final sweep: 6 pages × 4 viewports (1440/1280/768/390) — no console errors,
  no horizontal overflow. Index at 390 inspected (axis at 22px edge, correct
  recomposition).

**Asserted / NOT verified:**
- **The carousel's drag/snap/audio interaction was not manually re-exercised**
  — its JS is byte-identical and its markup verbatim, and it renders, but no
  human or script dragged it this session.
- **The hero video PLAYING on the new home** — the poster and layout verified;
  playback/sound toggle behavior not re-tested (ids unchanged, js untouched).
- The nav collapse and headline reveals have not been watched by a human eye
  in motion; endpoints are measured and screenshotted.
- Safari/Firefox — still not installed for Playwright.
- Real phone, real tab.

---

## Still open

1. **Judge the new surfaces by eye** — the collapse in motion, the document
   scroll feel, the reveals, the carousel inside the bleed. Everything is
   measured; almost nothing has been *watched*.
2. **music.html is still black** (pre-existing) — and now stale next to the
   document's music section. Either fix or retire it.
3. **`design_handoff_full_system/` tracking** — owner's call, precedent says yes.
4. **Stale `?tune` TIPS prose** (amber descriptions over cold values).
5. **The two missing trivia files** (TerminalRow.prompt.md, terminal.card.html)
   and `design_handoff_spine_document/` if it exists.
6. Everything inherited: webmanifest favicons (30 item 3), thickened micro cut
   if the tab is too soft, PURCHASE, lab staleness, deploy/DNS, Range layers,
   tuner integration, Archive wrap, `assets/messengers/*.jpg` → webp.

---

## Starting the next V2 chat

Attach this file. The working folder is
`C:\Users\Haight\Desktop\kundalini-spines-spine-ui` on `feature/spine-ui-v2`.
Serve with `python scripts/serve.py`, browse over `http://`. The spec lives in
`design_handoff_full_system/reference/` — read the component's `.prompt.md`
before building anything from it, and read `_RECONSTRUCTION-NOTES.md` before
trusting any filename's history.

> Here's the latest V2 handoff. The full design system is in: cold palette,
> Archivo/Plex/Rajdhani, collapsing nav, and index.html is the spine document
> with the carousel intact. Top item: watch it all in motion and judge by eye.
