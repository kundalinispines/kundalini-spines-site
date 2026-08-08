# Kundalini Spines — Spine UI V2 Handoff 19

**Date:** August 8, 2026

**This is the FIRST handoff of a new, separate track.** The `HANDOFF 1`–`19` series documents the **production site on `main`** (reactive background, star field, lightning, tuner, mobile CSS). This `V2HANDOFF` series documents the **experimental Spine UI V2 redesign** on branch `feature/spine-ui-v2`. It is numbered from 19 so the number lines up with where main's series stood when V2 branched. The two series do not correct each other — they describe different work on different branches.

**Read alongside:** the design package committed this session at `design/spine-ui-v2/` (`DESIGN_REFERENCE.md`, `MOCKUP_CATALOG.md`, `INTERACTION_STATES.md`, `CLAUDE_IMPLEMENTATION_BRIEF.md`, plus the `notes/` variants and the mockup PNGs), and the master brief `KUNDALINI_SPINES_SPINE_UI_V2_CLAUDE_CODE_MASTER_PROMPT.md`.

---

## The one-line version

An isolated desktop prototype of the living-spine navigation now exists at `spine-lab.html`, built over the real site atmosphere, using a generated transparent wireframe-spine asset. It is committed to `feature/spine-ui-v2` as `c7f94bb`. **`main` was not touched and nothing was pushed.**

---

## Git state (verified this session, by running git)

- **Experimental worktree:** `C:\Users\Haight\Desktop\kundalini-spines-spine-ui` → branch `feature/spine-ui-v2`.
- **Production worktree (untouched):** `C:\Users\Haight\Desktop\kundalini-spines` → branch `main`.
- **Branch point:** `13083d9` (= `main` = `origin/main` at session start, and still).
- **Commit made this session:** `c7f94bb` — *"feat: add spine navigation shell prototype (spine-lab)"*, 21 files, +3304 lines. Purely additive (no existing file modified).
- **`feature/spine-ui-v2` is 1 ahead of `main`, 0 behind.** `main` and `origin/main` remain `13083d9`.
- **Not pushed.** The branch has **no upstream** — by choice, it stays local until explicitly pushed. A push would create `feature/spine-ui-v2` on GitHub; it can never reach `main` on its own.

---

## The reframe that governs everything (read before touching code)

**The master prompt assumes a stack that does not exist.** It repeatedly describes Next.js / React / Tailwind / Framer Motion / a live RSS parser and asks for `.tsx` component folders and a `SpineUIState` TypeScript interface.

**The actual site is a hand-built vanilla static multi-page site** — no `package.json`, no framework, no build step. Plain `.html`, a CSS custom-property token system (`css/tokens.css`), and vanilla JS. All V2 work is therefore vanilla **JS + SVG + CSS**. Connectors use native SVG `stroke-dashoffset`; "state" is a small plain object, not React.

**Two "spines" exist — do not confuse them:**
- **`js/spine-bg.js` + `css/spine-bg.css`** = the existing **reactive background visual** (the glowing anatomical spine band that answers the kick/snare). Protected. Not navigation.
- **The new Spine UI** (this work) = a **navigation layer** — a wireframe spine with interactive nodes. Separate system. It must harmonize with, never replace, the reactive background.

**"Archive/RSS" is local JSON, not a live parser.** `archive.html` uses static cards + `js/archive-filter.js`; transmissions fetch `data/transmissions.json`; `scripts/youtube-sync.mjs` pulls YouTube RSS *offline* into JSON. Preserve that plumbing when Archive is eventually wrapped.

---

## What shipped this session

Everything below is in the single isolated file `spine-lab.html` plus one generated asset. **No production file was modified.** The prototype reuses the real identity/atmosphere by linking `css/tokens.css`, `css/base.css`, and `css/star-bg.css`; the spine navigator itself lives entirely in this file's own `<style>`/`<script>`.

**The spine asset — `assets/hero/spine-ui-wire.png` (628 KB, transparent):**
- Generated with the image tool (`nano_banana_pro`, 4K, 9:16), "Variant 0" — a 3D wireframe-mesh human vertebral column (cervical→sacrum), luminous white on black.
- Converted to a **true transparent PNG by luminance→alpha in Pillow**: every pixel's alpha = its brightness, so the black background becomes fully transparent and only the glowing wireframe survives. A gamma of **1.65** was applied to the alpha to push the soft glow-halo down harder than the bright lines (a targeted glow reduction), then downscaled to 1200 px wide.
- Because it is genuine alpha, it is placed normally (no blend mode). The nebula shows through it natively.

**The spine (`.spine__anat`):** the transparent wireframe, centered, dominant, dimmed to `--spine-anat-opacity: 0.74`, breathing subtly. START (ENTRY) / CONTINUE (SCROLL) axis markers top and bottom.

