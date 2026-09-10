# BTCPay Setup — the Bitcoin checkout, what is built, and what you have to do

> Written Sept 8 2026, the day the code landed. Nothing in this document has
> been exercised against the live store yet: the webhook does not exist in the
> BTCPay dashboard, `BTCPAY_WEBHOOK_SECRET` is not set, and no invoice has been
> raised through the site. Section 5 is the order to do those in.
>
> STRIPE-SETUP.md is the card-payment document. This one only covers what is
> different about Bitcoin. The download delivery (R2, the signed token, the
> 72-hour window) and the confirmation email (Resend) are the SAME systems the
> Stripe path uses, and their setup is in that file, not repeated here.

---

## 1. The shape, in one paragraph

A buyer on `purchase.html` presses **Pay with Bitcoin** on the Digital
Edition card, types the email address their download link should go to, and
presses Continue. The browser posts `{ product: "digital", email }` to
`/api/btcpay-create-invoice`, a Cloudflare Pages Function. That function
decides the price ($20 USD, from its own catalog — the browser cannot set
it), writes an order record to the `ORDERS` KV namespace, creates an invoice
through the Greenfield API with the store's restricted key, and returns the
checkout link. The browser navigates to `https://pay.kundalinispines.com/i/…`.
When the invoice **settles**, BTCPay posts an `InvoiceSettled` webhook to
`/api/btcpay-webhook`, which verifies the signature, re-reads the invoice from
the API, checks it against the order record, and emails the download link.
BTCPay also redirects the buyer to `purchase-success.html?order=ksbtc_…`,
where `/api/btcpay-verify` reports settled / pending / expired / invalid and,
when settled, mints the same signed download token the Stripe path uses.
`/api/download` accepts that token, re-verifies the invoice against BTCPay
and the record, and streams the zip out of R2.

Nothing in the browser holds a key, a price, or a file address. The Stripe
path is untouched: same Payment Link, same webhook, same verify, same
download code with one branch added in front of it.

---

## 2. Environment variables — what the code reads

All in the Pages project → Settings → Variables and Secrets, **Production**.
The first three already exist (confirmed by the owner Sept 8 2026).

| Name | What it is | Secret? | Status |
|---|---|---|---|
| `BTCPAY_BASE_URL` | `https://pay.kundalinispines.com` — scheme and host, no path. A trailing slash is tolerated. Must be `https`; the code refuses anything else as misconfigured. | No (text) | **Exists** |
| `BTCPAY_STORE_ID` | The store id from BTCPay → Store settings → General. Used in every API path and compared against every invoice and webhook. | No (text) | **Exists** |
| `BTCPAY_API_KEY` | A Greenfield API key with **exactly** `btcpay.store.cancreateinvoice` and `btcpay.store.canviewinvoices`, scoped to that store. Sent as `Authorization: token …`. | **Yes — Encrypt** | **Exists** |
| `BTCPAY_WEBHOOK_SECRET` | The secret BTCPay shows when the webhook is created (§5). Verifies `BTCPay-Sig`. Without it `/api/btcpay-webhook` answers 500 to everything, which is deliberate: BTCPay keeps retrying, so orders placed before the secret is set are not lost. | **Yes — Encrypt** | **Not yet set — add after §5 step 2** |

Read by the Bitcoin functions and **already provisioned for Stripe** (see
STRIPE-SETUP.md §3): `DOWNLOAD_SIGNING_KEY`, `RESEND_API_KEY`, `SITE_ORIGIN`
(optional), `FROM_EMAIL` / `REPLY_TO_EMAIL` (optional),
`DOWNLOAD_WINDOW_HOURS` (optional), `ALBUM_OBJECT_KEY_MP3` /
`ALBUM_OBJECT_KEY_WAV` (optional). Bindings: `ORDERS` (KV) and `ALBUM_BUCKET`
(R2), both already bound for the Stripe webhook and download.

**No new variable holds a price.** The Digital Edition's $20 is hard-coded in
the `CATALOG` of `functions/api/btcpay-create-invoice.js`, matching the four
existing copies (purchase.html, merch.html, js/purchase-checkout.js,
STRIPE-SETUP.md). A `BTCPAY_PRICE_DIGITAL_USD` variable was considered and
rejected: it would be a sixth place for the number to drift, and a test
purchase does not need a smaller amount — paying your own invoice from your
own wallet costs only the network fee.

