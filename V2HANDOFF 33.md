# Kundalini Spines — Spine UI V2 Handoff 33

**Date:** August 14, 2026

Fifteenth handoff of the **Spine UI V2** track (branch `feature/spine-ui-v2`).
`32` owns the eyeball pass, the three owner fixes and the rail's graded
field + ripple; `31` the full-system drop and the spine document. The plain
`HANDOFF 1`–`19` series documents the dormant production site on `main`.

---

## The one-line version

**The merch section grew a scroll-scrubbed, transparent spine render — the
owner's video, keyed from black to real VP9 alpha, turning with the scroll
and holding when it holds — after a 3D-model attempt the same evening was
built, measured, resized and rejected by eye.**

---

## Corrections to earlier handoffs

- **32's top open item ("owner judges the rail by feel") did NOT happen** —
  the session went where the owner pointed it instead. The item stands, moved
  down the list, not closed.
- **32's "still open" item 5 mentions nothing about the merch section**; as
  of this session the merch section has a scroll-driven video element in a
  two-column layout. Any earlier reading of `index.html`'s merch markup or
  `spine-doc.css`/`spine-doc.js` predates it.

---

## Git state

- Branch `feature/spine-ui-v2`. Session start `d5b709d` (handoff 32).
- Files touched: `index.html`, `css/spine-doc.css`, `js/spine-doc.js`, new
  `assets/video/spine-render.webm` + `spine-render.mp4`.
- `main` untouched. No PR.

---

## THE 3D MODEL THAT CAME AND WENT

The owner dropped a `Kundalini Spine Model` folder (GLB + `<model-viewer>`
recipe). It was built into the merch section, measured, fixed twice, and
then the owner called the model itself ugly and pulled it. Everything was
reverted; nothing of it is in the tree. **The recipe survives here because
the replacement will likely arrive as another GLB one day:**

- **Check GLB integrity first** — the drop's root copy was TRUNCATED (header
  declared 651,128 bytes, file was 319,488; an interrupted copy). Bytes 8–11
  of a GLB declare its true length.
- **`camera-orbit` radius `auto`, never a fixed metres value** — the drop's
  17m framed a fullscreen stage; on a ~470px stage it cropped the column
  (17/19/21/23m all measured clipped; auto computed ~30m and fit).
- **Slot out `<model-viewer>`'s default progress bar** (`<div
  slot="progress-bar">`) — it renders as a dark hairline strip across the
  stage top, and it lingers through its hide transition.
- **`disable-zoom` + `touch-action="pan-y"`** or the viewer eats the wheel
  and the page stops scrolling wherever the model sits.
- **The stage's shape IS the model's size** — auto-framing fits the model to
  the box, so a tall thin model in a landscape box renders as a sliver.
  Portrait stage = large spine. (This lesson carried straight into the video.)

## THE SPINE RENDER — WHAT IS ACTUALLY ON THE PAGE

The owner's `starfield-deep-4ktransparent.mov` (a rotating obsidian
anatomical spine on black, 3840×2144, 8.04s, ProRes 4444). Placement:
beside the merch copy in `#merch`, owner's call — "the object that carries
it, next to Objects That Carry It".

- **The mov has NO alpha channel despite its filename** — pix_fmt is
  `yuv444p12le`, not `yuva…`. Whatever exported it dropped the alpha.
  Transparency on the page is DERIVED: the pure-black backdrop (measured
  exactly 0,0,0, 98% of frame) is keyed via `colorkey=0x000000:0.02:0.02`.
- **The 0.02 similarity is load-bearing and was tuned by measurement.** The
  first key (0.09/0.06) let the spine's near-black BACK SIDE fall inside the
  threshold — the owner saw through the body when it turned. Measured across
  the rotation: interior see-through 32–52% per frame at 0.09, 3–15% at
  0.02, and the residue is the real anatomical gaps between vertebrae.
  **Do not loosen the key to "catch more background" — there is no more
  background; there is only spine.**
- **Encode: 24fps, keyframe every 4 frames (`-g 4`), crf 36 VP9 →
  `assets/video/spine-render.webm` (4.3MB, real alpha in yuva420p), plus an
  H.264 fallback `spine-render.mp4` (1.9MB, black baked in).** Both cropped
  to the spine's measured bounding box (530×1540+1660+300 of the 4K frame),
  scaled to 1152px tall, silent audio stripped. ffmpeg lives at
  `imageio_ffmpeg` (pip; `python -c "import imageio_ffmpeg;
  print(imageio_ffmpeg.get_ffmpeg_exe())"`) — there is no system ffmpeg.

## THE SCRUB

`js/spine-doc.js` owns it; the long comment there is the documentation. The
short version: no autoplay, no loop — scroll position maps to `currentTime`.

- Progress is the element's travel through the viewport, **re-normalised to
  the 0.10..0.80 slice** — the first cut mapped the raw pass and the
  rotation only completed as the element left the screen; the owner called
  it ("can't make a full turn"). Now the full 360° closes by 80% travel
  (measured: 30%→2.27s, 55%→5.12s, 80%→7.98s of 8.04) with still holds
  either side.
