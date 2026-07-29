# Kundalini Spines — Session Handoff 6

**Date:** July 29, 2026
**Supersedes:** nothing wholesale. It **corrects three claims in HANDOFF 5** and **closes one open decision**.
`HANDOFF 3.md`, `HANDOFF 4.md` and `HANDOFF 5.md` all remain required reading for everything they own.
**Status:** YouTube RSS is wired, tested, and proven end to end. The site still is not served anywhere — Pages is off and the domain does not resolve. Nothing this session changed what a visitor sees.

* * *

## Corrections to HANDOFF 5 — read first

**1\. "Also unmeasured: whether the channel has any videos yet."** Now measured. The channel has **nine videos**, and they are not what anyone assumed. All nine were bulk\-uploaded on **2025\-06\-11**, within about ninety seconds of each other, and every description ends *"From the album Kundalini Spines. Written and produced by Haight and Prophocie."* — they belong to an **earlier album**, not to the 28\-track Rise Up material the site is built around. Not one of the nine appears in the Rise Up track list.

Soul Bound · Venom Skin · Deep Dive · Kundalini Spines · Off with their heads · I am Omega · I am Alpha · Raziel · Lucid Dreams. The last three are Shorts.

This is the finding that shaped the whole build. A naive sync would have opened the Channel Terminal with nine thirteen\-month\-old rows, all stamped the same minute, sitting above the four current entries — the exact opposite of the live\-update\-channel concept HANDOFF 4 chose the design for.

**2\. "It does mean the site acquires a build step, which the project has so far avoided."** Half true now. There is a scheduled GitHub Action, but it is a **staging** job that writes only its own file. The site is still static HTML/CSS/JS with no build step in the deploy path. Nothing about running it locally has changed.

**3\. Repo privacy is CLOSED, not open.** HANDOFF 5 said "decide one of: make the repo private, or accept those files are public." **Decided July 29 2026: the repo stays public**, so the handoffs, `docs/`, and the two Higgsfield element IDs are public *by decision*. Note that deleting those files now would not undo it — they are in the pushed history. GitHub Pages on a free account cannot serve a private repo, and that was the deciding constraint.

**4\. Still true, re\-verified July 29 2026.** `kundalinispines.github.io/kundalini-spines-site/` returns 404, and `kundalinispines.com` does not resolve at all — the connection times out, so DNS is still unconfigured. Nothing drifted overnight.

* * *

## What changed this session

| Area | Before | Now |
| --- | --- | --- |
| YouTube RSS | identified as the next win, unbuilt | scheduled staging job, live and proven |
| Channel contents | unknown | 9 videos, measured, all from an earlier album |
| `data/youtube-pending.json` | did not exist | robot\-owned staging tray |
| `scripts/youtube-sync.mjs` | did not exist | the sync logic, zero dependencies |
| `.github/workflows/youtube-sync.yml` | did not exist | runs every 6h \+ `workflow_dispatch` |
| Repo Actions permission | read\-only (default) | **Read and write** |
| Repo privacy | undecided | decided: stays public |
| Domain records in `site.json` / `robots.txt` / `sitemap.xml` | edited last session, **never committed** | committed and pushed |

Six commits on `main`\: `e2df350` the sync job, `6c2dae5` the drill, `d08da40` its revert, `96c1dca` the bot's own staging commit, `07d2fc4` HANDOFF 6, `88e0592` the domain records.

### Three files were carried over from last session

`data/site.json`, `robots.txt` and `sitemap.xml` held the domain\-confirmation work HANDOFF 5 describes — the `domain` block, the "do not fill it in, it is already filled in" comments, the `lastmod` bumps, and the warning not to submit the sitemap before the site resolves. **All of it existed only in the working tree.** HANDOFF 5's claims about those files were true of the disk and false of the repo for a full session.

They are committed now, so the repo matches what HANDOFF 5 says. Nothing downstream was wrong — but for a session it was one accidental `git restore` away from being lost, which is the whole thing git was set up to prevent.

## The YouTube staging job

**Files:** `scripts/youtube-sync.mjs`, `.github/workflows/youtube-sync.yml`, `data/youtube-pending.json`.

Feed: `https://www.youtube.com/feeds/videos.xml?channel_id=UC9Nw6WA3ipifJ2YUZICflRg`

### It stages. It does not publish.

The job **never writes `data/transmissions.json`.** That file stays entirely hand\-authored, so nothing the robot does can clobber a body someone wrote or reshuffle the manual ordering. New videos land in `data/youtube-pending.json`; publishing one is a human moving the object across, writing `body`, and assigning the next log number.

