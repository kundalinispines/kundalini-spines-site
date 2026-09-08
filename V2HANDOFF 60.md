# Kundalini Spines — Spine UI V2 Handoff 60

**Date:** September 8, 2026 (session ran Sept 7–8)

Forty-second handoff of the **Spine UI V2** track. `59` owns the MP3-package
rebuild; `58` the deep-field choreography and hero seam; `57` the footer
contrast harness; `56` the Stripe webhook; `55` the server and the refund
bug; `51` the Cloudflare migration recipe. **This session: the Bitcoin
checkout.** A read-only hostname audit, then a full BTCPay Server path built
beside Stripe — invoice creation, settlement webhook, success-page
verification, download gate — with a browser-driven test suite, a written
validation record, **release to `main` on the owner's word (commit
`5d17be6`)**, live smoke checks, and **an on-chain Bitcoin purchase made by
the owner on the live site, reported working.** No transmission filed yet —
see Still open item 1.

---

## The one-line version

`purchase.html`'s Digital card now has **Pay with Bitcoin** under the card
button. It asks for an email, POSTs `{product, email}` to
`/api/btcpay-create-invoice`, and navigates to
`https://pay.kundalinispines.com/i/…`. When BTCPay reports `InvoiceSettled`,
`/api/btcpay-webhook` re-reads the invoice, checks it against the order
record, and sends the same download email the Stripe webhook sends.
`purchase-success.html?order=ksbtc_…` asks `/api/btcpay-verify` and renders
the same confirmed panel from the same token shape; `/api/download` accepts
that token beside the Stripe one. **Stripe is untouched.** The whole thing
is live on `kundalinispines.com` as of 11:22 UTC Sept 8.

---

## Corrections to handoff 59

