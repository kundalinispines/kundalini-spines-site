# Kundalini Spines — Spine UI V2 Handoff 27

**Date:** August 11, 2026

Ninth handoff of the **Spine UI V2** track (branch `feature/spine-ui-v2`).
`26` owns the footer, the glass and the field lab; `25` the Music wrap; `24` the
wordmark and coil; `23` the entrance and the Range server; `19` the navigator.
The plain `HANDOFF 1`–`19` series documents the dormant production site on
`main` and is background reading only.

---

## The one-line version

**The navigator went from six nodes to five and gained a real destination.**
Story/Messengers/Ethos merged into one node — they already shared one href —
and Merchandise took one of the two freed vertebrae. `about.html` was rebuilt
twice: once from the master brand copy, then replaced by a magazine profile with
real names and dates. `merch.html` is new. **Two production pages were rendering
pure black** and are fixed. **index.html's primary navigation had been broken
since the footer shipped last session** and is fixed. Node geometry is now
derived rather than hand-written, so the sixth node is a one-line change.

---

## Corrections to earlier handoffs

- **26'S "LAST BLACK PAGE" CLAIM WAS WRONG, AND SO WAS MINE.** `css/star-bg.css`
  build 23 recorded that `transmissions/001.html` was "the last black page on
  the site". It was written from the five pages the handoff names.
  `archive/artwork/001.html` had the identical defect and was **worse**, because
  `archive.html:76` links straight to it — every archive card click landed on
  flat black. Found by a repo-wide sweep asking one question of every `.html`:
  does this file link `css/star-bg.css`? The build-24 comment records the
  correction. **Do not trust a "last one" claim not made by a full sweep.**

- **A PAGE CLASS IS NOT WHAT MAKES THE SKY RENDER.** I began this session
  believing a page needed (a) the stylesheet link, (b) an `html.page-*` class
  and (c) a matching block. Only (a) is load-bearing. Every `html.page-*` block
  in `star-bg.css` **ships empty** — they are tuning hooks. `index.html` has no
  block in that file at all and renders the sky fine. The class still matters
  for the `@media (max-width: 600px)` selector list (see "do not do these").

- **26's FOOTER VALUES ARE NOT THE ONLY THING SETTLED AGAINST BLACK.** Finding
  15 said the spine column is off on every page carrying the footer. True — but
  the *sky* is on, and it is bright. See "the footer band" below.

- **MY OWN OPACITY TABLE THIS SESSION WAS A MEASUREMENT ARTIFACT.** I measured
  `html::before` opacity across four pages, got 0.360 / 0.316 / 0.139 / 0.170,
  and reported archive and transmissions as "dimmed to ~40% of index". They are
  not. That pseudo-element runs `star-twinkle`, whose keyframes span 0.046 to
  0.460; I sampled four pages at random animation phase. The tell was in my own
  data — `::after` clustered within 0.008 across all four while `::before`
  varied 2.6-fold, exactly what phase-sampling predicts and not what a tuned dim
  would do. **Do not read an animated property with a single getComputedStyle
  call and call it a value.** `css/star-bg.css:596` already warns about this.

---

## Git state

- Branch `feature/spine-ui-v2`, worktree
  `C:\Users\Haight\Desktop\kundalini-spines-spine-ui`.
- Session start `c84ad87` (V2HANDOFF 26). One commit at the end of this session.
- **13 files modified, `merch.html` added, 13 asset files added** (7 source
  PNGs, 7 webp derivatives — see "the photographs").
- **`main` = `origin/main` = `13083d9`, untouched. No PR opened.**
- **THE PRODUCTION PAGES DRIFTED FURTHER FROM `main`.** 26 recorded the first
  drift (footer wiring). This session adds: a Merchandise nav entry on all six
  page-bearing files, the sky link on `archive/artwork/001.html`, and the
  `about.html` rewrite.

