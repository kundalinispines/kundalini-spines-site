# Kundalini Spines — Spine UI V2 Handoff 26

**Date:** August 11, 2026

Eighth handoff of the **Spine UI V2** track (branch `feature/spine-ui-v2`).
`25` owns the Music wrap; `24` owns the wordmark and the coil; `23` owns the
entrance redesign and the Range server; `19` owns the navigator architecture.
The plain `HANDOFF 1`–`19` series documents the dormant production site on
`main` and is background reading only.

---

## The one-line version

**The jump defect is fixed, and it was never where 25 said it was.** The cause
was the carousel's own animation loop following the tracks it passed over. A
**second, undiagnosed defect** was found in the same area — one Escape anywhere
on the page left the play button inert. Both are fixed in
`js/track-experience.js`. The navigator is unnumbered, the Music wrap's CSS is
now a shared file, **the entrance, the navigator and Music are one page**, and
**the reading cards are liquid glass** — a painted bevel everywhere, real
displacement of the star field where the browser can run it. **The site footer
was rebuilt** on all five production pages. `main` was not touched, but the
production PAGES were — see Git state.

---

## Corrections to earlier handoffs

- **25'S CAUSE FOR THE PAUSED-AFTER-JUMP DEFECT WAS WRONG.** It proposed
  ordering: "`setFocus` rebuilds the panel and `wireSamplePlayer()` hands it a
  fresh `Audio()`, so `playSample()` appears to act before the element it needs
  exists." `wireSamplePlayer()` is called **synchronously** inside
  `updatePanel` inside `setFocus` (`js:694`), so `currentSample` is fully built
  one line before `playSample()` reads it. Ordering was never the problem.

- **25 CALLED THE ESCAPE BINDING A HAPPY ACCIDENT. IT WAS A BUG.** It recorded
  that `track-experience.js:252`'s unguarded document-level
  `Escape → stopSample()` "fires alongside it and produces exactly the wanted
  behaviour by accident — that is why the module needs no edit." It also set
  `currentSample = null`, which left the player inert. See defect 2.

- **25's "DO NOT RE-TRY THE OBVIOUS FIX" WAS GOOD ADVICE AND IT WAS FOLLOWED.**
  The 140ms play-button nudge is still not in the code and is still the wrong
  fix. It papered over a defect in the shared module.

- **THE DEFECT WAS NEVER MUSIC-SPECIFIC.** `js/track-experience.js` is the
  carousel `index.html` also uses. Every side-card click there had the same
  behaviour.

- **THIS HANDOFF'S OWN "VERIFIED BOTH SIDES" WAS INSUFFICIENT, AND THE BEVEL
  SHIPPED LIT ON THE WRONG EDGE FOR ONE COMMIT (`6830c36`).** The check read
  border colours and the value of `--lit-x`, and both were correct. What it
  never checked was **where the light actually landed**. `box-shadow: inset`
  with a positive offset-x casts its band along the LEFT inner edge — the
  opposite sign from what a gradient position needs — so the sheen lit the
  spine side while every bevel band lit the far side. Fixed in `010bffc` with a
  second variable, `--lit-sx`, and re-verified by **sampling pixel brightness**
  rather than by reading computed style. **The owner saw the symptom before any
  check did**; the word was "wonky".

---

## Git state

- Branch `feature/spine-ui-v2`, worktree
  `C:\Users\Haight\Desktop\kundalini-spines-spine-ui`.
- Session start `bf71782`; **23 commits**, ending **`bd0cbde`**, working tree
  clean. Highlights: `41f6f8b` the two carousel fixes · `efe8812` the full
  stack · `cba3921` the glass lab · `9a5aa35` the thumbnails · `6830c36` the
  glass port · `010bffc` the four card fixes · `0a8babe` the field lab ·
  `23ee82a` FUSION · `3767fc8` the site footer · `f36a929` CALIBRATION ·
  `f700aa0` the var() bug · `18aea69` the tuner.
- **THE PRODUCTION PAGES ARE NO LONGER BYTE-IDENTICAL TO `main`.** `index`,
  `about`, `archive`, `transmissions` and `transmissions/001` each gained one
  stylesheet link and two script tags for the footer, and `css/spine-bg.css`
  gained `--spine-on: 0` on `html.page-about`. This is the first session to
  touch them. `main` itself is still `13083d9` and no PR was opened.
- `main` = `origin/main` = **`13083d9`**, untouched. No PR opened.
- **`js/track-experience.js` and `css/spine-ui.css` WERE modified**, which
  breaks 25's "zero production files modified" streak. That was a constraint of
  the Music wrap's build, not a permanent rule, and both defects below live
  inside those files. `js/spine-bg.js` is still untouched.

---

