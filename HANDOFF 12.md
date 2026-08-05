# Kundalini Spines — Session Handoff 12

**Date:** August 5, 2026

**Supersedes:** nothing wholesale. `HANDOFF 3`, `4`, `5` and `6` still own their material. `HANDOFF 7` still owns the spine layer's architecture. `HANDOFF 8` still owns the glow band and the 4K regeneration. `HANDOFF 9` still owns the four\-band star field and the desync proof. `HANDOFF 10` still owns the kick\-reactive rebuild and the biquad detector. `HANDOFF 11` still owns the WARP correction and everything it says about frame timing — none of that is touched here.

**What this document does:** it closes one idea with a proof, ships one asset and gets it wrong once before getting it right, and records a tuning pass. It also records a mistake I made inside the session, because the mistake is more instructive than the fix.

* * *

## The one\-line version

**Stacking order between the star field and the spine is a mathematical no\-op.** Screen\-blended layers commute exactly — at any opacity, through any mask — so "put the spine behind the star field" cannot change a single pixel. MEASURED at max delta 2/255 across a full frame. The idea is closed, not deferred.

Separately: the spine layer now tiles seamlessly, and there is a new asset for it.

* * *

## Corrections to earlier handoffs — read first

**1\. HANDOFF 10's trap 2 is wrong, and it is wrong in the direction that matters.** It said: *"screen(a,b) is commutative and associative, so where both layers are fully opaque, stacking order does not change the composite at all. Order does matter wherever either layer is partially transparent — which is everywhere the spine's masks feather and everywhere the twinkle is mid\-cycle."*

The hedge is false. Work in darkness, `d = 1 - C`. A screen layer with source `Cs` at opacity `o` composites to

```
    Cr   = (1-o)·Cb + o·(Cb + Cs - Cb·Cs)
    1-Cr = (1-Cb)·(1 - o·Cs)
```

so each layer multiplies the running darkness by `(1 - o·Cs)` — a factor that depends **only on that layer's own opacity and colour, never on the backdrop**. Multiplication commutes. Masking is a spatially varying `o` and changes nothing. So the order of screen layers is exact everywhere, including the feathered mask edges and the mid\-cycle twinkle that trap 2 called out as the exceptions.

**2\. Therefore "the spine BEHIND the star field" is CLOSED.** Not "subtler than behind suggests" — identical. HANDOFF 10 recorded the idea with two traps and a suggestion to probe it; the probe is done and the answer is that there is nothing to see. Do not spend another session on it.

**3\. HANDOFF 10's trap 1 stands and now has a number.** Putting a `z-index` on `.spine-bg` to lower it makes the element an isolated group, its screen\-blended children stop seeing the page, and **1,292,638 of 1,296,000 pixels change**. The correct lever, if anyone ever needs one, is lifting the star layers — `.spine-bg` must keep `z-index: auto`.

**4\. The mirror\-tile crop shipped wrong before it shipped right, inside this session.** The first cut used rows 451..5162, chosen as "inter\-vertebral minima". Row 5162 sits 226 rows past the last strong vertebra, inside the artwork's bottom fade, so mirroring there doubled a dead run into roughly a 450\-row gap and put a visible black rectangle at the mirror point. The recut is 491..4936. Both numbers are in `css/spine-bg.css` with the reasoning; read it before touching the crop.

* * *

## What was measured this session

### 1\. The order flip, three configurations

Reproduced the full background composite — base sky, four twinkle bands at four different frozen opacities, clouds, and both spine art copies with their real mask stacks — and rendered it with the star layers below the spine and above it. 1440×900, headless Chromium, hardware compositing.

```
    ORDER FLIP, shipped config             max |d|   2/255   mean 0.039
    ORDER FLIP, bloom=1 beam=1 forced on   max |d| 116/255   mean 0.228
    ORDER FLIP done wrong (z-index)        1,292,638 of 1,296,000 px differ
```