**A LINE-ENDING TRAP, CAUGHT BEFORE THE COMMIT AND WORTH KNOWING.** Several
edits were made with Python scripts. **Python's text mode on Windows translates
`\n` to `\r\n` on write**, so every file written that way flipped LF → CRLF and
`git diff` reported the whole file as changed: `index.html` showed **385 changed
lines for a one-line insertion**. The content was correct; the diff was noise.
Seven files were normalised back to LF before committing and the diff dropped to
`index.html +1`, `archive.html +2`, `transmissions.html +2`.
**Open Python file writes in binary mode, or pass `newline=''`, when editing
repo files on this box.** A polluted diff hides the real change from review and
makes every future blame useless.

---

## THE NAVIGATOR: SIX NODES TO FIVE

**The merge was the owner's call and the evidence supported it.** `story`,
`members` and `ethos` all pointed at the **same href** — `about.html`. Three
vertebrae, one destination. A navigator whose nodes are not distinct places is a
menu wearing a diagram's clothes.

| before | after |
|---|---|
| 01 Music · 02 Our Story · 03 The Messengers · 04 Our Ethos · 05 Archive · 06 Timeline | 01 Music · 02 Our Story · 03 Merchandise · 04 Archive · 05 Timeline |

The three former card bodies survive as the three paragraphs of the merged
node, in order. Of the three eyebrows only `Transmission` survived — it is the
one naming the site's own vocabulary rather than describing the section.

### Geometry is derived now, and this is the load-bearing change

`idx`, `side` and `y` were hand-written on every node. Changing the count meant
renumbering every idx, re-alternating every side and re-spacing every y —
fifteen hand edits per conceptual change, each silent if wrong. All three are
functions of array position and are computed at `js/spine-ui.js:~133`:

- `idx` — 1-based, zero-padded
- `side` — even index right, odd left (index 0 is Music, right, as always)
- `y` — evenly spaced between `RAIL_TOP` 14 and `RAIL_BOTTOM` 88

These reproduce the values previously typed by hand: the original six were
14/29/44/59/74/88 and the rule yields 14/28.8/…/88 — **the hand-written set was
these numbers rounded, so the rule was always the rule.**

**TO ADD THE SIXTH NODE BACK: add one object to the array. Nothing else.**
The owner has said they may want to. Do not reintroduce `idx`/`side`/`y` as
literals; a literal that disagrees with its position is the bug this removes.

### A hardcoded total that would have lied

`populateCard` read `n.idx + ' / 06'`. With five nodes every card would have
claimed to be one of six, contradicted by the vertebrae visible behind it, with
nothing erroring. Now derived from `NODES.length`. **Verified by real mouse
clicks, one page load each: `02 / 05`, `03 / 05`, `05 / 05`.**

---

## DEFECT — I BROKE MUSIC MODE, AND A SUBAGENT CAUGHT IT. FIXED.

**Deleting the node ids `members` and `ethos` silently broke the Music rail.**
`js/music-wrap.js` carried a hand-written seven-row `ACTIONS` table keyed on
those ids. The lookup returned null, `if (!el) return;` swallowed it, and:

- **Decode and Shuffle disappeared from Music.** No error, no console warning.
- `layoutRail` still divided the rail **seven** ways from `ACTIONS.length` while
  only five elements moved, leaving a **37-percentage-point hole** mid-spine.
- `toggleDecode`, `toggleShuffle` and `css/music-wrap.css:328` became dead code.

**My own verification missed it** — I checked the navigator and never opened
Music. A read-only QA subagent pointed at both changed files found it.

**Fix: `ACTIONS` is built from the live navigator DOM, not written out.** Three
positions are anchored because they are positional — the first node closes
Music, `purchase` is synthesised second, the last node is Sky — and the middle
takes `MIDDLE` in order, truncating to fit.

