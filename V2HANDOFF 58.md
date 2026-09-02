# Kundalini Spines — Spine UI V2 Handoff 58

**Date:** September 2, 2026

Fortieth handoff of the **Spine UI V2** track. `57` owns the footer contrast
harness; `56` the Stripe webhook; `55` the server and the refund bug; `51` the
Cloudflare migration recipe. **This session:** the home page's scroll
choreography (the deep-field clip), the hero loop seam, and one audit script.
Eight commits on `feature/spine-ui-v2`, **released to `main` on the owner's
word at the end of the session.** No Stripe work. No transmission filed.

**The chat that did most of this work was wiped by an accidental `/clear`**
partway through. The commits and their messages survived; the chat's own
measurements are recorded here from those messages, and are marked as such
below. A second chat recovered the uncommitted build 20, verified it, and then
ripped it out on the owner's word.

---

## The one-line version

Going back up the page is now a **hard cut** to the section's frame, every
leg between sections is the **same length and lands in about a second**, the
hero's loop seam is **gone in Chrome and Brave**, and a backward **dissolve
was built, watched twice, called "a flashing, annoying, blinding effect", and
removed the same day.** Do not offer the dissolve a third time.

---

## Corrections to handoff 57

1. **`57` item 7 is closed and was closed in reverse.** It said
   `feature/spine-ui-v2` was 3 behind `main` and could be fast-forwarded from
   `main`. The previous chat did that (`d7d8c94` is the pull), then put eight
   commits on the V2 branch, and this session fast-forwarded `main` **to** the
   V2 branch. Both are at `79af22e` plus this handoff. The production worktree
   `C:\Users\Haight\Desktop\kundalini-spines` was fast-forwarded to match.
2. **`57` item 9 is closed by a test, not a grep.** `scripts/audit-css-vars.py`
   (`e3193ab`) walks every stylesheet each public page really loads, in a real
   browser, and reads each no-fallback `var(--x)` off the elements its rule
   matches. Sept 1 sweep: ten pages, **0 undefined-token uses**; the twelve
   `var()` strings built in JS resolve on every page that loads the script.
3. **`57`'s branch-model note no longer applies.** This session worked in the
   V2 worktree on `feature/spine-ui-v2` exactly as `kundalini-session-end`
   describes, and `main` was synced once, on the word "wrap up sync to main".
4. **`57` said "gh is not installed". Still true.** No CI run was read this
   session either; the release was verified by reading the live site.

---

## What shipped

| commit | build | what |
| --- | --- | --- |
| `e3193ab` | — | `scripts/audit-css-vars.py`, closes 57 item 9 |
| `ce60fbf` | — | hero: gapless loop through a MediaSource; deep-field waits for the hero |
| `bbedf02` | 17 | going back is a cut to the destination's cue, not a replay |
| `ccaeec8` | 18 | legs play at 1.2x; `--df-rate`, `--df-rate-tail` dials |
| `25dc653` | — | every leg the same length; cues re-spaced on a 41-frame grid |
| `efb4aa0` | 19 | `--df-rate` 1.2 → 1.65 so every leg lands in 1.0–1.1s |
| `ea29d89` | 20 | backward dissolve through a ghost canvas; `--df-sky-out-fwd` |
| `79af22e` | 21 | **dissolve ripped out**; hard cut restored; `--df-sky-out-fwd` kept |

Files: `js/deep-field-bg.js`, `css/deep-field-bg.css`,
`assets/lab/deep-field-2-marks.json`, `js/hero-video.js`, `index.html`,
`assets/hero/messengers-hero-loop.mp4` (new, 4.5 MB), `scripts/audit-css-vars.py`.

### 1. The hero seam (`ce60fbf`) — from the previous chat's commit message

The reported "chug" was the `<video loop>` wrap, measured live with
`requestVideoFrameCallback` in Chrome and Brave: every presentation gap sat at
the seam (58–96 ms to seek to 0, 58–83 ms to the next frame), zero dropped
frames, no long tasks, sky on or off. `js/hero-video.js` now streams a
fragmented, **video-only** remux of the shipped mp4
(`assets/hero/messengers-hero-loop.mp4`) through a MediaSource in sequence
mode, appended end to end; every wrap measures exactly one frame period
(42 ms) in both browsers. Video-only because any audio track in the stream
reopened a 67–212 ms seam across a six-file matrix; the sound toggle plays
the mp4's AAC in its own element kept in phase. Browsers without MediaSource
keep the webm/mp4 pair and the `loop` attribute.