## DEFECT 1 — the jump that landed paused. FIXED.

**Cause.** `render()` ends with
`if (nearestIdx !== focusedIndex) setFocus(nearestIdx, false)`
(`track-experience.js:572`). That line exists to follow a card drifting under
the centre during a **drag**. It cannot tell a drag from an animated snap. A
click on a side card runs `setFocus(idx, true); playSample()` — focus, panel
and audio are all correct on the first frame — and then the carousel **glides**
to the card. For every frame of that glide the nearest card to the centre is
one of the tracks in between, so each one re-entered
`setFocus → updatePanel → stopSample() + wireSamplePlayer(fresh Audio)`.
The sample that had just started was paused ~10ms later and thrown away, and
the panel arrived at the right track holding an element nobody ever played.

**The probe that settled it.** `ks:sample-ready` is dispatched once per
`wireSamplePlayer()` call (`js:885`), so counting it measures panel rewires
directly. Measured Aug 11 2026 on a short jump, 23 → 24:

| t | event | counter | playing |
|---|---|---|---|
| 1ms | rewire — The Great Work (destination) | 24 | |
| 28ms | | | **true** |
| 38ms | rewire — **Heavyweight** (the track we left) | **23** | **false** |
| 246ms | rewire — The Great Work again | 24 | never plays |

**Fix.** A `snapping` flag, set by `setFocus(i, true)`, cleared when the glide
settles and on `pointerdown` so a hand on the carousel still outranks a snap in
flight. The follow-line is guarded on it.

**Measured after:**

| | before | after |
|---|---|---|
| jump across 8 tracks | 8 rewires, paused | **1 rewire, playing** |
| jump 1 card | 3 rewires, paused | **1 rewire, playing** |
| drag still follows the centre | — | **yes**, counter tracked |

---

## DEFECT 2 — one Escape killed the play button. FIXED.

**Found while verifying defect 1**, because the verification pressed Escape
before opening Music and Music opened silently.

`stopSample()` set `currentSample = null` (`js:913`). `playSample()` and
`toggleSample()` both bail on `!currentSample`, and only `updatePanel()`
rebuilds it — which needs a **track change**. Since `js:252` binds
`Escape → stopSample()` unguarded at document level, one Escape anywhere on the
page left the play button inert until you changed track.

| | plays on open? |
|---|---|
| clean open | yes |
| open after Escape with a card open | **no** |
| open after a **bare** Escape, nothing open | **no** |

**Fix.** `stopSample()` keeps `currentSample`. It still pauses, rewinds, resets
the fill and the status. The nulling was never load-bearing: `updatePanel()`
calls `stopSample()` and then immediately hands the field a fresh element, and
the no-`sampleUrl` branch nulls it explicitly on its own. All three rows above
now play.

---

## What else shipped

1. **The navigator is unnumbered.** `js/spine-ui.js` no longer emits
   `<span class="idx">` into node labels — `MUSIC`, `OUR STORY`,
   `THE MESSENGERS` rather than `01 MUSIC`. `NODES` **keeps** `idx` because
   `populateCard()` still reads it for the reading card's `02 / 06`, verified
   still correct. `css/spine-ui.css`'s `.idx` rule became
   `display: none` as a backstop so numbering can only return by deliberate
   edit. **No retune was needed**, unlike the rail: left-side labels are
   right-anchored so their visible end did not move, and right-side labels
   simply start tighter to the node.

2. **`css/music-wrap.css` — an extraction, not a rewrite.** 400 lines of inline
   `<style>` out of `music-lab.html`, every comment intact, nothing retuned.
   Both hosts link it. `music-lab.html` went 572 → 187 lines and keeps only its
   own page furniture.

3. **The full stack in one page** (open item 4). `entrance-lab.html` carries
   Music. `page-home` joins `page-entrance` on `<html>`; the three stylesheets
   and three scripts are added in the order `music-lab.html` uses; the Music
   markup is static so `spine-bg.js:183`'s one-shot query finds it.

4. **The entrance's sky pins came out**, as the note in their place instructed.

5. **A `#music` deep link skips the entrance** — `settle(true)` then `hand()`.
   Without it Music opened *underneath* the entrance layer.

6. **Index thumbnails.** 28 covers at 448px webp in `assets/music/thumbs/`,
   under the same filenames so the wiring is a pure prefix swap. **10.1 MiB →
   1.1 MiB, 89.1%.** Only the index uses them; the carousel still, the hero
   preload and the release card keep full size — a 448px file in the 490×490
   hero would be visibly soft. Verified by **decoding all 28**, not by trusting
   an exit code: 28/28 valid 448×448, none zero-byte, truncated or missing,
   originals byte-identical.

