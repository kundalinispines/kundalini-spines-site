# Kundalini Spines — Spine UI V2 Handoff 38

**Date:** August 17, 2026

Twentieth handoff of the **Spine UI V2** track (branch `feature/spine-ui-v2`).
`37` owns the deep-field clip and the marker lab; `36` owns the film-row
foreground, the blue palette and the reveal fixes; `35` owns the merged tuner.
The plain `HANDOFF 1`–`19` series documents the dormant production site on
`main`.

---

## The one-line version

**The owner marked the clip, and part 2 shipped: the whole scroll-driven home
background now exists in `home-deepfield-lab.html`, a full clone of the real
page — section-anchored mapping, the Music sky handoff, a Music stop that
releases to Merch, the hero restored, and the palette swapped from Signal Red to
a violet sampled out of the clip. `index.html` is still byte-unchanged, but it
no longer RENDERS unchanged: the palette and the Stay Connected centring reach
it through shared CSS.**

---

## Corrections to earlier handoffs

- **37's "Still open" item 1 is closed.** The owner marked the six parts. The
  file is committed at **`assets/lab/deep-field-marks.json`** — 21 marks, 6
  sections. 37 said it "has NOT been produced yet"; it has, and nothing can
  regenerate it, so treat it as source material rather than as output.
- **All four of 37's open questions are answered.** The hero does not stay
  parked (see below); "swap to the reactive" means the existing star/nebula
  system; the scroll budget is the whole page, section-anchored; and the name
  `deep-field` stays.
- **THE HERO WAS PARKED AND THEN UNPARKED, INSIDE THIS SESSION.** It was removed
  on the owner's call, the title screen replaced it, and then the owner asked
  for it back — so it is once again the production `.ksd-hero` markup, driven by
  `js/hero-video.js`, with its scrim and sound toggle. Any note from the middle
  of this session saying the hero is gone is stale. **`.ksd-title` and
  `.ksd-title__measure` no longer exist.**
- **36's "do not put the violet back" does NOT cover the palette.** That entry
  is scoped to `KSFilmrowFG.defaults.tint`, and its reasoning is that a hue-255
  tint sat outside the site's 204–230 cold band and read as purple against the
  sky it was supposed to join. An accent has the opposite job. The film-row tint
  is untouched and still blue; the ban still stands where it was written.
- **37's crf note stands**, and nothing about the encodes changed.

## THE METHOD FINDING: MULTIPLY, NEVER REPLACE

**Two bugs this session, same shape, both mine, both invisible in a still
frame.** This is the one to carry forward.

`css/star-bg.css` builds its effects as **indirections**: a base value, and
playing-state rules that REBIND the derived property with more terms in it.

```css
:root.is-spine-kicking {
  --star-cloud-amp: calc(var(--star-cloud) * 1.8 + var(--kick) * var(--kick-cloud));
}
```

To suppress the sky behind the clip, `css/deep-field-bg.css` re-declared
`--star-cloud-amp` and `--star-twinkle-amp` at the same specificity, later in
the cascade. It won — and **replaced the formula instead of scaling it**,
throwing away the 1.8 swell, the `--star-twinkle-hi` lift, and
`+ var(--kick) * var(--kick-cloud)`, which IS the nebula answering the drum. The
sky stayed correctly suppressed and simply stopped responding to music. **The
owner found it, not the instruments** — it looks right in every screenshot.

The same mistake, one build earlier, on the lightning: a bare
`.star-bolt { opacity: ... }` matched star-bg.css's own `.star-bolt { opacity: 0 }`
at (0,1,0), won on load order, and lifted the idle-zero off **all five** bolt
divs. Every pattern lit on every strike. The rotation machinery was never
broken — five superimposed patterns simply read as one flat flash, so the
variety was invisible and it looked like a single repeating bolt.

**The rule: reach for the variable the effect is BUILT FROM, not the one it
READS.** `--df-sky` now multiplies inside star-bg.css's four formulas with a
`var(--df-sky, 1)` fallback, and the bolt override matches the struck rule's own
(0,3,0) rather than the base rule.

