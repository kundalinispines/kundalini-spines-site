# Kundalini Spines — Website

A static, dependency-free site for Kundalini Spines: dark cinematic mysticism, plain HTML/CSS/JS, no build step and no package manager.

> **This README was rewritten on 11 August 2026.** The previous version was written on 4 August against `main` and had gone stale in a specific and misleading way: it described **five pages** when there are now eight plus a redirect, told you to serve the repo with a command that **silently breaks video seeking**, said the backgrounds were **`index.html` only** when they are now on six pages, and claimed the deploy workflow **excludes everything internal** when it does not. All four are corrected below.
>
> If something here contradicts a handoff, **the handoffs win**: they are dated, they record what was measured, and they are written last. Start with the newest one.

---

## Which branch you are on matters

| | |
|---|---|
| `main` | The **dormant production site**. Last commit `13083d9`. Documented by `HANDOFF 1`–`19`. |
| `feature/spine-ui-v2` | **This branch, and where all current work is.** 66 commits ahead of `main`. Documented by `V2HANDOFF 19`–`28`. |

This README describes **`feature/spine-ui-v2`**. Nothing has been merged to `main` and no PR is open. Confirm your branch before editing:

```bash
git branch --show-current
```

---

## The short version

- Eight public pages plus a redirect, all served as-is. No build, no bundler, no dependencies.
- `data/tracks.json` is the live source of truth for all **28 tracks** — the homepage carousel fetches it at runtime.
- **Nothing is deployed.** GitHub Pages is off and `kundalinispines.com` does not resolve. Pushing backs the work up; it does not publish it.
- **Do not deploy yet** — the workflow would publish the handoffs, the labs and `links.html`. See "Deploying".
- Six pages carry the star field, the spine column and the instrument footer. The front page adds the track carousel and a tuning panel behind `?tune`.
- A second, unshipped navigation stack — the **entrance**, the **navigator** and its **field readings** — lives in the `*-lab.html` harnesses. It is real, it is measured, and it has not yet replaced or joined `index.html`.

---

## What's here

### Public pages

```
index.html                  Home — hero video, track carousel, newsletter, bio
transmissions.html          Transmissions index
transmissions/001.html      Transmission detail page (one exists)
archive.html                Archive index (filterable)
archive/artwork/001.html    Archive entry detail (one exists)
about.html                  Scroll-revealed magazine feature — the owner's profile
merch.html                  Merchandise
connect.html                Stay Connected — the newsletter form as its own page
music.html                  REDIRECT to /#tracks — see "Deliberate oddities"
```

### Internal harnesses — NOT for deploy

```
links.html                  Internal index of every page and lab (26 links, all verified 200)
entrance-lab.html           The entrance + navigator + field readings (keys 1-9)
spine-lab.html              spine-field-lab.html      spine-aster-lab.html
spine-card-glass-lab.html   music-lab.html            music-collapse-lab.html
hero-scrub-lab.html         hero-timeline-lab.html    coil-lab.html
scramble-lab.html           shutter-lab.html          type-specimen-lab.html
raster-test.html            raster-test-2.html
transmissions-options.html  transmissions-option5-v2.html
```

### Stylesheets

```
css/tokens.css              Design tokens (colour, type, spacing, motion) — source of truth
css/base.css                Reset, typography, layout primitives, --scroll-weight
css/components.css          Shared components: nav, buttons, hero, newsletter
css/track-experience.css    The homepage carousel: arc geometry, cards, focus panel
css/spine-bg.css            The scroll-charged spine column   (--spine-build: 37)
css/star-bg.css             The star field and its twinkle    (--star-build: 26)
css/site-footer.css         The instrument footer: link tiers, band, cropped wordmark
css/about-feature.css       The about page magazine feature   (--about-build: 3)
css/transmissions.css       Transmissions page
css/spine-ui.css            The navigator: rail, nodes, cards        (labs only)
css/music-wrap.css          Music mode — restyles the stage, does not replace it
css/wordmark.css            The wordmark and its torch
css/shutter-text.css        css/text-scramble.css   Type effects
css/field/                  Eight field readings, one file each — calibration, crop,
                            fusion, graticule, halo, mandala, plate, readout
```

### Scripts

```
js/nav.js                   Scroll state, mobile menu, publishes --nav-h
js/hero-video.js            Hero video + sound toggle
js/track-experience.js      The carousel: arc, drag, focus panel, 20s samples
js/newsletter.js            Newsletter form states (Buttondown — see below)
js/spine-bg.js              Spine layer + the ?tune panel     (index.html only)
js/scroll-weight.js         Wheel-scroll damping              (index.html, about.html)
js/site-footer.js           Builds the footer's link rows and instrument band
js/about-feature.js         The about page's scroll reveal and derived parallax
js/ks-chakras.js            THE shared chakra dataset — single source of truth
js/transmissions.js         Transmissions rendering
js/archive-filter.js        Archive category filter
js/spine-ui.js              The navigator: nodes, card positioning     (labs only)
js/spine-coil.js            js/wordmark.js   js/shutter-text.js   js/text-scramble.js
js/music-wrap.js            Music mode
js/field/                   The eight readings, matching css/field/
js/music-page.js            UNREFERENCED — kept deliberately, see below
js/audio-player.js          UNREFERENCED — kept deliberately, see below
```

