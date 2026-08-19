# Kundalini Spines — Spine UI V2 Handoff 41

**Date:** August 18, 2026

Twenty-third handoff of the **Spine UI V2** track (branch `feature/spine-ui-v2`).
`40` owns the play-and-park clip and the marker lab; `39` owns the section
stepper. The plain `HANDOFF 1`–`19` series documents the dormant production
site on `main`.

---

## The one-line version

**The journey left the lab and landed on `index.html`, the phone was looked at
for the first time, and five of 40's open items closed. The background clip,
the film rows, the VHS treatment and the spine render are all now on the live
home page. Twelve commits, all pushed.**

---

## Corrections to earlier handoffs

- **40's "Merch parks on the clip's brightest frame and `--df-lum` is at its
  maximum there… there is no headroom left" IS WRONG, and it was asserted
  rather than measured.** Swept at Merch against the copy's real colour: gain
  0.50 gave 8.94:1, gain 0.30 gives 8.40:1, and **gain 0.00 still gives
  7.49:1 — clear of WCAG AAA.** There was never a readability wall anywhere
  near where that number sat. Both places the claim appears in
  `css/deep-field-bg.css` now carry the correction and the sweep.
- **40's "the clouds live at Music and Stay Connected" was the bug, not the
  design.** `.ks-cloud-sky` was tied straight to `--df-sky`, so the cover
  existed on two stops of eight. Now a floor (`--df-cloud`, ships at 1).
- **The note that the cloud sky's WebGL canvas cannot be screenshotted is
  half wrong.** Playwright screenshots DO composite it — proven by forcing the
  wrapper 0 → 1 at Merch and diffing: **46.07% of pixels changed, max channel
  delta 253.** Only `drawImage` readback returns the false zero (webgl2 without
  `preserveDrawingBuffer`). A whole legibility pass was measured through the
  screenshot path.
- **39's item 2, "the spine render's interpolated re-export", was the wrong
  diagnosis.** The judder was never the seam — see "What shipped" 12.
- **`scrubToScroll` is deleted** (40 kept it one more session). Its constants
  are preserved in a note where it stood.

## THE METHOD FINDING: A NUMERIC CHECK CAN PASS ON AN UPSIDE-DOWN PICTURE

The VHS shader shipped inverted for one round. Every check passed while it was:
the canvas mounted, the context was live, zero console errors, and **"99.6% of
the row's pixels changed" is exactly as true of an inverted picture as of a
correct one.** Only a side-by-side caught it.

The cause is worth keeping: I removed the reference shader's `1.0 - p.y`,
reasoning that a `<video>` uploads top-down where a 2D canvas does not, and
wrote a confident comment saying so. `vUv` comes from a full-screen quad, so
`vUv.y = 1` is the TOP of the screen while texture coordinate `t = 1` is the
LAST row uploaded — the BOTTOM of the image. A second inversion I had added to
compensate (the head-switching band read as `1.0 - uvn.y`) went with it. **Two
inversions that cancelled in the numbers and did not in the picture.**

## THE OTHER METHOD FINDING: BUILD THE INSTRUMENT, NOT THE ONE-OFF

Three of this session's "findings" were the measurement lying, all caught
before they became changes:

- **"The rail label is clipped 4px."** `querySelector('span')` inside a node
  returns `.ksd-node__ring`, and an active ring is scaled mid-animation. The
  real label was **62% off-screen**, not 4px — a much bigger fault found by
  measuring the right element.
- **"The track description is clipped mid-word."** It was a cropped screenshot
  whose right boundary sat exactly where the text ends. Measured per word with
  Range rects: max ink 387 against a 390 viewport, nothing clipped. What WAS
  real was the 3px gutter beside it.
- **"The atmosphere adds nothing to the film row."** A confident 0.00 that was
  correct — but only trustworthy because the edge bands measured +24.3, +7.1
  and +2.7 in the same run. **A zero is only a finding when something nearby
  is non-zero.**

The Music heading was cut by 5px and nothing caught it: the box measured inside
the viewport, `scrollWidth` reported no overflow, and only per-word Range rects
compared against **the nearest `overflow:hidden` ancestor** showed the ink
crossing it. That technique is now a scanner — walk every text node, take ink
extents from a Range, compare against the clipping ancestor rather than the
viewport, at 320/390/430 with the page scrolled. Use it; it finds the next one.

## WHAT SHIPPED

### 1. The journey is on `index.html` (40's open item 1, carried since 38)

