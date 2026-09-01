# Kundalini Spines — Spine UI V2 Handoff 54

**Date:** August 31, 2026

Thirty-sixth handoff of the **Spine UI V2** track (branch `feature/spine-ui-v2`).
`53` owns the sky saga and the Cloudflare Browser Cache TTL setting; `52` owns
the coinc-110 retune; `51` owns the Cloudflare migration recipe. **This
session:** no sky work at all — the owner moved to **Stripe**, began live-account
activation, and the session found and fixed a copy bug on the success page that
would have told a paying customer their money was never taken.

---

## The one-line version

The owner started Stripe live activation and was advised **not** to copy the
sandbox across; `STRIPE-SETUP.md` sections 4 and 6 were corrected to match a
live domain and a live account; the three prices were audited and found
correct at 20/42/75; and the success page's **STANDBY panel — unconditional
markup reading "nothing has been charged and no order exists" — was found
still printing beneath the order reference**, fixed, released to `main` on the
owner's word, and verified on the live domain.

---

## Corrections to earlier handoffs

- **53's closing paragraph says the site is live "at star-build 32."** It is
  not, and 53's own Git-state section three paragraphs earlier says so: four
  releases shipped that session, ending at **build 36** (`902bfac`). The files
  carry 36, the live site serves 36. Trust 53's Git-state section, not its
  closing paragraph.
- **The production worktree drifts behind `main` after every release, and this
  is normal.** At session start `C:\Users\Haight\Desktop\kundalini-spines` (on
  `main`) was **4 commits behind `origin/main`** — star-build **34** on disk
  while origin and the live site were at **36**. Nothing was wrong: releases go
  out as `git push origin feature/spine-ui-v2:main`, which updates the remote
  branch and never touches that local checkout. It was fast-forwarded this
  session (`6e4d90e..902bfac`, clean). **Expect this after every release** — it
  is bookkeeping, not a discrepancy, and it does not affect what is served.
- **`STRIPE-SETUP.md` §4 was stale in a way that mattered.** It said in bold
  that the return pages were BUILT but NOT LIVE and not to set a Payment Link
  redirect. True on GitHub Pages built from `main`; false since the Cloudflare
  deploy shipped the purchase surface on Aug 30. Corrected — see below.
- **`STRIPE-SETUP.md` §6 item 1 said "no account, no keys, no products, no
  prices, no links."** The sandbox had held a product, a price and the test
  Payment Link for some time, and a live account now exists. Corrected.

---

## The near-miss: STANDBY told paying customers nothing was charged

This is the session's real find, and it is worth reading in full because of
**how** it was found.

`purchase-success.html` carried a status panel as **unconditional markup**:

> STANDBY. Purchasing is not open yet — no payment processor is connected to
> this site, so nothing has been charged and no order exists. If you have
> reached this page, you reached it directly.

Harmless while nothing linked to the page. But this page exists to be a
Payment Link's redirect target. **The day a live link gained that redirect, a
customer who had just paid $20 would have read "nothing has been charged and
no order exists" — printed directly beneath their own order reference**, which
the page fills in from `?session_id=`.

The page's inline script already read `session_id` to reveal the order
reference. It never touched the STANDBY panel. So the page had one arrival it
handled correctly and one it contradicted itself on.

**How it was found: by reading the page while answering "what is my success
URL".** Not by a test, not by a guard, not by a screenshot. **Nothing in this
project tests any page's copy against its own query string**, and nothing
would have caught this before a real buyer did. That gap is still open — the
fix closes this instance, not the class.

### The fix (`a07b51c`)

The panel takes a `data-ks-standby` hook and the existing inline script hides
it when `session_id` is present — the same signal that reveals the order
reference, and the only signal the page gets that a processor sent this
visitor rather than that they typed the URL.

Verified in Chrome via Playwright, **three arrivals, locally and then again on
the live domain**:

| Arrival | STANDBY | Order reference |
|---|---|---|
| No query string | visible | hidden |
| `?session_id=cs_test_…` | **hidden** | visible, echoes the ID |
| JavaScript disabled | survives in markup | hidden |

No console errors on any. The buyer view closes up with no gap where the panel
was — screenshotted and looked at, both states.

---

## Stripe: the live account, and why the sandbox was not copied

The owner began live activation and was offered Stripe's copy-from-sandbox.
**They declined and started live clean, on this session's recommendation.**
The reasoning is recorded in `STRIPE-SETUP.md` §6 item 1 so nobody undoes it:

- The sandbox holds **one** product (Digital), one $20 price, one test Payment
  Link. Deluxe and Artifact were never created there. There is nearly nothing
  to copy.
- **Copying saves no code change.** Live mints different `prod_`/`price_` IDs,
  and a copied Payment Link gets a **new `buy.stripe.com` URL** regardless —
  the `test_` URL in `js/purchase-checkout.js` has to be replaced either way.
- Copying carries experimentation debris into the account that takes real
  money, and pruning it later costs more than typing three products now.

### The URLs, settled

**Success URL** — live, verified, safe to use as of this session's release:

```
https://kundalinispines.com/purchase-success?session_id={CHECKOUT_SESSION_ID}
```

Paste the token braces literally. Measured Aug 31: Cloudflare Pages answers
the `.html` name with a **308 to the extensionless path** and **carries the
query string through the hop**, so the token survives either form — but give
Stripe the clean URL so a paying customer does not spend a redirect reaching
their own receipt.

**Cancel URL** — `https://kundalinispines.com/purchase-cancelled` exists and is
live, but **Payment Links have no cancel-redirect field**. It only becomes
reachable under Checkout Sessions. Nothing links to it today.

**Download URL** — **there is none, and there is no field asking for one.**
Nothing on this site generates a download link; the success page has no
download button by deliberate rule (its own comment at ~line 222 forbids one)
and instead promises an expiring link sent by email. That link is the
fulfilment Worker, which does not exist.

---

## The price audit — checked, and NOT changed

Run because §2 warns the three prices live in four files and drift silently,
and because `merch.html` is guarded by nothing and was caught stale once
before. **All four agree at 20 / 42 / 75:**

| Source | Digital | Deluxe | Artifact |
|---|---|---|---|
| `js/purchase-checkout.js` (source of truth) | `20` | `42` | `75` |
| `purchase.html` (guarded) | `$20` | `$42` | From `$75` |
| `merch.html` (**unguarded**) | `$20` | `$42` | From `$75` |
| `STRIPE-SETUP.md` §2 table | $20 | $42 | $75 floor |

Verified beyond the grep: the drift guard **ran silent** in a real browser on
`purchase.html`, and each `data-ks-price` attribute matches its own displayed
text (`20`→`$20`, `42`→`$42`, `75`→`$75`). That second check is worth keeping —
the guard compares the attribute to the config, never to what a customer
actually reads, so attribute and text can drift from each other unseen.

The only other dollar figures in the tree are history, not live prices: the
`$1` per-track download removed Aug 20, and the `$12 / $35 / $150` set the
document quotes as its own past error.

---

## Verified vs. asserted

**Verified this session, in Chrome via Playwright:** the STANDBY fix in all
three arrivals, locally *and* on `kundalinispines.com` after the release; the
price drift guard silent; `--star-build: 36` reading from the browser on the
home page; the success/cancel/purchase pages returning 200 on the live domain
with the query string surviving the 308.

**Asserted, NOT verified:** the live Stripe account's existence and state.
That is entirely **the owner's report** — no session has authenticated against
the Stripe Dashboard, and none should without being asked. `STRIPE-SETUP.md`
§6 item 1 carries this caveat in the document itself.

---

## What is deliberate, so nobody fixes it

- **STANDBY defaults to visible and is hidden by JS, not the reverse.** With
  JS off, or no query string, STANDBY is the truthful state of the site. A
  buyer with JS off therefore still sees it and still sees no order reference
  — that pair is the honest failure, and it beats hiding the status from
  everyone before a checkout exists.
- **The `session_id` value is not validated.** A fabricated `?session_id=x`
  hides a status note and shows a meaningless reference to whoever typed it.
  The authority on whether an order exists is the webhook, never this page.
- **§4's Aug 27 warning was kept, not deleted** — marked as history with its
  conclusion voided. Its reasoning is why that section now measures the live
  URL instead of asserting it.
- **`checkoutUrl` is still `null` for Deluxe and Artifact** — but for §6's
  reason now (nothing fulfils an order), not the 404 risk, which no longer
  exists.
- Everything in 53's deliberate list stands (the `ks.skyLock` single width;
  the seed not using `screen.height`; 52's list beneath it).

## Do not do these

- **Do not copy the Stripe sandbox into the live account.** The owner
  deliberately declined; see the reasoning above before re-suggesting it.
- **Do not improvise a download URL.** Never put the album ZIP's address in
  public HTML/JS, a data attribute, a Stripe field, or this repo. §6 item 2:
  a hard-to-guess path is not protection, it is a URL, and URLs get shared —
  and an unsigned one cannot be revoked.