This was a deliberate choice over full automation, on the grounds that the Transmissions feed carries the project's voice and a YouTube title is not that.

### Load\-bearing — read before editing

1. **Key on `<published>`, never `<updated>`.** YouTube bumps `<updated>` when view counts or metadata change. Every one of the nine videos has an `<updated>` roughly ten months newer than its `<published>` — April and May 2026 on videos uploaded in June 2025. A job keyed on `<updated>` would re\-stage the same videos forever and produce a churn commit on every run.
2. **A `GITHUB_TOKEN` commit does not trigger other workflows.** This job pushing to `main` will **not** fire `deploy-pages.yml`. That is harmless *only because* staged items are not rendered — the site is unchanged until a human moves one into `entries` and pushes it themselves, which deploys normally. **If this job is ever changed to write `transmissions.json` directly, that assumption breaks and the site silently stops updating.**
3. **GitHub disables scheduled workflows after 60 days of repository inactivity.** If updates quietly stop appearing, check that before debugging the code.
4. **The feed returns at most the latest 15 entries.** Anything older can never be recovered by this job and must be hand\-written. With nine videos there is headroom today, not forever.
5. **`seen` is the memory.** It holds every video id the job has surfaced, so a video someone looked at and chose not to publish stays gone instead of reappearing every six hours. The job also treats anything already linked from `transmissions.json` as seen, so publishing an entry is sufficient on its own.
6. **Shorts carry a `/shorts/` link, not `/watch?v=`.** The feed's own `href` is used verbatim so the correct URL form survives. Three of the nine are Shorts.
7. **`data/youtube-pending.json` formatting belongs to the job.** It is rewritten with a plain serialiser, so hand\-added blank lines and alignment do not survive. Do not tidy it.

### Do not do these

- **Do not key the sync on `<updated>`.** See above. This is the single most tempting wrong fix, because `updated` sounds like the field you want.
- **Do not have the job write `data/transmissions.json`.** It breaks the deploy assumption in point 2 *and* removes the guarantee that hand\-written content cannot be clobbered.
- **Do not move the cutoff back without also clearing `seen`.** Both must change to backfill; that is deliberate, so a careless cutoff edit cannot flood the terminal.
- **Do not wire `_thumbnail` into `media` without thinking.** It is a hotlink to `i.ytimg.com`. Every other image on this site is a locally optimised asset, and hotlinking would put a Google request on a page that currently makes none. Save the file down or use the track's own cover instead.

### The nine existing videos

**Decision: excluded, not backfilled.** Two independent mechanisms keep them out — the `cutoff` of `2026-07-29`, and their nine ids pre\-listed in `seen`.

**Open, and genuinely unresolved:** the earlier album is currently acknowledged **nowhere on the site**. Not in Transmissions, not in the Archive, not in About. That is a content decision nobody has made rather than a decision that was made. Options discussed were a single hand\-written entry pointing at the channel, or leaving it out on the grounds that Rise Up is the project's public starting point.

### One rendering detail

`js/transmissions.js` builds the collapsed row as `<b>title</b> — body`. An entry with an empty `body` renders as **"Title — "** with a trailing dash. Nothing enforces `body`, but it is required in practice. Staged objects arrive with `body: ""` for exactly this reason — it is a blank to fill, not a field to ignore.

* * *

## How this session verified things

**23 assertions, all passing**, against fixtures built from the real feed rather than an imagined one. The ones that matter: that the nine 2025 videos stay out under the real cutoff; that dates come from `<published>` and not `<updated>`; that a Short keeps its `/shorts/` URL; that a second run leaves the file byte\-identical so it cannot produce empty commits; that a video already linked from `transmissions.json` will not re\-stage even with `seen` cleared; and that a malformed `cutoff` throws loudly rather than silently staging nothing.

**Then a live drill, because the tests could not prove the part that mattered.** The first real run said *"No new videos published on or after 2026\-07\-29. 9 entries in feed, all already known."* — correct, but it meant the commit\-and\-push step exited early and **the newly\-granted write permission had never actually been exercised.** That failure would have surfaced for the first time on a real upload.

So the cutoff was temporarily moved to `2025-01-01` and one id removed from `seen`. The run staged exactly one video (Lucid Dreams), the bot committed, and the push succeeded — confirmed by reading the file back off `raw.githubusercontent.com` rather than trusting the run's own output. The drill was then reverted.

**Gap, stated plainly:** the 23 tests were written and run in the assistant's environment and **were not committed to the repo.** A future session cannot re\-run them. If the sync is ever modified, they would have to be rebuilt.