7. **`spine-ui-wire.webp`** is now what `css/spine-ui.css` loads. 626 KB → 256
   KB. The png stays on disk. The image is two RGB colours over a soft alpha
   mask, so RGB `quality` is nearly inert and `alpha_quality` is the real dial;
   75 is the last step before the low-alpha glow bands into visible blotches.

8. **`spine-card-glass-lab.html`** — eight readings of liquid glass, one of
   them (FROST) deliberately the current card so the boundary stays visible.
   Kept, like `music-collapse-lab.html`.

9. **The glass port** — see the section below.

10. **`spine-field-lab.html` + `css/field/` + `js/field/`** — six readings of
    "fill the empty space", awaiting the owner's pick. See its section below.

---

## THE READING CARDS ARE GLASS

The owner asked for liquid glass and pointed at an Apple-Tahoe React component
(SVG `feDisplacementMap` + WebGL). **Two facts settled it before any code:**

- **This is not a React project.** No `package.json`, no `node_modules`, no
  TypeScript, Tailwind, shadcn or build step. Every instruction in that
  component — shadcn CLI, `/components/ui`, `@/lib/utils`, `cn()` — had no
  target. The **technique** was ported; the component was not.
- **That component never refracts the page behind it.** `feDisplacementMap`
  cannot reach a live DOM backdrop. It draws its own `bgImage` inside its
  viewport and displaces the copy — it only looks like refraction because it
  owns its background. These cards float over a reactive star field. There is
  no `bgImage` to give it.

**Settled by looking at eight readings, not by argument:**

| | |
|---|---|
| Reading | LENS, **softened on port** — one lit lip and two soft falls, no hard dark bands |
| Default | **REFRACT** — real displacement, added by `@supports` |
| Fallback | **LENS** — the painted bevel, which every browser gets |
| Light source | **THE SPINE**, not a viewport lamp |
| Surface | reading cards only; the Music panel keeps no plate |
| Cost | no idle rAF; a static filter with a fixed `feTurbulence` seed |
| Dials | `--glass-rim`, `--glass-sheen`, `--glass-sheen-y`, `--glass-chroma`, `--glass-dark` |

**THE LIGHT IS THE SPINE and that is the whole reason this belongs to the
project.** The column is the lit object — the energy pass runs up it, the nodes
ping — so a card catches light on the edge **nearest the column**. `--lit-x` is
−1 or +1 off the side class and every inset multiplies by it, so a card cannot
come out half-lit the wrong way.

**INJECTED FROM `js/spine-ui.js`, not written into markup.** Five pages carry
the `.spine-card` block; hand-adding a span to all five is five chances to miss
one. The module already owns the card's contents. `::before` and `::after` were
both unavailable — the stacked ghost frames use them.

**TWO SIGNS, AND THEY ARE OPPOSITE.** `--lit-x` is a POSITION multiplier for
gradient centres (`at calc(50% + var(--lit-x) * 50%)`), where light-from-left
is −1. `--lit-sx` is its negation and is the only thing `box-shadow: inset`
offsets may use, because a positive offset-x casts along the LEFT inner edge.
Mixing them is not a subtle bug — it lights the wrong edge of the card — and it
is invisible to any check that reads computed values instead of pixels.

**WHAT THE LAB SHIPPED AND WHAT THE CARD SHIPPED ARE NOT IDENTICAL.** LENS in
`spine-card-glass-lab.html` carries a solid `rgba(0,0,0,0.65)` line between two
lips, which is what makes a bevel read as thick on a large flat sample. On the
real 400px card, with body copy starting 24px in, the owner read it as *"a
blackish gray strip on the inside of the card"* — correctly; at that size it is
a stripe beside the text, not a bevel. It and the hard far-edge band were both
dropped on port. **The lab is not wrong, the sample size is different**; do not
"restore" the lab version to the card.

---

## THE FIELD LAB — six readings, and a decision waiting

**The problem, in the owner's words:** the spine is the centrepiece and the star
field is the background, but with no card open the screen reads as **empty** —
the left and right thirds of a 1440×900 stage carry nothing.

**THE OWNER'S IDEA WAS KEPT AND ITS SUBJECT CHANGED.** They proposed setting the
wordmark in huge thin-line type behind the spine, using the spine itself as a
letterform, revealed on mouseover. Reveal-on-approach is exactly right — the
entrance headline is literally *"Knowledge Hidden in Plain Sight"*, so hiding
something until the reader finds it is the brand thesis enacted rather than
decoration. Two things about the execution were not:

1. The wordmark plays at full size in the entrance about four seconds earlier.
   Restating it is a film putting its title card up twice.
2. For the spine to be a letter **and** stay centred, the word must break
   asymmetrically — `KUNDALIN|I|` is six letters left and two right — against a
   layout that is otherwise rigorously centred.

