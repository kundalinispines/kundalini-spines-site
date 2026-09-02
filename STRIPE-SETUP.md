# Stripe Setup — what is built, what is not, and what you have to do

Written Aug 20 2026, during the purchase rough-in.

> **This opening is out of date and is kept for the record.** It said: "Nothing
> on this site can take money today, and nothing in this repo pretends it can.
> No Stripe account is connected, no price IDs exist, no payment links exist,
> and no payment has ever been processed." A live Stripe account, a live
> Payment Link, and the R2-backed download all exist as of Aug 31 2026.

**Where it actually stands.** The purchase page, the checkout interface and the
two return pages are built and live. Payment verification and the album
download run server-side in `functions/api/` (§3). **The Digital Edition's buy
button still points at the TEST Payment Link, so no real money can move yet** —
swapping it is one line and is deliberately the last step of §3a. This document
is the list of what has to happen for that swap to be safe, written for you
rather than for a developer.

Read the first section before anything else. It is the reason the rest of the
document is shaped the way it is, and it is a decision only you can make.

---

## 1. The blocking fact: this site has no server

> **SUPERSEDED Aug 31 2026, and twice over.** Two of this section's load-bearing
> claims are now false, and it is kept because the reasoning downstream of it
> still explains why the design is shaped as it is.
>
> - **"deployed to GitHub Pages from the `main` branch"** — retired Aug 30 2026.
>   The site is on **Cloudflare Pages**, direct upload from CI. A GitHub-Pages
>   sweep of this whole document is still outstanding (§6); this paragraph is
>   one of the places that needs it.
> - **"no server that runs code, and no environment-variable mechanism"** — no
>   longer true as of Aug 31 2026. `functions/api/verify.js` and
>   `functions/api/download.js` are Cloudflare Pages Functions and they run on
>   every purchase. The static-site constraint that drove option (a) below was
>   real and the reasoning is worth keeping, but **the blocking fact is no
>   longer blocking.** §3 documents what exists; the option (b) discussion
>   below is what got built.

Kundalini Spines is a **static site** for everything a visitor reads. Plain HTML,
CSS and JavaScript, no build step, no npm, no framework — and, until Aug 31 2026,
no server that runs code and no environment-variable mechanism anywhere in the
project.

Stripe has two kinds of credential:

| | Where it may live | What it does |
|---|---|---|
| **Publishable key** (`pk_...`) | Safe in public code | Identifies your account. Can't move money on its own. |
| **Secret key** (`sk_...`) | **Server only. Never public.** | Full control of your Stripe account. |

A *Checkout Session* — the thing that carries custom metadata, line items and a
success URL — is created **with the secret key**, which means it is created **on
a server**. There is no server here. Anyone who tries to solve that by putting
the secret key into a JavaScript file has published it: every file in this repo
is fetched verbatim by every visitor, and GitHub Pages serves the whole
repository.

> **Never put a Stripe secret key, a webhook signing secret, or any other private
> credential into this repository.** Not in a JS file, not in an HTML comment,
> not in a "hidden" config file, not in a commit that gets reverted afterwards —
> git keeps it. If one is ever pasted in by accident, roll it in the Stripe
> Dashboard immediately; deleting the file is not enough.

So there are exactly two honest ways forward.

### Option (a) — Stripe Payment Links. Works on this host, today.

You create a Payment Link in the Stripe Dashboard. Stripe gives you a URL that
looks like `https://buy.stripe.com/xxxxxxxx`. That URL goes into the config in
`js/purchase-checkout.js` and the buttons start working. No server, no keys in
the repo, no deployment change.

**What you get:** working payment, hosted by Stripe, on the site as it exists.

**What you give up:**

- **Metadata is limited.** The site cannot attach arbitrary information to the
  order from the browser. That means the apparel **size and variant** for the
  physical editions cannot be passed through cleanly — a Payment Link can't
  receive data the buyer's browser chose. Workarounds exist (a separate link per
  size; Stripe's own custom fields on the link), and both mean more Dashboard
  objects to maintain, one per combination.
- **Fulfilment is manual.** Stripe will email you about each order. Sending the
  album, issuing a download link, numbering an Artifact edition — all of that is
  you, by hand, per order.
- **No automated secure download.** Stripe can attach a file to a Payment Link
  confirmation, but it is not an expiring, per-buyer link. For a small run that
  may be acceptable; decide it deliberately rather than by default.

### Option (b) — add a small serverless backend.

Netlify Functions, Vercel Functions, or Cloudflare Workers. All three have free
tiers that comfortably cover a site at this traffic level, and all three can host
the static site as well, so GitHub Pages would be retired rather than added to.

**What you get:** the real thing. Checkout Sessions with full metadata, the
`checkout.session.completed` webhook, automated secure expiring download links,
automated confirmation email, variant/size capture, limited-edition numbering.

**What it costs:** a deployment change (the site stops being served from GitHub
Pages), a place to store the secret keys as environment variables, and actual
backend code that does not exist yet — see section 6.

