# About page — magazine feature

Point Claude Code at this file. It describes a complete, drop-in replacement for
`about.html` on branch `feature/spine-ui-v2` of
`kundalinispines/kundalini-spines-site`.

## What to copy

| From (this folder)         | To (repo root)            | Action  |
| -------------------------- | ------------------------- | ------- |
| `about.html`               | `about.html`              | replace |
| `css/about-feature.css`    | `css/about-feature.css`   | new     |
| `js/about-feature.js`      | `js/about-feature.js`     | new     |

No other file changes. `css/spine-bg.css` and `css/star-bg.css` are untouched by
design — the owner asked that the star background not be altered, and this page
is transparent so the sky and the spine column show straight through the
article. `--spine-build` and `--star-build` therefore do **not** need bumping.
`css/about-feature.css` carries its own `--about-build: 1` for the same reason
those exist: a cached stylesheet is indistinguishable from a change that did not
work.

## Assets that must exist before this page is correct

Three are already in the repo and are referenced unchanged:

- `assets/messengers/messenger-duo-burning-city.webp`
- `assets/messengers/messenger-sigils-arms-crossed.webp`
- `assets/messengers/messenger-alley-spine-chain.webp`

Three are new and are referenced at paths that do not exist yet. The owner
supplied the source files; they need adding under `assets/about/`:

| Referenced path                       | Source file supplied      | Notes |
| ------------------------------------- | ------------------------- | ----- |
| `assets/about/hero-corridor-duo.jpg`  | `duo.png`                 | The masthead image. Wide corridor shot, both figures. Convert to JPEG or WebP — it is the largest asset on the page and it is `fetchpriority="high"`. Do not crop: the `width`/`height` attributes in the markup are `2560x1440` and must be corrected if the exported size differs. |
| `assets/about/alley-solo.jpg`         | `haightalley.png`         | The mid-page full-bleed break. Same note on dimensions. |
| `assets/about/graveyard-shift.mp4`    | `graveyard video.mp4`     | Floated into section 06. Muted, looped, plays only while on screen. |

The previous version of the page also used
`assets/messengers/messenger-serpent-pendant.webp`. This version does not — four
figures at four sizes was one more than the read needed. The file is still in the
repo and nothing else references it; leave it, do not delete it.

## What changed, and why

**The copy is the owner's profile document, verbatim.** All ten sections, in
source order, not rewritten or shortened. The previous version had condensed
several paragraphs and dropped the closing "Decode the transmission." Those are
restored. If a line reads oddly it reads that way in the source — changing it is
an editorial decision, not a layout one.

**The masthead animates on scroll.** A 200vh track with a sticky 100vh stage;
the two words of the headline wipe up out of a `clip-path` crop while the opener
photograph parallaxes behind them at ~40% of scroll speed. Progress is measured
against the track's own height, so the reveal lands at the same point in the
reader's scroll on any viewport, and the reader controls it — there is no timer.
`js/about-feature.js` writes only `clip-path` and `transform`, on
`requestAnimationFrame`, from a passive scroll listener.

It reads scroll POSITION rather than wheel deltas, and that is load-bearing:
`js/scroll-weight.js` damps wheel scrolling toward the position the browser
would have jumped to, so anything listening for wheel events on this site
animates ahead of where the page actually is.

**Text wraps around the pictures.** Floated figures with `shape-outside`, at
three sizes, in sections 01, 03 and 06. The sections that carry a figure run
single-column at a 92ch measure; the sections that carry only prose run two-up.
That alternation is most of what gives the page its rhythm — keep it alternating
if sections are added.

The 92ch measure on figure sections is not a stylistic choice. A float only
wraps if the text is allowed to reach it: with the body capped at 72ch beside a
400px picture, the lines stop hundreds of pixels short and the figure reads as a
detached right-hand column with a hole beside it. 92ch minus the figure leaves
roughly a 50ch column, which is a real magazine column.

**Anton is the one new typeface.** It runs the masthead, the section titles and
the pull lines only. Body stays Source Serif 4, labels and captions stay IBM
Plex Mono, the standfirst stays Big Shoulders Display. Anton ships a single
weight — asking for 700 anywhere gets a synthesised bold that smears at masthead
size, so `font-weight: 400` is set explicitly everywhere it is used.

**Nothing sets a background.** Not one rule in `about-feature.css` paints a
surface. Contrast over the sky comes from scrims on the images. Do not add a
panel behind the article to "fix" legibility without measuring the text against
the live sky first — this is the only page whose spine column renders, and its
polarity is deliberately inverted (HANDOFF 19).

## Do not do these

- **Do not shorten the 200vh hero track below ~180vh.** The whole reveal then
  completes in the first flick of a trackpad and reads as a jump cut.
- **Do not change `overflow-x: clip` to `hidden`** on `body` or on any ancestor
  of the masthead stage. `hidden` computes `overflow-y` to `auto`, which makes
  that element a scroll container, which becomes the sticky stage's nearest
  scrolling ancestor — so the stage stops sticking, the reveal finishes with the
  headline already half above the viewport, and the back half of the 200vh track
  renders as an empty black screen. This was measured both ways. `clip` clips
  identically and creates no scroll container.
- **Do not give `.ks-hero__stage` a `min-height`.** It had 600px, which pushed
  the headline and the scroll cue below the fold on any viewport shorter than
  that (measured at 540px tall: the cue sat at y=570). The stage is exactly one
  viewport.
- **Do not give `.ks-bleed img` an `aspect-ratio`.** Both full-bleed sources are
  standing full-length figures; every ratio wider than the native one removes
  the parts of a standing figure a reader most needs to see. This was measured
  on the previous version and the owner's words were "it looks wrong".
- **Do not put `autoplay` back on the video.** It is started and paused by an
  IntersectionObserver; on autoplay it runs for the whole visit, including the
  ~90% of the page where it is off screen.
- **Do not remove the `no-js` class from `<html>` or move
  `js/about-feature.js` earlier.** Every hidden starting state falls back to
  visible via `.no-js`; the script removes the class on its first line.
- **Do not rename `#story`, `#messengers` or `#ethos`.** The navigator lands on
  all three. Grep `js/spine-ui.js` first.
- Everything in HANDOFF 7–19's lists still stands.

## Verify before calling it done

The project standard is measure it, do not eyeball it. Serve over HTTP (the page
itself does not fetch, but the rest of the site does) and check in a real
browser:

1. **The reveal runs on scroll and completes.** Scroll to the bottom of the hero
   track and confirm both headline words are fully visible with `clip-path:
   none`-equivalent inset (`inset(0%...)`), the standfirst is at opacity 1, and
   the "Scroll" cue has faded out.
2. **No horizontal scrollbar at any width.** The full-bleed figures use
   `margin-inline: calc(50% - 50vw)` and `100vw` includes the scrollbar on
   desktop Chrome. Check 1440, 1024, 768 and 390.
3. **The floats actually wrap** at ≥881px — text on both sides of the figure's
   vertical span, no gutter hole — and drop to stacked below 880px.
4. **`prefers-reduced-motion: reduce`** shows the finished headline immediately
   and no element is left at opacity 0.
5. **With JavaScript disabled**, the whole page is readable and the headline is
   visible.
6. **The spine column still renders** and its polarity is unchanged from the
   current about page, at 1440 and at 390.

Read computed values in the browser rather than re-reading the files —
`about-feature.css` is comment-dense and a syntax error in it presents as a
silent no-op, not an error.
