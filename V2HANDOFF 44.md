# Kundalini Spines — Spine UI V2 Handoff 44

**Date:** August 21, 2026

Twenty-sixth handoff of the **Spine UI V2** track (branch `feature/spine-ui-v2`).
`43` owns the feather going live, the About page, the purchase rough-in and the
`Connected` heading; `42` owns the seven feather masks. The plain `HANDOFF 1`–`19`
series documents the dormant production site on `main`.

---

## The one-line version

**A two-commit session, both of them 43's own open items, both fixed: the
deep-field arriving wrong at `/#tracks` (43 had the cause wrong — it was never
the video) and the 44px touch target, now carried by `.btn` site-wide. No new
files, no new binaries, no feature work.**

---

## Corrections to earlier handoffs

- **43's diagnosis of the `/#tracks` bug is WRONG, and following it would have
  made things worse.** 43 says the deep-field video "is parked on a single frame
  and never told to start" and points at `playTo()`. Measured on both routes:
  the clip is parked on **f83, its own cue, identically in both** — a scrolled
  arrival parks it exactly the same way, paused and on frame. **Calling
  `vid.play()` there would have broken the park.** What was actually missing was
  the **nebula over it**: `--df-sky` rested at **0.0000** on a deep link where a
  scrolled arrival rests at **1.0000**. That is the whole of "just the video
  still image" — a bare parked frame with no sky on it. Details below.

- **43's open item 5 ("`.btn` is 42px tall site-wide") is CLOSED, and its
  framing was too simple.** `.btn`'s height is padding-derived: `--space-3` is a
  fixed 12px but `--fs-label` is **fluid**, so the button shrinks with the
  viewport. Measured across all ten root pages: **47.4px at 1440**, reaching
  42px only at **390**, on connect.html's "Join the Signal". The fault was never
  one number site-wide — it was **worst exactly where a touch target matters.**
  It also missed the real worst offenders; see below.

- **43's "not yet investigated — whether the same freeze affects `/#about`,
  `/#merch`, `/#newsletter`…" is ANSWERED.** `/#newsletter` had the same fault
  for the same reason and is fixed with it. The other three never could:
  `skyAt()` is 0 everywhere except Music's ramp and the tail, so there is no
  target to go stale. All five landings were measured.

- **43's "one discrepancy, left honest" (Merch supposedly exempt) is now moot.**
  All three off-index routes — transmissions, archive, **merch** — were measured
  landing on `1.0000` after the fix. Whatever the owner saw, all three are
  correct now. The discrepancy was never explained and does not need to be.

## WHAT SHIPPED

### 1. The deep-field freeze at `/#tracks` — fixed (43's item 1)

`js/deep-field-bg.js`, one file, +64/−1.

**The real fault: the boot dissolve outlived the position it was aimed at.**
`boot()` clears the `booting` flag for the deep-link case by reading
`window.scrollY` — but `html` carries `scroll-behavior: smooth`
(`css/base.css:9`), so Chrome **animates** to the fragment starting at ~3.0s,
while `boot()` already ran at **~0.6s with `scrollY` still 0**. `skyAt(0)` is 0,
so the flag stayed up; the flag suppresses `skyT`; and **nothing scrolls after
an arrival**, so the target was never re-read. A window resize recovered it to
1.0000 — which is exactly what proved the geometry was right and only the
*target* was stale.

The fix ends the dissolve when the position implies a different target than the
one it was aimed at. Ordinary scrolling at the top does not trip it, because
`skyAt()` is 0 across everything but Music's ramp and the tail.

**THE `bootAimed` GUARD IS NOT DECORATION — do not remove it.** `onScroll()`
runs **before** `boot()`: `remeasure()` calls it at 400ms while `skyT` is still
the placeholder `1`, so without the guard the new line fires at the top of an
ordinary load. Measured, three runs each: the opening dissolve **collapsed from
419/432/452ms to 107/109/122ms** — the snap the note in `tick()` says already
cost a build once. With the guard: 0.99 → 0.02 in 421ms, `booting` true
throughout.

**Reload and cold deep link are different paths and neither replaces the
other.** On reload the scroll restore lands at 1833 by t=1573ms and `boot()`
runs *behind* it at ~2.8s, so the old line in `boot()` catches it. On a cold
`/#tracks` the order is reversed and only the new line in `onScroll()` catches
it. Both are commented in place.

### 2. `.btn` carries the 44px touch target site-wide (43's item 5)

One declaration in `css/components.css`, plus the now-redundant pin deleted from
`css/purchase.css` and its `<head>` note in `purchase.html` corrected.

**`min-height`, not more padding** — padding would move every button on the site
at every width to fix the one width that is short. Nothing at 1440 changes: 44
is under the 47.4 those already measure.

**It catches the overrides, which is the part 43's framing missed.**
`.track-focus-panel__actions .btn` takes its own tighter padding to keep five
actions on one row and measured **40.2px at both widths** — the five streaming
buttons under the carousel, the most-tapped controls on the site. `min-height`
lifts them without touching the horizontal padding that row depends on: measured
after, still one row, identical widths.

- **BEFORE:** 5/29 visible `.btn` under 44px at 1440, 7/29 at 390.
- **AFTER:** 0/29 at both, re-confirmed at wrap-up.

**The 44px number now lives in exactly one place.** `css/purchase.css` said the
site-wide fix belonged in `components.css`; it is there, and the local pin is
gone. Change it in `components.css` and the purchase page follows.

**A pre-existing fault was found while checking for collateral, and NOT
touched** — see Still open item 4.

## Verified vs. asserted

**Verified by tooling and looked at** (Aug 21 2026, Playwright/Chromium over
`scripts/serve.py`, 1440×900 and 390×844):