Two of 255 is 8\-bit rounding. The second row is the exception that proves the rule: **`.spine-bg__bloom` and `.spine-bg__scan` are the only layers on the page that blend NORMALLY**, so they are the only ones whose order matters — and `--spine-bloom` and `--spine-beam` both ship at `0`. If either is ever turned back on, order stops being free.

### 2\. Why the spine artwork could not tile

Both reasons are properties of the drawing, not of the CSS:

- **It fades to black at both ends.** Rows 0..160 and 5368..5503 carry no lit pixel at all, with a \~200\-row ramp inside each. At `--spine-w: 640px` the artwork rendered at scale 0.812, so the two dead ends stacked into a **\~570px black band at every seam**.
- **The ends do not match in shape.** Across the top 400 rows of content the lit column is **919px** wide; across the bottom 400 it is **1361px**. It is a tapered spine, so any seam butts a lumbar vertebra against a cervical one — a visible size step even at zero gap.

Cropping alone could never fix the second one. The tile is rows 491..4936 plus a vertical mirror of that crop with the two shared rows dropped, so both seams join a row to its own neighbour: **max |d| 31/255 at each seam against a median of 60 for adjacent rows elsewhere in the artwork.** The seams are smoother than the artwork's own texture.

**The natural inter\-vertebral gap in the strong region is 28 rows.** That is why the first cut's 226\-row overshoot was so loud, and it is the number that makes 491 and 4936 the right rows rather than approximately\-right ones. After the recut the profile reads **441 at the mirror point against a tile median of 630 and a minimum of 186** — the join is denser than the artwork's own quietest inter\-vertebral space.

The column reverses direction at the mirror point. That is a reflection, not more vertebrae, and it is the price of a seamless tile from a tapered drawing.

### 3\. The side\-card blur

The two cards either side of the hero are now sharp. Ring is measured in layout steps (`stepUnits`), not px, so it survives the `--card-w` breakpoints — 250px desktop, 190px at 900, `min(42vw, 190px)` at 600.

```
    ring   old px   new px      (desktop, step 250.75)
      1      5.81     0.00
      1.5    6.86     0.00
      2      7.92     4.75
      3     10.03     6.86
      4     11.10     8.97
      5     11.10    11.08   <- the 6px cap now lands here, not at ring 4
```

It is a ramp and not an `if`, deliberately. The row translates continuously under a drag or hover\-pan, so a card crosses the 1.5\-step line mid\-gesture; a hard cut would snap it from 0 to \~4.7px in one frame. The gate fades blur in across 1.5..2.0 steps and is exactly 0 at the boundary.

**Side effect worth knowing:** this walks back part of the "side\-card blur is too heavy" item, since everything from ring 2 out is softer than before. That was not the goal. If the far cards now read as too sharp, raise the `/220` divisor, **not** the base of 2 — the base is what the gate multiplies through, and lifting it steepens the fade\-in exactly where the pop would come back.

### 4\. Legibility at the new `--star-cloud`

`--star-cloud` went 0.36 → 1.2. HANDOFF 8 records that 0.92 made the glow the dominant light source on the page, and the 4.5:1 legibility check was last run at 0.36. Re\-run: sky only, twinkle frozen at peak, `#F2F2EE` on the raw backdrop, contrast sampled at glyph scale (14px box).

```
    OLD  sat 1.0  black 12  cloud 0.36    area below 4.5:1   0.83% of frame
    NEW  sat 0.7  black 16  cloud 1.20    area below 4.5:1   2.62% of frame
```

Median contrast barely moves — 17.4:1 to 17.0:1. It is the tail that grows: a bit over **three times** as much of the frame where white text would fail WCAG AA.

