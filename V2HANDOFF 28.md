# Kundalini Spines — Spine UI V2 Handoff 28

**Date:** August 12, 2026

Tenth handoff of the **Spine UI V2** track (branch `feature/spine-ui-v2`).
`27` owns the navigator merge, merch.html and the nav wiring; `26` the footer,
the glass and the field lab; `25` the Music wrap; `24` the wordmark and coil;
`23` the entrance and the Range server; `19` the navigator. The plain
`HANDOFF 1`–`19` series documents the dormant production site on `main`.

---

## The one-line version

**The about page became a scroll-revealed magazine feature, Calibration became
the navigator's shipped reading, and Timeline became Stay Connected with a real
destination.** `connect.html` is new (the Buttondown signal form as a page).
Two silent bugs died: the hero parallax outran its own bleed, and Music's
toggle states had been half dead since the Aug 11 merge without erroring.

---

## Corrections to earlier handoffs

- **27's ITEM 2 UNDERSOLD THE v-readout ROT.** The hardcoded six-node bearing
  table was recorded; not recorded were a SECOND hand-copied chakra table
  (despite `js/ks-chakras.js` being the declared single source — and
  v-calibration.js's header *claiming* both read it, which was false until
  Aug 12 made it true) and a formatter bug: `('0'+y).slice(-3)` turns a
  fractional y like 32.5 into `"2.5"`. All three fixed; bearings and chakras
  now derive from `window.__spineLab.nodes` and `window.KS.CHAKRAS` at mount.

- **27's "MUSIC RAIL REGRESSION FIXED" WAS TRUE FOR LAYOUT, NOT FOR STATE.**
  The ACTIONS rebuild was correct, but `syncToggleStates()` in
  `js/music-wrap.js` was a second hand-written map keyed on navigator node
  ids that the fix did not reach: `els.members` and `els.ethos` had been dead
  since the merge — **Decode's and Shuffle's `aria-pressed` never updated** —
  and Sky's only worked because the last node happened to still be called
  `timeline`. Found Aug 12 while renaming that node, i.e. at the exact moment
  the luck would have run out. It now derives from ACTIONS' own titles.
  **That is the third id-keyed leftover this codebase has surfaced.**

- **27's "about.html prose over the lit nebula" item transfers, not closes.**
  The page it described no longer exists — the magazine rebuild replaced it —
  but the new page is just as transparent. Only the masthead was measured for
  contrast (15.4:1 mean, 12.5:1 worst-5% behind the headline); the running
  prose over the bright arm has still not been judged.

---

## Git state

- Branch `feature/spine-ui-v2`. Session start `e11227d` (V2HANDOFF 27).
- Work was done in a cloud clone and delivered file-by-file to the desktop
  worktree; at wrap-up **every changed file was byte-diffed desktop-vs-clone
  and all 21 matched** (one first-pass `cmp` mismatch on `alley-solo.webp`
  was a stale mount cache — the md5s are identical).
- **14 files modified, 7 added**: `connect.html`, `css/about-feature.css`,
  `js/about-feature.js`, `links.html`, and `assets/about/` (2 webp + 1 mp4).
- **THE COMMIT IS THE WRAP-UP'S LAST STEP** — if `git log` does not show an
  Aug 12 commit for this work, it never happened; see "Committing this".
- `main` untouched. No PR.

**DELETE `deliver\` BEFORE COMMITTING.** It is the unzipped drop-off of the
about-page replacement (README + duplicate page files); everything in it is
installed at the repo root now. `git add -A` with it present commits a second
stale copy of about.html.

---

## THE ABOUT PAGE IS A MAGAZINE FEATURE

Drop-in replacement supplied by the owner (see `deliver/README-for-claude-code.md`
before deleting the folder, or this summary): `about.html` +
`css/about-feature.css` + `js/about-feature.js`. Copy is the owner's profile
document verbatim, ten sections. Three anchors stay load-bearing: `#story`,
`#messengers`, `#ethos`. Nothing sets a background; contrast comes from scrims
ON the images. Anton is the one new face, single weight — `font-weight: 400`
everywhere it appears, deliberately.

- **The masthead** is a 200vh track, sticky 100vh stage; the reveal reads
  scroll POSITION (never wheel deltas — `js/scroll-weight.js` damps wheel).
