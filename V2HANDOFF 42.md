# Kundalini Spines — Spine UI V2 Handoff 42

**Date:** August 19, 2026

Twenty-fourth handoff of the **Spine UI V2** track (branch `feature/spine-ui-v2`).
`41` owns the journey landing on `index.html` and the first mobile pass; `40`
owns the play-and-park clip and the marker lab. The plain `HANDOFF 1`–`19`
series documents the dormant production site on `main`.

---

## The one-line version

**The film-row atmosphere was finally LOOKED AT — a real side-by-side of `LIVE`
false against true on all three rows — and the owner deferred the decision. Five
feather masks joined the set including one the owner painted, mask 03 lost the
spike in its top-right corner, and the generator grew four options. One commit.
`LIVE` is still false, so a visitor sees none of it.**

---

## Corrections to earlier handoffs

- **41's "everything is tuned and measured and nobody can see it" oversells
  what the numbers can do.** The tuning is real. But with the VHS tape running,
  **two identical `LIVE=false` captures of the same row differ by mean 3.5–4.9
  of 255** — and that noise floor is LARGER than the off-vs-on difference on two
  of the three rows (4.64 on spine-frequency, 3.56 on Archive, against noise of
  4.85 and 4.39). **The atmosphere cannot be judged numerically on this page at
  all.** It is an eye judgement, and 41 calling it "fully measured" is what made
  it sound like a decision the numbers could settle. Establish the noise floor
  with an off-vs-off pair before reading any diff on a film row.

- **41's item 1, "deciding `LIVE` is the cheapest win on the list", is still
  true but is now BLOCKED ON TASTE, not on work.** The comparison exists (see
  below). The owner looked and chose not to decide this session.

## TWO CLAIMS I WROTE AND THEN HAD TO CORRECT — BOTH CAUGHT BEFORE COMMIT

Recording these because in both cases the wrong version was already written
into the codebase in the confident voice the rest of the file uses:

- **"Unweighted, the vertebral rhythm rules a nearly-straight line across the
  top — contour 0.61–0.63."** I guessed that number rather than measuring it.
  Measured: **0.82–0.82, a spread of exactly 0.00.** Not "nearly straight" —
  dead straight, a ruled line at 0.82 of the band all the way across, and worse
  than the guess implied. The real table is now beside the code.

- **"Three masks forced a repeat silhouette on the third row."** I used this
  as the justification for baking more masks, in two separate comments. It is
  **false.** `maskFor()` walks the variants by one per row, so at three rows the
  rotation gives three distinct masks at every setting whether three or seven
  are baked. A repeat needs a FOURTH film row. Checked against the function
  before the commit; both comments now say so, including that the opposite was
  written first.

The general lesson is the one 41 already names in a different form: **a comment
asserting a measurement is a claim, and this codebase's voice makes a guess look
exactly like a finding.** Measure it, or do not write the number.

## THE METHOD FINDING: A MASK'S POLARITY IS NOT IN ITS NUMBERS

The owner painted a mask, then re-exported it after a fix. **Both polarities
arrived from the same tool on the same shape**, and nothing numeric separates
them:

| | first export | the "fix" |
|---|---|---|
| dimensions | 768×640 ✓ | 768×640 ✓ |
| alpha range | 0..**130** | 0..255 ✓ |
| alpha levels | 131 | 34 |
| polarity | **correct** | **inverted** |

The second file scores a perfectly respectable 0..255 either way round, and the
crisp-core check passes on whichever one you point it at — it just measures a
different region. **Only rendering it over real footage told them apart.** This
is the same family as 41's inverted VHS shader: the checks all pass on the wrong
picture.

The first file's fault was subtler and worth knowing: **alpha capped at 130
means the crisp core sits at 130, so every film row renders at 51% transparency
everywhere** — a washed-out video, not a feathered one, and not obviously a MASK
fault when seen on the page.

## WHAT SHIPPED

### 1. The `LIVE` side-by-side, at last (41's open item 1)

All three rows captured at 1440×900 with `LIVE` false and true, same scroll
position, everything else identical — the JS was intercepted and the flag
rewritten, so the "on" capture is what a visitor would get and not `/?tune`,
which changes other things on the page.

What it shows: **off, each row is a hard-edged rectangle of video pasted on the
nebula — the corners give it away. On, the feather dissolves the edges and the
glow spills a soft halo.** Archive gains the most; spine-frequency is subtlest.

Two things worth carrying: the numbers cannot back this up (see corrections),
and **`.df-cued` does not release on a scripted jump between legs** — the
play-and-park hold keeps the section at opacity 0, so a capture must strip
`df-cued` to reach the settled state a visitor sees. Rows 2 and 3 were measured
as "atmosphere changes nothing" for a whole pass before that was understood; the
zero was real and the reason was the harness.