**TWO CAVEATS, both load\-bearing.** This is the sky ALONE. The documented 5.45:1 worst case was *text over a lit spine vertebra*, and `--spine-lit` fell 0.52 → 0.18 in the same pass, which pulls hard the other way. **The combined sky\-plus\-spine worst case has not been measured at the new values.** Do not quote 2.62% as the page's legibility number; it is the sky's contribution to it.

### 5\. Tested and NOT shipped: the luminance\-mask "bleed through"

The owner asked whether the spine could bleed through the star field. Since order is free and screen cannot occlude, the only way to get it is to modulate the spine BY the sky — luminance\-masking `.spine-bg__art` with the star image. It works and it looks like depth. It was tried, rendered, and then dropped on the owner's instruction.

Recorded so nobody re\-derives it:

- The mask must be a **baked asset**, not CSS. `mask-composite` is a flat left\-fold, so `(sky ADD floor) INTERSECT (existing stack)` is not expressible — the floor lands inside the ADD branch and the spine paints outside its own ends/sides masks.
- `mask-mode: luminance` is required. The webp is fully opaque, so an alpha mask is a no\-op.
- **UNMEASURED HAZARD, and it is the real cost:** `.spine-bg` is `position: absolute` in document space; the sky is `position: fixed`. A mask painted in the spine's coordinate space slides against the sky as the page scrolls, so the bleed drifts off the nebula it was registered to. The fix is one line — write a `--scroll-y` next to `--charge` in the existing handler and drive `mask-position-y` from it — but it was never built or tested.

* * *

## The mistake, and it is not the one anyone was looking for

Applying a pasted block of tuner values, I used a regex to find each declaration. It matched **inside a comment**. `css/spine-bg.css` documents its variables in prose constantly, and the band section contains the line

```
       --spine-band: 3000px   = OFF. The top edge sits above the layer at every
```

which is indistinguishable from a declaration to a pattern looking for `--name:` up to the next `;`. The replacement ate about 2.7 KB of that comment block.

It was caught on the byte count, the clean file was recovered from disk before anything was committed, and the two real edits were redone by hand. Nothing bad reached the repo. But the lesson generalises past the one file: **in a codebase where the documentation is this dense and this specific, the comments look like code to any tool that is not anchored.** The check that now passes is anchored to start\-of\-line, a real semicolon, and the base `:root` only — `@media` blocks excluded so the mobile overrides can never be clobbered by a desktop paste.

HANDOFF 11's closing line was *check the machine.* This one is smaller and more ordinary: check what your edit actually matched.

* * *

## The mobile override trap has fired again

Both `@media (max-width: 600px)` blocks carry a comment telling the next session to re\-derive them whenever the desktop numbers move, and each cites the previous time it was missed. The desktop numbers moved a long way this session and **the overrides were not re\-derived.** Five are now stale, three of them pointing the wrong way outright:

|  | desktop now | mobile override | direction |
| --- | --- | --- | --- |
| `--spine-w` | 130px | 390px | phone column **3× wider** |
| `--spine-lit` | 0\.18 | 0\.3 | phone brighter |
| `--spine-dim` | 0\.22 | 0\.23 | phone brighter |
| `--star-twinkle` | 0\.46 | 0\.75 | phone twinklier |
| `--star-cloud` | 1\.2 | 0\.21 | phone far less glow |

The ratios the comments themselves prescribe (0.61× width, 0.57× lit, 0.61× dim; 0.75× twinkle; 0.575× cloud) would give `--spine-w: 79px`, `--spine-lit: 0.10`, `--spine-dim: 0.13`, `--star-twinkle: 0.35`, `--star-cloud: 0.69`.

**They were deliberately NOT applied.** Every one is a judgement about a device nobody has looked at, and `--spine-band` is worse than the rest: 3000px is the OFF value *at desktop layout heights only*, and the mobile document is roughly twice as tall, so the phone needs its own off value rather than a scaled one. This is the largest open item in the file.

* * *

## Files changed this session

**New:**

