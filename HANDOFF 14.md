# Kundalini Spines — Session Handoff 14

**Date:** August 5, 2026

**Supersedes:** nothing wholesale. `HANDOFF 3`–`6` still own their material. `7` still owns the spine layer's architecture. `8` owns the glow band and the 4K regeneration. `9` owns the four\-band star field. `10` owns the kick\-reactive rebuild. `11` owns the WARP correction. `12` owns the mirror tile and the cloud mask. `13` owns the nebula/kick rewiring and the lightning exploration.

**What this document does:** it builds the lightning asset HANDOFF 13 recommended, records a cascade failure that would have shipped a *half\-working* sky, corrects several of HANDOFF 13's measurements, and closes an item that turned out never to have been open. Everything below was measured in a real browser on the owner's machine unless it says otherwise.

* * *

## The one\-line version

**The lightning asset exists, is registered to the sky, and is ready to wire in — section 4 has the exact shape to build, and it is the top of the next session's list.** Page\-scoped tuning now anchors to `<html>`, because anchoring it to `<body>` would have moved three of the four star bands and left the nebula inert, silently.

## Corrections to earlier handoffs — read first

**1\. "Move the tuner to the about page" was never a task. It was already there.** Loading `about.html?tune` produced the full panel, all 33 sliders, and `[tune] 33 sliders, all with hover tips`. HANDOFF 13's `[data-spine-from]` generalisation carried the tuner across with the spine. The panel even self\-reported the kick situation in red. The real blocker was never the panel — it was that the tuner writes to `:root`, which both pages share.

**2\. HANDOFF 13's alarm that the cloud `brightness()` is unreachable from mobile is STALE.** It was true when the value was hard\-coded `1.75`. Since build 15 the declaration reads `var(--star-cloud-bright)`, declared at `:root`. The phone fix is one line inside the existing `@media` block. The in\-file comment at `star-bg.css:818–825` still states the old, harder position and should be believed no further.

**3\. There are more mobile inversions than HANDOFF 13 lists, and one inverts a mechanism rather than a brightness.**

```
                     desktop    mobile     effect on a phone
  --star-cloud         0.20      0.21      known, minor
  --star-twinkle       0.46      0.75      twinkles 1.6x BRIGHTER
  --star-twinkle-hi    1.50      0.75      play button is a NO-OP
  --spine-lit          0         0.30      CHARGE FRONT RUNS BACKWARDS
  --spine-w          120px     390px       column 3.25x wider
```

`--spine-lit: 0` is the entire charge\-front design — it is what makes the lit region *darker* than dim so it can flash out of black. At `0.3` the region glows continuously and the flash has nothing to emerge from. This is not drift; it is the mechanism reversed. All five overrides were scaled off desktop values that have since moved.

**4\. The bolt candidates' black floors: the 17–28 band is wrong for one of three.** `bolt-solar-arc` measures **14 / 6 / 18** — green at 6, less than half the claimed lower bound. Crushing it as a 17–28 asset over\-subtracts green by 8–22 and tints it magenta.

**5\. The crush must subtract the per\-channel MODE, not the 1st percentile.** For `bolt-angular-geometry`, subtracting p1 (19/18/19) yields **1\.58% exact black**; subtracting mode\+1 (20/19/21) yields **88\.82%**. One LSB of blue is the whole difference. HANDOFF 13's 90.3% figure reproduces, but only at the right floor — and "subtract the floor" naively read gives the broken answer.

**6\. "Under screen that would lift the whole page by 4x its own floor" does not reproduce.** Screen over a black backdrop is exactly `opacity × source`; there is no 4x term. At flash 0.35 the angular floor adds \~6.7/255, about half of `--star-black: 13`.

**7\. The filament counts in HANDOFF 13 are undercounts.** Measured on the isolated delta: **11–14 distinct discharges**, not 8–10. Span **2–17% of frame width, median 5.5%** — a quarter are under 2.2%, so "5–15%" describes only the upper half. Stroke width is **0\.31% of frame width (median 6px)**; anyone reading the 5–15% figure as a width will draw it 20–50x too fat.

