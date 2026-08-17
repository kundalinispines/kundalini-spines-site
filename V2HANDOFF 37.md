# Kundalini Spines — Spine UI V2 Handoff 37

**Date:** August 17, 2026

Nineteenth handoff of the **Spine UI V2** track (branch `feature/spine-ui-v2`).
`36` owns the film-row foreground, the blue palette and the two reveal fixes;
`35` owns the merged tuner; `34` owns the cloud sky and the film rows. The plain
`HANDOFF 1`–`19` series documents the dormant production site on `main`.

---

## The one-line version

**A new 11-second cosmic clip became `deep-field`, and part 1 of the
scroll-driven home background shipped as a marker lab — a frame-accurate
scrubber that draws the clip's own luminance structure, overlays the site's real
nebula plate for comparison, and exports the marks the rest of the build will
hang off. The owner marks the six parts tomorrow; nothing about the home page
itself has changed yet.**

---

## Corrections to earlier handoffs

- **`hero-scrub-lab.html`'s source-order finding does not generalise, and this
  file nearly inherited it.** That page carries a measured, correct note that the
  hero's webm seeks at a 154ms median against ~0ms for its mp4, and lists mp4
  first for that reason. `deep-field-lab.html` first shipped copying it.
  Measured on THIS pair, Aug 17 2026, 14 seeks across the clip:

      deep-field.webm   median 10.1ms   max 12.1ms   (VP9,  crf 31, -g 4)
      deep-field.mp4    median 25.0ms   max 34.3ms   (x264, crf 22, -g 4)

  The webm is two and a half times **quicker** here — the reverse. Both
  measurements are right about their own encode. **There is no site-wide rule
  about source order; it is a per-clip measurement.** `deep-field-lab.html`
  lists webm first and says so in a comment at the `<video>` tag.
- **Nothing else in 36 was invalidated.** Its corrections, its deliberate list
  and its do-not list all still stand as written. This session touched no
  production file, so every number in 36 still describes what ships.
- **`.claude/skills/kundalini-scrub-video/SKILL.md` prints crf 33 (webm) / 24
  (mp4).** This clip used **31 / 22** because it is a full-screen background
  rather than a column-width film, and nebula gradients band. The skill is not
  wrong; it is written for the other case. Not edited — flagged here.

## THE METHOD FINDING: SCENE DETECTION IS BLIND TO THIS CLIP

Same class of trap as the `python -m http.server` seek bug (23) and the cloud-sky
zero (36): **the wrong instrument returns a confident, plausible answer.**

`ffmpeg -vf "select='gt(scene,T)'"` was the obvious way to find the six parts.
At **T = 0.10** — already very low — it reports **one weak cluster around
9.46–9.54s and nothing else**. Read naively that says "this clip has one cut",
which is false.

**The movements are joined by FLASH DISSOLVES, not hard cuts.** Scene scoring
compares consecutive frames; a whiteout ramps over ~25 frames, so no single pair
ever jumps. The transitions are invisible to it by construction.

**Per-frame mean luminance sees them perfectly.** `-vf signalstats`, YAVG per
frame, over a floor of ~97:

    frame  20   0.833s   YAVG 310        frame 122   5.083s   YAVG 521
    frame  94   3.917s   YAVG 428        frame 225   9.375s   YAVG 546

So the lab's timeline draws that wave, and derives nine snap ticks from it —
four flash peaks, five dark settles. **Do not replace the wave with a scene-cut
list.** It was tried, and it is blind to this footage.

Cross-checked in the browser rather than trusted: seeking to each predicted
frame and reading canvas pixels gives **134 at f122 and 144 at f225 against
10–15 at the settles**, the same shape ffmpeg reported once the 10-bit source is
scaled to 8-bit. The frames the page lands on are the frames ffmpeg measured.

## THE CLIP

Source `hf_20260817_134439_24ec20db-eecc-4fa0-b395-32fd6db6c6ae.mp4`, dropped in
`Downloads` (not the usual `Spine Home Photo and Video` folder). **The source is
not in the repo** and should be kept — the encodes are derived.

    11.04s   1920x1080   24fps   265 frames   HEVC Main 10 (yuv420p10le)   13.8 Mbps

**HEVC 10-bit does not decode reliably in Chrome**, so the re-encode is not an
optimisation here — it is the only way the clip plays at all. Both encodes carry
`-g 4` per the scrub skill.

Shipped as `assets/video/deep-field.{webm,mp4}` + `-poster.jpg`. **The name is
provisional** — chosen to sit beside `black-tide` and `spine-frequency`, never
confirmed by the owner. Renaming is cheap now and annoying after part 2.

**`deep-field.mp4` at 5.7MB is now the largest tracked file in the repo.** It is
the fallback path only (webm wins in Chrome). If that matters, crf 22 is
generous for a fallback and can go up without touching the webm.

## THE LAB — `deep-field-lab.html`