- Cold `/#tracks`: `--df-sky` **1.0000**, `scrollY` 1835, zero console and zero
  page errors — **screenshotted and looked at at wrap-up**: the nebula is over
  the parked frame, the carousel and its five streaming buttons read correctly.
- All five landings rest on the right sky and the right cue frame; nav clicks
  from transmissions / archive / merch all land on 1.0000; reload holds 1.0000;
  the wheel-stepped control is unchanged; the opening dissolve is back to
  416–425ms with `booting` true throughout.
- `.track-focus-panel__actions .btn` × 5 = **44.0px each, still one row**.
- connect.html "Join the Signal" at 390 = **44.0px**, **screenshotted and looked
  at** — centred, nothing reflowed.
- **Zero `.btn` under 44px on any of the ten root pages** at either width,
  re-measured at wrap-up.

**Asserted / not verified:**

- **Phones and reduced motion never run the deep-field module at all** (it
  returns at the gate on line 126), so the `/#tracks` fix is desktop-only by
  construction — taken from the code, not exercised on a phone.
- Not seen on a real device; 390 is a viewport, not a phone.
- Safari untested, as always.
- Everything 43, 42 and 41 list as asserted is still asserted — the Stripe path
  has still never run, the ~675ms hero-wait is still unjudged, the mp4 fallback
  is still untested.

## What is deliberate, so nobody fixes it

Everything in 30–43's lists still stands, except where corrected above.
Additionally:

- **The `bootAimed` guard.** Removing it looks like a simplification and costs
  the opening dissolve — the numbers are above and in the file.
- **`boot()` still clears `booting` itself.** That line is not dead; it is the
  reload path. Both are needed.
- **The lab pages still have sub-44px buttons** — 27–29px HUD controls on
  `coil-lab`, `hero-scrub-lab`, `hero-timeline-lab`, `scramble-lab`,
  `shutter-lab`, `spine-aster-lab`. They are internal tuner surfaces, not
  visitor surfaces, and the 44px rule was deliberately not chased into them.
- **No build number moved.** Neither `components.css` nor `purchase.css` carries
  one, and no reactive-background stylesheet changed — **a hard reload is needed
  to see either fix.**

## Do not do these

Everything in 19–43's lists still stands. Additionally:

- **Do not call `vid.play()` on a deep-link arrival.** The clip is parked on its
  cue on purpose; 43 said otherwise and 43 was wrong.
- **Do not remove the `bootAimed` guard**, and do not "simplify" the two boot
  paths into one.
- **Do not re-pin 44px in `css/purchase.css`** or any other page stylesheet.
- **Do not fix the lab HUD buttons** to 44px.
- **Do not assume a fix is visible without a hard reload** on these two files.
- Still: never `python -m http.server`, never `file://`, no Python text-mode
  writes to JS/CSS/HTML.

## Git state

- Branch `feature/spine-ui-v2`. Session start `2a4f480` (handoff 43).
- **Two code commits:** `c92cf92` deep-field deep-link sky · `83553d6` 44px
  touch target. Then this handoff.
- Four files touched: `js/deep-field-bg.js`, `css/components.css`,
  `css/purchase.css`, `purchase.html`. **No new files. No new binaries. 0 bytes
  of media added.**
- `--spine-build` 42, `--star-build` 29, `--df-build` 11 — **untouched**.
- `main` untouched. No PR.

## Still open

1. **Wire the purchase page, or decide not to yet.** Unchanged from 43 item 2
   and still needs the owner: a Stripe account, real prices, and the
   Payment-Links-vs-backend call in `STRIPE-SETUP.md`. Fulfilment is unbuilt.
   **The blocking fact stands: GitHub Pages is static — no server, no env
   mechanism.**
2. **Whether phones should pay the 120.4KB of feather masks.** One media query
   once the owner says yes or no.
3. **Whether the glow and the foreground ever ship.** Both wired and judgeable
   at `/?tune`.
4. **NEW — the carousel panel is clipped at common laptop heights.** Found while
   checking the 44px change for collateral and **not caused by it**: 1440×860,
   1440×800, 1366×768 and 1280×720 were **already clipped before the change and
   are equally clipped after**. 1440×900 stays clear, though clearance under the
   nav went 7px → 5px. Real, pre-existing, untouched.
5. **No Purchase entry in the nav** — a seven-file edit; `merch.html` documents
   why a per-page nav is worse than an absent one.
6. **connect.html's stale comment** claiming it shares geometry with
   index.html's newsletter block.
7. **Assign masks 04–07 to rows**, or call 3 / 1 / 2 final.
8. **Judge the hero-wait (~675ms)**, and the fork strike on a phone.
9. **A glow gradient block** for `rain-transmission-rooftop`.
10. **A JS transcription of the vertebral rhythm** for mask 06, plus a parity
    story for 07.
11. Rename the reference PNGs (`Untitled-2.png`, `Untitled-2fix.png`).
12. **Mobile judgement calls** (41's item 5): nav links 25px, tablets ≥768
    taking the 4.9MB clip, About at 3.55:1 under AA. **The signup button is off
    this list — it is 44px now.**
13. **Whether the VHS should run on phones.**
14. **The lab's fate**, now that it duplicates `index.html`.
15. **Phase two of the Music handoff** — playback gating; four hooks, none used.
16. **A `-g 48` re-export of the spine render.**
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

> Here's the latest V2 handoff. The `/#tracks` background bug is fixed and the
> 44px touch target is in, so nothing is broken and nothing is half-done. I want
> to <thing> this session.

The owner decides when the site is ready to be finished, so **do not wire
Stripe, ship the glow, or promote anything to live unprompted.** If they want a
suggestion with no decision attached, item 4 (the carousel clipped at 1366×768
and other laptop heights) is a real visitor-facing fault and is self-contained.
