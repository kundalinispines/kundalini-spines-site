# Kundalini Spines — Spine UI V2 Handoff 55

**Date:** September 1, 2026

Thirty-seventh handoff of the **Spine UI V2** track (branch `feature/spine-ui-v2`).
`54` owns the STANDBY near-miss and the live-account activation; `53` owns the
sky saga and the Cloudflare Browser Cache TTL; `51` owns the Cloudflare
migration recipe. **This session:** no sky work, no visual work, no build
numbers touched. The site gained a **server** — its first — and started
selling the Digital Edition for real money, verified end to end with a live
purchase and a live refund.

---

## The one-line version

Two Cloudflare Pages Functions (`functions/api/verify.js`, `.../download.js`)
now confirm a Stripe payment server-side and stream the album out of a private
R2 bucket; the success page was rebuilt around four states and stops believing
its own query string; **a refunded buyer would have kept downloading for 72
hours while a comment claimed that was impossible**, found and fixed before
anyone hit it; and the live Payment Link went in, was bought with real money,
downloaded both files, survived a refresh, and closed cleanly on refund.

---

## Corrections to earlier handoffs

- **54's item 2 — "the fulfilment Worker, now the blocking gate on Digital" —
  is CLOSED.** It said a live Digital sale "delivers nothing automatically: no
  download issuance, no confirmation email, no order storage" and warned not to
  open Digital sales before deciding that was acceptable. Download issuance now
  exists and is automatic. **Confirmation email and order storage still do
  not** — see Still open item 1, which is the remainder of that same item and
  is now the most exposed thing on the list.
- **54's item 1 — swap the test Payment Link — is CLOSED.**
  `js/purchase-checkout.js` line ~122 carries the live link. Sales are open.
- **54's item 3 — "`purchase-cancelled.html` has never been read against a real
  arrival" — is CLOSED, and reading it found exactly what 54 predicted.** Its
  STANDBY panel said "no payment processor is connected, so no checkout could
  have been started or cancelled." Every clause was false.
- **`STRIPE-SETUP.md` §1, "The blocking fact: this site has no server", is
  superseded.** There is a server. The section is kept because the reasoning
  downstream of it still explains the shape of the design, but the blocking
  fact is no longer blocking. Its opening paragraph — "no Stripe account is
  connected, no price IDs exist, no payment links exist, and no payment has
  ever been processed" — was also retired; all four stopped being true.
- **A claim THIS session made and had to withdraw within the hour: "a
  test-mode purchase will validate this."** It will not. Stripe API keys are
  mode-scoped, so the live `STRIPE_SECRET_KEY` cannot read a test session — a
  test purchase returns `not_found`. Testing in test mode means temporarily
  swapping BOTH the secret key and the price ID, and the secret is write-only,
  so the live key would have to be re-pasted blind afterwards. The real test
  is a real purchase, refunded after.

---

## What was built

**Two Pages Functions, at the repo root in `functions/api/`.** Cloudflare
compiles them at deploy time and routes them at `/api/verify` and
`/api/download`.

`verify.js` takes the `session_id` the Stripe redirect carries, asks Stripe's
API about it with the secret key, and returns an email, an order reference and
a signed download token only if **all** of: session `status` is `complete`,
`payment_status` is `paid`, the line items contain `PRICE_ID_DIGITAL`, the
charge is neither refunded nor disputed, and the purchase is inside the
download window.

`download.js` re-runs every one of those checks, then streams the object out of
the R2 binding. The bytes never have a URL of their own.

### The four decisions worth not relitigating

- **Pages Function, not a standalone Worker on `api.kundalinispines.com`.** It
  deploys with the site that already deploys, shares the custom domain (so no
  CORS, no second origin), and needs no second workflow or wrangler config. The
  cost is that a Function bug and a CSS bug are now the same rollback, which is
  acceptable on a hand-released site.