- `assets/hero/spine-column-mirror-4k.webp` — 3072×8890, WebP q84, 381 KB. Rows 491..4936 of `spine-column-moonlight-4k.webp` plus a vertical mirror. 27.3 MP against the source's 16.9 MP; **decoded memory is roughly 116 MB against the old 68 MB, and that is UNMEASURED on a phone.**
- `assets/hero/spine-column-mirror.webp` — 2048×5927, 248 KB, same crop and mirror, LANCZOS to 2/3 width. 12.9 MP, \~51 MB decoded, which is *less* than what shipped before. **Cut for the mobile breakpoint and NOT wired up** — the media\-query line is written out in the session log but was never added.

**Changed:**

- `css/spine-bg.css` — `.spine-bg__art` points at the mirror asset; the full tuning pass; the header and the `.spine-bg__art` comment rewritten with the crop reasoning. `--spine-build` 25 → 28.
- `css/star-bg.css` — the tuning pass. `--star-build` 10 → 11.
- `css/base.css` — `--scroll-weight` 0.5 → 0.15.
- `js/track-experience.js` — the blur ring gate.

**Values as shipped**, so the next session can diff a paste against them without opening three files:

```
    spine   w 130px · dim 0.22 · lit 0.18 · glow 0.46 · feather 330px
            offset 140px · bias 1.3 · band 3000px · band-feather 800px
            bloom 0 · beam 0 · scrim 0
            pulse-lo 0 · pulse-hi 0.1 · pulse-ms 3400ms
    kick    flash 0.34 · shake 6 · gain 1 · decay 260 · sens 1.8 · freq 90
    star    dim 0.8 · sat 0.7 · black 16 · twinkle 0.46 / hi 0.46
            twinkle-ms 4600ms · desync 1 · cloud 1.2 · kick-stars 0.26
    base    scroll-weight 0.15
```

**Not changed:** the source artwork is untouched and still in the repo. No JS behaviour outside the one blur expression.

* * *

## Do not do these

- **Do not reorder the star field and the spine expecting a visual change.** It is a proven no\-op. The one exception is if `--spine-bloom` or `--spine-beam` is turned back on, because those two blend normally.
- **Do not give `.spine-bg` a z\-index.** Unchanged instruction, now with a measurement behind it.
- **Do not find\-and\-replace variables in these stylesheets with a loose regex.** The comments read as declarations. Anchor to start\-of\-line and a real semicolon, and exclude `@media` blocks or a desktop paste will silently rewrite the mobile overrides.
- **Do not recut the mirror tile without reading the "WHY 491 AND 4936" paragraph** in `css/spine-bg.css`. The natural gap is 28 rows; a crop that misses by 200 puts a black rectangle on the page and it is not obvious from the numbers why.
- **Do not treat `--spine-lit` as brighter than `--spine-dim` any more.** It is 0.18 against 0.22 — the charged column is now DARKER than the uncharged one, and with `--spine-pulse-lo: 0` the playing state is darker still. Flagged to the owner and kept, so it is presumed deliberate, but the variable names no longer describe the relationship.
- **Do not raise the blur base of 2 to bring the far cards back.** Raise the `/220` divisor. See the blur section.
- **Do not quote 2.62% as the page's legibility figure.** It is the sky alone; the spine got much dimmer in the same pass and the combined case was never measured.
- **Do not scale the mobile blocks from memory.** Re\-derive from the ratios in their own comments, and give `--spine-band` a mobile off value rather than a scaled one.
- Everything in HANDOFF 7's, 8's, 9's, 10's and 11's "do not" lists still stands.

* * *

## Still open