**The owner looked and deferred.** `LIVE` stays false.

### 2. Four new masks, and one is the owner's

- **04, 05** — plain cloud from two more seeds, shipped parameters untouched.
  Contour 0.27–1.05 against the set's 0.27–1.06.
- **06** — a **vertebral rhythm**, `--vertebrae 9 --vertebrae-mix 0.35`: a
  regular stack of bites down the SIDE edges only. A seed could never do this;
  the noise field is isotropic and a spine reads as a regular stack, which is
  the one thing that field exists to destroy. Weighted to the sides because
  unweighted it rules a straight line across top and bottom (0.00 spread).
  Mix 0.55 tips into a row of scallops; 0.30–0.45 stays a cloud with a rhythm.
- **07** — baked from the owner's hand-painted PNG. Their sides are genuinely
  good (full opacity at 39–41px median, well inside the 127px free zone), but
  **top and bottom met the border at full strength, median 0px** — the
  rectangle returning on two edges. An ordinary cloud is `min()`-ed in over top
  and bottom only, crossfaded over half a band, sides untouched.

### 3. Mask 03 lost its horn — a structural fault, not a bad seed

The owner: *"I don't like the top right corner… too much of a point."* They
were right, and it is not seed luck. **`min(dx, dy)` makes the distance field
SQUARE**, so a diagonal crease runs out of every corner — the one direction
where nothing pulls the edge back — and a noise lobe sitting on that crease gets
stretched along it into a thin spike of video.

`--corner` is a polynomial smooth-min radius that rounds the contours so the
crease never forms. Measured on seed 3, top-right diagonal:

| corner | 50% alpha | fully opaque |
|---|---|---|
| 0.0 | 19px | 48px — the horn |
| 0.3 | 26px | 80px |
| 0.7 | 39px | 85px |
| **1.1** | **49px** | **91px** — shipped |

It is cheap: against corner 0.0 it moves **1.03% of pixels, every one inside a
corner**, so the silhouette along the sides is the one the owner already liked.

**Every other generated mask has the same fault** — first fully-opaque pixel
along the worst diagonal: mask 1 at 45px, **mask 2 at 35px** (worse than the one
the owner objected to, and it is on the Archive row), 4 at 44px, 5 at 47px, 6 at
43px. Mask 03 is now the cleanest of the set at 78–91px. **The owner looked at
these and is happy to leave them.**

### 4. The generator's new options — all default to off

`--vertebrae` / `--vertebrae-mix`, `--from-alpha` / `--no-edge-blend` /
`--invert`, and `--corner`. Every pre-existing bake is still byte-identical,
checked by SHA-256 on seeds 4 and 5 after each change.

### 5. The wiring, which was a silent trap

The CSS mapped only variants 2 and 3 and `maskFor()` hardcoded `% 3`. A
`data-fr-mask="4"` would have **fallen back to mask-01 with no error while the
tuner reported a silhouette the page was not wearing.** Now: rules for 4–7,
`MASK_COUNT` in place of the literal, slider range and tip updated.

## What is deliberate, so nobody fixes it

Everything in 30–41's lists still stands, except where corrected above.
Additionally:

- **Mask 03's corner 1.1 is past where a corner reads as a corner.** I called
  0.9 the last value that still does; the owner asked twice for softer and chose
  1.1 off the sweep. It is a taste call, not drift — do not restore the corner.
- **Masks 1, 2, 4, 5 and 6 keep their corner spikes.** The owner looked at the
  table above and is happy with them. Mask 2's 35px bottom-left is the one to
  raise again only if it starts showing on the Archive row.
- **Mask 07 is baked and wired but assigned to no row.** The owner: *"We don't
  need to use the one that I created."* It costs nothing unused; it is kept
  because it is theirs and reproducible.
- **Masks 04–07 are not on any row.** The markup is still 3 / 1 / 2.
- **`LIVE` is still false**, and so is the filmrow atmosphere generally.
- **The reference PNGs are named `Untitled-2.png` and `Untitled-2fix.png`** —
  poor names for documented provenance, left as the owner saved them.

## Do not do these

Everything in 19–41's lists still stands. Additionally:

- **Do not run `python scripts/make-filmrow-mask.py` with no arguments and
  expect the shipped set.** It re-bakes 01–05 and would **silently flatten 03's
  corner back to square.** Three masks need their own line; all three are
  recorded beside `SHIPPED_SEEDS`.
- **Do not read a hand-painted mask's polarity from its histogram.** Render it
  over footage. Both polarities score identically.
- **Do not trust an on/off pixel diff on a film row** without an off-vs-off pair
  in the same run to establish the VHS noise floor — it is larger than the
  atmosphere's whole signal.
