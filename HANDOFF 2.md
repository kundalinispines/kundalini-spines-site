# Kundalini Spines — Session Handoff 2
**Date:** July 28, 2026
**Supersedes:** `HANDOFF 1.md` (July 22) for everything about the carousel.
**Status:** Carousel rebuilt as a single always-focused view. Live and working.

---

## Project location

`C:\Users\Haight\Desktop\kundalini-spines` — this replaced the older
`KundaliniSpinesWebsite` folder. Same static HTML/CSS/JS, no build step.

**The site must be served over HTTP, not opened as a file.** The carousel loads
tracks with `fetch('data/tracks.json')`, which browsers block on `file://`.
Run `python -m http.server 8000` in the folder and open `http://localhost:8000`.
Opening `index.html` directly shows an empty carousel — this is not a bug.

---

## What changed this session

The carousel had two states — a "rest" state and a "focused" state. That split
is gone. There is now **one view**: the centred card is always the hero and the
panel below it is always populated.

| Area | Before | Now |
|---|---|---|
| States | rest + focused | single always-focused view |
| Scroll wheel | changed tracks | **removed** — page scrolls normally |
| Drag | none | drag to rotate, snaps to nearest |
| Click | opened focus view | side card centres + plays; centre card toggles play |
| Hover-pan | outer 18% of viewport | rides the ±2 visible cards |
| Card captions | on cards | **removed** (art carries the title) |
| Panel title | visible `<h3>` | `.sr-only` — hidden but still in the DOM |
| Nav arrows | fixed gap, centred | pinned to the hero card's left/right edges |
| Track counter | none | `14 / 27` between the arrows |
| Card media | `<img>` | `<img>` still + optional `<video>` layered over it |
| Section height | 1293px | **848px** |

---

## LOAD-BEARING GEOMETRY — read before touching

`HANDOFF 1` said the constants were "tuned empirically, don't change them
without re-measuring." That is **no longer true in the same way.** The
hand-tuned per-breakpoint numbers have been replaced by formulas fitted to
measurements taken at nine viewport widths. They self-scale. Changing card
width no longer breaks the layout.

### CSS custom properties (`css/track-experience.css`)

```
--card-w    250px                          the LAYOUT STEP (spacing between cards)
--card-box  calc(var(--card-w) * 1.85)     the card's actual box size
--arc-h     640px                          .track-arc-viewport min-height
--hero-w    calc(var(--card-box) * 1.0588) the hero's true on-screen width
```

Breakpoints only change `--card-w` (and `--arc-h` on mobile):
`≤1024px → 190px`, `≤768px → min(42vw, 190px)` with `--arc-h: 420px`.

**`--card-w` is the step, not the card size.** The card box is 1.85× the step,
and a negative right margin (`calc(var(--card-w) - var(--card-box))`) pulls the
layout advance back down to the step. This is deliberate — see "Why the card box
is oversized" below.

### The three fitted formulas

```
intro heading clearance   margin-bottom: calc(var(--card-w) * 0.48 + 42px)
focus panel pull-up       margin-top:    calc(var(--card-w) * 1.425 - var(--arc-h) - 4px)
hero visual width         --hero-w:      calc(var(--card-box) * 1.0588)
```

1. **Heading clearance.** The scaled hero overflows the carousel viewport's top
   edge. Measured: 250px card → 138px, 190 → 104–111, 164 → 92, 151 → 87. Fits
   `0.48 × card + 18px`. The `+42px` is that clearance plus the 24px gap we
   want to see. Verified gap 23–29px from 360px to 1920px wide.

2. **Panel pull-up.** The hero leaves slack at the bottom of the viewport;
   the panel is pulled up into it. `slack = arc-height − (card × 1.425) + 4px`.
   Verified card-to-panel gap of −1px to 5px at all nine widths. The old
   hardcoded values had a real bug: between ~600px and 768px wide the panel
   **overlapped the card by 38px**.

3. **Perspective foreshortening — 1.0588.** `translateZ(100px)` under
   `perspective: 1800px` magnifies by `1800 / (1800 − 100) = 1.0588`. The hero
   is NOT `card × 1.85` wide, it's `card × 1.85 × 1.0588`. Getting this wrong
   left the nav arrows 14px inside the card edge instead of flush.

### JS constants (`js/track-experience.js`)

```js
MAXSPEED       560     hover-pan speed ceiling
MAX_SIDE       2       cards visible per side (fade between 1.85–2.5 step units)
BOX_K          1.85    card box ÷ layout step — see below
HERO_SCALE     1       hero is NOT scaled up any more
DRAG_THRESHOLD 6       px before a press counts as a drag, not a click
FALLBACK_EDGE  0.22    pan zone only when the ±2 card doesn't exist (list ends)
VIDEO_FADE_MS  350     MUST match .track-card__video's opacity transition
PERSPECTIVE    1800    MUST match .track-arc-viewport's perspective
HERO_Z         100     hero's translateZ
Z_SCALE        1.0588  derived: PERSPECTIVE / (PERSPECTIVE − HERO_Z)
```