Second cause: `deep-field-2.webm` (4.75 MB) downloading beside the hero from
t=0 stalled the hero three times at 8 Mbps. The hero now signals
`ks:hero-ready` when its fetch completes (or on every failure path); the film
rows and the deep-field sources wait on it; the backstop is 8 s.

**Residual, recorded:** Chrome's decoder spin-up still puts one 60–120 ms
stumble in the first 0.2 s of playback, on this path and on the old one.

### 2. Going back is a cut (`bbedf02`)

Owner's call: "Stay Connected back to Archive should just be Archive." A
backward landing seeks straight to the cue and parks. The replay-forward path
from Aug 23 and its seek deadline are gone; both earlier designs are recorded
in the `GOING BACK IS A CUT` note in `js/deep-field-bg.js`. Forward travel is
unchanged and plays from the parked frame.

### 3. Equal legs, one second each (`ccaeec8`, `25dc653`, `efb4aa0`)

Three owner calls in one afternoon, each watching the previous one:

- "About twenty percent faster" → `--df-rate` 1.2, with the 20-frame leg into
  Stay Connected derived down to 0.42x so it lasted the mean of the others.
- 0.42x read as steppy and the opening as quick → instead of bending the
  rate, **the cues moved onto a 41-frame grid** with Music pinned at f83 (the
  artwork match that brings the reactive background in): About 41, Music 83,
  Merch 124, Transmissions 165, Archive 206, Stay Connected 247, Foot 288.
- 1.46 s at the longest was still too long → `--df-rate` 1.65: 41 frames take
  1.04 s, 42 take 1.06 s. Measured by wheel at 1440×900, seven legs:
  1.05 / 1.06 / 0.99 / 1.03 / 1.03 / 1.04 / 1.03 s.

Costs recorded in the marks file: Merch parks on the flash's **rise** (f124),
not its peak; About and Archive left the frames they were once chosen for.

### 4. The dissolve, built and removed (`ea29d89`, `79af22e`)

By evening the owner had watched the sky fade on Music→About and asked for
the same on the legs that cut between two bare frames. One `<video>` cannot
dissolve into itself, so build 20 copied the outgoing frame onto a canvas
(`.df-bg__ghost`) laid exactly over the clip, cut underneath it, and faded the
canvas over `--df-cut-ms` (700) once the new frame had painted, easing the
scrim over the same span.

**First viewing:** "flash banged in the face every time you scroll back up."
Diagnosed to Merch→Music: the ghost held the bright Merch frame (lum 0.7)
while the scrim eased to the **lighter** value set for the dark Music frame
(0.55 → 0.40) and the sky's screen-blend layers rose on top. The owner also
said the Music legs never needed it because "the reactive background already
does its own fade." Every backward leg arriving under the sky was sent to the
plain cut; the ghost fired only on Archive→Transmissions, Transmissions→Merch
and About→Home.

**Second viewing, with that fix:** "Still looks like a complete ass. It has a
flashing, annoying, blinding effect. Rip it out." Ripped out in full:
`.df-bg__ghost`, `cutTo()`, `--df-cut-ms`, its tuner entry, the CSS rule.
Build 21. Going back is a hard cut, full stop.

**What was measured about it, for the record.** A headless screenshot of the
ghost held at opacity 1 over the identical frame was **not brighter** than the
video (mean luminance 37.8 vs 38.3; the copy was a fraction darker). So the
canvas colour path was not the flash; the perception on the owner's display
was. Whether Windows video overlays render `<video>` differently from a canvas
on that display was not measurable from here and is now moot.

### 5. `--df-sky-out-fwd` (kept from `ea29d89`)

Owner asked for the clear out of Music going **forward** (Music→Merch) to be
"roughly cut in half" while naming the backward fade (Music→About) as the one
that looks right. One dial cannot be both, so the forward leg has its own
rate, 0.12, and the backward keeps `--df-sky-out` 0.06. **Measured in the
browser pane: 809 ms forward vs 1184 ms back — about two thirds, not half.**
The dial is in the tuner panel as "sky out fwd"; nobody has re-tuned it.

---

## Verified vs. asserted

**Verified this chat (seen or measured):**

- Build 21 on `127.0.0.1:8060`: no `.df-bg__ghost` element, all seven
  backward legs land on their cue by a plain seek (frames 248 / 206 / 165 /
  125 / 83 / 41 / 0), the sky still rises over Music (0 → 0.94) and drops
  leaving it, no console errors. Screenshots of the dissolve were taken and
  looked at before it was removed; the hard cut was measured, not
  screenshotted.
