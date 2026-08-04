# Kundalini Spines — Website

A static, dependency-free site for Kundalini Spines: dark cinematic mysticism, plain HTML/CSS/JS, no build step and no package manager.

> **This README was rewritten on 4 August 2026 because it had gone badly stale** — it still described three tracks, an unwired newsletter, `#` placeholder social links and a `music.html` that no longer exists in that form. If something here contradicts a `HANDOFF N.md`, **the handoffs win**: they are dated, they record what was measured, and they are written last. Start with the newest one.

---

## The short version

- Five pages, all served as-is. No build, no bundler, no dependencies.
- `data/tracks.json` is the live source of truth for all **28 tracks** — the homepage carousel fetches it at runtime.
- **Nothing is deployed.** GitHub Pages is off and `kundalinispines.com` does not resolve. Pushing backs the work up; it does not publish it.
- The front page carries two background layers (a scroll-charged spine column and a star field) with a tuning panel behind `?tune`.

---

## What's here

```
index.html                  Home — hero video, track carousel, newsletter, bio
transmissions.html          Transmissions index
transmissions/001.html      Transmission detail page (one exists)
archive.html                Archive index (filterable)
archive/artwork/001.html    Archive entry detail (one exists)
about.html                  About, Messengers, contact
music.html                  REDIRECT to /#tracks — see "music.html" below

css/tokens.css              Design tokens (colour, type, spacing, motion) — source of truth
css/base.css                Reset, typography, layout primitives, --scroll-weight
css/components.css          Shared components: nav, buttons, hero, footer, newsletter
css/track-experience.css    The homepage carousel: arc geometry, cards, focus panel
css/spine-bg.css            The scroll-charged spine column   (index.html only)
css/star-bg.css             The star field and its twinkle    (index.html only)
css/transmissions.css       Transmissions page

js/nav.js                   Scroll state, mobile menu, publishes --nav-h
js/hero-video.js            Hero video + sound toggle
js/track-experience.js      The carousel: arc, drag, focus panel, 20s samples
js/newsletter.js            Newsletter form states (Buttondown — see below)
js/spine-bg.js              Spine layer + the ?tune panel     (index.html only)
js/scroll-weight.js         Wheel-scroll damping              (index.html only)
js/transmissions.js         Transmissions rendering
js/archive-filter.js        Archive category filter
js/music-page.js            UNREFERENCED — kept deliberately, see below
js/audio-player.js          UNREFERENCED — kept deliberately, see below

data/tracks.json            28 tracks. Live-wired: the carousel fetches this.
data/site.json              Site copy, social links and their verification status
data/transmissions.json     Hand-authored. The YouTube job never writes here.
data/youtube-pending.json   Staged YouTube videos awaiting manual promotion
data/archive.json           Archive entries
data/releases.json          Entirely PLACEHOLDER

assets/hero/                Hero video, spine artwork, star field
assets/music/               28 cover images (.webp) + 28 art videos (.mp4)
assets/audio/samples/       28 twenty-second samples
assets/marks/               Logo marks + favicon set
assets/messengers/          Portraits

.github/workflows/          Pages deploy + YouTube staging (see "Deploying")
scripts/youtube-sync.mjs    The YouTube RSS staging script
docs/                       Planning docs: sitemap, content model, asset register
HANDOFF *.md                Session handoffs — read the newest first
```

---

## Running it locally

Plain HTML, but **do not open the files by double-clicking** (`file://`). The carousel and Transmissions use `fetch()`, which browsers refuse over `file://`, and several paths are root-relative. Serve the folder instead:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

### The tuning panel

`http://localhost:8000/?tune` opens a live control panel for the front page's background layers — 22 sliders across three stylesheets, plus a `hide` button cycling view modes that isolate individual layers.

**It is not debug scaffolding to be cleaned up.** Without the `?tune` flag nothing below the guard in `js/spine-bg.js` executes, no markup is created and no listeners are attached. Visitors never load it. Dial values in on the real page, press **Copy CSS**, and paste the block back into the `:root` of the file each group is labelled with — the panel emits them grouped by destination, because a site-wide value pasted into `spine-bg.css` would apply on the front page and nowhere else.

Both stylesheets carry a build counter (`--spine-build`, `--star-build`) shown in the panel header. They exist because a browser sitting on a cached stylesheet looks exactly like a change that did not work. **If the number in the header is not the number in the file, hard-reload before you conclude anything.**

---

## Deploying

**Nothing is deployed today, and enabling Pages carelessly will break the site.**

`.github/workflows/deploy-pages.yml` assembles and publishes the site on push to `main`, but Pages itself is disabled. Two things to know before enabling it:

1. **Do not enable Pages without the custom domain configured.** The default project URL serves under `/kundalini-spines-site/`, which breaks every root-absolute link on the site. The enable sequence is in `HANDOFF 5` under "Deployment".
2. **The workflow does not publish the whole repo.** Handoffs contain local Windows paths and internal notes; `docs/` holds planning material; the `raster-test*` and `transmissions-option*` files are internal design harnesses. The workflow excludes all of it and then **fails the build** if anything internal reaches the publish directory. If you add another internal document, add it to the excludes too.

`.github/workflows/youtube-sync.yml` pulls the channel's RSS feed into `data/youtube-pending.json` for review. It is a **staging** job — it never writes `data/transmissions.json`, so it cannot clobber a hand-written entry. Promoting a staged video is a manual move.

---

## Editing content

Most visible content is now data-driven, which is the opposite of what this README used to say.

| Want to… | Do this |
|---|---|
| Add or edit a track | Edit `data/tracks.json`. It appears in the homepage carousel automatically. |
| Change homepage copy | Edit the relevant `<section>` in `index.html`. |
| Change social links | Edit `data/site.json`. Each entry carries a `status` field recording how it was verified — keep it honest. |
| Add a Transmission | Edit `data/transmissions.json`, or copy `transmissions/001.html` for a detail page. |
| Add an Archive entry | Copy `archive/artwork/001.html`, then add a card to `archive.html` with the right `data-category`. |
| Retune the backgrounds | `?tune`, then Copy CSS. Never hand-type the numbers. |

### The track model

Each entry in `data/tracks.json` carries `id`, `slug`, `title`, `oneLiner`, `description`, `artwork`, `artworkVideo`, `sampleUrl`, `sampleDuration`, `duration`, `release`, `year`, `transmissionNumber`, `explicit`, `accentColor`, `visualTheme` and `links`.

- `artwork` — square `.webp` under `assets/music/`; `artworkVideo` — the matching `.mp4`
- `sampleUrl` + `sampleDuration` — the player hard-stops at `sampleDuration` regardless of the file's real length
- `visualTheme` — `effect` is `fog`, `geometry` or `distortion`, with `intensity` and a `geometry` name
- `accentColor` — a fallback only. At runtime `accentFromImage()` samples the real cover art; the JSON value is used when that cannot run, and it is dark enough to hide contrast problems, so **do not judge the carousel without real cover art loaded**
- `links.*` — leave `null` until a real URL exists. The UI renders disabled placeholders rather than dead or fake links. All 28 are currently `null`.

---

## Deliberate oddities

Things that look like mistakes and are not. Do not "clean these up".

- **`music.html` is a redirect.** It was a flat grid of the same 28 tracks the carousel already renders — a strict subset of `#tracks`. It is kept as a redirect so the URL survives for anyone who bookmarked it. The old markup is preserved in `docs/06-legacy-music-page.md`.
- **`js/music-page.js` and `js/audio-player.js` are loaded by no page.** They are the reference implementation for a future flat all-tracks directory. Keep or delete them knowingly.
- **The TikTok and Spotify footer links are dead on purpose** — those accounts do not exist. Owner's decision, over inventing URLs.
- **`js/newsletter.js` posts natively, not via `fetch`.** Buttondown sends no CORS headers to this origin. The `action` and `method` on the form are load-bearing and the form works with JavaScript off. `target="_blank"` was removed deliberately — the popup blocker caught it and failed silently. **The `no-cors` "fix" looks right and is wrong**; read the comment in the file first.
- **`raster-test*.html` and `transmissions-option*.html`** are internal harnesses and mockups, excluded from the deploy.

---

## Known limitations

- **Nothing is reachable by anyone.** DNS for `kundalinispines.com` is the single blocker.
- **No streaming or download links exist** on any of the 28 tracks — all shown as honest disabled placeholders. `explicit` is `null` throughout and `data/releases.json` is entirely `PLACEHOLDER`.
- **The spine and star backgrounds are on `index.html` only.** The other four pages are flat black, so the site reads as two different sites.
- **Mobile values for both background layers are inferred, not judged on a device.**
- **One Transmission and one Archive entry exist** — enough to prove the pattern, not a collection.
- **A pre-existing mobile nav bug:** the closed menu panel is not fully off-screen and bleeds through behind the fixed header on every page.
- **Google Fonts load from a CDN.** Fine for any real deployment, but note that the nav's height depends on which fonts have loaded — never hardcode it, use the `--nav-h` variable `js/nav.js` publishes.
- **The 885 MB masters folder is backed up by nothing.**

---

## Where the real documentation is

This README is an orientation, not a reference. The detail lives in:

- **`HANDOFF *.md`** — dated session records. The newest states which older ones are still required reading. They record what was *measured*, and separate that from what was asserted.
- **`docs/`** — sitemap, content model, component plan, asset register, architecture.
- **The stylesheets themselves.** `css/spine-bg.css` and `css/star-bg.css` carry long comment blocks with measured figures and explicit "do not do this" notes attached to the code they govern. Several of them exist because the obvious fix was tried first and was wrong.