Arch geometry unchanged from HANDOFF 1 and still empirical: angle rate `0.85`,
recede `260`, drop `130`, gap `0.75px`, B/C push-out `step * 0.75`,
D/E pull-in factor `-2.5`, `translateY(-30)`.

**If you change `BOX_K` you must change `--card-box`'s multiplier to match.**
They are the same number in two languages. Sibling scales, shadow spreads and
blur radii are all divided or multiplied by `BOX_K` to compensate.

---

## Rendering rules — the non-obvious ones

Four separate bugs were making the artwork look soft or grainy. None of them
were compression. Sharpness (variance-of-Laplacian on the settled hero card)
went **20.4 → 195.4** without touching the encoder.

### 1. Why the card box is oversized

A card laid out at 250px and scaled up 1.85× is **rasterised at 250px and then
stretched**. Most of the detail is gone before the image is even displayed.
The card box is now the final on-screen size and the hero renders at `scale(1)`;
everything else scales *down*. The negative right margin keeps the spacing
identical. Verified pixel-identical: card rects before and after the change were
`[161,466,74,139] [285,364,121,176] [475,146,490,490] [1034,364,121,176]
[1205,466,74,139]` in both.

### 2. The rAF loop parks itself

While a composited layer is continuously animating, Chrome holds it on a
low-resolution raster. The old loop ran forever. It now stops when
`|target − current| < 0.05` with no drag or pan, and `kick()` restarts it on any
input. **Every new interaction path must call `kick()`** or the carousel will
appear frozen.

### 3. The settled hero drops to a 2D transform

`translateZ` keeps an element on the GPU compositing path **regardless of
`will-change`**, and Chrome reuses whatever raster scale that layer last had —
so a card that lived its life small arrives at the centre and is stretched from
a small texture. On settle, the hero swaps to the algebraically identical 2D
transform:

```
translateX(extraX + dx) translateY(dy) scale(scale * Z_SCALE)
  dx = (cardCentre − centre) * (Z_SCALE − 1)
  dy = (boxCentreY − originY) * (Z_SCALE − 1) + yPos * Z_SCALE
```

`translateZ(z)` maps a point `P → O + (P − O) × Z_SCALE` about the perspective
origin (viewport centre); CSS `scale()` works about the element's own centre,
hence the compensating offset. `flattenHero` is set true one frame after
settling and reset to false by `kick()`. Verified equivalent: rect matches to
two decimals, mean pixel difference 0.42/255, sharpness 175.0 → 195.4.

`will-change` is likewise applied **only while moving**, via
`.track-arc.is-animating`. Leaving it on permanently is what caused the stale
raster in the first place.

### 4. Still and video are separate layers

A `<video poster="...">` is **not** good enough. The moment the video buffers,
the browser swaps the poster for a decoded frame — even while paused — and that
frame is softer than the still (measured 89.0 vs 175.0).

Each card is therefore:

```html
<img   class="track-card__media track-card__still" src="{artwork}">
<video class="track-card__media track-card__video" data-src="{artworkVideo}" ...>
```

Both absolutely positioned. The video sits on top at `opacity: 0` and fades in
(350ms) only while that track's sample is audible — class `is-rolling`.

- The source is in **`data-src`, not `src`**. `attachVideo()` promotes it only
  for the hero and its two neighbours, so 27 video cards cost a few MB in
  flight, not the whole library.
- On pause the video **holds its frame through the fade** and only rewinds once
  invisible (`VIDEO_FADE_MS` timeout). Rewinding immediately snapped the framing
  wide mid-fade, because the clips are a slow push-in.

---

## Interaction model

| Input | Behaviour |
|---|---|
| Click a side card | rotates to centre **and** starts its sample |
| Click the centre card | play / pause toggle |
| Drag anywhere on the strip | rotates 1:1 with the pointer, snaps to nearest on release |
| Arrow keys, ‹ › buttons | previous / next, no autoplay |
| Hover the outermost visible card | pans continuously in that direction |
| Scroll wheel | **nothing** — the page scrolls. Deliberate. |
| Close button | stops playback, scrolls to the next section |

Notes for anyone editing:

- The click handler is bound to **`.track-arc-viewport`, not `.track-arc`**.
  During a drag the pointer capture retargets the click to the capturing
  element, so a row-level listener silently misses every click.
- Pointer capture is taken **only after the 6px drag threshold**, not on
  pointerdown — capturing early breaks plain clicks the same way.
- Hover-pan zones are derived from the live rects of the `±MAX_SIDE` cards, so
  they follow the cards at any width. `FALLBACK_EDGE` covers the list ends.

---

## Asset pipeline

Everything derives from originals kept in `assets/_originals/covers/`.
**Keep the originals** — the compressed versions can't be re-derived from
each other.

### Card video (mp4)

```bash
ffmpeg -i SOURCE.mp4 -an \
  -c:v libx264 -crf 20 -preset slower -x264-params "aq-mode=3" \
  -pix_fmt yuv420p -vf "scale=960:960:flags=lanczos" \
  -movflags +faststart -o OUT.mp4
```