1. **`59` item 10 ("the live site was not screenshotted after this release")
   is closed.** The live purchase page was loaded in Playwright Chromium after
   the release, the Bitcoin form was opened by a real click, and the card was
   screenshotted and looked at (`LIVE-purchase-digital-card.png`, in the
   session's temp folder, not the repo).
2. **`59` said the next session "should serve with `python scripts/serve.py`
   <fresh port>". Still right, and now the test harness does it for you** —
   `scripts/test-btcpay-functions.py` spawns its own `serve.py` on a free port
   and kills it afterwards. Do not start a second server for it.
3. **The `kundalini-session-start` skill says the feature branch reaches
   `main` by `git push origin feature/spine-ui-v2:main`.** This session
   released the other documented way — in the production worktree
   `C:\Users\Haight\Desktop\kundalini-spines`, `git checkout main && git
   pull --ff-only && git merge --ff-only feature/spine-ui-v2 && git push
   origin main` — because the owner's procedure asked for it. Both are
   fast-forwards and both are fine. **Do not check out `main` inside the
   spine-ui worktree**; git refuses because `main` is checked out in the
   production folder, and that refusal is correct.
4. **`59` said `gh` is not installed. Still true.** The deploy run was read
   through the unauthenticated GitHub REST API
   (`/repos/kundalinispines/kundalini-spines-site/actions/runs?branch=main`),
   which works because the repo is public. Write the JSON to a Windows path,
   not `/tmp` — Python in this Git Bash cannot open `/tmp/x`.
5. **A recommendation this session wrote was wrong and was corrected before
   release.** The first draft of `BTCPAY-SETUP.md` §5 step 4 recommended a
   zero-confirmation speed policy for on-chain payments. The owner caught it.
   The shipped text says **at least one confirmation on-chain**
   (`MediumSpeed`); Lightning settles immediately. The store is set to
   MediumSpeed (owner's word, Sept 8). Do not reintroduce zero-conf for a
   digital download that cannot be recalled.

---

## What shipped (commit `5d17be6`, on `main` and `feature/spine-ui-v2`)

### Server — three new Pages Functions, one changed

- **`functions/api/btcpay-create-invoice.js`** — the only place the Bitcoin
  price exists (`CATALOG`, Digital at `"20.00"` USD). Validates Origin ==
  request origin, `Sec-Fetch-Site`, JSON content type, 2 KB body cap, product
  id in the catalog, email shape. Reads exactly `body.product` and
  `body.email`; every other key is ignored (a body carrying `amount: 0.01`
  produces a $20 invoice — tested). KV rate limit: 5 creations per hashed IP
  per 10 minutes, soft. Mints `ksbtc_` + 32 hex, **writes the order record
  before creating the invoice**, then POSTs to
  `/api/v1/stores/{storeId}/invoices` with a **literal** redirect URL
  (`SITE_ORIGIN/purchase-success?order=<ref>`, `redirectAutomatically:
  true`) and metadata `orderId / itemCode / itemDesc / buyerEmail / product`.
  Refuses a returned invoice whose checkout link is not on `BTCPAY_BASE_URL`'s
  origin or whose store/amount/currency differ. Returns `{ok, checkoutLink,
  reference}` only. Exports a single `onRequest` that dispatches on method
  (GET → 405 with `Allow: POST`).
- **`functions/api/btcpay-webhook.js`** — verifies `BTCPay-Sig:
  sha256=<hex>` as HMAC-SHA256 over the raw body, constant-time. Acts only on
  `InvoiceSettled`; `InvoiceExpired`/`InvoiceInvalid` are noted on the record;
  everything else is `ignored` 200. Requires `storeId` == ours and a
  `ksbtc_` `metadata.orderId`. Idempotent on `record.emailedAt`. Re-reads
  the invoice through the store-scoped GET and requires `status ===
  'Settled'`, id, store, non-TopUp type, amount, currency, `orderId`,
  `itemCode`, `buyerEmail` all to match the record. Writes the record
  (`settled`, `expiresAt = createdTime + 72h`, `manuallyMarked`, `overPaid`,
  `additionalStatus`) **before** sending; sends the Resend email (BTCPay
  wording); marks `emailedAt`. Missing record → 500 so BTCPay redelivers;
  mismatch → 200 `mismatch` with a MANUAL REVIEW log line.
- **`functions/api/btcpay-verify.js`** — `GET ?order=` → `settled` (with
  token, email, `expiresAt`, `emailed`), `pending` (`state: new` with the
  stored checkout link, or `processing` without), `expired` 410, `invalid`
  403, `not_found` 404, `wrong_product` 403, `window_closed` 410.
- **`functions/api/download.js`** — accepts `ksbtc_` in the token's first
  segment. New `verifyBtcpayOrder()` re-reads record + invoice on every
  download with the same gates as verify. **The Stripe block is unchanged
  in every line**, wrapped in `else` and re-indented; `git diff -w` shows
  one removed line (the old regex). No refund gate on the Bitcoin branch —
  deliberate, see below.

### Client and pages

- **`js/purchase-checkout.js` §6b** — `bindBitcoin()` / `startBitcoin()`:
  toggle with `aria-expanded`/`aria-controls`, form hidden until pressed,
  field focused on open, client-side email check, `fetch` same-origin with
  `credentials: 'omit'`, submit disabled + `aria-busy` + label "Creating your
  invoice…" while in flight (**one request for two presses, tested**),
  refuses a checkout link that is not https or is this page's own host,
  `checkout_started` tracked with `provider: 'btcpay'`. Errors are copy from
  `BTC_ERRORS`, each saying nothing was charged and naming card as the
  fallback.
- **`purchase.html`** — Digital card only: `[data-ks-purchase-btc]` ghost
  button at card width under the card CTA; `<form data-ks-btcpay-form>` with
  label, help line, email field, primary submit, `role=status` line, mono
  note. `novalidate` so the module writes its own message. Card note now
  reads "Card or Bitcoin · Direct download · Yours permanently".
- **`css/purchase.css`** — `.ks-btcpay*` block: field drawn on the card's own
  scrim (not `.newsletter-form__field`'s opaque surface), stacked column at
  every width, 44px targets, forced-colors rules. No motion on open.
- **`purchase-success.html`** — `?order=ksbtc_…` selects the Bitcoin path.
  Fifth panel `data-ks-state="pending"` with per-state copy, a "Return to
  the Bitcoin Invoice" link (only for a `new` invoice, only the stored https
  link) and Check Again. Polls every 8 s up to 90 times, pauses while the tab
  is hidden. `[data-ks-provider-name]` spans render "Stripe" or "BTCPay
  Server"; the confirmed rendering was lifted unchanged into `renderOk(body)`
  and both paths call it. `not_found` copy is built from the provider name so
  the Stripe sentence is byte-identical. `purchase_completed` carries
  `provider`.

### Tests, docs, validation

- **`scripts/test-btcpay-functions.py`** — imports the six Functions as ES
  modules into Playwright Chromium (no Node on this box) with fake KV, R2 and
  a scripted `fetch`. **107 checks + 11 visual checks, 0 failures**, plus a
  secret-hygiene sweep of every response body and log line. Requests are
  plain `{url, method, headers.get, text}` objects because a browser refuses
  to set `Origin`/`Sec-Fetch-Site` on a real `Request`. Also proves the
  Stripe verify/download/refund gate still work with a `cs_` token.
- **`BTCPAY-SETUP.md`** — the owner's document: variables, routes, record
  shape, provisioning order, the schema facts relied on, the end-to-end
  proof, tests, and the stated limits.
- **`BTCPAY-VALIDATION.md`** — every pre-release command with output, the
  secret scan, the Stripe-intact evidence, mocked-only list, risks, and the
  (then) no-deploy verdict with its three preconditions — all three were met
  by the owner before the release.
- `STRIPE-SETUP.md` gained one pointer row. `sitemap.xml`, `robots.txt`, the
  deploy workflow, `verify.js`, `stripe-webhook.js` untouched.

### The release, and what was checked after it

- Fast-forward `91f0a5c → 5d17be6` on `main`; deploy run
  **34220334030** ("Deploy site to Cloudflare Pages") completed **success**;
  new build serving ~2 min after the push.
- Live: `GET /api/btcpay-create-invoice` → **405** with `Allow: POST` on
  both hosts; `/api/btcpay-verify` → 400 / 404 for none / fake; unsigned
  `POST /api/btcpay-webhook` → **400 `bad_signature`** (proves the route is
  live AND `BTCPAY_WEBHOOK_SECRET` is set — a missing secret answers
  `server_misconfigured`); `/functions/api/*.js`, the two `.md`s and the
  test script all answer the homepage fallback, never source; served page,
  success page and JS carry no key pattern, no `Authorization`, no env name.
- **The owner then paid a real on-chain invoice** and reports the whole
  path working — redirect, confirmed panel, download. (Owner's word; the
  session did not see the invoice, the webhook delivery, or the email.)

---

## Verified vs. asserted

**Verified this session:**

- Every claim in `BTCPAY-VALIDATION.md` §§1–13, by the commands recorded
  there. The suite was run four times (build, validation, pre-commit,
  pre-release) at 0 failures each.
- The deploy succeeded and the new markup is live (API + Playwright).
- `BTCPAY_WEBHOOK_SECRET` is present in production (the unsigned POST
  answers `bad_signature`).
- Both Greenfield routes the code uses exist on the live instance (401
  without a key, not 404). `pay.kundalinispines.com` had no DNS record before
  the owner created the tunnel (NXDOMAIN on 1.1.1.1 and 8.8.8.8, Sept 7).
- Line endings: CRLF files stayed CRLF, LF stayed LF (`git ls-files --eol`).

**Asserted, not verified:**

- **That the on-chain purchase worked end to end.** Owner's word. Nobody in
  the session saw the BTCPay invoice, the webhook delivery log, the KV
  record, or the inbox. The next session should open BTCPay → Webhooks →
  Recent deliveries and confirm one `InvoiceSettled` at HTTP 200 for that
  invoice, and `wrangler pages deployment tail` or the dashboard log for a
  clean `ok`.
- **The installed BTCPay version.** Its swagger needs a login. The code
  follows the current official templates (`v2.4.4` was the latest release
  on Sept 7). The owner can open `/docs` after signing in.
- **That the store's speed policy is MediumSpeed.** Owner's word.
- **That the API key carries exactly the two permissions.** Owner's word;
  the code needs no others.
- **The Pages router's handling of a single `onRequest` export.** Proven
  live by the 405, so this one is now verified.

---

## Do not do these

Earlier lists still stand. New this session:

1. **Do not fulfil on anything but `Settled`.** `Processing`,
   `InvoiceReceivedPayment` and `InvoicePaymentSettled` are all "money seen,
   not done"; a partial payment fires two of them. Every stage (webhook,
   verify, download) gates on the live API status, not the event body.
2. **Do not set the store's on-chain speed policy to zero confirmations.**
   Correction 5. A served zip cannot be recalled.
3. **Do not add a `functions/lib/` shared module.** Every `.js` under
   `functions/` is a public route; the four Functions duplicate helpers on
   purpose (verify.js's banner has the argument). The email builder is
   duplicated in `stripe-webhook.js` and `btcpay-webhook.js` with one clause
   different; change both or neither.
4. **Do not export both `onRequest` and `onRequestPost` from one Function.**
   Which wins is a router detail this box cannot test. `btcpay-create-invoice`
   exports `onRequest` only and dispatches itself.
5. **Do not add a `BTCPAY_PRICE_DIGITAL_USD` variable.** Considered and
   rejected: a sixth place for $20 to drift. A test purchase to your own
   wallet costs a network fee, not $20.
6. **Do not `rclone copy` the delivery folder** (59 item 1 stands), and do
   not `sed -i` in Git Bash (59 item 3 stands). This session edited the
   CRLF files (`download.js`, `purchase-checkout.js`,
   `purchase-success.html`, `STRIPE-SETUP.md`) with binary-safe Python and
   the LF ones with the Edit tool; check `git ls-files --eol` first.
7. **Do not read `git diff --check` at face value here.** With
   `.gitattributes` `* -text`, the default rules flag every CR on a CRLF file
   as trailing whitespace (605 false hits this session). Use
   `git -c core.whitespace=cr-at-eol diff --check`.
8. **Do not grep the diff without `-a`.** The em-dashes make grep call it
   binary and print one line, which reads as "1 line scanned, clean". The
   secret scan in `BTCPAY-VALIDATION.md` §8 is Python for that reason.
9. **Do not put a real `Origin` on a browser `Request` in the test harness**
   and expect the origin check to be exercised — it is a forbidden header and
   is silently dropped. The harness passes plain objects.
10. **Do not fold `pending` into `error` on the success page.** A `new` or
    `processing` invoice is not a failure; the pending panel is the only
    place the buyer is offered the way back to the same invoice.

---

## What is deliberate, so nobody fixes it

- **The order record is written before the invoice exists**, with
  `status: creating` and no `invoiceId`. A failed create leaves that record;
  every reader treats it as "no order". The webhook repairs a record whose
  attach-write failed by matching `metadata.orderId`.
- **`redirectURL` is literal**, not `{InvoiceId}`/`{OrderId}`. The schema
  documents both placeholders; the order id is known before creation so
  neither is needed, and a literal cannot be mis-expanded.
- **A manually-marked-settled invoice fulfils** (`additionalStatus:
  Marked`, `manuallyMarked: true` on the record). That is how the owner
  delivers to someone who paid late. Dashboard access is fulfilment access;
  the setup doc says so.
- **No refund gate on the Bitcoin download branch.** On-chain money has
  nothing to pull back; a refund is a manual pull payment this key cannot
  see. To close a refunded order, delete `btcpay:order:<ref>` in KV.
- **Polling stops after twelve minutes** (90 × 8 s). Check Again and the
  email cover a slow confirmation. Not a bug.
- **The rate limit is soft** (KV, eventually consistent, per hashed IP). The
  two-permission key bounds the damage to unwanted invoices in the store.
- **The three cards stretch together** when the form opens — the grid
  already equalises row height and `.ks-edition__foot` pins the other two
  buttons to the bottom. Screenshotted at 1440; not a layout fault.
- **The Bitcoin button is a ghost like the card CTA**, no fill, no glyph,
  no colour; the card comment argues the exception to "tier 01 acquires no
  furniture".
- **The email address is asked for on our page**, not on BTCPay's. A BTCPay
  invoice has no buyer field the checkout reliably fills; the address rides
  as `metadata.buyerEmail` and the webhook demands it come back unchanged.
- **`BTCPAY-VALIDATION.md` still reads "Deploy: NO, not yet".** That was
  true when written; its three preconditions were met and the release
  happened the same day. It is a dated record, not a live status — do not
  "fix" it. This handoff is the live status.
- **The `?ks-debug` analytics shim now carries `provider`** on
  `album_package_selected`, `checkout_started`, `purchase_completed`. Still
  no vendor.

---

## Git state

- **`main` and `feature/spine-ui-v2` both at `5d17be6`** ("Add secure BTCPay
  checkout and fulfillment", 12 files, +3,349 −125), pushed. Deploy run
  34220334030 succeeded. This handoff is the next commit on the feature
  branch only; `main` stays at `5d17be6` until the owner says otherwise.
- Worktrees: `kundalini-spines` (main, `5d17be6`), `kundalini-spines-spine-ui`
  (feature, this commit), plus three `.claude/worktrees/*` used by assistant
  sessions — leave them.
- `origin/main` now equals the feature branch minus this handoff. Normal.

---

## Still open

1. **No transmission for Bitcoin checkout going live.** It shipped, a buyer
   can see it, and the owner has used it. `kundalini-transmission` owns the
   filing; a transmission is its own commit and reaching `main` is a deploy,
   so it waits for the owner's word. Suggested line: Bitcoin and Lightning
   accepted for the Digital Edition through BTCPay Server, Sept 8 2026.
2. **Lightning — tomorrow's session (owner's plan).** The code already
   offers every payment method the store enables (`checkout.paymentMethods`
   is not set). What needs doing is on the node and in the store, not in the
   repo: fund/open channels with **inbound** liquidity to receive $20, confirm
   `BTC-LightningNetwork` is enabled on the store, then pay one Lightning
   invoice from the live page. **Watch the webhook deliveries page during
   that test**: Lightning settles within seconds of creation, which is the
   one case where risk 4 below (KV propagation vs a fast settle) could show
   as a first delivery at HTTP 500 `no_record` followed by a successful
   redelivery ten seconds later. That is the designed behaviour, but it has
   never been observed.
3. **Confirm the on-chain test from the server side** — the `InvoiceSettled`
   delivery at 200 in BTCPay, the `ok` in the Function log, the email in the
   inbox. All owner-reported so far.
4. **Stripe items carried from 58/59, unchanged:** no real customer sale has
   gone through the Stripe webhook; async payment branch untested; no
   download-count cap; reissue is manual (now for both providers: delete or
   edit the KV record); Deluxe and Artifact remain `checkoutUrl: null` and
   are not in the Bitcoin `CATALOG` either.
5. **Nothing tests any page's copy against its own state** (58 item 6). This
   session added provider-name slots on the success page so the word
   "Stripe" is no longer hardcoded in two sentences, but the no-JS panel and
   the "What Each One Carries" cards are still static prose.
6. **The installed BTCPay version is unread** (Verified vs. asserted).
7. **The polling window and the manual refund path** are stated limits, not
   bugs; revisit only if a buyer hits one.
8. **`59` item 12 — the WAV package was never re-checked against the studio
   masters.** Still open, still the owner's call.
9. **From `58`: the footer chip border unmeasured; `--df-sky-out-fwd` at
   0.12; the hero decoder stumble.** Untouched this session.

---

## Starting the next V2 chat

Attach this file. `BTCPAY-SETUP.md` §5 and §7 for the store settings and the
end-to-end proof; `59` only for the MP3 package; `58` for the deep field.

> Here's the latest V2 handoff for Kundalini Spines (Spine UI V2 branch). I
> want to test the Lightning payment path this session — the node has
> liquidity now.

The new session needs `C:\Users\Haight\Desktop\kundalini-spines-spine-ui`,
should confirm it is on `feature/spine-ui-v2`, and should run
`python scripts/test-btcpay-functions.py` before touching anything under
`functions/`. **Every push to `main` is a deploy** and happens only on the
owner's word.