**Nothing new is needed in the `_headers` / CSP.** The repository ships no
Content Security Policy today. The Bitcoin path adds one same-origin `fetch`
(already permitted by any `connect-src 'self'`) and one top-level navigation
to `https://pay.kundalinispines.com`, which no CSP directive short of
`navigate-to` governs. If a CSP is ever added, `connect-src 'self'` covers the
API calls and no BTCPay origin needs listing.

---

## 3. The routes

| Route | Method | Who calls it | What it does |
|---|---|---|---|
| `/api/btcpay-create-invoice` | POST, same-origin JSON only | `js/purchase-checkout.js` §6b | Validates origin, content type, size, product, email; rate-limits per client (5 per 10 min, KV-backed, soft); writes the order record; creates the invoice; returns `{ ok, checkoutLink, reference }`. Any other method → 405. |
| `/api/btcpay-webhook` | POST | BTCPay Server | Verifies `BTCPay-Sig` (HMAC-SHA256 of the raw body, hex, constant-time compare); acts only on `InvoiceSettled`; re-reads the invoice; checks store, status, amount, currency, order id, item code, buyer email; writes the record; sends the email; idempotent on `emailedAt`. Notes `InvoiceExpired` / `InvoiceInvalid` on the record. |
| `/api/btcpay-verify` | GET `?order=ksbtc_…` | `purchase-success.html` | Reports `settled` (with token), `pending` (`new` / `processing`, with the checkout link for a `new` invoice), `expired`, `invalid`, `not_found`, `wrong_product`, `window_closed`. |
| `/api/download` | GET `?token=…&format=mp3|wav` | the success page's buttons | Existing route. Accepts a `ksbtc_` reference in the token and gates it on the record + a live BTCPay read; Stripe tokens follow the unchanged Stripe branch. |

Every response carries `cache-control: no-store, private`.

---

## 4. The order record

Key: `btcpay:order:<ksbtc_ reference>` in `ORDERS`. The `btcpay:` prefix
cannot collide with the Stripe records at `order:cs_…`. Rate-limit counters
live at `btcpay:rl:<sha256 of client IP>` with a 10-minute TTL; nothing else
under `btcpay:`.

```
reference, provider:"btcpay", product, itemCode, amount:"20.00", currency:"USD",
email, storeId, invoiceId, invoiceCreatedTime, checkoutLink,
status: creating | created | settled | expired | invalid,
settledAt, expiresAt, manuallyMarked, overPaid, additionalStatus,
emailedAt, recordedAt
```

`emailedAt` is the idempotency flag, exactly as in the Stripe webhook. A
replayed `InvoiceSettled` finds it set and answers `already_sent` without
touching Resend. No TTL: these are business records.

**The record is written before the invoice exists.** A KV failure costs
nothing. An invoice-creation failure leaves `status: creating` with no
`invoiceId`, which every reader treats as "no order".

---

## 5. Provisioning, in order — the owner's part

1. **Confirm the three existing variables** are on the Production environment
   and that `BTCPAY_BASE_URL` has no path after the host.
2. **Create the webhook in BTCPay.** Store → Settings → Webhooks → Create
   Webhook:
   - **Payload URL:** `https://kundalinispines.com/api/btcpay-webhook`
   - **Secret:** let BTCPay generate one, or paste your own long random
     string. **Copy it once, into `BTCPAY_WEBHOOK_SECRET` (Encrypt) on the
     Pages project.** Do not put it anywhere else.
   - **Automatic redelivery:** on.
   - **Events:** choose *Send specific events* and tick exactly:
     - `InvoiceSettled` — the only event that fulfils
     - `InvoiceExpired` — noted on the record, nothing sent
     - `InvoiceInvalid` — noted on the record, nothing sent

     Do **not** tick *Send all events*: the endpoint would answer 200 to the
     rest anyway, but every delivery is a request to the site and a line in
     the store's delivery log for no purpose.
