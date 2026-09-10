# Kundalini Spines — Spine UI V2 Handoff 62

**Date:** September 10, 2026

Forty-fourth handoff of the **Spine UI V2** track. `61` owns the Firefox
scroll fix, the carousel settle and the sample fill; `60` the BTCPay checkout;
`59` the MP3 package; `58` the deep field; `57` the footer contrast harness;
`56` the Stripe webhook; `51` the Cloudflare migration recipe. **This session
closed open items rather than building:** the failing YouTube staging job
diagnosed and given a retry, Firefox measured on a real 60 Hz display, every
BTCPay proof that was "owner's word" turned into evidence or a decision, and
the Stripe carry-overs checked against the Dashboard. Three code/doc commits
plus this handoff, **released to `main` on the owner's word at the end of the
session** (hash and deploy run at the bottom).

---

## The one-line version

The YouTube job failed because YouTube's feed answered 404/500/reset at
~03:20 UTC and the script had no retry (it does now); Firefox at a true 60 Hz
holds 16.7 ms through the whole home-page scroll with two dropped frames; the
Lightning sale is proven on the server from both ends; there was never an
on-chain purchase and the owner does not want one; the Stripe async branch is
unreachable on this account; and there will be no download cap, by decision.

---

## Corrections to handoff 61

1. **`61` Still open item 1 said "server-side proof of both Bitcoin sales".
   There was only ever one sale.** The owner corrected the record this
   session: **no on-chain purchase of the album was ever made.** The
   "on-chain purchase confirmed by owner" that `60`/`61` (and the assistant's
   memory) carried was wrong. The store's wallet export
   (`btcpay-…-BTC-20260910`) holds exactly two Sept 8 transactions: a
   0.00001276 BTC "Test wallet" funding and the same amount out as "cold
   withdraw". Invoice `EPK33DsAXMQiicJSv6yC22` (order `PUBLIC-ENDPOINT-TEST`,
   $1) expired unpaid — that was `60`'s endpoint probe. The owner considers an
   on-chain buy unnecessary since Lightning worked; do not ask for one.
2. **`61` said the Firefox 60 Hz figures were arithmetic.** They are now
   measurements — see below. The arithmetic was right.
3. **`61` Still open item 8 said the YouTube logs "need an authenticated
   GitHub session".** They do not need a login: the Actions API serves run and
   job lists for this public repo unauthenticated, and the job-log endpoint
   works with the token Git Credential Manager already holds for pushes
   (`git credential fill`) — provided the client does NOT follow the 302 to
   Azure blob storage with the GitHub `Authorization` header still attached
   (Azure answers 401 to that). There is no `gh` CLI on the box.
4. **`60` "the installed BTCPay version is unread"** — read: **v2.4.4**
   (`2d5a0d8077bb`), the release the schema was read against. Closed.
5. **`60` "store speed policy is MediumSpeed — owner's word"** — the owner
   queried the BTCPay database: `SpeedPolicy = 1`, "MediumSpeed — 1
   confirmation". Closed, and stronger than the dashboard.
6. **`56`–`61` carried "the async payment branch is untested" as a risk.** It
   is unreachable: the Dashboard's enabled methods contain no
   delayed-notification method (see Stripe below). Moot, not a gap.
7. **`55`–`61` carried "no download-count cap" as the highest-value
   hardening.** The owner closed it as a decision (see deliberate).

---

## What shipped (three commits, `34a3070`, `76415e6`, `cdbf781`)

### `34a3070` — `scripts/youtube-sync.mjs` retries; `scripts/perf-scroll.py` knobs

**The YouTube job.** Runs of "Stage new YouTube videos" from Sept 3 to 10,
read from the Actions API: 30 runs, 7 failures, every failure in the "Pull
the feed" step within 0–4 s, and every one YouTube's side:

| run (UTC) | YouTube answered |
|---|---|
| Sept 3 03:20 | HTTP 500 |
| Sept 6 15:03 | TLS socket reset (`ECONNRESET`) |
| Sept 8, 9, 10 ~03:20 | HTTP 404 |

