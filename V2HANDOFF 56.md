# Kundalini Spines — Spine UI V2 Handoff 56

**Date:** September 1, 2026

Thirty-eighth handoff of the **Spine UI V2** track. `55` owns the server, the
refund bug and the copy sweep; `54` owns the STANDBY near-miss; `53` owns the
sky saga; `51` owns the Cloudflare migration recipe. **This session:** no sky
work, no visual work, no build numbers touched, one new transmission. The
webhook that `55` called "the most exposed thing on the site" went live and
was proved end to end without spending a cent.

---

## The one-line version

`functions/api/stripe-webhook.js` was merged, deployed, and **verified all the
way through** — a real signed delivery carrying a real `cs_live_` id returned
`200 ok` and the download email arrived. `55`'s open items 1 and 2 are closed.
Along the way this session pushed a commit to `main` on a **wrong diagnosis**
and reverted it; the reason it was wrong is the most useful thing in this file
and is written up in full below. `STRIPE-SETUP.md` §5 was corrected against the
live dashboard, because it told you to click three things that do not exist.
Transmission **006** filed.

---

## Corrections to handoff 55

1. **Item 1 (the confirmation email) is CLOSED.** Every buyer is now emailed
   their download link when `checkout.session.completed` or
   `checkout.session.async_payment_succeeded` arrives. Not "shipped and
   untested" — a real signed delivery was pushed through the live endpoint
   with a genuine session id and the email landed in the owner's inbox on
   Sept 1 2026.
2. **Item 2 (no order storage) is CLOSED.** The `ORDERS` KV namespace is bound
   and the webhook writes a record **before** attempting to send, so a sale
   leaves a trace even when the mail fails. Note the ordering: that is
   deliberate, not incidental.
3. **Item 4 is now half-closed and should not be read as open.** Reissue is
   still a manual act by the owner, but "there is no order record to look the
   buyer up in" is no longer true. The promise in the `window_closed` copy is
   now backed by data.
4. **`55` says `STRIPE_WEBHOOK_SECRET` is "shown once".** It is not. The event
   destination page has an eye icon that reveals it and an arrow that rolls it,
   any time. Corrected in `STRIPE-SETUP.md` this session.

---

## The wrong diagnosis, written up because it cost an hour and a bad commit

**What happened.** `GET /api/stripe-webhook` returned the site homepage with
**200**. That is byte-for-byte what an unknown path like `/nope` returns. From
that single observation this session concluded the route was not deployed,
then that the CI allowlist never shipped `functions/`, then that the next green
build would take `/api/verify` and `/api/download` offline and break album
delivery. A commit (`becca92`) was written and pushed to `main` on that basis,
with a confident message asserting all of it.

**All of it was false.** The reasons, each independently worth knowing:

- **A Pages Function that exports only `onRequestPost` falls through to static
  assets on a GET.** `stripe-webhook.js` exports `onRequestPost` only, so a GET
  is served the homepage. `verify.js` and `download.js` export `onRequestGet`,
  which is exactly why *they* answered a GET and the webhook did not. The
  difference read as "two routes exist and one does not".
- **`wrangler pages deploy _site` compiles `functions/` from the repo root**,
  not from the directory it uploads. The `PUBLIC` allowlist in
  `deploy-cloudflare.yml` never needed a `functions` entry and never did.
  Functions have always shipped.
- **`curl -s` without `-L` returns an EMPTY body on this site**, because Pages
  308-redirects `/purchase-success.html` to `/purchase-success`. A `grep` over
  that empty body reported "old content" for every host including ones serving
  the newest deploy — which manufactured a second false conclusion, that
  production was pinned to a 14-hour-old deployment.

**A single `curl -X POST -d '{}'` would have returned `400 bad_signature` in
one second and none of this would have happened.** Reverted in `19b333f`,
which carries the proof: `f1ee36ef` — the build from *before* the allowlist
change — answers a POST correctly.

> **Rule for the next session: probe a Pages Function with the method it
> exports, and with `-L`.** Do not infer a route's existence from a GET.

---

## Things learned the hard way, recorded so nobody re-learns them