### Data and assets

```
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
assets/messengers/          Portraits (still .jpg — webp conversion outstanding)
assets/about/               The magazine feature's hero webps + graveyard clip

.github/workflows/          Pages deploy + YouTube staging (see "Deploying")
scripts/serve.py            THE local server — read the next section
scripts/youtube-sync.mjs    The YouTube RSS staging script
docs/  design/  reference/  Planning material, internal
HANDOFF *.md                Sessions on main       — read the newest first
V2HANDOFF *.md              Sessions on this branch — read the newest first
```

---

## Running it locally

Plain HTML, but **do not open the files by double-clicking** (`file://`). The carousel and Transmissions use `fetch()`, which browsers refuse over `file://`, and several paths are root-relative.

**Serve it with this, and not with anything else:**

```bash
python scripts/serve.py
```

Then open `http://localhost:8000`. Pass a port to change it: `python scripts/serve.py 8001`.

### Why not `python -m http.server`

Every handoff up to `V2HANDOFF 22` told sessions to use it. **It is wrong for this repo and the failure is silent.** `http.server` answers media requests with the whole body and no `Accept-Ranges` header, so Chrome treats every video as unseekable and **clamps every `currentTime` assignment to 0**. No console error, no failed request; `seeking` and `seeked` both fire exactly as they would on a good seek.

The visible symptom on `hero-scrub-lab.html` is that the entrance settles on the wrong frame — which reads as a scrub-mapping bug in the page and is not one. `scripts/serve.py` honours Range requests. The full explanation is in that file's docstring; do not delete it as "redundant".

### The tuning panel

`http://localhost:8000/?tune` opens a live control panel for the front page's background layers — sliders across the background stylesheets, plus a `hide` button cycling view modes that isolate individual layers.

**It is not debug scaffolding to be cleaned up.** Without the `?tune` flag nothing below the guard in `js/spine-bg.js` executes, no markup is created and no listeners are attached. Visitors never load it. Dial values in on the real page, press **Copy CSS**, and paste the block back into the `:root` of the file each group is labelled with — the panel emits them grouped by destination, because a site-wide value pasted into `spine-bg.css` would apply on the front page and nowhere else.

### Build counters — check these before you conclude anything

Several stylesheets carry a build counter: `--spine-build` (37), `--star-build` (26), `--about-build` (3). They exist because **a browser sitting on a cached stylesheet looks exactly like a change that did not work.** If the number you see is not the number in the file, hard-reload before drawing any conclusion.

The same discipline applies to reading animated values. `css/star-bg.css` twinkles on an 8200ms cycle across four desynced bands. **Do not read an animated property with a single `getComputedStyle` call and call it a value** — a previous session did exactly that, sampled four pages at random animation phase, and reported a dimming that did not exist.

---

## Deploying

**Nothing is deployed today, and the workflow is not currently safe to run.**

`.github/workflows/deploy-pages.yml` assembles and publishes the site on push to `main`, but Pages itself is disabled. Three things to know:

1. **Do not enable Pages without the custom domain configured.** The default project URL serves under `/kundalini-spines-site/`, which breaks every root-absolute link on the site. The enable sequence is in `HANDOFF 5` under "Deployment".

2. **THE EXCLUDE LIST HAS A HOLE, AND THE LEAK GUARD HAS THE IDENTICAL HOLE.** The assemble step excludes `./HANDOFF*.md`. That pattern **does not match `V2HANDOFF 19.md`–`V2HANDOFF 28.md`**, and the "Fail if anything internal slipped through" guard checks `-name 'HANDOFF*'`, which misses them the same way — so the safety net has the same gap as the thing it is meant to catch. Also unexcluded today: the master prompt, all ~17 `*-lab.html` harnesses, `links.html`, `scripts/` and `design/`. Handoffs carry local Windows paths and internal notes.

   **Fix both the exclude list and the guard before the first deploy.** This is the top item on the open list in `V2HANDOFF 28`.

3. **The YouTube job is staging only.** `.github/workflows/youtube-sync.yml` pulls the channel's RSS feed into `data/youtube-pending.json` for review. It never writes `data/transmissions.json`, so it cannot clobber a hand-written entry. Promoting a staged video is a manual move.

