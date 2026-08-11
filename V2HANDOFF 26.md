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
now a shared file, and **the entrance, the navigator and Music are one page**.
`main` was not touched.

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

---

## Git state

- Branch `feature/spine-ui-v2`, worktree
  `C:\Users\Haight\Desktop\kundalini-spines-spine-ui`.
- Session start `bf71782`; two commits, `41f6f8b` then **`efe8812`**, plus this
  handoff and the thumbnail set.
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
   under the same filenames so the wiring is a pure prefix swap. **10.1 MB →
   ~1 MB.** Only the index uses them; the carousel still, the hero preload and
   the release card keep full size.

7. **`spine-ui-wire.webp`** is now what `css/spine-ui.css` loads. 626 KB → 256
   KB. The png stays on disk. The image is two RGB colours over a soft alpha
   mask, so RGB `quality` is nearly inert and `alpha_quality` is the real dial;
   75 is the last step before the low-alpha glow bands into visible blotches.

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

---

## Verified vs. asserted

**Verified by tooling, and looked at:**
- Both defects, before and after, by event counting rather than by inspection.
- The full stack end to end: entrance → navigator → Music → jump → close.
- Deep link landing in Music with the entrance at `display: none`.
- `music-lab.html` re-verified after the CSS extraction.
- The navigator unnumbered, the reading card still `02 / 06`.
- Thumbnails serving from `assets/music/thumbs/`, 28 cells.
- Screenshots taken and **actually looked at** at every stage.

**Asserted / NOT verified:**
- **Production Range support is answered BY PROXY.** GitHub Pages was measured
  on a live Pages-served binary, not on this project's own URL, because
  **nothing is deployed**: Pages is disabled and `kundalinispines.com` still
  points at Namecheap parking. Re-verify against a real asset on first deploy.
- **No mobile pass.** Nothing was run below 1440×900.
- **`prefers-reduced-motion` still coded and not tested** on either page.
- **The entrance's own sequence was not re-timed** after Music was added. The
  handoff was driven programmatically in verification, not by watching ENTER.

---

## Still open

1. **Mobile** — the entrance headline breaks at 375px (24's item 1); Music has
   never been run there.
2. **What PURCHASE should actually do.** Still a toast. `links.download` is
   null on all 28 and the "$1" is hardcoded at `track-experience.js:804`.
   Needs a decision: Bandcamp/Gumroad, Stripe, or email capture.
3. **The metadata + controls redesign.** 25's finding 15 is its spec.
4. **Deploy.** Pages is disabled and DNS is unset — the single blocker on
   anything being reachable, and now the blocker on closing Range for real.
5. **`assets/messengers/*.jpg` → webp**, 331 → 208 KB. Keep the `.jpg` for
   `transmissions/001.html`'s `og:image`; social scrapers are the one place a
   JPEG fallback still earns its keep. Both files are 928×1152 but every `<img>`
   declares `width="1200" height="1500"` — same ratio, wrong numbers.
6. **Layer 2 and 5 of the Range plan.**
7. **Tuner integration, Archive wrap** — unchanged from 19.

**Closed since 25:** the paused-after-jump defect; the Escape/player defect
found alongside it; navigator numbering; the Music CSS duplication; the
entrance integration (open since 19); index cover weight; the wire png; and
Range support, answered by proxy.

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
> full stack runs in entrance-lab.html now. Mobile has never been run — start
> there.
