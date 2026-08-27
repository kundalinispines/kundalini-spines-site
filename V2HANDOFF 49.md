# Kundalini Spines — Spine UI V2 Handoff 49

**Date:** August 27, 2026

Thirty-first handoff of the **Spine UI V2** track (branch `feature/spine-ui-v2`).
`48` owns the purchase track and the Stripe wizard; `47` owns the playback hold
on the sky; `46` owns the two-sided snare gate; `45` owns the album masthead.
The plain `HANDOFF 1`–`19` series documents the dormant production site on
`main`.

**This one leaves the reactive background alone entirely.** It is a navigation
session. `--spine-build`, `--star-build` and `--df-build` are untouched at
43 / 29 / 12, and no stylesheet in the reactive background was opened.

---

## The one-line version

**The album is in the nav.** `Album` sits between Music and Merch on all nine
pages that carry the nav, pointing at `purchase.html`. Fitting a seventh item
into the row needed a gap change, and the reason it needed one is the most
transferable thing in this handoff: **the nav is `position: fixed`, so when its
contents overflow, `scrollWidth` reports nothing wrong.** The break was found by
looking at a screenshot, after two separate numeric checks had said it was fine.

---

## Corrections to earlier handoffs

- **48's "Still open" item 5 is CLOSED.** There is now a nav route to the
  working checkout. Merch is no longer the only way in.

- **48 called it a "Purchase entry". The label that shipped is `Album`.** That
  is deliberate and not a synonym picked at random — `purchase.html` calls
  itself **"Own the Album"** in its `<title>`, in its `<h1 id="own-heading">`,
  and in `merch.html`'s own section heading. The label follows the page's name;
  `purchase.html` is the filename, not the page's voice. **If you are looking
  for item 5's fix by grepping the nav markup for "Purchase", you will not find
  it.**

- **Nothing else in 48 was found to be wrong.** The price-in-four-files warning,
  the no-redirect decision, and the "check `main`, not this branch" deployment
  finding were all re-read this session and all still hold. `main` is still
  untouched and still carries none of the purchase surface.

---

## WHAT SHIPPED

### 1. The `Album` nav entry, on nine pages

`<li><a href="purchase.html">Album</a></li>`, inserted between Music and Merch
in `about.html`, `archive.html`, `connect.html`, `index.html`, `merch.html`,
`purchase.html`, `purchase-success.html`, `purchase-cancelled.html` and
`transmissions.html`.

The nav is **duplicated markup in every page** — there is no JS that injects it
(`js/site-footer.js` does the footer only). So a nav change is a nine-file
change, and nothing notices if one is missed. Same shape of trap as 48's four
price files.

### 2. `purchase.html` can mark itself current

It carried the nav but had no entry of its own, so it was the one real page that
could never set `aria-current="page"`. It now does. `purchase-success.html` and
`purchase-cancelled.html` deliberately do **not** — they are return pages, not
the album page, and they match `connect.html`, which has no current marker
either.

### 3. The gap block in `css/components.css`

```css
@media (min-width: 769px) and (max-width: 840px) {
  .nav__links { gap: calc(22px - 3px * var(--nav-q)); }   /* 22 → 19px */
}
```

**22px is not a new number in the design.** The row's base gap is
`calc(34px - 15px * var(--nav-q))` — 34px at rest, tightening to **19px once
scrolled**. The block makes narrow screens start at 22 instead of 34 and land on
the same 19. The scrolled endpoint is unchanged sitewide.

---

## The measurement trap, which is the real finding

A seventh item does not fit the row at its narrowest. Three consecutive checks
said it did. All three are recorded, because each is a plausible thing to write
again:

1. **`document.documentElement.scrollWidth > clientWidth` returned `false` at
   every width, including the broken ones.** `.nav` is `position: fixed`, so its
   overflowing children never extend the document's scroll width. **A fixed
   header cannot be checked for overflow this way.** Compare the child's
   `getBoundingClientRect().right` against the container's instead — that is
   what the shipped verification does.

2. **A "slack" figure computed as `inner.width - mark.width - links.width` was
   wrong**, because `.nav__inner` is `display: flex` with its own
   `gap: var(--space-6)` and `justify-content: space-between`, and the wordmark
   is itself a shrinkable flex item. The formula reported `-14px` at 769px when
   the real overhang was `+62px`.

3. **A "did the wordmark wrap?" check of `height > 30` was always true**, since
   the mark measures 31px unwrapped. It reported wrapping on every run,
   including the control. A threshold one pixel from the resting value is not a
   check.

**What actually found it: a screenshot.** At 769px the label was visibly cut in
half at the right edge, and HOME was jammed against the wordmark. This is the
second time on this project that the first screenshot found what measurement had
missed — the first was the HUD sliders rendering in default browser blue
(recorded in `kundalini-session-start` step 8). The standing instruction to take
one and *look at it* earned itself again.

### Measured cost of a seventh item