**SO THE SIXTH NODE RESTORES SHARE BY ITSELF.** Five nodes + purchase = six rail
slots = three middle, so Index/Decode/Shuffle fit and Share drops. Add a node
and the fourth middle slot reappears. That is why Share is still in `MIDDLE`
rather than deleted, and why it is last: truncation takes from the end.

**Measured after:** `CLOSE · PURCHASE RISE UP · INDEX · DECODE · SHUFFLE · SKY`
at 14 / 28.8 / 43.6 / 58.4 / 73.2 / 88 — evenly spaced, no hole, zero errors.

---

## DEFECT — index.html's PRIMARY NAV HAD BEEN BROKEN SINCE 26. FIXED.

Found while wiring Merch, and **it predates this session.**

`js/site-footer.js` deliberately **moves** anchor nodes rather than cloning, so
there is one copy of every link in the document and the one on screen is the one
a crawler read. Correct when the source is `.footer__nav`. But `index.html`
carries `footer--simple`, which has no nav list, so it falls back to harvesting
the page's **primary** navigation — and moving those nodes empties the header.

| index.html header | |
|---|---|
| `site-footer.js` blocked | Home · Music · Transmissions · Archive · About |
| `site-footer.js` running | **Music** |

Music survived only because its href is `#tracks`, which the harvest filter does
not match. **Confirmed pre-existing before claiming it:** `HEAD:index.html`
contains no Merchandise entry, yet the other four were already being stripped.

**Fix: clone on that fallback path only** (`js/site-footer.js:~87`). The
move-don't-clone contract is untouched everywhere it belongs. The duplication
this reintroduces is the ordinary kind — a footer repeating the header's links.
A gutted primary nav is not ordinary.

---

## THE SKY REACHES EVERY PAGE

Only a missing `<link>` to `css/star-bg.css` makes a page black.

| page | fix | build |
|---|---|---|
| `transmissions/001.html` | link + `page-transmission-detail` | 23 |
| `archive/artwork/001.html` | link (`../../`) + `page-artwork-detail` | 24 |
| `merch.html` | new page, wired from birth | 25 |

`--star-build` 22 → **25**. Every new class was added to the
`@media (max-width: 600px)` selector list in the same change.

**Still black, deliberately left:**

- **`music.html`** — production-shaped (tokens/base/components) but **nothing in
  the repo links to it**. Needs an owner decision: shipping or not?
- **`hero-timeline-lab.html`** — declares `class="page-home"` and then never
  links the stylesheet. A half-wire, not a decision. One line.
- **`type-specimen-lab.html`** — flat black is defensible for a type specimen,
  but its `page-specimen` class exists nowhere in `css/`.
- `raster-test*.html`, `transmissions-option*.html` — black by design, leave.

---

## MERCHANDISE — NEW NODE, NEW PAGE

`merch.html` is built from `archive.html`'s conventions: same head order, same
header, same footer, `class="page-merch"`, no new stylesheet, **zero new CSS
class names** (it reuses `.empty-state` for the placeholders).

**NO PRICES AND NO BUY CONTROLS ANYWHERE, and that is deliberate.** 26's open
item 4 still stands: `links.download` is null on all 28 tracks and the `"$1"` at
`track-experience.js:804` is hardcoded. The page says outright there is no
store, no price list and no order to place. **Do not "finish" it by inventing a
checkout.** The one live route is `mailto:kundalinispines@gmail.com`.

The node is `kind: 'card'`, not `'immersive'` — immersive nodes take over the
viewport and promise something is behind the click. Promote it when there is.

### The nav wiring, and the label decision

**`Merchandise`, not `Merch` — settled by measurement, not taste.** A subagent
flagged a clipping risk at tablet width. Measured at 769px (the tightest desktop
width before the mobile menu) the link row is 520px against 613px available —
**93px of headroom**. Both fit at every width, so the longer word wins for
consistency with the node title.

