# Kundalini Spines — Session Handoff 3

**Date:** July 28, 2026
**Supersedes:** `HANDOFF 2.md` (July 28) — several of its conclusions were measured and found wrong. See "Corrections to HANDOFF 2".
**Status:** Settled\-card softness root\-caused and fixed. Full 28\-track artwork library wired. Site live and working.

* * *

## Continued by HANDOFF 4

Everything after this session — the Brutus and May 26th assets, retiring `music.html`,
and the Transmissions rebuild — is in **`HANDOFF 4.md`**. Read that first; it says which
parts of this document are still authoritative.

**This document remains correct and required for:** the settled-card sharpness fix and the
`.track-hero-layer` render path, the corrections to HANDOFF 2, the accent-colour algorithm,
the asset pipeline and its two traps, the verification harness, the carousel interaction
model, and the deliberate slug/title mismatches. Those sections were not superseded and are
not repeated in HANDOFF 4.

One correction has been folded into the pipeline section below rather than left to drift:
**Brutus is no longer the odd non-square master.**

* * *

## Project location

`C:\Users\Haight\Desktop\kundalini-spines` — static HTML/CSS/JS, no build step.

**The site must be served over HTTP, not opened as a file.** The carousel loads
tracks with `fetch('data/tracks.json')`, which browsers block on `file://`.
Run `python -m http.server 8000` in the folder and open `http://localhost:8000`.

* * *

## What changed this session

| Area | Before | Now |
| --- | --- | --- |
| Settled hero sharpness | varLap 152 on real hardware | \~1050 (0.97× of an untransformed image) |
| Hero rendering | in\-row card, 2D "flatten" transform | painted by `.track-hero-layer`, outside the 3D context |
| Hero video | played in the card | overlay owns playback; card's copy paused |
| Hover\-pan | pan on hovering outer cards | **removed entirely** |
| Click on centre card | double\-flash / flinch | single clean fade |
| Accent colour | 6 hand\-picked shades in `tracks.json` | sampled from each cover's most vivid pixels |
| Tracks | 27, one with real art | **28**, all with real cover \+ video art |
| Push\-in mismatch | listed as an open problem | **does not exist** — measured |

* * *

## THE SHARPNESS FIX — read before touching the render path

### What was actually wrong

`HANDOFF 2` blamed stale GPU raster and shipped a fix that swapped the settled hero to an
algebraically identical 2D transform (`flattenHero`). **That fix did nothing**, because the
cause was never the card's own transform.

`.track-arc-viewport` has `perspective: 1800px` and `.track-arc` has
`transform-style: preserve-3d`. Together they place every card in one shared 3D rendering
context, which Chrome rasterises once at a fixed scale. **A card cannot leave that context by
changing its own transform — only by not being a descendant of it.**

### The measurements (2560×1440, DPR 1, card at 490 device px)

Variance\-of\-Laplacian on the settled hero, all at the same 490px size and matched contrast:

```
real on-screen hero          152.5
ideal (same WebP → 490px)   1226.6      <- 6.7x deficit, visually obvious
```

Isolation test — every variant rendered at exactly 490×490, only the render path differing:

| variant | varLap | vs control |
| --- | --- | --- |
| control — 490px box, no transform | 1026 | 1\.00× |
| `scale(1.0588)` on a 462.5px box (what shipped) | 979 | 0\.95× |
| `translateZ(100)` under `perspective: 1800` | 407 | **0\.40×** |
| paused `<video>` sibling at opacity 0 | 1026 | 1\.00× |
| `will-change: transform` | 1030 | 1\.00× |
| fractional translate, no scale | 934 | 0\.91× |
| big box\-shadow \+ `z-index: 999` | 1026 | 1\.00× |

Second test, reproducing the real ancestor chain:

| variant | varLap | vs control |
| --- | --- | --- |
| control — no 3D ancestor | 1087 | 1\.00× |
| full real chain (perspective \+ preserve\-3d \+ row shift) | 612 | **0\.56×** |
| same \+ paused video sibling | 612 | 0\.56× |
| chain but `transform-style: flat` | 1068 | **0\.98×** |
| chain but no `perspective` | 1072 | **0\.99×** |
| **overlay fix — same 2D transform, no 3D ancestor** | **1056** | **0\.97×** |