* * *

## The cascade failure — the most transferable thing here

Page\-scoped tuning was first implemented as a class on `<body>`, with `body.page-about { … }` blocks. That is the obvious shape and it is wrong. MEASURED on the live page:

```
  body.style.setProperty('--star-cloud-bright', '9')
    -> getComputedStyle(body) reads 9              (body sees it)
    -> html::after filter stays brightness(2.2)    (the cloud layer does NOT)
```

Custom properties inherit **downward only**. `html::before` and `html::after` are pseudo\-elements of `html` and resolve variables from `html`. In this codebase `html::after` **is** the nebula, and `html::before` is one of the four star bands. So a body\-anchored block would have moved the three bands that live on `body` and `main`, and left the nebula and the fourth band completely inert — with balanced braces, no console error, and sliders that appear to work.

**A half\-working sky is a far worse failure than a broken one.** The fix, verified before shipping:

```
  html.page-home { --star-cloud-bright: 9 }
    -> html::after becomes brightness(9)            (reaches the cloud)
  then documentElement inline write of 4.4
    -> wins, 4.4                                    (tuner unaffected)
```

Because the tuner writes inline on `documentElement`, and inline beats a class on the same element, **no JS change to the read/write path was needed.** An earlier proposal to move those writes to `document.body` was investigated and is void — it would have broken `--kick` reaching the nebula for exactly the same reason.

### The specificity trap that comes with it

`:root` is `(0,1,0)`. `html.page-about` is `(0,2,0)`. **Media queries add nothing to specificity.** So the moment any variable lands in a page block, it outranks that variable's phone value in a bare `:root` mobile block. Both mobile blocks were widened:

```css
@media (max-width: 600px) {
  :root, html.page-home, html.page-about { … }   /* declarations unchanged */
}
```

Verified live via CSSOM: both `spine-bg.css` and `star-bg.css` now carry that selector list, and in both files the media block sits **after** the page blocks in source order — so at equal specificity the phone values win. A synthetic cascade replay returned `MOBILE_BLOCK_WINS`, and an inline write still returned `TUNER_WINS`.

* * *

## What else was measured

### 1\. The owner's target image is this site's own sky

Registration re\-derived independently, twice, by two methods: **scale 0.60650, offset (28, 326)**, high\-frequency NCC **0\.76–0.82** against `starfield-deep-4k.webp`. Individual stars line up. The lightning target is not a mood reference — it is this photograph with filaments painted on and roughly 1.15x brightening applied.

Three consequences fall out for free:

- **97\.7% of filament pixels already lie inside `cloud-mask.webp` at alpha ≥ 0.5.** The shipped mask is already the correct containment shape.
- Filament hue **211\.6–213.5°** against the cloud layer's post\-filter **212\.9°** — a match to within 1.4°.
- The target's frame is a **hand\-picked crop**\: 83.6% of sky width, 62.1% of height, panned \~7% left and \~6% down from centre. It is not what `cover` produces.

### 2\. The asset, as built

`assets/hero/nebula-lightning-4k.webp` (3840×2144, **52 KB**) and `assets/hero/nebula-lightning.webp` (1920×1072, **21 KB**), the same half\-size convention as `cloud-mask.webp`.

Built as a **filament\-only delta**, not a nebula\+filaments composite: robust per\-channel photometric fit, subtract the registered sky, high\-pass to drop the colour\-grade residual, discriminate filaments from star residuals by *blueness* (filaments are cold, star residuals are warm), keep only connected components with bbox diagonal ≥ 25px, then follow the ridge.

```
  exact black          96.72%
  residual floor       0.000 / 0.000 / 0.000   <- no crush needed
  mean luminance       1.003
  %frame > 0.5         3.14      > 2   2.56     > 8   1.84
  adds at flash 0.35   0.351 /255 mean
```

For scale: the cloud layer moves light on \~50% of frame and adds \~1.94/255 at its own peak. The lightning layer is cheap. It will likely want a `brightness()` multiplier of its own rather than a higher flash.