Rebuilt from `home-deepfield-lab.html` byte for byte, changing only the
lab-specific comments — a hand-copy of seven changes is seven chances to
differ. Verified first that both files took `10072fe` and that every index-only
line was the paired original of a `ksd-reveal` addition. After the port,
stripping all comments from both leaves **markup identical except the lab's
`noindex`**, and all eight stops agree with the lab exactly.

The lab is kept and its banner now says `index.html` is the live copy.

### 2. A dead clip could leave Music with no title

The `h2` was hidden by `html.df-live`, which means "the module is running" —
NOT "the card ran". A clip that errors or never decodes leaves `df-live` set
forever and fires no cue, so the reveal backstops handed the content back and
the card was never released. Measured by aborting the clip: h2 opacity 0, card
opacity 0, 28 track cards up and nothing naming them. Keyed to `.df-titled`
now, set at the moment the card takes the screen.

**Then rotation found the same failure by another route.** Both classes are set
once at init with no `matchMedia` listener, but the card is `display:none`
below the gate while the h2-hiding rule was in no media query at all. Load at
≥768, rotate to portrait, and the heading is hidden with nothing to replace it —
iPhone 14 Pro landscape is 852 CSS px, so it is an ordinary path. The restore
rule **must sit after the rule it undoes**: media queries add no specificity and
both selectors are (0,5,1).

### 3. The cloud cover stops following the sky down

`.ks-cloud-sky { opacity: max(var(--df-cloud, 0), var(--df-sky, 1)) }`. At 0
it is byte-for-byte the old rule; it ships at 1. Costs measured, text hidden so
the crop is true background: worst case **1.3 of 255 and 0.09 of a contrast
ratio point**. The scrim having "no headroom" turned out not to matter — the
cover is broad and low, not a flash.

### 4. The first mobile pass (40's open item 4)

The gate holds: `df-live` never set, nothing held by `.df-cued`, `.df-bg`
display:none, **the clip never fetched**, and after a full scroll **zero
reveals left hidden**. No horizontal overflow at 320/390/430. The three
below-fold videos DO get their preload upgrade on a phone — the release block
is a separate IIFE above the gate — measured `preload=auto, readyState=4`.

Fixed: the Music heading cut by 5px at 390 (ink 371 against a clip at 366); the
Music and Stay Connected blocks bleeding 24px past an `overflow:hidden`
ancestor and losing their gutters; every rail label 62% off-screen; the Merch
copy centred on a phone; 140px of desktop carousel headroom (341px of dead
space); `.track-arc-wrap`'s transition reinstating motion for reduced-motion
users; the module running at exactly 768 (iPad portrait) on top of the phone
carousel — all three gates now agree on 768.

### 5. The old deep-field clip is retired (40's item 3)

9.2MB out, including `deep-field-marks.json` — the owner's original marks. Their
content survives in `deep-field-2-marks.json`'s `_moves` and in handoff 40's
table; the file is in git history. Lab default is now `deep-field-2`, and an
unknown `?clip=` already fell back, so old links still open.

### 6. `scrubToScroll` is deleted (40's item 7)

4022 bytes. Its constants are recorded where it stood: the 0.3 lerp (up from
0.22), the 0.005 settle, the 1/48 write threshold, the `!seeking` coalescing
guard, the 0.10..0.80 window, the `duration - 0.05` clamp, and the `-g 4`
reasoning another comment pointed at. Two verbatim copies survive in the
filmrow labs and are now the only running ones.

### 7. The owner's handoff timings (40's item 2, tuner half)

`--df-sky-in` 0.055 → 0.06, `--df-sky-out` 0.10 → **0.06**, `--df-title-ms`
1000 → **800**. The two sky rates are equal again; the asymmetry lasted half a
day. Cost measured both ways on the Music → Merch leg: at 0.10 the nebula
cleared 15 frames in (clip owns 79% of the leg); at 0.06 it clears 27 frames in
(**61%**). Gentler handover, less clean footage — the trade is written beside
the dial.

### 8. The film-row atmosphere, tuned — and the glow was off

`--fr-glow-base` was **0.000**: a layer tuned, mounted and composited with its
whole intensity multiplied by zero. Now 0.025. The foreground is a dust field
rather than a smoke field — effective population 6 wisps + 63 motes → **2 wisps
+ 300 motes**. `reach` went to 0.45, the top of its range and the documented
readability guard, so it was measured rather than trusted: **centre 45-55% moved
exactly 0.00 of 255** while the top edge moved 24.3, the left 7.1, the bottom
2.7 — the guard holding, and the edge numbers proving the layer was on.

### 9. The Archive film row, mirrored (40's item 9, one of three clips)