### The recommendation for this stage

**Option (a), Payment Links, for the rough-in — and start with the Digital
Edition only.**

The reasoning: the Digital Edition is the one where a Payment Link's limits cost
you almost nothing (no size, no variant, no shipping), so it is the one that can
go live soonest and prove the whole path end to end — button, hosted checkout,
return page — with real money and no backend. The Deluxe and Artifact editions
are the ones that genuinely need option (b), because they need size, variant and
numbering, and they are the two that are furthest from being ready to ship
anyway.

Do not build option (b) speculatively. Build it when a physical edition is
actually about to be sold.

---

## 2. What you create in the Stripe Dashboard

Do this in **Test mode** first. The toggle is at the top right of the Dashboard.
Test mode has its own keys, its own products and its own links, and card number
`4242 4242 4242 4242` with any future expiry works there.

Create **one Product per edition**, each with **one Price**:

| Edition | Product name | Price | Type | Notes |
|---|---|---|---|---|
| 01 | `Rise Up — Digital Edition` | **$20** | One-time | No shipping. |
| 02 | `Rise Up — Deluxe Edition` | **$42** | One-time | Collect shipping address if anything physical is in it. |
| 03 | `Rise Up — Artifact Edition` | **$75** floor | One-time | Collect shipping address. Limited run — see section 6. |

### The prices are set — $20 / $42 / from $75

**The owner set these on Aug 27 2026.** They are no longer placeholders and no
longer yours to invent: Digital **$20** as the base, with Deluxe **$42** and
Artifact **from $75** scaled off it so the ladder kept the shape it had at
12 / 25 / 45.

Everything before that date was scratch. The only price this project ever
carried on its own was a hardcoded `$1` per-track download in
`js/track-experience.js`, removed on Aug 20 2026 and never a working link. This
section itself went on quoting a **$12 / $35 / $150** set for a week after no
file carried it — which is the whole reason for the warning below.

### The price lives in four files, and only one of them is guarded

Change all four in the same edit:

1. `js/purchase-checkout.js` — the `EDITIONS` array at the top. **The source
   of truth.**
2. `purchase.html` — the prices printed on the three cards. **Guarded.**
3. `merch.html` — the same three prices printed again on the album section.
   **Not guarded, by anything.**
4. This document — the table above.

They drift apart silently, because the HTML prints its prices as fixed text.
There is a guard in `js/purchase-checkout.js` that warns in the browser console
when `purchase.html` disagrees with the config, but it only warns; it will not
fix it, and nobody sees a console warning on a live site.

**The guard cannot see `merch.html` at all.** That page carries no
`data-ks-price` and does not load the purchase module, so its three prices are
checked by nothing. On Aug 27 2026 they were found still reading the old
12 / 25 / 45 — caught by grepping for the digits, not by any tooling. Adding
`data-ks-price` there would not help; the guard is in a module that page never
loads. Grep before you trust:

```
grep -rn "[$][0-9]" purchase.html merch.html js/purchase-checkout.js STRIPE-SETUP.md
```

### For option (a): there is a wizard, and it is the shorter path

**Run `scripts/stripe-payment-link.sh`.** It walks you through Test mode, the
product, the $20 price and the Payment Link, then writes the resulting URL into
`js/purchase-checkout.js` itself and runs the test-card checklist with you:

```
bash scripts/stripe-payment-link.sh
```

It only ever asks you for the public `buy.stripe.com` URL. It never asks for a
key, writes no `.env`, and sets no GitHub secret — because Payment Links need
none of those here. If a step ever seems to want an `sk_` or `whsec_` value, you
are on the wrong path; stop and re-read section 1.

**It deliberately tells you NOT to set a redirect.** See section 4 — the return
pages are not deployed, so a redirect today would 404 a paying customer.

### Doing it by hand instead

Products — the product — **Create payment link**. On each link set:

- **After payment → Redirect to a page**, with your success URL (section 4).
- **Collect customer's address** — on for anything physical, off for Digital.
- **Limit the number of payments** — this is where a limited run gets capped for
  the Artifact edition.

Then paste each link URL into `js/purchase-checkout.js`:

```js
{
  id: 'digital',
  ...
  checkoutUrl: 'https://buy.stripe.com/your-real-link-here'
}
```

`checkoutUrl: null` is what makes a button say "purchasing is not open yet"
instead of navigating. Leave it `null` on any edition that is not actually
buyable. **Never put `'#'` or `''` there** — that sends a buyer to a dead page.

The Artifact edition additionally has `status: 'coming-soon'`, which refuses the
purchase before it ever looks at the URL. Change `status` to `'available'` in the
same edit that gives it a link, or the link will be ignored.

---

## 3. Environment variables — the set the code actually reads