12 insertion points: header nav on all 7 pages, footer nav on the 5 with one,
plus `sitemap.xml` (priority 0.6) and `data/site.json`. **`index.html` needed no
footer edit** — `footer--simple` populates from the header. Every relative path
was followed and returned 200: `merch.html` / `../merch.html` / `../../merch.html`.

---

## about.html — REBUILT TWICE

**First from the master brand-copy document, then replaced by the magazine
profile.** The second replaced the first rather than merging, and the reason is
worth keeping: the brand copy describes the project from inside its own
mythology — short declarative lines, no names, no dates. The profile is
journalism about real people. Running both makes the page argue with itself
about whether the reader is being told a fact or shown a symbol.

**Three anchors are load-bearing: `#story`, `#messengers`, `#ethos`** — where
each retired node's strand landed. One nav button does not have to mean one
arrival point. **Do not rename them without grepping `js/spine-ui.js`.**

**THE PHOTOGRAPHS ARE NOT ATTRIBUTED TO INDIVIDUALS, ON PURPOSE.** The profile
says in as many words that neither member is treated as the obvious frontman.
Captions describe the frame ("Alley · vertebrae chain"), never the man in it.
Guessing which figure is Prophocie and which is Haight would put a wrong name on
a real person. **Do not add member names to captions without being told which
is which.**

### The magazine layout — four images, four treatments

A magazine never runs four pictures the same size in the same place.

| image | treatment |
|---|---|
| duo burning city | full-bleed opener, **native ratio, no crop** |
| alley spine chain | prose-left / portrait-right spread, 3:4 crop |
| sigils arms crossed | breakout, hangs 6rem past the measure |
| serpent pendant | inline cut, floated, text wraps it |

**DO NOT PUT AN ASPECT-RATIO ON THE OPENER.** It shipped at `16/9` +
`object-fit: cover` and the owner's words were *"cropped at the top and the
bottom. It looks wrong."* The source is 1448×1086 (4:3) with both figures
full-length, head near the top edge and boots near the bottom. Arithmetic: 16/9
keeps only 12.5%–87.5% of the height, and even a gentle 3/2 keeps 5.6%–94.4%.
**No `object-position` rescues it — the subject spans the whole axis being
cropped.** The image runs at its own ratio and the layout bends instead. If it
must be shorter, stop full-bleeding it (a narrower container scales height down
proportionally); do not re-crop.

**A FLOAT THAT NOTHING FLOWS AROUND IS JUST A BADLY PLACED IMAGE.** The inline
cut first floated to the container edge while `.ks-copy` kept its 68ch cap:
measured at 1440 the text stopped at x=660 and the image sat at x=1035, leaving
a 375px hole. Every assertion passed. `.ks-flow` widens the measure for that one
section so lines reach the picture (~50ch beside it).

---

## The photographs

Seven supplied, **four used**, all seven kept on disk at the owner's
instruction.

| | PNG | webp | saved |
|---|---|---|---|
| 4 square frames (1024²→800²) | 7.08 MB | 0.17 MB | 97.7% |
| 3 wide plates (native 1448) | 5.60 MB | 0.40 MB | 92.8% |
| **total** | **12.68 MB** | **0.57 MB** | **95.5%** |

**Every webp was verified by DECODING it**, not by trusting the encoder's exit
code — 26's finding 6 is why that distinction is written down. The three wide
plates keep native width because two are turnaround reference sheets whose value
is detail. Unused on the page: `messenger-wet-street-night`, `messenger-sheet-01`,
`messenger-sheet-02`, and both original `messenger-a/b-portrait.jpg`.

