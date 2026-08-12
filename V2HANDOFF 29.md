# Kundalini Spines — Spine UI V2 Handoff 29

**Date:** August 12, 2026

Eleventh handoff of the **Spine UI V2** track (branch `feature/spine-ui-v2`).
`28` owns the magazine about page, Calibration and connect.html; `27` the
navigator merge and merch; `26` the footer, glass and field lab; `25` the Music
wrap; `24` the wordmark and coil; `23` the entrance and the Range server; `19`
the navigator. The plain `HANDOFF 1`–`19` series documents the dormant
production site on `main`.

---

## The one-line version

**The footer band and the about page were judged against real pixels and
fixed, the coil took the owner's tuned numbers, and a 360° spine clip was
built into the entrance, verified, and then cut.** Two commits, both pushed.
The session's most expensive lesson was not a bug in the code: a visual
"regression" chased for six tool calls turned out to be `file://`.

---

## Corrections to earlier handoffs

- **28 SAID TO DELETE `deliver\` BEFORE COMMITTING. IT WAS COMMITTED ANYWAY.**
  All four files went into `312cf15` — a stale duplicate of the about page at
  `--about-build: 1` with `.jpg` asset refs that do not exist on disk. Removed
  this session. **A "do not do this" line in a handoff is not a mechanism**;
  the only reason it was caught is that `git ls-files deliver` was run at
  session start rather than trusting the previous wrap-up's account.

- **28's "THE ANTON MASTHEAD — SANDBOX-BLOCKED" IS WRONG.** Measured today:
  `document.fonts.check('400 32px Anton')` returns **true** in this harness,
  the `FontFace` set carries `Anton|400|loaded`, and headings measure at
  Anton's real metrics. Source Serif 4, IBM Plex Mono and Big Shoulders
  Display all load too. The historical "no route to Google Fonts" note in
  `V2HANDOFF 21` does not apply. Anything previously discounted as
  "fallback face only" can be re-judged.

- **28's PHASE ANXIETY IS OVERSTATED FOR about.html.** The full twinkle moves
  the page's mean backdrop luminance only **0.010927 → 0.012303** (+12.6%),
  about a **2% swing in contrast ratio**. The static bright arm of the nebula
  is a 5–10× effect. Sampling phase still matters for a single
  `getComputedStyle` read (27's mistake stands) but it is not what breaks
  contrast on that page. Worst case is `t = 11972ms` — all four star bands on
  their 46% peak with the cloud at 99.5% of its own.

- **`links.html` was recorded in 28 as "all 25 links verified 200".** It is
  **26** internal links, all 200 as of today.

---

## Git state

- Branch `feature/spine-ui-v2`. Session start `312cf15` (V2HANDOFF 28).
- **Two commits, both pushed:**
  - `4a88b87` — footer band + STANDBY, about captions and prose, coil, README,
    `deliver/` removal. 10 files, +259 / −1014.
  - `c52e050` — the `file://` banner in `links.html`.
- `main` = `origin/main` = `13083d9`, untouched. No PR.
- Working tree clean, branch in sync with origin.
- **Nothing internal leaked into the commits** — checked explicitly: no
  `.claude/` settings, no zips, no `spine360.mp4`.

---

## THE FOOTER BAND — SETTLED, AND THE ARITHMETIC HELD

27 raised it, 28 carried it, this session measured and shipped it. **Owner's
call: the full proposal.**

Measured against real pixels using alpha recovery — a transparent-fill capture
gives the true backdrop, a white-fill capture gives per-pixel glyph coverage
`alpha = (W−B)/(255−B)`, and contrast is then computed on glyph-core pixels
(`alpha ≥ 0.90`) against the backdrop **at the same coordinate**, with
animations paused so every variant shares one sky.

