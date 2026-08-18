# Kundalini Spines — Spine UI V2 Handoff 39

**Date:** August 17, 2026

Twenty-first handoff of the **Spine UI V2** track (branch `feature/spine-ui-v2`).
`38` owns the deep-field background, the Music stop and the violet palette;
`37` owns the deep-field clip and the marker lab; `36` owns the film-row
foreground and the reveal fixes. The plain `HANDOFF 1`–`19` series documents the
dormant production site on `main`.

---

## The one-line version

**The page now moves a section at a time. The Music stop from 38 was
generalised into a stepper that covers the whole document, every clip on the
home page stopped being scrubbed and now plays and loops on its own, the merch
render moved to the left of its headline and meets the cap of the "O", About
opens on f41, and every route to a section — step, spine node, nav link —
finally lands on the same pixel. `index.html` is STILL byte-unchanged, but three
of these reach it through shared files.**

---

## Corrections to earlier handoffs

- **38's "all five rail landings exact after the masthead fix" is WRONG, and it
  was wrong when written.** The boundary fix used `--nav-h-max` (92px) while
  `js/spine-doc.js` `jump()` — which every rail node calls — uses the LIVE
  `--nav-h`, which is **47px** once the masthead has collapsed. So a rail click
  landed 45px BELOW the boundary and showed a later frame than the marked one:
  About's boundary frame is f41 and its rail landing showed **f46.6**, Merch
  f157 against **f159.5**, Transmissions f196 against **f200.3**. 38's claim
  was probably measured with the bar expanded. Closed this session.
- **38's "Still open" item 1 — the diff into `index.html` — is STILL OPEN.** It
  did not happen. But it is no longer true that nothing reaches the production
  page: `js/spine-doc.js` and `css/spine-doc.css` are shared, so the film-row
  and merch-spine playback change, the merch layout, and the landing fix are
  all live on `index.html` already. The `.df-bg` background itself is not.
- **38's "Still open" item 3 (pacing) is half closed.** About ran 162 frames per
  1000px against Music's 19.7, an 8.2x spread. About now carries f41–134 rather
  than f0–134: **112 per 1000px, spread 5.7x**. Nobody has judged whether that
  is enough.
- **"MUSIC IS A STOP" is no longer the shape of the thing.** 38 describes a
  hold wired to one section. Every landing is a stop now. Music keeps exactly
  two special properties: it lands on its rest point rather than its boundary,
  and the leg OUT of it still races the parked clip.
- **The film rows and the merch render are no longer scrubbed at all.** Every
  sentence in 30–38 describing scroll-scrubbed clips on the home page is now
  historical. `scrubToScroll` has no caller.
- **`js/spine-doc.js` is loaded by TWO pages, not five.** `index.html` and
  `home-deepfield-lab.html`. `filmrow-atmos-lab.html`, `filmrow-fg-lab.html`
  and `deep-field-lab.html` only MENTION it in comments — the two filmrow labs
  carry their own verbatim inline copies of `scrubToScroll` and still scrub.
  A `grep -l` for the filename finds all five and is the trap.

## THE METHOD FINDING: A SYNTHETIC WHEEL EVENT IS NOT A FLICK

**Both bugs the owner reported failed to reproduce, and the code was fine in
every test I could write — until the test stopped lying.**

`page.mouse.wheel()` dispatches **one discrete event**. A real trackpad
dispatches a continuous stream with decaying magnitude for up to a second after
the fingers lift. Every early test drove the stepper with single ticks spaced
250ms apart, which is a cadence the gesture lock is designed to pass straight
through. The measured traces were clean and the reported faults were invisible.

Replacing it with a burst — 45 events, 12ms apart, magnitude decaying at
0.93^n, dispatched from inside the page so the timing is not throttled by CDP —
reproduced **both** faults on the first run, exactly as described.

```python
page.evaluate("""(a)=>{ return new Promise(function(res){ var i=0,n=a.n;
  (function f(){ if(i>=n) return setTimeout(res,60);
    window.dispatchEvent(new WheelEvent('wheel',{deltaY:a.dir*a.peak*Math.pow(0.93,i),
      deltaMode:0,bubbles:true,cancelable:true}));
    i++; setTimeout(f,a.ms); })(); }); }""", {"dir":1,"peak":70,"n":45,"ms":12})
```