**Why delta and not composite:** the full crushed target as a screen layer adds 3.97/255 at flash 0.275 and 14.44/255 at full — it would nearly double the page's whole light budget and duplicate a nebula the sky already paints.

### 3\. What the asset does NOT cover

**30\.7% of the nebula's mask weight lies outside the crop the target image covers.** At desktop viewports 25–30% of the visible nebula has no filaments. It reads acceptably because the uncovered region is the fainter outer wing, but a v2 needs a second pass. Do not mistake this for "done".

### 4\. The insertion point, proven on real hardware — START HERE NEXT SESSION

A prototype layer was injected into the live page and photographed: a `<div>` as a `body` child, `position: fixed; inset: 0; z-index: -1; mix-blend-mode: screen`. It composited **identically to `body::before`** — no grey rectangle, blacks held. This is the route.

**Why a new DOM node and not a pseudo\-element:** all six full\-viewport slots are already taken — `body::before` (base sky), `body::after` \+ `html::before` \+ `main::before` \+ `main::after` (the four star bands), `html::after` (the nebula). There is no seventh. Injecting the node from `js/spine-bg.js` rather than putting it in the HTML preserves the property that `star-bg.css` is one `<link>` with no markup.

**Do not** borrow a pseudo\-element from a section instead. `.track-experience`, `.newsletter`, `.footer` and `main > .section` are all `position: relative; z-index: 1` — real stacking contexts. A `z-index: -1` screened pseudo inside one blends against that box's transparent backdrop and renders as a faint grey rectangle. That is the HANDOFF 7 trap.

**The shape to build:**

```
  <div class="star-bolt">   injected as a body child, beside the .spine-bg build

  .star-bolt {
    position: fixed; inset: 0; z-index: -1; pointer-events: none;
    mix-blend-mode: screen;
    background: url(../assets/hero/nebula-lightning-4k.webp) 50% 50% / cover no-repeat;
    filter: brightness(var(--star-bolt-bright));   /* static, unclamped */
    opacity: 0;                                    /* idle */
  }
  :root.is-spine-kicking .star-bolt {
    opacity: calc(var(--kick) * var(--kick-bolt));  /* per-frame, compositor */
  }
```

**Four things that make this layer easier than the nebula was:**

1. **Idle opacity 0 means the full 0→1.0 kick range is usable.** `--kick-cloud` is capped at 0.64 only because the nebula spends headroom on a `× 1.8` resting baseline. Lightning has no resting state, so nothing is spent.
2. **Keep the same filter/opacity split as the cloud layer** — static brightness in `filter`, per\-frame movement in `opacity`. This layer carries no blur so the repaint cost is lower, but the discipline still applies.
3. **The asset is pre\-contained.** It was already multiplied by `cloud-mask.webp`, so it cannot leak light outside the nebula regardless of what the opacity does.
4. **No black\-floor work needed.** Measured floor is `0.000` per channel; 96.72% of the frame is exactly black.

**Five things to get right, each of which has bitten this project before:**

- **Register the asset to the sky's aspect.** It is 3840×2144, exactly matching `starfield-deep-4k.webp`. Do not resize it to something else or `cover` will crop it differently from the photograph at some window shapes and the filaments will slide against the nebula on resize.
- **Overscan by negative `inset`, never `transform`.**
- **`--kick` only exists on index.html.** The detector attaches to `.track-experience`. Scope the animated rule to `:root.is-spine-kicking` so `--kick` is never referenced elsewhere; with idle opacity 0 the layer is simply invisible on the other four pages. Make that a stated decision, not an accident.
- **Add the selector to the reduced\-motion rule** in `css/star-bg.css` and to `STAR_LAYERS` in `js/spine-bg.js`, or a view mode will hide five of six layers and leave this one lit.
- **Register the new variables in the tuner** — `FIELDS`, `TIPS` (no apostrophes), and `GROUPS`, or they land in the red ungrouped block. Name any variants `-a` / `-b` / `-c`; digits now work in the paste regex but no shipped variable uses them yet.