| tier | 27 predicted | measured before | measured after |
|---|---|---|---|
| keys (`gray-500` → `gray-300`) | 1.67:1 | **1.52 – 1.63** | **5.26 – 5.90** |
| values (bone) | 6.67:1 | **6.24 – 6.59** | **11.85 – 12.52** |
| STANDBY chip | 1.21:1 | **1.20 – 1.38** | **8.15 – 12.74** |

**27's arithmetic was right to within a few percent.** Three things it did not
know:

1. **`--color-gray-300` is the floor, not a preference.** `gray-400` (`#6B6B6B`)
   computes to **3.94:1** at opacity 1 — still under AA. There is no dimmer
   step that passes.
2. **`opacity: 0.7` was never a brightness dial.** It is a *group* opacity, so
   over a bright backdrop the keys composite *darker than what is behind them*
   and invert. That is why the GEOMETRY column lost its labels and kept its
   numbers. Dimming now lives in the ink colours, which cannot invert.
3. **The chip could not be fixed by colour.** At 8px its peak coverage anywhere
   on the element was **alpha 0.92**, with a single pixel clearing 0.90 — the
   word's ink never fully lands. It is now **9px** (on the shared
   `.sf-row__state` rule so OPEN and STANDBY stay the same size) and bone.

**1366×768 is the worst viewport by a wide margin** — backdrop p99 luminance
**0.40** there against **0.024** at 1920×1080, a 16× difference. 27's claim
that GEOMETRY is the lit track at 1280–1600×900 and clean at 1920 is confirmed.

**Verified:** six pages × three viewports × three phases; no reflow from the
9px bump (chips uniform 20px tall, rows 32px, zero row/footer/document overflow
at 1366, 1280, 1920 and 390); zero console errors. The band is correctly hidden
by the phone media rule at 390 and the chips still pass there (12.54).

### A measurement trap this session walked into and had to back out of

`css/site-footer.css` originally shipped a comment claiming the two-pass shadow
took worst-5% from 1.12 to 5.21. **That attribution was wrong and the comment
was corrected before the commit.** The shipped change moved opacity, colour AND
shadow together, so it does not isolate the shadow's share — and the obvious
check cannot find it either: **comparing a shadowed glyph's core against the
bare backdrop shows a shadow doing literally nothing**, because it changes
neither of those two pixels. To measure a shadow, capture the backdrop *with
the shadow painted and the fill transparent* — a shadow still paints from a
transparent glyph's outline. The shadow's isolated contribution here is
**unmeasured**, and carried on the precedent in `spine-bg.css`.

---

## THE ABOUT PAGE

### Captions: deleted

Owner's call. All four gone — the bleed caption under the duo photo, "Sigils ·
arms crossed", "Alley · vertebrae chain", "Graveyard Shift" — along with the
`.ks-figcap` and `.ks-bleed__cap` rules.

**This closed the page's worst legibility failure by deletion.** The Graveyard
Shift caption measured **1.87:1 with 100% of its glyph pixels under AA** at
1920×1080 — the weakest colour on the page over the brightest backdrop on the
page. `--color-gray-400` is now unused there.

Verified at 1440×900 / 1024×768 / 390×844 with the page scrolled end to end so
every reveal fires: zero caption elements remain, all 6 images load, all 34
body paragraphs reveal, zero overflow, zero errors.

### Prose: the two-pass shadow

`.ks-copy` passed on **mean** everywhere (6.5–9.5:1) but lost **10–29% of its
glyph pixels** below 4.5:1 where it crosses the lit arm — worst in sections 08,
09 and 10, where whole clauses washed out. The site's existing two-pass shadow
now covers the prose, headings, pull quotes and the hero cue.

**Measured after shipping: `.ks-copy` mean 12.21, worst-5% 10.76, 0% of pixels
under AA** at both 1440×900 and 390×844.

`.ks-hero__cue` moved to bone — it was the last `gray-400` on the page.

`--about-build` is now **5**.

### Crimson: knowingly left failing

