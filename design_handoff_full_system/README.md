# Handoff: Kundalini Spines — Full Design System → feature/spine-ui-v2

## Overview
This package hands off the complete Kundalini Spines design system — tokens, components, and every UI kit screen — for implementation directly into `kundalinispines/kundalini-spines-site`, branch `feature/spine-ui-v2`. The instruction from the owner is a **full replace**: for every screen covered here, tear out the existing implementation in that branch and rebuild it from this system, not a side-by-side variant.

## About the design files
Everything under `reference/` is an **HTML/React design reference**, not production code to copy verbatim. It was built as a design system project (inline-styled `.jsx` primitives + plain-CSS token files + click-through HTML screens) — a different runtime shape than the target repo, which has its own build, routing, and data layer. The task is to **recreate this system inside the target repo's existing environment** (its bundler, its component conventions, its data fetching), using these files as the exact visual and structural spec — colors, spacing, typography, and copy should transfer as written; component boundaries and CSS mechanics should transfer as intent, adapted to the repo's patterns.

## ⚠️ Protected: do not touch the track-card carousel
The existing track-card carousel animation in the repo (the music-section drag/swipe interaction) is explicitly called out by the owner as **protected behavior**. It should not be redesigned, re-timed, or reimplemented as part of this handoff, even incidentally while rebuilding the Music section around it — the new `TrackCard`/carousel-adjacent layout in this package (`reference/components/media/TrackCard.jsx`) should be dropped in around the existing carousel mechanics, not used to replace them. If the carousel's DOM structure must change to fit the new visual system, changes should be the minimum necessary to preserve the current animation code path unmodified. Confirm with the owner before touching anything under the repo's existing carousel JS/CSS.

## Fidelity
**High-fidelity.** Every screen in `reference/ui_kits_website/` is a pixel-level mock: exact hex values (via CSS custom properties in `reference/tokens/`), exact type scale, exact spacing, exact copy. Recreate pixel-perfectly.

## Screens / views
All six are full-replace targets.

1. **Home** (`HomeScreen.jsx`) — hero with two-messenger photography, headline "KNOWLEDGE HIDDEN IN PLAIN SIGHT," dual CTA (Enter the World / Listen Now), left-edge vertical spine rail with position dot.
2. **About** (`AboutScreen.jsx`) — magazine-style feature: masthead, feature head, pull quotes, spine-rail section markers running down the left edge.
3. **Music** (part of `HomeScreen.jsx` flow) — "ENTER THE TRACKS" section, track-card carousel (protected, see above), sample player.
4. **Transmissions** (`TransmissionsScreen.jsx`) — terminal-styled feed (`KS-TRANSMISSIONS`), channel tabs (ALL/X/INSTAGRAM/TIKTOK/YOUTUBE/SPOTIFY/FILED), dated log rows with cover art.
5. **Archive** (`ArchiveScreen.jsx`) — filterable grid (Artwork/Artifacts/Lyrics/Videos/Selected Records/Promotional Visuals/Concept Pieces).
6. **Navigator** (`NavigatorScreen.jsx`) — the animated spine-node navigation surface: column of nodes down a central rail, click-to-deploy cards with a lit connector line, comet/breath ambient motion. This is the most heavily iterated piece in the system — see `reference/components/spine/*.prompt.md` for the full behavioral spec per component before touching it.

Layout, exact component placement, and copy for every screen are readable directly in the corresponding `.jsx` file — treat the JSX inline styles as the spec.

## Interactions & behavior
- **Navigator deploy sequence**: node click → connector fires (line fills spine→card, ~520ms) → card emerges (~440ms) with staggered ghost frames (60/120ms). Switching between two open nodes on the *same* side: crosshair redraws directly. Switching sides: connector retracts fully into the spine, energy travels the column, then fires out to the new node — see `SpineCard.prompt.md` and `SpineNode.prompt.md`.
- **Ambient idle state** (no card open): rising "comet" light on the column (7s cycle, bottom→top), node ping as it passes, 3% column breath (7.6s), ambient points on the cord. This is the *only* time the comet runs freely — once a card is opened it becomes response-only (fires on selection), and while a card is open it parks and resumes from where it left off rather than restarting.
- **Nav header**: transparent over hero imagery, opaque `--color-black` once scrolled. Links over imagery read from `--spine-glow` (not `--text-secondary`, which is too dark on bright footage) with a two-pass legibility shadow — see the rule documented in `reference/github.md`'s screen map and `core/Label.jsx`'s `tone="over"`.
- **Hover/press**: buttons and cards use opacity and border-color shifts, not scale/bounce — see `core/Button.jsx` and `tokens/motion.css` for exact easing curves. Motion throughout the system is mechanical/deliberate, never springy.

## State management
These are static click-through mocks; no real state layer. For the rebuild, the target repo's existing routing/data-fetching should own screen transitions and content — these files are for visual/structural reference only. `ui_kits_website/Data.jsx` holds the placeholder content models used across screens (tracks, transmissions, archive entries) — shape only, not real data.

## Design tokens
All in `reference/tokens/`, imported by `reference/styles.css`:
- `colors.css` — full palette (current: cold-white spine glow `#E4E8EB`, ink `#03040F`, surface `#131B23`, border `#394750`, signal red rationed to ~2 uses/page). **These were repalette'd mid-project from an earlier warm-amber/bone set — the values in this package are current/final.**
- `typography.css`, `fonts.css` — type scale and family stack, includes the display-stencil showcase cut.
- `spacing.css`, `layout.css`, `borders.css`, `motion.css`, `spine-ui.css` — spacing scale, layout grid, border/radius rules, easing/duration tokens, and the spine-navigator-specific tokens (glow colors, card dimensions, timing).

## Assets
`reference/assets/` — logos/marks (`marks/`, including the seven-vertebra spine mark and primary seal, both original constructions, no placeholder), hero photography and plates (`hero/`), messenger portraits (`messengers/`), music cover art (`music/`), about-page imagery (`about/`). All are real assets from the source repo or produced for this project — none are placeholder stand-ins.

## Files
This package references files that live at the design-system project root rather than duplicating them (duplicate copies break the project's component compiler):
- `components/` — all React primitives, grouped by concern (`core/`, `navigation/`, `spine/`, `content/`, `editorial/`, `media/`, `forms/`, `brand/`, `terminal/`). Each has a sibling `.prompt.md` with usage + variants.
- `ui_kits/website/` — the six click-through screens plus `Data.jsx` and supporting CSS
- `reference/tokens/`, `reference/styles.css` — token CSS (safe to copy; not compiled components)
- `reference/assets/` — all visual assets
- `reference/github.md` — full source-repo mapping: which repo file each screen/component was built from, and what's changed since
- `screenshots/` — reference renders of Home, About, Music, Transmissions, Archive

## Source repo mapping
See `reference/github.md`'s "Screen map" table for the authoritative file-by-file mapping back to `kundalinispines/kundalini-spines-site`.