Removing **either** `perspective` **or** `preserve-3d` fully restores sharpness. They are not
additive; the 3D rendering context is one thing and either link breaks it.

### The fix

The settled hero is painted by **`.track-hero-layer`** — a plain `<div><img><video></div>`
appended to `.track-arc-wrap`, a **sibling of `.track-arc-viewport`**, so nothing in its
ancestor chain establishes a 3D context.

- `showHeroLayer(card)` reads the card's `getBoundingClientRect()`, positions the overlay at
  **integer** `left`/`top` with no transform of its own, copies the card's `box-shadow`, and
  drops the real card to `opacity: 0` beneath it.
- The real card stays in the row at full size. Hit\-testing, focus, keyboard nav and the arch
  geometry are untouched — the overlay is `pointer-events: none`.
- `syncLayerVideo(card)` moves hero playback onto the overlay and pauses the card's own
  `<video>`. **Only one of the two ever decodes.** A video left rolling in the card would be
  back inside the 3D context, paying exactly the cost the overlay exists to avoid.
- `hideHeroLayer()` hands playback back to the card, picking up at the frame the overlay
  reached.

### Rules for anyone editing this

1. **The overlay stands in for a SETTLED hero only.** It comes down in `tick()` — not in
   `kick()` — because `kick()` fires on every `pointerdown`, including a plain click that
   moves nothing. Tearing it down there put the soft card on screen for two frames and
   restarted the video fade, which read as a flinch or double\-click. The condition is
   `dragMoved || Math.abs(target - current) >= 0.05` — note `dragMoved`, not `dragging`.
2. **`updateCardVideos()` must never hide the overlay** when it's already standing in for the
   same hero. It re\-syncs the video instead. Hiding there flashed the soft card on every
   play/pause.
3. `render()` must not clobber the lifted card's opacity — it checks `card === heroLayerCard`.
4. `showHeroLayer()` is idempotent by design. It is called on every settle.
5. Resize routes through `kick()`, so the overlay rebuilds on the settle that follows.

The old `flattenHero` 2D path is still in `render()`. It's worth 0.95× on its own — harmless,
and it keeps geometry correct in the frame before the overlay comes up.

* * *

## Corrections to HANDOFF 2

Four of its claims were measured and are wrong. Do not act on them.

- **"Push\-in mismatch"** — the clips do not push in. ORB alignment across all 121 frames of
  `the-33rd-floor-art.mp4` gives scale 1.0000 at every timestamp with 600\+ inliers; the
  camera never moves. The still against video frame 0: **1500/1500 inliers, scale 1.0000,
  translation 0.0**. What the clips have is local motion — grain, smoke, beam flicker (mean
  abs difference \~13/255 across the clip). Every take of every track is locked\-off, which is
  why swapping takes never breaks the still\-to\-video crossfade.
- **The `VIDEO_FADE_MS` rewind delay** guards against that non\-existent push\-in. Harmless,
  buys nothing.
- **`scale(1.0588)` is not the problem** — 0.95×. Folding the perspective factor into
  `--card-box` would buy 5% and nothing else.
- **`will-change` is not the problem** — 1.00× in isolation. The video layer is not the
  problem either — 1.00× alone, and identical with/without in the full chain.

* * *

## Interaction model

| Input | Behaviour |
| --- | --- |
| Click a side card | rotates to centre **and** starts its sample |
| Click the centre card | play / pause toggle |
| Drag anywhere on the strip | rotates 1:1, snaps to nearest on release |
| Arrow keys, ‹ › buttons | previous / next, no autoplay |
| Hover | **nothing** — hover\-pan removed |
| Scroll wheel | **nothing** — the page scrolls. Deliberate. |
| Close button | stops playback, scrolls to the next section |

Hover\-pan was removed entirely, not disabled: `panDir`, `panIntensity`, `MAXSPEED`,
`FALLBACK_EDGE`, `updatePanZone()`, the pan branch in `tick()`, the `pointermove` hot\-zone
check and the `pointerleave` listener are all gone. Zero references remain.

Still true from HANDOFF 2, still load\-bearing:

- The click handler is bound to **`.track-arc-viewport`, not `.track-arc`**.
- Pointer capture is taken **only after the 6px drag threshold**.
- **Every new interaction path must call `kick()`** or the carousel appears frozen.

* * *