So the graphic move survives as CROP and the subject becomes **the chakra
system**: it fills the same space, it is thematically exact for a project called
Kundalini Spines, and it does the one thing the wordmark cannot — **it gives the
visitor a key.** Today they see a beautiful diagram with no legend.

**Six readings, each a different theory of *why* it feels empty**, plus NONE as
the control — kept for the same reason the collapse lab keeps GHOST and the
glass lab keeps FROST: *"it was already fine"* has to stay available as an
answer.

| reading | theory | what it does |
|---|---|---|
| NONE | — | the control, exactly as it ships |
| PLATE | it lacks **structure** | leader lines to margin callouts; Metatron web; corner brackets; a `FIG. I` edge caption |
| GRATICULE | it lacks **measurement** | targeting overlay, edge tick rules, ordinate, frequencies only — it never names anything |
| HALO | it lacks **company**, not marks | name left / Hz right at true heights over a seed-of-life; the most restrained |
| MANDALA | it wants to be a **diagram** | a 13-circle Metatron centred on the **heart**, the seven registered on its rim |
| CROP | it lacks **graphic weight** | enormous cropped outline type, alternating sides, revealed by a pointer torch |
| READOUT | it lacks **density** | instrument columns as texture, every value real repo data |

**THE MODULE CONTRACT is what lets six coexist in one page.** Each registers
`window.__field.<name>` with `mount(root)` / `unmount(root)` and **scopes every
CSS rule under its own `html.v-<name>`**. The host owns `#field` (absolute,
`z-index: 1` — under `.spine` at 10 and everything above it, `pointer-events:
none`), mirrors the stage's `is-card` onto `<html>`, and calls mount/unmount on
switch. All seven share one chakra dataset so they are directly comparable.

**Built by five agents in parallel, and every one of them built BLIND** — none
was permitted to launch a browser, because concurrent Chrome launches lag this
box and one was needed for rendering. That is the single most important caveat
on the whole set: **every alpha value is a first guess against a star field
nobody could see.** Each module exposes its dials as named custom properties at
the top of its CSS.

**A NOTE FOR WHOEVER JUDGES THESE.** The lab's own control panel is fixed at
top-left, ~190px wide, z-index 90, over a field at z-index 1 — it covers the
top-left corner of *every* reading. Hide it (`.lab-ctl { display: none }`)
before screenshotting or PLATE's registration bracket, GRATICULE's ordinate and
READOUT's entire first column get judged on half of themselves.

---

## THE SITE FOOTER — expression one of two

The owner asked for READOUT's information and HALO's circles combined, the
circles redone as the circle of life carrying the chakra names and Hz, and the
result used as **a real site footer with working links**. Settled through a
structured interview as **one system stated twice**: this footer, and
CALIBRATION on the navigator.

**IT UPGRADES, IT DOES NOT INJECT.** The five pages already carried a footer
with real hrefs. `js/site-footer.js` **moves** those anchor nodes into a richer
structure — moves, not clones, so there is exactly one copy of every link in
the document and the one on screen is the one a crawler read. If the script
never runs, today's footer renders untouched. That is what let a single shared
file be chosen without paying for it in SEO.

| | |
|---|---|
| Where | the five scrolling production pages; **not** the navigator, which has no end to arrive at |
| Height | ~480–560px. A footer that ends a page, not a second immersive scene |
| Tier 1 | four link columns — identity · navigate · listen · contact |
| Tier 2 | a separate instrument band, beside the links and never around them |
| Base | `KUNDALINI SPINES` in cropped outline type |
| Substrate | Seed of Life — **seven** circles, one per centre, one-to-one |
| Dead links | render `STANDBY` with the anchor removed entirely |

**Links first was a deliberate rejection of the better-looking option.** Weaving
them into the instrument blocks reads richer and hides the navigation inside a
texture. A footer whose links are hard to find has failed at its only job.

**Seed, not Flower.** Seven circles for seven centres. The flower is nineteen
and twelve would carry nothing, which makes the correspondence decorative.

**The torch is a gradient, not a mask** — the owner's read of the reference
video. The wordmark's *stroke* is a radialGradient whose centre is the cursor;
falloff is desaturation rather than dimming, so the letterforms never change
weight and only the colour temperature travels. Its centre is **clamped to the
rule** separating navigate/listen/contact from record/geometry/calibration, so
the light is always overhead and grazes the caps — a shine, not a lamp. At rest
it parks a full radius clear of the letters, so the effect is something the
reader causes.

**A tuner lives at `/?tune`** — the same gate `js/spine-bg.js` uses. Three
sliders (size, height above rule, brightness), persisted to localStorage,
bottom-**left** because the spine tuner already owns the right. Settled values:
`r: 530, ceilBias: 0, core: 0.12`.

