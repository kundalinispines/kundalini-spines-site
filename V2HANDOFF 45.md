# Kundalini Spines — Spine UI V2 Handoff 45

**Date:** August 21, 2026

Twenty-seventh handoff of the **Spine UI V2** track (branch `feature/spine-ui-v2`).
`44` owns the deep-field deep-link fix and the 44px touch target; `43` owns the
feather going live, the About page and the purchase rough-in; `42` owns the seven
feather masks. The plain `HANDOFF 1`–`19` series documents the dormant production
site on `main`.

---

## The one-line version

**The album cover now stands on all three purchase surfaces — `purchase.html`,
`merch.html`, `purchase-success.html` — out of one shared block in
`css/purchase.css`; the nav's About and Merch stopped scrolling the home page and
now open `about.html` and `merch.html`; and `.btn--primary` stopped losing its
label colour on hover. Two new binaries for the cover (256 KB for both sizes),
plus one untracked reference PNG swept in at the owner's call.**

---

## Corrections to earlier handoffs

- **44's open item 5 — "No Purchase entry in the nav — a seven-file edit" — is
  still open, but its stated cost is now wrong.** The seven-file nav edit it was
  warning about was *done this session*, across **eleven** files, for a different
  reason. Adding a Purchase item later is the same mechanical edit to the same
  eleven `<ul class="nav__links">` blocks, and it is no longer novel work. What
  keeps item 5 open is the *design* question (does Purchase belong in a six-item
  bar), not the edit cost.

- **`merch.html`'s stylesheet banner claiming "no other page's header lists this
  one" is now false, and it was deliberately left in place** rather than deleted.
  A note beneath it says so and says to read the original line as history. If a
  later session greps that sentence and believes it, that is the trap — the
  correction is directly under it.

- **`purchase-success.html`'s banner saying "the five stylesheets are the
  root-page set" is one short.** It now loads six; `css/purchase.css` was added
  after `site-footer.css`. The banner was kept because its *order* claim is still
  load-bearing and still true — tokens, base, star-bg, components, site-footer —
  and dropping `star-bg.css` still renders the page pure black with a silent
  console. The new note records the addition instead of rewriting the old text.

- **44's "no new binaries, 0 bytes of media added" was true of 44 and is not true
  of this session.** 256 KB of WebP plus a 2.7 MB reference PNG landed here.

## WHAT SHIPPED

### 1. The album masthead — one component, three pages

`css/purchase.css` +246 in the head of the file, plus a verification block at the
foot. `purchase.html`, `merch.html`, `purchase-success.html` each mount it.

`.ks-own__album` is a two-column grid — `minmax(0, 400px) 1fr`, cover left, the
page's existing head copy right, `align-items: start`. `.ks-own__cover` is a
`<figure>` whose `<img>` drops its bottom border so the `.ks-own__cover-cap`
strip beneath it can carry a full one: the two share a single hairline and what
renders is a sleeve with a filing label on it, not a picture with a grey chip
under it. **Measured seam: 0.00px on all three pages at all three widths.** If a
future edit puts the bottom border back on the image, that line doubles.

**The cover is shown once, above the tiers, not inside them.** The owner's ask
was "somewhere in the purchase cards"; it was tried there and rejected for three
reasons written out in full above `.ks-own__album` in `purchase.html` — the same
image three times reads as decoration, it spends the four small differences
`.ks-edition--deluxe`'s emphasis is built from, and art inside a catalogue frame
is the ecommerce product tile the page was told not to be.

**`purchase-success.html` takes a `--sm` variant at 240px**, because at the
shopfront's 400px the sleeve outweighs TRANSMISSION RECEIVED, which is Anton at
`--fs-hero` and is meant to be read first. That variant carries a **specificity
trap that is documented at length and must not be re-broken**: `.ks-own__album--sm`
is `(0,1,0)`, exactly the same as the `.ks-own__album` inside the 880px media
block, and a media query adds no specificity — so the two are separated **by
source order only**. It shipped the wrong way round for one pass and the phone
never stacked: 390×844 held two columns and squeezed them to an **85px cover**,
with nothing in the console to say why. The rule now sits above the media block
*and* has its selector named inside it.

**The caption strip's wash is 0.94, deeper than the footer's 0.88, and that is
the one place in the file that departs from it.** The full alpha sweep across
three pages × three viewports is tabled at `.ks-own__cover-cap`. 0.88 does pass —
its worst cell is 4.52 against AA's 4.5 — but that is two hundredths of a ratio
point, off one pinned keyframe of a sky whose twinkle and cloud layers are not
phase-locked. 0.94 moves the worst cell to 5.12.