- **Assets:** owner's `duo.png` (7.19 MB) → `assets/about/hero-corridor-duo.webp`
  (0.49 MB), `haightalley.png` (9.94 MB) → `alley-solo.webp` (0.26 MB), both
  2752×1536 with markup width/height corrected to match; `graveyard video.mp4`
  (5.92 MB, 9.4 Mbps) → `graveyard-shift.mp4` (0.59 MB, CRF 26, audio stripped,
  faststart). **Both webps verified by decoding; the mp4 by frame extraction.**
- The clip has no `autoplay`; an IntersectionObserver starts/stops it.

### The parallax bug, and the asymmetric bleed

The drop-in shipped with `translate = -p * vh * 0.4` against a symmetric -14%
bleed. 0.4·vh is ~3× the travel -14% provides, so from p≈0.35 the photo's
bottom edge climbed into the stage and **"SPINES" sat half on raw sky — the
owner caught it on first scroll.** The scrim is a child of the media and left
with it, so the legibility gradient went too.

Fix, in two layers (`--about-build: 3`):

1. **Travel is derived from the bleed** (`js/about-feature.js`): shift = the
   media's overhang below the stage, computed from the CSS offsets. One knob.
2. **The bleed is asymmetric on purpose**: `-4% top, -24% bottom`. Upward
   travel only ever spends the BOTTOM bleed, and object-fit cover's side crop
   depends only on the TOTAL. So 4/24 keeps the exact side crop of 14/14,
   more than doubles the drift (216px vs 126px at 900), improves cap headroom
   at rest, and produces a byte-identical end frame. Measured before adopting.
   Going past 28% total (8/32 was tried) visibly tightens the side crop toward
   the figures — 64% of image width visible vs 70% — so the total stays.