---

## CALIBRATION — expression two

Reading 9 in `spine-field-lab.html`. READOUT's four instrument columns over a
Seed of Life. **Not READOUT + HALO**: composing those would have put two
labellings of the same seven centres on screen, which FUSION had already proved
a composition cannot afford.

**THE SEED CARRIES NO LABELS, and that is the interesting decision.** It began
with all seven named on their circle centres, revealed by a small torch. The
marks were drawn in `--node-color` — the navigator's own amber — so seven
glowing dots sat on a stage with six clickable nodes and read as seven more
things to click. Three placements were built to move them out of the pointer's
path (offset label + leader, whole figure off-axis, node-aware suppression) and
**all three worked and all three missed the point**: any mark in that palette,
anywhere on that stage, competes with the navigation for the same meaning. The
owner's call was to remove the dots and text outright.

The seven now live in READOUT's own calibration ladder — which this module had
been *suppressing*. Restoring it was the load-bearing half of that change:
stripping the seed without it would have deleted the seven from the reading
entirely.

---

## Measured findings

All Aug 11 2026 via Playwright against `scripts/serve.py`, 1440×900.

1. **The sky answers on the entrance page.** `--kick` peaked **0.556**,
   `--snare` **0.726** over a real sample, measured on `entrance-lab.html`
   itself rather than inferred from `music-lab.html`.
2. **`--spine-on` resolves 0** there, so the reactive column stays off while
   the sky stays on — the split `page-home` exists to make.
3. **The rail survived the CSS extraction unchanged** — seven nodes, all at
   x=49, `--rail-gutter` 282px, labels `CLOSE · PURCHASE RISE UP · INDEX ·
   DECODE · SHUFFLE · SHARE · SKY`.
4. **Zero failed network requests** on `entrance-lab.html` (including opening
   INDEX), on `music-lab.html`, and on the deep link. One 404 appeared in an
   earlier run and does not reproduce on any page; it coincided with the
   thumbnail files being rewritten underneath that run.
5. **Zero console errors** on every page and path exercised.
6. **GitHub Pages answers Range** — `206 Partial Content` with `Content-Range`,
   and `Accept-Ranges: bytes` on the plain `200`, which is the header
   `scripts/serve.py` identifies as the one Chrome reads for `seekable`. See
   the caveat under "Verified vs asserted".
7. **Chrome 151 accepts `backdrop-filter: url(#x)`.** `CSS.supports()` returns
   true and the computed value survives as `url("#x")`. This is what makes
   REFRACT possible at all, and it is the whole basis of the `@supports` split.
8. **The glass reaches every host with no edit of its own.** `music-lab`,
   `spine-lab` and `music-collapse-lab` each resolve exactly one
   `.spine-card__glass` and one `#spine-lens-filter`, zero errors.
9. **THE ENCODE WAS NEVER SLOW — IT WAS DEADLOCKED.** Three passes ended up
   writing the same 28 thumbnails at once and blocked on Windows file locks:
   ~30 minutes at **1.25s / 0.9s / 0.05s of CPU burned**, i.e. no progress at
   near-zero CPU, which reads exactly like a slow job and is not one. Cleared
   to a single writer and parallelised over the box's **24 cores**, the whole
   set encodes in **0.79s**. There is no GPU path — libwebp is CPU-only and
   NVENC does video codecs, not stills. The fix was concurrency, not hardware.
   **Diagnose a "slow" job by looking at CPU before waiting on it.**
10. **THE LIT EDGE, MEASURED IN PIXELS.** Mean luminance of an 8px column just
    inside each border, sampled across the card's middle where the head row
    cannot interfere:

    | card | left edge | right edge | lit |
    |---|---|---|---|
    | side-right (spine on left) | **164.4** | 6.0 | left ✓ |
    | side-left (spine on right) | 8.8 | **175.3** | right ✓ |

    This is the check that should have existed at port time. A computed-style
    read of `--lit-x` and the border colours passed while the bevel was lit on
    the wrong edge; a screenshot at 3× device scale showed it in one look.
11. **All six field modules comply, checked rather than trusted.** Every rule
    scoped under its own `html.v-*`; both recede rules present; **clicks pass
    through to the spine nodes in all six**; zero console errors.
12. **NO IDLE LOOPS SURVIVED THE PARALLEL BUILD.** The one
    `requestAnimationFrame` in the set (READOUT) is a **coalescing** call
    guarded by a `pending` flag — one frame per burst of pointer movement,
    never re-arming — and MANDALA's `setTimeout` is a resize debounce. An idle
    page still schedules nothing, which is the property 25's finding 3 measured
    at 0.00/s.