- The seek is rAF-lerped at **0.3** (0.22 measured too loose, same owner
  call), one write per landed seek, half-frame dead zone. Settles in ~1s
  and then holds exactly (four 500ms samples, zero delta).
- **The `-g 4` keyframe interval is part of the scrub mechanism** — default
  sparse keyframes make every seek decode a chain and visibly lag. A future
  re-encode that drops it regresses the feel silently.
- **`scripts/serve.py` is load-bearing here** in exactly the way the
  http-server rule warns: every scrub seek clamps to 0 on a server without
  Range support.
- Browsers without VP9 get tagged `is-flat` (canPlayType, empty string is
  the no) and play the mp4 with `mix-blend-mode: screen` zeroing the black.
  **Do not apply the blend to the WebM** — real alpha + screen blend lets
  bright nebula bleed through the spine's dark body.
- Reduced-motion visitors get a still first frame — scroll-linked motion is
  exactly what that preference declines.

## What is deliberate, so nobody fixes it

- Everything in 30–32's lists still stands.
- **`preload="auto"`, not `metadata`** — the scrub seeks from its first
  wheel tick, and with metadata-only there is no frame to paint until a
  range fetch lands; it reads as a blank stage.
- **The `.ksd-merch` video column flexes right of the copy only** — the
  axis rule: nothing covers the spine rail.
- **The mp4 fallback still carries its black backdrop on purpose** — it is
  the rare-browser path; the blend handles it there and only there.
- **KNOWN GAP, recorded in the index.html comment:** a Safari that plays
  VP9 but drops its alpha would show the black backdrop. Safari remains
  untested project-wide and nothing is publicly deployed.

## Do not do these

Everything in 19–32's lists still stands. Additionally:

- **Do not re-encode the render without `-g 4`** (or all-intra) — the scrub
  lags on sparse keyframes. And all-intra at this size was 17MB; `-g 4` is
  the measured compromise.
- **Do not loosen `colorkey` past 0.02 similarity** — the spine's back is
  nearly black and falls into a looser key (measured, owner-called).
- **Do not add `autoplay` or `loop` back to the merch video** — the scrub
  owns `currentTime`; a playing video fights every seek.
- **Do not screen-blend the WebM** (see above).
- **Do not "fix" the render's caption** ("TURNED BY THE SCROLL") to imply
  autoplay.

## Verified vs. asserted

**Verified by tooling, and looked at (all Aug 14 2026, Playwright/Chromium
1440×900 + 390×844 over scripts/serve.py):**
- Transparency: starfield pixels visible through all four corners of the
  video box (maxima to 160 where an opaque failure reads ~0); back-view
  frame solid after the tight key, screenshot in situ.
- Scrub: WebM selected, never playing (`paused: true` throughout), seekable
  the full 8.042s, mapping monotonic, full turn by 80% travel, settle to
  zero drift, 76k+ pixels difference between scroll depths. Zero console
  errors, zero horizontal overflow, both widths.
- The 3D-model revert: `git status` clean at the time, original merch
  layout screenshotted.

**Asserted / NOT verified:**
- **The owner has not re-judged the rotation feel since the 0.3 lerp +
  0.10–0.80 window fix** — measured right, not yet felt right.
- Safari/Firefox, real phone, real tab — unchanged from 32.
- The mp4+blend fallback path was never exercised in a real non-VP9 browser
  (the tagging logic was, the visual was not).

## Still open

1. **The owner is testing an alpha re-export of the spine render.** State of
   play: Premiere's settings are right (QuickTime / ProRes 4444 XQ, 16-bpc
   + alpha, Rec. 709, "render alpha channels only" OFF) but the timeline
   shows BLACK behind the spine, not checkerboard — the transparency must be
   enabled in the tool that RENDERED the footage, not in Premiere, which can
   only pass through alpha that already exists. If a true-alpha file
   arrives: skip the colorkey step entirely, encode from the embedded matte,
   keep 24fps/`-g 4`/crop/1152 — the scrub wiring does not change.
2. **The owner judges the new rail by feel** (32's top item, still waiting)
   — and now also the scrub's re-tuned feel.
3. music.html still black; stale amber-era ?tune TIPS prose; the two missing
   trivia files; the inherited pile (webmanifest favicons, PURCHASE, lab
   staleness, deploy/DNS, Range layers, Archive wrap, messengers→webp).

---

## Starting the next V2 chat

Attach this file. The working folder is
`C:\Users\Haight\Desktop\kundalini-spines-spine-ui` on `feature/spine-ui-v2`.
Serve with `python scripts/serve.py`, browse over `http://`.

> Here's the latest V2 handoff. The merch section has the scroll-scrubbed
> transparent spine render; the owner may bring a true-alpha re-export to
> swap in (item 1 — the recipe is written there). Otherwise: rail feel and
> scrub feel are both waiting on the owner's eye.