Isolated, `noindex`, links only `tokens.css` and `base.css`. **No production
file is touched by it.**

- **Timeline**: a 265-tile centre-slice colour strip (one tile per frame), the
  luminance wave, nine ghost ticks on keys `1`–`9`, drag to scrub, hover for a
  sprite-sheet frame preview.
- **Two mark types.** `boundary` (blue) splits sections; `cue` (crimson) is a
  reveal hook and does not split. Both were needed: "six parts" and "hang the
  carousel off a frame" are different jobs.
- **Sections are DERIVED from boundaries**, never stored, so the two cannot
  disagree. Five boundaries give six sections automatically.
- **Nebula overlay** — the site's own plate over the clip, opacity slider, plate
  picker, blend modes including `difference`.
- **`find closest`** scores all 265 frames against the plate and jumps to the
  winner (~2.5s), drawing an amber score curve across the timeline.
- **`save`** downloads `deep-field-marks.json`. `copy` is clipboard only.
  localStorage is a working copy, not a backup.
- Tooltips on all 18 controls, written for someone reading them cold.

### The match result

Against `starfield-deep-4k.webp`, the plate `body::before` actually paints:

| | frame | time | r |
|---|---|---|---|
| best | **f134** | **5.583s** | 0.720 |
| | f264 | 11.000s | 0.695 |
| | f251 | 10.458s | 0.618 |
| | f147 | 6.125s | 0.577 |
| | f237 | 9.875s | 0.516 |

**Read r = 0.720 as "clearly the same kind of picture", not "identical".** The
diagonal bands align; the stars never will, because the plate's sky is not the
clip's sky.

**Worth carrying into part 2: the clip's FINAL frame is the second-best match at
0.695.** When scroll runs out at the bottom of the page and the background hands
off to the reactive system, the clip is already ending on something close to the
site's own sky. That seam is nearly free — which is a reason not to casually
change where the clip ends.

## What is deliberate, so nobody fixes it

Everything in 30–36's lists still stands. Additionally, all within the lab:

- **webm is listed FIRST, opposite to `hero-scrub-lab.html`.** Measured, not
  copied. See the corrections above.
- **The overlay does NOT apply star-bg.css's black-point subtract or brightness
  lift**, though the real page does. The overlay answers "which frame looks like
  the artwork"; the grade is a separate dial the owner already controls. Folding
  both into one image makes the answer unreadable.
- **Matching is scored at 96x54, and low is correct.** Finer resolution starts
  scoring star positions, and the stars are the one thing that genuinely cannot
  match.
- **The metric is zero-mean normalised cross-correlation, not a pixel
  difference.** The clip swings YAVG 97→546 against the plate's one fixed
  exposure, so a difference would elect whichever frame merely shares the
  plate's average brightness — answering "which frame is as dark as the artwork"
  rather than "which looks like it".
- **`.tl__peek` and `.tip` live OUTSIDE the HUD and are placed by JS.** The
  timeline carries `overflow: hidden` and the HUD carries `overflow-y: auto`;
  anything positioned above the timeline is clipped by both, **silently** — the
  element is in the DOM with the right background and simply is not painted. The
  peek shipped that way for one build and read as a failed sprite load.
- **Ghost ticks are suggestions, not marks.** They are measured luminance
  events. The owner's eye decides where a movement turns.
- **The `text: on/off` button is the placeholder-headline toggle**, renamed from
  `copy:` because two controls called copy next to a `copy JSON` button was
  genuinely confusing.
- **The placeholder headline is not a layout proposal.** It exists only so the
  field is never judged without text over it.

## Do not do these

Everything in 19–36's lists still stands. Additionally:

- **Do not replace the luminance wave with a scene-cut list** — see above.
- **Do not infer video source order from another clip.** Measure per pair.
- **Do not raise the match resolution above 96x54** to "improve accuracy". It
  makes it worse.
- **Do not apply the star-bg grade to the comparison overlay.**
- **Do not move `.tl__peek` or `.tip` back inside the HUD.**
- **Do not treat r = 0.720 as a frame that matches the artwork.** It is the
  closest structural match in the clip, which is a different claim.
- **Do not delete the source clip from `Downloads`** until part 2 has settled —
  the encodes are lossy and derived, and the 10-bit original is the only master.
- Still: `-g 4` on every scrubbed clip, no Python **text-mode** writes to
  JS/CSS/HTML (this session used `newline=''` and verified 0 CRLF afterwards),
  never `python -m http.server`, never `file://`.

## Verified vs. asserted

**Verified by tooling and looked at** (Aug 17 2026, Playwright/Chromium over
`scripts/serve.py`, 1440x900):

- webm selected, `seekable` `[0, 11.042]`, seek median 8.9ms / max 20.3ms.
- Frame alignment cross-checked against ffmpeg at six known frames.
- Zero settled drift — `currentTime` identical across a 1.2s hold.
- Five keypresses yield six sections with correct frame/time/pct; marks survive
  reload; `save` writes a valid JSON file that parses.