- **`functions/` is at the REPO ROOT, not in `_site`.** Cloudflare requires it
  outside the static output. This is why **neither the deploy allowlist nor the
  leak guard needed changing** — and why they must not be changed for it. In
  `_site` the function's *source* would be served at a public URL, and the leak
  guard would not catch it: that guard blocks `.md`, `.py`, `.sh` and internal
  page patterns, **not `.js`**, because `js/` is public.
- **The file is streamed through the binding, not redirected to a presigned
  URL.** A presigned URL needs R2 access keys in the environment and a SigV4
  signer, to arrive at a short-lived URL that is still a shareable URL. The
  binding IS the credential; the buyer never holds an address pointing at the
  bucket.
- **Neither file imports a shared module, and they duplicate ~30 lines.**
  Every `.js` under `functions/` becomes a public route — a
  `functions/lib/stripe.js` would be served at `/lib/stripe`. Two
  self-contained files depend on nothing.

---

## The refund bug — the one worth reading twice

`download.js` shipped on Aug 31 carrying a banner that said re-verifying with
Stripe caught "a refund, a dispute or a fraud cancellation."

**It caught none of them.** Checked against Stripe's API reference rather than
assumed: a Checkout Session's `payment_status` is one of exactly three values —
`paid`, `unpaid`, `no_payment_required` — and the session object carries **no
refund information whatsoever**. Refunding an order leaves `payment_status`
reading `paid` forever. Re-asking about the session, however many times, could
never learn the money had gone back.

A fully refunded buyer would have kept downloading for the entire 72-hour
window, while a comment three lines above insisted that was impossible. That is
the worst shape a bug can have: silent, and documented as unreachable.

**The fix:** both functions expand `payment_intent.latest_charge` and check
`refunded`, `amount_refunded` and `disputed`. **A partial refund also closes
the download** — deliberate, since there is no partial album; if goodwill
part-refunds become real, compare `amount_refunded` against `amount_total`
rather than against zero.

**How it was found:** planning the end-to-end test, not by a customer. The
lesson worth carrying: the comment was written confidently, and the checking
happened afterwards.

---

## Things learned the hard way, recorded so nobody re-learns them

- **A Stripe PAYMENT LINK has no `cancel_url`.** Its only redirect is
  `after_completion`, which fires on success. `cancel_url` belongs to
  API-created Checkout Sessions. **So nothing routes to
  `purchase-cancelled.html` automatically** — a buyer who backs out goes
  wherever their back button takes them. The page is not dead code; it is the
  destination the day this moves to Checkout Sessions. `STRIPE-SETUP.md`'s
  test line for it is struck through with the reason.
- **The R2 dashboard upload is a single PUT, and the WAV set is past it.** The
  album is two files — `KundaliniSpines_RiseUp_MP3.zip` (271 MB, uploads fine)
  and `KundaliniSpines_RiseUp_WAV.zip` (1,395 MB, does not). This is a limit of
  the upload **method**, not of R2, which holds objects to 5 TB. Large files
  need multipart. **`wrangler r2 object put` is not the way round it** — it
  caps at 315 MB and needs Node, which this box does not have. **rclone** is:
  one Windows `.exe`, no installer, multipart and resume for free, and it is
  Cloudflare's own recommendation.
- **Cloudflare retired three dashboard paths out from under the wizard**,
  caught on its first real run:
  | was | is now |
  |---|---|
  | Settings → Functions → R2 bucket bindings | **Settings → Bindings → Add → R2 bucket** |
  | Settings → Environment variables | **Settings → Variables and Secrets → Add** |
  | an **Encrypt** button | a per-row **Type** dropdown: Text / Secret |
  There is no **Functions** section any more. Expect these to drift again;
  trust the product over the document.
- **PowerShell's `curl` is an alias for `Invoke-WebRequest`** and prompts about
  script execution. Use **`curl.exe`** for the raw JSON.
- **`rclone config`'s `q` only works on the top-level menu.** The tail is
  `Edit advanced config? → n`, `Keep this remote? → y`, main menu `→ q`.

---

## Verified vs. asserted

