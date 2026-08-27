# Kundalini Spines — Spine UI V2 Handoff 47

**Date:** August 26, 2026

Twenty-ninth handoff of the **Spine UI V2** track (branch `feature/spine-ui-v2`).
`46` owns the two-sided snare gate and the owner's retune; `45` owns the album
masthead; `44` owns the deep-field deep-link fix. The plain `HANDOFF 1`–`19`
series documents the dormant production site on `main`.

---

## The one-line version

**The reactive sky never knew anything about playback — the swap at Music was a
coincidence of scroll geometry that had been read as a feature for nine
handoffs. `--df-hold-play` makes it real: a playing sample holds the sky
wherever you scroll to, released when it stops. It is build 12, it has a slider,
and the open item it closes was about 80% already shipped, which nobody had
noticed because the item's own wording was wrong.**

---

## Corrections to earlier handoffs

- **46's open item 1 is closed.** The owner loaded the home page, watched the
  retuned lightning and likes it. That is their judgement and it is the right
  kind of evidence for the question — no measurement was needed or taken.

- **46's open item 3 is closed, and its guess was right.** 46 asserted from
  commit messages that the five undocumented Aug 23 commits closed 45's items
  11, 6, 17 and 4. **This session checked the actual diffs**, and all four hold:
  `82dbb72` renames exactly the three PNGs item 11 names, `d747702` is
  `connect.html`'s stale comment, `90c76e1` is the clipped carousel, and
  `f555798` **names "item 17 as written" in its own comment** and goes past it
  to repair both scrims. `ff7bc76` is 44's deep-field work and was never on 45's
  list. Nothing survives from that item.

- **HANDOFF 38's wording of the playback-gating item was wrong in two ways, and
  every handoff from 39 to 46 carried it forward verbatim.** It read: *"Phase two
  of the Music handoff — the playback gating 37 described, where a playing track
  holds the sky. All four hooks exist (`is-spine-pulsing`, `is-spine-kicking`,
  `--kick`/`--snare`, `ks:sample-ready`) and none is used yet."*

  1. **"None is used yet" was false**, and had been for several builds.
     `is-spine-pulsing` drives `--star-twinkle-amp` and `--star-cloud-amp`
     (`css/star-bg.css:450`), `is-spine-kicking` drives the kick response and
     the deep-field bolts, `--kick`/`--snare` are written per frame, and
     `ks:sample-ready` is the rebind path 46 fixed.
  2. **37's actual specification was already satisfied.** 37 asked for *"the
     stop-and-swap to the reactive background when a carousel card plays music,
     resuming the scrub on scroll out."* Measured this session: the swap
     happens, and the scrub does resume on scroll out, at 900ms. Both halves.

  What was genuinely missing was only 38's **stronger** reading — "a playing
  track holds the sky" — which is what this session built. **Read the two
  sentences as the conflict they are.** They are not the same feature, and
  which one you build changes the page a lot.

- **`deep-field-lab.html` does not run `js/deep-field-bg.js`'s current module**,
  despite listing the script. Measured: `--df-build` computes to empty and
  `window.__deepField` is `undefined` there. It is 37's part-1 prototype with
  its own copy. This session used it as a no-player test host and it proved
  nothing — see "Verified vs asserted".

---

## WHAT SHIPPED

### 1. `--df-hold-play` — the sky answers playback

**The measurement that framed it**, `index.html` at 1440x900, real wheel
gestures so the stepper and the clip legs actually ran:

| moment | `--df-sky` | clip | `.is-playing` |
|---|---|---|---|
| landed at Music | 1.0000 | parked | false |
| pressed play | 1.0000 | parked | **true** |
| one wheel out, +900ms | 0.0104 | **resumed** | true |
| +2600ms | **0.0000** | scrubbing | **true** |

So the sample kept playing, `js/spine-bg.js` kept writing `--kick` and `--snare`
every frame, and every one of those envelopes was multiplied by `--df-sky: 0`.
The home page runs `--spine-on: 0` (`css/spine-bg.css:664`), so the sky layers
are the **only** consumers — the detector was computing a full kick and snare
response that reached nothing.

After, same sequence: **`--df-sky` stays 1.0000 across 2.6s.**

**The mechanism is a clamp on the goal inside `tick()`**, not a write at the
call sites:

```js
var skyGoal = (playHold && T.holdPlay) ? 1 : skyT;
```

Four places set `skyT` — `boot()`, both leg branches in `stepTo()`, and
`onScroll()` — and a hold competing with each would also have to beat the
`skyLock` a leg sets precisely to keep `onScroll` out. Clamping where the value
is **consumed** beats all four for free, leaves `skyLock` untouched, and means
that when the sample ends `skyT` already carries the reader's real scroll target
so the release needs no recomputation.

`playHold` comes from a `MutationObserver` on `.track-experience`'s class —
the same element and class `js/spine-bg.js:183` watches. It deliberately does
**not** reuse the `is-spine-pulsing` flag on `<html>`: `is-spine-kicking` sits
beside it and moves every frame, so an attribute observer on `documentElement`
would wake the module on every kick.

