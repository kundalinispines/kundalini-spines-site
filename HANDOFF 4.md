# Kundalini Spines — Session Handoff 4

**Date:** July 28, 2026
**Supersedes:** nothing. `HANDOFF 3.md` is still correct and still required reading —
this is a continuation, not a replacement. See "What HANDOFF 3 still owns" below.
**Status:** Asset library complete. Music page retired into the carousel. Transmissions
rebuilt as a live update channel. Site working.

* * *

## Project location

`C:\Users\Haight\Desktop\kundalini-spines` — static HTML/CSS/JS, no build step.

**Serve it over HTTP.** Both the carousel and Transmissions load their content with
`fetch()`, which browsers block on `file://`. Run `python -m http.server 8000` in the
folder and open `http://localhost:8000`.

**Git is live.** Remote: **`https://github.com/kundalinispines/kundalini-spines-site`**
(private). First push was 173 files / 88.5 MB on `main`. The "deletions are permanent"
warning from HANDOFF 3 **no longer applies**.

**Do not confuse this with `kundalinispines/kundalini-spines`** — that is a *different,
pre-existing* repo holding brand assets, logos and brand-development history (808 objects).
The website was deliberately given its own repo rather than merged into it, because the
brand repo uses `Assets/` (capital A) against the site's `assets/`, and Windows treats
those as the same folder while Git and Linux do not. Merging them invites files that
appear to vanish on the build server. **Never force-push to the brand repo.**

The bridge cannot write `.git` or `.github/workflows` — both are blocked as remote
code-execution vectors — so git had to be run locally. `setup/` was the one-time bootstrap
and is gitignored; it can be deleted.

* * *

## What changed this session

| Area | Before | Now |
| --- | --- | --- |
| `may-26th-sample.mp3` | missing — the last gap | in, 20.036s, library complete |
| May 26th `tracks.json` | `sampleUrl`, `duration`, `accentColor` all `null` | all three filled |
| Brutus cover + video | old portrait master, centre-cropped | replaced, square 1254×1254, no crop |
| Music nav | separate `music.html` grid page | points at `/#tracks`; the page is a redirect |
| Transmissions | flat grid, one numbered piece | **live update channel — the Channel Terminal** |
| Subpage nav | `transmissions/001.html` + `archive/artwork/001.html` still linked `music.html` | fixed |

* * *

## Transmissions — the Channel Terminal

The page is now the update channel for Instagram / TikTok / X / YouTube / Spotify
activity. Each platform is a **channel you tune to**; the feed is a monospace readout.
Chosen from five mocked-up concepts (see "Held for later").

**Files:** `transmissions.html`, `css/transmissions.css`, `js/transmissions.js`,
`data/transmissions.json`.

### Adding an update

Put a new object at the **top** of `entries` in `data/transmissions.json`. Newest first —
**the page does not sort for you.** `_template` in that file documents every field. The
tab list, the per-channel counts, the readout and the record count all derive from the
file. There is no code to touch, ever.

### Load-bearing — read before editing

1. **Empty channels are shown on purpose.** A frequency with nothing on it renders
   `NO SIGNAL ON THIS FREQUENCY`. That is true, on-concept, and tells a visitor which
   platforms exist — and it is the specific property that won this design over the
   mosaic concept. The first build filtered empty channels out and left the page saying
   "Tune to a frequency" above two buttons. If the judgement ever changes, set
   `"hideEmptyChannels": true` in the JSON. **Do not delete entries from `channels`**
   unless the project genuinely is not on that platform.
2. **Channel selection writes the URL with `history.replaceState`, not `location.hash`.**
   Assigning the hash jumps the page to the top on every channel change. `#instagram`,
   `#x` etc. are deep-linkable; an unknown hash falls back to All.
3. **Rows expand in place, one at a time.** This is the answer to the design's one real
   weakness — it is text-forward, so the artwork only costs vertical space when someone
   asks for it. Do not turn the rows into permanent cards; that is the mosaic concept,
   which was rejected.