Also fixed: both portraits declared `width="1200" height="1500"` and are
actually **928×1152** (26's open item 9).

---

## THE FIELD READINGS ARE IN entrance-lab

All nine now mount over the **real** stack — real sky, real navigator, real
glass — for the first time. 26 records that the six originals were built by five
parallel agents, every one of them blind. **Press 1–9; 1 is the control**, so
the page opens exactly as it did before and the readings are opt-in.

**NO ARROW-KEY STEPPING HERE, unlike the lab, and it is not an oversight.**
`js/spine-ui.js:242`, `js/music-wrap.js:378` and `js/track-experience.js:178`
all bind arrows on **elements** (navbar, carousel row). A document-level arrow
handler fires *in addition*, so arrowing the navbar would silently also step the
field reading. Digits are bound nowhere in the stack. Typing in an input is
guarded.

Verified: all nine mount, `v-*` scoping flips, `pointer-events: none` holds,
**clicks reach the spine in every reading**, zero console errors.

---

## Measured findings

All Aug 11 2026 via Playwright against `scripts/serve.py`, 1440×900 unless said.

1. **The footer's untested media queries hold.** 26 listed them as reasoned, not
   rendered. Measured at 1440 / 1000 / 640 / 375: **no horizontal overflow at
   any width**; at 375 it collapses to a single column with full-width rows.
2. **Zero 404s and zero console errors** across index, about, archive,
   transmissions, 001, artwork/001, merch, entrance-lab and music-lab.
3. **The card total, by real mouse click** — `02 / 05`, `03 / 05`, `05 / 05`.
4. **The Music rail after the fix** — six slots at 14 / 28.8 / 43.6 / 58.4 /
   73.2 / 88, no hole.
5. **`Merchandise` fits the nav at 769px** — 520px links against 613px
   available, 93px headroom. Both labels fit at every width tested.
6. **The magazine layout at six widths** (1440/1280/1100/860/700/375):
   **zero horizontal overflow everywhere**, which is the specific failure mode
   of the `100vw` full-bleed trick; 4 images, 0 broken, 0 duplicate ids.
7. **The opener is uncropped** — rendered 1440×1082 against native 1.3333
   (1440 ÷ 1.3333 = 1080; the 2px is rounding). Fixed header overlaps by 0px.
8. **`--space-5` and `--space-10` DO NOT EXIST** in `css/tokens.css`, which
   defines 1,2,3,4,6,8,12,16,24,32. Five declarations using them resolved to
   `0` — litanies and pull-quotes had no spacing at all. Silent, because a bad
   `var()` without a fallback computes to `unset`. **`hero-scrub-lab.html:369`
   still uses `var(--space-5)` and is broken the same way.**
9. **A page renders black if and only if it fails to link `css/star-bg.css`.**
   Page classes are tuning hooks; the blocks ship empty.
10. **The browser pane was showing `file://`, not the served page.** The edit
    hook auto-opens the raw file, and the pane **blocks raw `localhost` by
    policy** — it must be registered with `preview_start`. This looked exactly
    like "the page is broken". Re-point the pane after edits.

---

## Do not do these

Everything in 19–26's lists still stands. Additionally:

- **Do not write repo files with Python's default text mode on Windows.** It
  converts LF to CRLF and turns a one-line change into a 385-line diff. Use
  binary mode or `newline=''`.
- **Do not reintroduce `idx`/`side`/`y` as literals** in `js/spine-ui.js`. They
  are derived from array position; a literal that disagrees with its position is
  the exact bug that removal fixed.
- **Do not hand-write a table keyed on another module's node ids.** That is what
  broke Music. `ACTIONS` reads the live DOM now.
- **Do not delete `Share` from `music-wrap.js`'s `MIDDLE`.** It is dropped by
  truncation at five nodes and returns automatically at six.
- **Do not make `js/site-footer.js` move anchors on the `footer--simple`
  fallback path.** That path harvests the *primary* nav and moving it empties
  the header. Clone there; move everywhere else.
- **Do not put an `aspect-ratio` on `.ks-bleed img`.** See the arithmetic above.
- **Do not float an image next to text capped at 68ch** without widening the
  measure — the text never reaches it and you get a hole, not a wrap.
- **Do not add member names to the photo captions** without being told which
  figure is which.
- **Do not add prices or a checkout to `merch.html`.** The purchase mechanism is
  still an open decision.
- **Do not read an animated property with one `getComputedStyle` call** and
  report it as a value. See the corrections.
- **Do not trust a "last one" / "all of them" claim** that was not produced by a
  sweep of every file. Two such claims were wrong this session.

---

## Verified vs. asserted

**Verified by tooling, and looked at:**
- Both defects (Music rail, index nav), before and after, by comparing the
  script blocked against the script running rather than by inspection.
- The five-node navigator and the derived card totals, by real mouse clicks with
  one page load each — synthetic `.click()` did **not** activate a node, and
  clicking Music first swaps `#spine-nav` for the music rail and poisons every
  later click in the same run.
- All nine field readings mounting over the real stack.
- The magazine layout at six widths; the opener's crop, in pixels.
- Every Merch link followed to a `200`.
- Every webp decoded.
- **Screenshots taken and actually looked at at every stage**, and they caught
  what assertions did not — twice: the floated cut leaving a 375px hole, and the
  opener's crop, which the owner saw before any check did.

**Asserted / NOT verified:**
- **The footer instrument band's contrast finding is SIMULATED, not measured.**
  A subagent with no browser reproduced the CSS filter chain in numpy against
  the real assets. Its whole-frame figure brackets the stylesheet's own
  documented number (52.4% vs "53.3% at or below `#050505`"), which is a good
  sign — but see below, and re-measure in a browser before acting.
- **The magazine layout has not been seen on a real phone**, only at a 375px
  viewport.
- The `about.html` body copy sits over the bright arm of the nebula at 1440.
  Readable, but it is the same collision measured for `transmissions/001.html`
  and this page now carries far more sustained prose. **Not fixed, not judged.**
- 26's whole "asserted" list still stands: Safari/Firefox glass fallback never
  seen, glass filter cost unprofiled, no mobile pass, Range answered by proxy.

---

## THE FOOTER BAND — a finding nobody has acted on

Raised by a read-only agent, arithmetic independently checked, **not applied**
because it is a visible design change and therefore the owner's call.

`css/site-footer.css:192` uses `opacity: 0.7` as a brightness dial. It is a
**group** opacity: it composites the band toward whatever is behind it
(`0.7·ink + 0.3·backdrop`). The keys are `--color-gray-500` (`#4A4A4A`), so on
pure black they render at 53.3/255 — **1.67:1 contrast**. WCAG AA wants 4.5:1
for body text and 3:1 even for large text.

**The sky did not break the band; it exposed that the band was only ever legible
as a shape on an empty page.** Over the lit nebula it inverts — at the
backdrop's 99th percentile the keys are darker than the pixels behind them.

This also explains "GEOMETRY especially" better than position does: GEOMETRY's
meaning lives in its **keys**, RECORD's in its **values** (`--color-bone`, which
survives). Same failure everywhere; only GEOMETRY loses its content to it.