> **This section changed on Aug 31 2026 and the change is not cosmetic.** It used
> to open "This repo has no environment-variable mechanism today. There is no
> `.env`, no build step to read one, and no runtime to inject one," and the table
> under it was a shopping list for a backend nobody had written. **There is a
> runtime now** — `functions/api/verify.js` and `functions/api/download.js`,
> Cloudflare Pages Functions, deployed by the same workflow that ships the site.
> The table below is no longer a wish. Every name in it is read by name in the
> code, and a missing one produces a 500 with `server_misconfigured`, not a
> silent fallback.

Set these in the Cloudflare dashboard: **Workers & Pages → kundalini-spines →
Settings → Variables and Secrets → Add**. Each row has a **Type** dropdown
reading **Text** or **Secret**; set it to Secret for the two secret ones
*before* pasting the value. A Secret cannot be read back out of the dashboard
afterwards — that is the point, and it also means a typo in one is invisible.
If `/api/verify` later answers `server_misconfigured`, re-enter rather than
trying to inspect.

> **Dashboard paths corrected Aug 31 2026, on the first real run.** This said
> *Settings → Environment variables*, and the R2 binding step said *Settings →
> Functions → R2 bucket bindings*. Cloudflare has retired both: there is no
> **Functions** section any more, bindings are at **Settings → Bindings**, and
> variables and secrets share one screen at **Settings → Variables and
> Secrets**, where a per-row **Type** dropdown (Text / Secret) has replaced the
> old **Encrypt** button. Expect these labels to drift again — when they do, trust the
> product over this document. **Never in this repo**, and never in a variable
whose name lacks the encryption; the deploy workflow's leak guard greps the
diff for `sk_`/`whsec_` but it cannot see the Cloudflare dashboard.

| Name | What it is | Secret? |
|---|---|---|
| `STRIPE_SECRET_KEY` | `sk_live_...` / `sk_test_...`. Reads Checkout Sessions to confirm payment. | **Yes — Encrypt** |
| `DOWNLOAD_SIGNING_KEY` | HMAC key signing the short-lived download token. Any long random string; 32+ bytes. Rotating it invalidates outstanding download tokens and nothing else — buyers just re-verify. | **Yes — Encrypt** |
| `PRICE_ID_DIGITAL` | `price_...` for edition 01. Checked against the session's line items so that a paid order for something else cannot unlock the album. | No, but keep it out of the repo |
| `ALBUM_OBJECT_KEY_MP3` | Key of the MP3 zip. Optional; defaults to `KundaliniSpines_RiseUp_MP3.zip`. | No |
| `ALBUM_OBJECT_KEY_WAV` | Key of the WAV zip. Optional; defaults to `KundaliniSpines_RiseUp_WAV.zip`. | No |
| `DOWNLOAD_WINDOW_HOURS` | How long after purchase the download stays open. Optional; defaults to `72`. | No |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...`, from the event destination's page in the Stripe Dashboard. The only thing separating a real Stripe delivery from a stranger's POST. It is **not** shown only once — the destination page has an eye icon that reveals it and a circular arrow that rolls it, so a lost copy is re-readable rather than fatal. | **Yes — Secret** |
| `RESEND_API_KEY` | `re_...`. Sends the confirmation email. | **Yes — Secret** |
| `SITE_ORIGIN` | Origin used to build the download link in the email. Optional; defaults to `https://kundalinispines.com`. Only set it if that stops being the public address. | No |
| `FROM_EMAIL` | Sender of the confirmation email. Optional; defaults to `Kundalini Spines <orders@kundalinispines.com>`. **Must be on a domain verified in Resend** — gmail.com cannot be. | No |
| `REPLY_TO_EMAIL` | Where a buyer's reply lands. Optional; defaults to `kundalinispines@gmail.com`. | No |

**Plus TWO bindings, each a separate step, and between them the thing most
likely to be forgotten.** Bindings are not variables and do not appear on the
Variables and Secrets screen:

- Settings → **Bindings** → **Add** → **R2 bucket** → variable name
  **`ALBUM_BUCKET`**, bound to the private bucket holding the two ZIPs (the
  booklet is inside each of them, not a third object). `/api/download` checks
  for it separately and logs `R2 binding
  ALBUM_BUCKET is not bound` when it is missing, precisely because this is the
  step people skip.
- Settings → **Bindings** → **Add** → **KV namespace** → variable name
  **`ORDERS`**, bound to a namespace created under Storage & Databases → KV
  (any name; `kundalini-spines-orders` is the obvious one). `/api/stripe-webhook`
  refuses to run without it and logs `KV binding ORDERS is not bound`.
  `/api/verify` reads it too, but **soft-fails on purpose**: without it,
  downloads keep working and the success page simply falls back to its
  stricter "this page is the only link" wording.

**Not needed yet, and deliberately absent from the code:**
`STRIPE_PUBLISHABLE_KEY` (nothing client-side talks to Stripe; the buy button
is a plain link to a Payment Link) and `PRICE_ID_DELUXE` / `PRICE_ID_ARTIFACT`
(nothing verifies those editions because nothing delivers them automatically).
Do not add them speculatively — an unused secret is a liability with no
offsetting benefit.

