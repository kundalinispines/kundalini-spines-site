# Kundalini Spines — Spine UI V2 Handoff 50

**Date:** August 28, 2026

Thirty-second handoff of the **Spine UI V2** track (branch `feature/spine-ui-v2`).
`49` owns the Album nav entry and the fixed-header overflow trap; `48` owns the
purchase track and the Stripe wizard; `47` owns the playback hold on the sky.
The plain `HANDOFF 1`–`19` series documents the old production line on `main` —
and as of this session that sentence needs care, because **`main` is no longer
dormant.**

**This one leaves the site itself alone entirely.** No page, stylesheet or
script was touched. `--spine-build`, `--star-build` and `--df-build` are
untouched at 43 / 29 / 12. The only file edited was
`.github/workflows/deploy-pages.yml`. This was a **release and architecture
session**: it moved git state and made decisions.

---

## The one-line version

**The owner released the V2 line to `main`** — a clean fast-forward,
`13083d9..2c5fc57`, 176 commits — **and chose the delivery architecture**: the
site is leaving GitHub Pages (before ever going live on it) for a Cloudflare
stack, where a Worker will fulfil album purchases. Nothing is live anywhere
yet, and the fulfilment build has not started — the owner wants more site
tweaking first.

---

## Corrections to earlier handoffs