The same URL answered 200 with all nine videos from this desktop three times
in a row and at every other slot of the day; the run after each failure
passed. The ~03:20 arrival is GitHub's queue delay on the `0 */6` cron's
00:00 slot. The 404 is not a missing channel. The script had **no retry**, so
one bad answer failed the run. Now: up to five attempts over ~110 s (5, 15,
30, 60 s) on any non-2xx or network error, each logged; a run that fails all
five still fails loudly. **Verified without Node** (none on the box): the
module loaded in Playwright Chromium with `node:fs` stubbed to the real repo
files and `fetch` stubbed — 404 → `ECONNRESET` → 200 completed normally at
20 s with the usual "9 entries in feed, all already known"; five 500s threw
"after 5 attempts" at 110 s. **Scheduled workflows run from the default
branch, so this protects the schedule only now that it is on `main`.**

**The harness.** `WINPOS=x,y` puts either browser's window at a point of the
Windows virtual screen (Firefox through the throwaway profile's
`xulstore.json`; Chromium headed with `--window-position`), and `FFRATE=60`
caps Gecko's refresh driver. Both are documented in the file's docstring and
at the point of use, with what was measured (next section).

### `76415e6`, `cdbf781` — `BTCPAY-SETUP.md`

The "version not read" caveat replaced by v2.4.4 and the first real delivery;
the speed-policy paragraph gains the database confirmation. Doc only; the
deploy allowlist excludes `.md`.

---

## Firefox on a 60 Hz display — measured

Displays on the box (EnumDisplayDevices, Sept 10): DISPLAY1 primary
2560×1440 **240 Hz**; DISPLAY2 1080×1920 59 Hz at (−3000,114); DISPLAY3
1920×1080 59 Hz at (−1920,125); DISPLAY5 1920×1080 60 Hz at (2560,0) on the
Intel iGPU.

**Finding first: on this box a window on a secondary 59 Hz display still runs
rAF at 4.2 ms in BOTH browsers.** Firefox's window rect was confirmed at
(−1800,200)–(−344,1108), squarely on DISPLAY3, and it paced at 240 Hz; headed
Chromium placed there by `--window-position` and again by CDP
`Browser.setWindowBounds` reported 241 Hz. Every window paces from the
primary. So `WINPOS` alone cannot give a 60 Hz floor; the owner switched the
primary to 60 Hz for the final runs.

Home page, six-second scripted scroll, 1440×900:

| run | frames | mean | p95 | max | >33 ms | content main thread |
|---|---|---|---|---|---|---|
| Firefox, 240 Hz (`61`, after fix) | 1,186 | 5.1 | 8.3 | — | — | 4,326 / 6,000 ms |
| Firefox, `FFRATE=60` on the 240 Hz primary | 358 | 16.8 | 17.3 | 33.5 | 2 | 1,548 / 6,018 ms |
| **Firefox, primary set to 60 Hz (true vsync)** | **357** | **16.8** | **16.7** | **33.3** | **2** | **1,587 / 6,005 ms** |
| Chromium headed, primary at 60 Hz, run 1 | 340 | 17.6 | 33.3 | 33.4 | 19 | — |
| Chromium headed, primary at 60 Hz, run 2 | 359 | 16.7 | 16.8 | 16.8 | 0 | — |

The capped run and the true-vsync run agree within noise, so `FFRATE=60` is a
faithful proxy when nobody can change the display. Firefox holds 60 through
the whole scroll with the main thread idle ~74% of the time; the two long
frames are single drops. Chromium's 19 drops on its first headed run did not
repeat — a one-off after the display switch, not a finding. At 60 Hz the
largest JS-attributed style cost in the Gecko profile is still `nav.js`'s
`onScroll/frame` (the `--nav-h` collapse, 450 samples), then
`filmrow-vhs.js` (148), `spine-doc.js` (89), `clouds.js` (58) — the same order
as `61`'s open item 2. Profiles in `perf-out/` (gitignored, ~300 MB across the
four).

---

## BTCPay — proof status, all closed

- **Lightning, from the site's side:** `GET /api/btcpay-verify?order=ksbtc_fefa7546…`
  on the live domain returns `ok:true, state:settled, emailed:true`. `emailed`
  is `record.emailedAt`, which only `btcpay-webhook.js` writes after sending
  the receipt — so the handler provably ran to completion for that order.