**If a third sky effect ever looks flat, check this first.**

## THE OTHER METHOD FINDING: THE TEST LIED FOUR TIMES

Four "failures" this session were the instrument, not the code. Worth knowing
because each one was momentarily convincing:

- **The catch-up "cut."** A sampling filter matched exact integer milliseconds
  against rAF timestamps, returned one row, and read as a jump cut. The race was
  smooth — 16 distinct frames.
- **The snap-off "failure."** `scroll-weight.js` was still animating from the
  previous wheel when the test started, so the page drifted to its target, not
  the one under test.
- **The centring "failure."** Blocks measured as 43px off-centre were compared
  against the column's BORDER box; they were exactly centred in its content box.
  (The 43px turned out to be real anyway — see Stay Connected below.)
- **Two bolt runs proved nothing at all.** A synthetic `btn.click()` is not a
  user gesture, so playback never started, `is-spine-kicking` never appeared,
  and zero strikes were captured. One of those runs reported "100% forks" from a
  counting bug on a single stale class.

**Before believing a red result, check whether the harness was in the state the
test assumed.**

## WHAT SHIPPED — `home-deepfield-lab.html`

A **full clone of `index.html`**, changed in five marked places (search `DF LAB`).
`index.html` itself is byte-identical to session start.

### The mapping

Section-anchored piecewise: each section's scroll span drives its own frame
span. A linear map was checked against the real page and rejected —
`.ksd-section` is `min-height: 92vh`, so the page's sections are roughly EQUAL
while the clip's movements run 32.5% down to 7.9%; every flash dissolve would
have fired in the gaps between sections.

**Boundaries sit one `--nav-h-max` ABOVE each section top.** This was a real bug
for most of the session: `jump()` lands a rail click at `sectionTop - --nav-h`,
so boundaries measured at the raw top sat one masthead BELOW every landing.
Clicking Merch landed on **f134 — the Music park frame, an entire section
behind**; Transmissions on f193 instead of f196. Music was immune only because
it declares its own `scroll-margin-top`.

Final map at 1440x900:

| section | scroll | frames | fr/1000px |
|---|---|---|---|
| Home | 0–808 | f0 held | — |
| About | 808–1636 | 0–134 | 161.8 |
| Music | 1636–2802 | 134–157 | 19.7 |
| Merch | 2802–3852 | 157–196 | 37.1 |
| Transmissions | 3852–4680 | 196–265 | 83.3 |
| Archive | 4680–5508 | f265 held | — |

### Three remaps, and why the marks file was NOT edited

The marks are the owner's record. Where those frames get SPENT is a layout
decision, so all three remaps live in `js/deep-field-bg.js` with their
measurements attached:

- **Home → About.** The hero covers the first screen, so About takes the whole
  0–134 rather than spending the clip's strongest opening on a stretch nobody
  sees. Costs About 104 → 162 fr/1000px.
- **Merch → Transmissions at f196.** f178 as marked is inside the star zoom.
  Scanned f174–234 at 160x90 with frame-to-frame delta as the motion figure:
  zoom is f176–184 (motion 10–14, blue h218–235); the calm magenta band is
  **f192–200** (motion 4.2–5.4, 32–39% pink, lightness 11). f196 is the pinkest
  calm frame. Landing on it by SCROLL instead would have needed 281px into the
  section, putting the headline 30px above the viewport top.
- **Transmissions → Archive.** The clip now finishes before Archive, which holds
  f264 — measured in 37 as the second-best match to the sky plate (r = 0.695).
  Archive and Stay Connected now land on the same image, **verified identical at
  mean RGB 10/14/25**. The flash sequence (f210–226) moved into the tail of
  Transmissions.

### The Music handoff and the stop

- **Parks on f134** — the frame `find closest` elected as the best structural
  match to the plate (r = 0.720), which is why the owner put the boundary there.