| label | overflows below | at 769px, gap 34 |
|---|---|---|
| (control, 6 items) | — | clears, 27px spare |
| `Buy` | 784px | +15px over |
| `Shop` | 794px | +25px over |
| `Store` | 801px | +32px over |
| `Album` | 804px | +35px over |
| `Purchase` | 831px | +62px over |

**Every candidate broke some part of the 769–830px band**, so the gap change was
required regardless of the label — which is what made the label a pure voice
decision rather than a layout one.

Gap sweep at 769px with the longest label: 34 → +62 over, 30 → +38, 28 → +26,
26 → +14, 24 → +2, **22 → clears by 10px**, 19 → clears by 24px.

### One more tooling note

**`grep -c` for a carriage return reported that every line of every file had
one.** They do not; these files are **LF-only with no BOM**, confirmed by
counting `\r\n` on the raw bytes. The shell pattern degenerated and matched every
line. If you need a file's line endings here, count the bytes — do not grep for
them. This matters because the edit method depends on knowing them.

---

## What is deliberate, so nobody fixes it

- **`Album`, not `Purchase`.** See the correction above. The page names itself.
- **It sits between Music and Merch, and is NOT paired with Merch.** Pairing was
  built first and rejected by the owner: side by side, Album and Merch read as
  two rival shopfronts. After Music, the row follows what a listener actually
  does — hear the record, own the record, then the goods. The rationale is in
  the nav comment in `index.html` so a later session does not "tidy" it back.
- **A plain link, not a CTA button.** The nav is a quiet typographic row over
  footage. A bordered button would be the first CTA in the bar and would have to
  survive bright video frames behind it. Considered and declined.
- **The gap block stops at 840px.** `Album` clears the row unaided from 804px;
  840 covers that with margin and stops before widths that never needed it. The
  12px step at the boundary is only visible while resizing across it.
- **The lab pages were left alone.** `home-deepfield-lab.html` carries a nav,
  but its links **already diverged** before this session — it uses `#about` and
  `#merch` hashes where the real pages use `about.html` and `merch.html`. It was
  never in sync, and the labs' fate is 48's open item 15. `spine-field-lab.html`
  and `transmissions-options.html` were left for the same reason. **This is a
  known, named gap, not an oversight.**
- **No build number was bumped.** `css/components.css` carries none, and neither
  `css/spine-bg.css` nor `css/star-bg.css` was touched. The bump rule is
  specific to those two stylesheets.

---

## How this was verified

Playwright (Python), Chrome for Testing, against `python scripts/serve.py`,
`reduced_motion="no-preference"`, cache-busted on every load.

- **Every desktop width from 769 to 1440px — all 672 of them.** Zero clip, zero
  wordmark collision. Tightest clearance is **24px at 769px** with the gap at
  22px. Checked by comparing the links list's right edge against the container's
  right edge, not by `scrollWidth`.
- **Nav content on all nine pages:** order reads Home / About / Music / Album /
  Merch / Transmissions / Archive on every one, `Album`'s href is
  `purchase.html` on every one, and `aria-current="page"` lands on the right
  item per page — including `Album` on `purchase.html`, which it could never do
  before.
- **Mobile overlay at 390x844:** all seven items in view, spanning y=215 to
  y=629 in an 844px viewport. Screenshot taken and looked at.
- **Click-through:** clicking `Album` in the nav on `merch.html` navigates to
  `purchase.html` and the `<h1>` reads `Own the Album`.
- **Console clean on all nine pages.**
- **Screenshots taken and looked at** at 769, 1440 and 390 wide. The 769 shot is
  the one that mattered — it is what caught the clip.
- **File integrity after every write:** all ten files valid UTF-8, zero CRLF,
  zero mojibake, and the em dash count against `HEAD` changed by **exactly +2,
  in exactly the two files where comments containing em dashes were written**
  (`index.html`, `css/components.css`), and by 0 in the other eight.
- **Edit method:** binary read → explicit UTF-8 decode → exact-match assertion
  per edit → binary write, with every edit computed and asserted **before
  anything was written**, so a failure aborts with the tree untouched. Same
  method 48 used. No Python text-mode writes.
- **Secret scan clean** before the commit — every `sk_` / `whsec_` hit in the
  tree is prose in `STRIPE-SETUP.md` or warning text in the wizard. No `.env`
  exists.

---

## Verified vs. asserted

**Verified by tooling, with screenshots looked at:** everything in the section
above. Nothing visual shipped unseen this session.

**Asserted, not verified:**

- **The live site, again.** `main` was not opened and `kundalinispines.com` was
  not visited. Unchanged from 48, and it does not matter for this change,
  because **nothing here is live** — the nav entry points at `purchase.html`,
  which along with the whole purchase surface exists only on this branch. On the
  running site, nothing changed at all.
- **Browsers other than Chrome for Testing.** The row was measured in one
  engine. The gap block is plain CSS with no novel features, but Safari and
  Firefox were not opened.
- **Touch devices.** The mobile overlay was measured at an emulated 390x844
  viewport, not on hardware.

---

## Do not do these

