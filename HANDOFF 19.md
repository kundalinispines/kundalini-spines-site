# Kundalini Spines — Session Handoff 19

**Date:** August 7, 2026

**Supersedes:** nothing wholesale. `HANDOFF 3`–`6` still own their material. `7` owns the spine layer's architecture. `8` owns the glow band and the 4K regeneration. `9` owns the four\-band star field. `10` owns the kick\-reactive rebuild and the biquad detector. `11` owns the WARP correction. `12` owns the mirror tile and the cloud mask. `13` owns the nebula/kick rewiring. `14` owns the page\-scoping architecture — still read it before touching any page block, but its stale\-mobile\-overrides section is now HISTORY, closed by this session. `15` owns the snare detector, `--spine-on`, and the tuner minimize button. `16` owns the generated\-candidate containment story. `17` owns the reference\-frame extraction path and patterns d/e/f. `18` owns the site\-wide sky.

**What this document does:** it closes the largest technical item on the list — **the stale mobile overrides** (HANDOFF 14's five\-value rot table) — and with it the "≤600px cascade fix never verified at a real narrow viewport" item, because this time every check ran at an actual 390×844. One session, two CSS files, no JS, no assets, no tuner changes, zero Higgsfield credits.

* * *

## The one\-line version

**Both mobile blocks are re\-derived against today's desktop values and verified at a real 390px viewport.** `--star-build` is **22**, `--spine-build` is **37**. The phone's cloud cut moved channels (off `--star-cloud`, onto `--star-cloud-bright`), the charge\-front mechanism is restored on phones (`--spine-lit: 0`), the play\-button twinkle lift exists again (0.35 idle / 1.17 playing), and `css/spine-bg.css` carries the first page\-scoped rule ever placed INSIDE a media block — `html.page-about`, which keeps that page's deliberately inverted spine polarity from being silently reversed on phones by the shared mobile values.

## Corrections to earlier handoffs — read first

**1\. HANDOFF 18's git\-state section is resolved, the same way 17's was.** The owner's push landed: at this session's start, origin `main` was `8542f63`, whose message describes HANDOFF 18's work, and the desktop copy was byte\-identical to it across all eight files checked (both stylesheets, `js/spine-bg.js`, all four rendering pages, `HANDOFF 18.md`). Per HANDOFF 18's closing lesson, the clone's checkout was confirmed to actually exist before the diff was believed.

**2\. HANDOFF 18's "still awaiting manual deletion" item is closed.** `assets/hero/nebula-lightning-b-4k.webp`, `nebula-lightning-b.webp`, and the four `_hf-*.png` round\-trip files are gone from the desktop — checked by listing, not assumed. HANDOFF 16's cleanup is complete.

**3\. HANDOFF 14's rot table was right but incomplete, in a way 14 could not have seen.** Its five stale values were all confirmed. But two more things were wrong with the mobile blocks by the time this session opened:

- **The phone's `--star-cloud: 0.21` override was on the wrong CHANNEL, not just the wrong number.** Build 15 redefined `--star-cloud` as the kick\-headroom split and moved the nebula's brightness into `--star-cloud-bright` (the in\-file stale note dated 2026\-08\-05 says exactly this). No opacity number could ever restore the phone's intended cut once the lift lived in the filter.
- **The shared mobile block had started reversing about.html's deliberate polarity.** The mobile rule and the `html.page-about` page block are both (0,2,0) on that page, and the mobile block sits later in source — that ordering is the load\-bearing fix from 14 — so on any viewport ≤600px, about's `--spine-lit: 1.48` lost to the shared `0.3`. About runs its front the bright way round because it has no kick; the shared values would have put its front back to dark\-forever. Nobody decided that. It fell out of two correct designs colliding exactly where the cascade says they must.

## What shipped, value by value

Every number is a documented ratio times TODAY'S desktop value — the ratios the blocks' own comments prescribe — not an edit of the previous phone number. Derivations are recorded beside each value in the files.

**`css/star-bg.css` (build 22), shared mobile rule:**

| variable | was | now | derivation |
| --- | --- | --- | --- |
| `--star-dim` | 0\.46 | **0\.8** | 0\.575 × desktop 1.4 |
| `--star-twinkle` | 0\.75 | **0\.35** | 0\.75 × desktop 0.46 |
| `--star-twinkle-hi` | 0\.75 | **1\.17** | 0\.78 × desktop 1.5 |
| `--star-cloud` | 0\.21 | **removed** | headroom split; identical at every width now |
| `--star-cloud-bright` | — | **1\.27** | 0\.575 × desktop 2.2 — the cut, on the right channel |

The twinkle pair fixes two inversions at once: idle drops back below the desktop, and the play button lifts again (3.3x, against the desktop's 3.26x). At 1.17 one keyframe peak clips to 1.0, against the desktop's two — proportional, noted in the file.

**`css/spine-bg.css` (build 37), shared mobile rule:**

| variable | was | now | derivation |
| --- | --- | --- | --- |
| `--spine-w` | 390px | **73px** | 0\.61 × desktop 120px |
| `--spine-lit` | 0\.3 | **0** | 0\.57 × 0 — the flash\-out\-of\-black mechanism, restored |
| `--spine-dim` | 0\.23 | **0\.13** | 0\.61 × desktop 0.22 |
| `--spine-band` | 880px | **560px** | 0\.7 card ratio × desktop 800px |
| `--spine-band-feather` | 0px | **420px** | 0\.7 × desktop 600px |

**`css/spine-bg.css`, NEW `html.page-about` rule INSIDE the media block, after the shared rule:** `--spine-lit: 0.84` (0.57 × 1.48 — still above dim, polarity kept), `--spine-dim: 0.08` (0.61 × 0.13), `--spine-band: 0px` (the page's design; a ratio times 0 stays 0), `--spine-band-feather: 560px` (0.7 × 800). Width inherits the shared 73px. The page's document\-space geometry — `--spine-feather` 10px, `--spine-from` 690px, `--spine-offset` 680px, `--spine-bias` −0.7 — rides in from the desktop page block **deliberately unscaled**\: it is geometry, not brightness, and it was left for a judged pass rather than scaled blind.

## Verified this session (cloud Chromium, real 390×844 viewport \+ 1440×900 regression, all four rendering pages)

- **Computed values, not file reads:** every re\-derived value computes on the live cascade at 390px on the page it should reach, and about.html's phone rule wins over the shared one (lit 0.84 / dim 0.08 computed). At 1440×900 every desktop value is unchanged — the regression pass matched the pre\-edit baseline exactly.
- **CSSOM confirms both files parse:** both media blocks read back, spine's as two rules (`:root, html.page-home, html.page-about, html.page-archive, html.page-transmissions` then `html.page-about`). The silent\-no\-op trap was checked for, not assumed away.
- **Tuner inline writes still win at 390px** — an inline `documentElement` write beat the media block on every page tested, so `/?tune` on a narrow window still works.
- **Pixel proof, frozen mid\-animation** (all animations paused at the same instant via `getAnimations`, hero video hidden, old\-vs\-new diff at 390×844): archive **\+1.81/255 mean across 28.5%** of viewport pixels, transmissions **\+1.27 across 19.9%**, about **\+1.43 across 29.3%** (sky plus spine changes). The direction is right: base field up (`--star-dim` doubled), nebula down \~0.42x, twinkle idle halved.
- **index.html's first viewport showed a ZERO pixel delta — explained, not alarming:** the hero section covers the entire 844px, so no sky pixel is visible there. Scrolled to `#tracks` the sky responds. The zero was investigated before being accepted (a suspiciously clean result is HANDOFF 18's lesson pointed the other way).

**Not verified:** the owner has seen none of this — not the two new sky pages on his desktop (owed since 18), and not any page at phone width, which no human eye has ever seen. `--star-twinkle-hi: 1.17` was verified as a computed value only; nobody played a track at 390px. And whether about's `--spine-from: 690px` still clears the h1 on a phone\-height document is an open geometry question, flagged in the file.

## Do not do these

- **Do not move the `html.page-about` rule inside the media block above the shared rule, and do not merge it into the page block near the top of the file.** Its entire mechanism is same\-specificity\-later\-source, inside the query. Moved either place, about's phone values die silently.
- **Do not re\-add a phone `--star-cloud` override.** The split is deliberately identical at every width now; the phone's cut lives on `--star-cloud-bright`. Re\-adding the opacity override changes the `--kick-cloud` ceiling math on index.html.
- **Do not scale about's `--spine-from`/`--spine-offset` for phones without looking at a phone.** Geometry, not brightness. The file says the same.
- **Do not shorten either mobile selector list** — unchanged from 14/18, both still name four page classes.
- Everything in HANDOFF 7–18's lists still stands: music.html stays bare, never wire the lightning to `--kick`, per\-pattern brightness sliders stay forbidden, the next pattern letter is g.

## What is deliberate, so nobody "fixes" it

- **The shared spine mobile values currently tune a column no page shows.** The only page whose spine renders is about.html (home ships `--spine-on: 0`), and about gets its own phone rule. The shared values are kept correct off the `:root` baseline anyway, so the day the home spine comes back on, its phone is already right.
- **Phone `--star-twinkle-hi` clips one keyframe peak** (desktop clips two). Proportional by design; the clipping note beside the desktop declaration covers both.
- **About's phone geometry is unscaled.** See "Do not do these".
- **The 2026\-08\-05 stale note beside the old `--star-cloud` override is GONE** — replaced by the record of the fix it prescribed. It was the rare in\-file comment that carried its own solution; it did its job.

## Files changed this session

**Changed:** `css/star-bg.css` (mobile block re\-derived, cloud cut moved to the brightness channel, build history; `--star-build` 21 → **22**), `css/spine-bg.css` (mobile block re\-derived, `html.page-about` phone rule added inside the media block, build history; `--spine-build` 36 → **37**).

**New:** `HANDOFF 19.md` (this file).

**Unchanged:** all HTML, all JS, all assets, all data files, both detectors, all tuner FIELDS/TIPS/GROUPS.

**Git state at handoff time:** both stylesheets delivered to the desktop via the bridge (mtime\-guarded). A commit exists in the cloud clone (`b33a2a6`) but the push was refused with the same 403 as the last two sessions — the repo is not in the session's authorized set. **The desktop copy is the source of truth for the push.** Note for future sessions: cloud pushes only work if the repo is added to the session's sources when the task is STARTED; it cannot be granted mid\-session. An updated `kundalini-session-start` skill recording this (plus an early `git push --dry-run` check) was delivered to the owner this session but not yet saved to his account.

## Still open

- **The owner's eye, now owed three looks:** archive and transmissions on his desktop hardware (open since 18), all four pages at phone width (no human has ever seen them narrow), and about's spine start position on a phone\-height document. Screenshots from this session's harness were delivered to the chat as a preview; his eye is still the record.
- **DNS for `kundalinispines.com`** — unchanged, still the single blocker on anything being reachable. Enable sequence in HANDOFF 5.
- **`--kick-decay` is one envelope for the kick's three consumers** (15) — unchanged.
- **`TIPS` drift from 14 stands** — still deliberately left, still actively misleading.
- **Buttondown deliverability unverified; `explicit` null on all 28 tracks; streaming links null; `data/releases.json` placeholder; TikTok/Spotify links dead by decision; the 885 MB masters folder still backed up by nothing; 27 unreferenced cover files** — all unchanged.

**Closed since HANDOFF 18:**

- **The stale mobile overrides (14)** — closed. Re\-derived by the prescribed ratios, plus the two problems 14 couldn't see: the wrong\-channel cloud override and the about\-polarity collision.
- **The ≤600px cascade fix unverified at a real narrow viewport (14)** — closed. Every check this session ran at an actual 390×844.
- **HANDOFF 16's leftover files awaiting manual deletion** — closed, verified gone.

## The closing line, again

The series so far: *measure it* (5, 6) · *know what your instrument cannot see* (7) · *ask what the number actually measures* (8) · *take the baseline* (9) · *check it measures the thing you care about* (10) · *check the machine* (11) · *check the exception* (12) · *know every control's ceiling* (13) · *check where the value lives* (14) · *re\-derive the design from the measurement* (15) · *calibrate against the reference, not a proxy* (16) · *measure whether the new input is the kind the machine was built for* (17) · *confirm both operands exist* (18).

This session's addition came from the polarity collision. The shared mobile block was correct — its job is to make phones differ from desktops. The about page block was correct — its job is to make about differ from the baseline. Each was verified when it shipped, each carried the right values for its purpose, and together they produced a page whose central design decision was silently reversed at 390px, because the cascade — not either author — decides which correctness applies where two overlap. Nobody was wrong. The interaction was.

> When two rules both claim the same value on the same page, the cascade's answer is a fact about source order and specificity, not about intent — so every time you add a scope, ask what it does to every page that already has one. A default and an exception are each easy to verify alone. The bug lives in neither; it lives in the overlap.