> **`STRIPE_WEBHOOK_SECRET` and `EMAIL_API_KEY` were on that list until Sept 1
> 2026.** The first is now required and named above. The second never arrived
> under that name: the sender is Resend and the variable is `RESEND_API_KEY`.
> If you are reading an older copy of this file, that is the discrepancy.

---

## 3a. Provisioning, in the order it has to happen

None of this can be done from a code session — it is dashboard and CLI work on
the owner's account, and the site cannot verify a payment until all of it is
done. **Until every step here is complete, leave the Digital edition on the test
Payment Link.** A live link in front of an unprovisioned backend takes real money
and hands back an error panel.

1. **Create the R2 bucket.** R2 → Create bucket, e.g. `kundalini-spines-album`.
   **Do not enable a public r2.dev URL and do not attach a custom domain to it.**
   A public bucket URL is exactly the unsigned, unrevocable address §5 of
   `js/purchase-checkout.js` has forbidden since Aug 20. The binding is the only
   access path this design wants.
2. **Upload BOTH album ZIPs** into that bucket, under their existing names —
   `KundaliniSpines_RiseUp_MP3.zip` and `KundaliniSpines_RiseUp_WAV.zip`. Do
   not rename them; the code defaults to exactly these, so leaving them alone
   means nothing to configure.

   **The dashboard cannot take the WAV.** A browser upload is a single PUT,
   and at ~1,395 MB the WAV set is past what that carries; the 373 MB MP3 goes
   through fine. This is a limit of the upload *method*, not of R2, which
   holds objects up to 5 TB. Large files need a multipart upload, and
   Cloudflare's own recommendation is **rclone** — a single Windows `.exe`,
   no Node, no npm, no installer, and it splits and resumes automatically.
   `wrangler r2 object put` is *not* the way round it: it caps at 315 MB and
   would need Node anyway. `scripts/r2-album-download.sh` stages 3 and 4 walk
   the whole thing, R2 API token included.
3. **Create the live product and price** — $20 USD, one-time — and copy the
   `price_...` id into `PRICE_ID_DIGITAL`. §2 covers the Dashboard steps.
4. **Set the environment variables and the R2 binding** per the table above.
5. **Set the Payment Link's redirect** to
   `https://kundalinispines.com/purchase-success?session_id={CHECKOUT_SESSION_ID}`
   (§4 has the exact Dashboard labels). Without the `session_id` token the
   success page has nothing to verify and every buyer sees the
   "opened without an order reference" panel.
6. **Deploy**, then **swap the checkout URL** in `js/purchase-checkout.js` —
   one line, `EDITIONS[0].checkoutUrl`. This is the step that opens real sales
   and it is deliberately last.

### The first deploy is the test of the Functions wiring

This repo has never deployed a Pages Function before, and the owner's machine
has no Node, so `wrangler` cannot be run locally to rehearse it. The first CI
run is the rehearsal. **This is a loud failure, not a silent one:** if
Cloudflare does not pick up `functions/`, `/api/verify` returns the SPA-less
404 of a missing static file and the success page shows its retry panel. It
cannot fail by quietly serving the album to the wrong person. If it does 404,
check that `functions/` is at the repo root — Cloudflare requires it there, not
inside the build output — and that the deploy step's working directory is the
repo root, which it is today.

---

## 4. The return URLs

> **CORRECTED AGAIN, Aug 31 2026 — the pages ARE live now. Set the redirect.**
> The Aug 27 warning below was true when the site was GitHub Pages built from
> `main`. Two things changed since: the site deploys to **Cloudflare Pages**
> (Aug 30), and `main` now carries the whole purchase surface — all three pages
> sit in the deploy allowlist in `.github/workflows/deploy-cloudflare.yml`,
> added Aug 28.
>
> Measured against the live domain, Aug 31 2026:
>
> ```
> curl -sIL -o /dev/null -w "%{http_code} %{url_effective}\n" \
>   "https://kundalinispines.com/purchase-success.html?session_id=cs_test_123"
> → 200 https://kundalinispines.com/purchase-success?session_id=cs_test_123
> ```
>
> Two things that readout proves, both of which matter here: Cloudflare Pages
> answers the `.html` name with a **308 to the extensionless path**, and it
> **carries the query string through the hop** — so Stripe's
> `{CHECKOUT_SESSION_ID}` token survives either form. **Give Stripe the clean
> URL anyway** (no `.html`), so a paying customer does not spend a redirect on
> the way to their own receipt.
>
> The `null` in `checkoutUrl` for Deluxe and Artifact still stands, but for
> section 6's reason now — nothing fulfils an order — not because a redirect
> would 404.

> **The Aug 27 2026 warning, kept for the record.** It said: these pages are
> BUILT but NOT LIVE; `.github/workflows/deploy-pages.yml` builds GitHub Pages
> from `main`, and `main` contains no `purchase.html`, no
> `purchase-success.html`, no `purchase-cancelled.html` and no `merch.html` —
> the entire purchase surface exists only on `feature/spine-ui-v2`, 169 commits
> ahead of it. So do not set a Payment Link redirect yet; a paying customer
> would land on a 404, arriving through the Dashboard where no code guard can
> see it. **Its conclusion no longer applies** — but its reasoning is why this
> section now measures the live URL instead of asserting it. This document has
> been wrong about deployment twice; measure before you trust it a third time.