**Do not fix it with the five-track grid the file prescribes.** That note is
right for the *spine column* — a fixed 120px stripe a gutter can dodge. Measured
across viewports, GEOMETRY is the lit track at 1280–1600×900, worse at
1366×768, and **clean at 1920×1080 where RECORD is lit instead.** A gutter
cannot dodge something that changes tracks.

Proposed: `opacity: 1` plus `--color-gray-300` and the site's two-pass
`rgba(5,5,5)` shadow. **Consequence the owner must accept:** the values go from
an effective 6.67:1 to a real 13.28:1, so the band reads a step stronger.

Also flagged: `.sf-row__state--standby` (`site-footer.css:159`) measures 1.21:1
in the **link** tier — the part the file itself calls the footer's only job.

---

## Still open

1. **The footer band decision above.** Verify against real pixels first.
2. **`js/field/v-readout.js` hardcodes the old six-node table** at
   y 14/29/44/59/74/88 — positions no node occupies. Its own comment says it
   should read `window.__spineLab.nodes`. Loaded by `entrance-lab.html`, but
   only paints when a reading is on.
3. **THE DEPLOY WORKFLOW WOULD PUBLISH THE HANDOFFS.**
   `.github/workflows/deploy-pages.yml:54` excludes `./HANDOFF*.md`, which does
   **not** match `V2HANDOFF 19.md`–`V2HANDOFF 27.md` or the master prompt, and
   the leak-check guard at line 72 has the identical gap. Those files carry
   local Windows paths and internal notes. ~14 `*-lab.html` harnesses and
   `scripts/` also publish. **Fix before first deploy.**
