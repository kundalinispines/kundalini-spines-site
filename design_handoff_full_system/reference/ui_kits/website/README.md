# UI kit — Kundalini Spines website

A click-through recreation of the site as it stands on `feature/spine-ui-v2`. Open `index.html`; the nav switches screens.

| Screen | File | Recreated from |
|---|---|---|
| Home | `HomeScreen.jsx` | `index.html`, `css/track-experience.css`, `css/components.css`, `data/tracks.json` |
| Navigator | `NavigatorScreen.jsx` + `navigator-motion.css` | `css/spine-ui.css`, `design/spine-ui-v2/INTERACTION_STATES.md` |
| Transmissions | `TransmissionsScreen.jsx` | `transmissions.html`, `css/transmissions.css`, `data/transmissions.json` |
| Archive | `ArchiveScreen.jsx` | `archive.html`, `css/components.css`, `data/archive.json` |
| About | `AboutScreen.jsx` | `about.html`, `css/about-feature.css` |
| Footer (all screens) | `components/navigation/SiteFooter.jsx` | `css/site-footer.css`, `js/site-footer.js` |

`Data.jsx` holds content lifted verbatim from the repo's JSON files.

## What is abbreviated

- **The track carousel** shows 10 of 28 tracks and snaps between them on click. The live carousel is drag/arrow-driven with a 3D arch, an out-of-context hero overlay for sharpness, per-track accent sampled from the artwork, and 20-second audio. That behaviour is **protected** — this is a visual stand-in, not a replacement.
- **The navigator** now runs all five states live — idle ambient, hover pre-focus, connector-then-card activation, reading, and the retract/travel/fire reroute. `explorations/navigator/` keeps the two tempo candidates the source clocks were chosen against.
- **The About masthead** is the settled frame of a scroll-driven reveal; the live page ties the wipe to scroll distance across a 200vh track.
- **The audio-reactive background**, the `?tune` panels and the eight field readings are not recreated.
