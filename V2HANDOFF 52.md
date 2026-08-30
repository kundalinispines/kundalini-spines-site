# Kundalini Spines — Spine UI V2 Handoff 52

**Date:** August 30, 2026 (late night, after 51)

Thirty-fourth handoff of the **Spine UI V2** track (branch `feature/spine-ui-v2`).
`51` owns the Cloudflare migration and the live-site verification recipe; `50`
owns the release-branch rule and the delivery architecture. **This was a short
tuning session:** the owner felt the live lightning was "on the older
settings", the claim was investigated and disproven, and the real fix turned
out to be a retune — `--snare-coinc` 85 → 110, **spine-build 44**, released to
`main` and verified live the same evening.

Only two files changed: `css/spine-bg.css` and `js/spine-bg.js`. Star and
deep-field builds untouched at 29 / 12.

---

## The one-line version

The Aug-23 snare retune WAS already live — proven three ways — so the owner's
"feels old" was an ear verdict on the shipped 85 ms window, not a deploy
failure; on the owner's word `s coin` stepped to 110 (~one extra strike per
20 s), was verified locally at build 44, released to `main`, and confirmed
serving on `kundalini-spines.pages.dev` within a minute of the push.

---

## Corrections to earlier handoffs

- **51's git state is superseded.** `main` is now `3c25130` — the release
  carried the coinc bump AND the two commits 51 left trailing (`aab7657`
  checkout v5, `719f62a` handoff-51 doc). 51's open item 5 ("release
  `aab7657`") is **CLOSED**. `main` now trails the feature branch by only
  this handoff's own commit, which is the normal steady state.
- **51's "spine-build untouched at 43" is out of date** — it is 44 as of this
  session, on the live site.
- **The DNS hold continues:** checked at the end of this session,
  `kundalinispines.com` still resolves to Namecheap parking (162.255.119.169)
  — the brother has not flipped the nameservers. Expected hold, per 51's open
  item 1. Do not re-run wizard stages 1–7.
- Nothing in 51's measurements was found wrong.

---

## WHAT SHIPPED (commit `3c25130`, released to `main` same session)

**`--snare-coinc: 85 → 110`** in `css/spine-bg.css` (the shipped value), with
the JS mirrors kept honest in `js/spine-bg.js`: the `COINC` fallback default,
the two-sided-gate history comment, and the `/?tune` tip for `s coin`. Build
ledger gained a "44 =" entry; `--spine-build: 44`. Sens (1.95), freq (1600),
decay, and the fork chance (0.12) are all untouched.

**Why 110 and what it is not:** the measured rows from the Aug-23 offline
sweep are 85 → 15.6 strikes per 20 s and 150 → 17.5. 110 sits between them —
**~16.3/20 s by interpolation, NOT a measured point**, and the comments in
both files say so. If a future session wants a real figure at 110, the
harness is `scripts/snare-tuning.py` (needs scipy + a real ffmpeg — the
"SUPER" ffmpeg on disk is a decoy, see the memory note).

---

## The investigation that preceded it (worth keeping — the method generalises)

The owner reported the live lightning felt like pre-retune settings. Verified
the Aug-23 retune (`7209a5a`: sens 2.2→1.95, freq 2500→1600, the two-sided
coinc gate at 85, fork 0→0.12) had in fact shipped, three ways:

1. **Ancestry:** `git merge-base --is-ancestor 7209a5a origin/main` — yes.
2. **Bytes:** `curl` of `css/spine-bg.css` and `js/spine-bg.js` from
   pages.dev, `diff` against the worktree — **byte-identical**.
3. **Runtime:** browser on the live home page, `getComputedStyle` on `:root`
   — every `--snare-*` var read the new value.

Also ruled out, so nobody re-suspects them:

- **Stale cache is near-impossible:** Cloudflare serves the CSS/JS with
  `Cache-Control: public, max-age=0, must-revalidate` + ETag, so browsers
  revalidate every load.
- **localStorage cannot override the tuning:** `js/tune-panel.js` persists
  only panel UI state (`ks.tunePanel`, tab, sections) — never slider values.
  (`clouds-sky.js`, `filmrow-atmos.js`, `site-footer.js` have their own
  stores; none touch the snare channel.)

The remaining explanations were the ones that proved right: a preview-URL
bookmark would be frozen (hash-subdomain deploys never advance), and the
shipped 85 was a compromise sparser than the owner's tuner experiments.

