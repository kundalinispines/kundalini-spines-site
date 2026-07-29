# Kundalini Spines — Website

A static, dependency-free website for Kundalini Spines: dark cinematic mysticism, built as plain HTML/CSS/JS with no build step.

## What's here

```
index.html                    Home
music.html                    Music (releases/tracks — currently empty state, no release yet)
transmissions.html            Transmissions index
transmissions/001.html        Transmission 001 detail page
archive.html                  Archive index (filterable)
archive/artwork/001.html      Archive entry detail page
about.html                    About + Messengers + contact

css/tokens.css                Design tokens (color, type, spacing, motion) — the source of truth
css/base.css                  Reset + typography + layout primitives
css/components.css            All component styles
css/track-experience.css      Homepage Music/Track arc + selected-track detail view

js/nav.js                     Scroll state + accessible mobile menu
js/audio-player.js            Reusable audio player (no autoplay), not yet used on a live page
js/archive-filter.js          Archive category filter
js/track-experience.js        Homepage track arc: hover info, selected/expanded view, 20s samples, effects
js/music-page.js              Simple real-track listing on music.html (shares data/tracks.json)
js/newsletter.js              Newsletter form states (no provider connected yet — see below)

data/*.json                   Documented content model (see "Editing content" below — not yet live-wired)
data/tracks.json              Track data model — title, artwork, sample, links, per-track visual effect theme
assets/                       Images (optimized web versions; originals in assets/_originals/)
assets/marks/                 Logo marks (spine-mark.svg, primary-seal.svg) + favicon set
assets/music/                 Track cover art (currently placeholder gradients — see known limitations)
assets/audio/samples/         20-second track samples (real, cut from the uploaded songs)

favicon.ico, sitemap.xml, robots.txt   at the project root
docs/                          Planning docs: sitemap, content model, component plan, asset register, architecture
```

## Running it locally

This is plain HTML — there's no `npm install` or build step. But **don't open the files directly by double-clicking** (`file://...`); the nav's home link and favicon use root-relative paths (`/`) that only resolve correctly over HTTP. Instead, serve the folder:

```bash
# either works
python3 -m http.server 8000
# or, if you have Node:
npx serve .
```

Then visit `http://localhost:8000`.

## Deploying

No build command — it's already the production output. Any static host works:

- **Vercel / Netlify:** drag-and-drop the folder in their dashboard, or connect the git repo (leave the build command empty, output directory = project root).
- **GitHub Pages:** push to a repo, enable Pages on the root of the default branch.

Before going live: replace the placeholder domain (`https://kundalinispines.com`) in `sitemap.xml` and `robots.txt` with the real one.

## Editing content

**Important caveat:** `data/*.json` documents the content model (what fields exist, what's still placeholder) but the live pages are hand-authored HTML — editing the JSON alone won't change what visitors see. To change visible content today, edit the matching HTML file directly. Keep the JSON updated alongside it if you want it to stay useful as documentation/a future migration path.

Common edits:

| Want to... | Do this |
|---|---|
| Change homepage copy | Edit the relevant `<section>` in `index.html` |
| Add a real music release | Add cover art + audio files to `assets/`, replace the empty-state block in `music.html` with a release card, and drop in an `<div class="audio-player" data-title="..." data-artist="..." data-src="assets/audio/track.mp3" data-cover="...">` — `js/audio-player.js` will wire it up automatically, no other JS needed |
| Add a new track to the homepage arc | Add one object to `data/tracks.json` (title, artwork path, sample path, description). It appears automatically on both the homepage arc and `music.html` — no component code changes needed |
| Add a new Transmission | Copy `transmissions/001.html` → `transmissions/002.html`, update its content, add a matching card to `transmissions.html` |
| Add a new Archive entry | Copy `archive/artwork/001.html` into the right category folder, update content, add a card to `archive.html` with the correct `data-category` |
| Update social links | Replace the `href="#"` placeholders in every page's footer (7 files) |
| Update contact email | Already set to `kundalinispines@gmail.com` in `about.html` |

## Track system — adding tracks, samples, and effects

`data/tracks.json` is the single source of truth for both the homepage's interactive arc and the simpler `music.html` listing. Each track needs:

- `artwork` — a square (1:1) image path under `assets/music/`
- `sampleUrl` + `sampleDuration` — a ≤20-second clip under `assets/audio/samples/` (the player hard-stops at `sampleDuration` regardless of the file's real length)
- `visualTheme.effect` — one of `"fog"`, `"geometry"`, or `"distortion"` (see `css/track-experience.css` for what each renders); add a new effect by adding one more `.track-detail__effect--*` CSS block and one more branch in `effectMarkup()` in `js/track-experience.js`
- `links.stream` / `spotify` / `appleMusic` / `youtubeMusic` / `download` — leave `null` until real URLs exist; the UI automatically shows them as disabled placeholders instead of dead or fake links

## Newsletter integration

The form (`js/newsletter.js`) validates the email and shows loading/error states, but **does not call any real provider yet** — it intentionally never claims a successful subscription, since none is connected. To go live, replace the `setTimeout` block in `js/newsletter.js` with a real `fetch()` POST to whichever provider you pick (Buttondown, Mailchimp, ConvertKit, and Resend all have simple HTTP APIs for this).

## Payment / download integration

The "Download — $1" button on each track is a disabled placeholder — there is no payment processor connected, and none should be faked. To make it live, wire it to a checkout provider (e.g. Stripe Checkout, Gumroad, or a digital-download platform like Payhip) and set `links.download` in `data/tracks.json` to that real checkout URL once it exists.

## Logo marks & Higgsfield asset register

Full prompts, job IDs, and placement notes for every generated image, plus the construction notes for the hand-drawn Primary Seal and Secondary Spine Mark, are in `docs/04-asset-plan.md`.

## Known limitations

- **No Next.js/React/TypeScript build** — the original brief specified that stack; this build environment had no network access to install it, so the site was adapted to static HTML/CSS/JS instead. Same tokens/content model/component plan would transfer directly if you want the literal Next.js version built elsewhere (e.g. via Claude Code, which has network access).
- Only three tracks exist (real songs, real 20-second samples, real cover art) and none has a streaming/download link yet — all shown as honest disabled placeholders.
- Only one Transmission and one Archive entry exist — enough to prove the pattern, not a full collection.
- Social links are still `#` placeholders in every footer.
- Newsletter signup has no connected provider yet (see integration section above).
- The Primary Seal (`assets/marks/primary-seal.svg`) exists but isn't placed anywhere yet — candidate for a loading state or large-format use.
- Google Fonts (Big Shoulders Display/Stencil, Source Serif 4, IBM Plex Mono) load from a CDN — fine for any real deployment, just won't load in fully offline/sandboxed environments.

## Recommended next steps

1. Real streaming/download links per track once platforms are connected.
2. Real social links, and a real newsletter provider wired into `js/newsletter.js`.
3. A few more Transmissions and Archive entries so those sections don't read as barely-populated.
4. Decide where (if anywhere) the Primary Seal appears.
5. Point `sitemap.xml` / `robots.txt` at the real domain once one exists.
6. If the Next.js version matters long-term, hand this repo + `docs/` to Claude Code for the literal rebuild — nothing here is wasted either way.