**Expected cost, so you know whether it is behaving:** at flash 0.35 the asset adds **0\.351/255** mean and moves light on \~3% of frame, against the cloud layer's \~1.94/255 on \~50%. If it looks too faint, raise `--star-bolt-bright`, not the flash — the flash is the kick's range and spending it on brightness is how `--star-cloud` ended up in dead zone.

### 5\. A useful negative result: do not generate the filaments procedurally

Midpoint displacement with branching, seeded by `dens³` off the cloud mask, was implemented and rendered live. Containment worked perfectly and the cost was low (95.5% black, 0.73/255 at flash 0.35). **But the geometry reads as twigs** — organic forks and tapering, like dead tree branches. Lightning wants near\-straight runs with occasional perpendicular spurs. This independently reproduces HANDOFF 13's finding from the other direction: the compositing was never the hard part.

One smaller note from that run: the mask extends past what reads as visible nebula, so density\-weighted seeding put filaments in areas that look like empty sky. Anchor off visible luminance, or use a higher exponent.

## The about.html tuning, and a polarity that looks like a bug

`about.html` was dialed live and its values installed as `html.page-about` in `css/spine-bg.css`. **Only the nine values that differ from the baseline were written.** Copy CSS emits all 34 sliders; 25 were byte\-identical to `:root` and were deliberately dropped so that later baseline improvements still reach this page.

```
  --spine-dim           0.22   ->  0.13
  --spine-lit           0      ->  1.48
  --spine-glow          0      ->  0.58
  --spine-feather       430px  ->  10px
  --spine-from          0px    ->  690px
  --spine-offset        140px  ->  680px
  --spine-bias          1.3    ->  -0.7
  --spine-band          800px  ->  0px
  --spine-band-feather  600px  ->  800px
```

`star-bg.css` and `base.css` deliberately have **no** `html.page-about` block — nothing sky\-side changed.

**THE POLARITY IS INVERTED RELATIVE TO THE HOME PAGE, ON PURPOSE.** On `index.html`, `--spine-lit: 0` is *darker* than `--spine-dim: 0.22`\: the charge front darkens the column so the charged region sits invisible until a drum hit flashes it out of black at `--kick-flash: 0.72`. There is no drum on `about.html` — no `.track-experience`, so the detector never attaches and `--kick` is never written — which means a flash\-out\-of\-black design can never fire there and the charged region would stay dark forever. So that page runs the front the other way: `1.48` is well above dim, and the front **brightens** as it passes. **Do not "restore" it to 0 to match the home page.** The two pages want opposite polarities precisely because only one of them has a kick.

### The spine's start is now a control, not an attribute

`data-spine-from` on `about.html` moved from the Messengers section up to the first section, and a new variable **`--spine-from`** (slider `start`, −2000…1000px, negative is higher) shifts the layer's start off that anchor. It moves the **region**, so the charge front is remapped over the new span and still finishes when the document bottoms out.

Do not confuse it with `--spine-offset`, which moves only the artwork inside a region that stays put. Both are useful and they are not substitutes.

**`--spine-from` is read by JavaScript, not by CSS** — `measure()` in `js/spine-bg.js` reads it off `documentElement`, because the layer's top and height are inline px and CSS cannot see where the anchor element sits. It therefore needs a remeasure to take effect; the slider handler and Apply\-pasted both call one. If you add another JS\-read variable, it needs the same treatment or its slider will look dead until something happens to fire a resize.

## Do not do these