**Any future work on wheel handling must use a burst, not a tick.** A green
result from `page.mouse.wheel()` means almost nothing about a real pointer.

## THE OTHER METHOD FINDING: TWO AUTHORITIES OVER ONE SCROLL POSITION

The owner's "bounces up then bounces back down" was `js/scroll-weight.js` and
the stepper both driving `window.scrollY`. Swallowing the wheel stops
scroll-weight receiving NEW input, but an animation it started EARLIER keeps
running toward a target of its own, and its `scroll` listener re-anchors only
when `running` is false — which is exactly when it is not.

Traced: up to **4689 at +500ms**, then reversing, **5639 by +1800ms**.

`scroll-weight.js` now exposes `window.KSScrollWeight.cancel()` and the stepper
calls it before every glide. **This is the same failure the stepper's own header
warns about for CSS scroll-snap**, arrived at from the other direction — and it
will happen again to anything else that animates the scroll position. There are
now two things that do.

## THE TESTS LIED AGAIN — three more, for the tally 38 started

- **A "catastrophic regression"** where a single wheel tick from the top of the
  page landed at 5976. The harness's own `scrollTo(0,0)` reset was being dragged
  back by scroll-weight's stale target during the sleep that followed it. Same
  family as 38's snap-off lie, and it cost a full re-run to see.
- **Landings "off by one frame."** `Math.round(currentTime * 24)` reads 157.5 as
  158. The module deliberately targets frame CENTRES, so `x.5` IS frame `x`.
  Every landing was exact the whole time.
- **A "loop seam" of 30.3% changed pixels**, which sounds terrible until you
  measure the baseline: ADJACENT frames of that clip score a median of 7.6 and a
  max of 22.4, because it is lit metal turning ~1.5° per frame. Read against
  zero it is a cut; read against the clip's own noise floor it is a frame step.

**Also worth recording: I broke the page with a comment edit.** Replacing part
of a `/* */` block left a stray `*/` mid-comment, so the remainder became bare
JS and the module died on both pages with `Unexpected identifier 'ON'`. It was
caught by the next verification run, not by reading the diff. **A comment-block
balance check (`count of /* == count of */`) is now part of the pre-commit pass
and it belongs there.**

## WHAT SHIPPED

### 1. The section stepper — one gesture, one section

`js/deep-field-bg.js`, `css/deep-field-bg.css`, `js/scroll-weight.js`.

Stops at 1440x900 after everything else this session moved:

| stop | y | frames |
|---|---|---|
| Home | 0 | f41 held |
| About | 808 | f41 → f134 (112.3 /1000px) |
| Music | 1914 | f134 → f157 (19.7) |
| Merch | 2802 | f157 → f196 (44.4) |
| Transmissions | 3680 | f196 → f265 (83.3) |
| Archive | 4508 | f265 held |
| Stay Connected | 5336 | f265 held |
| Foot | 6019 | — |

**THE STOPS ARE THE WHOLE DOCUMENT, and that is the second version.** The first
stepped only the six sections and handed everything below Archive back to
scroll-weight. That put a seam between two scroll authorities in the middle of
the page and caused both reported bugs. Stay Connected — whose position the code
already knew as `tailY` — and the document foot are stops in their own right
now, so there is no handback to go wrong.

**Telling a decaying tail from a new push** uses two signals: a **reversal**
(inertia never turns round) and a **rise in magnitude** (a tail cannot be much
larger than its own smallest event). A third, **time since the last event, was
tried at 60ms and removed** — `setTimeout` jitter alone pushed mid-tail events
over the line, each one cancelling the glide and starting another, and steps
that had been landing exactly came to rest BETWEEN stops (2766 against a 2802
landing; 4158 and 4927 against 4680).

**`--df-step` is read LIVE per wheel event**, not off the throttled `T`.
`syncTunables()` runs only from `tick()`, `tick()` runs only while the page
moves, and the stepper is the reason the page is not moving — so the off switch
was self-locking and measured as still stepping a full section at 0.

New dials in a Deep Field **"section stepper"** group: `--df-step`,
`--df-step-ms` (620), `--df-gap` (180).

### 2. Every clip plays itself now

