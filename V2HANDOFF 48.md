# Kundalini Spines — Spine UI V2 Handoff 48

**Date:** August 27, 2026

Thirtieth handoff of the **Spine UI V2** track (branch `feature/spine-ui-v2`).
`47` owns the playback hold on the sky; `46` owns the two-sided snare gate; `45`
owns the album masthead. The plain `HANDOFF 1`–`19` series documents the dormant
production site on `main`.

**This one leaves the reactive background alone entirely.** It is a purchase
session: the owner set real prices and connected the Digital Edition to a Stripe
Payment Link in test mode. `--spine-build`, `--star-build` and `--df-build` are
untouched at 43 / 29 / 12.

---

## The one-line version

**The Digital Edition can take a payment.** It is $20, the link is test mode,
and the whole path — button, hosted checkout, Succeeded in the Dashboard — has
been walked end to end by the owner. Two things were found on the way: the price
lived in **four** files and only one of them was guarded, and `STRIPE-SETUP.md`
had been telling every reader that the return pages were live when they have
**never been deployed at all**.

---

## Corrections to earlier handoffs

- **47's open items 1, 2 and 3 were already closed before this session began,**
  by commit `635efa6` on Aug 26, which landed *after* 47 was written and never
  got a handoff of its own. It is comment-only. The owner played a sample,
  scrolled out through Merch with the nebula held, and judged both the hold and
  the body copy over it: **`--df-hold-play` stays at 1, the `hold` slider stays
  in the tuner at their request, and the 18.0%-under-4.5:1 contrast measurement
  is now recorded in `css/deep-field-bg.css` as a cost that was accepted, not an
  open defect.** The sky-side scrim is explicitly not wanted. In the same commit
  the fork strike was finally measured on a phone (390x844, the owner's live
  config): 9 forks in 76 strikes, 0.118 against the 0.12 asked for, histogram
  clean at 67 ones and 9 fives with nothing between, and 14.9% frame coverage
  against the desktop's 13.3%. **If you are reading 47's "Still open" list, the
  top three items are gone.**

- **`STRIPE-SETUP.md` section 4 said the two return pages were "built and live
  in the repo root". They have never been live.** `.github/workflows/deploy-pages.yml`
  builds GitHub Pages from **`main`**, and `main` contains no `purchase.html`,
  no `purchase-success.html`, no `purchase-cancelled.html`, no `merch.html` and
  no `connect.html` — checked file by file, not inferred. The entire purchase
  surface exists only on this branch, which is now **172 commits ahead of main**.
  Section 4 now opens with that correction.

- **`STRIPE-SETUP.md` said the price lived in two files. It lived in four,** and
  the fourth was silently stale. See below.

- **The doc's Stripe UI labels were out of date.** It said "After payment →
  Redirect to a page". The Dashboard reads **"After the payment"** then
  **"Confirmation page"**. The current labels were taken from
  `docs.stripe.com/payment-links/create` and `/post-payment` on Aug 27 2026, not
  from memory, and both the doc and the wizard say so at the point of use.

---

## WHAT SHIPPED

### 1. Real prices — $20 / $42 / from $75

The owner set the Digital Edition to **$20** as the base and asked that the
other two hold the ladder's existing shape, so the old 25 and 45 were scaled by
the same 20/12 and rounded to **42** and **75**. The felt distance between the
tiers is unchanged: 1 / 2.08 / 3.75 became 1 / 2.10 / 3.75.

Everything before this was placeholder. The only price the project had ever
carried on its own was a hardcoded `$1` per-track download in
`js/track-experience.js`, removed Aug 20 2026.

### 2. The fourth price file, which nothing was watching

`merch.html` prints all three prices again on its album section. It carries
**no `data-ks-price`** and **does not load `js/purchase-checkout.js` at all**,
so the drift guard in `bindButtons()` is structurally blind to it. Its prices
were still reading the old 12 / 25 / 45.

