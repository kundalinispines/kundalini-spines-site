# Kundalini Spines — Spine UI V2 Handoff 51

**Date:** August 30, 2026

Thirty-third handoff of the **Spine UI V2** track (branch `feature/spine-ui-v2`).
`50` owns the release-branch rule and the delivery architecture; `49` owns the
Album nav entry; `48` owns the purchase track. **This was the Cloudflare
migration session** — 50's item 2, executed with the owner: the site is now
**live at https://kundalini-spines.pages.dev**, deployed by CI from `main`.

No page, stylesheet or site script was touched. `--spine-build`,
`--star-build`, `--df-build` untouched at 43 / 29 / 12.

---

## The one-line version

The GitHub Pages workflow was retired and its three guards ported verbatim
into `deploy-cloudflare.yml` (direct upload — Cloudflare only ever receives
the allowlisted files); the owner ran the account-side wizard (Cloudflare
account, Pages project, scoped token, GitHub secrets); the owner released
`main` twice; and the live site was verified page-by-page, **including proof
that video seeking works on the new host** — the failure that poisoned three
local sessions does not exist on Cloudflare.

---

## Corrections to earlier handoffs

- **50's "nothing is live anywhere" is now false.** The site is live at
  `kundalini-spines.pages.dev` (verified 30 Aug 2026, see below).
  `kundalinispines.com` still parks at Namecheap — the DNS move (wizard
  stages 7–9) has not been run. The test-mode Stripe link is therefore now
  reachable at the pages.dev URL; still the owner's recorded choice.
- **50's item 2 (the Cloudflare migration) is CLOSED** except for the DNS
  stages, which are optional, gated, and the owner's.
- **The stale "never push to `main` / `main` is dormant" text in BOTH session
  skills is fixed** as of this session (50 flagged it; the skills now carry
  the release-branch rule themselves, dated). The memory note was updated too.
- **Nothing in 50's measurements was found wrong.**

---

## WHAT SHIPPED (commits `a2e2ad4`, `aab7657`)

### 1. Cloudflare agent setup, adapted to this box

The official path (`claude plugin install cloudflare@cloudflare`) needs the
`claude` CLI; the fallback needs Node; this box has neither. So:

- **`.claude/skills/cloudflare/`** — the official skill vendored from
  `cloudflare/skills` @ `f96bff7`, pruned 320 → 62 files (the 12 products
  this project can touch). `VENDORED.md` in that folder records source,
  date, and the pruning rationale — the SKILL.md decision trees naming
  missing reference dirs is the pruning, not a broken copy.
- **`.mcp.json`** — the five Cloudflare MCP servers (public URLs only).
  They load on session restart; the four authenticated ones need an OAuth
  pass from an interactive session. The docs server needs no auth.

### 2. `deploy-pages.yml` → `deploy-cloudflare.yml` (git shows the rename)

Allowlist assemble, accounting step and leak guard carried **verbatim**,
comments and all. The tail is now `cloudflare/wrangler-action@v3` running
`pages deploy _site --project-name=kundalini-spines --branch=main`.
**Direct upload is load-bearing**: a Git-connected Pages project would clone
the whole public repo into Cloudflare's build env; direct upload ships only
the assembled `_site`. `.mcp.json` was added to the leak-guard name list.
Needs repo secrets `CLOUDFLARE_API_TOKEN` (Pages Edit, scoped) and
`CLOUDFLARE_ACCOUNT_ID` — both set by the owner via the GitHub UI, neither
ever in the tree. `checkout` bumped to v5 (`aab7657`) for the Node-20
retirement warning; the `wrangler-action@v3` half of that warning stays
until Cloudflare ships a Node-24 target, and is harmless.

### 3. `scripts/cloudflare-migration.sh` — the account-side wizard

Nine stages, no value ever typed into the script (no `gh` on this box;
account id and token travel Cloudflare tab → GitHub tab). The owner ran
stages 1–6 this session. **Dashboard drift, recorded for re-runs:** the
create screen now leads with "Create a Worker"; the Pages flow (and its
"Upload assets" direct-upload path) is behind the small **"Looking to deploy
Pages? Get started"** link at the bottom. "Upload your static files" on the
Worker screen is the WRONG one — it makes a Worker, not a Pages project.

### 4. Two releases, both owner-instructed

`main` fast-forwarded `2c5fc57..a2e2ad4` ("go ahead and sync with main").
That push ran the new workflow live: guards green, deploy step failed
pending secrets — predicted exactly. After the wizard, run 33312225934
deployed green. `aab7657` (the checkout bump) is NOT yet released; `main`
trails by that one commit plus this handoff — normal.

---

## How this was verified