`js/spine-doc.js`. The two film rows and the merch render all play, loop, and
are gated on visibility by an `IntersectionObserver` so three videos are not
decoding off-screen. Silent under `prefers-reduced-motion`, where the `poster`
frame stands in — and it survives the preload upgrade, because an element that
has loaded but never played still shows its poster.

`playInView()` re-applies `playbackRate` and writes `defaultPlaybackRate`,
because `load()` — which `js/deep-field-bg.js` calls to upgrade `preload` —
resets the rate.

### 3. The merch render's measured 360

**One revolution is 237 of the encode's 241 frames.** The last four overshoot
past the start, so a plain `loop` wrapped from an orientation the turn had
already passed and jumped backwards every 8 seconds.

Found by decoding every frame to a downsampled luma+alpha signature and, for
each candidate start, searching the best match at least 60% of the clip later:
**f3 → f240 at distance 14.6**, against an adjacent-frame median of 7.6.
Runners-up confirm a real minimum rather than a fluke of the metric — f2→f238
and f0→f238 both 15.3, then 18.2, then 21.0.

Playback runs **[0.1001s, 8.0086s)** and wraps to f3, driven by rAF rather than
`timeupdate` (which fires ~4x/second and could overshoot by 250ms — the whole
point is hitting one exact frame). Verified wrapping **8.0070 → 0.1001**, never
outside the range.

### 4. `--ksd-spine-rate` is a judder budget, not a taste dial

Shipped at 0.4 and the owner reported it hitching. **`requestVideoFrameCallback`
showed frames arriving every 104.2ms with stdev 1.2ms, zero dropped, zero late
— it was never a stall.** It was 9.6 unique frames a second, each held 6.3
refreshes of a 60Hz screen, stepping the spine ~1.9° at a time.

The encode is 24fps, so a smaller number cannot add poses, only hold them
longer. **Now 0.75: 56.2ms holds, 18 unique fps, 10.5s per turn.** The full
table lives next to the token.

### 5. The merch layout

`css/spine-doc.css`, `home-deepfield-lab.html`. Render on the left, headline and
body centred beside it, clip running alongside the whole block. The `h2` moved
inside `.ksd-merch__copy` so it shares a layout context with the figure.

**THE SPINE MEETS THE CAP, NOT THE VIDEO BOX.** Two offsets stack in one margin
and pull opposite ways: **+0.075em** of `--ksd-head-fs` down to the painted apex
of the "O" (6.0px at font-size 80, and font metrics agree), and back UP by the
clip's own transparent lead. The encode is the union bounding box of all source
frames, so the element's top edge is empty pixels — aligning the ELEMENT left
the visible spine hanging ~20px under the letterform. Sampled 49 frames: the
lead runs **row 19 at its tallest to row 39 at its shortest**, so the
compensation is the tallest reach, **19/1296**. That parks the highest frame
exactly on the cap and every other frame 0–11.5px under it, never above.
Verified **+0.0px at 1440, 1024 and 1920**.

The 237px hole between spine and text was **not** the flex gap (57.6px):
`.ksd-merch__copy` was `flex: 1 1 34ch` and GREW to the full remaining 1017px
while the text kept its own 62ch max-width and centred inside all that slack.
Now `flex: 0 1 62ch` with the pair centred as a group — **71px**. Rail node
unmoved: 3074 → 3074 at 1440, 3231 → 3231 at 760.

### 6. About opens on f41, and one landing position per section

**About starts at f41** (1.708s, 15.5%), revising the same day's f0. **Home
holds f41 too** — setting only About's start would have left a 41-frame cut at
the foot of the hero, which is the flash this was meant to remove, relocated.
Measured over the same 828px span, the peak luminance change drops **304.7 →
211.5 per 100px**. The bright frames themselves (**f120–123 at luminance ~132**
against a section floor of 9.4) are still in range, crossed more slowly.

**The landing fix.** There were THREE positions:

| route | offset | About landed |
|---|---|---|
| the stepper | `--nav-h-max` 92px | 808 |
| a spine node, `jump()` | live `--nav-h` 47px | 853 |
| a nav link / anchor | `scroll-margin-top` 0px | 900 |

Every `[data-ksd-section]` now declares **one** `scroll-margin-top`, and all
three routes read it. **The browser's own property rather than a constant in
JS**, because anchor navigation is the one route no script controls — the nav
links are plain hrefs, so an answer living only in code would leave it out.