**It was caught only by grepping for the digits before editing.** No tooling
would ever have reported it. `STRIPE-SETUP.md` was unguarded the same way and
had been wrong for a week, still quoting a 12 / 35 / 150 set that no file had
carried since Aug 20.

All four now carry a comment naming what guards them and what does not.
`merch.html`'s says explicitly that **adding `data-ks-price` there would not
help**, because the guard lives in a module that page never loads — the obvious
fix is the wrong one.

### 3. `scripts/stripe-payment-link.sh` — the wizard

472 lines, 6 stages, built from the `wizard` skill's template (the library above
the `STAGES` marker is stock and must not be hand-edited).

- **It asks for no keys.** Payment Links need none here, so it writes no `.env`
  and sets no GitHub secret even though the library supports both. It says at
  three separate points that an `sk_` or `whsec_` prompt means you are on the
  wrong path.
- **It refuses to set a redirect**, and says why (see below).
- It rejects `#`, empty input and bare `http://`, warns when a URL does not look
  like a test link, and writes into the **digital block alone**.
- `REPO_ROOT` goes through `cygpath -m`. Git Bash's `pwd` returns
  `/c/Users/...`, which a native Windows python cannot open; MSYS usually
  rewrites it in the environment but that is a heuristic and not worth trusting
  for a file the script overwrites. **Not `-w`** — its backslashes are escapes
  to bash.

Run it with the **absolute** path; the relative form fails unless you are
already in the repo root:

```
& "C:\Program Files\Git\bin\bash.exe" "C:\Users\Haight\Desktop\kundalini-spines-spine-ui\scripts\stripe-payment-link.sh"
```

`bash` is not on PowerShell's PATH on this box. It is at
`C:\Program Files\Git\bin\bash.exe`. Both backslash and forward-slash absolute
forms work — Git Bash normalises the path on the way in, so `dirname` gets
something usable.

### 4. The Digital Edition is connected

`checkoutUrl` for `digital` is `https://buy.stripe.com/test_5kQbIT7b6gYhfc8aQBaIM00`.
Written by the wizard, owner driving the Dashboard.

Deluxe keeps its `null` and returns `not-configured`. Artifact keeps
`status: 'coming-soon'` and refuses before it ever looks at a URL.

---

## What is deliberate, so nobody fixes it

- **No redirect is set on the Payment Link, and this is the single most likely
  thing to get "fixed" by someone who has not read section 4.** The link uses
  Stripe's own hosted confirmation page because `purchase-success.html` is not
  deployed. Pointing it at that URL would land a paying customer on a **404** —
  the exact failure the `null` in `checkoutUrl` exists to prevent, arriving
  through the Dashboard where no guard in this repo can see it.
- **This costs nothing later.** "After the payment" is editable on an existing
  link, so the same link gains the branded page the day the pages deploy. No new
  link, no code change. Verified in Stripe's docs, not assumed.
- **The STANDBY panels on both return pages stay up.** They are correct while
  nobody is routed to those pages. They come down in the same change that adds
  the redirect, or they become the new lie.
- **Test mode, deliberately.** A live-mode link is a different URL. Swapping it
  is a one-line edit in the same slot.
- **No shipping address on the Digital link.** It is a download; collecting an
  address would be collecting data with no page explaining it.
- **The prices are a decision now, not scratch numbers.** Do not round them
  toward tidier ones.

---

## How this was verified

Playwright (Python), Chrome for Testing, against `python scripts/serve.py`,
1440x900, `reduced_motion="no-preference"`.

- **Prices, before the link:** `purchase.html` renders 20 / 42 / 75 with
  `data-ks-price` agreeing on all three; `merch.html` renders the same three;
  `KSPurchase.start()` returned `not-configured` for digital and deluxe and
  `coming-soon` for artifact; **no drift warning fired**; console clean on both
  pages. Screenshot taken and looked at.
- **The wizard's config editor**, tested against a copy before it was ever
  pointed at the real file: `null` → URL → different URL is idempotent, exactly
  one line changes, deluxe and artifact keep their two nulls, artifact keeps
  `coming-soon`, prices stay 20 / 42 / 75, and the em dash and section sign
  counts hold at 47 and 5.