- **Cloudflare's edge answers `403` / `error code: 1010` to a request whose
  only sin is a `Python-urllib` user agent.** It never reaches the Function.
  Stripe sends a real UA so live deliveries pass, but if **Event deliveries**
  ever shows 403s, this is the cause and the handler is innocent.
- **Stripe renamed webhook endpoints to *event destinations*.** The button is
  **Add destination**, and the create flow asks for scope, API version and
  destination type *before* it asks for a URL.
- **There is no "Send test event" on a live-mode destination.** It is a
  test-mode affordance. `STRIPE-SETUP.md` recommended it for months.
- **A past event cannot be resent to a destination created after it fired.**
  There is no delivery record to retry, so the new destination is not offered
  in the Resend dialog. This kills the obvious "just replay yesterday's sale"
  plan.
- **The Workbench Shell only permits writes in a sandbox.** It runs
  `stripe events resend --webhook-endpoint=we_…`, which is precisely the right
  command, but a sandbox session id is unreadable by the live key in
  Cloudflare — so it proves the signature check and nothing past it.
- **Environment variables and bindings only reach a Function on a NEW
  deployment.** Saving them changes nothing on its own. This was missing from
  `STRIPE-SETUP.md` entirely and is the most common reason a correct set of
  secrets still fails.

---

## How to prove the webhook works without spending money

The three dashboard routes above are all dead ends. What works:

**Sign a POST locally and send it with a real `cs_live_` id.** The scheme is
HMAC-SHA256 over `<timestamp>.<raw body>`, secret used verbatim as the key
(`stripe-webhook.js`, `hmacHex`). The handler reads only `type`,
`data.object.id` and `livemode` and re-asks Stripe for everything else, so a
minimal body is not a weaker test — it is the same test, and it exercises the
secret, the live key's read, the product check, the KV write and Resend
delivering, in one shot.

**The scripts exist and the owner asked to keep them:**
`C:\Users\Haight\Desktop\signed_probe.py` and `RUN-PROBE.bat` (double-click the
`.bat`; it prompts, runs, and pauses so the answer is readable).

**They are deliberately NOT in the repo.** It is public, and a script that
expects a webhook secret in the environment does not belong in its history.
Do not "tidy them into `scripts/`".

Reply meanings: `ok` (everything works, email really sent) · `already_sent`
(idempotency stamp held) · `not_found` (secret right, live key could not read
that session) · `bad_signature` (Cloudflare's secret does not match Stripe's) ·
`wrong_product` (session is not the Digital Edition).

> **A `cs_…` id is a capability, not an identifier.** `/api/verify` mints
> download tokens from a session id alone. Use one of the owner's own; never a
> customer's, anywhere.

---

## Verified vs. asserted

**Verified this session, by doing it:**

- `POST /api/stripe-webhook` with a real signed body and a real session id →
  `200 ok`, and **the owner confirmed the email arrived**. That single result
  proves: signing secret matches, live `STRIPE_SECRET_KEY` reads sessions,
  `PRICE_ID_DIGITAL` matches the line item, the `ORDERS` KV binding accepts
  writes, and Resend has `kundalinispines.com` verified.
- All five env vars and both bindings present on the Pages project — seen in
  the dashboard.
- After the revert deployed: `/api/stripe-webhook` → `400 bad_signature`,
  `/api/verify` → `400`, `/api/download` → `400`, and `purchase-success` still
  serving `df80a66` content. The revert did not break anything.
- Transmission 006 renders first at 1440 and 390, the `06 RECORDS DECODED`
  readout updated on its own, the row opens, the `purchase.html` link
  resolves, no console errors, no failed requests, no horizontal scroll.
  **Screenshots taken and looked at at both widths.**
- Both remote branches at `25f0a4d`; the deploy for it completed green and
  `transmissions.json` on the live domain contains `006`.

**Asserted, not verified:**

- **No real customer purchase has exercised the webhook.** Every proof above
  used a session from the owner's own earlier purchase. The first genuine
  sale is still the first genuine sale.
- **The `checkout.session.async_payment_succeeded` path has never fired.**
  Only `checkout.session.completed` was ever delivered. The async branch is
  reasoned-about code, not exercised code.