- **THE MOBILE OVERRIDES ARE STALE.** Five values, three pointing the wrong way, `--spine-w` at 390px against a 130px desktop. Largest item in the file and the cheapest to fix. Table and prescribed ratios above.
- **THE COMBINED LEGIBILITY CASE AT THE NEW VALUES.** Sky measured, spine not. Needs the real page with its text on it.
- **THE STAR FIELD ON A PHONE**, unchanged from HANDOFF 11, and now with a second unmeasured mobile question beside it: the mirror asset's decoded memory. The 2048 cut exists precisely for this and is one media\-query line from being wired.
- **`--kick-shake` is a px value that has never been seen on a phone.** Every mobile value in the project is still inferred.
- **DNS for `kundalinispines.com`** — unchanged, still the single blocker on anything being reachable. Enable sequence in HANDOFF 5; do not enable Pages without the custom domain.
- **The spine and the star field are on `index.html` only** — the other four pages are flat black, so the site still reads as two different sites.
- **Pre\-existing mobile nav bug.** Closed menu panel not fully off\-screen, bleeding behind the fixed header on every page.
- **The earlier album is unacknowledged on the site** — nine YouTube videos, see HANDOFF 6.
- **The YouTube unit tests are not in the repo.**
- **Buttondown deliverability unverified** — still the highest\-consequence unknown.
- **Instagram and X are owner\-supplied, not verified.**
- **`explicit` is `null` on all 28 tracks;** streaming links all `null`; `data/releases.json` entirely `PLACEHOLDER`; downloads and Stripe/Gumroad not started.
- **TikTok and Spotify accounts do not exist** — dead footer links, owner's decision, do not "fix" them.
- **Accent hue collisions** — may\-26th / blue\-pills, uzi\-fruit / the\-33rd\-floor.
- **May 26th's cover→video crossfade has still never been watched.**
- **The 885 MB masters folder is still backed up by nothing.**
- **27 × `assets/music/*-cover.jpg` and `full-zoom-cover.webp` are tracked and referenced by nothing** — \~1.2MB, removable with `git rm`.

**Closed since HANDOFF 11:**

- **The spine tiling gap.** Twice — the \~570px seam band, then the mirror\-point rectangle the first fix introduced.
- **The spine\-behind\-the\-star\-field idea.** Answered with a proof, not deferred. Trap 3's withdrawal in HANDOFF 11 stands: there is no 20fps problem, drive the clouds as hard as it looks good — and `--star-cloud` is 1.2 now, so somebody did.
- **"Side\-card blur is too heavy"** — partially. The ±1 cards are sharp and everything from ring 2 out is softer, but that was a side effect rather than a decision, so re\-judge it rather than assuming it is done.

* * *

## Housekeeping

`spine-column-moonlight-4k.webp` stays in the repo. It is the source the mirror tile is cut from, the crop rows in `css/spine-bg.css` are meaningless without it, and it is the revert target if the mirror is ever abandoned. **Do not "tidy" it away** on the grounds that no CSS references it.

`spine-column-mirror.webp` (the 2048 cut) is likewise referenced by nothing right now. It is one line from being wired and it is the answer to a live open question. Same instruction.

* * *

## The closing line, again

HANDOFF 5 and 6 ended on *measure it, do not eyeball it*. HANDOFF 7 added *know what your instrument cannot see*. HANDOFF 8 added *when a number refuses to move, ask what it is actually measuring*. HANDOFF 9 added *take the baseline*. HANDOFF 10 added *check that it measures the thing you care about — a rate is not an accuracy*. HANDOFF 11 added *check the machine.*

This session added two smaller ones, both about believing a thing that was nearly true. Trap 2 was right that screen commutes and wrong about where it stops, and the hedge sat in the record for two sessions looking like a caveat instead of an error. The mirror crop was cut at a point that satisfied the stated criterion — an inter\-vertebral minimum — and still landed 226 rows inside a fade, because the criterion was not the whole requirement.

> Measure it. Know what your instrument cannot see. When a number refuses to move, ask what it is actually measuring. Take the baseline. Check that it measures the thing you care about. Check the machine. And when a rule comes with an exception, check the exception too — a caveat nobody has tested is not a caveat, it is a guess with good posture.