4. **`.terminal__msg` sets `max-width: none`.** `base.css` caps every `<p>` at 65ch,
   which otherwise centres the empty-state message inside that narrower box — visibly
   left of centre. Same trap applies to any other centred paragraph added here.
5. **Mobile stacks the row** into a meta line (`id · date`, channel) plus a two-line
   clamped text line. Four columns do not fit at 390px; squeezing them makes the
   `nowrap` timestamp run underneath the title.
6. **`#terminal-nojs` is removed by the script on load.** It is the no-JS fallback and
   links the filed transmissions directly. Keep it in sync if more filed pieces get
   their own pages.

### Seed content

Four entries. **Transmission 001 is genuine** and links to its existing detail page —
keep it. The three marked `"seed": true` are true statements about the project, written
so the page is not bare at launch. Edit them into voice or delete them; nothing depends
on them. No invented social posts were added.

* * *

## The constraint behind all of this — do not promise an auto feed

**No platform gives a free automatic feed any more.** This drives every decision above
and will drive the next one:

| Platform | Auto-feed? | Reality |
| --- | --- | --- |
| X / Twitter | No | Timeline API is paid tier only. Single posts still embed. |
| Instagram | No | Needs a Meta app, review, and a long-lived token you refresh. Breaks on policy changes. |
| TikTok | Partly | Individual videos embed cleanly. Profile feed needs their Display API and approval. |
| YouTube | **Yes** | Channel RSS. No key, no approval. |
| Spotify | **Yes** | Embeddable player per release. No key. |

The site is on **route A**: updates are written into `data/transmissions.json` by hand.
It works today, costs about a minute per post, and cannot break. The paid-aggregator
route (Curator.io, Behold, EmbedSocial — roughly $15–30/month) would inject its own
markup and would not match this design without a fight.

**The obvious next win is YouTube RSS**, since it is free and keyless. If you wire it,
have it push into the same entry shape rather than render its own markup — the whole
page derives from that one array.

* * *

## Held for later — Option 5, the Spine

`transmissions-option5-v2.html` is a finished, working mockup of the alternative concept:
posts either side of a central animated spine that charges as you scroll, in three
switchable treatments (geometric / X-ray / circuit). **The plan is to rotate into it once
there is more content** — below about ten posts the filler vertebrae outnumber the real
ones and it does not read as a column.

Two findings from building it, worth keeping because they are not obvious:

- **The empty space in v1 was structural, not spacing.** One grid row per post meant a
  200px text card opposite a 740px image card left its row half empty. No margin tuning
  fixes that. V2 uses two independent stacks.
- **Column balancing needed three attempts.** Dealing in date order to the shorter column
  finishes **1054px apart**; walking trailing cards across gets **474px**; **largest-first
  packing, then re-sorting each column back into date order, finishes 20px apart** on a
  4100px column. Sorting does not change heights, so the balance survives it.
- **Cards must be built once and moved, never re-created per pass.** Fresh `<img>`
  elements measure zero height until they decode, so the packing silently balances
  against text-only heights and every image card lands wrong.

`transmissions-options.html` holds all five original concepts. Both files are review
artefacts — `noindex`, not linked from the site, safe to delete whenever.

One flag if the Spine ships: its X-ray treatment glows with `--color-moonlight`, which
`tokens.css` reserves for imagery and forbids in UI chrome. A spine graphic is arguably
imagery, but it is the one place any of this bends a stated rule. Geometric and circuit
stay strictly in bone/gray.

* * *

## Site structure now

```
/                      Hero → Track carousel (#tracks) → Newsletter → Bio
/#tracks               THE music experience. 28 tracks, hero overlay, samples.
music.html             REDIRECT to /#tracks. Kept so the URL survives. noindex,
                       canonical → /, removed from sitemap.
transmissions.html     The Channel Terminal (this session's build)
transmissions/001.html Filed piece, still live, linked from the feed
archive.html           unchanged
archive/artwork/001.html
about.html             unchanged
```

