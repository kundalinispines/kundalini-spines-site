# Source repository

repo: kundalinispines/kundalini-spines-site
branch: feature/spine-ui-v2

## Last sync

date: 2026-08-13T12:53:07Z

### Updated in this project

- Read `css/components.css` to write the collapsing-header patch against the real `.nav` class names.
- Found the measured opaque-nav note there and kept the collapsed bar at full opacity, against the brief.
- New handoff: `design_handoff_spine_document/` — left-axis spine document plus the header collapse, drop-in.
- Palette and type families were replaced by the owner this session; token values changed, names did not.

## Sync history

- 2026-08-12T11:53:09Z — built the design system from `feature/spine-ui-v2` (not `main`): tokens verbatim from `css/tokens.css` and `css/spine-ui.css`, the v2 surfaces (spine navigator, instrument footer, Archivo wordmark, magazine About), and the brand marks, spine/nebula/starfield plates, cover art and messenger portraits into `assets/`.

## Screen map

| Screen / area | Built from |
|---|---|
| Tokens (`tokens/*.css`) | `css/tokens.css`, `css/base.css`, `css/spine-ui.css` |
| Spine document (`ui_kits/website/SpineDocScreen.jsx`) | new — no upstream counterpart yet; handoff in `design_handoff_spine_document/` |
| Nav collapse (`components/navigation/Nav.jsx`) | `css/components.css` (`.nav`, `.nav__mark`, `.nav__links`), `css/track-experience.css` (`--nav-h`) |
| Home (`ui_kits/website/HomeScreen.jsx`) | `index.html`, `css/components.css`, `css/track-experience.css`, `data/tracks.json` |
| Navigator (`ui_kits/website/NavigatorScreen.jsx`) | `css/spine-ui.css`, `js/ks-chakras.js`, `design/spine-ui-v2/*.md` |
| Transmissions (`ui_kits/website/TransmissionsScreen.jsx`) | `transmissions.html`, `css/transmissions.css`, `data/transmissions.json` |
| Archive (`ui_kits/website/ArchiveScreen.jsx`) | `archive.html`, `css/components.css`, `data/archive.json` |
| About (`ui_kits/website/AboutScreen.jsx`) | `about.html`, `css/about-feature.css` |
| Site footer (`components/navigation/SiteFooter.jsx`) | `css/site-footer.css`, `js/ks-chakras.js` |
| Wordmark (`components/brand/Wordmark.jsx`) | `css/wordmark.css`, `assets/hero/wordmark-grain.png` |
| Terminal (`components/terminal/*`) | `css/transmissions.css` |
| Core / forms / media / content components | `css/base.css`, `css/components.css`, `docs/03-component-plan.md` |

Not read in full: `css/spine-bg.css`, `css/star-bg.css`, `css/shutter-text.css`, `css/text-scramble.css`, `css/field/*`, `css/music-wrap.css`, and the `HANDOFF` / `V2HANDOFF` series.
