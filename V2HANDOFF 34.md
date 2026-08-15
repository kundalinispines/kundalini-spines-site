# Kundalini Spines — Spine UI V2 Handoff 34

**Date:** August 15, 2026

Sixteenth handoff of the **Spine UI V2** track (branch `feature/spine-ui-v2`).
`33` owns the first spine-render session; `32` the eyeball pass and the rail's
graded field. The plain `HANDOFF 1`–`19` series documents the dormant
production site on `main`.

---

## The one-line version

**The true-alpha spine render shipped and the colorkey died; the rail now
starts below the hero and the Home node is gone; two of the owner's clips
landed as scroll-scrubbed film rows (About, Transmissions) behind a new
reusable skill; a WebGL cloud layer now drifts over the nebula, viewport-fixed
and under everything — after five wrong turns, two subagents, and the owner's
own diagnosis; the astral scrim was built three ways and parked.**

---

## Corrections to earlier handoffs

- **33's top open item is CLOSED.** The owner's alpha re-export arrived
  (`SpineSpin.mov`, ProRes 4444 XQ, `yuva444p12le`, 98% transparent). The
  colorkey pipeline is gone; the render is encoded straight from the embedded
  matte. Interior see-through measured 0.01–0.24% per frame against 3–15%
  under the old key. The recipe in 33 ("skip the colorkey, keep
  24fps/`-g 4`/crop") was followed exactly, except the 1152px rescale was
  dropped — the new crop (264×1296+1760+456, union bbox of all 241 frames)
  is already even on both axes and the alpha is straight, so resampling
  bought nothing.
- **33's "mp4 fallback never exercised" is closed** — the fallback was forced
  in Chromium and looked at; the screen blend zeroes its black correctly.
- **The merch render has NO caption at all now.** 33's rule "do not fix the
  caption to imply autoplay" is moot: both halves of "SPINE RENDER V1 —
  TURNED BY THE SCROLL" came off on the owner's call, in two steps.
  `.ksd-merch__video-note` is deleted from the CSS. A comment at the old spot
  says not to re-add one — including a well-meant "scroll to turn" hint.
- **index.html's merch comment block was rewritten** — anything quoting the
  old "transparency is DERIVED / colorkey 0.09" text is stale.
- The stray 404 flagged mid-session is `fonts.gstatic.com` failing a woff2 —
  external, pre-existing, not ours.

## Git state

- Branch `feature/spine-ui-v2`. Session start `ba2287e` (handoff 33), end
  `c65bf0c` — 20 commits, pushed.
- New files: `js/clouds.js`, `js/clouds-sky.js`, `clouds-lab.html`,
  `css/astral-scrim.css` (parked), `scripts/make-astral-scrim.py`,
  `assets/scrim/*` (tile + three archived sources), `assets/video/black-tide.*`,
  `assets/video/spine-frequency.*`, `.claude/skills/kundalini-scrub-video/`.
- `main` untouched. No PR.

## THE RAIL AND THE HERO

Owner's calls: rail begins at the hero video's bottom edge (measured from
`.ksd-hero__media` by `js/spine-doc.js`, not a constant); **no Home node**;
hero carries no `data-ksd-section` at all. Re-adding that attribute restores
both the node and the full-height rail at once — the comment in `index.html`
says so.

Two traps found while doing it, both fixed and documented in the code:
- `watchReveals` used to source from `sections`, silently tying "does this
  headline appear" to "does this section have a rail node" — the hero's h1
  vanished when the attribute came off. It queries `.ksd-reveal` directly now.
- `onScroll`'s active-node fallback defaulted to `sections[0]`; with Home gone
  that lit About from the top of the page. It defaults to null — nothing is
  lit while the hero owns the viewport, deliberately.

Vertebra positions stay in DOC coordinates and convert to rail-relative only
at placement — folding `railTop` into `dataset.y` looks like a tidy-up and
silently offsets the whole graded field by the hero's height.

## THE FILM ROWS — About and Transmissions

`black-tide.mp4` stands beside "Two Messengers. One Signal.";
`spine-frequency.mp4` beside "Tune to a Frequency" (that is the TRANSMISSIONS
section — Music's headline is "Enter the Tracks", and the wrong guess lands in
the protected carousel). Both scrubbed by the scroll.

- **`.ksd-filmrow` is the shared pattern** (grid `0.88fr/1.12fr`, headline
  inside the copy column, media `aspect-ratio: 1.2` pinning the crop constant
  across widths, stacks below 900px at natural proportions). Merch is
  deliberately NOT on it — portrait, transparent, sized by height.
- **`scrubToScroll` in `js/spine-doc.js` is one function serving every clip**,
  wired by `querySelectorAll('.ksd-filmrow__media video')`. A new clip is
  markup plus an encode — no new JS, no new CSS block.
- **`-g 4` is the cost of admission** for any scrubbed clip; it triples the
  file and its absence presents as a janky page, not a bad encode.
- **`.claude/skills/kundalini-scrub-video/` owns the whole pipeline** —
  probe, encode flags, layout, verification checklist, the silent-breakage
  traps. Three clips remain in the owner's folder: `rain-transmission-rooftop`,
  `last-train-below`, `the-black-archive`.
- spine-frequency's poster is the owner's own still (05-spine-frequency.png)
  resized to the clip's exact pixels — not a pulled frame.

## THE CLOUD SKY — read this before touching it

`js/clouds.js` (library, ported from the owner's React/TS component — the lab
comment header claiming it is wired to no page is stale; index.html loads it)
plus `js/clouds-sky.js` (placement + the owner's tuned OPTIONS) plus
`clouds-lab.html` (14-slider tuning lab, `Copy options` round-trips into
OPTIONS).

**The final architecture, owner's spec verbatim:** "clouds underneath
everything, not linked to any kind of scroll or scrub, persistent on top of
the nebula layer always." Implemented as: fixed body child at z-index −1,
`content:` the fixed stage itself so the shader's scroll offset is permanently
zero. The field is nailed to the viewport exactly like the nebula; only time
moves it (`speed 0.6` ships — the drift is wanted).

**It took five wrong turns to get here; do not repeat them:**
1. Hero into the negative layer (`.ksd-hero__media` z-index −1) — made the
   hero see-through because `body::after` paints over every body child at
   z −1. Committed b7ee48a, reverted e09ea47.
2. Gluing the field to the page (`content: documentElement`) — dragged the
   noise through the viewport 1:1 with scroll; that WAS the "scrubbing in".
3. Raising `shadow` to compensate for low opacity — the shadow term is alpha
   WITHOUT colour, i.e. black paint on a premultiplied canvas. The owner saw
   literal black clouds. **`shadow: 0` ships and must stay 0**; to strengthen
   the layer raise `opacity` (0.12 measured clean).
4. Mirror canvases continuing the field over the film-row videos — reversed;
   the owner wants content ON TOP of clouds, occlusion is correct.
5. Measuring "presence" with absolute difference — scores a black blob equal
   to a lit cloud and recommended the worst setting in the sweep. Measure
   SIGNED change against the sky.

**Verified (two independent subagents, Aug 15 2026):** isolated field
bit-identical across 18 scroll depths 0–6100 (corr 1.000000, max delta
0.000), same at 390×844; the audit re-served the pre-fix code as a positive
control and its field translated exactly +300px per 300px scroll. Drift alive
at fixed scroll. Cloud paint inside hero/film-rows/track-card: 0.000 each.

**Measurement traps, hard-won:** a WebGL canvas clears its drawing buffer
after compositing — reading it outside the render frame returns blank and
looks dead; isolate the layer by toggling `opacity`, never by hiding
`.ks-cloud-sky`; `.track-hero-layer` sets `visibility:visible` explicitly and
survives a body-children hide sweep; a flat test background goes on `html`,
never `body` (body's background buries every z −1 child); the field seeds
`time` randomly per load, so cross-load numbers do not compare — freeze
`speed` to measure.

**Browser reality:** Chrome good (owner-confirmed). Brave good — but Shields
fingerprint-blocking on "strict" kills WebGL2 and the layer bails gracefully
(one console warning names the cause; that was the owner's actual Brave
problem, confirmed by a fresh-profile test on this machine's 3090 Ti). The
Claude in-app pane cannot composite rAF/WebGL at all — never judge this layer
there. Safari untested project-wide, unchanged.

## THE ASTRAL SCRIM — parked, not deleted

The owner tried an under-copy scrim three ways (elliptical package asset →
generated dot-matrix slab in palette colours → two-layer pool+noise with
blur) and called it off: "not really feeling the scrim." Everything survives —
`css/astral-scrim.css` opens with a PARKED banner (how to revive, and three
measured geometry guards that should not be re-derived), the generator and
sources are in the tree, and index.html's head marks where the link was. The
eight tuner sliders came OUT of spine-bg.js (count back to 47). If it is ever
revived: get the owner's eye on a still BEFORE wiring geometry and tuner.

## What is deliberate, so nobody fixes it

Everything in 30–33's lists still stands. Additionally:
- **No caption under the merch render.** No rail over the hero, no Home node.
- **No clouds over the hero** — full stop, owner's call. The first screen
  shows zero cloud because the hero covers the viewport; coverage ramps in as
  the hero scrolls away, at exactly the nebula's own rate. Architecture, not
  a bug.
- **`cover: 0` ships** — 30–34% of the sky carries no cloud, largest
  contiguous patch 6–13% of the viewport, and viewport-fixing means a patch
  parks on screen. The sweep table is in `clouds-sky.js` (0.10 → 19% empty,
  0.20 → 10%); raising it is the one-line dial if the owner wants denser sky.
- **`shadow: 0`, `speed: 0.6`, `quality: 0.2`** in OPTIONS — all reasoned in
  the file header.
- **One `aspect-ratio` for every film row** — the crop differs per clip
  (20% black-tide, 10% spine-frequency) so the BOX stays identical.
- The About/Transmissions videos still hold their still frames until scrolled
  — same reduced-motion and no-autoplay logic as the merch render.

## Do not do these

Everything in 19–33's lists still stands. Additionally:
- **Do not link the cloud field to scroll in any way** — `content:` stays the
  fixed stage. And do not re-add mirrors over media.
- **Do not raise `shadow` above 0** in clouds-sky OPTIONS (black paint), and
  do not "tidy" OPTIONS toward the library defaults.
- **Do not move `.ksd-hero__media` off z-index 0** (see the revert).
- **Do not give `body` a z-index or transform** — the old star-bg rule, which
  now also silently kills the cloud layer.
- **Do not re-encode any scrubbed clip without `-g 4`.**
- **Do not add a rail node or `data-ksd-section` back to the hero.**
- **Do not edit JS/CSS/HTML with Python text-mode writes** — CRLF flips the
  whole file (it cost one commit an amend). Edit tool, or `open(p,'wb')`.

## Verified vs. asserted

**Verified by tooling and looked at (Aug 15 2026, Playwright/Chromium over
scripts/serve.py, 1440×900 + 390×844 unless noted):**
- Spine render: real alpha end-to-end, back-view solid, scrub monotonic and
  closing by 80% travel, zero settle drift, mp4 fallback exercised.
- Rail: starts at hero bottom (delta 0 at both widths), six nodes, headline
  reveals intact, node click jumps, reduced motion clean.
- Film rows: both scrub monotonic, never playing, 99% done by 0.8 travel,
  merch unchanged by the refactor, crops constant (2560→390 checked), rail
  cleared everywhere, zero overflow/errors.
- Cloud sky: everything in the section above, by two independent agents.
- Brave: fresh-profile test on this machine renders the layer fine.
**Asserted / not verified:**
- The owner likes the current cloud look (values are theirs from the lab, and
  the drift/coverage judgement call is still theirs to make on feel).
- Rail feel by the owner's eye — carried from 32 and 33, still waiting.
- Safari, real phone hardware: untested, unchanged.

## Still open

1. **Three clips remain** for film rows: `rain-transmission-rooftop`,
   `last-train-below`, `the-black-archive` (folder: Desktop\Spine Home Photo
   and Video). The `kundalini-scrub-video` skill owns the pipeline; each is
   an encode plus markup. Owner names the section.
2. **The merch spine render is much narrower than the version the owner
   approved on Aug 14** — 143px vs ~242px at 1440, because the new crop is
   thinner. Flagged twice, no verdict. One line in `css/spine-doc.css`
   (`.ksd-merch__video video` height clamp) if more presence is wanted.
3. **Cloud `cover` dial** — if the owner reports bare sky patches, raise
   `cover` in `js/clouds-sky.js` per the table there.
4. **Owner judges by feel:** the rail (32's item, still), the cloud drift,
   and the film-row scrub windows (all 0.10–0.80).
5. The scrim, if ever revived — still on the shelf with its banner.
6. music.html still black; stale amber-era ?tune TIPS prose; the two missing
   trivia files; the inherited pile (webmanifest favicons, PURCHASE, lab
   staleness, deploy/DNS, Range layers, Archive wrap, messengers→webp).

---

## Starting the next V2 chat

Attach this file. The working folder is
`C:\Users\Haight\Desktop\kundalini-spines-spine-ui` on `feature/spine-ui-v2`.
Serve with `python scripts/serve.py`, browse `http://localhost:8000` — never
`file://`, never `python -m http.server`.

> Here's the latest V2 handoff. The cloud sky, two film rows and the
> true-alpha spine render are all live on the home page. Likely next: the
> remaining three clips (the skill knows the pipeline), or the merch spine's
> width, or judging the cloud/rail feel.
