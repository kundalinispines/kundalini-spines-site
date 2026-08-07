# Kundalini Spines — Session Handoff 18

**Date:** August 7, 2026

**Supersedes:** nothing wholesale. `HANDOFF 3`–`6` still own their material. `7` owns the spine layer's architecture. `8` owns the glow band and the 4K regeneration. `9` owns the four-band star field. `10` owns the kick-reactive rebuild and the biquad detector. `11` owns the WARP correction. `12` owns the mirror tile and the cloud mask. `13` owns the nebula/kick rewiring. `14` owns the page-scoping architecture — read it before touching any page block. `15` owns the snare detector, `--spine-on`, and the tuner minimize button. `16` owns the generated-candidate containment story. `17` owns the reference-frame extraction path and patterns d/e/f.

**What this document does:** it closes the oldest item on the "Still open" list — **the flat black pages**. The sky (four star bands + nebula) now paints on every page that renders. A short session, one pass, no asset work, no JS work, zero Higgsfield credits (balance unchanged, ~685).

* * *

## The one-line version

**The sky is site-wide.** `archive.html` and `transmissions.html` each gained one `<link>` to `css/star-bg.css` and a page class on `<html>` (`page-archive` / `page-transmissions`); `css/star-bg.css` gained its first-ever page blocks (both EMPTY, tuning hooks only) above its mobile block; both stylesheets' mobile selector lists were widened to name the new classes, per HANDOFF 14's same-commit rule. `music.html` was skipped on purpose — see below. `--star-build` is **21**, `--spine-build` is **36**. No new CSS variables, no tuner changes, no JS changes.

## Corrections to earlier handoffs — read first

**1. HANDOFF 17's (and 14's) "three of five pages are still flat black" overstated by one.** `music.html` is an instant redirect to `/#tracks` — meta refresh plus `location.replace` — so no visitor ever sees it render. The pages anyone could actually see flat were two, and both are now fixed. The redirect page stays bare: a sky there would paint for no one, and the owner confirmed the skip. Do not "complete the set" later.