3. **Set `BTCPAY_WEBHOOK_SECRET`**, then **release to `main`** on your word
   (a push to `main` deploys). Until this deploy, the Bitcoin button on the
   live site does not exist — the code is on the feature branch only.
4. **Store settings to check** (BTCPay → Store → Checkout experience):
   - The **redirect** is set per invoice by the code
     (`redirectAutomatically: true`, `redirectURL` = the success page with
     the order reference), so the store's default does not matter. Nothing
     to change.
   - **Invoice expiration** (default 15 min) and **payment tolerance**
     (default 0%) are inherited from the store. Leave tolerance at 0: the
     webhook compares the invoice's `amount` to the record's, not the amount
     paid, so tolerance only decides whether BTCPay calls it settled.
   - **Speed policy** decides when on-chain payments count as settled.
     **Set it to at least one confirmation** (`MediumSpeed`, 1 conf) for
     on-chain payments. A zero-confirmation policy would mark the invoice
     `Settled` and release the album the moment an unconfirmed transaction
     appeared in the mempool, and an unconfirmed transaction can be replaced
     or double-spent; a digital download cannot be taken back once served.
     Confirmed on the live store Sept 10 2026 from the BTCPay database itself
     (`SpeedPolicy = 1`, "MediumSpeed — 1 confirmation"), not the dashboard.
     One confirmation costs the buyer some minutes of waiting on the pending
     panel, and the email carries the link for when it clears. (Corrected
     Sept 8 2026 — an earlier draft of this line recommended zero
     confirmations; do not follow it.) **Lightning is separate:** a Lightning
     payment is final when it arrives and settles immediately, once your node
     has working channels and enough inbound liquidity to receive $20. The
     code does not care which policy you choose; it waits for `Settled`
     either way.
5. **Prove it end to end (§7)** with one real invoice paid from your own
   wallet.

---

## 6. What the Greenfield schema says, and what was relied on

Read Sept 8 2026 from the official OpenAPI templates
(`swagger.template.invoices.json`, `swagger.template.webhooks.json`, master).
The live instance's own `/swagger/v1/swagger.json` needs a login; the owner
can open `https://pay.kundalinispines.com/docs` after signing in to confirm
the installed version matches. Both route shapes probed below existed on the
live instance (401 with no key, not 404).