- Overlay exactly viewport-sized (1440x900) in both modes; zero horizontal
  overflow in scroll mode; scan returns f134 r=0.720 repeatably.
- Tooltips paint on screen, stay in the viewport, and survive the marker table
  re-rendering; 0 of 18 contain an apostrophe.
- Range input is **not** default browser blue (the V2HANDOFF 21 bug).
- Zero console errors and zero 4xx on every pass.
- File integrity after the one Python write: **0 CRLF, 0 mojibake, UTF-8**.
- **Screenshots taken and looked at:** contact sheet of the source, the nebula
  plate, the HUD, the hover preview, the overlay at 50% normal, the difference
  blend, a tooltip, and the final single-row bar.

**Asserted / not verified:**

- **Whether the clip works as a home background at all.** The owner has not seen
  it in place and has not judged it. Everything here is instrumentation.
- **Whether the six sections above are the right six.** They were derived from
  the measured flashes to prove the tool works end to end. **The owner marks the
  real ones tomorrow.**
- **The mp4 fallback path was never exercised in a browser.** Chrome always took
  the webm, so the mp4 has been probed for seek latency but never actually
  played as the chosen source.
- **No mobile or narrow-viewport check on the lab.** It is a desktop marking
  tool and was built as one; the HUD would need work at 390px.
- Safari: untested, as ever.
- The provisional name `deep-field`.

## Git state

- Branch `feature/spine-ui-v2`. Session start `a12d427` (handoff 36).
- One code commit: **`c175fc0`** — 7 new files, 1107 insertions. Pushed.
- **No file modified. Everything this session added is new**, which is why no
  build number moved: `--spine-build` stays 39 and `--star-build` stays 28.
- New: `deep-field-lab.html`, `assets/video/deep-field.{webm,mp4,-poster.jpg}`,
  `assets/lab/deep-field-{strip.jpg,sprites.jpg,lum.json}`.
- `assets/lab/` is a new folder — **lab tooling, not shipped site assets.**
- `main` untouched at `13083d9`. No PR.

## Still open

1. **The owner marks the six parts.** This is tomorrow's first move and it
   unblocks everything else. Serve, open `deep-field-lab.html`, press `1`–`9`
   between movements and `B` where one actually turns, then **`save`** and hand
   over `deep-field-marks.json`.
2. **Four questions the owner has not answered, and part 2 needs them:**
   - **What happens to the current home background?** The page already runs the
     star field, the cloud sky, the reactive spine background and the messengers
     hero video. A full-page video background collides with all four — most
     sharply with the hero. Does the hero stay and the deep field pick up below
     it, or does this replace it? **This is the one that shapes the most.**
   - **"Swap to the reactive"** — confirm that means the existing
     `spine-bg` / `star-bg` system. And is "slowly or quickly" a per-card
     property, or one tuned speed?
   - **Scroll budget.** 265 frames is coarse stretched over a long page. Whole
     page, or a defined stretch of it?
   - **The name `deep-field`.**
3. **Part 2 itself**, once 1 and 2 land: scroll-driven background wired to the
   marks, reveals hung off the cues, and the stop-and-swap to the reactive
   background when a carousel card plays music, resuming the scrub on scroll out.
4. Everything still open from 36, untouched this session: **decide `LIVE`**;
   confirm the doc-rail ring inversion (38px resting over 28px focused) and the
   crimson rails; **re-establish a working cloud-sky measurement** or accept it
   is eye-only; the frame-budget decision (p90 2.2→4.1ms, p99 16–23ms).
5. **Three clips still waiting** for film rows: `rain-transmission-rooftop`,
   `last-train-below`, `the-black-archive` (folder: Desktop\Spine Home Photo and
   Video). The `kundalini-scrub-video` skill owns that pipeline. Owner names the
   section. **These are separate from `deep-field`** — different job, different
   page position.
6. music.html still black; stale amber-era `?tune` TIPS prose; the two missing
   trivia files; the astral scrim parked with its banner; the inherited pile
   (webmanifest favicons, PURCHASE, lab staleness, deploy/DNS, Range layers,
   Archive wrap, messengers→webp).

---

## Starting the next V2 chat

Attach this file. The working folder is
`C:\Users\Haight\Desktop\kundalini-spines-spine-ui` on `feature/spine-ui-v2`.
Serve with `python scripts/serve.py`, browse `http://localhost:8000` — never
`file://`, never `python -m http.server`.

> Here's the latest V2 handoff. Part 1 of the scroll-driven home background is
> done — `deep-field-lab.html` is a marker lab for the new 11-second clip, and
> I'm going to mark the six parts in it. Then I want to start part 2.

If the marks are already made, **paste the contents of
`deep-field-marks.json`** into that first message — it is the input part 2 runs
on, and it is small.