Two pages are built, and live since Aug 30 2026:

- `https://kundalinispines.com/purchase-success`
- `https://kundalinispines.com/purchase-cancelled`

Both are branded to the site — the site's nav, footer, starfield and type, not a
generic Stripe confirmation. Both are marked `noindex` so a confirmation page
never turns up in a search result.

For a Payment Link, the success URL goes in **After the payment** — **Confirmation
page** — the redirect option. (Those are the labels as of Aug 27 2026, taken from
docs.stripe.com; the older "After payment — Redirect" wording in earlier drafts of
this document was wrong.) To get the order reference to display, append Stripe's
token:

```
https://kundalinispines.com/purchase-success?session_id={CHECKOUT_SESSION_ID}
```

Stripe substitutes that literal token for the real Session ID. The success page
prints it as an order reference if it is present, and shows nothing if it is not.

### A tradeoff to be aware of: flat files, not `/purchase/success`

The routes originally sketched were `/purchase/success` and
`/purchase/cancelled`. GitHub Pages serves flat files from the repo root and this
project has no router, so a path like `/purchase/success` would have to be a real
directory (`purchase/success/index.html`), its canonical URL would carry a
trailing slash, and every relative asset path inside it would need `../../`
prefixes that nothing else in this repo uses.

Flat files at the root — `purchase-success.html`, `purchase-cancelled.html` — are
the shape the rest of the site already uses (`merch.html`, `archive.html`,
`transmissions.html`). Since the return URL is a full URL typed into a Stripe
field, the prettier path buys nothing today. If the site ever moves to a host
with rewrite rules (option (b) would give you that), the pretty paths can be
added as redirects without moving these files.

---

## 5. The webhook, and why it is the authority

> **BUILT, Sept 1 2026.** This section described something planned until today.
> It is now `functions/api/stripe-webhook.js`, and the line that used to open
> it — "Required for option (b). Not available under option (a)." — was wrong
> in a way worth naming: the site runs on Payment Links, which this file calls
> option (a), and the webhook works fine with them. `checkout.session.completed`
> fires for a Payment Link checkout exactly as it does for a bespoke one.

Endpoint: `POST https://kundalinispines.com/api/stripe-webhook`
Events to subscribe to: **`checkout.session.completed`** and
**`checkout.session.async_payment_succeeded`**.

**Why the second event as well.** For a card, the first fires the moment the
money settles. For an asynchronous method it fires with `payment_status` still
`unpaid`, and the money lands later under the second. Subscribing only to the
first would email nothing to exactly the buyers who waited longest. The handler
answers `200 not_paid_yet` to the premature one and does the work when the
second arrives.

### What it does, in order

1. Verifies the `Stripe-Signature` header before reading anything else — HMAC
   SHA-256 over `timestamp.rawBody`, inside a five-minute tolerance, accepting
   **any** of the `v1` values so a secret rotation does not break deliveries.
2. Re-asks Stripe about the session with `expand[]=line_items`, because the
   Session inside the event carries no line items and "is this the Digital
   Edition" cannot be answered without them.
3. Writes an order record to KV **before** sending, so a sale leaves a trace
   even if the mail fails.
4. Sends the confirmation email through Resend.
5. Stamps `emailedAt` on the record. A redelivery of the same event sees the
   stamp and returns `already_sent` without sending twice.

### Setting it up

> **There is a wizard, and it is the shorter path.** From the repo root:
>
> ```bash
> bash scripts/email-webhook-setup.sh
> ```
>
> Eight stages: it opens each dashboard page, says exactly what to click, and
> then **probes the live endpoints to prove the result** rather than trusting
> it. It captures nothing — every secret goes into Cloudflare by hand, because
> this repo is public and §3's rule is absolute. Safe to Ctrl-C and re-run;
> every stage can be skipped if it is already done. The steps below are the
> same procedure written out, for reading rather than running.

1. **Resend:** create the account, add the DNS records it gives you for
   `kundalinispines.com` (they go in Cloudflare DNS), then create an API key
   and paste it as `RESEND_API_KEY` (Secret). Until the domain verifies,
   sending fails with a 422 and the webhook answers 500 — which Stripe retries,
   so orders placed during setup are not lost.
2. **KV:** Storage & Databases → KV → create a namespace, then bind it as
   `ORDERS` (see §3).
