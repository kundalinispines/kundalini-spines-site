# BTCPay checkout — validation record

**Date:** 2026-09-08
**Mode:** read-only validation of the uncommitted BTCPay work. Nothing was
committed, pushed, merged, deployed, or changed in Cloudflare or BTCPay
Server. **One documentation paragraph was corrected during this pass** (§15)
at the owner's instruction; no implementation file was touched.

Every command below was run from the V2 working folder
`C:\Users\Haight\Desktop\kundalini-spines-spine-ui`. Output is verbatim
except that a machine temp path is shortened to `<temp>`. No secret value
appears anywhere in this record; the test fixtures use obviously fake
strings prefixed `TESTKEY-` / `TESTSECRET-`.

---

## 1. Branch and HEAD

```
$ git branch --show-current
feature/spine-ui-v2
$ git rev-parse HEAD
91f0a5ca27a8ce8a3eaa01a0143df67b396778ad
$ git log --oneline -1
91f0a5c Add V2HANDOFF 59
$ git log origin/feature/spine-ui-v2..HEAD --oneline
(empty: nothing committed, nothing unpushed)
$ git stash list | wc -l
0
```

`origin/feature/spine-ui-v2` and `origin/main` both sit at this same commit.
The BTCPay work exists only as working-tree changes.

## 2. `git status --short`

```
 M STRIPE-SETUP.md
 M css/purchase.css
 M functions/api/download.js
 M js/purchase-checkout.js
 M purchase-success.html
 M purchase.html
?? BTCPAY-SETUP.md
?? functions/api/btcpay-create-invoice.js
?? functions/api/btcpay-verify.js
?? functions/api/btcpay-webhook.js
?? scripts/test-btcpay-functions.py
```

## 3. Changed and untracked files

Modified (6):

| File | Change |
|---|---|
| `STRIPE-SETUP.md` | one pointer row in "Where the code is" |
| `css/purchase.css` | styles for the Bitcoin button and email form |
| `functions/api/download.js` | accepts a `ksbtc_` reference in the signed token; Stripe branch wrapped in `else`, re-indented, otherwise unchanged |
| `js/purchase-checkout.js` | §6b Bitcoin client flow; `bindBitcoin` / `startBitcoin` on the public API |
| `purchase-success.html` | branches on `?order=`; fifth `pending` state; provider-name slots; `renderOk()` lifted out unchanged |
| `purchase.html` | Pay with Bitcoin button and email form on the Digital card only |

New (6, counting this record):

| File | Role |
|---|---|
| `functions/api/btcpay-create-invoice.js` | creates the invoice server-side |
| `functions/api/btcpay-webhook.js` | verifies `InvoiceSettled`, sends the download email |
| `functions/api/btcpay-verify.js` | answers the success page |
| `BTCPAY-SETUP.md` | owner's document for the Bitcoin path |
| `scripts/test-btcpay-functions.py` | the test harness |
| `BTCPAY-VALIDATION.md` | this record |

Untouched, confirmed by `git status`: `functions/api/verify.js`,
`functions/api/stripe-webhook.js`, `scripts/stripe-payment-link.sh`,
`purchase-cancelled.html`, `.github/workflows/deploy-cloudflare.yml`.

## 4. `git diff --stat`

```
 STRIPE-SETUP.md           |   1 +
 css/purchase.css          | 102 ++++++++++++++++
 functions/api/download.js | 209 ++++++++++++++++++++++++-------
 js/purchase-checkout.js   | 213 ++++++++++++++++++++++++++++++++
 purchase-success.html     | 306 ++++++++++++++++++++++++++++++++++------------
 purchase.html             |  47 ++++++-
 6 files changed, 753 insertions(+), 125 deletions(-)
```

Ignoring whitespace (`git diff -w --stat`), which removes the download.js
re-indent:

```
 STRIPE-SETUP.md           |   1 +
 css/purchase.css          | 102 +++++++++++++++++++++
 functions/api/download.js | 123 ++++++++++++++++++++++++-
 js/purchase-checkout.js   | 213 +++++++++++++++++++++++++++++++++++++++++++
 purchase-success.html     | 228 +++++++++++++++++++++++++++++++++++++---------
 purchase.html             |  47 +++++++++-
 6 files changed, 671 insertions(+), 43 deletions(-)
```

## 5. `git diff --check`

This repository's `.gitattributes` is `* -text`, and four of the changed
files are CRLF on disk (`download.js`, `purchase-checkout.js`,
`purchase-success.html`, `STRIPE-SETUP.md`). Git's default whitespace rules
count a CR at end of line as trailing blank, so the plain command flags
every added line in those files:

```
$ git diff --check | wc -l
1210
$ git diff --check | grep -c "trailing whitespace"
605          (every one is a CR on a CRLF file)
```

With the CRLF-aware rule, which is the honest check for this repo:

```
$ git -c core.whitespace=cr-at-eol diff --check; echo exit=$?
exit=0
```

New files (LF), checked directly for trailing whitespace and a final newline:

```
BTCPAY-SETUP.md                          trailing-ws-lines=0 final-newline=yes
functions/api/btcpay-create-invoice.js   trailing-ws-lines=0 final-newline=yes
functions/api/btcpay-verify.js           trailing-ws-lines=0 final-newline=yes
functions/api/btcpay-webhook.js          trailing-ws-lines=0 final-newline=yes
scripts/test-btcpay-functions.py         trailing-ws-lines=0 final-newline=yes
```

Line endings after the edits (`git ls-files --eol`): every modified file
keeps the ending it had. `purchase.css` and `purchase.html` stay LF;
`download.js`, `purchase-checkout.js`, `purchase-success.html` and
`STRIPE-SETUP.md` stay CRLF. No whole-file rewrite (the V2HANDOFF 59
`sed -i` failure did not recur).

**Result: PASS.**

## 6. The BTCPay test suite

```
$ python scripts/test-btcpay-functions.py
```

Full output:

```
$ python scripts/test-btcpay-functions.py
  PASS  modules import (syntax valid)
  PASS  create-invoice exports only onRequest
  PASS  create: 200 with checkoutLink + reference only
  PASS  create: tampered amount/currency ignored, catalog price sent
  PASS  create: redirect URL literal, on SITE_ORIGIN, carries order ref
  PASS  create: metadata carries orderId/itemCode/buyerEmail
  PASS  create: reference shape ksbtc_ + 32 hex
  PASS  create: no-store header
  PASS  create: Authorization: token <key> sent to BTCPay only
  PASS  create: KV record written with invoiceId + expectations
  PASS  create: rejects email ""
  PASS  create: rejects email "nope"
  PASS  create: rejects email "a@b"
  PASS  create: rejects email "a b@c.com"
  PASS  create: rejects email "x@y.z\n"
  PASS  create: rejects email "aaaaaaaaaaaaaaaaaaaa"
  PASS  create: rejects email "42"
  PASS  create: no upstream call for bad emails
  PASS  create: unknown product refused
  PASS  create: prototype key refused
  PASS  create: foreign Origin refused 403
  PASS  create: missing Origin refused 403
  PASS  create: cross-site Sec-Fetch-Site refused 403
  PASS  create: no upstream call for bad origins
  PASS  create: form encoding refused 415
  PASS  create: oversize body refused 413
  PASS  create: malformed JSON refused 400
  PASS  create: GET refused 405 with Allow
  PASS  create: still no upstream call
  PASS  create: missing BTCPAY_BASE_URL -> 500 server_misconfigured
  PASS  create: missing BTCPAY_STORE_ID -> 500 server_misconfigured
  PASS  create: missing BTCPAY_API_KEY -> 500 server_misconfigured
  PASS  create: unbound ORDERS -> 500
  PASS  create: http base URL -> 500
  PASS  create: no upstream call when misconfigured
  PASS  create: BTCPay 500 -> 502 upstream, body not echoed
  PASS  create: failed create leaves record with no invoiceId
  PASS  create: BTCPay unreachable -> 502
  PASS  create: checkoutLink on foreign host refused
  PASS  create: invoice echoing wrong amount refused
  PASS  create: invoice for wrong store refused
  PASS  create: 6th+ request in window -> 429
  PASS  create: rate-limit key is hashed, not the IP
  PASS  create: KV down -> 500 storage_error, no invoice created
  PASS  verify: New -> 402 pending/new with checkoutLink
  PASS  verify: Processing -> pending/processing, no link, no token
  PASS  webhook: forged signature -> 400, no email
  PASS  webhook: missing signature -> 400
  PASS  webhook: wrong secret -> 400
  PASS  webhook: signature is over the exact raw body (altered body fails)
  PASS  webhook: still no upstream reads after forgeries
  PASS  webhook: InvoiceCreated -> 200 ignored, no email
  PASS  webhook: InvoiceReceivedPayment -> 200 ignored, no email
  PASS  webhook: InvoiceProcessing -> 200 ignored, no email
  PASS  webhook: InvoicePaymentSettled -> 200 ignored, no email
  PASS  webhook: InvoiceSettled while API says Processing -> not_settled, no email
  PASS  webhook: event for another store -> ignored
  PASS  webhook: invoice without our order id -> ignored
  PASS  webhook: settled event with no record -> 500 for redelivery
  PASS  webhook: settled invoice with wrong amount -> mismatch, no email
  PASS  webhook: settled invoice for wrong store -> mismatch
  PASS  webhook: settled invoice in wrong currency -> mismatch
  PASS  webhook: settled invoice with altered buyer email -> mismatch
  PASS  webhook: settled invoice with altered item -> mismatch
  PASS  webhook: top-up invoice refused
  PASS  webhook: record untouched by mismatches (no settledAt)
  PASS  webhook: Resend failure -> 500 email_failed, record settled, emailedAt null
  PASS  webhook: rescue link logged on send failure, no key in log
  PASS  webhook: settled + matching -> 200 ok, one email, emailedAt set
  PASS  webhook: email to the recorded buyer with the order link
  PASS  webhook: Resend called with Bearer key, BTCPay with token key
  PASS  webhook: record expiresAt = createdTime + 72h
  PASS  webhook: replayed delivery -> already_sent, still one email
  PASS  webhook: exact duplicate body -> already_sent
  PASS  webhook: manually-marked settled fulfils and records the flag
  PASS  webhook: InvoiceExpired noted on record
  PASS  webhook: oversize body -> 413
  PASS  webhook: missing BTCPAY_WEBHOOK_SECRET -> 500 (redelivered later)
  PASS  verify: settled -> ok with token, email, expiresAt, emailed:true
  PASS  verify: response carries nothing but the six fields
  PASS  verify: token = ref.exp.sig
  PASS  verify: Stripe-shaped id refused 400
  PASS  verify: unknown order -> 404
  PASS  verify: Expired -> 410 expired
  PASS  verify: Invalid -> 403 invalid
  PASS  verify: settled but wrong amount -> 403 wrong_product, no token
  PASS  verify: window closed -> 410
  PASS  download: BTCPay token -> 200 zip stream
  PASS  download: same token, WAV format
  PASS  download: forged BTCPay token -> 403
  PASS  download: token signed with another key -> 403
  PASS  download: expired token -> 401
  PASS  download: reference matching neither shape -> 400
  PASS  download: valid token but invoice no longer Settled -> 402
  PASS  download: valid token but amount mismatch -> 403
  PASS  download: BTCPay token with BTCPay unconfigured -> 500, key name not in body
  PASS  stripe: Bearer key sent to Stripe
  PASS  stripe verify: still ok with token
  PASS  stripe: Bearer key sent to Stripe
  PASS  stripe download: cs_ token still streams via the Stripe branch
  PASS  stripe download: no BTCPay call was made for a Stripe token
  PASS  stripe download: refund gate still closes the door
  PASS  stripe download: missing STRIPE_SECRET_KEY still 500 (REQUIRED_ENV intact)
  PASS  hygiene: no secret value in any response body (77 checked)
  PASS  hygiene: no secret value in any log line (29 checked)
  PASS  hygiene: buyer email appears only in the verify answer (0 others)
  PASS  hygiene: Authorization only ever sent to pay.example.test / api.resend.com / api.stripe.com

107 checks, 0 failed, 29 function log lines captured

--- visual pass ---
  card state: {"expanded": "true", "formHidden": false, "focused": true, "fieldH": 48, "submitH": 44, "toggleH": 44, "bg": "rgba(3, 4, 15, 0.62)", "border": "rgba(214, 213, 208, 0.3)", "cardCTAs": 3}
  PASS  form opens, focuses the field, 44px targets, three Stripe CTAs intact
  bad email status: {"hidden": false, "text": "That email address does not look deliverable. Check it and try again \u2014 the download link is sent there."}
  PASS  client-side email refusal, no network
  upstream refusal: {"text": "The Bitcoin payment server could not be reached. Nothing has been charged. Try again in a moment, or pay by card.", "disabled": false, "label": "Continue to Bitcoin Checkout"}
  PASS  server refusal shown, button re-enabled
  in-flight state: {"disabled": true, "busy": "true", "label": "Creating your invoice\u2026"} requests: 1
  PASS  duplicate submission guard (1 request for 2 presses)
  wrote <temp>/btcpay-tests/purchase-btc-open-1440.png
  wrote <temp>/btcpay-tests/purchase-btc-open-390.png
  PASS  no horizontal overflow at 390 (delta 0)
  PASS  success page state pending-new -> {"visible": ["pending"], "provider": ["BTCPay Server", "BTCPay Server"], "ref": null, "pending": "No payment has reached this invoice yet. If you closed the BTCPay page before paying, you can return to the same invoice b
  wrote <temp>/btcpay-tests/success-btc-pending-new.png
  PASS  success page state pending-processing -> {"visible": ["pending"], "provider": ["BTCPay Server", "BTCPay Server"], "ref": null, "pending": "Your payment has been seen on the network and is waiting for confirmation. Lightning usually clears in seconds; an on-chai
  wrote <temp>/btcpay-tests/success-btc-pending-processing.png
  PASS  success page state settled -> {"visible": ["ok"], "provider": ["BTCPay Server", "BTCPay Server"], "ref": "Order reference \u2014 ksbtc_ab12ab12ab12ab12ab12ab12ab12ab12", "pending": "", "resume": null, "mp3": "/api/download?token=ksbtc_ab12ab12ab12ab1
  wrote <temp>/btcpay-tests/success-btc-settled.png
  PASS  success page state expired -> {"visible": ["error"], "provider": ["BTCPay Server", "BTCPay Server"], "ref": null, "pending": "", "resume": null, "mp3": "#", "mail": "This page is your link to the files, and the BTCPay receipt does not contain it \u20
  wrote <temp>/btcpay-tests/success-btc-expired.png
  PASS  success page state invalid -> {"visible": ["error"], "provider": ["BTCPay Server", "BTCPay Server"], "ref": null, "pending": "", "resume": null, "mp3": "#", "mail": "This page is your link to the files, and the BTCPay receipt does not contain it \u20
  wrote <temp>/btcpay-tests/success-btc-invalid.png
  PASS  Stripe success page unchanged -> {"visible": ["ok"], "provider": ["Stripe", "Stripe"], "mail": "This page is your link to the files, and Stripe\u2019s receipt does not contain it \u2014 so keep it.", "mp3": "/api/download?token=cs_te

RESULT: ALL PASSED
exit=0
```

