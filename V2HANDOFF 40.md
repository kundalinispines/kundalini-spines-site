# Kundalini Spines — Spine UI V2 Handoff 40

**Date:** August 18, 2026

Twenty-second handoff of the **Spine UI V2** track (branch `feature/spine-ui-v2`).
`39` owns the section stepper, the self-playing clips and the landing fix; `38`
owns the deep-field background and the Music stop; `37` owns the marker lab. The
plain `HANDOFF 1`–`19` series documents the dormant production site on `main`.

---

## The one-line version

**The background clip was swapped for the owner's new footage and the whole
mapping was rewritten: the clip is no longer scrubbed by scroll, it PLAYS at
1.0x from one cue to the next and stops on a frame the owner marked. The marker
lab now takes more than one clip, the palette went back to Signal Red, the film
rows shrank to the size of a track card, and Music opens on a title card.
`index.html` is no longer byte-unchanged — it lost one paragraph and it takes
the palette and the film-row size through shared files.**

---

## Corrections to earlier handoffs

- **39's "the whole page steps a section at a time" still holds, but the clip no
  longer follows the scroll at all.** Every sentence in 30–39 describing a
  scroll-to-frame mapping, a scrub lerp, a catch-up rate, or a frame range per
  section is now historical. `frameAt()` is gone. Sections carry a `cueFrame`,
  not an `f0`/`f1` span.
- **39's open item 3 (pacing, the 5.7x frames-per-1000px spread) is not fixed —
  it stopped existing.** Frames are no longer tied to scroll distance, so the
  number has no meaning. Do not go looking for it.
- **39's "`--ksd-spine-rate` is a judder budget" is untouched and still true.**
  Nothing this session went near the merch spine render.
- **39's open item 4, "judge the 92px landing by eye", is closed and the answer
  was no.** The landing showed the hero's last 92px; About now lands on its own
  top. See "What shipped" 6.
- **My own first answer on reverse playback was wrong and I corrected it
  mid-session.** I measured 27.7ms mean / 36fps achievable and told the owner
  reverse had ~30% headroom. That was one range of the clip. The f83–f157
  stretch runs 13 of 40 frames over budget with a 449.9ms worst case. Reverse is
  marginal on busy footage and the fallback is load-bearing, not decorative.