- **The sky ramp is geometry-derived**, not a distance: it completes exactly
  where the carousel and its controls are framed. That rest point is computed
  from the PAINTED union of all cards plus the focus panel — **not**
  `.track-arc-wrap`, whose box excludes the focused card's `translateY(-148px)`
  lift, and with the pending `translateY(24px)` entrance transform subtracted.
  Both were real bugs the owner reported as "the card is clipped."
- **`#tracks` gets a NEGATIVE `scroll-margin-top`** derived from that rest
  point, so the nav link, `/#tracks` and the rail node all land identically.
- **The stop**: settling inside Music snaps to the rest point; one wheel gesture
  releases to Merch. It intercepts the wheel rather than using CSS scroll-snap
  because `scroll-weight.js` already takes every wheel event —
  `deep-field-bg.js` is script 6 and `scroll-weight.js` is script 8, so its
  listener registers first and `stopImmediatePropagation()` means scroll-weight
  never sees the release. **The snap only fires from a 140ms settle**, which is
  also what keeps it off scroll-weight's toes.
- **The release drives the clip off its OWN progress**, not scroll position. The
  first build glided the full 700ms with the clip still parked, because the
  viewport top had not yet crossed into Merch — the race happened after the page
  had stopped.

### The rest

- **Scrim** driven by the clip's own measured per-frame luminance, opacity only.
  The clip swings 5.6x and the flashes land mid-section over body copy.
- **True crossfade** — the video fades as the sky arrives. It has to be: every
  sky layer is `mix-blend-mode: screen` and can only ADD light.
- **Boot dissolve** — `--df-sky` starts at 1, so the page opens on the sky and
  dissolves into the clip once the decoder has a frame.
- **Pipe priority.** The three film-row clips (9.3MB) went out at 430ms on
  `preload="auto"` and held the connection to ~2900ms; deep-field did not start
  until 2007ms and then needed only 1195ms. They now ship `preload="none"` and
  release on hero `canplaythrough`, first scroll, or a 4s backstop. **There is
  no attribute for this** — `fetchpriority` is not honoured by `<video>`.
- **Reveal stagger** — cue frames are an ORDERING KEY, not a scroll position;
  they fire on the existing observer and stagger 90ms in CSS.
- **Deep Field tuner tab**, 8 dials in 3 groups.

### The palette, and Stay Connected

Signal Red → violet, **site-wide**, sampled from the clip's opening and lifted
to equal contrast on the page floor:

| | old | new |
|---|---|---|
| `--color-crimson` | `#7E2630` h353 s54 l32, 2.15:1 | **`#5F2A8E`** h272 s54 l36, 2.15:1 |
| `--color-crimson-lit` | `#A1333E` 2.97:1 | **`#7A39B3`** 2.98:1 |
| scan-line core | `#C8302E` | `#9D3CD2` |
| `--ring-color` | `161, 51, 62` | `122, 57, 179` |

Lightness had to RISE to hold contrast — blue-violet carries less luminance than
red at the same HSL lightness. The clip's own purple is s21 and would have been
mud.

**`--ring-color` was nearly missed.** It spells the colour as a decimal triplet
because three rules wrap it in `rgba()` at different alphas, so a hex grep does
not see it — and it is the live rail ripple on the home page. Without it the
palette would have gone violet and the rail would have stayed red.

**Stay Connected now centres**, cloning `.ksd-music-head` — `text-align` plus
`margin-inline: auto`, sharing Music's centre by construction (788 = 788).

## What is deliberate, so nobody fixes it

Everything in 30–37's lists still stands. Additionally:

- **`--color-crimson` holds a violet and the name was left alone.** Renaming
  touches 15 files; the value swap is two lines. Same tolerance the codebase
  extends to `--spine-lit` and `--spine-dim`.
- **The violet is a QUIETER accent than the red by 81 degrees.** The site's cold
  band is 204–230; Signal Red sat ~123° outside it, this sits 42°. Consequence
  of the choice, not a defect.