## Accent colour — sampled from the artwork

The eyebrow, track number, play button (ring *and* glyph) and sample bar all read
`--track-accent`. It is no longer the `accentColor` field — that was six shades shared across
27 tracks, dark enough on black to be invisible.

`accentFromImage()` draws the cover to a **128px** canvas and scores each pixel
`s³ × (1 − |l − 0.55| × 1.6)`, keeps the **top 5%**, buckets those by hue into 24 bins and takes
the heaviest. Cubing saturation is what lets a small vivid feature outvote a large muted one —
averaging picked the wash and gave 33rd Floor copper instead of the red of its beam. Output is
clamped to S 48–76%, L 55–66% so it stays legible without going neon.

`accentColor` in `tracks.json` remains the fallback until the image decodes. Results cached per
slug. 128px rather than 64px because a thin feature has to survive the downscale.

* * *

## Track list — 28 tracks

Order in `data/tracks.json`. The carousel opens centred on **\#15 Blue Pills**.

```
 1 Skeleton Keys        11 33rd Floor           21 Dark Meta
 2 Spine Glow           12 X-Files              22 Block Blast
 3 Graveyard Shift      13 Kabal                23 Heavyweight
 4 First 48             14 Something Flashy     24 The Great Work
 5 Spic N Span          15 Blue Pills           25 Seven Chambers of Light
 6 Brutus               16 Highly Unstable      26 May 26th
 7 Llama Mia            17 Steps from the Edge  27 Prophecy in Motion
 8 Uzi Fruit            18 Scorpion Road        28 Protocol Complete
 9 Semi-Auto            19 Scorpion Dreams
10 Extra Zoom           20 Vision Quest
```

**Titles were corrected; slugs were deliberately NOT.** Three slugs no longer match their
titles:

| title | slug |
| --- | --- |
| Prophecy in Motion | `prophocie-in-motion` |
| Protocol Complete | `protocal-complete` |
| Something Flashy | `some-thing-flashy` |

The slugs are baked into sample filenames, cover filenames and video filenames. Renaming means
renaming files in two directories and breaks any shared link. Leave them unless you're doing it
properly.

**"Full Zoom" was cut** as a duplicate of Extra Zoom. Its master art
(`FullZoom-Track-Art.png`) is untouched if it ever comes back — but note the printed title on
each cover is the ground truth for which art belongs to which track.

* * *

## Asset masters

`C:\Users\Haight\Desktop\Kundalini-Spines-Track-Art` — **this is the source of truth**, not the
`assets/_originals/` folder HANDOFF 2 refers to, which no longer exists and isn't needed.

```
Rises Up Track Art/Final Track Art Rise up/   the chosen covers
Rise Up Track Video Art/                      video art, 2-4 takes per track
Rise Up Unused Track Art/                     alternates and rejects
Rises Up Track Art/UnusedTrackartRISE UP/     more alternates
KundaliniSpinesPromoImages/                   9 promo shots, 6-10MB each
```

Masters are **1254×1254** — the same size as the shipped WebP, measuring 1240 varLap against
the WebP's 1228. So the q90 encode keeps \~99% of the detail and **there is no sharper source to
go back to.** Also mirrored in `Kundalini-Spines-Track-Art-...-001.zip` (885 MB) on the Desktop.

* * *

## Asset pipeline

### Card still (webp)

1254×1254 WebP q90, method 6, Lanczos downscale. 28 covers, 10.4 MB total, averaging 366 KB.
Sharpness at 490px ranges 741 (Llama Mia) to 3099 (May 26th).

- **Brutus was replaced on July 28** and is **no longer the odd one out.** The new
  `Brutus-TrackArt.png` is a normal 1254×1254 square master, so no crop is needed on the still
  or the video. The old master was 1122×1402 portrait and had to be centre\-cropped; that step
  is gone. **Every master in the set is now square** — the `crop` in the video command is a
  no\-op on all 28 and is kept only as a guard for future non\-square sources.
- **`steps-from-the-edge-cover.webp` was supplied already\-WebP** at 1280px and is copied
  as\-is. Do not re\-encode it — that's double compression for nothing.
- Do **not** downscale below \~1000px: the card renders at 490 CSS px, 980 device px at 2× DPR.
- Llama Mia's master is only 465 KB against \~2.7 MB for the rest; its source is likely already
  upscaled or heavily compressed. It is the softest cover in the set.