## What is deliberate, so nobody fixes it

Everything in 30–38's lists still stands, except where corrected above.
Additionally:

- **`scrubToScroll` has no caller and is kept anyway**, under a banner saying
  so. Its lerp constant, write threshold and `!seeking` coalescing guard carry
  owner decisions recorded nowhere else, and `js/deep-field-bg.js`'s own scrub
  loop was copied from it. Delete it once self-playing clips have been lived
  with, not before.
- **A clip resumes where it paused** when scrolled back into view rather than
  restarting. Cheaper, and it reads as continuous atmosphere.
- **The landing offset is 92px, not the rail's old 47px.** The live `--nav-h`
  depends on WHERE YOU CLICKED FROM (92 at rest at the top, 47 once scrolled),
  so it cannot give a stable landing at all. The cost is 45px of air above a
  headline while the bar is collapsed; one token changes it.
- **`--ksd-spine-rate` is not a tuner dial**, the same call `--ksd-field` made.
  A dial would mean standing up a whole `KSTunePanel` tab for a file that
  registers none.
- **The merch copy centres at EVERY width, including phones.** Three centred
  paragraphs at 390px is ragged on both edges. Left-aligning below 900px is two
  lines if it is ever wanted.
- **The stepper swallows a whole gesture while its glide is running**, with no
  exception, because handing any of it back puts scroll-weight on the same
  pixels from a second direction.
- **The merch section is 162px shorter than it was**, so at window heights above
  ~1200px its headline floats further from the section top (~80px at 1400 tall).
  Consequence of `min-height: 92vh` plus `justify-content: center`, not a
  regression that can be removed without re-padding.

## Do not do these

Everything in 19–38's lists still stands. Additionally:

- **Do not test wheel handling with `page.mouse.wheel()` alone.** One discrete
  event is not a flick and will report success on a broken gesture lock.
- **Do not reintroduce a time-since-last-event signal into the stepper's gesture
  detection at anything like 60ms.** Measured: it fragments single gestures and
  lands the page between stops.
- **Do not let the stepper hand the wheel back anywhere except the two ends of
  the document.** A mid-page seam between it and scroll-weight is what caused
  both of the owner's reported bugs.
- **Do not animate `window.scrollY` from a third place** without calling
  `KSScrollWeight.cancel()` first.
- **Do not re-encode the spine render from `assets/video/spine-render.webm`.**
  ffmpeg reads it as plain `yuv420p` because it does not surface VP9's alpha
  side-track, so anything derived from it loses the matte. The ProRes source is
  the only valid input.
- **Do not read a section's `scroll-margin-top` unguarded in `measure()`.**
  Music's is written back by `restPoint()` as a NEGATIVE value derived from that
  very boundary; reading it feeds the last run's output into the next run's
  input. Positive values only.
- **Do not change About's `f0` without moving the frame Home holds.** They must
  be the same number or the foot of the hero becomes a cut.
- **Do not use the live `--nav-h` for a landing position.** It is correct for a
  scroll offset at the instant of a click and useless for a stable target.
- Still: `-g 4` on every scrubbed clip, no Python text-mode writes to
  JS/CSS/HTML, never `python -m http.server`, never `file://`.

## Verified vs. asserted

**Verified by tooling and looked at** (Aug 17 2026, Playwright/Chromium over
`scripts/serve.py`, 1440x900 unless stated):

- All 14 stepper landings exact in both directions, with trackpad-shaped
  gestures AND with discrete mouse-wheel ticks. One flick never walks two stops.
- Both reported scroll bugs reproduced before fixing and gone after: the
  up-flick out of Stay Connected no longer reverses; the follow-up flick off
  Archive moves at 50ms, 150ms and 300ms delays (was 0px).
- Below-Archive and above-Home handback; footer reachable.
- The Music race intact: sky 1 → 0 inside ~130ms, f134 → f157.5 under the glide,
  lands Merch.
- All three routes to all six sections agree, deltas 0, on the lab AND on
  `index.html`. Frame at each landing unchanged.
- Cap alignment +0.0px at 1440, 1024 and 1920; every other frame 0–11.5px below,
  never above. Rail node unmoved at two widths. No horizontal overflow at
  1440/1024/880/760/390.