3. **Stripe:** Workbench → Webhooks → **Add destination** → pick the two
   events → destination type **Webhook endpoint** → the URL above. Stripe
   renamed webhook endpoints to *event destinations*; "Add endpoint" is the
   old name for this button, and older writing here (and in
   `scripts/email-webhook-setup.sh`) still uses it. Leave the scope on **Your
   account** and take the default API version — the handler reads only
   `type`, `data.object.id` and `livemode`, and re-asks Stripe for the rest,
   so the payload's shape is not load-bearing. Then reveal the signing secret
   and paste it as `STRIPE_WEBHOOK_SECRET` (Secret). **Check the mode toggle
   says Live**: a test-mode destination verifies signatures happily and then
   finds nothing, because the site's Payment Links are live.
4. **Redeploy.** Variables and bindings only reach the Function on a *new*
   deployment. Saving them changes nothing on its own.

### Proving it works without spending money

Written 1 Sept 2026, after the three shorter routes turned out not to exist.

**What does not work, so nobody spends an hour rediscovering it:**

- **"Send test event"** is not offered on a live-mode destination. This
  document recommended it for months; it is a test-mode affordance.
- **Resending a past event** (Workbench → Events → the event → Resend) cannot
  target a destination that did not exist when the event fired. There is no
  delivery record to retry, so the new destination is not among the choices.
- **The Workbench Shell** runs `stripe events resend --webhook-endpoint=we_…`,
  which is exactly the right command, but the shell only permits writes in a
  sandbox — and a sandbox session id is unreadable by the live key in
  Cloudflare, so it proves the signature check and nothing past it.

**What does work: sign a POST locally and send it with a real session id.**
The signature scheme is HMAC-SHA256 over `<timestamp>.<raw body>` with the
secret used verbatim as the key, so it is reproducible in a few lines. The
handler reads only `type`, `data.object.id` and `livemode`, so a minimal body
carrying a genuine `cs_live_…` is not a weaker test — it is the same test, and
it exercises every link at once: the secret, the live key's read of the
session, the product check, the KV write, and Resend actually delivering.
A `200 ok` means the email really was sent. Use a session from one of your own
past purchases; a redelivery is safe because the `emailedAt` stamp answers
`already_sent` rather than sending twice.

> **A `cs_…` id is a capability, not just an identifier.** `/api/verify` mints
> download tokens from a session id alone. Use your own; never paste a
> customer's anywhere.

**If the probe returns `403` with Cloudflare `error code: 1010`**, it never
reached the Function — the edge refused it on user agent alone. A default
`Python-urllib` UA is enough to trigger it. Stripe sends a real UA so its
deliveries pass, but if Event deliveries ever shows 403s, this is the cause
and the handler is innocent.

### The response codes, and why they are what they are

Stripe retries any non-2xx for up to three days. So everything this endpoint
declines on purpose — an event type it does not handle, an order for a
different product, a session that has not been paid yet — answers **200**, and
everything that is worth trying again — a Stripe outage, a KV error, a failed
send, missing configuration — answers **500**. Answering 500 to an event that
will never succeed manufactures three days of retries; answering 200 to a
failed send silently loses a customer's album.

### Why this event and not the success page

`purchase-success.html` is a URL. Anyone can type it into a browser. It is not
evidence that money moved, and it must never be the thing that unlocks a file.

`checkout.session.completed` is delivered by Stripe directly to your server,
signed with `STRIPE_WEBHOOK_SECRET`. Verifying that signature is what proves the
message came from Stripe and not from someone who guessed the endpoint URL.
**That verified webhook is the only authority on whether a purchase happened.**

The `purchase_completed` analytics event fired by the success page is a funnel
marker for counting, nothing more. The code says so at the point it fires.

### The metadata contract

Whatever is attached to the Session is what the webhook has to work with. The
agreed keys are defined in `js/purchase-checkout.js` §2:

| Key | Values |
|---|---|
| `product_type` | `album` |
| `album` | `rise-up` |
| `edition` | `digital` \| `deluxe` \| `artifact` |
| `variant` | physical only — colourway / pressing |
| `size` | physical only — apparel size |
| `bundle` | physical only — what is in the box |

**Size and variant must be chosen on our page, before checkout, and passed
through as metadata.** Do not push that selection into Stripe Checkout: Stripe's
hosted page has no real variant picker, and modelling S/M/L/XL as separate Prices
multiplies the Dashboard objects by the size count, then again by every
colourway.

Identify the edition from `metadata.edition` — **never from the amount paid.** A
discount code makes the amount ambiguous.

---

## 6. What is still outstanding

The honest list. Everything here is missing unless its entry says otherwise —
items 1 and 8 have moved since this section was written, the rest have not.