### Card video (mp4)

```bash
ffmpeg -nostdin -i SOURCE.mp4 -an \
  -c:v libx264 -crf 20 -preset slower -x264-params "aq-mode=3" \
  -pix_fmt yuv420p \
  -vf "crop='min(iw,ih)':'min(iw,ih)',scale=960:960:flags=lanczos" \
  -movflags +faststart OUT.mp4
```

28 clips, 960×960, 5.04s, \~61 MB total. `-an` — audio always stripped. `aq-mode=3` shifts bits
toward dark gradients, which is where banding shows in this art. The `crop` is currently a
no\-op — every source is square since the Brutus replacement — but it stays in the command so a
non\-square source can't silently ship stretched.

**Two traps, both hit this session:**

- **`-nostdin` is mandatory.** Inside a `while read` loop, ffmpeg consumes the loop's stdin and
  silently eats input lines — the first run produced files named `us-art.mp4` (from "brutus")
  and `-shift-art.mp4`, and 16 of 28 clips vanished.
- **A killed encode leaves a playable file.** Scorpion Road came out at 3.29s against a 5.04s
  source and threw no error. Check duration, don't assume.

**CRF was re\-measured at display size**, since the card renders at 490px and source\-resolution
SSIM overstates the cost:

| CRF | SSIM @490 | vs CRF 20 | library |
| --- | --- | --- | --- |
| 20 | 0\.9925–0.9942 | — | 71 MB |
| 22 | 0\.9901–0.9926 | −25% | 54 MB |
| 24 | 0\.9869–0.9907 | −43% | 41 MB |
| 26 | 0\.9827–0.9880 | −57% | 31 MB |
| 28 | 0\.9770–0.9834 | −67% | 24 MB |

No knee — quality falls off smoothly while savings fall off fast. Even CRF 28 is
indistinguishable at display size. **CRF 20 was kept deliberately** for quality headroom.
Only the hero and its two neighbours ever load a video (\~3 clips, \~8 MB in flight).

### Wiring a track

```json
"artwork":      "assets/music/{slug}-cover.webp",
"artworkVideo": "assets/music/{slug}-art.mp4"
```

`artworkVideo` is optional — without it the card renders as a still, no code changes. `videoUrl`
is an alias.

* * *

## Verification harness

Measure, don't eyeball. Two things HANDOFF 2 got wrong were caught only by measuring.

- **Sharpness** — variance of the Laplacian on the hero card, cropped from a **native\-resolution
  screenshot**. Screenshots that come through downscaled are useless for this. On Windows,
  `Win + PrtScn` writes a true\-resolution PNG to `Pictures\Screenshots`.
- **Compare like with like.** Measure the on\-screen card against the same source downscaled to
  the same size with matched contrast — not against a number taken at a different DPR. The
  handoff's "195 at deviceScaleFactor 2" is not comparable to anything measured at DPR 1.
- **Isolate with a standalone page.** `raster-test.html` and `raster-test-2.html` in the project
  root render the same image through every candidate render path at once. One screenshot
  answers which one is responsible. This is what found the real cause after two wrong guesses.
- **Geometry parity** — capture `getBoundingClientRect()` of every visible card before and
  after a change.
- **Scroll pass\-through** — wheel over the carousel must move the page, not the hero index.

Headless testing traps: sandbox Chromium has **no H.264** (transcode a temporary WebM),
runs at \~14fps (allow 9s to settle), and **has no GPU, so it cannot reproduce raster problems
at all.** Layer issues must be diagnosed on real hardware.

* * *

## Open / unresolved · Housekeeping

**Moved to `HANDOFF 4.md`** so there is one current list rather than two that drift.
It carries everything that was here plus what this session added. The one item below is
kept because it belongs to this document's own work:

**Backup:** a full snapshot was taken during the HANDOFF 3 session — 162 files, 88 MB,
split into 7 standalone zips (`ks-backup-20260728-part1..7`). Each extracts into the same
`kundalini-spines/` tree; unzip all seven into one folder to restore. Verified
byte-identical to source via recursive diff. The 885 MB masters folder is **not** in that
backup and needs its own. **Note: this predates the Transmissions build and the Brutus /
May 26th assets — it is no longer a current snapshot.**