- Film rows advance with the scroll held still, wrap rather than stop, pause
  off-screen, on both pages. Merch spine 0.40x then 0.75x measured against wall
  clock; loop wraps 8.0070 → 0.1001.
- Frame cadence by `requestVideoFrameCallback` at both rates.
- Zero console errors and zero 4xx on every pass. 0 BOM, 0 mojibake, CRLF
  preserved, comment blocks balanced.
- **Screenshots taken and looked at:** the home hero, About before and after the
  f41 change, the Music rest point, Archive, Stay Connected, the merch section
  before the cap fix, after it, and after the gap was closed.

**Asserted / not verified:**

- **The spine's loop seam has never been judged by eye at 0.75x.** The numbers
  say it is a frame step; nobody has watched it wrap.
- **Whether f41 actually fixes the About→Music flash.** The rate of change is
  down 31%, but the bright frames are still in range. This needs the owner's
  eye, not another measurement.
- **The 92px landing offset has not been judged by eye either** — only proven
  consistent.
- Real-browser (non-headless) autoplay, and any mobile/touch device.
- **No mobile pass on any of this.** The background is gated off below 768px.
- The mp4 fallback still has never been the chosen source in a browser.
- Safari: untested, as ever.

## Git state

- Branch `feature/spine-ui-v2`. Session start `27cde0d` (handoff 38).
- Three commits, pushed: **`a9e6b01`**, **`4332378`**, **`6c2f7e5`**.
  6 files, +922/-111.
- No new files. Modified: `css/deep-field-bg.css`, `css/spine-doc.css`,
  `home-deepfield-lab.html`, `js/deep-field-bg.js`, `js/scroll-weight.js`,
  `js/spine-doc.js`.
- **`index.html` is byte-unchanged** — but `js/spine-doc.js` and
  `css/spine-doc.css` are shared, so its clips now play, its merch section is
  relaid out, and its landings are consistent.
- `--spine-build` 41 (unchanged), `--star-build` 29 (unchanged),
  `--df-build` 3 → **4**.
- `main` untouched at `13083d9`. No PR.

## Still open

1. **The diff back into `index.html`.** Six marked places in the clone now, not
   five — the `DF LAB` banner's own list is stale about the hero and about
   `js/hero-video.js`, which is still loaded on both pages. It is mechanical and
   it is the step that ships any of this. **Carried over from 38 untouched.**
2. **The spine render's interpolated re-export.** The owner has the uncompressed
   ProRes and wants slow AND smooth; 0.75x is the floor the current 24fps encode
   allows. Needs motion interpolation, alpha kept through the filter chain, and
   a file-size check — the page's pipe-priority work says the largest video on
   the page growing is not free.
3. **Judge the About→Music flash by eye** now that f41 has taken 31% off the
   rate of change. If it still reads as a flash, the levers are the boundary
   (but f134 is the sky match frame) or more scrim there.
4. **Judge the 92px landing** and the spine's loop seam by eye.
5. **Phase two of the Music handoff** — playback gating, where a playing track
   holds the sky. All four hooks exist and none is used.
6. **A mobile pass.** Nothing here has been seen below 768px, and the merch copy
   centres at every width.
7. **Decide `scrubToScroll`'s fate**, and whether the two filmrow tuning labs
   should stop scrubbing to match the real page.
8. Everything still open from 36–38: **decide `LIVE`**; the doc-rail ring
   inversion; **re-establish a cloud-sky measurement** or accept it is eye-only;
   the frame-budget decision.
9. **Three clips still waiting** for film rows: `rain-transmission-rooftop`,
   `last-train-below`, `the-black-archive`. Owner names the section.
10. music.html still black; stale amber-era `?tune` TIPS prose; the two missing
    trivia files; the astral scrim parked; the inherited pile.

---

## Starting the next V2 chat

Attach this file. The working folder is
`C:\Users\Haight\Desktop\kundalini-spines-spine-ui` on `feature/spine-ui-v2`.
Serve with `python scripts/serve.py`, browse `http://localhost:8000` — never
`file://`, never `python -m http.server`.

> Here's the latest V2 handoff. The whole home page now steps a section at a
> time and every clip plays itself. I want to land the lab on `index.html` this
> session.

Open `home-deepfield-lab.html` and scroll it end to end before deciding
anything — three of this session's decisions are waiting on the owner's eye
rather than on another measurement.