**Totals: 118 PASS lines, 0 FAIL lines. 107 function checks, 0 failed; visual pass 11 checks, 0 failed; 0 page errors. Exit code 0.**

## 7. Other project checks relevant to the changed files

There is no build step and no pre-existing test runner in this repository.
The checks that exist are the deploy workflow's guards; they were dry-run
locally into a temp directory (the repo was not touched):

```
$ (assemble step of .github/workflows/deploy-cloudflare.yml, same PUBLIC list, into mktemp -d)
  published files: 294
  new BTCPay files present in publish dir?
    (none)
  leak guard (same find expression as the workflow): 0 hits
$ root .html classification (every root page published or recognised internal)
  (none unclassified)
$ python -m py_compile scripts/test-btcpay-functions.py
  ok
```

JavaScript syntax of all six Functions is proven by the harness importing
them as ES modules in Chromium (`modules import (syntax valid)` above). The
page-level JS is proven by the visual pass loading `purchase.html` and
`purchase-success.html` with zero console errors or page errors.

`functions/` is never copied by the allowlist; `BTCPAY-SETUP.md` and this
file are caught by the `*.md` guard, and `scripts/` by the `scripts` guard.
None of the new files can reach the published site.

**Result: PASS.**

## 8. Secret-hygiene scan

Scope: every added line of the tracked diff plus every line of the five new
files, 2,767 lines. Patterns: Stripe / Resend / BTCPay key prefixes, wallet
material (`xprv`, `xpub`, `zprv`, `bc1…`, `lnbc…`), `macaroon`, seed
phrase / mnemonic, PEM blocks, long hex or base64 literals, any
key/secret/token/password identifier assigned a quoted literal, and any
`Authorization` header not built from `env.*`.