- **The Music race (39's "the leg OUT of Music races the parked clip") is
  deleted.** It faked motion that scrubbing could not produce; under play-and-park
  the clip genuinely resumes at 1.0x, and a race is a speed change the brief
  forbids.

## THE METHOD FINDING: A DECAYING BURST IS NOT A FLICK EITHER

39 established that `page.mouse.wheel()` is not a flick and that a burst is.
**That was right and it did not go far enough.** A real trackpad flick
**accelerates before it decays**, and 39's burst only decays — so it never trips
the stepper's PUSHED test, which fires on a rising edge mid-gesture.

Two bugs hid behind that for a whole round of verification, both of which the
owner found in seconds by scrolling:

```python
# ramp for the first 6 events, THEN decay — this is the shape that finds bugs
m = a.peak*(0.25+0.15*i) if i < 6 else a.peak*(0.93**(i-6))
```

With the decay-only burst the About→Music leg measured **2.586s** against
2.583s expected — perfect. With the ramping burst the same leg finished in
**56ms**, playing exactly one frame before seeking. **Test wheel handling with a
burst that rises before it falls.**

## THE OTHER METHOD FINDING: THE NUMBERS I CHOSE TO LOOK AT WERE THE WRONG ONES

Three separate faults this session were invisible in the measurements I was
taking and obvious to the owner on sight:

- **Music→Merch "fires when it lands"** — the clip was playing exactly on time.
  `--df-sky` held 1.000 until the glide landed, so 17 frames played under an
  opaque sky. I was measuring frame numbers and leg durations; both were correct
  throughout.
- **About→Music "lands on the nebula"** — same fault mirrored, 46 frames hidden.
- **The old purple background on a hard refresh** — I checked the poster, found
  it, fixed it, and the real cause was `vid.duration` being truthy at
  HAVE_METADATA. The poster only decided how *recognisable* the fault was.

**A leg being frame-exact says nothing about whether anyone can see it.** When a
report is "it looks wrong" and the numbers say fine, measure what is *painted* —
`--df-sky`, element opacity, `readyState` — not what is scheduled.

## THE TESTS LIED AGAIN — four more, for the tally 38 started

- **"Anchor navigation is broken"** — `#transmissions` and `#archive` are not
  anchors at all; those sections carry no `id` and are separate pages. My test
  invented them.
- **"The anchors land in the wrong place"** — I sampled mid-scroll, before
  scroll-weight had finished animating. Wait for rest, then read.
- **"The video error backstop does not reveal anything"** — nothing was in view
  to reveal. The check needed a scroll, not a fix.
- **"The carousel is not held"** — Music's cue had already fired earlier in the
  same page session. Reveals fire once; a fresh load was required.

**Also worth recording: a subagent's view of a file another agent is editing can
be stale.** The palette agent reported `css/spine-doc.css:40` still holding a
violet value; the resize agent said it had fixed it. The resize agent was right —
the palette agent read the file mid-edit. I checked rather than picking a side,
and checking cost less than either report.

## WHAT SHIPPED

### 1. Play-and-park — the clip plays itself, cue to cue

`js/deep-field-bg.js`, `css/deep-field-bg.css`.

Landing on a section plays the clip forward at **1.0x** to that section's cue
frame, stops it there, and releases that section's reveal. **Boundaries are
scroll landings and say nothing about the frame.** Nothing in the file changes
`playbackRate`.

| leg | frames | duration | notes |
|---|---|---|---|
| Home → About | 21 | 0.875s | waits for the hero, see 5 |
| About → Music | 62 | 2.583s | crosses f49 |
| Music → Merch | 70 | 2.917s | the hard cut at f126 |
| Merch → Transmissions | 63 | 2.625s | opens through f154–156, the light dying |
| Transmissions → Archive | 36 | 1.500s | |
| Archive → Stay Connected | 20 | 0.833s | |
| Stay Connected → Foot | 16 | 0.667s | then holds f288 |

**What was deleted:** the piecewise scroll-to-frame map, the `target`/`shown`
lerp, the catch rate, and the three frame remaps `measure()` performed (Home,
Transmissions, Archive). All answered "where does this scroll position land in
the footage", which nobody asks any more. **The stepper is untouched** — 39's
gesture detection, the tail-versus-new-push signals and the
`KSScrollWeight.cancel()` call all survive and still decide which section you
land on.

**A leg always terminates.** A second flick seeks to the pending cue (never
fast-forwards — a speed-up is the one thing the brief rules out), and a 1200ms
stall backstop lands the leg if the clip stops advancing.

### 2. The clip is deep-field-2, and three marks moved

289 frames, 12.042s, 1920x1080 h264, `-g 4` on both encodes.
`assets/lab/deep-field-2-marks.json` is the source of truth and records every
move with its reason.

| section | owner's mark | shipped | why |
|---|---|---|---|
| About | f25 | **f21** | flattest horizon in the clip: edge-row spread 0.8px against 2.4px at f25, rank 1 of 289 |
| Music | f82 | **f83** | best structural match to `starfield-deep-4k.webp`, **r = 0.907** |
| Merch | f157 | **f153** | owner's later call — the clip's luminance peak, 84.7 against a 1.2 floor |
| Archive | f272 | **f252** | the clip's last measured structural event; f272 was unanchored |
| Stay Connected | f287 | **f272** | tail rebalance; no leg is shorter than 0.66s now, was 0.083s |

**THE OWNER'S MARKS WERE ACCURATE.** Six of twelve landed within one frame of a
measured event, found by scoring every frame-to-frame structural change:
Music boundary f48 ← event f49; Merch boundary f126 ← **the clip's only hard cut**,
zero frames off; Merch cue f157 ← the curtain settling at f156; Transmissions
boundary f190 ← event f190, exact; Transmissions cue f216 ← event-cluster peak,
exact. **Everything from f216 onward is unanchored** — the clip's structural
events stop there, which is why the tail felt arbitrary and needed rebalancing.

**The new clip matches the site's own sky far better than the old one.** `find
closest` gives f83 at **r = 0.907** against deep-field's best of f134 at 0.720.
Its runners-up collapse fast (0.561, 0.508), so unlike the old clip there is
exactly ONE sky frame — do not spend it elsewhere.

### 3. The crossfade happens at the park, not across the leg

**Three attempts, and the first two were both wrong in ways the owner saw
immediately.** The sky was on scroll geometry, then on clip progress, and is now
anchored to the ends of a leg:

- **arriving under the sky** — the clip plays with the nebula fully off, parks on
  its cue, and only then does the sky come up over the settled frame. ~935ms.
- **leaving the sky** — the nebula drops as the leg begins, gone by frame 19 of
  74, so the clip has the screen to itself for the rest.

Two rates, `--df-sky-in` (0.055) and `--df-sky-out` (0.10), because they are not
the same event. **Rising had to learn to ease** — it snapped, correctly, while
rising meant "follow the scroll".

**The sky lock is released by `arrive()`, never by a scroll position.** It was
`y >= music.y1` first, which is right for the Music exit and wrong for every leg
below it: that test is already true at the first scroll event, so the lock lifted
immediately and `skyAt()` took the sky back. It showed on Archive → Stay
Connected, where the nebula climbed all the way through the footage.

### 4. Reveals are cue-driven, with the observer as the floor

Cued sections are held by `.df-cued` and released one at a time as the clip
parks. **The reveal is held DOWN rather than the observer suppressed**, because
`js/spine-doc.js` registers its `IntersectionObserver` synchronously at parse and
is loaded first — there is no flag this module could set in time. It also avoids
duplicating the mobile/reduced-motion gate in a second file.

**Three backstops, each tested, and they are why this is safe at all:** a video
error, 8s without a decoded frame, and scrolling clean past a section each hand
every reveal back. Content can never be stranded by a clip that did not load.

**Things that were never in the reveal system and are now:** the track carousel
(Music's section has exactly one `.ksd-reveal`, its `h2`), all four section
button rows, and Stay Connected's body copy plus its entire signup block.

### 5. The clip does not advance while the hero covers it

`.ksd-hero` is exactly one viewport tall and sits over the background. Measured:
the hero did not clear until **t=651ms** with the clip already on **f15**, so 14
of the Home→About leg's 21 frames played where nobody could see them and the
first seven showed against less than half the background. A forward leg now waits
for the hero to clear — **0 frames hidden, 100% of the background visible**. It
costs ~675ms before About's reveal. A 1400ms backstop stops an interrupted glide
waiting forever.

### 6. About lands clear of the hero

`css/spine-doc.css`, **shared with `index.html`**. The 92px landing offset left
the hero's last 92px on screen, and with the bar collapsed to 47px that meant
45px of hero video plus the sound toggle fully in shot. About now lands on its
own top; its 139px of internal padding clears the masthead in both states.
Verified at 1440, 1920 and 1280, all three routes agreeing to the pixel.

**It is `scroll-margin-top: 0.02px`, not 0, and that is not a typo.** Both
readers treat exactly 0 as "nothing declared" and substitute a nav height —
`jump()` does `smt !== 0 ? smt : navH`, `landOffset()` does `smt > 0 ? smt :
navMax`. Neither guard can be relaxed: `getComputedStyle` cannot tell a declared
0 from the initial 0, and on `index.html` most sections declare nothing and
depend on that fallback. Chrome round-trips sub-pixel values intact.

### 7. Nothing is shown that cannot be painted

**`vid.duration` was the wrong readiness test.** It arrives at HAVE_METADATA,
before a frame exists, so an early scroll on a hard refresh started a leg, the
leg dropped the sky, and what the clip had to show was its **poster** — still
deep-field's purple nebula. Guard is `readyState >= 2`; the poster is
deep-field-2's f0, which is the frame Home holds, so poster and first painted
frame are the same picture. Verified cold at 600kbps, 1.5Mbps and 6Mbps.

Every `var(--df-sky)` read now carries a fallback of `1`. The file says "fail
towards the sky"; an unresolved value was failing towards the clip. **It is not
what fixed the flash** — the measurement said otherwise — but it is right.

### 8. Music opens on a title card

"Enter the Tracks" was never actually seen: `musicRest` frames the carousel,
which put the real `h2` at top **−96**. It now holds the screen alone for
`--df-title-ms` (1000) once the clip parks on f83, then the cards come up in its
place. Measured: parks 2644ms, title 2725ms, cards 4000ms.

**The card is a SECOND element, not the h2 moved.** `js/spine-doc.js:94` reads
`if (!sec.head) return;` — with no `.ksd-head` the Music section gets no entry in
the node table, so removing the heading does not move the rail node, it **deletes
it**. The h2 stays in flow at `opacity: 0` with its box intact and remains the
accessible heading; the card is `aria-hidden`. Scoped to `html.df-live`, set only
past the mobile/reduced-motion gate.

### 9. The marker lab takes more than one clip

`deep-field-lab.html?clip=deep-field-2`. An unknown or absent value falls back to
`deep-field`, so every existing link opens what it always did. **The storage key
is namespaced per clip** — verified in one profile that clip A held [94, 122] and
clip B [216] without collision. `scripts/build-marker-clip.py` builds the whole
asset set for any clip in one command; the shipped assets were regenerated
through it to prove it reproduces them.

### 10. Signal Red returns, site-wide; the film rows shrink

Five sites — see the `bca95de` commit message for the list, including the two
written as decimal triplets that a hex grep cannot see. Film rows are sized by a
**grid track**, not a width: 650x542 → **563x469**, which is **+10.0% area** over
the 490x490 track card, the owner's chosen basis.

## What is deliberate, so nobody fixes it

Everything in 30–39's lists still stands, except where corrected above.
Additionally:

- **`scrubToScroll` still has no caller and is still kept.** 39's reasoning holds
  and is now stronger: this module's own scrub loop was derived from it and has
  since been deleted, so it is the last record of those constants.
- **Reverse travel is asymmetric in reliability, not in speed.** It plays back at
  23.7–23.9fps on every leg, but it is a hand-rolled seek loop that gives up
  after 3 late frames. Per-frame writes are throttled to every third frame during
  reverse because two custom-property writes tripled the seek cost (30.1 → 103.8ms
  median).
- **The last 16 frames play under a full nebula.** Stay Connected and the Foot
  both rest under the sky, so the f272→f288 leg is never seen. Showing it means
  dropping the sky and bringing it straight back, which flickers.
- **Merch parks on the clip's brightest frame and `--df-lum` is at its maximum
  there.** The scrim is fully deployed holding that copy readable. It works, and
  there is no headroom left if Merch is ever moved somewhere brighter.
- **The 72px of empty space at the top of the Music section is load-bearing.**
  It is the hidden `h2`'s box, keeping the rail node still.
- **`--df-catch` and `--df-release` were removed, not left as dead dials.** They
  drove the scrub lerp and the Music race.
- **Boundaries are still in the marks file though nothing reads them.** They are
  provenance for what the owner marked.

## Do not do these

Everything in 19–39's lists still stands. Additionally:

- **Do not test wheel handling with a burst that only decays.** It cannot trip
  the PUSHED test and will pass a broken gesture lock. Ramp, then decay.
- **Do not gate anything on `vid.duration` meaning "ready".** It is true before a
  frame exists. `readyState >= 2` is the test.
- **Do not wait for `canplaythrough` before starting a leg.** It holds the whole
  journey hostage to a full download; the stall backstop is the answer.
- **Do not release the sky lock on a scroll position.** `arrive()` owns it.
- **Do not remove the Music `h2`.** `js/spine-doc.js:94` deletes the rail node
  rather than moving it. Hide it; keep its box.
- **Do not "tidy" About's `scroll-margin-top: 0.02px` to 0.** It silently
  restores the three-route disagreement 39 fixed.
- **Do not write a per-frame custom property inside the reverse seek loop.**
  Measured at 3x the frame budget.
- **Do not assume a subagent's report about a file it does not own is current.**
- Still: `-g 4` on every scrubbed clip, no Python text-mode writes to
  JS/CSS/HTML, never `python -m http.server`, never `file://`.

## Verified vs. asserted

**Verified by tooling and looked at** (Aug 18 2026, Playwright/Chromium over
`scripts/serve.py`, 1440x900 unless stated):

- All 14 landings exact in both directions, with ramp-then-decay flicks AND
  discrete mouse ticks, re-run after every change.
- Every leg within 15ms of its footage; `playbackRate` never left 1.
- Reverse plays back at 23.7–23.9fps on all six legs.
- Sky correct at all seven resting stops, and every leg clean.
- Cold-cache behaviour at 600kbps, 1.5Mbps and 6Mbps with an early scroll: the
  poster is never exposed before a frame exists, and the leg always lands.
- Reduced motion, 390px, anchors and rail nodes; the three content backstops.
- Buttons hidden until their own cue in every section, visible where the module
  does not run.
- Film rows 563x469 = +10.0% area over the card; palette red at every live site
  with zero violet literals left.
- **Screenshots taken and looked at:** the home hero, About before and after the
  landing fix, Music with the sky crossfaded, Archive, Merch on f153, the Music
  section with the heading hidden, the About film row at its new size.

**Asserted / not verified:**

- **Nobody has watched the title card by eye at 1000ms.** The timings are
  measured; the beat is not judged.
- **The Merch f153 park has not been judged by eye** beyond one screenshot.
- **No mobile pass on any of this.** The background, the stepper and the title
  card are all gated off below 768px, so the phone experience is free scroll with
  observer reveals — correct by construction, not by inspection.
- Real-browser (non-headless) autoplay; Safari, as ever.
- The mp4 fallback has still never been the chosen source in a browser.

## Git state

- Branch `feature/spine-ui-v2`. Session start `4d3fda0` (handoff 39).
- **Five commits, all pushed:** `8b41218`, `8040030`, `c8f838c`, `bca95de`,
  `10072fe`. 17 files, +1507/−342.
- New files: `scripts/build-marker-clip.py`, `assets/lab/deep-field-2-*`
  (marks, lum, strip, sprites), `assets/video/deep-field-2.*` (+poster).
  **~14MB of new binaries** — the repo now carries two full copies of the
  background clip.
- **`index.html` is NO LONGER byte-unchanged.** It lost one paragraph, and it
  takes the palette and the film-row size through shared files.
- `--spine-build` 41 → **42**, `--star-build` 29 (unchanged), `--df-build` 4 → **5**.
- `main` untouched at `13083d9`. No PR.

## Still open

1. **The diff back into `index.html`.** Carried from 38 and 39. The `.df-bg`
   layer, `js/deep-field-bg.js`, `css/deep-field-bg.css` and the title card are
   still lab-only. This is the step that ships the journey.
2. **Judge the title card's 1000ms hold, the Merch f153 park, and the ~675ms
   the hero-wait adds before About's reveal.** All three are timings only the
   owner's eye can settle; `--df-title-ms` is a dial.
3. **Decide the old clip's fate.** `deep-field.webm`/`.mp4` (8.8MB) are no longer
   fetched by the home page — only the marker lab uses them, as its default
   `?clip=deep-field`, with the owner's original marks. Deleting them means
   making deep-field-2 the lab's default.
4. **A mobile pass.** Nothing here has been seen below 768px.
5. **The spine render's interpolated re-export** (39's item 2, untouched).
6. **Phase two of the Music handoff** — playback gating, where a playing track
   holds the sky. All four hooks exist and none is used.
7. **Decide `scrubToScroll`'s fate**, and whether the two filmrow tuning labs
   should stop scrubbing to match the real page.
8. Everything still open from 36–39: **decide `LIVE`**; the doc-rail ring
   inversion; **re-establish a cloud-sky measurement** or accept it is eye-only;
   the frame-budget decision.
9. **Three clips still waiting** for film rows: `rain-transmission-rooftop`,
   `last-train-below`, `the-black-archive`.
10. music.html still black; stale amber-era `?tune` TIPS prose; the two missing
    trivia files; the astral scrim parked; the inherited pile.

---

## Starting the next V2 chat

Attach this file. The working folder is
`C:\Users\Haight\Desktop\kundalini-spines-spine-ui` on `feature/spine-ui-v2`.
Serve with `python scripts/serve.py`, browse `http://localhost:8000` — never
`file://`, never `python -m http.server`.

> Here's the latest V2 handoff. The home background is a new clip now and it
> plays itself section by section instead of being scrubbed. I want to land the
> lab on `index.html` this session.

Open `home-deepfield-lab.html` and scroll it end to end before deciding
anything — three of this session's timings are waiting on the owner's eye rather
than on another measurement.