- **`--df-sky` initialises to 1, not 0.** If the module never runs the page
  lands on the site as it looks today rather than bare `#03040F`. Fail towards
  the sky.
- **The video is at `z-index: -2`** while every sky layer is at -1, so paint
  order is decided by number rather than by tree order.
- **Stay Connected's centring does not overturn the note it replaced.** That
  note bans adopting the `.newsletter` CLASS and its cross-page coupling, not
  the visual result. `connect.html` has neither the attribute nor
  `spine-doc.css`.
- **`width: 100%` on `.ksd-connect` is not redundant** next to its max-width: an
  auto cross-axis margin cancels flex stretch, and without it the block fell to
  428px and the form's button wrapped to its own line.
- **`--snare-all` (the fork strike) ships at 0 everywhere except the lab.**
- **`--df-card-gap` ships at 0 and is an escape hatch, not a dial.**
- **Both sky ramps are geometry-derived.** `--df-fade` is gone; `--df-tail` is a
  fraction of Archive, not a distance.
- **The About film row carries no reveal**, because its section's third cue was
  the parked hero video.

## Do not do these

Everything in 19–37's lists still stands. Additionally:

- **Do not re-declare `--star-twinkle-amp` or `--star-cloud-amp` anywhere.**
  Multiply into the formulas in `css/star-bg.css`. See the method finding.
- **Do not write a bare `.star-bolt { opacity }` rule.** Match the struck rule's
  (0,3,0) or the idle-zero comes off all five patterns.
- **Do not use `align-items: center` to centre a `.ksd-section`.** It
  shrink-wraps the headline, changing its height — and `js/spine-doc.js:76`
  places the rail node at `r.top + r.height / frac`, so the node slides.
- **Do not frame the Music carousel off `.track-arc-wrap`.** Measure the painted
  union of the cards and panel; the focused card is transformed outside its
  container.
- **Do not edit `assets/lab/deep-field-marks.json` to reflect a remap.**
- **Do not raise `--snare-all` far.** A fork that happens often is just the bug
  again, with no variety left to interrupt.
- **Do not touch `.ksd-doc__col`** to centre something — `css/astral-scrim.css`
  mirrors its padding and carries a keep-in-step warning.
- Still: `-g 4` on every scrubbed clip, no Python text-mode writes to
  JS/CSS/HTML, never `python -m http.server`, never `file://`.

## Verified vs. asserted

**Verified by tooling and looked at** (Aug 17 2026, Playwright/Chromium over
`scripts/serve.py`, 1440x900 unless stated):

- All six section boundaries land on the exact marked frame; all five rail
  landings exact after the masthead fix.
- Music rest point framed at 1440x900, 1920x1080 and 1440x760, via three
  navigation routes — nine landings, all identical.
- Park holds f134 across 0/25/50/75/95% of Music. Catch-up: 16 distinct frames,
  f134→f156 in 393ms. Release: 22 distinct frames under the glide, sky gone
  inside 130ms.
- Sky curve correct at six probes with `sky + clip === 1.0` throughout; the
  Music crossfade has **no midpoint dip** (luminance declines monotonically
  19.80 → 16.04; lowest intermediate 16.26 sits above the endpoint).
- Boot dissolve traced from first paint: opens at 1.000, dissolves at ratio 0.94
  per frame (lerp 0.06).
- Bolt cascade: idle all zero; strike lights only the struck div at 0.80; the
  class moves and the light follows; suppressed over the clip.
- Nebula kick restored: kicking at kick 0.4 gives cloud amp **0.760** against
  0.360 at kick 0. `index.html` and `about.html` read the shipped values exactly
  with `--df-sky` never set.
- `index.html` regression after every shared-file change: all three scrubbed
  clips sweep their full span monotonically, settle without rAF spin, hero
  autoplays.
- Palette resolves on index, the lab and transmissions; zero occurrences of any
  old value remain outside documentation comments.