```
$ secret-hygiene scan (Python): added lines scanned = 2767 (tracked diff 753 + new files 2014)
$ a) credential prefixes / wallet material: 0 hit(s)
$ b) long high-entropy quoted literals (32+ hex / 40+ base64): 5 hit(s)
    [scripts/test-btcpay-functions.py] if (u === BTC + '/api/v1/stores/STORE123/invoices/INVabc123XYZ') return invoiceState ? jsonRes(200, invoiceState) : jsonRes(404, {});
    [scripts/test-btcpay-functions.py] if (u === BTC + '/api/v1/stores/STORE123/invoices/INVabc123XYZ') return jsonRes(200, invoiceState);
    [scripts/test-btcpay-functions.py] script = async (u, init) => u === BTC + '/api/v1/stores/STORE123/invoices/INVabc123XYZ' ? jsonRes(200, markedState) : (u.startsWith('https://api.resend.com/') ?
    [scripts/test-btcpay-functions.py] script = async (u) => u === BTC + '/api/v1/stores/STORE123/invoices/INVabc123XYZ' ? jsonRes(200, invoiceState) : jsonRes(500, {});
    [scripts/test-btcpay-functions.py] script = async (u) => u === BTC + '/api/v1/stores/STORE123/invoices/INVabc123XYZ' ? jsonRes(200, invoiceState) : jsonRes(500, {});
$ c) key/secret/token/password identifier assigned a quoted literal: 5 hit(s)
    [tracked] var qs = '/api/download?token=' + encodeURIComponent(body.token) + '&format=';
    [scripts/test-btcpay-functions.py] let d = await read(await download(req('/api/download?token=' + encodeURIComponent(token) + '&format=mp3'), env));
    [scripts/test-btcpay-functions.py] d = await read(await download(req('/api/download?token=' + encodeURIComponent(token) + '&format=wav'), env));
    [scripts/test-btcpay-functions.py] d = await read(await download(req('/api/download?token=' + encodeURIComponent(sv.json.token) + '&format=mp3'), mkEnv()));
    [scripts/test-btcpay-functions.py] good = good and (seen['mp3'] or '').startswith('/api/download?token=' + order) and 'BTCPay receipt' in (seen['mail'] or '') and order in (seen['ref'] or '')
$ d) Authorization headers built from anything but env.* (test fakes excluded): 0 hit(s)
$ e) environment-variable NAMES present (names only; values never appear):
    BTCPAY_API_KEY               15
    BTCPAY_BASE_URL              17
    BTCPAY_ORDER_RE              2
    BTCPAY_PRICE_DIGITAL_USD     1
    BTCPAY_REQUIRED_ENV          2
    BTCPAY_STORE_ID              17
    BTCPAY_TIMEOUT_MS            2
    BTCPAY_WEBHOOK_SECRET        11
    DOWNLOAD_SIGNING_KEY         6
    DOWNLOAD_WINDOW_HOURS        6
    RESEND_API_KEY               6
    STRIPE_SECRET_KEY            5
    STRIPE_WEBHOOK_SECRET        1
$ f) test fixtures use obviously fake values:
    BTCPAY_API_KEY: 'TESTKEY-apikey-9f3c1a7d',
    BTCPAY_WEBHOOK_SECRET: 'TESTSECRET-whsec-77aa20ef',
    RESEND_API_KEY: 'TESTKEY-resend-31bb44',
    STRIPE_SECRET_KEY: 'TESTKEY-stripe-sk-55cc',
    STRIPE_WEBHOOK_SECRET: 'TESTSECRET-stripe-wh-88dd',
    DOWNLOAD_SIGNING_KEY: 'TESTKEY-signing-42ee99'
$ VERDICT: REVIEW NEEDED
```