**Still unproven, and not provable today:** that the six\-hourly schedule actually fires (GitHub cron is best\-effort and often late), and behaviour against a genuinely new upload rather than a backdated one. Both resolve on the next real upload. If a video goes up and nothing appears within about eight hours, check Actions for whether the scheduled run happened at all before suspecting the code.

* * *

## Working constraints this session

Worth recording, because they shape what a session can do:

- **The assistant had no shell on the local machine** — the device bridge does file transfer only. Every `git` command was run by the owner. Files were edited by writing them across the bridge.
- **The bridge refuses to write `.github/workflows`** — blocked as a code\-execution path. The workflow file had to be created by hand locally. This is why the sync logic lives in `scripts/youtube-sync.mjs` rather than inline in the YAML: the script is bridge\-writable, the workflow is not.
- **`scripts/` is not excluded from the published site.** It will be served at the public URL. That costs nothing — it is public code with no secrets — but add `--exclude='./scripts'` to `deploy-pages.yml` if that is unwanted.
- **Matching refs do not mean a clean tree.** This session opened by comparing `refs/heads/main` against `refs/remotes/origin/main`, finding them equal, and concluding nothing was outstanding. That was wrong — it proves local and remote agree on *commits*, and says nothing about uncommitted working\-tree changes. Three files had been sitting modified since the previous session. **The end\-of\-session check is `git status` reporting a clean working tree, not a successful push.** A push can succeed and still leave work behind.

## Still open

Carried forward, minus what this session closed:

- **DNS configuration for `kundalinispines.com`** — unchanged and still the single blocker. Nothing on this site is reachable by anyone. The enable sequence is in HANDOFF 5 under "Deployment"; do not enable Pages without the custom domain, because the project URL serves under `/kundalini-spines-site/` and breaks every root\-absolute link.
- **`README.md` is badly stale** — it predates HANDOFF 2 and roughly half of it is false rather than merely dated. It describes `music.html` as a live page, claims 3 tracks with placeholder cover art, says the newsletter has no provider connected, tells the reader to replace a "placeholder domain" that turned out to be real, and its file inventory omits `css/transmissions.css`, `js/transmissions.js`, `js/hero-video.js` and most of `data/`. A rewrite was offered and deferred this session. Since the repo is public, it should carry no local Windows paths and no Higgsfield element IDs.
- **The earlier album is unacknowledged on the site** — see the YouTube section.
- **The YouTube unit tests are not in the repo** — see verification.
- **Buttondown deliverability is unverified** — whether confirmation emails land in inbox or spam. Still the highest\-consequence unknown; a custom domain is the fix if it is happening.
- **Instagram and X are owner\-supplied, not verified.** Both block automated reads. Worth confirming in a private browser window — that catches a profile live for the owner but restricted for everyone else. YouTube is independently verified.
- **`explicit` is `null` on all 28 tracks.** Owner's decision to leave it; nothing renders it today.
- **Streaming links** — `spotify` / `appleMusic` / `youtubeMusic` / `stream` all `null` across all 28.
- **`data/releases.json` is entirely `PLACEHOLDER`.** Nothing reads it yet.
- **Download links** \+ Stripe or Gumroad.
- **TikTok and Spotify accounts** do not exist. Both stay in the footers as dead links by owner's decision, so the footer row keeps matching the Transmissions channel list.
- **Accent hue collision** — may\-26th / blue\-pills, and uzi\-fruit / the\-33rd\-floor. Not adjacent in the running order, so nothing reads as repetitive yet.
- **Video takes** chosen by name\-matching the approved still; most tracks have 2–4 takes and others may still be wrong.
- **May 26th's cover→video crossfade has still never been watched.** The one still→video pair in the set nobody has seen.
- **The 885 MB masters folder is still backed up by nothing.** Outside the repo, correctly gitignored, and the only unprotected thing left in the project.

Housekeeping from HANDOFF 4 still stands, with git making deletion recoverable. `js/music-page.js` and `js/audio-player.js` are still kept deliberately as the reference for a future all\-tracks directory page; `.gitignore` documents why. The device bridge still cannot delete files — move them to `_to_delete/` and delete by hand.

Higgsfield element IDs for new covers:
Messenger\-A `46229f47-2d2f-45f7-a578-8d169ca5fbb7`,
Messenger\-B `37f342de-2add-4f4c-bcc7-2aa3530676d3`

* * *

## The closing line still holds

Two of this session's three most useful findings — the `<updated>` churn trap and the never\-exercised push permission — came from checking rather than from reasoning harder. The nine\-videos discovery came from asking what was actually in the feed instead of assuming it was empty.

> Measure it. Do not eyeball it.