- **`already_sent` was never observed.** The idempotency stamp is believed
  correct from reading it, not from a second delivery.
- **Resend's own dashboard was never opened.** Domain verification is inferred
  from the email arriving, which is strong but indirect.

---

## Do not do these

- **Do not add `'functions'` to the `PUBLIC` allowlist in
  `deploy-cloudflare.yml`.** It looks like an obvious omission. It is not —
  wrangler compiles `functions/` from the repo root. This was done and reverted
  this session; `19b333f` carries the proof.
- **Do not diagnose a Pages Function with a GET.** See above.
- **Do not switch the Stripe dashboard to sandbox to get a writable shell.**
  A sandbox session id is unreadable by the live key in Cloudflare, so the
  test proves nothing past the signature.
- **Do not move `signed_probe.py` / `RUN-PROBE.bat` into the repo.**
- **Do not paste a customer's `cs_` id anywhere.** It is a download capability.
- **Do not assume a green deploy means new code is live** without checking the
  thing itself — but check it correctly (POST, `-L`).

---

## What is deliberate, so nobody fixes it

- **The webhook writes the KV record BEFORE sending the email.** A sale leaves
  a trace even if the mail fails.
- **`stripe-webhook.js` duplicates helpers with `verify.js` and
  `download.js`.** Every `.js` under `functions/` becomes a public route, so a
  shared `functions/lib/` module would be served at `/lib/…`. Three
  self-contained files beat three that depend on a published fourth.
- **The endpoint answers 200 to things it declines on purpose** (unhandled
  event type, wrong product, not paid yet) and 500 to things worth retrying.
  Stripe retries non-2xx for three days; the split is deliberate.
- **`main` and `feature/spine-ui-v2` are level at `25f0a4d`.** Normally `main`
  lags. This session's work went to `main` on the owner's explicit word, and
  the work branch was fast-forwarded afterwards so the tracks did not diverge.

---

## Git state

- Both `main` and `feature/spine-ui-v2` at **`25f0a4d`**, pushed, deploy green.
- This session's commits, oldest first:
  - `df80a66` the webhook (merged from the feature branch to `main`)
  - `becca92` allowlist change on a wrong diagnosis
  - `19b333f` revert of `becca92`, with the proof
  - `f9a1376` `STRIPE-SETUP.md` §5 + `scripts/email-webhook-setup.sh` corrected
  - `25f0a4d` transmission 006
- Work was done in an **agent worktree** on branch
  `claude/kundalini-session-start-245030`. The next session should use the
  normal V2 worktree at `C:\Users\Haight\Desktop\kundalini-spines-spine-ui`.

---

## Still open

1. **No real customer sale has gone through the webhook.** Everything is
   proved with the owner's own session. Watch **Event deliveries** on the first
   genuine purchase — and remember a `403` there means the edge bot filter,
   not the handler.
2. **The async payment branch is untested.** It will first run in production.
3. **No download-count cap.** Unchanged from `55` item 3, still the
   highest-value hardening if sharing becomes real: one KV read and write in
   `download.js`.
4. **Reissue is still manual.** There is now an order record to look a buyer
   up in, which is the hard half — but nothing automates the reissue itself.
5. **Deluxe and Artifact remain `checkoutUrl: null`.** Unchanged from `55`
   item 5. Artifact also needs a `status` flip.
6. **Nothing tests any page's copy against its own state.** Unchanged from
   `55` item 6, and still the recurring defect class on this project. Six
   instances now, counting `STRIPE-SETUP.md`'s three wrong dashboard
   instructions found this session — a doc is copy too.

---

## Starting the next V2 chat

Attach this file. `55` remains required reading for the refund bug and the
copy-sweep history; `51` for the Cloudflare migration recipe.

> Here's the latest V2 handoff for Kundalini Spines (Spine UI V2 branch). I
> want to work on <thing> this session.

The new session needs folder access to
`C:\Users\Haight\Desktop\kundalini-spines-spine-ui` — the V2 worktree, not the
production `kundalini-spines` folder — and should confirm it is on
`feature/spine-ui-v2` before editing.