The ten flagged lines were read individually: five are the fake invoice
path `/api/v1/stores/STORE123/invoices/INVabc123XYZ` in the test fixtures
(a 40-plus character URL, not a credential), five are the `?token=`
query-string builder for the download link (an identifier name, not a
value). **No credential, key, secret, wallet material, authorization value,
or private environment value is present. Result: CLEAN.**

Additional evidence:

- Every `Authorization` header in `functions/` concatenates an `env.*`
  value: `'token ' + env.BTCPAY_API_KEY` (three BTCPay readers plus the
  download gate), `'Bearer ' + env.RESEND_API_KEY`, and the pre-existing
  `'Bearer ' + env.STRIPE_SECRET_KEY`.
- The only literal `pay.kundalinispines.com` in code is one visible note
  line in `purchase.html`; the base URL is always `env.BTCPAY_BASE_URL`.
- No `.env`, `.dev.vars` or `wrangler.*` file exists tracked, untracked, or
  ignored.
- Error responses carry short codes only; upstream bodies are never echoed
  (`create: BTCPay 500 -> 502 upstream, body not echoed` above). Log lines
  never carry the key; the webhook's rescue line logs the order reference
  and the download URL, not the address.

## 9. Stripe checkout, webhook, verification, and download remain operational

- `functions/api/verify.js` and `functions/api/stripe-webhook.js` are
  unmodified (`git status` shows nothing for them).
- `js/purchase-checkout.js` still carries the live Payment Link on the
  Digital edition (`checkoutUrl: 'https://buy.stripe.com/…'`, line 147) and
  `start()` is unchanged; the Bitcoin path is a separate `startBitcoin()`.
- `functions/api/download.js`: the whitespace-ignoring diff removes exactly
  one line, the old `cs_` regex, replaced by a two-shape check. The whole
  Stripe block (fetch, 404, status/payment_status, refund/dispute gate,
  price id, window) is inside the `else` with no edit.
- Test evidence: `stripe verify: still ok with token`, `stripe download:
  cs_ token still streams via the Stripe branch`, `stripe download: no
  BTCPay call was made for a Stripe token`, `stripe download: refund gate
  still closes the door`, `stripe download: missing STRIPE_SECRET_KEY still
  500 (REQUIRED_ENV intact)`, and `Stripe success page unchanged` (the
  success page renders the identical panel and wording for a `session_id`).
- The Stripe webhook's `HANDLED_EVENTS` are unchanged
  (`checkout.session.completed`, `checkout.session.async_payment_succeeded`).

**Result: PASS. The Stripe path was added beside, not replaced.**

## 10. The browser cannot submit price, currency, store id, redirect URL, or invoice status

- The create endpoint reads exactly two body fields, `body.product`
  (line 238) and `body.email` (line 244). Every other key is never read.
  Test: `create: tampered amount/currency ignored, catalog price sent`. A
  body carrying `amount: "0.01"`, `currency: "EUR"`, `price: 1` produced a
  Greenfield request with `amount: "20.00"`, `currency: "USD"`.
- The client posts `JSON.stringify({ product: edition.id, email: address })`
  (line 790) and nothing else.