`rain-transmission-rooftop` on the Archive section, film LEFT and copy RIGHT —
the only row on the page that reads right-to-left. `.ksd-filmrow--mirror`
**swaps the track sizes** rather than only reordering, so every row gives its
copy the same width whichever side it is on; below 900px the figure carries
`order: 1` so Archive stacks copy-then-film like everything else. Media measures
563×469 / 768×640 / 497×414 at 1440 / 1920 / 1280 — identical to the other two.

The h2 moved inside the copy column, so **the Archive rail node rises 32px**
(h2 doc top 4816.23 → 4784.23). Section height and document height unchanged, so
nothing below moved and no landing shifted.

### 10. The film rows dropped `-g 4`

That density buys cheap SEEKING and these only play and loop. **5.95MB saved**:
black-tide webm 2211 → 708KB, spine-frequency 2533 → 610KB, and the new clip
costs 528KB + 786KB instead of ~4MB. black-tide's webm lands back at exactly
the 708KB it measured before `-g 4` was added.

### 11. The VHS tape treatment, on all three rows, with a tuner tab

The owner's shader; the plumbing deliberately not theirs. The reference renders
HTML into a canvas via `drawElementImage` / `requestPaint` — an experimental
Chrome-only API, absent in Firefox and Safari — and that path is **not used**: a
`<video>` is already a first-class WebGL texture source. Tab "VHS", 15 sliders
in three sections, Reset and a Copy that prints the whole `DEFAULTS` literal.

Gated off below 768px; under reduced motion it paints once then freezes. Frame
rate on the Archive row: **308.2 fps with the tape against 306.7 without.** The
owner's settings are baked in — `barrel` came off zero, measured at 0.03 as
−3.1/−3.8/−5.2 at the corners and **+0.2 at the centre**.

### 12. The spine spin, re-exported — and the diagnosis was wrong

`SpineSpin.mov` is 241 frames but only **193 are unique**: every 5th is
bit-identical, because it is a 24fps render conformed to 29.97. The master buys
12-bit alpha and 3840×2144 and **not one extra instant of motion**. The old
encode resampled that conform with `-r 24`, resolving by timestamp instead of
dropping duplicates, so the shipped clip **held one frame and skipped the next,
six times a second.** Measured independently of the report that proposed it:

| | frames | frozen steps | lurches | CV |
|---|---|---|---|---|
| old | 193 | **48** | 41 | 0.788 |
| new | 190 | **0** | 5 | 0.273 |

**The old seam was already within 2% of optimal** — do not re-run that search.
The clip holds 1.020 revolutions, so the loop start is forced into the first few
frames, and there is an irreducible floor of ~1.2 frame-steps because the render
does not return exactly to its start orientation.

`loopRange` is gone and **leaving it would have been a bug**: `SPIN_OUT` was
8.0086 against a file that is now 7.9167 long.

### 13. Merch got its brightness back

The owner asked why Merch looks dark when it is parked on the brightest frame.
Those are the same fact: the scrim is `base + gain * lum`, so parking on
`--df-lum 1.000` drove it to its ceiling of 0.85. Measured at every stop, it
only ever bit in two places — **Merch 80.6% taken, Archive 58.6%, every other
stop 0 to 4%**. `--df-scrim-gain` 0.5 → **0.30**: Merch background 19.0 → 38.3,
the dark stops move by under 1. Copy still AAA at both (7.88:1, 8.13:1).

## What is deliberate, so nobody fixes it

Everything in 30–40's lists still stands, except where corrected above.
Additionally:

- **`--snare-all: 0.12` ships on the home page including phones.** It reads as
  "the lab only" in older comments; landing the background is what put it live.
  Never judged on a phone.
- **The filmrow atmosphere is still `LIVE = false`.** Everything in item 8 is
  tuned, measured and switched off.
- **`data-fr-glow="rain-transmission-rooftop"` has no gradient block** and takes
  the documented default field until one is tuned.
- **`-g 4` is now surplus on the spine render** and is kept only because it is
  what was encoded. A `-g 48` build measured 4.78MB at crf 33 against the landed
  file's 4.86MB at crf 40 — smaller AND higher quality.
- **The VHS is off below 768px** and the film rows show plain video there.
- **The lab is a near-duplicate of `index.html`** and will drift.

## Do not do these

Everything in 19–40's lists still stands. Additionally:

- **Do not scope the Music h2-hiding rule on `html.df-live` alone.** It survives
  a resize the card does not. Keep the `.df-titled` key AND the below-gate
  restore, and keep that restore AFTER the rule it undoes.