- **"Never push to `main`" is superseded.** Every handoff so far, both session
  skills, and a memory note said `main` is dormant and the feature branch never
  reaches it. On 2026-08-28 the owner instructed the sync ("let's work on
  getting this branch synced to main") and confirmed the push explicitly. The
  standing rule is now: **`feature/spine-ui-v2` is the working branch, `main`
  is the release branch, and a sync to `main` is a release act that happens on
  the owner's word — never on a session's own initiative.** Do not "helpfully"
  keep `main` level; it lags the feature branch by design between releases
  (right now by exactly this handoff's commit).

- **49's "Still open" item 4 is HALF-closed and reshaped.** The purchase pages
  now exist on `main` and are in the deploy allowlist, so the nav no longer
  promises a page the release branch lacks. But **nothing is live anywhere**:
  GitHub Pages was never enabled (the deploy run failed at "Configure Pages",
  verified — see below), `kundalinispines.com` resolves to Namecheap parking
  (162.255.119.169; `www` CNAMEs to a parking page), and the github.io URL
  404s. And the target itself has moved: the site will ship from **Cloudflare
  Pages**, not GitHub Pages. Item 4 is now "do the Cloudflare migration".

- **49's "check `main`, not this branch" deployment rule** is content-obsolete
  (the branches are identical apart from this handoff) but the underlying
  Payment-Link redirect rule still binds: the purchase pages are still not
  **live**, so the redirect still must not be set.

- **Nothing in 49's measurements was found to be wrong.** The nav, the gap
  block, and the fixed-header finding all still stand.

---

## WHAT SHIPPED

### 1. The purchase pages joined the deploy allowlist

`.github/workflows/deploy-pages.yml`, commit `2c5fc57`: `purchase.html`,
`purchase-success.html` and `purchase-cancelled.html` added to `PUBLIC`.
Without this the push to `main` would have failed the workflow's own
accounting step — the allowlist fails closed, exactly as designed. Counts
re-verified 28 Aug 2026 and recorded in the file: 33 root .html files = 10
public + 23 internal (18 `*-lab.html`, `links.html`, 2 `raster-test*`, 2
`transmissions-option*`). The two return pages are published but carry
`noindex,nofollow` and are deliberately absent from `sitemap.xml` — they exist
only as Stripe round-trip destinations.

### 2. `main` fast-forwarded to the V2 line

`git push origin feature/spine-ui-v2:main`, `13083d9..2c5fc57`, 176 commits,
**no merge commit** — the branches were never divergent (`main` had zero
commits of its own), so this is a pointer move, not a merge. No PR.

### 3. Decisions taken by the owner, on the record

- **The test-mode Stripe link ships on `main` by explicit choice** ("keep test
  link for now"). It is harmless while nothing is live; it must be swapped for
  a live Payment Link before real customers can reach the page.
- **Delivery is route 3** of STRIPE-SETUP.md — a small serverless backend —
  and **GitHub Pages is abandoned as the host**, before ever being enabled.
  The owner's words: "most likely the route i'll go with the recommended
  stack". Not built yet; site tweaking comes first.

---

## The chosen delivery architecture (written up at the owner's request)

The authorities remain `js/purchase-checkout.js` §5 (the seven fulfilment
steps) and `STRIPE-SETUP.md` (options, secrets table, outstanding list). This
section is the platform decision layered on top of them.

**Stack: Cloudflare Pages (static site) + a Cloudflare Worker (webhook +
signed downloads) + R2 (the album files) + Resend (the delivery email).**
Chosen over Netlify/Vercel because the files were always headed for R2 — R2
has no egress fees, so a thousand album downloads cost $0 — and one vendor
beats two. DNS for `kundalinispines.com` (currently Namecheap parking) can
move to Cloudflare in the same migration. Resend's free tier (100 emails/day)
covers the volume; Cloudflare does not do transactional email itself.

**Where the files live: R2, and NEVER in this repo.** The repo is public on
GitHub; anything committed here is free for the taking regardless of any
allowlist, and a "hidden" path under `assets/` is a URL, and URLs get shared.
§5's capitalised rule stands: the album zip URL must never appear in any
committed HTML or JS. The 12-page booklet PDF and any package extras get the
same treatment as the audio. Only artwork that is *also* public marketing may
live in `assets/`.

**The flow:** buyer pays (the existing Payment Link keeps working —
`checkout.session.completed` fires for Payment Link checkouts too; one link
per edition with fixed metadata identifies the purchase) → Stripe calls the
Worker → Worker verifies the signature, dedupes on the session id, reads the
edition from metadata → generates a signed, expiring, download-capped R2 URL →
Resend emails it to the buyer. `purchase-success.html` stays a thank-you page
and proves nothing, exactly as §5 says. **Phase 2** adds a `/api/checkout`
endpoint creating real Checkout Sessions, which is what unlocks size/variant
capture and Artifact numbering for the physical editions.

**Division of labour when the build happens:** a session can write and verify
everything repo-side — the Worker, wrangler config, the Pages deploy, porting
the allowlist/leak-guard logic out of `deploy-pages.yml` before retiring it.
Only the owner can do the account side: create the Cloudflare account, connect
the repo, make the bucket, upload the album files, paste the secrets
(`STRIPE_WEBHOOK_SECRET`, the signing key, the Resend key — never into the
repo), and the Stripe Dashboard steps. Hand the owner a wizard for those.

---

## How this was verified

- **The three workflow steps were run locally against the worktree before the
  push**: assemble (293 files), accounting (every root .html published or
  internal), leak guard (clean). Then the assembled `_site` was served over
  HTTP — `scripts/serve.py` takes an optional docroot argument,
  `python scripts/serve.py 8001 <path>`, which is exactly what it is for — and
  Playwright drove **all ten public pages: zero 4xx/5xx responses, zero
  console errors.** `purchase.html` was screenshotted from the publish set and
  looked at: nav correct with `Album` current, all three edition panels
  priced. Clicking "Own the Digital Album" fired the navigation to the Stripe
  test URL from the published set (measured by route-intercepting
  `buy.stripe.com` and recording the attempt).
- **The real deploy run confirmed the prediction exactly** (Actions run
  33170876177, queried through the GitHub API — the repo is public and `gh` is
  not installed on this box): Assemble ✓, Accounting ✓, Leak guard ✓,
  **failed only at "Configure Pages"** because Pages is not enabled on the
  repo. The failure is expected and harmless; nothing about the site content
  is wrong.
- **Integrity:** the yml edit is LF-only, BOM-less, valid UTF-8, all-ASCII
  additions; em dash count unchanged. Secret scan before the commit: zero
  `sk_`/`whsec_`/`pk_live` material anywhere in the tree.
- **A session-start baseline screenshot** of `index.html` at 1440x900 was
  taken and looked at before any change: seven nav items in order, entrance
  settled correctly.

## Verified vs. asserted

**Verified:** everything above, including the DNS state (nslookup: apex →
162.255.119.169, `www` → parking CNAME) and the github.io 404.

**Asserted, not verified:** that Cloudflare's free tiers behave as described
(taken from knowledge, not tested against an account — no Cloudflare account
exists yet); that `checkout.session.completed` fires for Payment Links with
per-link metadata (documented Stripe behaviour, will be proven when the
Worker exists); Safari/Firefox/touch, unchanged from 49.

---

## What is deliberate, so nobody fixes it

- **The test-mode Stripe link is on `main`.** Owner's choice, made knowingly.
  Swap it (one line, digital slot of `js/purchase-checkout.js`) before launch.
- **GitHub Pages is NOT enabled, and must stay off.** The failed deploy run is
  not a bug to fix — the site's host will be Cloudflare Pages. Enabling
  GitHub Pages now would create a second live copy the moment it works.
  `enablement: true` was deliberately not added to `configure-pages`.
- **No merge commit, no PR** for the `main` sync. Fast-forward was correct
  because `main` had nothing of its own; do not rewrite this into a
  merge-based flow retroactively.
- **`deploy-pages.yml` was updated even though its host is being abandoned.**
  Its allowlist and leak guard encode the public/internal split and a real
  leak that almost happened (see its own comments). When the Cloudflare
  migration lands, **port that logic into the new build, then retire the
  file** — do not just delete it.
- **`main` now trails the feature branch by this handoff's commit.** Normal
  between releases. Not a discrepancy.

---

## Do not do these

- **Do not sync `main` on your own initiative.** A sync to `main` is a
  release, and releases are the owner's call, each time.
- **Do not enable GitHub Pages.** The host is Cloudflare. Two hosts = two
  live copies = the wrong one gets bookmarked.
- **Do not put the album, the booklet PDF, or any paid deliverable anywhere in
  this repo, ever.** Public repo. §5's rule; restated here because delivery
  is now planned rather than hypothetical.
- **Do not treat `purchase-success.html` as proof of payment.** The webhook is
  the authority. Anyone can type the success URL.
- **Do not set the Payment Link redirect until the purchase pages are live**
  on the real host (carried from 48; "live" now means Cloudflare, not `main`).
- **Do not build the Worker/fulfilment before the owner asks.** The decision
  is recorded; the go-ahead is not given. Site tweaking comes first.
- Carried from 49 and still binding: no eighth nav item without re-measuring;
  no `scrollWidth` overflow checks on fixed headers; do not move `Album` next
  to Merch; do not rename `Album` to `Purchase`; a nav change is nine files;
  do not change a price in fewer than four files; never a Stripe secret in
  this repo in any form; do not flip Artifact to `available`; do not remove
  the STANDBY panels until the redirect exists.
- Carried and still binding: never `python -m http.server`, never `file://`,
  no Python text-mode writes to JS/CSS/HTML.

---

## Git state

- Branch `feature/spine-ui-v2`. Session start `b5bb102`.
- Commits this session, both pushed:
  - `2c5fc57` — the purchase pages join the public allowlist (workflow only)
  - (this handoff's commit follows)
- **`main` now points at `2c5fc57`** — fast-forwarded 176 commits this
  session, by owner instruction. The branches are identical apart from this
  handoff.
- One file touched besides this handoff: `.github/workflows/deploy-pages.yml`,
  +14 / −1. **No page, CSS or JS touched. No media added.**
- `--spine-build` 43, `--star-build` 29, `--df-build` 12 — all untouched.

---

## Still open

**The release / delivery track (reshaped this session):**

1. **Site tweaking** — the owner's stated next work, unspecified. Ask what.
2. **The Cloudflare migration** (was 49's item 4): account, Pages hosting,
   DNS off the Namecheap parking, port the deploy guards, retire
   `deploy-pages.yml`. Waits on the owner saying go.
3. **The fulfilment Worker** (49's item 2, now with a chosen shape): webhook +
   R2 signed links + Resend email, per the architecture section above. Waits
   on the migration.
4. **Live mode**: swap the test Payment Link for a live one (one line). Waits
   on the owner being ready to take real money.
5. **Deluxe and Artifact** need phase 2 (`/api/checkout`) for size/variant and
   numbering. Artifact still has no production run.
6. **A refund and delivery policy page** still does not exist; Stripe Tax
   still unexamined. (48's item 5, carried.)

**Carried from 47/48/49, unchanged:** phones and the 120.4KB feather masks;
glow/foreground judgement at `/?tune`; masks 04–07 row assignment; the
hero-wait; the rooftop glow gradient; the mask-06 rhythm transcription; 41's
mobile judgement calls; VHS on phones; **the labs' fate** (three labs
misdescribe themselves; the gap grew again in 49); the `-g 48` spine
re-export; the leg-aware clip pause; the filmrow labs; the doc-rail ring
inversion; `music.html` redirect stub; stale amber-era TIPS prose; the two
missing trivia files; the astral scrim; the inherited pile.

---

## Starting the next V2 chat

Attach this file. The working folder is
`C:\Users\Haight\Desktop\kundalini-spines-spine-ui` on `feature/spine-ui-v2`.
Serve with `python scripts/serve.py`, browse `http://localhost:8000` — never
`file://`, never `python -m http.server`.

The owner's stated next step is **site tweaking** (item 1) — ask what they
want to tweak. The Cloudflare migration and the fulfilment Worker are decided
and specified above but explicitly **not yet authorised to build**. When the
owner says go, start at the architecture section of this handoff and the
division-of-labour list in it.