- **Create:** `POST /api/v1/stores/{storeId}/invoices` with `amount` (decimal
  string), `currency`, `metadata` (free JSON; `orderId`, `itemCode`,
  `itemDesc`, `buyerEmail` are BTCPay's own well-known keys), `checkout:
  { redirectURL, redirectAutomatically }`, `additionalSearchTerms`. Needs
  `btcpay.store.cancreateinvoice`.
- **Read:** `GET /api/v1/stores/{storeId}/invoices/{invoiceId}` (store-scoped
  on purpose; the un-scoped `/api/v1/invoices/{id}` also exists). Needs
  `btcpay.store.canviewinvoices`. Fields used: `id`, `storeId`, `amount`,
  `currency`, `type` (`Standard` | `TopUp`), `status`, `additionalStatus`,
  `createdTime`, `metadata`, `checkoutLink`.
- **Status enum:** `New`, `Processing`, `Expired`, `Invalid`, `Settled`.
  Only `Settled` fulfils. `additionalStatus` (`None`, `PaidLate`,
  `PaidPartial`, `Marked`, `Invalid`, `PaidOver`) is recorded, not gated on:
  a `Settled` + `Marked` invoice is one you settled by hand in the dashboard,
  and it fulfils.
- **Redirect placeholders:** the schema documents `{InvoiceId}` and
  `{OrderId}` in `redirectURL`. **Neither is used.** The order reference is
  known before the invoice is created, so the literal URL is sent.
- **Webhook signature:** header `BTCPay-Sig: sha256=<hex>`, HMAC-SHA256 of
  the raw request body with the webhook secret, GitHub-style. No timestamp,
  so no tolerance window; replay protection is the idempotency record.
- **Webhook events:** `InvoiceCreated`, `InvoiceReceivedPayment`,
  `InvoiceProcessing`, `InvoiceExpired`, `InvoiceSettled`, `InvoiceInvalid`,
  `InvoicePaymentSettled`. `InvoiceSettled` carries `manuallyMarked` and
  `overPaid`; every invoice event carries `storeId`, `invoiceId`, `metadata`.
- **Redelivery:** with automatic redelivery on, a non-2xx is retried after
  10 s, 1 min, and then up to six times ten minutes apart. The webhook
  answers 500 for "not ready" (missing secret, KV not yet consistent, Resend
  down) and 200 for "will never change" (not our store, not our event,
  mismatch), for the same reasons the Stripe webhook does.

---

## 7. Proving it works — the first real invoice

Paying your own store from your own wallet moves nothing but a network fee.

1. On the live `purchase.html`, press **Pay with Bitcoin**, enter an address
   you can read, Continue. You should land on `pay.kundalinispines.com/i/…`
   showing **$20.00** and the item description *Rise Up — Digital Album*.
2. In the BTCPay dashboard, open that invoice: metadata should show
   `orderId: ksbtc_…`, `itemCode: rise-up:digital`, `buyerEmail`.
3. Close the tab WITHOUT paying, and open
   `https://kundalinispines.com/purchase-success?order=<that ksbtc_ id>`.
   Expect the **pending** panel with *Return to the Bitcoin Invoice*.
4. Pay it (Lightning is fastest). BTCPay should redirect you to the success
   page; expect *Confirming your payment with BTCPay Server…*, then either
   pending/processing (on-chain, waiting on your speed policy) or the
   confirmed panel with the two download buttons.
5. Check the inbox: *Your download — Kundalini Spines, Rise Up*, from
   `orders@kundalinispines.com`, link to the same `?order=` URL.
6. In BTCPay → Webhooks → your webhook → *Recent deliveries*: `InvoiceSettled`
   with HTTP 200. Redeliver it by hand: expect 200 again and **no second
   email**.
7. Download the MP3 zip; the file should be the 373 MB package.
8. Let the download window pass (or set `DOWNLOAD_WINDOW_HOURS` low on a
   preview) and confirm the page reports *window closed*.

---

## 8. Tests

`scripts/test-btcpay-functions.py` drives the four Functions inside a real
Chromium (Playwright, Python) against mocked BTCPay / Resend / Stripe / KV /
R2, because this box has no Node and the Functions only need Web APIs. It
covers price tampering, bad email, bad origin, missing environment, upstream
failure, forged signature, replay, wrong store, wrong amount, non-settled
invoice, idempotent fulfilment, the Stripe download branch, and a secret
hygiene sweep over every response and log line. Run it with the site served:

```
python scripts/test-btcpay-functions.py
```

It starts its own `scripts/serve.py` on a free port and writes screenshots
of the purchase card and the success page's Bitcoin states into a folder it
prints.

---

## 9. What this does NOT protect against, stated plainly

- **A refund has no automatic path.** Bitcoin cannot be pulled back. If you
  ever refund a buyer by a pull payment, the order record still reads
  `settled` and the download stays open for the rest of the window. Close it
  by deleting `btcpay:order:<ref>` from the KV namespace in the dashboard.
- **The rate limit is soft.** KV is eventually consistent; the 5-per-10-minute
  ceiling stops a loop, not a distributed attempt. The API key's two
  permissions bound the damage to unwanted invoices in the store.
- **The reference is a bearer, like the Stripe session id.** Whoever holds
  the success URL or the email holds the download for the window. Same
  tradeoff as STRIPE-SETUP.md §8, same 72-hour bound.
- **A settled-by-hand invoice fulfils.** That is a feature — it is how you
  deliver to someone who paid late — but it means dashboard access is
  fulfilment access.
- **The live BTCPay version: v2.4.4** (`2d5a0d8077bb`), read by the owner from
  Server Settings → About on Sept 10 2026 — the same release the schema above
  was read against, so the Greenfield shapes this code follows are the
  installed ones. Confirmed by the first real delivery: the owner pasted the
  `InvoiceSettled` delivery for the Lightning sale (invoice
  `9ZBsQf18yuFCy8XGWxcsN4`, delivery `SyTUdMP5UXGzGjS3bUutdu`, not a
  redelivery) and its `type`, `invoiceId` and `metadata` were exactly the
  fields the webhook handler reads; 91 s from invoice creation to the
  settled event.