**Verified, on the live domain, with real money:**

- A real $20 purchase completed. The success page printed **Purchase
  Confirmed**, the buyer's email, and the order reference — and that reference
  is written from the SERVER's response, never from the URL, so its appearance
  alone proves the whole verification chain ran and passed.
- **Both downloads finished**, including the 1,395 MB WAV streaming through the
  Worker.
- **Refresh re-verified.** Verification is stateless; there is no one-shot
  token and nothing to get out of step.
- **A real refund closed it.** After refunding in Stripe, reloading gave the
  refunded Status panel and no download buttons.
- Endpoint probes: forged token → `bad_token` 403; no token → `missing_token`
  400; junk session → `missing_session` 400; fabricated session → `not_found`
  404 with no reference and no token revealed.
- **The bucket is not public**: a direct `r2.dev` hit returns 401.
- The refund/dispute gate was unit-tested before release by importing both
  modules into Chromium and calling `onRequestGet` against mocked Stripe
  responses — clean paid mints a token; full refund, partial refund and dispute
  each return 403 with no token; a session with no charge object yet falls
  through to the `payment_status` gate rather than being treated as suspicious.
- All six success-page states rendered and were looked at (paid, unpaid,
  not-found, no-session, network failure, JS disabled), desktop and mobile, no
  page errors, no horizontal scroll.

**Asserted, not verified:**

- That the live `PRICE_ID_DIGITAL` was copied from live mode rather than test.
  It cannot be told from the ID's shape — Stripe price IDs do not encode mode
  the way keys do. **The successful live purchase is the proof**: a test price
  would have failed the product check with `wrong_product`.
- That the Payment Link's redirect is set correctly. Taken on the owner's word
  ("this is already here under don't show confirmation page") — and then proved
  by the purchase working.
- Nothing was screenshotted on the LIVE domain; the visual checks were all
  against `scripts/serve.py` on localhost with `/api/verify` mocked. The live
  render was confirmed by the owner reading it back, not by a capture.

---

## What is deliberate, so nobody fixes it

- **The session ID is a bearer token, and that is a known, documented limit,
  not an oversight.** There are no accounts, so whoever holds the success URL
  can download for 72 hours. Verification kills fabricated and unpaid IDs
  cold — which the old page could not do — but it cannot tell a buyer from
  someone they forwarded the link to. Bounded by the window and by a 15-minute
  download token. `STRIPE-SETUP.md` §8 says all of this plainly.
- **The download format is NOT part of the signed token.** Anyone holding a
  valid token can fetch either file, because they bought the album and both
  files ARE the album. An unrecognised `format` falls back to MP3 rather than
  erroring: a typo'd query string should produce a working download, not a
  paid customer staring at JSON.
- **`/api/download` re-asks Stripe on every request instead of trusting its own
  short-lived signed token.** One API call more expensive, and it means a
  Stripe outage blocks downloads. That is the correct failure direction here.
- **The success page's no-JavaScript panel is the DEFAULT in the markup**, and
  the script's first act is to hide it. Whatever renders without scripting has
  to be true on its own. A buyer with JS off is told plainly that confirmation
  needs it, rather than shown a spinner that never resolves.
- **There is no refund button on the site, and there must not be.** A
  self-serve refund on a page whose only identity check is a shareable session
  ID would let anyone holding that link refund someone else's order.
- **The download buttons are not in the markup at all** — their `href`s are
  written by script after verification. A present-but-disabled button is a
  button somebody re-enables in devtools.
- **MP3 is the primary button and WAV is a ghost**, with both sizes printed.
  The wrong tap costs somebody 1.4 GB on a phone.
- **The two zips keep their original filenames.** The code defaults to
  `KundaliniSpines_RiseUp_MP3.zip` / `..._WAV.zip`, so leaving them alone means
  no object-key variables to set.
- Everything in 54's deliberate list stands, minus the two STANDBY entries,
  which described panels that no longer exist.

---

## Do not do these