- **The redirect path was dry-run before the owner ever opened Stripe** — a fake
  URL applied to the real config with the outbound request aborted at the
  network layer. The module parsed it, clicking "Own the Digital Album" issued a
  real navigation to it, the other two still refused, console clean. Reverted
  immediately. **So the code half was known-good before the Dashboard half was
  attempted.**
- **After the real URL landed:** exactly one line differs from HEAD (line 101,
  the digital slot), line count unchanged, braces balanced, valid UTF-8, no
  mojibake, em dash and section sign counts identical to HEAD at 47 and 5 —
  which is what proves the comment-dense file survived the edit. Clicking the
  real button navigated to **exactly** the configured URL, compared
  string-for-string rather than by eye. Console clean.
- **Stage 1 of the wizard was run end to end with a declined prompt**: opens no
  browser, reads the live config through its python helper, exits 0 changing
  nothing.
- **The section 7 secret scan is clean** — no `sk_live`, `sk_test`, `whsec_`,
  `rk_live` or `rk_test` anywhere in the tree. No `.env` exists.
- **All four price files are valid UTF-8 with no mojibake** — only the
  pre-existing U+00A7, U+2014, U+2192 and U+00D7.

---

## Verified vs. asserted

**Verified by tooling and looked at:** everything in the section above.

**Asserted, not verified:**

- **The test purchase succeeded.** The owner reports the payment completed and
  shows as **Succeeded** in the test payments page, and they can see it there.
  This session cannot reach their Stripe account and did not check it.
- **The live site.** `kundalinispines.com` could not be reached from this
  session — external navigation was blocked. The deployment finding comes from
  `.github/workflows/deploy-pages.yml` and `main`'s file tree, which are
  authoritative for what *would* be served, but **nobody has looked at the
  running site this session.**
- **`shellcheck` was not run** on the wizard. It is not installed on this box.
  The script has had `bash -n` only, plus the stage-1 live run.
- **Stages 2, 3, 5 and 6 of the wizard have only been run once, by the owner.**
  Their prose has not been re-read against a second Dashboard pass, and Stripe
  moves its UI.

---

## Do not do these

- **Do not set a redirect on the Payment Link until the purchase pages are
  actually deployed.** It would 404 a paying customer. Check `main`, not this
  branch, before believing any page is live.
- **Do not add `data-ks-price` to `merch.html` expecting the drift guard to
  catch it.** The guard is in a module that page does not load. If you want
  merch.html guarded, the page has to load the module — that is a real change,
  not an attribute.
- **Do not change a price in fewer than four files.** `js/purchase-checkout.js`
  (the source of truth), `purchase.html`, `merch.html`, `STRIPE-SETUP.md`. Only
  the second is guarded.
- **Do not put a Stripe secret key, restricted key or webhook secret in this
  repo**, in any form, ever — including a commit that gets reverted, because git
  keeps it. Payment Links need none. If one is ever pasted in, roll it in the
  Dashboard; deleting the file is not enough.
- **Do not flip Artifact to `available` just because it has a price.** It is a
  numbered physical object and the run does not exist.
- **Do not remove the STANDBY panels** until the redirect exists.
- **Do not run the wizard with a relative path from outside the repo root** —
  and note `bash` is not on PowerShell's PATH here.
- Carried and still binding: never `python -m http.server`, never `file://`, no
  Python **text-mode** writes to JS/CSS/HTML (this session's edits all went
  through binary read / explicit-UTF-8 decode / binary write with an exact-match
  assertion per edit, and one edit run was aborted mid-way by a failed assertion
  rather than writing a half-applied file). Do not reach for `s sns` when snare
  strikes are missing; do not quote a snare figure without naming its config; do
  not switch the deep-field observer to `is-spine-pulsing`.

---

## Git state