`--color-crimson-lit` (`#8A1414`) tops out at ~2.2:1 on flat `#050505`, so
`.ks-head__num` (the 01–10 numerals) and `.ks-signoff__sub` ("Decode the
transmission.") **fail before the sky is involved at all** — measured
1.09–1.80:1. Owner's call to leave them for now.

Four candidates were measured against the shadowed backdrop and **nothing still
recognisably crimson clears AA**: `#D9433A` 3.2–3.7, `#E8574B` 3.9–4.5,
`#F0655A` 4.5–5.3 with no margin, bone 9.4–11.2. The full record sits in the
CSS next to the rule, so the decision is one edit whenever it is wanted.
`.ks-head__num` has a defensible decorative exemption; `.ks-signoff__sub` is
real content and has none.

---

## THE COIL — OWNER'S TUNED NUMBERS, BAKED IN BOTH PLACES

turns 3.5 → **2.0**, beam 0.10 → **0.28**, blend 0.60 → **0.90**, travel
2300 → **3060ms**, fade 620 → **200ms**. Hug (1), split (0.58), clearance (9),
far half (0.64) and hold (0) were already at the tuned values.

**THE JS DEFAULTS ALONE WERE NOT ENOUGH.** `coil-lab.html` sets `--coil-*` as
CSS variables and `SpineCoil.readCssVars` reads them, so the lab would have
kept overriding the new defaults with the old numbers. Both files now carry
them; verified all ten read back correctly from `coil-lab.html`.

`hero-scrub-lab.html` keeps its own `--coil-turns: 5` / `--coil-beam: 0.4` and
is deliberately untouched — it is already flagged stale (28 item 8).

Note the blend measurement note in `coil-lab.html` ("tails reach 27.8 units
inside the silhouette at worst") **was taken at 0.60 and has not been retaken
at 0.90.**

---

## THE 360 CLIP — BUILT, VERIFIED, AND CUT

The owner supplied `spine360.mp4` and asked for it immediately before the twin
serpents in `entrance-lab.html`, matched to the spine's size. It was built by a
subagent, verified working, and then **cut on the owner's call.** Reverted
wholesale; `entrance-lab.html` is back at `HEAD` and the asset is gone. The
original is untouched in `Downloads`.

**Record why, so nobody rebuilds it blind.**

- **The clip:** 4160×1992, 5.042s, 121 frames at exactly 24.0fps, H.264
  (`avc1`), **no audio track**, faststart already set, 7,868,887 bytes
  (~12.5 Mbps). Metadata read by parsing the MP4 atoms directly in Python —
  **there is no ffmpeg or ffprobe on this box.**
- **The spine occupies 59–106px of the 4160px frame** (1.4–2.6%, widest when it
  turns its broad side), centred within ~12px of frame centre. The wide margins
  are **not empty** — they carry CALIBRATION-style readout that types in across
  the clip. An early recommendation in this session to crop to the central band
  was **wrong** and would have destroyed them.
- **The registration worked.** Measured 0px error in both axes, with the clip's
  spine height landing at 666.41px against the page's 666.42px.
- **THE KILLER IS MOTION BLUR, AND IT IS IN THE RENDER.** Horizontal gradient
  energy at the clip's first and last frames is **0.85× the mid-turn value** —
  the ends are, if anything, *softer* than the middle. It is a constant-rate
  turntable with blur baked into every frame including frame 0. **There is no
  frame at rest to cross-fade to**, so no cross-fade length, easing curve or
  playback rate reconciles it with the page's sharp wireframe. Playback was
  measured at exactly native rate (5.047s wall clock, 121/121 frames, 24.0fps)
  and tried at 1.5×; neither was the problem.
- **If it is ever revisited, the clip needs re-rendering with ease-in/out at
  the ends** so the first and last frames are sharp. Nothing else will do it.

Two things worth keeping from the attempt:

- **`.spine__anat` carries a `spine-breathe` scaleY animation**, so
  `getBoundingClientRect()` reads up to 3% taller than its layout box — 994.85px
  against a true 972px at 1920×1080. **Measure the layout box.**
- **Real Chrome decodes H.264; Playwright's bundled Chromium does not.**
  `p.chromium.launch(channel="chrome")` gives a headless browser with the
  decoder (`canPlayType` = `"probably"`), which retires 28's "any mp4 check
  needs a VP9 stand-in". The in-app browser decodes it too.

---

## `file://` — THE SESSION'S MOST EXPENSIVE LESSON

The owner reported the entrance wordmark rendering as **flat solid letters with
no texture**. It was chased through the grain mask, DPR, the develop animation
and the font gate. **Nothing was wrong with the code.** The page had been opened
from Explorer, via a `links.html` that was itself on `file://` — and every link
in it is relative, so the whole worktree was being browsed that way.

**Measured in Chrome over `file://`:** `assets/hero/wordmark-grain.png`,
`assets/hero/cloud-mask.webp` and `data/tracks.json` all fail with
`ERR_FAILED` ("Access to image at 'file:///…' has been blocked"). Over
`scripts/serve.py` all three return 200.

The grain mask has two layers composited with `add`. When the PNG fails, the
uniform lift layer survives alone and the ink renders flat — **it looks exactly
like a design regression and logs nothing a casual look would catch.**
Reproduced deliberately by blocking the request; the render matched the report.

`links.html` now detects `location.protocol === 'file:'` and shows a red banner
plus a changed document title. It defaults to `display: none` in CSS and is
switched on by script, so JS-off shows nothing rather than an unverifiable
warning. **Do not remove it** — a future session will see a banner that never
fires on their machine and mistake it for noise.

**Two false diagnoses were published to the owner during this chase** before
the real one — both caused by taking an element screenshot of content that was
invisible (`.wm__line` sits at `opacity: 0` until `.is-inked`) and reading the
background behind it as "flat texture". **An element screenshot is not evidence
that the element is visible.** Check computed opacity on the painting element
itself, not just its ancestors.

---

## The README

Rewritten against this branch — the old one was dated 4 August and described
`main`. Four substantive corrections:

- **It told readers to serve with `python -m http.server`**, which silently
  breaks every video seek in this repo. Now `python scripts/serve.py`, with the
  reason.
- **"Five pages"** → eight plus the `music.html` redirect, with a separate
  inventory of the ~17 lab harnesses that must never deploy.
- **"Backgrounds are index.html only"** → star-bg on six public pages, spine-bg
  on six.
- **It claimed the deploy workflow excludes everything internal and fails the
  build otherwise.** It does not — see below.

Also added: the branch table (this branch is 66 commits ahead of `main`), the
build counters, and the hard-won oddities.

---

## Do not do these

Everything in 19–28's lists still stands. Additionally:

- **Do not judge anything over `file://`.** Assets fail silently and the page
  lies to you. Serve it.
- **Do not reintroduce a group `opacity` on the footer band.** It composites
  toward the backdrop and inverts over the lit nebula. Dim the ink colours.
- **Do not take the band's keys below `--color-gray-300`.** `gray-400` is
  3.94:1 — measured, under AA, no argument.
- **Do not measure a text-shadow against the bare backdrop.** It will read as
  doing nothing. Capture the backdrop with the shadow painted and the fill
  transparent.
- **Do not trust an element screenshot as proof the element is visible.**
- **Do not conclude a subagent is dead from a 0-byte transcript and no visible
  process.** One was killed that way this session while it was mid-work and
  nearly finished. Send it a message instead.
- **Do not rebuild the 360 from the same clip.** The blur is in the render.
- **Do not re-tune the coil in `js/spine-coil.js` alone.** `coil-lab.html`
  overrides it with CSS variables.

---

## Verified vs. asserted

**Verified by tooling, and looked at:**
- Every contrast number above, by alpha recovery against real pixels with
  animations paused, at the viewports and phases stated.
- The footer at four viewports for reflow and overflow; the about page at three
  for caption removal, with every reveal fired.
- The 360's registration (0px), playback rate (24.0fps native, and at 1.5×),
  the full entrance sequence including the serpents running after it, and the
  clip's per-frame blur — all before it was cut.
- The `file://` failure, reproduced deliberately and compared against the
  owner's report.
- `links.html` banner on both protocols; 26 internal links all 200.
- Anton and the other four webfonts loading in the harness.

**Asserted / NOT verified:**
- **The shadow's isolated contribution** to the footer band — see the trap note.
- **The footer's OPEN chip has never been judged.** It is
  `rgba(var(--node-color), 0.75)`, so its contrast depends on the row's node
  colour. STANDBY's fix does not cover it.
- **The about page's remaining elements at 1280×720** — measured only in an
  early run that had a nav-crop artifact; those numbers were discarded, not
  reported.
- Safari/Firefox anything — **neither is installed for Playwright** (~300MB
  download, offered and not taken). The glass fallback remains unseen.
- The magazine layout and the footer on a real phone.

---

## Still open

1. **The deploy workflow leak gap** (27 item 3, now documented in the README but
   still live in the workflow). `--exclude='./HANDOFF*.md'` **does not match a
   single `V2HANDOFF` file**, and the leak guard at the "Fail if anything
   internal slipped through" step checks `-name 'HANDOFF*'` — **the safety net
   has the identical hole as the thing it guards.** Also unexcluded: the master
   prompt, all ~17 `*-lab.html`, `links.html`, `scripts/`, `design/`. **Fix
   before first deploy.** This is now the top item.
2. **The about page's crimson** — parked by owner decision, evidence in the CSS.
3. **The footer's OPEN chip** — never judged.
4. **Graduating the navigator to production** (28 item 4) — unchanged. The
   entrance + navigator + reading stack still has not replaced or joined
   `index.html`.
5. **The calibration frame clamp for cards** — 28 item 2. Owner said to ignore
   it this session; measurements are still in 28 if it comes back.
6. `music.html` and `hero-timeline-lab.html` still black.
7. Safari/Firefox glass fallback; mobile pass on a real device.
8. **What PURCHASE should do** (26 item 4) — unchanged.
9. Lab staleness (28 item 8): `music-collapse-lab.html`,
   `spine-card-glass-lab.html`, `hero-scrub-lab.html`.
10. Deploy/DNS; metadata + controls redesign; `assets/messengers/*.jpg` → webp;
    Range layers 2 and 5; tuner integration; Archive wrap — unchanged.

**Closed since 28:** the footer band contrast decision (shipped, measured); the
STANDBY chip; the about page's running prose over the lit nebula (28's last
correction — now measured and fixed); the image captions; `deliver/` (finally);
the coil tuner values; the README's staleness; the 360 question (answered by
building it and cutting it).

---

## Committing this

This handoff needs its own commit:

```
git add "V2HANDOFF 29.md"
git commit -m "docs: V2HANDOFF 29 - the footer band settled, about judged, the 360 cut, and file://"
git push
git status
```

`working tree clean` at the end is the proof.

---

## Starting the next V2 chat

Attach this file (`V2HANDOFF 29.md`). `28` still owns the magazine about page
and connect.html; `27` the navigator merge and merch; `26` the footer, glass and
field lab. The new session needs folder access to
`C:\Users\Haight\Desktop\kundalini-spines-spine-ui` (the V2 worktree, **not**
production) and should confirm `feature/spine-ui-v2` before editing.

**Serve with `python scripts/serve.py` and browse over `http://`. Not
`file://`.**

A good opening message:

> Here's the latest V2 handoff for Kundalini Spines. The footer band and the
> about page are settled on contrast, the coil has my numbers, and the 360 clip
> was cut. The deploy workflow's leak gap is the top open item — start there.