- **Do not move `functions/` into `_site`**, or add it to the deploy
  allowlist. Cloudflare requires it at the repo root, and in `_site` its source
  would be publicly served with the leak guard blind to it.
- **Do not enable a public `r2.dev` URL or a custom domain on the album
  bucket.** That recreates precisely the unsigned, unrevocable address §5 of
  `js/purchase-checkout.js` has forbidden since Aug 20. Verified private: a
  direct hit returns 401. Keep it that way.
- **Do not put a shared module under `functions/`.** Every `.js` there is a
  public route.
- **Do not "fix" the duplication between `verify.js` and `download.js`** for
  the same reason.
- **Do not trust a Checkout Session to tell you about a refund.** It cannot.
  The charge is the only place that knows. This is written down because the
  code once claimed otherwise.
- **Do not add `STRIPE_WEBHOOK_SECRET`, `STRIPE_PUBLISHABLE_KEY`,
  `PRICE_ID_DELUXE`, `PRICE_ID_ARTIFACT` or `EMAIL_API_KEY` speculatively.**
  Nothing reads them. An unused secret is a liability with no offsetting
  benefit.
- Carried and binding: no `main` sync unprompted (it DEPLOYS); do not revert
  the Cloudflare Browser Cache TTL; no GitHub Pages; never `python -m
  http.server`, never `file://`; no paid deliverables in the repo; no Python
  text-mode writes to JS/CSS/HTML; do not add `data-ks-price` to `merch.html`
  expecting the guard to see it.

---

## Git state

- Branch `feature/spine-ui-v2`. Session start `a07b51c`; end **`86dae63`**.
- Nine commits, all pushed: `fca5651` (the functions and the rebuilt success
  page), `1078761` (the R2 wizard), `92db064` (two files, and rclone),
  `760a763` / `5a80eed` / `366ddbd` (three wizard corrections from its first
  live run), `0cd2f75` (the wizard's bad diagnosis), `5d74541` (the refund
  gate), `86dae63` (the live Payment Link).
- **Two releases on the owner's explicit word.** `a07b51c..366ddbd` shipped the
  functions and return pages with the buy button still on the test link — a
  deliberately low-risk release so the whole path could be probed with nothing
  at stake. `366ddbd..86dae63` opened sales.
- **`main` and `feature/spine-ui-v2` are in sync at `86dae63`.** Working tree
  clean.
- Leak-checked before every release: the only `sk_`/`whsec_` matches in the
  diffs are the `sk_live_...` placeholders in `STRIPE-SETUP.md`'s own table.
  No account ID, price ID, bucket URL or key material is in the repo.
- **Build numbers untouched** — `--star-build: 36`, `--spine-build: 44`,
  `--df-build: 17`. No CSS or sky work happened.
- Files changed: `functions/api/verify.js`, `functions/api/download.js` (new),
  `purchase-success.html`, `purchase-cancelled.html`,
  `js/purchase-checkout.js`, `STRIPE-SETUP.md`,
  `scripts/r2-album-download.sh` (new).

### Provisioning state, on the owner's Cloudflare account

Bucket `kundalini-spines-album`, private, holding both zips — byte-verified
against the originals (284,448,316 and 1,463,058,557). Binding `ALBUM_BUCKET`.
Variables `STRIPE_SECRET_KEY` (Secret), `DOWNLOAD_SIGNING_KEY` (Secret),
`PRICE_ID_DIGITAL` (Text). Payment Link redirect set to
`https://kundalinispines.com/purchase-success?session_id={CHECKOUT_SESSION_ID}`.

---

## Still open

1. **THE CONFIRMATION EMAIL. This is the most exposed thing on the site and it
   will cost a real customer.** Nothing emails the buyer a link to their
   download. The success page URL is their ONLY route back to the files, and
   **Stripe's receipt does not contain it** — a Stripe receipt shows the
   purchase, not your redirect URL. So a buyer who closes the tab before
   downloading has no way back at all, even though they paid and the 72-hour
   window is still open. That is not a hypothetical: it is the ordinary case
   for anyone who buys on a phone meaning to download on a laptop later. Their
   only recourse is emailing the owner, who has no automated way to reissue.
   **Decide this before promoting the album.** The remainder of 54's item 2.