- **Do not add an eighth nav item without re-measuring.** Seven fit at 769px
  with 24px to spare; the room is gone. The comment in `css/components.css`
  carries the measured numbers — read it first.
- **Do not check a fixed-position header for overflow with `scrollWidth`.** It
  will tell you everything is fine. Compare bounding-rect edges instead.
- **Do not move `Album` back next to `Merch`.** It was built that way first and
  the owner rejected it — the two read as rival shopfronts. The reason is
  recorded in `index.html`'s nav comment.
- **Do not rename `Album` to `Purchase` to "match the file".** The page calls
  itself "Own the Album" in three places.
- **Do not assume a nav change is one file.** It is nine, with no guard.
- Carried from 48 and still binding: **do not set a redirect on the Payment Link
  until the purchase pages are deployed** (check `main`, not this branch); do
  not add `data-ks-price` to `merch.html` expecting the drift guard to catch it;
  **do not change a price in fewer than four files**; never put a Stripe secret,
  restricted key or webhook secret in this repo in any form; do not flip
  Artifact to `available`; do not remove the STANDBY panels until the redirect
  exists.
- Carried and still binding: never `python -m http.server`, never `file://`, no
  Python text-mode writes to JS/CSS/HTML. Do not reach for `s sns` when snare
  strikes are missing; do not quote a snare figure without naming its config; do
  not switch the deep-field observer to `is-spine-pulsing`.

---

## Git state

- Branch `feature/spine-ui-v2`. Session start `87e3f1a`.
- **One commit, pushed**, working tree clean, 0 ahead / 0 behind origin:
  - `eb2000e` — the Album nav entry, and the gap block
- **Ten files touched:** the nine pages carrying the nav, plus
  `css/components.css`. +45 / -4.
- **No new binaries. 0 bytes of media added.**
- `--spine-build` 43, `--star-build` 29, `--df-build` 12 — **all untouched.**
- `main` untouched, now 174 commits behind (counted before this handoff's own
  commit, which is the convention 48 used). No PR.

---

## Still open

**The purchase track (48's list, with item 5 now closed):**

1. **Live mode.** A live-mode Payment Link is a different URL; swapping it is a
   one-line edit in the digital slot of `js/purchase-checkout.js`. Waits on the
   owner deciding they are ready to take real money.
2. **Nothing delivers the album.** No download, no expiring link, no
   confirmation email, no numbering, no order storage. Under Payment Links this
   is manual: Stripe says someone paid, the owner sends it by hand.
3. **Deluxe and Artifact.** Both need size, variant and numbering a Payment Link
   cannot carry. Artifact has no production run.
4. **The purchase pages are not deployed** — nor `merch.html`, nor
   `connect.html`. **This is now the sharpest item on the track**, because the
   nav promises a route that only exists on this branch. A whole-site release
   decision, not a Stripe one.
5. **A refund and delivery policy page** does not exist. Stripe Tax is a
   Dashboard toggle nobody has looked at.

**Carried from 47/48, unchanged:**

6. Whether phones should pay the 120.4KB of feather masks.
7. Whether the glow and the foreground ever ship. Both judgeable at `/?tune`.
8. Assign masks 04–07 to rows, or call 3 / 1 / 2 final.
9. Judge the hero-wait (~675ms).
10. A glow gradient block for `rain-transmission-rooftop`.
11. A JS transcription of the vertebral rhythm for mask 06, plus a parity story
    for 07.
12. Mobile judgement calls (41's item 5): nav links 25px, tablets ≥768 taking
    the 4.9MB clip, About at 3.55:1 under AA.
13. Whether the VHS should run on phones.
14. **The labs' fate** — and this session added to it. `home-deepfield-lab.html`
    duplicates `index.html` but its nav now differs in two ways, not one: the
    old `#about`/`#merch` hashes **and** the missing `Album` entry.
    `deep-field-lab.html` is separately stale, listing `js/deep-field-bg.js`
    while running its own old copy.
15. A `-g 48` re-export of the spine render.
16. A leg-aware clip pause while the sky holds, if the invisible decode ever
    shows up in the frame budget.
17. The two filmrow labs still scrubbing; the doc-rail ring inversion; the
    frame-budget decision; `music.html` still a redirect stub; stale amber-era
    `?tune` TIPS prose; the two missing trivia files; the astral scrim; the
    inherited pile.

---

## Starting the next V2 chat

Attach this file. The working folder is
`C:\Users\Haight\Desktop\kundalini-spines-spine-ui` on `feature/spine-ui-v2`.
Serve with `python scripts/serve.py`, browse `http://localhost:8000` — never
`file://`, never `python -m http.server`.

**The purchase track is now blocked entirely on decisions, not code.** Items 1–3
and 5 all wait on the owner or on Stripe's Dashboard, and **item 4 — deploying
the purchase surface — is the one this session made more urgent**, because the
nav now offers a route to a page production does not have. That is a release
decision to put to the owner, not a change to make.

If the next session wants code, **item 14, the labs**, is still the one that
decays: three of them now claim to be things they are not, and this session
widened the gap by one nav entry rather than closing it.
