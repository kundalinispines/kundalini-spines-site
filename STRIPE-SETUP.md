# Stripe Setup — what is built, what is not, and what you have to do

Written Aug 20 2026, during the purchase rough-in.

**Nothing on this site can take money today, and nothing in this repo pretends it
can.** The purchase page, the checkout interface and the two return pages are
built. No Stripe account is connected, no price IDs exist, no payment links
exist, and no payment has ever been processed. This document is the list of what
would have to happen for that to change, written for you rather than for a
developer.

Read the first section before anything else. It is the reason the rest of the
document is shaped the way it is, and it is a decision only you can make.

---

## 1. The blocking fact: this site has no server

Kundalini Spines is a **static site**. Plain HTML, CSS and JavaScript, deployed
to GitHub Pages from the `main` branch. There is no build step, no npm, no
framework, no backend, and — the part that matters here — **no server that runs
code, and no environment-variable mechanism anywhere in the project.**

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

## 3. Environment variables a future backend would need

**This repo has no environment-variable mechanism today.** There is no `.env`, no
build step to read one, and no runtime to inject one. The names below are the
shopping list for option (b), to be set in the hosting provider's dashboard
(Netlify/Vercel/Cloudflare), **never in this repo**:

| Name | What it is | Secret? |
|---|---|---|
| `STRIPE_SECRET_KEY` | `sk_live_...` / `sk_test_...`. Creates Checkout Sessions. | **Yes — never public** |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...`. Verifies webhook signatures. | **Yes — never public** |
| `STRIPE_PUBLISHABLE_KEY` | `pk_...`. Safe in client code if ever needed. | No |
| `PRICE_ID_DIGITAL` | `price_...` for edition 01 | No, but keep it out of the repo anyway |
| `PRICE_ID_DELUXE` | `price_...` for edition 02 | No |
| `PRICE_ID_ARTIFACT` | `price_...` for edition 03 | No |
| `DOWNLOAD_BUCKET_URL` | Where the album files actually live | Path is not a secret; access must be |
| `DOWNLOAD_SIGNING_KEY` | Signs the expiring download URLs | **Yes** |
| `EMAIL_API_KEY` | Whatever sends the confirmation email | **Yes** |

Price IDs are not secret, but keeping them with the keys rather than in the repo
means the test and live sets can be swapped by changing the environment rather
than by editing and redeploying code.

---

## 4. The return URLs

> **CORRECTION, Aug 27 2026 — these pages are BUILT but NOT LIVE.** This section
> said "live in the repo root" from the day it was written, and that has never
> been true. `.github/workflows/deploy-pages.yml` builds GitHub Pages from
> **`main`**, and `main` contains no `purchase.html`, no `purchase-success.html`,
> no `purchase-cancelled.html` and no `merch.html` — the entire purchase surface
> exists only on `feature/spine-ui-v2`, which is 169 commits ahead of it.
>
> **So do not set a Payment Link redirect to either URL yet.** A paying customer
> would land on a 404, which is the one failure the `null` in `checkoutUrl`
> exists to prevent — arriving through the Dashboard, where no code guard can
> see it. Leave the link on Stripe's own confirmation page until V2 ships.
>
> This costs nothing later: **After the payment** is editable on an existing
> link, so the same link gains the branded page the day the pages deploy. No new
> link and no code change.

Two pages are built and sit in the repo root:

- `https://<your-domain>/purchase-success.html`
- `https://<your-domain>/purchase-cancelled.html`

Both are branded to the site — the site's nav, footer, starfield and type, not a
generic Stripe confirmation. Both are marked `noindex` so a confirmation page
never turns up in a search result.

For a Payment Link, the success URL goes in **After the payment** — **Confirmation
page** — the redirect option. (Those are the labels as of Aug 27 2026, taken from
docs.stripe.com; the older "After payment — Redirect" wording in earlier drafts of
this document was wrong.) To get the order reference to display, append Stripe's
token:

```
https://<your-domain>/purchase-success.html?session_id={CHECKOUT_SESSION_ID}
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

**Required for option (b). Not available under option (a).**

Endpoint: `POST https://<your-backend>/api/stripe-webhook`
Event to subscribe to: **`checkout.session.completed`**

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

## 6. What is still completely outstanding

None of the following exists in any form. This is the honest list.

1. **A Stripe account connected to this project.** No account, no keys, no
   products, no prices, no links.
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
- [ ] Cancel out of the Stripe page → lands on `purchase-cancelled.html`.
- [ ] The prices on `purchase.html` match the prices in Stripe **and** the
      `EDITIONS` config in `js/purchase-checkout.js`.
- [ ] Both return pages render correctly on a phone, with nav and footer intact
      and no sideways scrolling.
- [ ] Browser console is clean on `purchase.html`, `purchase-success.html` and
      `purchase-cancelled.html`.
- [ ] With JavaScript disabled, `purchase.html` still reads honestly — the
      coming-soon state is the default in the HTML, not something JS adds.
- [ ] The STANDBY panels on both return pages are removed in the same change
      that connects a real checkout. They say purchasing is not open; leaving
      them up after it opens would be the new lie.

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
| `scripts/stripe-payment-link.sh` | The wizard. Walks the Dashboard steps, writes the URL into the config, runs the test-card checklist. |
| `STRIPE-SETUP.md` | This document. |