- **Lightning, from BTCPay's side:** the owner pasted the delivery itself —
  invoice `9ZBsQf18yuFCy8XGWxcsN4`, delivery `SyTUdMP5UXGzGjS3bUutdu`, webhook
  `A1Fr9xp2yySaurrAgJJx4q`, type `InvoiceSettled`, `isRedelivery: false`,
  metadata `orderId/product/itemCode/buyerEmail` intact. Invoice createdTime
  05:53:46 UTC Sept 9 (derived from the verify route's 72 h `expiresAt`),
  delivery 05:55:17 UTC: **91 s from invoice to settled event, first
  delivery.** The designed KV-race redelivery never had to happen. The HTTP
  status BTCPay recorded for that delivery was not pasted; the emailed flag
  makes it 200 in effect.
- **On-chain:** never bought through, by the owner's choice (correction 1).
  Server-side it is the same `InvoiceSettled` event after one confirmation;
  what stays unexercised is the success page's pending/polling state.
- **Version v2.4.4; speed policy 1 conf from the database** (corrections 4, 5).

## Stripe — checked against the live-mode Dashboard by the owner

- **Payments:** the only one ever is the owner's own $20.94 card test of
  Sept 1 2026 (invoice `LRKWSGZA-0001`), refunded eleven minutes later; its
  Checkout Session completed event fired at 12:31:10. The Dashboard shows
  four weeks; "no purchases since" is the owner's read of that window. **No
  real customer sale yet** stays true, as a fact about sales.
- **Webhook endpoint:** `https://kundalinispines.com/api/stripe-webhook`,
  payload Snapshot, API version `2026-08-26.dahlia`, description names the
  Function. The list of subscribed events was not pasted; the handler was
  proven on `checkout.session.completed` and the other event is unreachable
  (next bullet).
- **Payment methods, 13 enabled:** Cards, Amazon Pay, Apple Pay, Cash App Pay,
  Link, MB WAY, Satispay, Bancontact, BLIK, EPS, Affirm, Klarna, Pix (Cartes
  Bancaires pending). **Every bank debit, bank transfer and voucher method is
  disabled** — those are the only delayed-notification methods, so
  `checkout.session.async_payment_succeeded` cannot fire on this account. If
  the owner ever enables ACH, SEPA, Bacs, bank transfers or a voucher, that
  branch becomes reachable and must be exercised first.
- **Payment link** `buy.stripe.com/3cI28te6d2XsgTh3FSbsc01`: opened from
  Playwright, 200, "Rise Up — Digital Album" at $20.00 with the description,
  offering card, Cash App Pay and Link. The after-payment redirect is not
  visible without paying; the Sept 1 session carried its id to the verify
  route, which is the redirect working.

---

## Verified vs. asserted

**Verified this session:** the Actions run list and every failing step's log
text; the retry behaviour (Chromium, stubbed); every number in the Firefox
table; the window rects; the verify route's response for the Lightning order;
the payment link's content; the deploy run and live smoke after the release
(bottom of file).

**Asserted:**

- **The BTCPay delivery's HTTP status** — inferred 200 from the emailed flag,
  not read.
- **The webhook's subscribed event list** in Stripe — not pasted.
- **"No purchases since Sept 1"** — the owner's read of a four-week Dashboard
  window.
- **That the 03:20 UTC YouTube failures stop.** The retry spans ~110 s; if
  YouTube's bad window at that hour is longer, the run still fails. Watch the
  next few 03:20 runs; the next lever is moving the cron off the top of the
  hour (`23 */6 * * *`), which also shortens GitHub's queue delay.

---

## Do not do these

Earlier lists still stand. New this session:

1. **Do not judge a 60 Hz question from a window dragged onto a 60 Hz
   display.** Both browsers pace from the primary on this box. Use
   `FFRATE=60`, or set the primary to 60 for the run.
2. **Do not follow the Actions log redirect with the GitHub token attached.**
   Take the 302's `Location` and fetch it bare.
3. **Do not remove the retry loop from `youtube-sync.mjs`** or make an
   exhausted retry exit 0 — a persistent failure must stay red.
4. **Do not propose a download-count cap again.** Decided (below).
5. **Do not ask the owner for an on-chain test purchase.** Decided.
6. **Do not paste customer payment detail into a session.** For any future
   Stripe check, date, amount, status and whether the event fired is all that
   is needed; the Sept 1 paste carried full billing detail because it was the
   owner's own card.

---

## What is deliberate, so nobody fixes it

- **No download-count cap, ever.** The owner's reasoning: once a buyer has
  the files they can copy them to anyone, so a cap on the link defends
  against nothing that matters. The 72 h window on the signed link stays, for
  a different reason — a publicly posted link should not be a permanent free
  download on the R2 bill. If that ever shows, shorten the window or rotate
  the key; do not add a cap.
- **Reissue stays manual.** Rare and a human call.
- **No on-chain purchase, and none wanted.**
- **The YouTube cron stays at `0 */6`** for now; change it only if the retry
  proves insufficient at 03:20.
- **Chromium's default launch in the harness stays headless.** It is the
  control and it is faster; the UA reads "HeadlessChrome" and it paces at the
  primary display like everything else. Headed only under `WINPOS`.
- **The Firefox profiles in `perf-out/`** are left on disk; gitignored.

---

## Git state

- **`feature/spine-ui-v2` and `main` both at the release commit** (bottom of
  file). Four commits this session: `34a3070`, `76415e6`, `cdbf781`, plus this
  handoff.
- Worktrees unchanged: `kundalini-spines` (production, `main`),
  `kundalini-spines-spine-ui` (feature, this), `.claude/worktrees/*` for
  assistant sessions — leave them.
- Assistant-side memory (not in the repo) updated: the BTCPay note (no
  on-chain sale; Lightning proof; version; speed policy), the Firefox note
  (display pacing; knobs; 60 Hz results), and two new notes: the Stripe
  Dashboard state and the no-cap decision.

---

## Still open

1. **The remaining Firefox costs, measured and left** (`61` item 2, unchanged
   in order at 60 Hz): the `--nav-h` collapse on the root, then the per-frame
   canvas updates on Music. The second is sky code; `?skydiag` first.
2. **Look at the edge blur on a real screen** (`61` item 3) — the owner had
   not looked when this session closed either.
3. **Watch the 03:20 UTC YouTube runs** for a few days after this release. If
   they still fail, move the cron off the hour.
4. **Stripe:** no real customer sale yet (a fact, not a task); Deluxe and
   Artifact `checkoutUrl: null` and not in the Bitcoin `CATALOG`; the
   subscribed-events list on the endpoint unread.
5. **From `60`/`59`/`58`, unchanged:** copy-vs-state (58 item 6); the polling
   window and manual refund path as stated limits; the WAV package never
   re-checked against the masters; footer chip border unmeasured;
   `--df-sky-out-fwd` at 0.12; the hero decoder stumble.

---

## Starting the next V2 chat

Attach this file. `61` for the Firefox fix and the carousel; `60` for the
BTCPay setup and `BTCPAY-SETUP.md`; `58` for the deep field.

> Here's the latest V2 handoff for Kundalini Spines (Spine UI V2 branch). I
> want to <thing> this session.

The new session needs `C:\Users\Haight\Desktop\kundalini-spines-spine-ui`,
should confirm it is on `feature/spine-ui-v2`, and should run
`python scripts/test-btcpay-functions.py` before touching anything under
`functions/`. **Every push to `main` is a deploy** and happens only on the
owner's word.

---

## The release (written after the push)

- `feature/spine-ui-v2` pushed `3383acb..5fb9abf`; `main` fast-forwarded
  `8fb43f1..5fb9abf` by `git push origin feature/spine-ui-v2:main` on the
  owner's word, Sept 10 2026 ~12:46 UTC. `5fb9abf` is "Add V2HANDOFF 62". The
  first attempt was refused by the assistant's auto-mode permission
  classifier (a push to `main` is a deploy); the owner restated permission in
  chat and the second attempt went through.
- Deploy run **34478760798** ("Deploy site to Cloudflare Pages") completed
  **success** at 12:48:29 UTC.
- Live smoke, kundalinispines.com, right after: home 200 with the title;
  `data/transmissions.json` 200 with 008 on top; `/api/btcpay-verify` for the
  Lightning order still `settled`; `/V2HANDOFF 62.md`, `/BTCPAY-SETUP.md`,
  `/scripts/youtube-sync.mjs` and `/scripts/perf-scroll.py` all fall through
  to the homepage — not served. The YouTube retry is now on the default
  branch and will run at the next scheduled slot.
- This amendment sits on the feature branch only, so `main` lags it by one
  doc-only commit. Normal.