---

## How this session's change was verified

- **Locally before commit:** `scripts/serve.py` via the browser pane —
  computed `--snare-coinc: 110`, `--spine-build: 44`, `--snare-sens: 1.95`
  on `html.page-home`; zero console errors.
- **Live after release:** first poll of
  `kundalini-spines.pages.dev/css/spine-bg.css` (~15 s after CI) already
  served `snare-coinc: 110` / `spine-build: 44`.

## Verified vs. asserted — and the honest gap

**Verified:** everything above. **Asserted / NOT verified:** the actual felt
strike rate at 110. Nobody — owner or session — has listened to a track on
the live site at the new window. The change is audio-reactive timing, so a
screenshot cannot show it (this is the named gap, not a skipped screenshot:
the static page is pixel-unchanged by design); the proof that matters is the
owner's ear with a track playing. Remember the detector needs a playing
track and reduced-motion off, and starts on a track *change*.

---

## What is deliberate, so nobody fixes it

- **110 is interpolated and documented as such** in both files. That is not
  sloppiness to clean up — do not silently rewrite it as if measured.
- **The JS `COINC = 110` is a fallback only**; the CSS var is the live
  source. They are kept equal on purpose (the retune commit set the
  precedent). Change one, change both.
- Everything in 51's deliberate list stands (pruned vendored skill, public
  `.mcp.json`, wizard in `scripts/`, GitHub Pages off, cold-cache 200s).

## Do not do these

- **If the owner still wants more lightning, move `s coin`, not `s sns`** —
  150 is the measured ceiling (17.5/20 s) before the window stops buying
  real snares; sens below ~2 fires on hats (measured, see the CSS block).
- **Do not treat "feels old" as a deploy failure again** without running the
  three-way check above first — this session it took minutes and settled it.
- **Do not sync `main` unprompted** — a sync DEPLOYS. This session's release
  was on the owner's explicit "push to main".
- Carried and binding from 51: no GitHub Pages; no Payment-Link redirect
  until the real domain; no fulfilment Worker unprompted; never
  `python -m http.server`, never `file://`; no paid deliverables in the
  repo; no Python text-mode writes to JS/CSS/HTML.

---

## Git state

- Branch `feature/spine-ui-v2`. Session start `719f62a`.
- Commits: `3c25130` (the coinc bump, 2 files) — pushed, **and released**:
  `main` fast-forwarded `a2e2ad4..3c25130` on the owner's word, CI deployed
  green. Plus this handoff's commit (branch only).
- **`main` = `3c25130`**, live. Trails the branch by this handoff only.

---

## Still open

1. **The listen test at coinc 110** — the owner has not yet heard the new
   window with a track playing on the live site. If it still reads sparse,
   next stop is 150 (measured); past that the problem is elsewhere.
2. **DNS / custom domain — still IN FLIGHT** (51's item 1, unchanged except
   freshly re-checked: still parking as of late 30 Aug). Waits on the
   brother's nameserver flip, then stage 9.
3. **The fulfilment Worker** — waits on the owner's go (51's item 2).
4. **Live Stripe link swap** — waits on the owner taking real money.
5. **STRIPE-SETUP.md GitHub-Pages sweep** — when the Worker starts.
6. **MCP OAuth from an interactive session** — untouched this session; the
   four authed Cloudflare servers still won't load headless.
7. Deluxe/Artifact phase 2; refund & delivery policy page; Stripe Tax.

**Carried from 47–51, unchanged:** phones and the feather masks; glow
judgement at `/?tune`; masks 04–07; the hero-wait; rooftop glow; mask-06
transcription; 41's mobile calls; VHS on phones; the labs' fate; the `-g 48`
re-export; leg-aware clip pause; filmrow labs; doc-rail ring inversion;
`music.html` stub; stale TIPS prose; missing trivia files; astral scrim; the
inherited pile.

---

## Starting the next V2 chat

Attach this file. Working folder
`C:\Users\Haight\Desktop\kundalini-spines-spine-ui` on `feature/spine-ui-v2`.
Serve with `python scripts/serve.py` — never `file://`, never
`python -m http.server`. The site is LIVE at
https://kundalini-spines.pages.dev at spine-build 44; a release to `main`
deploys. Likely first task: play a track on the live site and let the owner
judge coinc 110 — then the DNS stages if the domain has flipped.