- Store id, redirect URL, `redirectAutomatically`, and metadata are built
  server-side from `env.BTCPAY_STORE_ID`, `env.SITE_ORIGIN` and the catalog
  (`create: redirect URL literal, on SITE_ORIGIN, carries order ref`).
- Invoice status is never accepted from the browser: the success page only
  renders what `/api/btcpay-verify` returns, and that endpoint reads the
  status from a live Greenfield GET. A URL with a fabricated order id
  answers `not_found`; a Stripe-shaped id answers 400.
- The success page's download links are written only inside `renderOk()`
  from a server-minted token; a `pending`, `expired`, or `invalid` answer
  leaves them at `#` (visual pass: `mp3: "#"` in those states).

**Result: PASS.**

## 11. Fulfilment only after a server-verified `Settled` invoice, idempotent on replay

- `btcpay-webhook.js`: `event.type !== 'InvoiceSettled'` answers `ignored`
  (line 301); after the signature check and record lookup it fetches the
  invoice and requires `invoice.status === 'Settled'` (line 354) plus store,
  amount, currency, order id, item code, buyer email, and non-TopUp type.
- Tests: `InvoiceCreated / InvoiceReceivedPayment / InvoiceProcessing /
  InvoicePaymentSettled -> 200 ignored, no email`; `InvoiceSettled while API
  says Processing -> not_settled, no email`; wrong amount / store / currency
  / buyer email / item / top-up answer `mismatch`, no email, record
  untouched.
- Idempotency: `record.emailedAt` short-circuits to `already_sent`
  (line 323). Tests: `replayed delivery -> already_sent, still one email`
  and `exact duplicate body -> already_sent`. The record is written before
  the send with `emailedAt: null`, so a failed send is retried by BTCPay
  (`Resend failure -> 500 email_failed, record settled, emailedAt null`).
- The same `Settled` gate is applied independently in `btcpay-verify.js`
  (line 165) and in `download.js` (line 227) on every request.

**Result: PASS.**

## 12. Permissions used

Greenfield paths in the code, from grep:

```
POST /api/v1/stores/{storeId}/invoices                btcpay.store.cancreateinvoice
GET  /api/v1/stores/{storeId}/invoices/{invoiceId}    btcpay.store.canviewinvoices
```

No other Greenfield path, no `PUT` or `DELETE`, no `/status` (mark
invoice), no `/refund`, no wallet, Lightning-node, payout, pull-payment,
server, user or API-key route appears in `functions/`. Resend is called
with its own key on `https://api.resend.com/emails` only; Stripe on
`https://api.stripe.com/v1/checkout/sessions/…` only (pre-existing). Test:
`hygiene: Authorization only ever sent to pay.example.test / api.resend.com
/ api.stripe.com`.

The key the owner created carries exactly `btcpay.store.cancreateinvoice`
and `btcpay.store.canviewinvoices` (owner's statement; not readable from
here). The code needs nothing beyond those two.

**Result: PASS.**

## 13. Absence of `BTCPAY_WEBHOOK_SECRET`

`BTCPAY_WEBHOOK_SECRET` is in the webhook's `REQUIRED_ENV`; a missing value
returns `500 server_misconfigured` before the body is read or parsed, with
the variable **name** in the server log and never in the response. BTCPay
treats a 500 as a failed delivery and redelivers (10 s, 1 min, then up to
six more times), so deliveries made before the secret is set are retried
rather than lost. Test: `webhook: missing BTCPAY_WEBHOOK_SECRET -> 500
(redelivered later)`. The create, verify and download endpoints do not read
the webhook secret and keep working without it; only the email and the
`settled` record depend on it.

**Result: PASS.**

## 14. Failures, skips, mocked-only behaviour, and what still needs a real test

**Failures:** none. **Skipped tests:** none.

**Mocked in the harness (not exercised against real systems):**

- The Greenfield API. Request and response shapes follow the official
  OpenAPI templates read Sept 8 2026; the live instance answered 401 (not
  404) on both routes used, but no real invoice has been created or read.