- Stay Connected centres at 788 on both pages, form on one row, no horizontal
  overflow.
- File integrity after every Python write: **0 CRLF, 0 BOM, 0 mojibake, UTF-8**.
- Zero console errors and zero 4xx on every pass.
- **Screenshots taken and looked at:** title screen, About, Music at f134, the
  crossfade at 0/55/100%, the Music landing at three sizes, the Transmissions
  landing, Archive before and after, Stay Connected before and after centring,
  the hero restored, the rail ripple, and a palette swatch sheet.

**Asserted / not verified:**

- **The fork strike has never been seen.** Headless Chromium will not start the
  WebAudio graph, so its 12% rate is reasoned about, not measured. The wiring is
  verified; the behaviour is not.
- **The violet in motion.** The rail ripple and the audio-reactive states were
  verified as computed values, never watched.
- **Stay Connected's body copy at full sky.** The scrim is gone there by design
  and that paragraph is now the least-contrasted text on the page.
- **The mp4 fallback** still has never been the chosen source in a browser.
- **No mobile pass on any of this.** The background is gated off below 768px and
  the Deep Field tuner tab does not register there.
- Safari: untested, as ever.

## Git state

- Branch `feature/spine-ui-v2`. Session start `ccf7f59` (handoff 37).
- Five commits, pushed: **`3966272`**, **`53f11d1`**, **`83cf8cf`**,
  **`ef62814`**, **`e0fa910`**. 10 files, +2131/-38.
- New: `home-deepfield-lab.html`, `css/deep-field-bg.css`,
  `js/deep-field-bg.js`, `assets/lab/deep-field-marks.json`.
- Modified (production): `css/tokens.css`, `css/spine-bg.css`,
  `css/star-bg.css`, `css/spine-doc.css`, `js/spine-bg.js`, `js/spine-doc.js`.
- **`index.html` is byte-unchanged** — but it no longer renders unchanged.
- `--spine-build` 39 → **41**, `--star-build` 28 → **29**, `--df-build` **3**.
- `main` untouched at `13083d9`. No PR.

## Still open

1. **The diff back into `index.html`.** Five marked places in the clone. It is
   mechanical, and it is the step that actually ships any of this. **This is the
   next session's first move.**
2. **Watch the three unverified things** in a real browser: the fork strike, the
   violet in motion, and the Stay Connected copy at full sky.
3. **Pacing.** About runs 162 fr/1000px against Music's 19.7 — an 8.2x spread.
   Two cheap levers if it reads as frantic: a taller About, or an earlier
   About/Music boundary. Nobody has judged it yet.
4. **Phase two of the Music handoff** — the playback gating 37 described, where
   a playing track holds the sky. All four hooks exist
   (`is-spine-pulsing`, `is-spine-kicking`, `--kick`/`--snare`,
   `ks:sample-ready`) and none is used yet.
5. **A mobile pass.** Nothing here has been seen below 768px.
6. Everything still open from 36 and 37: **decide `LIVE`**; the doc-rail ring
   inversion; **re-establish a cloud-sky measurement** or accept it is eye-only;
   the frame-budget decision.
7. **Three clips still waiting** for film rows: `rain-transmission-rooftop`,
   `last-train-below`, `the-black-archive`. Owner names the section.
8. music.html still black; stale amber-era `?tune` TIPS prose; the two missing
   trivia files; the astral scrim parked; the inherited pile.

---

## Starting the next V2 chat

Attach this file. The working folder is
`C:\Users\Haight\Desktop\kundalini-spines-spine-ui` on `feature/spine-ui-v2`.
Serve with `python scripts/serve.py`, browse `http://localhost:8000` — never
`file://`, never `python -m http.server`.

> Here's the latest V2 handoff. The whole scroll-driven home background is built
> and verified in `home-deepfield-lab.html`, and I want to land it on
> `index.html` this session.

Open `home-deepfield-lab.html` before deciding anything — the background has
never been judged by eye at length, only measured.