4. **PICK A FIELD READING.** Nine wait; they can now be judged over the real
   stack in `entrance-lab.html` (keys 1–9). CROP must be seen in motion — drive
   the pointer before capturing.
5. **`music.html` and `hero-timeline-lab.html` are still black.** Owner decision
   on the first; one line for the second.
6. **Confirm the glass fallback in Safari and Firefox.** 26 called this the top
   item. **Playwright can install Firefox and WebKit** (~300MB), which turns 26's
   "there is no other browser on this box" from a blocker into a download. Only
   Chromium is installed today.
7. **Mobile pass.** Nothing has been run on a real device.
8. **What PURCHASE should actually do** — unchanged from 26 item 4, and now also
   blocking `merch.html`.
9. **`about.html` prose over the lit nebula** — see "asserted".
10. Lab staleness: `music-collapse-lab.html` keys on `members`/`ethos`;
    `spine-card-glass-lab.html:567` hardcodes `02 / 06`.
11. **Deploy.** Pages disabled, DNS unset. Unchanged.
12. Metadata + controls redesign; `assets/messengers/*.jpg` → webp; Range layers
    2 and 5; tuner integration, Archive wrap — unchanged from 26 and 19.

**Closed since 26:** the two black production pages; the navigator merge;
Merchandise as node and page; the site-wide nav wiring; the about page (twice);
the field readings reaching the real stack; index.html's primary nav; the Music
rail regression; the portrait dimension bug; the footer's mobile queries,
verified rather than reasoned.

---

## A note on method

**Three of this session's real defects were found by something other than my own
verification.** The Music rail regression came from a read-only QA subagent
pointed at the files I had just changed. The opener's crop came from the owner
looking at the page. The `file://` confusion came from the owner saying the page
was broken. My checks passed in all three cases — because each confirmed what I
thought to ask.

26 said "assertions confirm what you thought to ask; screenshots show what you
did not." This session adds: **after a change that deletes an identifier, grep
the whole repo for it before declaring the change done.** `members` and `ethos`
were still referenced in a file I never opened, and nothing errored.

---

## Housekeeping

`scripts/serve.py` remains the serving command — **not `python -m http.server`**.
Playwright (Python, Chromium only) is the verification tool; the recipe is in
`.claude/skills/kundalini-session-start/SKILL.md`. The in-app browser pane needs
`preview_start` — it blocks raw `localhost` and the edit hook opens `file://`.

---

## Starting the next V2 chat

Attach this file (`V2HANDOFF 27.md`). `26` owns the footer, glass and field lab;
`25` the Music wrap; `24` the wordmark and coil; `23` the entrance and Range;
`19` the navigator. The new session needs folder access to
`C:\Users\Haight\Desktop\kundalini-spines-spine-ui` (the V2 worktree, **not**
production `kundalini-spines`) and should confirm `feature/spine-ui-v2` before
editing.

A good opening message:

> Here's the latest V2 handoff for Kundalini Spines (Spine UI V2 branch). The
> navigator is five nodes, merch.html is new, and about.html is now a magazine
> profile. The footer's instrument band has a measured contrast problem waiting
> on my decision, and the deploy workflow would leak the handoff files — start
> there.