- **Do not anchor page\-scoped variables to `<body>`.** See the measurement above. `html::before` and `html::after` can never see them, and the failure is silent and partial.
- **Do not shorten either mobile block's selector back to a bare `:root`.** Both `spine-bg.css` and `star-bg.css` need `:root, html.page-home, html.page-about`. Add any new page class to both lists in the same commit.
- **When you first paste a page block into `star-bg.css` or `base.css`, put it ABOVE the `@media (max-width: 600px)` block.** Neither file has one yet, so there is no existing slot to guide you. Paste it below and it beats the phone values by source order — the same trap through the back door.
- **Do not paste a Copy CSS block wholesale into a page block.** It emits all 34 sliders. Diff against `:root` first and keep only what differs, or you pin \~25 values to today's numbers and future baseline work silently stops reaching that page.
- **Do not "restore" `--spine-lit` on about.html to match the home page.** The inversion is deliberate; see above.
- **Do not move the tuner's reads/writes to `document.body`.** They must stay on `documentElement` or `--kick` stops reaching the nebula.
- **Do not bake the target frame directly.** It is a hand\-picked off\-centre crop with the site's own \~1.15x brightening already applied. Bake at full 3840×2144 sky registration.
- **Do not subtract the 1st percentile when crushing a generated asset.** Subtract the per\-channel mode, plus one. Measure first.
- **Do not trust a plain reload after editing `js/spine-bg.js` or an HTML file.** Both are cached independently of the CSS. This bit twice in one session — once producing a fix that appeared not to work, once producing a false report that `index.html` had lost its page class. **Ctrl\+Shift\+R, every time.** A `?cb=` query busts the HTML but not the JS.
- Everything in HANDOFF 7–13's "do not" lists still stands.

## What is deliberate, so nobody "fixes" it

- **`html.page-home` ships EMPTY; `html.page-about` carries exactly nine values.** A variable appears in a page block only when that page should actually differ. A page with no block inherits the `:root` baseline, which is unchanged.
- **`--spine-lit: 1.48` on about.html is above `--spine-dim`, inverting the home page's polarity.** There is no kick on that page. See the section above.
- **The tuner panel is capped at `max-width: 328px`.** It is `position: fixed` with no width, so it shrink\-to\-fits its own max\-content — and a `<p>` contributes its entire text as one unwrapped line no matter what `white-space` says. The prose explaining the hidden kick sliders measured the panel out to **1350px** on a 2560px screen. The cap leaves the home page's natural 327px untouched and forces every other page's prose to wrap.
- **Copy CSS still emits the hidden kick values on `about.html`.** Silent dropping is worse, and it keeps Apply\-pasted symmetric. The diff\-before\-pasting rule above is what protects against it.
- **The coverage check reports 34 on both pages.** It is a property of the source, not the page. Counting only visible rows would print `[tune] 26 sliders` on about and read as eight missing tips.
- **Everything else in HANDOFF 13's deliberate list still holds.**

## Files changed this session

**Changed:**

- `css/spine-bg.css` — `html.page-home` (empty) and `html.page-about` (nine values) blocks under an unchanged `:root`; mobile selector list widened; `--spine-from` declared; \~80 lines of new comment recording the body\-vs\-html measurement and the about polarity. `--spine-build` 29 → **32**.
- `css/star-bg.css` — mobile selector list widened to match, declarations byte\-identical. **`--star-build` NOT bumped — still 15**, since no sky variable changed. Bump it if that bothers the next reader.
- `js/spine-bg.js` — Copy CSS emits the page\-scoped selector detected off `documentElement`, with a loud `:root` fallback; KICK group hidden where the detector cannot attach; Apply\-pasted regex widened to accept digits; panel capped at `max-width: 328px`; new `--spine-from` read in `measure()` with a `start` slider, remeasure hooks on slider input and on Apply\-pasted. FIELDS 33 → **34**.
- `index.html` — `class="page-home"` on `<html>`, `lang` preserved, `<body>` left bare.
- `about.html` — `class="page-about"` on `<html>`; `data-spine-from` moved from the Messengers section up to the first section.

**New:** `assets/hero/nebula-lightning-4k.webp` (52 KB), `assets/hero/nebula-lightning.webp` (21 KB).

**Fixed in passing:** the Apply\-pasted regex was `--(?:spine|scroll|star|kick)-[a-z-]+` — `[a-z-]` excludes digits, so any numbered variable was invisible to Apply\-pasted while Copy CSS emitted it happily. Now `[a-z0-9-]*[a-z0-9]`, with a trailing guard against punctuation.

## Still open