**2. HANDOFF 17's git-state section is resolved.** The `ec903de` cloud commit it describes was superseded by the owner's own push: at this session's start, origin `main` was `baf602e`, whose message describes HANDOFF 17's work, and the desktop copy was **byte-identical to it** across all eight files this session checked (EOL-normalized diff; in fact byte-identical outright — the repo's `* -text` means nothing converts). The push flow worked.

## The decision record

The owner was asked three scoping questions before anything was edited; the answers are the design:

- **Sky only.** The two pages get `star-bg.css` — one `<link>`, no markup, six pseudo-element slots. They do NOT link `css/spine-bg.css` or `js/spine-bg.js`: no spine column (it would need a `data-spine-from` anchor and per-page tuning chosen for each page), no lightning divs (with no audio on those pages the five bolts would sit permanently invisible while loading ~150 KB of assets that can never light).
- **music.html skipped.** See correction 1.
- **Tuning hooks now.** `html.page-archive` and `html.page-transmissions` blocks exist in `star-bg.css`, empty, same convention as `html.page-home` when it first landed: a value appears in a page block only when that page should actually differ. The classes are also named in BOTH mobile selector lists — including `spine-bg.css`'s, which those pages do not even load — so the HANDOFF 14 rule ("add any new page class to both lists in the same commit") holds by construction rather than by memory. That widening is the only spine-bg.css change and is why `--spine-build` bumped 35 → 36 with no spine value touched.

## Verified this session (cloud Chromium 1440×900, local HTTP, CSSOM + computed styles + pixel diff)

- All six sky slots (`body::before`, `body::after`, `html::before`, `html::after`, `main::before`, `main::after`) compute on both new pages with the same backgrounds, blend modes, positions and opacities as `index.html`, the known-good reference.
- CSSOM confirms both stylesheets parse: the widened mobile lists read back as `:root, html.page-home, html.page-about, html.page-archive, html.page-transmissions` in both files, and both empty page blocks exist as rules. (A syntax error in these comment-dense files presents as a silent no-op — this check is the guard.)
- `--star-build` computes 21 and `--spine-build` 36 from the live cascade on the pages that link each file.
- **Pixel proof, not eyeball:** each page was screenshotted with and without the stylesheet link, animations frozen. The sky lifts 66.3% of archive's viewport pixels (mean +6.25/255, star peaks 250) and 62.7% of transmissions' (+3.22/255). Content stays readable over the nebula band on both.
- No page errors on either page. The only console error in the harness was the sandbox blocking Google Fonts — an environment artifact, not the site.

**Not verified:** the owner has not seen these pages on his hardware yet, and neither new page has ever been rendered at ≤600px — they now participate in the same mobile block whose stale values HANDOFF 14 documents, so whatever is wrong there is now wrong on four pages instead of two.

## Do not do these

- **Do not add `spine-bg.css`/`spine-bg.js` to archive or transmissions casually.** If a spine is ever wanted there, it needs a `data-spine-from` anchor chosen per page, a polarity decision (see HANDOFF 14 on about.html's inversion), and its own tuning pass. The day one of them links the spine, the mobile list is already correct — that part is done.
- **Do not add the sky to `music.html`.** It is a redirect; the comment beside build 21's history line in `star-bg.css` records the decision.
- **Do not shorten either mobile selector list.** Both now name four page classes. The trap is HANDOFF 14's; it did not get smaller by being fed.
- **Do not put anything below the `@media (max-width: 600px)` block in `star-bg.css`.** The new page blocks sit above it and must stay there; the file now carries its own comment saying so.
- Everything in HANDOFF 7–17's lists still stands: never wire the lightning to `--kick`, never run a reference frame through the generated-candidate path, per-pattern brightness sliders stay forbidden, container screenshots stay untrusted for bolt layers, the next pattern letter is g.

## What is deliberate, so nobody "fixes" it

- **Both new page blocks are EMPTY.** They are hooks, not omissions. A page with an empty block inherits the `:root` baseline, which is the point.
- **`spine-bg.css`'s mobile list names two classes whose pages never load the file.** Harmless today, load-bearing the day they do. The comment beside the list explains it.
- **`--spine-build` bumped for a selector-list-only change.** The build number answers "did the browser load this file", not "did a value change".
- **`music.html` untouched, `page-home` still empty of sky values, `star-bg.css` still has no `page-home`/`page-about` blocks** — nothing sky-side changed on the existing pages; index and about render byte-for-byte the same sky as before (their computed slots were re-verified this session as the reference).

## Files changed this session

**Changed:** `archive.html` and `transmissions.html` (page class on `<html>` with the HANDOFF 14 warning comment, one stylesheet `<link>` each), `css/star-bg.css` (two empty page blocks + placement comment, mobile list widened, build history; `--star-build` 20 → **21**), `css/spine-bg.css` (mobile list widened, build history; `--spine-build` 35 → **36**).

**New:** `HANDOFF 18.md` (this file).

**Unchanged:** all JS, all assets, all data files, `index.html`, `about.html`, `music.html`, both detectors, all tuner FIELDS/TIPS/GROUPS.

**Git state at handoff time:** all four files + this handoff delivered to the desktop via the bridge. A commit exists in the cloud clone (`1d6b426`) but the push was refused, same as last session — the repo is not in the session's authorized set; **the desktop copy is the source of truth for the push**, which this wrap-up walks the owner through.

**Still awaiting manual deletion on the desktop** (HANDOFF 16's leftovers; the bridge cannot delete): `assets/hero/nebula-lightning-b-4k.webp`, `nebula-lightning-b.webp`, and the four `_hf-*.png` round-trip files.

## Still open

- **The owner's eye.** The two new pages passed every instrument check but have not been approved on real hardware. His eye is the record; a look at archive and transmissions is the cheapest next task there is.
- **DNS for `kundalinispines.com`** — unchanged, still the single blocker on anything being reachable. Enable sequence in HANDOFF 5. Pushing backs up the work; it does not publish the site.
- **The mobile overrides are stale, three inverted** (14) — unchanged, and now reaching four pages instead of two. Still the largest technical item.
- **The ≤600px cascade fix is still unverified at a real narrow viewport** (14), and the two new pages have never been seen narrow at all.
- **`--kick-decay` is one envelope for the kick's three consumers** (15) — unchanged.
- **`TIPS` drift from 14 stands unchanged** — still deliberately left, still actively misleading.
- **Buttondown deliverability unverified; `explicit` null on all 28 tracks; streaming links null; `data/releases.json` placeholder; TikTok/Spotify links dead by decision; the 885 MB masters folder still backed up by nothing; 27 unreferenced cover files** — all unchanged.

**Closed since HANDOFF 17:**

- **"Three of five pages are still flat black"** — closed, and corrected: it was two pages that render plus a redirect. The two are skied; the redirect is skipped by decision.

## The closing line, again

The series so far: *measure it* (5, 6) · *know what your instrument cannot see* (7) · *ask what the number actually measures* (8) · *take the baseline* (9) · *check it measures the thing you care about* (10) · *check the machine* (11) · *check the exception* (12) · *know every control's ceiling* (13) · *check where the value lives* (14) · *re-derive the design from the measurement* (15) · *calibrate against the reference, not a proxy* (16) · *measure whether the new input is the kind the machine was built for* (17).

This session's addition is small and almost embarrassing, which is exactly why it goes in the record. The desktop-vs-origin check first reported all eight files DIFFERENT — every one. The real cause: the clone's checkout had silently failed partway, so the comparison was comparing the desktop against files that did not exist, and the diff tool duly reported "different". Ten minutes could have been spent investigating a desync that was never there. The files, once actually checked out, were byte-identical.

> A comparison is only as good as its operands. When a check reports a difference — especially a suspiciously total one, everything different at once — first confirm both sides of the comparison actually exist. An instrument fed nothing does not say "nothing"; it says whatever a missing operand happens to look like, with full confidence.