- `main` fast-forwarded `d7d8c94..79af22e`; production worktree at `79af22e`.
- **Live on `kundalinispines.com` within a few minutes of the push:**
  `css/deep-field-bg.css` serves `--df-build: 21`, `js/deep-field-bg.js`
  contains no `df-bg__ghost`, `assets/hero/messengers-hero-loop.mp4`
  answers 200, and the marks file carries the 288 cue. Read with curl,
  cache-busted; no CI run was read (no `gh`).

**Taken from the previous chat's commit messages, not re-measured here:**

- Every hero-seam number in §1, the leg timings in §3, and the frame counts
  in `bbedf02`. The chat that measured them was lost to `/clear`; the
  messages are detailed enough to trust, and the marks file carries the cues.
- That the audit script's sweep returned 0 undefined-token uses on all ten
  pages.

**Not done:**

- No screenshot of the live site was taken after the release. The live check
  reads the served build number and the presence of the new assets.
- No transmission. Scroll tuning, a loop fix and an audit script are not
  something a visitor would notice as a milestone.

---

## Do not do these

1. **Do not offer or build a backward dissolve again.** Twice rejected on the
   same day in the strongest terms the owner has used. The note in
   `js/deep-field-bg.js` under `GOING BACK IS A CUT` records both attempts.
2. **Do not put an audio track into the hero's MediaSource stream.** Any audio
   track reopened the seam (67–212 ms). Sound lives in its own element.
3. **Do not let `deep-field-2.webm` load before `ks:hero-ready`.** That was the
   stall on ordinary connections.
4. **Do not "tidy" `--df-rate-tail` or `--df-sky-out-fwd` out of the tuner.**
   Settled values with live escape hatches, kept at the owner's request.
5. **Do not re-space the cues off the 41-frame grid without measuring the
   leg durations again.** The grid is why every leg is 1.0–1.1 s.
6. **Do not serve with `python -m http.server`** and **do not open a second
   Chrome sweep while one is running.** Both still bite.

---

## What is deliberate, so nobody fixes it

- **Merch parks on the flash's rise, not its peak.** Cost of the equal-leg
  grid, recorded in the marks file. The owner chose equal legs.
- **The hero stream is video-only.** See above.
- **The 60–120 ms decoder stumble at the start of hero playback** is on both
  the old and new paths and was not chased.
- **Going back is a cut with no fade of the clip itself.** The fades the
  reader sees going back are the nebula rising or dropping over a settled
  frame, and they live in `arrive()` and the sky ramps.

---

## Git state

- `feature/spine-ui-v2` — `79af22e` plus this handoff, pushed.
- `main` — fast-forwarded to `79af22e` this session, on the owner's word
  ("wrap up sync to main"); this handoff is pushed to it after.
- Production worktree `C:\Users\Haight\Desktop\kundalini-spines` — `main`,
  clean, fast-forwarded to `79af22e`.
- V2 worktree `C:\Users\Haight\Desktop\kundalini-spines-spine-ui` — clean.
- A stray `scripts/serve.py 8060` may still be running from this session,
  serving the V2 worktree. Harmless; the `stale-serve-processes-hold-8000`
  memory applies.

---

## Still open

Carried from `56`/`57`, unchanged — nothing here touched Stripe:

1. **No real customer sale has gone through the webhook.**
2. **The async payment branch is untested.**
3. **No download-count cap.**
4. **Reissue is still manual.**
5. **Deluxe and Artifact remain `checkoutUrl: null`.**
6. **Nothing tests any page's copy against its own state.** The CSS half of
   this class is now covered by `scripts/audit-css-vars.py`; the copy half is
   not.
7. **The footer chip's border has never been measured** (57 item 8).

New this session:

8. **`--df-sky-out-fwd` at 0.12 is two thirds, not half.** If the owner still
   wants half, ~0.2 is the place to start, and it is one tuner dial.
9. **The hero's decoder stumble in the first 0.2 s** is recorded, not fixed.
10. **The live site was not screenshotted after this release.**

---

## Starting the next V2 chat

Attach this file. `57` for the contrast harness; `56` for the Stripe webhook;
`55` for the refund bug; `51` for the Cloudflare recipe.

> Here's the latest V2 handoff for Kundalini Spines (Spine UI V2 branch). I
> want to work on <thing> this session.

The new session needs `C:\Users\Haight\Desktop\kundalini-spines-spine-ui`,
should confirm it is on `feature/spine-ui-v2`, and should serve with
`python scripts/serve.py <fresh port>` and browse `http://127.0.0.1:<port>`.
**Every push to `main` is a deploy** and happens only on the owner's word.
