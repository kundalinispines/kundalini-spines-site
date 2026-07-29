# Asset Plan

## Generated so far (Higgsfield)

| Asset | Job ID | Model | Aspect | Placement | Status |
|---|---|---|---|---|---|
| Messengers hero duo | `fef33bd6-c19d-4d1f-86b3-eccba1492777` | nano_banana_2 | 16:9 | Homepage hero (candidate) | Draft — pending explicit approval |
| Messenger‑A portrait (final) | `46c0cea8-c1fb-4de9-9775-0ad448c65aa5` | nano_banana_2 | 4:5 | About page, Transmission cards | **Approved** |
| Messenger‑B portrait | `69bd1459-9032-47b5-ab6b-976137d1908d` | nano_banana_2 | 4:5 | About page, Transmission cards | Draft — carried over, not yet re-confirmed |

Source elements (reusable across future generations without re-uploading photos): `Messenger-A` (`46229f47-2d2f-45f7-a578-8d169ca5fbb7`), `Messenger-B` (`37f342de-2add-4f4c-bcc7-2aa3530676d3`).

Full prompt text for each is preserved in the Higgsfield generation history and duplicated in `data/messengers.json` notes — nothing here is a one-off we'd have to reconstruct.

## Hero video — delivered

The homepage hero is now a looping background video instead of a static image (the static duo shot is kept as the `og:image` for social previews, since previews can't show video).

| Asset | Details |
|---|---|
| `assets/hero/messengers-hero-video.mp4` | H.264 + AAC, faststart, ~4.0MB (down from a 9.4MB source) |
| `assets/hero/messengers-hero-video.webm` | VP9 + Opus, ~3.3MB, served first via `<source>` for browsers that support it |
| `assets/hero/messengers-hero-video-poster.jpg` | Auto-selected representative frame — shown before playback starts and whenever `prefers-reduced-motion: reduce` is set |
| `assets/_originals/messengers-hero-video-original.mp4` | Untouched original, 9.4MB, 1920×1080, ~8s |

Behavior (`js/hero-video.js`): autoplays muted + looped (required for autoplay to be allowed at all), with a visible "Sound Off / Sound On" toggle over the hero — the source video's audio track is real (not silent), so the toggle is a genuine opt-in rather than decoration. If the visitor has `prefers-reduced-motion` set, the script never calls `play()` at all — the poster frame just sits there as a static image, and the sound toggle is hidden since there'd be nothing to control.

## Full track roster — delivered (27 tracks)

All 27 tracks from *Rise Up* are now live on both the homepage arc and `music.html`: real audio (20-second samples cut from the actual songs, non-silence checked, faded), real durations, and thematically-assigned effects (`fog` / `geometry` / `distortion`) and accent colors. Full original songs are preserved untouched in `assets/_originals/tracks/`.

**Cover art status:** the first 3 (Graveyard Shift, Dark Meta, Blue Pills) use real Higgsfield-generated concept art. The other 24 currently use a consistent placeholder treatment — an accent-colored radial gradient tile, matching each track's assigned color — so the site is fully populated and nothing looks broken, but they're not custom art. If you want unique Higgsfield art for some or all of the remaining 24 (like the first 3), let me know and I'll generate them in batches — each one still needs to be downloaded from the Higgsfield widget and sent back, since this sandbox can't pull the images automatically.

## Hero video — updated

Replaced with the newer cut (`herotake2_1.mp4`, 1920x1080, 8.75s) at the same asset paths (`assets/hero/messengers-hero-video.mp4` / `.webm` / poster), so no HTML changes were needed. Original kept in `assets/_originals/messengers-hero-video-original-v2.mp4`; the first version is still in `assets/_originals/messengers-hero-video-original.mp4` in case you want to revert.

## Homepage redesign — Music/Track section (delivered)

Per a follow-up brief (`WEBSITEREADME.txt`), the homepage was restructured to: Hero → Music/Tracks (full-screen interactive) → Newsletter → Bio → simplified Footer. The old identity-statement, three-entry-point, and featured-release/transmission sections were removed from the homepage (Transmissions/Archive are still reachable from the top nav on every page — nothing was deleted from the site, just decluttered off the homepage specifically).

**Typography changed sitewide** (nav/buttons/headings, all 7 pages): `--font-display` is now **Big Shoulders Display** (700/800) instead of Oswald — condensed, industrial, legible at nav/button scale. A **Big Shoulders Stencil** cut is reserved for large showcase moments only (hero title, big section headings) via a `.text-stencil` utility class, since stencil cutouts lose legibility below ~2.5rem. Body (Source Serif 4) and mono (IBM Plex Mono) are unchanged.

**Track data model**: `data/tracks.json` — one real release, three real tracks (Graveyard Shift, Dark Meta, Blue Pills, all from *Rise Up*, 2026). Full schema matches the brief's suggested `Track` type. Add a track by adding one object here plus its artwork/sample files — no component code changes needed.

| Asset | Status | Notes |
|---|---|---|
| `assets/audio/samples/*.mp3` (3 files) | **Delivered** | 20-second clips cut from the real uploaded songs, ~30% mark, checked for non-silence, 0.5s fade-in / 1s fade-out. Full original tracks kept untouched in `assets/_originals/tracks/`. |
| `assets/music/*-cover.jpg` (3 files) | **Delivered** | Real Higgsfield concepts, approved and uploaded by the user: graveyard fog (Graveyard Shift), Metatron's Cube (Dark Meta), mirrored duality (Blue Pills). Originals kept in `assets/_originals/covers/`. |
| Streaming/download links | **Placeholder** | `null` in `tracks.json` — the UI renders these as visibly disabled ("Coming Soon"-style) rather than fake live links, per the brief's explicit instruction not to invent URLs or pretend checkout is live. |

## Logo marks & favicon — delivered

No source vector files were ever supplied for the Primary Seal, Secondary Spine Mark, or favicon, so these were redrawn from the written spec in KS‑BRAND‑003 rather than adapted from existing artwork. Treat them as a first-complete-draft, not final canon — happy to revise proportions, density, or the K/S construction on feedback.

| Asset | File | Construction |
|---|---|---|
| Secondary Spine Mark | `assets/marks/spine-mark.svg` | 7 tapering segments ("Seven Nodes"), single silhouette. Used for the favicon and the small nav mark; legible down to 16px. |
| Primary Seal | `assets/marks/primary-seal.svg` | Outer ring, a restrained vesica-piscis pair (not a dense grid) standing in for the sacred-geometry reference, a 9-segment tapering spine as the central axis, a hidden "K" (two diagonals meeting the spine's left edge) and a hidden "S" (single curved stroke) flanking it for symmetry. Not yet placed anywhere on the site — candidate for the loading state or a large-format/social use per KS‑BRAND‑003's guidance to keep it out of everyday nav use. |
| Favicon set | `favicon.ico` (16/32/48 multi-res), `assets/marks/favicon-*.png` (16 through 512), `assets/marks/apple-touch-icon.png` (180×180) | All derived from the Secondary Spine Mark. Linked from every page's `<head>`. |

## Still needed before full build

| Asset | Purpose | Aspect ratio | Notes |
|---|---|---|---|
| Cover art | Featured release | 1:1 | Blocked on real release info — currently placeholder in `releases.json` |
| Transmission visuals (additional) | Transmissions section beyond #001 | 4:5 | Generate once more transmissions are scripted |
| Social preview (OG image) | Meta tags | 1.91:1 | Currently reusing the hero duo image directly; a dedicated crop/outpaint would look sharper |

## Pipeline

1. Generate/approve in Higgsfield (as done above).
2. Export approved job → save both a full-resolution original and a web-optimized version (WebP, capped ~1600px on the long edge for hero/cards) into `/assets/<section>/`.
3. Reference only the optimized path in the JSON content files; keep the original in an `/assets/_originals/` folder (not shipped to production) in case of reprints/upscales.
4. Log every new asset in the table above — placement, aspect ratio, prompt, status — before it's wired into a page.