**Nodes (on the central axis, per the user's reference images):**
- Six real destinations in master-prompt order — `01 Music`, `02 Story`, `03 Members`, `04 Ethos`, `05 Archive`, `06 Timeline` — as glowing **amber** light-points on a central luminous cord. `Music` and `Archive` are marked immersive "later-stage" stubs (deliberately not wired).
- Fourteen **decorative energy-points** spaced between them (non-interactive ambience).
- **Amber node colour** `--node-color: 240, 165, 92` — chosen to read as kundalini energy and to separate the nodes from the white spine.
- Nodes are real `<button>`s in a roving-tabindex toolbar (↑/↓/Home/End, Enter, Esc). Labels are **hidden until hover/focus**, revealed 210 px off the spine with a dark legibility shadow, and **cleared when the card is active** (the card carries the title).

**The rising energy (`.spine__energy`):** a comet that **travels UP** (bottom→top) — energy powering the chakras. Amber head (`::before`) leading, white trail streaming behind/below, beam 3.5 px. As the head reaches each node/point, that node fires a warm **colour ping** — synced by giving each a same-period `node-ping`/`point-ping` animation with a negative delay of `-(y-8)/84 × period` (CSS-only, no timing loop).

**The reticle (follows the hovered/active node):** concentric **amber rings that ripple outward** (`node-pulse`: scale 0.3→2.3 with an ease-out fade; two rings half a cycle apart = a steady radar-like train), plus a horizontal crosshair (`.rx`) that extends symmetrically with small square endpoints (`.sq`). Rings are **bigger on active** (`--node-ring` 26 px → 62 px) and smaller on hover.

**Cards (`.spine-card`):** frosted **glass** — `rgba(12,14,18,0.42)` + 18 px backdrop blur + a faint sheen — so the nebula reads through them. Positioned on the node's side, pushed **190 px** off the spine so text clears the glow. Rigid right-angle connector draws (SVG `stroke-dashoffset`) from node to card, with a bright travelling energy head; two ghost/depth outline frames build behind on activation. Real, on-brand copy (no lorem). Immersive cards use full bone text so they pop.

---

## Verified this session vs. asserted

**Verified (by tooling):**
- Git isolation, the commit, and that `main`/`origin/main` stayed `13083d9` — by running git.
- No console errors — checked via the browser console after each reload.
- Node / ping / ring wiring and the synced ping delays — checked by querying the live DOM (`music -500ms … timeline -6667ms`, 6 pings, 14 points, amber dot shadow, active ring 62 px vs hover 26 px).
- Visual states — checked via screenshots in the in-app browser pane (idle, hover/pre-focus, active card, comet frozen mid-rise, ripple frozen at ~2×).

**Asserted / NOT verified:**
- Nothing has been seen on the owner's own hardware/browser — only the in-app Chromium pane at ~800 px.
- **No phone-width check.** Only a graceful desktop fallback exists (`@media max-width:760px`), not a real mobile design.
- `prefers-reduced-motion` is coded (disables the rising comet, pings, ripples) but was not toggled-tested.
- The ping landing exactly on the comet head is math-derived and confirmed on frozen frames, not frame-stepped in live motion.
- No performance claim under the full site — the prototype is isolated and does not run the audio engine.

---

## Do not do these

- **Do not treat this as a framework app.** Vanilla static MPA. No React/Framer/RSS.
- **Do not confuse `spine-bg` (reactive background) with the new Spine UI navigation.** Different systems.
- **Do not re-add `mix-blend-mode: screen` to `.spine__anat`.** The PNG is already true alpha (luminance→alpha); a screen blend would double-process it.
- **Do not "fix" the upward energy.** It rises on purpose (kundalini). Reversing it also breaks the ping sync — the delays were derived for an upward pass.
- **Do not wire Music, Archive, the tuner, or the hero into the prototype yet.** Master prompt §42/§45 gate these — explain the change and get approval first.
- **Do not push `feature/spine-ui-v2`** without an explicit go-ahead. It is deliberately local.
- **Do not force the desktop spine onto mobile** (§34). Two mobile prototypes are owed first (vertical rail vs horizontal stepper), for review before choosing.

---

## What is deliberate, so nobody "fixes" it

- **Amber nodes and amber ripples/pings** — a chosen accent, tunable via `--node-color`. Not the brand crimson; picked to separate nodes from the white spine and read as rising energy.
- **Energy travels UP; rings ripple continuously** (not static) — both user decisions.
- **The prototype is ONE isolated file** — chosen for reversibility. The eventual home is `css/spine-ui.css` + `js/spine-ui.js`; the refactor is deferred until the feel is locked.
- **`design/` mockups (~8.7 MB) were committed** — the owner chose to include all four items. Consistent with the repo already tracking image assets.
- **Only a mobile fallback exists** — the real mobile candidates are deliberately deferred.

---

## Still open

- **Refine the desktop feel** — ripple/comet intensity, comet thickness, node-in-idle visibility. (Live-motion judgement; the owner had not given a verdict on the last ripple/comet pass at handoff time.)
- **Refactor** `spine-lab.html` into modular `css/spine-ui.css` + `js/spine-ui.js`.
- **Two mobile prototypes** (§34) — build + review before committing to a direction.
- **Tuner integration** — extend the existing `/?tune` `FIELDS`/`GROUPS` in `js/spine-bg.js` with the spine-UI variables (gated).
- **Music / Archive immersive wraps** — later stages, wrap-not-rebuild, approval required.
- **Optimize `spine-ui-wire.png` → webp** for production (currently a 628 KB PNG; no `cwebp`/`magick` on the box this session, so PIL was used for the alpha conversion).
- **Decide whether to push `feature/spine-ui-v2`** to GitHub (remote backup / possible Vercel preview to compare against production).
- **`design/` image weight in git history** — ~8.7 MB now permanent on this branch; a later cleanup is possible if it matters.

---

## Starting the next V2 chat

Attach this file (`V2HANDOFF 19.md`). The new session needs folder access to `C:\Users\Haight\Desktop\kundalini-spines-spine-ui` (the V2 worktree, **not** the production `kundalini-spines` folder) and should confirm it is on `feature/spine-ui-v2` before touching anything. Serve locally with `python -m http.server 8000` and open `spine-lab.html` (it links real CSS, so it wants http, not `file://`).

A good opening message:

> Here's the latest V2 handoff for Kundalini Spines (Spine UI V2 branch). I want to work on <thing> this session.