**Two ways to mis-measure that strip, both of which happened:** clipping the
border box instead of the content box (the 1px border is ~5% of a 400×34 element
and sits at a flat 4.36:1 regardless of the wash — that is where a curve that
"did not move" at 0.88/0.92/0.94/0.96 came from), and screenshotting before a
tall page settles after `scrollIntoView()` (`merch.html` is 4819px; that is where
a phantom 3.64 and a 2.68 that reproduced nowhere came from). Both are recorded
in the file.

**The asset.** Source is the owner's master, **not in this repo**:
`Desktop/Kundalini-Spines-Track-Art/Kundalini Spines Album Cover Art/Kundalini_Spines_Rise_Up_Stripe.jpg`
(1254×1254, 1.18 MB). Encoded with Pillow at `quality=82, method=6` — the
settings the 28 existing track covers were cut at — to
`assets/music/rise-up-cover.webp` (1254², 219 KB) and
`assets/music/thumbs/rise-up-cover.webp` (448², 36 KB). Both sit inside the range
of the existing set (216–522 KB full, 33–53 KB thumb).

**`28&nbsp;tracks` is deliberate in all three files.** At 240px the caption wraps,
and left alone it broke after the number, leaving a filing label whose last line
is the single word TRACKS. The `&nbsp;` is in the two 400px pages too even though
neither wraps — the strip is one component and should not need per-page text
fixes if a size changes.

### 2. About and Merch leave the home page — eleven files

Every `<ul class="nav__links">` on the site: `/#about` → `about.html`,
`/#merch` → `merch.html`. Music still scrolls (`#tracks`); Home, Transmissions and
Archive are unchanged. **The `#about` and `#merch` sections in `index.html` are
untouched and still reachable by hash** — nothing was deleted, the nav just stops
pointing at them. `merch.html`'s `aria-current="page"` is now simply correct
rather than aspirational.

### 3. `.btn--primary:hover` lost its label colour — `css/components.css`

`a:hover` in `css/base.css` is `(0,1,1)` and beats the `(0,1,0)` `.btn--primary`
rule, so an `<a class="btn btn--primary">` repainted its label **bone on a bone
background** on hover. Only `merch.html` had one, which is why it went unseen:
`.btn--ghost:hover` already re-declares `color`, and `purchase.html` uses
`<button>`. One declaration added: `color: var(--color-black)`.

## Verified vs. asserted

**Verified by tooling and looked at** (Aug 21 2026, Playwright/Chromium over
`scripts/serve.py`, re-run at wrap-up):

- **Nav hrefs read back off the live DOM** on `index`, `purchase`, `merch`,
  `purchase-success` at both widths: `/`, `about.html`, `#tracks` / `/#tracks`,
  `merch.html`, `transmissions.html`, `archive.html`. No `/#about` and no
  `/#merch` survive anywhere.
- **Cover geometry, 1440×900:** purchase 400×400 img / 400×44 cap, merch
  400×400 / 400×44, success 240×240 / 240×62 (two lines, as designed).
  **390×844:** all three 320×320 / 320×44. **Seam 0.00px in all six.**
- `documentElement.scrollWidth - innerWidth` = **0** on all four pages at both
  widths.
- **Zero console errors, zero page errors, zero 4xx** across four pages × two
  viewports.
- **`.btn--primary` hover on `merch.html`:** computed `color` `rgb(3, 4, 15)` on
  `background` `rgb(214, 213, 208)` — the bug is gone. Height **47px**, so 44's
  touch-target floor is intact.
- **Screenshotted and looked at:** `purchase.html` desktop, `merch.html`'s album
  section desktop, `purchase-success.html` desktop, `purchase.html` phone. The
  sleeve reads as an object, the hairline separates it from the star field, the
  copy column's top aligns with the cover's top edge, and on the phone the label
  and the h1 land above the fold under the 320px cap.

**Asserted / not verified at wrap-up:**

- **The contrast tables and the alpha sweep in `css/purchase.css` were measured
  earlier in the session, not re-run at wrap-up.** They are recorded with their
  method; take them as measured-then, not measured-twice.
- **The DPR-2 srcset selection** is likewise from the earlier pass. At wrap-up
  every page fetched `thumbs/rise-up-cover.webp` at DPR 1, which matches.
- The full width sweep (1440 → 881) behind the track-width table was not re-run;
  1440 and 390 were.
- Not seen on a real device. Safari untested, as always.
- Everything 44, 43, 42 and 41 list as asserted is still asserted — the Stripe
  path has still never run, the ~675ms hero-wait is still unjudged, the mp4
  fallback is still untested.

## What is deliberate, so nobody fixes it

Everything in 30–44's lists still stands. Additionally:

- **The stale sentences in `merch.html`'s and `purchase-success.html`'s banners
  are kept on purpose**, each with a correction directly beneath it. They are the
  record of what the nav and the stylesheet set used to be.
- **The cover is not a link on any of the three pages**, and on
  `purchase-success.html` that is a **rule, not a preference**: that page may not
  offer anything resembling a delivery, and per §5 of `js/purchase-checkout.js`
  the album ZIP URL must never appear in public HTML.