13. **A PROBE THAT READ THE WRONG ELEMENT.** Four modules appeared not to
    recede under `is-card`, reading `opacity: 1`. They were right and the check
    was wrong: they dim an INNER wrapper (`.pl`, `.gr`, `.crop`, `.ro`) rather
    than `#field`, which is the better implementation — it keeps a
    raster-forcing opacity off a full-viewport container. **Second time this
    session a check measured the wrong thing and blamed the code** (the first
    was the inverted bevel). Both times the code was correct.
14. **`var()` DOES NOT WORK IN SVG PRESENTATION ATTRIBUTES, and it fails
    silently.** `stop-color="rgba(var(--node-color), 0.72)"` parses, sets, and
    **computes to `rgb(0, 0, 0)`** — opaque black. Custom properties are
    substituted only in CSS declarations; a presentation attribute is not one.
    Nothing errors, nothing warns, and the attribute reads back exactly as
    written, so it is invisible to any check that inspects the DOM instead of
    the computed style.

    It shipped in the footer's wordmark and the symptom was exact: the core's
    50% stop is the middle of the word, so **the one part designed to be
    brightest rendered as the darkest thing on the page.** The owner reported
    "I-N-I is still dark" and was describing pure black. Two of the torch's five
    stops had it too. Now resolved once into a literal triplet.

    **The expensive part was not the bug, it was the response to it.** Across
    several rounds the effect looked weak at every setting and I raised other
    values to compensate — core 0.60 -> 0.92, stroke 1.25 -> 1.6, radius
    400 -> 520. All of that was tuning around a black stop. **When a value looks
    wrong at every setting, check what it COMPUTES to before turning the dial
    again.** Checked the rest of the codebase: no other file writes `var()` into
    an SVG attribute.
15. **The spine column is OFF on every page carrying the footer, and that is
    not deducible from the stylesheets.** Only `index.html` and `about.html`
    load `js/spine-bg.js` at all — `archive.html` and `transmissions.html` link
    the CSS but never run the script, and `transmissions/001.html` has neither.
    Both pages that do run it are switched off: `html.page-home` since
    2026-08-06, `html.page-about` as of this session. I wrote the opposite in a
    comment and had to correct it within the hour.

---

## Do not do these

Everything in 19–25's lists still stands, **except** 25's claim that the
Escape binding needs no edit. Additionally:

- **Do not restore `currentSample = null` in `stopSample()`.** It looks like
  tidy cleanup. It is defect 2.
- **Do not remove the `snapping` guard in `render()`** without re-reading
  defect 1. It looks like it suppresses the carousel following a drag. It does
  not — `pointerdown` clears it.
- **Do not pin `--kick-stars` / `--kick-cloud` / `--snare-bolt` to 0** on any
  page that loads `js/spine-bg.js`. `star-bg.css` owns them (0/1/1).
- **Do not put Music's CSS back inline.** Two hosts share
  `css/music-wrap.css` now.
- **Do not renumber the rail or the navigator.** Both are deliberate; the
  reading card's `02 / 06` is the one place numbering is still correct.
- **Do not use a negative spread on the glass LIP.** `inset Xpx 0 0 0` paints a
  BAND; a negative spread eats it back to a hairline. The first lab pass did
  exactly that and every reading was invisible, including against FROST. The
  two FALLS do carry negative spread — that is what makes them falls.
- **Do not put `--lit-x` in a `box-shadow` offset.** Shadow space uses
  `--lit-sx`, its negation. Getting this wrong lights the wrong edge of the
  card and no computed-style check will catch it.
- **Do not restore the lab's LENS dark line to the card.** It reads as bevel
  thickness at lab scale and as a stripe beside the body copy at card scale.
- **Do not move `--glass-sheen-y` back to 0%.** It is a legibility number, not
  a taste one — at 0% the wash sits on the lit top corner, which is where the
  head row lives, and washes `02 / 06`, `ACTIVE` and the close glyph out.
- **Do not give `.spine-card__close` `position: relative`.** It is already
  absolute and would drop out of its corner; it needs the `z-index` only.
- **Do not try the rim-band displacement again without reading the EDGE note.**
  `backdrop-filter` samples everything painted beneath the element, so a ring
  INSIDE the card displaces the card's own fill and smears it. It needs the
  card made transparent and its fill moved above the ring.
- **Do not run two passes that write the same files.** See finding 9.
- **Do not put `var()` in an SVG presentation attribute.** It computes to black
  and warns about nothing. See finding 14. Resolve the custom property to a
  literal in JS first.
- **Do not park the footer's torch at a fixed distance.** Its radius is tunable
  at `/?tune`; a constant park slides back into range as the size goes up and
  the effect switches itself on at some slider position, which reads as a bug
  in the slider. It is derived as `-(r + 80)`.