- Branch `feature/spine-ui-v2`. Session start `635efa6`.
- **Three commits, all pushed**, working tree clean, 0 ahead / 0 behind origin:
  - `eddc724` — the prices, and the fourth price file
  - `fb600b8` — the wizard, and section 4's correction
  - `57d04e2` — the live test-mode URL
- **Five files touched:** `js/purchase-checkout.js`, `purchase.html`,
  `merch.html`, `STRIPE-SETUP.md`, and the new `scripts/stripe-payment-link.sh`.
- **No new binaries. 0 bytes of media added.**
- `--spine-build` 43, `--star-build` 29, `--df-build` 12 — **all untouched.** No
  stylesheet in the reactive background was edited, so none needed bumping.
- `main` untouched, now 172 commits behind. No PR.

---

## Still open

**The purchase track, newly opened by this session:**

1. **Live mode.** A live-mode Payment Link is a different URL; swapping it is a
   one-line edit in the digital slot. Needs the owner to decide they are ready
   to take real money, and to have done one real purchase and refund of their
   own (section 7's live checklist).
2. **Nothing delivers the album.** No download, no expiring link, no
   confirmation email, no numbering, no order storage. Under Payment Links this
   is entirely manual: Stripe says someone paid, the owner sends it by hand.
   Automating any of it means option (b), a serverless backend, and
   `STRIPE-SETUP.md` says do not build that speculatively.
3. **Deluxe and Artifact.** Both need size, variant and numbering that a Payment
   Link cannot carry. Artifact also has no production run.
4. **The purchase pages are not deployed** — and neither is `merch.html` or
   `connect.html`. This is the V2-to-production question wearing a different
   hat, and it is a whole-site release decision, not a Stripe one.
5. **No Purchase entry in the nav** (was 47's item 7). This is sharper now than
   it was: the Digital Edition is genuinely buyable and the only way to the page
   is through Merch.
6. **A refund and delivery policy page** does not exist. Stripe Tax is a
   Dashboard toggle nobody has looked at.

**Carried from 47, unchanged:**

7. Whether phones should pay the 120.4KB of feather masks.
8. Whether the glow and the foreground ever ship. Both judgeable at `/?tune`.
9. Assign masks 04–07 to rows, or call 3 / 1 / 2 final.
10. Judge the hero-wait (~675ms).
11. A glow gradient block for `rain-transmission-rooftop`.
12. A JS transcription of the vertebral rhythm for mask 06, plus a parity story
    for 07.
13. Mobile judgement calls (41's item 5): nav links 25px, tablets ≥768 taking
    the 4.9MB clip, About at 3.55:1 under AA.
14. Whether the VHS should run on phones.
15. **The lab's fate**, now that `home-deepfield-lab.html` duplicates
    `index.html` — and `deep-field-lab.html` is separately stale, listing
    `js/deep-field-bg.js` but running its own old copy (`--df-build` computes
    empty there).
16. A `-g 48` re-export of the spine render.
17. A leg-aware clip pause while the sky holds, if the invisible decode ever
    shows up in the frame budget. Not a bug today; a known cost.
18. The two filmrow labs still scrubbing; the doc-rail ring inversion; the
    frame-budget decision; `music.html` still a redirect stub; stale amber-era
    `?tune` TIPS prose; the two missing trivia files; the astral scrim; the
    inherited pile.

---

## Starting the next V2 chat

Attach this file. The working folder is
`C:\Users\Haight\Desktop\kundalini-spines-spine-ui` on `feature/spine-ui-v2`.
Serve with `python scripts/serve.py`, browse `http://localhost:8000` — never
`file://`, never `python -m http.server`.

**Nothing on the purchase track is blocked on code.** Items 1–3 all wait on the
owner, and item 4 is a release decision. If the next session wants purchase
work, the useful one is **item 5, the nav entry** — it is the only place where a
working checkout is currently hard to reach, and it is a small, self-contained
change that needs a design call rather than a Stripe call.

Otherwise the reactive-background list is where the momentum was before this
session, and **item 15, the labs**, is the one that gets worse the longer it is
left: two of them now claim to be things they are not.