- `-an` — **audio is always stripped.**
- `aq-mode=3` shifts bits toward dark gradients; this art is almost all dark
  brick and smoke, which is exactly where banding shows.
- CRF was chosen by measuring SSIM against source: 18 → 0.9706 (2.4MB),
  **20 → 0.9692 (1.9MB)**, 22 → 0.9658 (1.2MB), 24 → 0.9625 (863KB),
  28 → 0.9524 (455KB). The knee is at 20–22; 28 was visibly smeared.
- **CRF 20 is probably overkill now.** Since the video only plays during
  playback and the still carries the at-rest view, CRF 22–24 is worth testing
  — roughly half the size.
- WebM/VP9 was tested and came out **larger** than H.264 here. Don't bother.

### Card still (webp)

1254×1254 WebP q90, method 6. Chosen by SSIM against the source PNG:

| Format | Size | SSIM |
|---|---|---|
| JPEG q88 | 425K | 0.99665 |
| JPEG q92 | 525K | 0.99795 |
| **WebP q90** | **349K** | **0.99804** |
| JPEG q95 | 688K | 0.99890 |

WebP beats JPEG q92 on quality at 33% smaller. Supported from Safari 14 (2020).
Swap to JPEG q92 if wider support is ever needed.

Do **not** downscale below ~1000px: the card renders at 490 CSS px, which is
980 device pixels on a 2× display.

### Wiring a track

In `data/tracks.json`:

```json
"artwork":      "assets/music/{slug}-cover.webp",
"artworkVideo": "assets/music/{slug}-art.mp4"
```

`artworkVideo` is optional — without it the card renders as a still only, no
code changes needed. `videoUrl` also works as an alias.

---

## Verification harness

Everything above was measured, not eyeballed. If you change the geometry,
re-measure with Playwright against a local server:

- **Sharpness** — variance of the Laplacian over the hero card screenshot.
  Settled hero on `the-33rd-floor` should read ~195 at deviceScaleFactor 2.
- **Geometry parity** — capture `getBoundingClientRect()` of every visible card
  before and after a change. At 1440×950 settled on card 22 the five visible
  cards should be exactly:
  `[161,487,74,139] [285,385,121,176] [475,167,490,490] [1034,385,121,176] [1205,487,74,139]`
- **Spacing** — heading-to-card gap and card-to-panel gap at 1920, 1440, 1200,
  1024, 900, 768, 600, 390, 360.
- **Scroll pass-through** — wheel over the carousel must move the page and must
  NOT change the hero index.

Two traps when testing headlessly:

- The sandbox Chromium has **no H.264** — mp4 cards silently fail to decode.
  Transcode a temporary WebM to test video behaviour.
- Headless runs at ~14fps, so easing takes ~5× longer to settle than on real
  hardware. Allow 9s before measuring a settled position, or you'll measure
  mid-flight and think the geometry is broken.
- Headless has **no GPU**, so it does not reproduce the stale-raster softness
  at all. Layer/raster problems must be diagnosed on real hardware —
  DevTools → Rendering → Layer borders.

---

## Open / unresolved

- **Softness after settling was still reported on real hardware** after the
  `will-change` fix. The 2D-flatten fix (rendering rule 3) was the response and
  had not been confirmed by the user when this handoff was written. If it is
  still soft, stop inferring — get a screen recording or a Layer-borders
  screenshot of the settled card.
- **Push-in mismatch.** The video clips zoom in; the stills are the wide frame.
  Playback drifts tighter and stopping returns to the wide shot. Three options
  discussed, none chosen: accept it, match the still to the video's first frame
  (costs still quality — 74 vs 175 sharpness), or re-export clips without the
  push-in so both states share framing.
- Only **1 of 27** tracks has real art wired (`the-33rd-floor`). The other 26
  still use gradient placeholders.

## Still pending from HANDOFF 1

- Streaming links — `links.spotify` / `appleMusic` / `youtubeMusic` / `stream`
  per track in `data/tracks.json`, all still `null`
- Download links + Stripe or Gumroad
- Social links — still `href="#"` in footers; update `data/site.json`
- Real domain in `sitemap.xml` and `robots.txt` (placeholder: kundalinispines.com)
- Newsletter — `js/newsletter.js` is still a `setTimeout` stub
- `music.html` still uses a flat grid, not the carousel
- Contact email `kundalinispines@gmail.com` in `data/site.json` is a placeholder

## Housekeeping

- `assets/music/the-33rd-floor-cover.jpg` is orphaned — replaced by the `.webp`.
  Safe to delete.
- Higgsfield element IDs for generating new covers:
  Messenger-A `46229f47-2d2f-45f7-a578-8d169ca5fbb7`,
  Messenger-B `37f342de-2add-4f4c-bcc7-2aa3530676d3`
- `assets/_originals/` is ~185MB+ and is included in the zip. Safe to exclude
  from a public deploy; the site never references it.