1. ~~**A Stripe account connected to this project.**~~ **Partly done.**
   **Sandbox (test mode)** holds one Product — Digital Edition — with one $20
   Price and one Payment Link,
   `https://buy.stripe.com/test_5kQbIT7b6gYhfc8aQBaIM00`, which is the URL
   sitting in `js/purchase-checkout.js` today. Deluxe and Artifact were never
   created there; their `checkoutUrl` is still `null`.

   **A live account exists as of Aug 31 2026** — the owner began activation
   that day and, asked whether to copy the sandbox across, deliberately
   **declined and started live clean**. That was the right call and is worth
   not second-guessing later: test and live mint different `prod_`/`price_`
   IDs, a copied Payment Link gets a **new `buy.stripe.com` URL** regardless,
   so copying saves no code change — it only carries experimentation debris
   into the account that takes real money.

   **Still missing:** three live Products, three live Prices, three live
   Payment Links, and the swap of the `test_` URL above for the live one in
   `js/purchase-checkout.js`. Until that swap the buy button is wired to test
   mode and **takes no real money** — which is a safe failure, not a broken
   one. No `sk_`/`whsec_` key exists anywhere, and by section 1 the Payment
   Link path never needs one.

   > The sandbox contents were read from this repo. The live account's state
   > is **the owner's report, not measured** — no session has authenticated
   > against the Dashboard.
2. **Secure download issuance.** Nothing generates an expiring, per-buyer,
   download-capped link. This needs a signed-URL service (S3, R2, Cloudflare) and
   a server to sign with.
   > **The album ZIP URL must never appear in public HTML or JavaScript** — not
   > in `purchase.html`, not in `purchase-success.html`, not in a data attribute,
   > and not committed anywhere in this repo. Everything in this repo is public.
   > A hard-to-guess path under `assets/` is not protection; it is a URL, and
   > URLs get shared.
3. **Confirmation email.** Nothing sends one. Needs an email provider and a
   server. Stripe's own receipt is not a delivery email.
4. **Physical variant and size capture.** The UI to choose a size does not exist
   on `purchase.html`, and there is nowhere to send the answer.
5. **Limited-edition numbering.** Nothing assigns "no. 7 of 100". Needs
   persistent storage that survives a redeploy — a static site has none. Stripe's
   "limit the number of payments" can cap a run but does not number the units.
6. **Order storage.** No database, no order history, no way to answer "what did I
   buy" other than the buyer's own email.
7. **Refunds, taxes, and terms.** Stripe Tax is a Dashboard toggle. A refund and
   delivery policy is a page that does not exist on this site.
8. ~~**The prices themselves.**~~ **Done — set by the owner on Aug 27 2026 at
   $20 / $42 / from $75.** See section 2. What is still outstanding is that no
   Stripe Price object exists carrying any of them.

---

## 7. QA checklist

Before flipping anything to live mode:

**Repository safety**

- [ ] A search of the repo for Stripe secret-key and webhook-secret prefixes
      returns nothing but this document. (`grep -rIn "sk_live\|sk_test\|whsec_"
      . --exclude=STRIPE-SETUP.md --exclude-dir=.git` — the exclusion is because
      section 3 above names those prefixes on purpose, and without it the check
      always "fails" on its own instructions.)
- [ ] No `.env` file, and `.env` is in `.gitignore` if one is ever added.
- [ ] No album download URL appears in any committed HTML or JS.

**Test mode, before live**

- [ ] Every edition's button either opens a real Stripe page or says purchasing
      is not open. Nothing lands on a blank page or a 404.
- [ ] Pay with `4242 4242 4242 4242` → lands on `purchase-success.html`, branded,
      with the order reference showing.
- [ ] ~~Cancel out of the Stripe page → lands on `purchase-cancelled.html`.~~
      **NOT TESTABLE WHILE THE SITE SELLS THROUGH A PAYMENT LINK — verified
      against Stripe's API reference Aug 31 2026.** A Payment Link's only
      redirect is `after_completion`, which fires on success; there is no
      `cancel_url` field on a Payment Link at all. `cancel_url` belongs to
      API-created Checkout Sessions. So nothing routes to
      `purchase-cancelled.html` automatically today — a buyer who backs out
      goes wherever their back button takes them. The page is not dead code;
      it is the destination the day this moves to Checkout Sessions. Re-enable
      this line then.
- [ ] The prices on `purchase.html` match the prices in Stripe **and** the
      `EDITIONS` config in `js/purchase-checkout.js`.
- [ ] Both return pages render correctly on a phone, with nav and footer intact
      and no sideways scrolling.
- [ ] Browser console is clean on `purchase.html`, `purchase-success.html` and
      `purchase-cancelled.html`.
- [ ] With JavaScript disabled, `purchase.html` still reads honestly — the
      coming-soon state is the default in the HTML, not something JS adds.
- [x] ~~The STANDBY panels on both return pages are removed in the same change
      that connects a real checkout.~~ **DONE Aug 31 2026.** The success page's
      panel became the four-state verification region; the cancelled page's
      became copy that is true whether the visitor cancelled a checkout or
      typed the URL. Both files' banners record what they replaced. This item
      was written as a prediction and it was the right one — the success
      page's panel had already been caught printing "nothing has been charged"
      under a live order reference.

**Live mode**

- [ ] Live keys are set in the hosting provider's environment, never in the repo.
- [ ] One real purchase of the cheapest edition, by you, start to finish.
- [ ] The album actually reaches the buyer — whatever "actually" means under
      whichever option you chose.
- [ ] Refund that test purchase.

---

## Where the code is