### 2. The tuner

`--df-hold-play`, 0–1, step 1, labelled **hold**, in the Deep Field tab's
"Handoff and reveals" group beside `sky in` and `sky out`. The panel reads
`SKY IN · SKY OUT · HOLD · TITLE HOLD`. 14 tips in that tab, none containing an
apostrophe (checked by regex, not by eye — one stray apostrophe takes the whole
panel down).

**`--df-hold-play: 0` restores the pre-build-12 behaviour exactly**, and that
was measured, not assumed.

### 3. `--df-build` is a real property now

It lived in the file's header comment for eleven builds while `css/spine-bg.css`
and `css/star-bg.css` both declared theirs for real. That meant the one check
the build-number convention exists for — *is the browser running the file I just
edited, or a cached copy?* — **could not be run against the deep field at all.**
Declared in `:root`, computes to `12`, kept in step with the header.

---

## What is deliberate, so nobody fixes it

- **The clip is NOT paused while the sky holds it invisible**, even though it is
  at opacity 0 and still decoding. The legs own the video element: a leg plays
  forward to a cue and `arrive()` fires at the end of it, so pausing mid-leg
  means the arrival never lands and the sequence wedges with `skyLock` still
  set. Letting it run costs decode work nobody sees and buys a seamless release
  — the clip is already parked on the frame the scroll position calls for, so
  the sky drops onto the right picture rather than onto a seek.
- **There is no scrim over the sky.** The scrim lives inside `.df-bg`, so
  `opacity: 1 - --df-sky` removes it exactly when the sky arrives. That is
  stated at `css/deep-field-bg.css:260` and predates this session: the scrim
  exists to sit over the *footage*.
- **`--df-hold-play` ships at 1** — the owner's call on Aug 26 2026, made with
  both readings of the item described to them.

---

## How this was verified

Playwright (Python), Chrome for Testing, against `python scripts/serve.py`.
`reduced_motion="no-preference"` on the context — headless defaults to `reduce`
and the detector never attaches.

- **Computed on `index.html`:** `--df-build 12`, `--df-hold-play 1`, and
  `--df-sky-in 0.06` / `--df-sky-out 0.06` / `--df-scrim-base 0.35` unchanged
  beside them, which is what proves the comment-dense stylesheet still parses.
  `--spine-build 43`, `--star-build 29` untouched.
- **The fix**, gestured: sky holds 1.0000 for 2.6s scrolled out while playing.
- **Release**, on pause: eases 1 → 0.0482 → 0.0000.
- **Escape hatch**, `--df-hold-play: 0` mid-play: eases 1 → 0.0276 → 0.0000.
- **`home-deepfield-lab.html`** inherits build 12 and the new property, module
  runs, no errors.
- **Tuner builds**, `[tune] 49 sliders, all with hover tips`, hold slider
  present in the right group, no errors.
- **No console errors on any page tested.**
- **Both files are valid UTF-8 with no mojibake**, checked by codepoint
  inventory after the binary-mode writes (only pre-existing U+2014 and U+2192).

**Screenshots were taken and looked at** — 46 flagged the lack of them as a real
gap and this session did not repeat it. The held state at Merch shows the full
section — heading, copy, spine render, both buttons — over the reactive nebula.

**One screenshot was nearly misread, and the correction is worth keeping.** The
first held capture showed the Merch section *blank* over the nebula, which read
as "the held sky occludes page content". It does not. Measured with
`elementFromPoint` at the heading's centre: in all three states the heading is
`opacity: 1`, `visibility: visible`, no dimmed ancestors, and **is itself the
top element**. The blank shot was the reveal stagger not having fired yet.
**Do not conclude occlusion from a screenshot alone here** — the reveals are
staged and a capture can beat them.

### The one measured cost

Body copy over the nebula is worse than over the clip. Sampled the actual
painted pixels behind the Merch paragraph with the text hidden, 1440x900:

| behind the copy | under 4.5:1 | under 3:1 | 1st pct | mean |
|---|---|---|---|---|
| nebula (hold ON) | 18.0% | 8.9% | 1.24:1 | 6.85:1 |
| clip (hold OFF) | 9.8% | 0.0% | 3.59:1 | 7.89:1 |

The mean passes AA either way and the failures are sparse point-stars behind
glyph strokes, not a bright wash. **This is not a condition build 12 invented:**
copy over an unscrimmed sky already ships at Music and at Stay Connected, where
`--df-sky` is 1 by geometry. What build 12 does is extend it to Merch,
Transmissions and Archive for as long as a sample runs.

---

## Verified vs. asserted

**Verified by tooling and looked at:** everything in "How this was verified".

**Asserted, not verified:**

- **The owner likes the retuned lightning.** Their judgement, which is the right
  instrument for that question — but nobody has measured it and nobody has seen
  it on a phone.
- **The no-player branch in the observer has never executed.** It is a plain
  `if (player)` null check, and the only two pages that run this module —
  `index.html` and `home-deepfield-lab.html` — both have a `.track-experience`.
  `deep-field-lab.html` was tried as a host and turned out not to run the module
  at all. The branch is defensive and untested.
