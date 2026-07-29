# Component Plan

Each component is a self-contained HTML partial + scoped CSS (BEM-ish naming) + optional JS module. All read tokens from `css/tokens.css` — no hardcoded colors/spacing.

| Component | States to cover | Notes |
|---|---|---|
| **Nav** | default (transparent over hero), scrolled (solid `--bg-primary`), mobile menu open/closed, focus-visible on each link | Sticky; collapses to a simple full-screen overlay menu under 768px |
| **Hero** | loaded, reduced-motion (static image, no reveal animation) | Slow fade/scale-in on load only, once, never loops |
| **SectionHeader** | — | Eyebrow label (mono, tracked-out) + display headline; reused across all section openings |
| **ReleaseCard** | default, hover, focus-visible | Cover art, title, type, release date, streaming icons |
| **TransmissionCard** | default, hover, focus-visible | Number (mono), title, thumbnail, short description; links through to a real static detail page (`/transmissions/[number].html`), not a JS modal — gives every transmission its own shareable URL and metadata with no extra accessibility work to get right |
| **ArchiveGrid + Filter** | default, filtered, empty state, loading | Filter chips from `archive.json` categories; empty state has real copy, not a blank box; entries link to their own static detail page for the same reason as above |
| **AudioPlayer** | paused, playing, loading, error (missing file) | Built on the Web Audio API/Howler; no autoplay; visible play/pause, scrub bar, time, volume; fully keyboard-operable |
| **Track Experience** | resting fan row (continuous rotation/scale/brightness by pixel distance from center), hover-edge panning (mouse), drag-to-snap (touch), selected/expanded (true fullscreen), closing, empty (data fails to load), reduced-motion (panning disabled entirely, instant settle) | `js/track-experience.js` + `css/track-experience.css`. Mouse: resting near the left/right edge of the row continuously pans it (no click needed); release/move to center and it settles on the nearest card. Touch: drag/swipe tracks 1:1 then snaps on release. Click/tap/Enter on the already-active (centered) card opens it — takes over the **entire viewport** (`position: fixed` on `<body>`, not nested in the section, so no ancestor transform can break its containment; body scroll locked). Data-driven from `data/tracks.json` — reusable per-track visual effects (`fog` / `geometry` / `distortion`) keyed off `visualTheme.effect`, no canvas/WebGL. Two bugs found and fixed during this redesign: (1) the fullscreen panel was nested inside a transformed ancestor, which silently constrains `position: fixed` to that ancestor's box instead of the viewport — moved the panel to `document.body`; (2) the fan-row geometry math read card width via `getBoundingClientRect()`, which reflects the *live scaled* size we apply per card — that fed back into the same calculation and froze the panning after one frame. Fixed by reading the static CSS width instead. Homepage-only; `music.html` uses a simpler non-arc listing (`js/music-page.js`) built on the same data file. |
| **Sample Player** | idle, loading, playing, error/missing file | Hard-capped at `sampleDuration` (20s) regardless of actual file length; only one sample plays at a time across the page. Two call sites (track detail panel, Music page cards) share the same interaction pattern. |
| **Newsletter form** | default, invalid-email error, loading, honest "not connected" info state | `js/newsletter.js`. Deliberately never claims a live subscription — no provider is connected yet (see asset plan for the integration point). |
| **MessengerCard** | default | Portrait, archetype label, short bio, used on About |
| **Button** | primary (solid bone-on-black), ghost (outline), text-link | All three get visible focus rings (`--focus-ring`), disabled state at reduced opacity, no color-only distinction |
| **Form fields** (contact/collab) | default, focus, error, disabled | Real inline error text, label always visible (no placeholder-as-label) |
| **Footer** | — | Social links, nav links, copyright, small secondary mark |

Empty/error/loading states get real copy per the design-in-writing guidance (e.g. "No archive entries in this category yet." not a blank grid).