**Measured (Aug 12, Playwright/Chromium, per the drop-in's own checklist):**
reveal completes (`inset(0%)` both words, standfirst 1, cue 0, stage stuck);
photo covers the stage at 21 scroll positions × 5 viewports (1440×900,
1280×720, 390×844, 1200×540, 1920×1080) with 20–43px margin; zero horizontal
overflow at 1440/1024/768/390; floats wrap at 1440 (9–15 lines beside each
figure, nearest gutter 48–60px) and drop below 880; reduced-motion and no-JS
both show the finished page; spine polarity byte-identical to the old page
(computed opacity/filter/blend compared old vs new); zero console errors.

---

## CALIBRATION IS THE NAVIGATOR'S READING — OWNER CALL

Chosen from the nine in `entrance-lab.html` after browsing them live.
The lab now ships with `calibration` mounted (keys 1–9 unchanged; 1 = control).
Five bearings print at the live node y's (14/32.5/51/69.5/88) with correct
idx/side/kind — including node 04 IMMERSIVE, which the old table had wrong.

**THE READING BELONGS TO THE NAVIGATOR, NOT THE STAGE.** Owner's rule, Aug 12:
every surface other than the navigator gets the sky alone. Music does not
replace the stage, it restyles it (`html.is-music`), so the field container
now opts out itself — fades out on the way into Music, snaps back on CLOSE.
Verified by real clicks: field opacity 0/hidden in Music, restored after,
cards still open through a mounted reading, zero errors. The production pages
were swept file-by-file: **zero field-module or navigator references on all
eight** (`ks-chakras.js` loads on six of them, but that is the shared dataset
the footer reads — it paints nothing).

---

## THE CARDS: TWO STACKED BUGS, BOTH FIXED

Owner report: the Timeline card opened cut off at the bottom.

1. **positionCard ran while the card was `[hidden]`** — a hidden element
   measures 0×0, so every card was clamped as the 360×300 fallback. Mid-rail
   nodes hid it; Timeline at y 88 went 15px past a 900px window. activate()
   now unhides (still invisible — the reveal is the transition), forces
   layout, then positions.
2. **A 607px card cannot fit a 650px window at all** (Our Story). Cards now
   cap at `calc(100vh - 114px)` — 114 is exactly the clamp's 90px floor plus
   24px bottom margin — as a flex column with **the scroll on `__body`**,
   so head and CTA stay fixed. Overflow on the card itself was tried first
   and every card grew a phantom 13px scrollbar: the ghost frames
   (`::before/::after`) are transformed past the padding box and count as
   scrollable overflow. Do not move it back.

**Measured:** all four cards inside the window at 900/720/650/540 heights,
CTA visible in every case, body scrolls only when genuinely needed.

---

## TIMELINE → STAY CONNECTED

Owner call. The node id changed with the title (`timeline` → `connect`) —
an id that says one thing over a node that says another is the literal-vs-
position bug in another costume. Timeline's CTA had pointed at `#`; the
navigator now has **five nodes, five real destinations**.

- **`connect.html` is new**, built to merch.html's conventions: same five
  stylesheets in the same order, `page-connect` on `<html>`, added to
  star-bg's phone selector list in the same change (**`--star-build` 25 → 26**).
  The Buttondown block is index.html's exact form — same native POST, no
  `target="_blank"`, works with JS off; all measured 2026-07-29 and none of it
  re-litigated. **Centered** by reusing index's own `.newsletter` /
  `.newsletter__inner` classes (owner asked for centre after seeing the
  left-set first cut); `.newsletter h1` joined the stencil rule in
  components.css. The duplicate form ids are safe: one copy per page.
- **Wiring:** footer Contact row → `connect.html` (was `/#newsletter`);
  sitemap.xml (lastmod 2026-08-12) and data/site.json carry the page;
  index.html's newsletter section keeps its `id="newsletter"` for old deep
  links. **Header navs deliberately do NOT carry a seventh item** — routes
  are the node, the footer and the homepage form; 27 measured 93px of
  headroom at 769px BEFORE any seventh item, so remeasure before adding one.
- **Verified by real clicks:** node card reads 05 / 05, CTA lands on
  connect.html; the page loads with sky, zero errors/404s, no overflow at
  1440 and 390; headline and form 0px off the centerline at both widths;
  Music rail unchanged (six slots at 14/28.8/43.6/58.4/73.2/88) and DECODE's
  `aria-pressed` now actually flips (it had not since Aug 11).
- **Repo-wide sweep for the old id:** the only remaining `timeline` node
  reference is `music-collapse-lab.html` — already flagged stale in 27's
  item 10.

---

## Housekeeping

- **`links.html`** (repo root) is an internal index of every page and lab,
  all 25 links verified 200. It, like the handoffs and labs, **would be
  published by the deploy workflow** — 27's item 3 now covers one more file.
- `scripts/serve.py` remains the serving command. Playwright's Chromium
  **cannot decode H.264** (`canPlayType("avc1")` = ""), so any mp4 playback
  check needs a VP9 stand-in — that is how the graveyard clip's observer was
  verified. It also has no route to Google Fonts, so Anton has never been
  seen in the harness — only on the owner's machine.
- Hard-reload discipline unchanged; `--about-build` exists for the same
  reason the other builds do.

---

## Do not do these

Everything in 19–27's lists still stands. Additionally:

- **Do not grow the parallax multiplier.** The travel IS the bottom bleed;
  grow `-24%` in `css/about-feature.css` and the JS follows. Past 28% total
  bleed the side crop closes on the figures — measured.
- **Do not move the card's overflow from `__body` back to the card.** The
  ghost frames make every card report 13px of phantom scroll.
- **Do not key anything on navigator node ids from another module.** Third
  instance found this session (`syncToggleStates`). Derive from the live
  source or key on your own module's table.
- **Do not commit the `deliver\` folder.** Delete it before `git add`.
- **Do not deploy** while the workflow publishes handoffs, labs and
  links.html (27 item 3, still open, now bigger).
- **Do not "deduplicate" the two newsletter forms.** One per page is valid;
  they share classes precisely so they cannot drift.
- **Do not add a Stay Connected item to the header navs** without
  remeasuring the 769px link row — 27's 93px headroom predates any seventh item.

---

## Verified vs. asserted

**Verified by tooling, and looked at:**
- The full about-page checklist (reveal, overflow, floats, reduced-motion,
  no-JS, polarity), plus the coverage sweep, at the widths and heights above.
- Calibration default mount/unmount, key cycling, and clicks-through-reading,
  by real mouse clicks; the field leaving and returning around Music mode.
- All four cards inside the window at four heights; the connect node's card
  and CTA end-to-end; the footer row's damped ~3s glide to `/#newsletter`
  before it was repointed, and the repoint to connect.html after.
- Every webp decoded; the re-encoded mp4 frame-extracted and looked at.
- Desktop worktree byte-identical to the verified clone, all 21 files.

**Asserted / NOT verified:**
- **The graveyard clip playing as H.264 in a real browser.** The observer
  logic is proven (VP9 stand-in); the actual mp4 has only been decoded by
  ffmpeg, never played in a browser. One local look settles it.
- **The Anton masthead with the real font** — sandbox-blocked; the owner has
  seen it and reported only the crop issue, which is fixed, but no measurement
  of the real face exists.
- The magazine layout on a real phone; Safari/Firefox glass; the connect
  form actually submitted (same endpoint index has used since 2026-07-29).
- The about page's running prose over the lit nebula — see corrections.

---

## Still open

1. **The footer band contrast decision** (27 item 1, unchanged, still first).
2. **The calibration frame clamp, parked mid-flight by the owner.** The ask
   was "cards open within the limits of the calibration backdrop"; the
   measurements are already taken: at 1440×900 the clear lane between the
   readout column pairs is **x 370–1070**; a side-left card opens at x 170
   (through both left columns) and side-right runs 72px into the outer right
   column. The clamp belongs in `positionCard` (`js/spine-ui.js`); the owner
   redirected to the Timeline cutoff before choosing an approach. Ask before
   building — it may be moot if the columns are meant to read as underlay.
3. **The deploy workflow leak gap** (27 item 3) — now also `links.html` and
   this file. Fix before first deploy.
4. **Graduating the navigator to production.** Calibration is settled and
   shipped in the lab; the real milestone is the entrance + navigator + reading
   stack replacing/joining index.html. Owner decision on where and when.
5. `music.html` and `hero-timeline-lab.html` still black (27 item 5).
6. Safari/Firefox glass fallback; mobile pass on a real device — both now
   also cover about.html and connect.html.
7. **What PURCHASE should do** (26 item 4) — unchanged, though connect.html
   at least gives the mailing list a home in the meantime.
8. Lab staleness (27 item 10, grown): `music-collapse-lab.html` keys on
   `members`/`ethos` AND now-retired `timeline`; `spine-card-glass-lab.html`
   hardcodes `02 / 06`; `hero-scrub-lab.html` uses nonexistent `--space-5`
   and its own node table.
9. Deploy/DNS; metadata + controls redesign; `assets/messengers/*.jpg` → webp;
   Range layers 2 and 5; tuner integration; Archive wrap — unchanged.

**Closed since 27:** the about page (rebuilt as the magazine feature, parallax
fixed, hero assets shipped); item 2 (v-readout derives from live nodes — plus
two undocumented rots in the same file); the field-reading decision
(Calibration, shipped as default); Timeline's dead CTA (node renamed, page
built, wired everywhere); the Music toggle-state sync; the Timeline card
cutoff and the taller-than-window card class it exposed; Stay Connected in
the footer's Contact column.

---

## Committing this

From `C:\Users\Haight\Desktop\kundalini-spines-spine-ui`:

```
rmdir /s /q deliver
git status
git add -A
git commit -m "feat(about+navigator): magazine about page, Calibration ships, Timeline becomes Stay Connected with connect.html"
git push
git log --oneline -3
git status
```

Read `git status` before the add: the changed set should be the 21 files plus
this handoff, nothing else. `working tree clean` at the end is the proof.

---

## Starting the next V2 chat

Attach this file (`V2HANDOFF 28.md`). `27` still owns the navigator merge and
merch; `26` the footer, glass and field lab; `25` the Music wrap. The new
session needs folder access to `C:\Users\Haight\Desktop\kundalini-spines-spine-ui`
(the V2 worktree, **not** production) and should confirm `feature/spine-ui-v2`
before editing.

A good opening message:

> Here's the latest V2 handoff for Kundalini Spines. The about page is a
> magazine feature, Calibration ships on the navigator, and connect.html is
> the Stay Connected destination. The footer band contrast decision and the
> calibration frame clamp for cards are waiting on me — start there.