- **Do not remove the `1.0 - p.y` flip in the VHS shader**, and do not "fix" the
  head-switching band to `1.0 - uvn.y` to compensate.
- **Do not reintroduce `drawElementImage` / `requestPaint`.**
- **Do not re-run the spine seam search.** It is at its floor; the render does
  not close.
- **Do not drop `-g 4` from `deep-field-2`** — reverse travel is a seek loop.
- **Do not trust a "no headroom" or "cannot be measured" claim** that has no
  measurement attached. Two of them were wrong this session.
- **Do not read a zero as a finding** unless something nearby in the same run is
  non-zero.
- Still: never `python -m http.server`, never `file://`, no Python text-mode
  writes to JS/CSS/HTML.

## Verified vs. asserted

**Verified by tooling and looked at** (Aug 18 2026, Playwright/Chromium over
`scripts/serve.py`):

- The full journey re-run after **every** change — seven legs both directions,
  frame counts exact, `playbackRate` never leaving 1, sky at all seven stops.
- Parks measured in seconds against the marks file: worst error **10.2ms**, a
  quarter of a frame, across three runs.
- Title card centred on the Music node at **0.01px mean**, three viewports.
- Mobile at 320/390/430 + landscape 852 + iPad 768 + reduced motion + rotation.
- Clip scanner: nothing clipped and nothing within 8px of the edge at all three
  widths.
- Touch: menu opens and navigates, carousel swipes, signup input is 16.1px so
  iOS will not zoom.
- All ten pages: zero 4xx, zero console errors.
- Spine alpha decoded (256 levels, min 0) rather than read off the stream line.
- **Screenshots taken and looked at:** hero, About, Music title card, Merch
  before/after brightness, Archive row, the VHS side-by-side, the phone menu,
  Stay Connected, the spine composited over the nebula.

**Asserted / not verified:**

- **The ~675ms the hero-wait adds before About's reveal has still not been
  judged by eye.**
- **The fork strike has never been judged on a phone.**
- **Nobody has watched the VHS on a real phone** — it is gated off there.
- The 768–900 band on a real touch tablet; Safari, as ever.
- The mp4 fallback has still never been the chosen source in a browser.

## Git state

- Branch `feature/spine-ui-v2`. Session start `d22cacb` (handoff 40).
- **Twelve commits, all pushed**, ending `117604a`. 29 files, +1386/−500.
- Net binaries: −9.2MB (old clip) −5.95MB (film rows) +1.31MB (rooftop)
  +1.1MB (spine) ≈ **13.7MB lighter**.
- `--spine-build` 42, `--star-build` 29, `--df-build` 4 → **11**.
- `main` untouched. No PR.

## Still open

1. **Decide `LIVE`** for the filmrow atmosphere. Everything is tuned and
   measured and nobody can see it. This is the cheapest win on the list.
2. **Judge the hero-wait (~675ms)**, and the fork strike on a phone.
3. **Two clips left** for film rows: `last-train-below`, `the-black-archive`.
   The Archive row is the pattern — markup plus an encode, no new JS.
4. **A glow gradient block** for `rain-transmission-rooftop`.
5. **Mobile judgement calls:** nav links 25px and the signup button 42px (both
   clear WCAG 2.2's 24px but miss Apple's 44px, and the nav is shared by every
   page); tablets and landscape phones ≥768 get the full journey and its 4.9MB
   clip; **About sits at 3.55:1, under AA** — pre-existing, found by the cloud
   measurement.
6. **Whether the VHS should run on phones.**
7. **The lab's fate**, now that it duplicates `index.html`.
8. **Phase two of the Music handoff** — playback gating, where a playing track
   holds the sky. All four hooks exist, none used.
9. **A `-g 48` re-export of the spine render** (smaller and better).
10. Whether the two filmrow labs should stop scrubbing to match the real page;
    the doc-rail ring inversion; the frame-budget decision; `music.html` is
    still a redirect stub; stale amber-era `?tune` TIPS prose; the two missing
    trivia files; the astral scrim; the inherited pile.

---

## Starting the next V2 chat

Attach this file. The working folder is
`C:\Users\Haight\Desktop\kundalini-spines-spine-ui` on `feature/spine-ui-v2`.
Serve with `python scripts/serve.py`, browse `http://localhost:8000` — never
`file://`, never `python -m http.server`.

> Here's the latest V2 handoff. The whole journey is on index.html now and the
> phone has had its first pass. I want to <thing> this session.

The single most useful next step is **deciding `LIVE`** — the film-row
atmosphere is fully tuned, fully measured, and switched off, so it is one line
between the work already done and anyone seeing it.