2. **No order storage, and no webhook.** `checkout.session.completed` is still
   not implemented (§5 of `STRIPE-SETUP.md`, unchanged). The only record of a
   sale is in Stripe. Related to item 1: any reissue flow needs somewhere to
   look up an order.
3. **No download-count cap.** The highest-value hardening if sharing becomes
   real, and a contained change: one KV or D1 binding, one read, one write, in
   `download.js`. Left out because it adds a storage dependency to a launch
   that had not yet made a sale.
4. **"Yours permanently" on `purchase.html` vs the 72-hour link.** The record
   is theirs permanently; the link is not. The `window_closed` copy resolves it
   honestly (it says the limit is on the link and to write in for a reissue) —
   but there is no reissue mechanism, which folds back into item 1. If reissues
   get frequent, raise `DOWNLOAD_WINDOW_HOURS` rather than editing the promise.
5. **Deluxe and Artifact are still `checkoutUrl: null`.** Both were always
   going to be shipped by hand. Artifact is additionally
   `status: 'coming-soon'` — the production run does not exist, so it needs a
   `status` flip as well as a URL.
6. **Nothing tests any page's copy against its own query string.** The class of
   bug that produced 54's STANDBY near-miss and this session's cancelled-page
   lie is still untested. Three copy-vs-reality defects in two sessions, all
   found by reading.
7. **`STRIPE-SETUP.md` GitHub-Pages sweep** — §1 and others still describe the
   retired host. Deliberately deferred (53's item 5). This session narrowed it
   but did not close it.
8. **Refund & delivery policy page, Stripe Tax.** Now genuinely relevant: real
   money is moving.
9. **The listen test at coinc 110** (52's item 1, unchanged).
10. **MCP OAuth from an interactive session** — the authed Cloudflare servers
    still will not load headless. Everything this session did on Cloudflare was
    done by the owner in the dashboard for that reason.
11. Deluxe/Artifact phase 2.

**The sky saga stays CLOSED** — 53 item 1, closed on the owner's word at build
36. No sky code was touched this session or last. If it is reopened, re-read
53's three-clocks proof first.

**Carried from 47–54, unchanged:** phones and the feather masks; glow judgement
at `/?tune`; masks 04–07; the hero-wait; rooftop glow; mask-06 transcription;
41's mobile calls; VHS on phones; the labs' fate; the `-g 48` re-export;
leg-aware clip pause; filmrow labs; doc-rail ring inversion; `music.html` stub;
stale TIPS prose; missing trivia files; astral scrim; the inherited pile.

---

## Starting the next V2 chat

Attach this file. Working folder
`C:\Users\Haight\Desktop\kundalini-spines-spine-ui` on `feature/spine-ui-v2`
(**not** the production `kundalini-spines` folder). Serve with
`python scripts/serve.py` — never `file://`, never `python -m http.server`.

**The site is LIVE at https://kundalinispines.com at star-build 36, and it is
now SELLING.** A release to `main` deploys, and only on the owner's word.

**Likely first task: item 1, the confirmation email.** Before treating it as a
small job, read what it actually needs — a way to reach the buyer, which means
either the webhook (item 2) or a manual reissue path, plus somewhere to look up
an order. The honest short-term mitigation, if the full thing is not wanted
yet, is to say on the success page in plain words: *download now, this link is
good for 72 hours, and here is the address to write to if you lose it.* That is
a copy change and it is most of the protection.

**If anything goes wrong with a sale, the safe move is to revert
`js/purchase-checkout.js`'s `checkoutUrl` to the test link and release.** That
closes sales in about 20 seconds and breaks nothing for anyone who already
bought — `/api/verify` asks Stripe about the session rather than anything
stored in this repo, so outstanding orders keep working.