Nothing on the site links to `music.html` any more. The rationale for retiring it, and
the retired markup, are in `docs/06-legacy-music-page.md`. `js/music-page.js` and
`js/audio-player.js` are **loaded by nothing and kept deliberately** — they are the
reference for a future all-tracks directory page, and there is no git history to recover
them from.

If a Music page ever returns, it should be what the carousel is not: a flat, scannable
directory of all 28 with stream/download/buy buttons, for someone who already knows what
they want. Not the old grid rebuilt.

* * *

## Assets this session

**Brutus — replaced.** New master `Brutus-TrackArt.png` is a normal **1254×1254 square**,
so the centre-crop step HANDOFF 3 describes is gone, and **every master in the set is now
square**. The `crop` in the video ffmpeg command is a no-op on all 28 and is kept only as
a guard for future non-square sources. New cover: WebP 353 KB, varLap 898 @490px. New
video: 1.92 MB, **5.042s / 121 frames** — duration verified against the source per the
killed-encode trap. Frame 0 vs. the new still is a 2.95/255 mean absolute difference, so
it is locked-off and aligned and the crossfade holds.

**May 26th — the library is closed.** `may-26th-sample.mp3` is 0:52–1:12 of the master,
cut on a detected downbeat (~70 BPM), **20.036s / 128 kbps CBR / 44.1 kHz stereo**,
matching the other 27. Its `tracks.json` entry had three nulls, all now filled:
`sampleUrl` (the field actually gating the play button), `duration` (`4:40`), and
`accentColor` (`#3575E3`).

The accent was computed by porting `accentFromImage()` to Python **verbatim** and
validating the port before trusting it — it reproduces the documented 33rd Floor red and
Blue Pills blue. May 26th resolves to `hsl(218 76% 55%)`, which matches the cover's
electric-blue helices and lit spine.

**May 26th's cover→video crossfade has still never been watched by anyone**, because
video only rolls while audio is audible and until now there was no audio. It is the one
still→video pair in the set nobody has seen. Worth a look.

* * *

## What HANDOFF 3 still owns

Do not re-derive these — they are measured, correct, and unchanged:

- **The settled-card sharpness fix** and the `.track-hero-layer` overlay: why a card
  cannot leave a 3D rendering context by changing its own transform, the five rules for
  editing that path, and the full varLap tables.
- **Corrections to HANDOFF 2** — the push-in mismatch does not exist, `scale(1.0588)` is
  not the problem, `will-change` is not the problem.
- **The accent-colour algorithm** — the `s³ × (1 − |l − 0.55| × 1.6)` scoring, top 5%,
  24 hue bins, S/L clamps, and why 128px rather than 64.
- **The asset pipeline** — WebP settings, the ffmpeg command, the CRF table, and the two
  traps (`-nostdin` is mandatory; a killed encode leaves a playable file, so check
  duration).
- **The verification harness** and the headless-testing traps (no H.264, ~14fps, no GPU —
  raster problems cannot be reproduced headless and must be diagnosed on real hardware).
- **The interaction model** for the carousel, and the slug/title mismatches that were
  deliberately left alone.

* * *

## Open / unresolved

- **`explicit` is `null` on May 26th**, but its cover carries a Parental Advisory mark.
  Worth one pass across all 28 rather than fixing one.
- **Accent hue collision, one confirmed.** may-26th and blue-pills both resolve to
  `hsl(218 76% 55%)` — the same bin. uzi-fruit and the-33rd-floor both sample red. They
  are not adjacent in the running order, so nothing reads as repetitive yet. If it does,
  widen the hue bins or bias each track away from its neighbours.
- **Video takes** were chosen by name-matching the approved still. Scorpion Dreams,
  X-Files, Skeleton Keys and now Brutus were changed by hand. Others may still be wrong —
  most tracks have 2–4 takes.
- **Streaming links** — `links.spotify` / `appleMusic` / `youtubeMusic` / `stream` all
  `null` across all 28.
- **Download links** + Stripe or Gumroad.
- **Social links** — still `href="#"` in every footer; `data/site.json` `social[]` is all
  `PLACEHOLDER`. These now matter more than they did: the Transmissions page advertises
  five platforms by name.