- `BTCPay-Sig`. The HMAC-SHA256-over-raw-body algorithm is per the schema
  text; it has not been checked against a delivery signed by the real
  server.
- Resend, Stripe, the `ORDERS` KV namespace (the fake ignores
  `expirationTtl` and is strongly consistent), and the R2 binding (the fake
  returns a short string; range handling is the pre-existing shared code).
- The Pages Functions router. `btcpay-create-invoice.js` exports a single
  `onRequest` that dispatches on method; that behaviour on the real router
  is untested here because there is no wrangler on this machine.
- `cf-connecting-ip` for the rate limit, and Cloudflare's own request
  handling.
- Browser navigation to the real BTCPay checkout page, and BTCPay's
  `redirectAutomatically` back to the success page on the installed version.

**Needs a real end-to-end run (BTCPAY-SETUP.md §7):** one invoice created
from the live purchase page, paid from the owner's wallet, redirect
observed, webhook delivery seen as HTTP 200 in the BTCPay dashboard, email
received, redelivery answered `already_sent`, MP3 zip downloaded at 373 MB.

**Unresolved risks:**

1. **The installed BTCPay version was not read** (its swagger needs a
   login). If it predates the current schema, webhook or invoice fields may
   differ; the first real delivery is the check.
2. **KV eventual consistency against a fast Lightning settle.** A settle
   that reaches the webhook before the order record has propagated answers
   500 and is redelivered in ten seconds; after six failed redeliveries the
   order would need manual rescue (the invoice metadata carries the order
   id and buyer email). Not observed; theoretical.
3. **Rate limit is soft** (KV-backed, per hashed IP, 5 per 10 min). The
   two-permission key bounds the damage to unwanted invoices.
4. **No automatic refund path.** A refunded buyer keeps the download for
   the remainder of the 72-hour window unless the owner deletes the KV
   record.
5. **The order reference is a bearer** for the download window, exactly as
   the Stripe session id is.
6. **Polling stops after twelve minutes** on the success page; a slow
   on-chain confirmation relies on the Check Again button or the email.
7. **Manually-marked-settled invoices fulfil** by design; dashboard access
   is fulfilment access.

## 15. The confirmation-policy correction

An earlier draft of `BTCPAY-SETUP.md` §5 step 4 recommended a
zero-confirmation speed policy for on-chain payments. **That recommendation
was wrong and has been replaced** during this validation, the only file
edited this pass, documentation only. The corrected guidance:

- **On-chain: require at least one confirmation** (`MediumSpeed`, 1 conf).
  A zero-confirmation policy would mark the invoice `Settled` and release
  the album on an unconfirmed transaction that can still be replaced or
  double-spent, and a served download cannot be recalled. The cost is some
  minutes on the pending panel; the email carries the link for when it
  clears.
- **Lightning settles immediately** once the merchant node has working
  channels and enough inbound liquidity to receive the amount; no
  confirmation wait applies.

The code is indifferent to the policy: every stage waits for BTCPay's
`Settled` status, so the policy is enforced by the store setting and this
document, not by a constant that could drift.

## 16. Verdict

**Code: validated, safe to commit on the owner's word.** Every check in
this record passed; the Stripe path is intact; no secret is present; the
browser controls nothing it must not.

**Deploy: NO, not yet.** A push to `main` is a deploy, and three
preconditions are unmet:

1. The BTCPay webhook does not exist in the dashboard and
   `BTCPAY_WEBHOOK_SECRET` is not set, so a settled invoice would download
   correctly from the success page but no confirmation email would go out
   and no order record would reach `settled`.
2. The store's on-chain speed policy has not been confirmed at one
   confirmation or more (§15).
3. No real invoice has been raised, paid, redelivered, or downloaded (§14).

Once the webhook is created with the three events, the secret is set, the
speed policy is confirmed, and the §7 end-to-end run passes on a live
invoice, the verdict becomes deploy. Until then the work stays on
`feature/spine-ui-v2`, uncommitted, exactly as it is.