- **Do not expect `.df-cued` to release on a scripted scroll jump.** Strip it to
  reach the settled state.
- **Do not remove the side-weighting on the vertebral rhythm**, and do not
  "simplify" `--corner`'s smooth-min back to `min(dx, dy)`.
- Still: never `python -m http.server`, never `file://`, no Python text-mode
  writes to JS/CSS/HTML.

## Verified vs. asserted

**Verified by tooling and looked at** (Aug 18–19 2026, Playwright/Chromium over
`scripts/serve.py`, 1440×900):

- Every one of the seven masks rendered over real footage and **looked at** —
  contact sheets for the vertebrae sweep, the mix sweep and the corner sweep.
- All seven variants resolve on the **`<video>`** at `100% 100%` — the mask is
  not on the figure, and reading the figure returns `none` (that mistake was
  made and corrected mid-session).
- All seven PNGs fetch 200. Zero 4xx, zero console errors.
- **The shipped page requests no mask PNG at all** with `LIVE` false.
- The `LIVE` side-by-side on all three rows, plus an off-vs-off noise floor.
- Crisp-core assertion passes on every bake; default paths SHA-256 identical.

**Asserted / not verified:**

- **Nothing this session was seen on a phone**, and the masks are gated off with
  the rest of the feather below 768px anyway.
- The mask work has never been seen with `LIVE` true by anyone but me, in a
  screenshot.
- **The lab's parity check does not cover masks 06 or 07.** It regenerates the
  field in JS and diffs against the baked PNG; 01–05 still pass since the maths
  is unchanged, but 06 uses a term the lab cannot reproduce and 07 is not
  generated at all. A parity run against either will disagree, correctly.
- Everything 41 lists as asserted is still asserted: the ~675ms hero-wait, the
  fork strike on a phone, Safari, the mp4 fallback.

## Git state

- Branch `feature/spine-ui-v2`. Session start `6155764` (handoff 41).
- **Two commits**, ending with this handoff. 10 files: 5 mask PNGs (one
  modified), 2 owner reference PNGs, `css/filmrow-atmos.css`,
  `js/filmrow-atmos.js`, `scripts/make-filmrow-mask.py`.
- Net binaries: **+0.25MB** (four new masks plus two reference sources).
- `--spine-build` 42, `--star-build` 29, `--df-build` 11 — **untouched**, no
  reactive-background stylesheet changed.
- `main` untouched. No PR.

## Still open

1. **Decide `LIVE`** for the filmrow atmosphere. The side-by-side now exists;
   this is purely a taste call and the owner has it. Everything else about the
   layer is done.
2. **Assign masks 04–07 to rows**, or decide the markup's 3 / 1 / 2 is final.
3. **Judge the hero-wait (~675ms)**, and the fork strike on a phone.
4. **Two clips left** for film rows: `last-train-below`, `the-black-archive`.
5. **A glow gradient block** for `rain-transmission-rooftop`.
6. **A JS transcription of the vertebral rhythm** if mask 06 should be draggable
   in `filmrow-atmos-lab.html`, plus a parity story for 07.
7. Rename the reference PNGs to something meaningful (three comments and one
   bake line reference them).
8. **Mobile judgement calls** (41's item 5): nav links 25px, signup button 42px,
   tablets ≥768 taking the 4.9MB clip, About at 3.55:1 under AA.
9. **Whether the VHS should run on phones.**
10. **The lab's fate**, now that it duplicates `index.html`.
11. **Phase two of the Music handoff** — playback gating; all four hooks exist,
    none used.
12. **A `-g 48` re-export of the spine render** (smaller and better).
13. The two filmrow labs still scrubbing; the doc-rail ring inversion; the
    frame-budget decision; `music.html` still a redirect stub; stale amber-era
    `?tune` TIPS prose; the two missing trivia files; the astral scrim; the
    inherited pile.

---

## Starting the next V2 chat

Attach this file. The working folder is
`C:\Users\Haight\Desktop\kundalini-spines-spine-ui` on `feature/spine-ui-v2`.
Serve with `python scripts/serve.py`, browse `http://localhost:8000` — never
`file://`, never `python -m http.server`.

> Here's the latest V2 handoff. The feather masks are done and the atmosphere
> side-by-side exists but LIVE is still false. I want to <thing> this session.

The owner has said explicitly they will decide when the site is ready to be
finished, so **do not push `LIVE`, mask assignment, or any other "ship it" step
unprompted.** The most useful next step is whatever they name; if they want a
suggestion, the two remaining film-row clips (item 4) are self-contained work
that needs no decision from them — the Archive row is the pattern, markup plus
an encode, no new JS.