- **THE LIGHTNING LAYER IS NOT WIRED IN. This is the top of the next session's list.** The asset exists, the insertion point is proven on real hardware, and the exact shape to build is in section 4 above. No CSS or JS references it yet.
- **The asset covers \~70% of the nebula.** 30.7% of the mask's weight falls outside the crop the target image covered. Second pass needed for the outer wing — but wire in what exists first, since the uncovered region is the fainter outer part and may not matter at real viewports.
- **DNS for `kundalinispines.com`** — unchanged, still the single blocker on anything being reachable. Enable sequence in HANDOFF 5; do not enable Pages without the custom domain.
- **The mobile overrides are stale and three are inverted**, including `--spine-lit`, which reverses the charge\-front mechanism on phones. Note this is a *different* inversion from the deliberate one on about.html — the phone one is rot, the about one is a decision. Largest technical item after the lightning.
- **The ≤600px cascade fix was verified by CSSOM and synthetic replay, not at a real narrow viewport.** Chrome refused the window resize (`outerWidth: 0`, maximized). Worth one real check.
- **The snare detector is measured but not built.** Prove against all 28 samples before writing browser code.
- **Three of five pages are still flat black** — `archive.html`, `transmissions.html`, `music.html`.
- **`--kick-decay` is one envelope for everything.**
- **`TIPS` drift in `js/spine-bg.js`** — `--spine-lit` says 0.18 (ships 0), `--star-desync` says 1 (ships 0), `--kick-cloud` says dead above 0.51 (real limit 0.64), `--star-twinkle`/`-hi` claim they ship equal (0.46 vs 1.5), `--spine-w` cites 130px. Left alone deliberately; they are actively misleading.
- **`css/spine-bg.css` line 3 still says "Loaded by index.html only."** `about.html` links it too.
- **The comment in `js/spine-bg.js` claiming a runtime check enforces the no\-apostrophe rule in `TIPS` is false.** The check tests tip coverage only. A stray apostrophe kills the file before any check can run.
- **Buttondown deliverability unverified.** Instagram and X are owner\-supplied, not verified.
- **`explicit` is `null` on all 28 tracks;** streaming links all `null`; `data/releases.json` entirely `PLACEHOLDER`.
- **TikTok and Spotify accounts do not exist** — dead footer links, owner's decision, do not "fix" them.
- **The 885 MB masters folder is still backed up by nothing.**
- **27 × `assets/music/*-cover.jpg` and `full-zoom-cover.webp` are tracked and referenced by nothing.**

**Closed since HANDOFF 13:**

- **"Move the tuner to about.html."** It was already there and had been since build 29.
- **"The spine on about.html cannot be tuned independently."** Page\-scoped blocks anchored to `<html>`, and about.html is now tuned.
- **"The lightning layer needs an asset."** Built, measured, and tested live.
- **"The spine starts too far down on about.html."** Anchor moved, and the start is now a slider rather than an HTML attribute.
- **The Apply\-pasted digit bug**, which nobody had noticed because no shipped variable has a digit yet.
- **The tuner panel blowing out to half the screen on about.html.**

## The closing line, again

HANDOFF 5 and 6 ended on *measure it, do not eyeball it*. 7 added *know what your instrument cannot see*. 8 added *when a number refuses to move, ask what it is actually measuring*. 9 added *take the baseline*. 10 added *check that it measures the thing you care about*. 11 added *check the machine*. 12 added *check the exception too*. 13 added *know where every control's ceiling is*.

This session added one about location. `--star-cloud-bright` set on `body` reads back as `9` from `getComputedStyle(body)`. Every check you would naturally run says the change worked. The nebula does not move, because the nebula is painted by a pseudo\-element of `html` and custom properties only inherit downward. The value was correct, the syntax was correct, and it was in the wrong place — and the sky would have half\-responded, which no one would have read as a bug.

> Measure it. Know what your instrument cannot see. When a number refuses to move, ask what it is actually measuring. Take the baseline. Check that it measures the thing you care about. Check the machine. Check the exception too. Know where every control's ceiling is. And check where the value *lives*, not just what it is — a variable on the wrong element reads back correct everywhere you look and reaches nothing you care about.