- **Do not scale the core gradient's shoulders with its centre.** The neutral
  ends are what the centre is bright against; moving both keeps the contrast
  constant and makes the brightness dial appear dead.
- **Do not re-suppress READOUT's calibration ladder** unless something else has
  taken over stating the seven. CALIBRATION hid it once and removing the seed's
  labels without restoring it would have deleted the chakras from the reading.
- **Do not put a second tuning panel bottom-right.** `js/spine-bg.js` owns that
  corner at `/?tune`.
- **Do not let a field module drop its `html.v-<name>` scope.** Six variants
  share one page and one `#field`; an unscoped rule bleeds into the other five
  and quietly ruins the comparison rather than failing loudly.
- **Do not put the recede `opacity` on `#field` itself.** It is full-viewport;
  an `opacity < 1` there forces exactly the intermediate raster this project
  measured at 612 against 1087. Dim an inner wrapper, as all six do.
- **Do not "improve" GRATICULE by adding the chakra names back.** Its author
  left a note asking for this explicitly: PLATE explains and GRATICULE
  measures, and merging them leaves the comparison with nothing to decide.
- **Do not tune a field module's geometry around the lab's control panel.**
  That is furniture which does not ship; hide it and judge the reading.

---

## Verified vs. asserted

**Verified by tooling, and looked at:**
- Both defects, before and after, by event counting rather than by inspection.
- The full stack end to end: entrance → navigator → Music → jump → close.
- Deep link landing in Music with the entrance at `display: none`.
- `music-lab.html` re-verified after the CSS extraction.
- The navigator unnumbered, the reading card still `02 / 06`.
- Thumbnails serving from `assets/music/thumbs/`, 28 cells, 0 broken images,
  natural size 448×448.
- The glass on both sides, **in pixels** (finding 10) — not in computed values,
  which passed while the bevel was inverted. `.spine-card__close` still
  `position: absolute` after the z-index lift.
- The three things the owner named after seeing it on a real page: the ghost
  frames tightened, the `×` legible and clear of the `ACTIVE` flag, the dark
  strip gone. All three were visible only on the card, not in the lab.
- Screenshots taken and **actually looked at** at every stage. **They caught a
  bug every automated assertion passed:** the specular wash was centred at 0%,
  the lit top corner, which is exactly where the head row lives — it washed
  `02 / 06`, the `ACTIVE` chip and the close glyph out to nearly illegible on
  right-lit cards. `--glass-sheen-y: 32%` moves it onto the title and body.
  **That is the third time this project has been saved by looking at a
  picture** (25's finding 5 was the first two).

**Asserted / NOT verified:**
- **Production Range support is answered BY PROXY.** GitHub Pages was measured
  on a live Pages-served binary, not on this project's own URL, because
  **nothing is deployed**: Pages is disabled and `kundalinispines.com` still
  points at Namecheap parking. Re-verify against a real asset on first deploy.
- **SAFARI AND FIREFOX FALLING BACK CLEANLY IS REASONED, NOT SEEN.** Chrome 151
  was measured. There is no other browser on this box, so "they drop `url()`
  and keep the painted bevel" is an inference from spec support, not an
  observation. **Check it on a real device before this reaches production** —
  it is the one assumption the whole `@supports` split rests on.
- **The glass filter's cost is unmeasured.** It is static (fixed `feTurbulence`
  seed, nothing re-renders it) so there is no per-frame work, but it was never
  profiled against the project's standing raster rules.
- **EVERY FIELD MODULE WAS BUILT BLIND.** No agent could open a browser, so
  every alpha, every type size and every geometry placement is a first guess
  against a star field none of them could see. They render, they comply, and
  they are internally reasoned — but **none of the aesthetic values has been
  tuned against what is actually on screen.** Treat the six as sketches at
  full fidelity, not as finished work.
- **CROP's torch cost is reasoned, not profiled.** Its author restricted the
  mask to a 640×640 lens (0.41 Mpx against 1.30 for a naive full-field mask)
  precisely because a full-viewport masked layer is the raster-forcing shape
  this project forbids — but no measurement was taken.
- **The footer's values are settled against BLACK, not against a lit column.**
  Every page carrying it currently has the spine off (finding 15). If it is
  ever turned back on under this footer, re-check them — and fix any collision
  with LAYOUT rather than a scrim, which `css/spine-bg.css` rules out in
  writing.
- **Two footer values may still be compensating for the `var()` bug.** The
  stroke weight (1.25 -> 1.6 -> 1.35) and the torch radius (400 -> 520 -> 530)
  were both raised while the gradient's warm stops were rendering black. The
  core was re-judged afterwards and came down to 0.12; these two were not.