- **`loading="lazy"` is absent on `purchase-success.html` only.** There the cover
  is the first thing in `<main>` and above the fold at every width measured;
  lazy-loading an LCP candidate only delays it. The other two keep it.
- **`css/purchase.css` on `purchase-success.html` carries unused rules** — every
  `.ks-edition*` selector matches nothing there. That was checked selector by
  selector, including inside its `@media` blocks, before it was accepted; the
  `.btn` override in that file is scoped to `.ks-edition__cta`, so the three
  buttons in `.ks-result__actions` are untouched.
- **`minmax(0, 400px)` rather than a bare `400px`** — the cover never actually
  yields above 880px, and the minmax is a rebalancing safety net, not dead weight.
- **`assets/reference/2 in the graveyard.png`** is committed and referenced by
  nothing. That was the owner's explicit call at wrap-up, consistent with the
  three reference PNGs already tracked. It is not a stray.

## Do not do these

Everything in 19–44's lists still stands. Additionally:

- **Do not move `.ks-own__album--sm` below the 880px media block**, and do not
  remove its selector from that block's list. Both halves, or the phone shows an
  85px cover with no error.
- **Do not put the cover inside the three edition cards.** It was tried; the
  three reasons are in `purchase.html`.
- **Do not restore `border-bottom` on `.ks-own__cover img`** — the shared hairline
  doubles and the caption strip detaches.
- **Do not make the cover clickable on `purchase-success.html`.**
- **Do not measure that caption strip's contrast off the element's full rect**,
  and do not screenshot it without letting the page settle after scrolling.
- **Do not "fix" `merch.html`'s or `purchase-success.html`'s banner by deleting
  the stale line** — read the correction under it.
- **Do not re-point About or Merch back at `/#about` / `/#merch`.**
- Still: never `python -m http.server`, never `file://`, no Python text-mode
  writes to JS/CSS/HTML.

## Git state

- Branch `feature/spine-ui-v2`. Session start `1b5b742` (handoff 44).
- **Two code commits:** `26a79c1` the `.btn--primary` hover colour · `5940bb8`
  the album masthead, the nav repoint and the three new binaries. Then this
  handoff.
- **Twelve files touched:** eleven HTML pages (nav; three of them also the cover),
  `css/purchase.css`, `css/components.css`.
- **Three new binaries:** `assets/music/rise-up-cover.webp` (219 KB),
  `assets/music/thumbs/rise-up-cover.webp` (36 KB),
  `assets/reference/2 in the graveyard.png` (2.7 MB, unreferenced, owner's call).
- **No build number moved.** `--spine-build` 42, `--star-build` 29, `--df-build`
  11 — untouched. `css/purchase.css` and `css/components.css` carry no build
  number, so **a hard reload is needed to see any of this.**
- `main` untouched. No PR.

## Still open

1. **Wire the purchase page, or decide not to yet.** Unchanged. Needs the owner:
   a Stripe account, real prices, and the Payment-Links-vs-backend call in
   `STRIPE-SETUP.md`. Fulfilment is unbuilt. **GitHub Pages is static — no
   server, no env mechanism.**
2. **Whether phones should pay the 120.4KB of feather masks.**
3. **Whether the glow and the foreground ever ship.** Both judgeable at `/?tune`.
4. **The carousel panel is clipped at common laptop heights** — 1440×860,
   1440×800, 1366×768, 1280×720. Pre-existing, untouched, and untouched again
   this session.
5. **No Purchase entry in the nav.** Now a design question, not an edit-cost one
   — see the correction at the top.
6. **`connect.html`'s stale comment** claiming it shares geometry with
   `index.html`'s newsletter block.
7. **Assign masks 04–07 to rows**, or call 3 / 1 / 2 final.
8. **Judge the hero-wait (~675ms)**, and the fork strike on a phone.
9. **A glow gradient block** for `rain-transmission-rooftop`.
10. **A JS transcription of the vertebral rhythm** for mask 06, plus a parity
    story for 07.
11. Rename the reference PNGs — now **three** of them: `Untitled-2.png`,
    `Untitled-2fix.png`, `2 in the graveyard.png`.
12. **Mobile judgement calls** (41's item 5): nav links 25px, tablets ≥768 taking
    the 4.9MB clip, About at 3.55:1 under AA.
13. **Whether the VHS should run on phones.**
14. **The lab's fate**, now that it duplicates `index.html`.
15. **Phase two of the Music handoff** — playback gating; four hooks, none used.
16. **A `-g 48` re-export of the spine render.**
17. **NEW — the album masthead under `forced-colors` / light mode.** The site has
    neither today and a cover is an image either way, but the caption strip's
    translucent wash would need a real background under `forced-colors`.
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