- **Do not re-add the "pages are not live" warning to §4.** They are live;
  the measurement is in the document.
- **Do not add `data-ks-price` to `merch.html` expecting the guard to see it**
  — that page never loads the module (carried, still true).
- Carried and binding: no `main` sync unprompted (it DEPLOYS); do not revert
  the Cloudflare Browser Cache TTL; no GitHub Pages; no fulfilment Worker
  unprompted; never `python -m http.server`, never `file://`; no paid
  deliverables in the repo; no Python text-mode writes to JS/CSS/HTML.

---

## Git state

- Branch `feature/spine-ui-v2`. Session start `c0cf303`; `origin/main` was
  `902bfac` (one behind, deployed).
- Commits: `ca9eaab` (STRIPE-SETUP §4/§6 corrections) and `a07b51c` (the
  STANDBY fix) — both pushed.
- **Released on the owner's explicit "sync main":** `main` fast-forwarded
  `902bfac..a07b51c`. Deploy landed in ~20s and was **verified on the live
  domain**, both arrivals. Three commits shipped; only `purchase-success.html`
  is a deployed file — the two `.md` files are not in the allowlist, so the
  doc corrections travel with the repo and change nothing served.
- Leak-checked before the release: the only `sk_`/`whsec_` match in the diff
  is the prose sentence saying no such key exists.
- Also done: the production worktree fast-forwarded `6e4d90e..902bfac` (local
  bookkeeping, deployed nothing).
- Session end: working tree clean, local and remote in sync, `origin/main` =
  `a07b51c` = branch head.

---

## Still open

1. **Create the three live Stripe products, prices and Payment Links, then
   swap the test URL.** `js/purchase-checkout.js` line ~101 still points at
   `https://buy.stripe.com/test_5kQbIT7b6gYhfc8aQBaIM00`. Until that swap the
   buy button is wired to test mode and **takes no real money** — a safe
   failure, not a broken one. The success URL above is now safe to set as the
   redirect; that gate is cleared.
2. **The fulfilment Worker — now the blocking gate on Digital.** A live
   Digital sale delivers nothing automatically: no download issuance, no
   confirmation email, no order storage (§6 items 2, 3, 6). The buyer waits on
   a hand-sent email. Deluxe and Artifact are less exposed — those were always
   going to be shipped by hand. **Do not open Digital sales before deciding
   this is acceptable.**
3. **Nothing tests any page's copy against its own query string.** The STANDBY
   bug is fixed; the class of bug is not. `purchase-cancelled.html` has never
   been read against a real arrival.
4. **The listen test at coinc 110** (52's item 1, unchanged).
5. **`STRIPE-SETUP.md` GitHub-Pages sweep** — §1 and others still describe the
   retired host. Deliberately deferred (53's item 5). This session's edits did
   not widen it: the only GitHub-Pages mention touched is inside §4's
   historical block, where it belongs.
6. **Live Stripe link swap** (folded into item 1), refund & delivery policy
   page, Stripe Tax.
7. **MCP OAuth from an interactive session** — the authed Cloudflare servers
   still will not load headless.
8. Deluxe/Artifact phase 2.

**The sky saga stays CLOSED** — 53 item 1, closed on the owner's word at build
36. No sky code was touched this session. If it is reopened, re-read 53's
three-clocks proof first and do not re-attempt page-side compensation.

**Carried from 47–53, unchanged:** phones and the feather masks; glow
judgement at `/?tune`; masks 04–07; the hero-wait; rooftop glow; mask-06
transcription; 41's mobile calls; VHS on phones; the labs' fate; the `-g 48`
re-export; leg-aware clip pause; filmrow labs; doc-rail ring inversion;
`music.html` stub; stale TIPS prose; missing trivia files; astral scrim; the
inherited pile.

---

## Starting the next V2 chat

Attach this file. Working folder
`C:\Users\Haight\Desktop\kundalini-spines-spine-ui` on `feature/spine-ui-v2`
(**not** the production `kundalini-spines` folder). Serve with
`python scripts/serve.py` — never `file://`, never `python -m http.server`.
The site is LIVE at https://kundalinispines.com at star-build 36; a release to
`main` deploys, and only on the owner's word.

**Likely first task:** the owner returns with a live Stripe Payment Link URL
for the Digital Edition. The swap is one line in `js/purchase-checkout.js` —
but read item 2 above before treating it as routine, and say plainly what a
buyer will and will not receive.