- **The footer has not been seen below 1440×900** either, though it carries
  media queries at 1000px and 640px that were reasoned, not rendered.
- **Nothing in the field lab has been seen below 1440×900**, and several
  modules carry media queries (READOUT drops its inner ladders below 1180px)
  that were reasoned from fixed-px geometry and never rendered.
- **No mobile pass.** Nothing was run below 1440×900. The glass has never been
  seen at 375px, where `--card-w` clamps to 280 and the 26px bevel bands are a
  much larger share of the card.
- **`prefers-reduced-motion` still coded and not tested** on either page. The
  glass needs no rule — it does not move.
- **The entrance's own sequence was not re-timed** after Music was added. The
  handoff was driven programmatically in verification, not by watching ENTER.

---

## Still open

1. **Confirm the glass fallback in Safari and Firefox.** Cheap, and the whole
   `@supports` split rests on it. Top of the list because it is the only
   untested assumption now shipping on every page.
2. **Mobile** — the entrance headline breaks at 375px (24's item 1); Music has
   never been run there, and neither has the glass.
3. **PICK A FIELD READING.** **Nine** are built and waiting in
   `spine-field-lab.html`; number keys 1–7 switch. Judge them with the lab
   panel hidden. **CROP must be seen in motion** — a screenshot cannot show a
   pointer torch. Once picked, the winner ports into `css/spine-ui.css` the way
   the glass did, and its alphas get tuned against the real sky for the first
   time. Two hybrids already exist: **FUSION** (PLATE's callouts over MANDALA's
   geometry, key 8) and **CALIBRATION** (READOUT over a Seed of Life, key 9).
   Both were built with eyes on them, unlike the original six.
4. **What PURCHASE should actually do.** Still a toast. `links.download` is
   null on all 28 and the "$1" is hardcoded at `track-experience.js:804`.
   Needs a decision: Bandcamp/Gumroad, Stripe, or email capture.
5. **The metadata + controls redesign.** 25's finding 15 is its spec.
6. **Deploy.** Pages is disabled and DNS is unset — the single blocker on
   anything being reachable, and now the blocker on closing Range for real.
7. **Profile the glass filter** against the standing raster rules. Static, so
   there is no per-frame work, but it has never been measured.
8. **The EDGE hybrid**, if rim-only refraction is ever wanted: it needs
   `.spine-card` made transparent and its fill moved above the ring, because
   `backdrop-filter` samples the parent's own paint. The reading is kept in
   `spine-card-glass-lab.html` with the smear intact so the obstacle is visible.
9. **`assets/messengers/*.jpg` → webp**, 331 → 208 KB. Keep the `.jpg` for
   `transmissions/001.html`'s `og:image`; social scrapers are the one place a
   JPEG fallback still earns its keep. Both files are 928×1152 but every `<img>`
   declares `width="1200" height="1500"` — same ratio, wrong numbers.
10. **Layer 2 and 5 of the Range plan.**
11. **Tuner integration, Archive wrap** — unchanged from 19.

**A NOTE ON METHOD, since it happened three times this session.** The sheen
bug, the inverted bevel and all three of the owner's card notes were caught by
looking at a picture, and passed every automated assertion. 25's finding 5 said
the same thing. **Assertions confirm what you thought to ask; screenshots show
what you did not.** Budget for both.

**Closed since 25:** the paused-after-jump defect; the Escape/player defect
found alongside it; navigator numbering; the Music CSS duplication; the
entrance integration (open since 19); index cover weight; the wire png; Range
support, answered by proxy; the reading cards' glass treatment; and the site
footer, which was never on any open list because nobody had asked for it yet.

---

## Housekeeping

`scripts/serve.py` remains the serving command — **not `python -m
http.server`**. Playwright (Python) is the verification tool; the recipe is in
`.claude/skills/kundalini-session-start/SKILL.md`. Every lab and both tuning
scripts are tracked in git and none were removed this session.

---

## Starting the next V2 chat

Attach this file (`V2HANDOFF 26.md`). `25` owns the Music wrap; `24` the
wordmark and coil; `23` the entrance and the Range server; `19` the navigator.
The new session needs folder access to
`C:\Users\Haight\Desktop\kundalini-spines-spine-ui` (the V2 worktree, **not**
production `kundalini-spines`) and should confirm `feature/spine-ui-v2` before
editing.

A good opening message:

> Here's the latest V2 handoff for Kundalini Spines (Spine UI V2 branch). The
> full stack runs in entrance-lab.html, the reading cards are glass, and the
> site footer was rebuilt on all five production pages. Nothing has been run
> below 1440×900 and the glass fallback has never been seen outside Chrome —
> start there.