| File | What it holds |
|---|---|
| `js/purchase-checkout.js` | The edition config (`checkoutUrl` slots), the analytics event names, the metadata contract, and the documented fulfilment interface. **Start here.** |
| `purchase.html` | The three edition cards. |
| `css/purchase.css` | Their styling. |
| `purchase-success.html` | Branded return page for a completed purchase. |
| `purchase-cancelled.html` | Branded return page for an abandoned one. |
| `scripts/stripe-payment-link.sh` | The Payment Link wizard. Walks the Dashboard steps, writes the URL into the config, runs the test-card checklist. |
| `scripts/r2-album-download.sh` | The R2 wizard. Nine stages: private bucket, ZIP upload, `ALBUM_BUCKET` binding, live price ID, generated signing key, the environment variables, and a live check of `/api/verify` that proves the wiring without spending a cent. Walks §3a below. Writes nothing to disk — every secret goes straight into the Cloudflare dashboard. |
| `functions/api/verify.js` | **Server-side.** Asks Stripe whether a session is paid, checks it is for the digital album, mints the signed download token. |
| `functions/api/download.js` | **Server-side.** Re-verifies, then streams the ZIP out of the private R2 bucket. The only route to the file. |
| `STRIPE-SETUP.md` | This document. |

`functions/` is at the **repo root and must stay there** — Cloudflare requires
the Functions directory outside the static output. It is deliberately *not* in
the deploy workflow's `PUBLIC` allowlist: if it were copied into `_site` its
source would be served at a public URL. Neither the allowlist nor the leak guard
needed changing for this feature, and neither should be changed for it.

---

## 8. What this does NOT protect against, stated plainly

Written Aug 31 2026 alongside the implementation, because the gap between "the
download is protected" and what is actually true is exactly where the next
wrong assumption gets made.

**The session id is a bearer token.** There are no accounts on this site, so the
only thing distinguishing a buyer from anyone else is possession of
`?session_id=cs_live_...`. Whoever holds the success URL can download the album.
Verification stops *fabricated* and *unpaid* ids cold — that is real, and it is
what the old page could not do — but it cannot tell a buyer from a friend the
buyer sent the link to.

What bounds it today:

- **The window.** `DOWNLOAD_WINDOW_HOURS`, 72 by default, measured from Stripe's
  own `created` timestamp. A posted link goes dead.
- **The signed token.** The URL the Download button points at expires in 15
  minutes, so the *download link* is not a durable, postable thing. The session
  id behind it is still re-mintable, which is why the window above matters.
- **The product check.** A paid order for a different edition does not unlock
  the album.

**What is NOT implemented, and what it would take.** A download *count* cap —
"this order may download three times" — needs somewhere to record the count,
which means a KV namespace or D1 binding and a write on every download. That is
the single highest-value addition if sharing ever becomes a real problem, and it
is a contained change: one binding, one read, one write, in `download.js`. It
was left out because it adds a storage dependency to a launch that does not yet
have one sale, not because it was judged unnecessary.

**"Yours permanently" on `purchase.html` and the 72-hour window are in tension.**
The record is theirs permanently; the *link* is not. The `window_closed` copy on
the success page resolves it honestly — it says the limit is on the link, not on
what they bought, and to write in for a reissue. If reissues become frequent,
raise `DOWNLOAD_WINDOW_HOURS` rather than editing the promise.

**The WAV set is 1.4 GB and it streams through the Worker.** That is fine —
the function pipes R2's body straight through rather than buffering it, and
Range requests are passed to R2 so a dropped connection resumes instead of
restarting. But it is worth knowing where the bytes go: every WAV download is
1.4 GB of Workers egress. R2 egress itself is free, and Pages Functions bill
per request rather than per byte, so the cost is not the worry — the worry is
a buyer on a phone tapping the wrong button. That is why MP3 is the primary
button, WAV is a ghost button, and both sizes are printed next to them.

**Refunds and disputes close the download — but only because the CHARGE is
checked, not the session.** This was wrong when it shipped on Aug 31 and was
corrected Sept 1. A Checkout Session's `payment_status` is one of exactly three
values (`paid`, `unpaid`, `no_payment_required`) and the session object carries
no refund information at all — refunding an order leaves it reading `paid`
forever. Both functions therefore expand `payment_intent.latest_charge` and
check `refunded`, `amount_refunded` and `disputed`. Verified against mocked
Stripe responses: full refund, partial refund and dispute each return 403 and
mint no download token. **A partial refund also closes it** — that is a
deliberate choice, since there is no partial album, and it is the safer
direction if the owner ever refunds a few dollars as a goodwill gesture. If
that becomes a real case, the fix is to compare `amount_refunded` against
`amount_total` rather than against zero.

**A Stripe outage blocks downloads.** `/api/download` re-asks Stripe on every
request rather than trusting its own token, so that a refund or dispute landing
between verification and download is honoured. The cost is that Stripe being
down means buyers cannot collect. This is the correct direction to fail and it
is a deliberate trade, not an oversight.