---

## Editing content

Most visible content is data-driven.

| Want to… | Do this |
|---|---|
| Add or edit a track | Edit `data/tracks.json`. It appears in the homepage carousel automatically. |
| Change homepage copy | Edit the relevant `<section>` in `index.html`. |
| Change social links | Edit `data/site.json`. Each entry carries a `status` field recording how it was verified — keep it honest. |
| Add a Transmission | Edit `data/transmissions.json`, or copy `transmissions/001.html` for a detail page. |
| Add an Archive entry | Copy `archive/artwork/001.html`, then add a card to `archive.html` with the right `data-category`. |
| Add a page | Copy `merch.html` or `connect.html` — same five stylesheets in the same order, a `page-*` class on `<html>`, and **add the page to star-bg's phone selector list in the same change**, bumping `--star-build`. |
| Change chakra data | `js/ks-chakras.js`, and only there. See "Deliberate oddities". |
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
- **There are two newsletter forms** — one in `index.html`, one in `connect.html`. This is valid: one copy per page, and they share classes precisely so they cannot drift. **Do not "deduplicate" them.**
- **The TikTok and Spotify footer links are dead on purpose** — those accounts do not exist. The footer says STANDBY and removes the anchor entirely rather than shipping an `href="#"` that teaches the reader the site is broken.
- **`js/newsletter.js` posts natively, not via `fetch`.** Buttondown sends no CORS headers to this origin. The `action` and `method` on the form are load-bearing and the form works with JavaScript off. `target="_blank"` was removed deliberately — the popup blocker caught it and failed silently. **The `no-cors` "fix" looks right and is wrong**; read the comment in the file first.
- **The about page's parallax travel is derived from its bleed, not from a multiplier.** The bleed is asymmetric on purpose (`-4%` top, `-24%` bottom) because object-fit cover's side crop depends only on the total. **Do not grow the multiplier**, and do not push the total past 28% — the side crop closes on the figures.
- **The navigator card's overflow lives on `__body`, not on the card.** On the card, the transformed ghost frames (`::before`/`::after`) count as scrollable overflow and every card grows a phantom 13px scrollbar.
- **`js/ks-chakras.js` is the single source of the chakra data.** Three separate bugs in this codebase have been hand-copied tables and modules keyed on another module's node ids, each one silently wrong until something was renamed. **Derive from the live source; never key on the navigator's node ids from outside it.**

---

## Known limitations

- **Nothing is reachable by anyone.** DNS for `kundalinispines.com` is the single blocker, and the deploy workflow's leak gap is now a second one.
- **No streaming or download links exist** on any of the 28 tracks — all shown as honest disabled placeholders. `explicit` is `null` throughout and `data/releases.json` is entirely `PLACEHOLDER`.
- **The navigator has not graduated.** The entrance, navigator and field readings are settled in `entrance-lab.html` but have not replaced or joined `index.html`.
- **What the PURCHASE action should do is undecided**, which also blocks `merch.html`.
- **No mobile pass on a real device.** Phone values for both background layers are inferred.
- **The glass fallback has never been seen in Safari or Firefox.** Only Chromium is installed on the working machine, though Playwright can install the other two.
- **`music.html` and `hero-timeline-lab.html` render black.**
- **Several labs are stale** and key on things that no longer exist — `music-collapse-lab.html` on retired node ids, `spine-card-glass-lab.html` on a hardcoded `02 / 06`, `hero-scrub-lab.html` on a nonexistent `--space-5`.
- **One Transmission and one Archive entry exist** — enough to prove the pattern, not a collection.
- **A pre-existing mobile nav bug:** the closed menu panel is not fully off-screen and bleeds through behind the fixed header on every page.
- **Google Fonts load from a CDN** — Anton, Big Shoulders Display, Big Shoulders Stencil, IBM Plex Mono, Source Serif 4. Fine for any real deployment, but the nav's height depends on which fonts have loaded, so never hardcode it — use the `--nav-h` variable `js/nav.js` publishes. Note that the local Playwright harness has **no route to Google Fonts**, so anything measured there is measuring a fallback face.
- **The 885 MB masters folder is backed up by nothing.**

---

## Where the real documentation is

This README is an orientation, not a reference. The detail lives in:

- **`V2HANDOFF *.md`** — dated session records for this branch, newest first. Each states which older ones are still required reading, records what was *measured*, and separates that from what was asserted. `HANDOFF 1`–`19` cover `main`.
- **`docs/`** — sitemap, content model, component plan, asset register, architecture.
- **The stylesheets themselves.** `css/spine-bg.css`, `css/star-bg.css` and `css/site-footer.css` carry long comment blocks with measured figures and explicit "do not do this" notes attached to the code they govern. Several of them exist because the obvious fix was tried first and was wrong.