- **Real domain** in `sitemap.xml` and `robots.txt` (placeholder: kundalinispines.com).
- **Newsletter** — `js/newsletter.js` is still a `setTimeout` stub.
- **Contact email** `kundalinispines@gmail.com` in `data/site.json` is a placeholder.
- **`data/site.json` is stale** — its `primaryCta`/`entryPoints`/`footer.links` still
  point at `/music`, which no longer exists as a page. Nothing reads those fields today
  (the HTML is hand-written), but anything that starts reading them will be wrong.

* * *

## Housekeeping

Safe to delete, nothing references them:

- **27 placeholder `.jpg` covers** in `assets/music/`, superseded by the `.webp` files
- **`full-zoom-cover.webp`** — the cut track
- **`raster-test.html`, `raster-test-2.html`** — the sharpness harness; keep if useful
- **`transmissions-options.html`, `transmissions-option5-v2.html`** — review mockups.
  Keep until the Spine question is settled.

Keep deliberately, despite being unreferenced: **`js/music-page.js`,
`js/audio-player.js`** (see Site structure).

The device bridge cannot delete files. To remove any of these, move them into a
`_to_delete/` folder by hand.

**Backups are now handled by the git remote** — the stale `ks-backup-20260728-part1..7`
zips predate everything from this session and are safe to delete. **The 885 MB masters
folder is still covered by nothing**, is not in the repo, and needs its own backup. That is
now the only unprotected thing in the project.

* * *

## Version control — done

Pushed to **`kundalinispines/kundalini-spines-site`** (private), branch `main`.
Tracked: `.gitignore`, `.gitattributes`, `.github/workflows/deploy-pages.yml`, and the
whole site including assets. `setup/` was the bootstrap, is gitignored, and can be deleted.

- **`.gitattributes` sets `* -text`.** Line-ending conversion is off on purpose. The project
  is authored on Windows and deployed to a Linux runner; the default `text=auto` makes a
  fresh clone report itself modified and produces whole-file diffs on platform changes.
- **Assets are committed** — ~88 MB, inside GitHub's limits (100 MB/file, 1 GB soft repo),
  and the site cannot deploy without them. The 885 MB masters folder is excluded and lives
  outside the project directory.
- **The Pages workflow does not publish the whole repo.** Handoffs (local Windows paths,
  Higgsfield element IDs), `docs/`, the `raster-test*` harness and the
  `transmissions-option*` mockups are excluded from the artifact, and the build **fails**
  if any of them reach the publish directory rather than shipping them silently. Add any
  new internal document to the excludes in `.github/workflows/deploy-pages.yml`.
- **Pages will not serve a private repo on a free account** — it needs GitHub Pro. The
  recommended alternative is Cloudflare Pages or Netlify, both of which deploy from a
  private GitHub repo on their free tier with no build command (publish directory `.`).
  Options are laid out in `setup/README-SETUP.md`.
- Once history is on a remote, the "deletions are permanent" constraint lifts, and the
  files kept only because they were unrecoverable (`js/music-page.js`,
  `js/audio-player.js`) can be reconsidered on their merits.

Higgsfield element IDs for generating new covers:
Messenger-A `46229f47-2d2f-45f7-a578-8d169ca5fbb7`,
Messenger-B `37f342de-2add-4f4c-bcc7-2aa3530676d3`

* * *

## How this session verified things

Worth repeating because it caught six real bugs that looked fine by eye: **everything was
checked in a headless Chromium against a local server before shipping** — element counts,
computed geometry, ARIA state, URL state, console errors, and layout at 390 / 768 / 820 /
1440px.

Bugs it caught that visual review did not: the grid stretching both Spine columns to equal
height (so all 14 cards dealt to one side); cards re-created per pass measuring zero height
before images decoded; the mosaic sitting at 84% fill with six visible holes; the
empty-state paragraph centring inside `base.css`'s 65ch cap; the mobile timestamp running
under the title; and a 16/10 hero crop cutting the printed title off the cover art.

Measure it. Do not eyeball it.