- **Nothing here has been seen below 768px.** The module gates off entirely on
  mobile and reduced motion, where `--df-sky` is pinned to 1, so the hold should
  be a no-op there — **should be. Not checked.**

---

## Do not do these

- **Do not replace the `skyGoal` clamp with writes to `skyT` at the call sites.**
  It would have to beat four writers and the leg machinery's `skyLock`, and the
  clamp is why the release needs no recomputation.
- **Do not pause the clip while the sky is held.** It wedges the leg — `arrive()`
  never fires and `skyLock` stays set. If the decode cost ever matters, the fix
  is a leg-aware pause, not a bare `vid.pause()`.
- **Do not switch the observer to `is-spine-pulsing` on `<html>`.** It looks
  tidier and it wakes the module on every kick.
- **Do not "fix" the nebula contrast with a sky-side scrim on your own.** It
  changes Music and Stay Connected, which already ship that way. Owner's call.
- **Do not trust a screenshot alone for occlusion on this page.** The reveals are
  staged; measure with `elementFromPoint`.
- **Do not quote a snare figure without naming its config** (carried from 46 —
  the sweep's `hz 2500 / sens 2.2` and the owner's `hz 1600 / sens 1.95 /
  coinc 85` differ by 70% on strike count).
- **Do not reach for `s sns` when strikes are missing** (carried from 46 —
  `s coin` is the recall control; the bottom of `s sns` is a hat detector).
- **Do not reintroduce a "step a track first" step when testing the detector**
  (carried from 46 — that was its §3 bug, and it is fixed; confirmed again this
  session on a fresh load).
- Still: never `python -m http.server`, never `file://`, no Python **text-mode**
  writes to JS/CSS/HTML — this session's edits went through binary-mode
  read/replace/write with an exact-match assertion per edit.

---

## Git state

- Branch `feature/spine-ui-v2`. Session start `15fe2af`.
- **One code commit**, `10cfe68`, then this handoff.
- **Two files touched:** `css/deep-field-bg.css`, `js/deep-field-bg.js`.
  122 insertions, 7 deletions.
- **No new binaries. 0 bytes of media added.**
- `--df-build` 11 → **12**. `--spine-build` and `--star-build` untouched.
- `main` untouched. No PR.

---

## Still open

1. **Judge the hold on real hardware, and on a phone.** It was built and
   measured in one session and the owner has not watched it yet. The specific
   thing to watch for: whether the nebula arriving on Merch/Transmissions/
   Archive mid-track reads as intentional or as the background losing its place.
2. **The nebula contrast decision** — 18.0% of the Merch paragraph's area under
   4.5:1 against the clip's 9.8%. A sky-side scrim fixes it and changes Music
   and Stay Connected too. Needs the owner.
3. **The fork strike on a phone** (45's item 8, live at `--snare-all: 0.12`
   since 46). Still never seen on one.
4. **Wire the purchase page, or decide not to yet.** Needs the owner: Stripe
   account, real prices, the Payment-Links-vs-backend call in `STRIPE-SETUP.md`.
   Fulfilment is unbuilt. GitHub Pages is static.
5. **Whether phones should pay the 120.4KB of feather masks.**
6. **Whether the glow and the foreground ever ship.** Both judgeable at `/?tune`.
7. **No Purchase entry in the nav** — a design question, not an edit-cost one.
8. **Assign masks 04–07 to rows**, or call 3 / 1 / 2 final.
9. **Judge the hero-wait (~675ms).**
10. **A glow gradient block** for `rain-transmission-rooftop`.
11. **A JS transcription of the vertebral rhythm** for mask 06, plus a parity
    story for 07.
12. **Mobile judgement calls** (41's item 5): nav links 25px, tablets ≥768 taking
    the 4.9MB clip, About at 3.55:1 under AA.
13. **Whether the VHS should run on phones.**
14. **The lab's fate**, now that it duplicates `index.html` — and note that
    `deep-field-lab.html` is separately stale, running its own copy of a module
    that has moved on.
15. **A `-g 48` re-export of the spine render.**
16. **A leg-aware clip pause** while the sky holds, if the invisible decode ever
    shows up in the frame budget. Not a bug today; a known cost.
17. The two filmrow labs still scrubbing; the doc-rail ring inversion; the
    frame-budget decision; `music.html` still a redirect stub; stale amber-era
    `?tune` TIPS prose; the two missing trivia files; the astral scrim; the
    inherited pile.

---

## Starting the next V2 chat

Attach this file. The working folder is
`C:\Users\Haight\Desktop\kundalini-spines-spine-ui` on `feature/spine-ui-v2`.
Serve with `python scripts/serve.py`, browse `http://localhost:8000` — never
`file://`, never `python -m http.server`.

The single most useful next step is **item 1**: play a sample on the home page,
scroll through Merch and Transmissions while it runs, and decide whether the
held sky is right. Everything about it is measured and nothing about it has been
lived with. Item 2 rides along with it — if the copy reads fine over the nebula,
that item closes too.