- **Guards, locally before commit:** the three steps extracted from the YAML
  and run against the worktree — 293 files (50's exact count), accounting
  clean, guard clean. Then negative tests: a planted `V2HANDOFF 51.md` and a
  planted `.mcp.json` in `_site` each made the guard exit 1; removed, it
  passed. A guard is only real if it has been watched failing.
- **The published set, locally:** `_site` served via `scripts/serve.py 8001
  _site`, Playwright drove all ten public pages — zero 4xx/5xx, zero console
  errors; purchase page screenshotted and looked at (three editions priced).
- **The live site:** same ten-page drive against `kundalini-spines.pages.dev`
  — zero 4xx/5xx, zero console errors. Index screenshot at 1440x900 after a
  9s settle matches the session-start local baseline frame-for-frame.
- **Video on the live host, the check that mattered:** hero video duration
  reads 8.768s, `seekable` spans the full file, and `currentTime = 5.2608`
  landed at exactly 5.2608 — no clamp to 0. Range requests: the FIRST hit on
  a cold edge cache answers `200` with no `Accept-Ranges`; the second answers
  `206` with a correct `Content-Range` (bytes 0-1023/4649784). **The cold-cache
  200 is normal Cloudflare behaviour, not the http.server bug — do not "fix" it.**
- **Secret scan before commit:** the only new `sk_`-shaped hit is Cloudflare's
  own anti-pattern placeholder (`sk_live_abc123`) in the vendored docs under
  `.claude/`, which the leak guard bars from publishing anyway.

## Verified vs. asserted

**Verified:** everything above. **Asserted:** that the four authed MCP
servers OAuth cleanly from an interactive session (not yet tried); wizard
stages 7–9 (written, statically traced, not yet run — the dashboard drift
note suggests re-checking UI wording when they are); Safari/Firefox/touch,
unchanged from 49.

---

## What is deliberate, so nobody fixes it

- **The vendored skill is pruned.** Widening it is a copy, not a bug report.
- **`.mcp.json` sits at the repo root, public.** URLs only; that is fine.
- **The placeholder Pages deployment** ("standby") was replaced by the first
  real deploy; if it resurfaces in the deployments list, it is history.
- **The wizard stays in `scripts/`** (internal, never published) even though
  its one-time job is mostly done — stages 7–9 remain, and it documents the
  account shape.
- **GitHub Pages remains off, permanently.** Carried from 50, now with the
  workflow file gone from the tree (history has it).
- **The cold-cache 200-without-ranges on media files** — see verification.

## Do not do these

- **Do not sync `main` unprompted** — and remember a sync now DEPLOYS.
- **Do not enable GitHub Pages.** The host is Cloudflare Pages, live.
- **Do not set the Payment-Link redirect yet.** The purchase pages are live
  at pages.dev, but "live" for the redirect means the real domain — wait for
  the DNS stages and the owner's word (carried from 48/50, sharpened).
- **Do not build the fulfilment Worker before the owner asks** (carried).
- **Do not create Workers from the dashboard's "Upload your static files"**
  when touching the Pages project — wrong product, see the wizard note.
- Carried and binding: no paid deliverables in this repo ever; success page
  proves nothing; nav is nine files; prices are four files; no Stripe secret
  in any form; never `python -m http.server`, never `file://`; no Python
  text-mode writes to JS/CSS/HTML (the wizard got binary-mode LF surgery for
  exactly this reason).

---

## Git state

- Branch `feature/spine-ui-v2`. Session start `a78d43e`.
- Commits, all pushed: `a2e2ad4` (migration change set, 66 files),
  `aab7657` (checkout v5), plus the skill fixes + this handoff's commit.
- **`main` = `a2e2ad4`**, released twice this session by owner instruction.
  It trails the feature branch by the post-release commits. Normal.
- Site files, media, build numbers: untouched.

---

## Still open

1. **DNS / custom domain** — wizard stages 7–9: move `kundalinispines.com`
   off Namecheap parking, attach apex + www to the Pages project. Owner's
   call, owner's hands. This is what makes the real domain live.
2. **The fulfilment Worker** (50's architecture stands: Worker + R2 signed
   links + Resend). Waits on the owner saying go. The vendored r2/workers/
   miniflare references and the MCP servers are in place for it.
3. **Live Stripe link swap** (one line) — waits on the owner taking real money.
4. **STRIPE-SETUP.md still says GitHub Pages in places** — its options and
   secrets tables predate the host decision; sweep it when the Worker starts.
5. **Release `aab7657`** with the next owner-approved sync.
6. **MCP OAuth** — run once from an interactive session so the Cloudflare
   API/bindings/builds/observability tools work.
7. Deluxe/Artifact phase 2; refund & delivery policy page; Stripe Tax
   (carried from 48/50).

**Carried from 47–50, unchanged:** phones and the feather masks; glow
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
https://kundalini-spines.pages.dev and deploys on every release to `main`,
so treat syncs with the respect deploys deserve. Likely next task: the DNS
stages if the owner ran them (verify the domain), site tweaking otherwise,
and the Worker only on the owner's go.
