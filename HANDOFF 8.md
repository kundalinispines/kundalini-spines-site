# Kundalini Spines — Session Handoff 8

**Date:** August 4, 2026

**Supersedes:** nothing wholesale. `HANDOFF 3`, `4`, `5` and `6` all still own their material and remain required reading. `HANDOFF 7` is still the reference for the spine layer's architecture, but its **shipped values, its artwork and its "Still open" list are all out of date** — see the corrections below.

**Status:** The glow band is built and shipped, which closes HANDOFF 7's top request. The front page now also carries a star field, a twinkle layer, a scroll\-weight control, and 4K artwork for both backgrounds. Three separate bugs at the hero/carousel seam are fixed. The site still is not served anywhere — Pages is off and `kundalinispines.com` still does not resolve. Nothing this session changed what a visitor sees, because there are still no visitors.

* * *

## Corrections to earlier handoffs

**1\. HANDOFF 7's "the glow band" is CLOSED.** It is implemented, measured and tuned. The "attempted and reverted" section there is now history — the reason that attempt failed is recorded in `css/spine-bg.css` under `--spine-band`, and the working approach is the second mask layer that HANDOFF 7 guessed at but did not try.

**2\. HANDOFF 7's shipped values block is obsolete.** Every number changed. `css build` is now **22**, and there is a second counter, `--star-build`, now at **5**. The current block is under "Shipped values" below.

**3\. `assets/hero/spine-column-moonlight.webp` is no longer the shipped artwork.** It has been replaced by `spine-column-moonlight-4k.webp` — same image, twice the linear resolution, Metatron's Cube removed. The old file is kept beside it.

**4\. HANDOFF 7's `--mask-sides` rationale no longer applies.** It says the 18% side fade is load\-bearing because the artwork's field reads `(6,7,7)` and lifts the page. The 4K artwork's field is clamped to true black, so there is nothing left to lift. The fade is kept as insurance and can be narrowed or dropped by a future session — but narrowing it buys no column width, because the column spans 0.335–0.665 of the frame and the fade ends at 0.18.

**5\. HANDOFF 7 says "the tuning panel has fourteen controls."** It now has **twenty\-one**, across three stylesheets, and Copy CSS emits them grouped by destination file.

* * *

## What changed this session

| Area | Before | Now |
| --- | --- | --- |
| The lit zone | a half\-plane, no top edge | a band with a hard top edge, `--spine-band` / `--spine-band-feather` |
| Page background | flat black | star field from a hero\-video frame, fixed, screen\-blended |
| Star motion | — | twinkle on the star cores \+ a soft glow on the clouds, both louder while a sample plays |
| Scroll feel | native | `--scroll-weight`, wheel\-only damping, `js/scroll-weight.js` |
| Spine artwork | 1536×2752, Metatron's Cube | 3072×5504, cube removed, black\-clamped |
| Star artwork | — | 3840×2144 at 4K, from `messengers-hero-video.mp4` t \= 7.79s |
| Scrolled nav | `rgba(5,5,5,0.92)` \+ blur | opaque `var(--color-black)`, no blur |
| Carousel reveal | `translateY` on the section box | `translateY` on `.track-arc-wrap` |
| `#tracks` scroll anchor | `scroll-margin-top: 90px` | `calc(var(--nav-h) - 4px)`, measured live |
| Tuning panel | 14 controls | 21 controls, grouped Copy CSS, two new view modes |

**New files:** `css/star-bg.css`, `js/scroll-weight.js`, `assets/hero/starfield-deep.webp`, `assets/hero/starfield-deep-4k.webp`, `assets/hero/spine-column-moonlight-4k.webp`.

**Modified:** `css/spine-bg.css`, `css/base.css`, `css/components.css`, `css/track-experience.css`, `js/spine-bg.js`, `js/track-experience.js`, `js/nav.js`, `index.html`.

* * *

## The glow band

**Files:** `css/spine-bg.css`. `--spine-band` is the lit zone's height in px measured up from the charge front; `--spine-band-feather` is the softness of its top edge only.

**`--spine-band: 3000px` is OFF**, not 0. At 3000 the top edge clears the layer and the mask is pixel\-for\-pixel the old half\-plane. At 0 the band collapses onto the front and nothing is lit — legitimate, not a bug. The slider's far right is "no band"; its far left is "no glow".

**Why the previous attempt failed.** HANDOFF 7 records adding two stops to `--mask-charge`, guarded with `max()`, parsing correctly and having no effect. The likely reason: every added stop has to stay monotonic against the front's existing three at *every* value of `--charge`, `--spine-feather` and `--spine-bias`, and **CSS silently clamps out\-of\-order stops rather than failing** — so a wrong guard reads as "no effect" instead of as an error. The band is now its own mask layer intersected with the charge mask, so its two stops only ever have to be ordered against each other. That holds for any feather ≥ 0, unconditionally.

**The dim layer unions, it does not intersect.** `mask-composite: intersect, intersect, add`. The dim copy has to paint wherever the lit one does not, and that is now two disjoint regions — below the front *and* above the band's top edge. Intersecting would leave the column dark above the band instead of returning it to `--spine-dim`, which is what makes the band read as a lit stretch travelling through a continuous column rather than as the column ending.

**MEASURED**, lit layer in isolation at 1440×900 with the artwork swapped for a flat white column (the tuner's "mask only" view mode does this), front at viewport y 607:

```
band      top edge predicted   measured
3000px         -2400             —      off, half-plane
 400px           207           ~190
 300px           307           ~305
 200px           407           ~410
   0px           607           ~600     nothing lit
```

Taken at `--spine-feather: 10px`, before the front was retuned to 220px. The band's geometry is independent of the feather, but those numbers will not reproduce exactly at the shipped value.

**`max(1px, --spine-band-feather)` is a floor on the ramp, not on the slider.** At feather 0 the band's top stop and the dim layer's complementary stop land on the same position, and the rasteriser rounds them onto the same pixel row — so that row is painted by **both** layers, which under screen blending add. It rendered as a bright hairline on the hard edge: consecutive rows read 20 / **192** / 138. This is load\-bearing note 3 from HANDOFF 7 in miniature, one pixel tall. Forcing a 1px minimum ramp took the overshoot from **\+54 to \+5** luminance levels. `--spine-band-feather: 0` still means what the owner tuned it to mean.

* * *

## The star field

**Files:** `css/star-bg.css`, `assets/hero/starfield-deep-4k.webp`. One `<link>`, no markup, no script — it is `body::before`. Currently on `index.html` only; rollout to the other four pages is one link tag each.

It is a **frame of the hero video**, `messengers-hero-video.mp4` at **t \= 7.79s** (frame 187 of 210), regenerated at 4K with that frame as the reference. Not stock, not invented — the same footage already playing at the top of the page.

**It screens, it does not paint**, for the same structural reason the spine layer does. Half the frame is darker than `#050505`; painted normally it would drag the page's black below the floor everywhere the nebula is not, and **every text\-shadow on this site is `rgba(5,5,5,…)` precisely because that is the floor.** Measured with the layer isolated: floor stays exactly **5\.00 → 5.00**, page mean rises 7.71 → 10.86.

`position: fixed`, not a document\-height layer. Deep space does not scroll past you, and it avoids tiling a 1080px frame down a 3400px document where the seam would be a horizon line.

**The regeneration lifted the floor** — median luminance 2.08 → 4.30, field RGB `(0.1, 0.3, 5.5)` → `(2.0, 1.4, 10.3)`. Still 53% at or below page black against 60% before. `--star-dim` and `--star-sat` both attenuate it. Worth knowing before either slider goes up.

* * *

## Twinkle — got it wrong once, on the record

The first implementation **mirrored and scaled** the twinkle layer, on the theory that offsetting it would stop every star pulsing in lockstep. It did — by putting the winking points exactly where the sky has **no stars**. It was not making the stars twinkle, it was inventing a second set of them in the gaps. The owner caught it by eye immediately.

**Registered is the only correct answer.** Two layers now, both pixel\-registered with the base sky, no transform on the star one:

- `body::after` — the cores. `contrast(9)` crushes everything below roughly L 128 before compositing, so only the whitest points of the *existing* stars survive. Screened back over itself, a core at 0.85 goes to 0.98.
- `html::after` — the clouds. 22px blur, low amplitude, slow. Blur destroys the point structure, so no star can wink there; only the broad dust swells.

**MEASURED**, each layer frozen at opacity 1, delta sorted by how bright the base sky already is:

```
base sky band            stars      clouds
empty field  (<p50)      + 0.00     + 2.83
faint dust   (p50-90)    + 0.00     +11.83
nebula       (p90-99)    + 0.00     +31.69
star halos   (p99-99.9)  +30.18     +36.84
STAR CORES   (>p99.98)  +113.66     + 5.53
```

The stars column is the test: it cannot light anything that was not already a star. 70% of the star layer's light falls in **0\.185%** of the frame against **29\.868%** for the clouds.

**One trap if you re\-measure.** Do not classify the delta by the *base* layer's brightness when the layer is offset — "how much did the star cores brighten" reads as almost zero and looks like failure. Measure the delta's own distribution. And do not use `getComputedStyle`; it reads flat while the pixels are plainly moving.

**The owner is not fully happy with the twinkle and asked to leave it.** The idea worth trying next: per\-star variation *without* a second population — sample the cores into a handful of alpha bands and run them on incommensurate periods, so bright and mid stars wink out of phase while every one stays exactly where it is.

* * *

## The 4K regeneration

Both backgrounds were regenerated through Higgsfield at 4K, **8 credits total** (2 per 2K, 4 per 4K; balance 809.41 → 801.41). The jobs came back tagged `nano_banana_2` rather than the requested `nano_banana_pro`; 4K was delivered either way.

**The spine was an EDIT, not a fresh generation.** The old file went in as the reference with a prompt to remove the cube and change nothing else. A from\-scratch generation is exactly how the first artwork came back orange — see HANDOFF 7.

**The geometry survived, which is why no tuned value moved.** Column extent 0.3346 → 0.3327 of frame width, centre 0.5003 → 0.4998, half\-maximum width 0.2142 → 0.2122, vertebra pitch identical at 0.0417 of frame height (24 vertebrae both). Confirmed in the browser too: same `background-size` 2495.13px, same 180px on\-screen vertebra pitch. **`--spine-frac` stays 0.2565.**

**The black clamp.** The generated file had a faint asymmetric wash where the cube used to be — right margin mean L **2\.08** against the left's **0\.20**, with a soft rectangle readable in the top right. Under screen that can only add light, so it would have been a soft vertical band lifting the page. Fixed before encoding by **subtracting 6 levels and clipping at zero**\: margins went to 0.000 / 0.016, strokes lost 1% brightness. A linear subtract, not a threshold, so nothing bands at the clip point.

**The halo came back more saturated: 20.8%, blue\-violet, against roughly 13% before.** It did not go warm, so the standing rule holds. But the dim layer carries `saturate(0.55)` and **the lit layer carries none**, so the charged column shows the full 20.8%. If the glow ever reads too blue, that is the source and a `saturate()` on `.spine-bg__art--lit` is the lever.

Encodes verified: spine **0\.429/255** mean absolute difference against source (the file it replaces was 0.888); starfield 4K downscaled 5504 → 3840 for weight.

* * *

## The MUSIC\-jump gap — three bugs stacked

Reported as "clicking MUSIC leaves a gap where you can see the hero video". It was three separate defects, and each fix revealed the next.

**1\. The reveal transform moved the section box.** `.track-experience` started at `transform: translateY(24px)` for its scroll\-reveal. That moves the *box*, not just what you see in it — the section was laid out flush against the hero's bottom but painted 24px lower, permanently vacating a 24px strip at exactly that seam, with the hero showing through it. The same offset also made the section **overlap the newsletter below it by 24px**, which is where the other end of the discrepancy went and which nobody had connected to it. Fixed by moving the transform to `.track-arc-wrap`, one level in: identical entrance, box never moves. Safe for the carousel's 3D — `perspective` is on `.track-arc-viewport`, below that element. Layout now measures hero `0–900`, tracks `900–1944`, newsletter `1944–2693`. Gap 0, overlap 0.

**2\. The scrolled nav was 92% opaque.** Eight percent of whatever sits behind it came through — invisible over the black page for months, until you jump to `#tracks`, which parks `.hero__ctas` at viewport **−28..22**, directly behind the bar. The solid **white "Enter the World" button** was bleeding through. Isolated by removing one thing at a time and re\-measuring the nav band: hiding `.hero__ctas` changed it by max **19\.0** across 6,495 px; hiding `.hero__media` (the video) changed it by max **1\.4** across **0** px. It was the buttons — the video was just what you could see moving behind them. Fixed by making `.nav.is-scrolled` opaque. The blur went with it: nothing shows through, so there is nothing to frost, and `backdrop-filter` still forces a render surface.

**3\. `scroll-margin-top` was hardcoded from a bad measurement.** Set to 86px, derived from measuring the nav at 89px — **in an environment where `fonts.googleapis.com` is blocked**. That was the fallback font's line box, not the real one. With the real webfonts the bar is shorter, the section landed \~8px below it, and a five\-pixel strip of hero video sat under the hairline. Proof it was the video: across two settled frames 0.3s apart that strip changed by **2\.10** levels while the bar above it changed by **0\.000**.

The tell was in the measurement itself and was read straight past: the nav came out as *exactly* 89px at 1440, 1024, 768 **and** 390. **A number that does not move across four breakpoints is not measuring what you think it is.**

Fixed by publishing the live height as `--nav-h` from `js/nav.js` — re\-published on `document.fonts.ready`, on resize, and via a `ResizeObserver` — with `scroll-margin-top: calc(var(--nav-h, 72px) - 4px)`. Verified by *forcing* three nav heights rather than trusting the one this environment produces: at 58px, 89px and 140px the hero below the bar measures **0px** every time, with a constant 44px clearance for the MUSIC label.

* * *

## Scroll weight

`js/scroll-weight.js`, `--scroll-weight` in `css/base.css`. Damps wheel scrolling toward the position the browser would have jumped to.

**No transform wrapper**, deliberately. The usual smooth\-scroll library moves the document with `translate3d` and leaves `scrollY` at 0 — which would break this site specifically, since `js/spine-bg.js` drives `--charge` from `window.scrollY` and positions the spine layer in document space. The column would sit still while the page slid past it. Real scroll position stays the truth; the module only takes smaller steps toward it.

**Wheel only.** Touch keeps the OS's own momentum, keyboard and in\-page anchors keep the smooth `scroll-behavior` in `base.css`, and reduced motion disables it. **0 is genuinely native** — the handler returns before touching the event.

The 1px floor on each step is not cosmetic: without it the exponential step rounds to zero before the gap closes, and a 600px wheel tick at weight 0.5 took \~1.3s to land instead of the \~600ms the time constant predicts, all of it in a mushy tail.

* * *

## Do not do these

- **Do not hardcode the nav height anywhere.** Use `--nav-h`. See bug 3 above.
- **Do not put the reveal transform back on `.track-experience`.** It moves the section box and re\-opens the seam.
- **Do not lower `.nav.is-scrolled` below full opacity** without re\-checking the `#tracks` landing — at 0.92 a white button 28px above the fold reads through it.
- **Do not add stops to `--mask-charge`.** CSS clamps out\-of\-order gradient stops silently, so a wrong guard looks like "no effect". Add a mask layer.
- **Do not "fix" `--star-sat: 1` to match the spine.** The 2–7% saturation rule governs the *spine*; the sky is deliberately not held to it. Owner's call, August 4.
- **Do not re\-warm the spine artwork.** Unchanged from HANDOFF 7 and still true.
- **Do not judge the spine or the twinkle from a composite screenshot.** Use the tuner's "mask only" and "stars off" view modes.
- **Do not trust `getComputedStyle` for anything animated.** It reads flat while pixels move — true for the pulse, the twinkle and the scroll damping.
- **Do not commit `_hf-*.png`.** See Housekeeping.

* * *

## Deliberate decisions

- **`--star-sat: 1`** — the sky is the footage at full saturation, deep blue. Owner's call after seeing both. The 2–7% saturation rule governs the *spine*; the sky is deliberately not held to it.
- **`--star-cloud: 0.02`** — the cloud glow is effectively off. It was tried at 0.92 and taken almost all the way back down. If the nebula looks static, this is why, and it is intentional.
- **`--star-twinkle: 0.04` idle against `0.32` playing** — the sky barely moves until a sample starts. The play button is meant to be the thing that wakes it.
- **`--spine-band-feather: 0`** — a hard top edge arriving, a 220px swell leaving. Deliberately asymmetric.
- **`--spine-beam: 0`** — the crimson scan line is tuned off.
- **The twinkle is left as\-is, unsatisfied.** Owner's decision to stop rather than iterate further today; the amplitude was dialled down rather than the mechanism replaced.
- **The tuning panel stays in the repo.** Unchanged from HANDOFF 7 and now carries three files' worth of controls.
- **Old artwork kept beside new** — `spine-column-moonlight.webp` and `starfield-deep.webp` are unreferenced but retained for comparison.

## Shipped values

```
/* css/spine-bg.css */          build 22
--spine-w: 640px;               --spine-bias: 1.3;
--spine-dim: 0.38;              --spine-band: 1260px;
--spine-lit: 0.52;              --spine-band-feather: 0px;
--spine-glow: 0.48;             --spine-bloom: 0;
--spine-feather: 220px;         --spine-beam: 0;
--spine-offset: -520px;         --spine-scrim: 0;
--spine-pulse-lo: 0.38;  --spine-pulse-hi: 0.8;  --spine-pulse-ms: 5300ms;

/* css/base.css */
--scroll-weight: 0.5;

/* css/star-bg.css */           build 6
--star-dim: 0.8;                --star-twinkle: 0.04;
--star-sat: 1;                  --star-twinkle-hi: 0.32;
--star-cloud: 0.02;             --star-twinkle-ms: 7700ms;
```

**Read the star block carefully — it is not what it was mid\-session.** `--star-cloud` was tried at 0.92, where the cloud glow was the dominant light source on the page, and came back down to **0\.02**, which is effectively off. `--star-twinkle` sits at **0\.04** idle against **0\.32** while a sample plays — an eight\-fold jump, so almost all of the twinkle you ever see is the play button's doing. That is the shape the owner asked for originally and it is now the shape that shipped. The `html::after` cloud layer is kept because it is one slider away from being useful, not because it is doing anything at 0.02.

**Mobile (≤600px) is inferred, not tuned**, and was re\-derived off these numbers: spine `w 390 / lit 0.3 / dim 0.23 / band 880 / band-feather 0`; stars `dim 0.46 / twinkle 0.03 / twinkle-hi 0.25`. `--star-cloud` is deliberately **not** overridden on mobile any more — at 0.02 the difference between a desktop and a phone amplitude is far below anything visible, and a second number there would be noise pretending to be a decision. Re\-introduce it if `--star-cloud` ever goes back above \~0.3. **Re\-derive whenever the desktop numbers change.**

## How this session verified things

Headless Chromium against a local server at 1440×900 and 390×844, plus 1024×768 and 768×1024 for the nav, and `prefers-reduced-motion` throughout.

**Verified, not asserted:** the band's top edge position against prediction at five values; the 1px ramp floor removing the seam; the 4K artwork's column geometry, centre and vertebra pitch against the file it replaces, and again in the browser; both encodes' mean absolute difference; the star layer leaving the page floor at exactly 5.00; the twinkle's light landing only on existing star cores; the scroll damping converging at three weights; text contrast at the final shipped values; the nav leak isolated to the CTA buttons; the `--nav-h` fix at three forced nav heights.

**Legibility at the shipped values** — measured twice, before and after the final tuning pass. Dropping `--star-cloud` from 0.92 to 0.02 removed most of the added background light, so every figure improved:

```
                          desktop            mobile
                        final  (at 0.92)   final  (at 0.92)
footer social links     12.99   12.91      13.16   13.11
newsletter eyebrow      10.49    6.00      11.75    8.91
newsletter body          9.15    7.33      13.93   10.94
track description       13.26    9.24      15.28   11.99
track counter            7.76    6.74       9.87    7.78
```

Worst case **7\.76:1** against a 4.5:1 requirement, with the scrims still off so the text\-shadows carry it alone. The 13px tracked\-out mono eyebrow was the tight one at 6.00:1 and now has real headroom.

**Asserted, not verified:** everything the owner judged by eye, including all shipped values; the mobile numbers; that the 4K linework looks right at full size on a real display.

**Two instrument limits found this session, both worth remembering.** `fonts.googleapis.com` is blocked in the assistant's environment, so **any measurement that depends on text metrics is taken with fallback fonts** — that is what produced the bad nav height. And the Higgsfield CDN cannot be reached from there either, in both directions: uploads have to go through the widget, and results have to be saved down by the owner before they can be measured.

## Still open

Carried forward, plus this session's.

- **DNS for `kundalinispines.com`** — unchanged, still the single blocker. Nothing on this site is reachable by anyone. Enable sequence in HANDOFF 5 under "Deployment"; do not enable Pages without the custom domain.
- **The twinkle is not right yet.** See "Twinkle" above for the next idea.
- **The star field and scroll weight are on `index.html` only** — one link tag and one script tag per page to roll out, once the numbers are settled.
- **The spine is on `index.html` only** — the other four pages are flat black, so the site still reads as two different sites.
- **Pre\-existing mobile nav bug, unrelated to all of this.** The closed menu panel is not fully off\-screen: `Archive` at y\=12 and `About` at y\=73, bleeding through behind the fixed header **on every page**.
- **Side\-card blur is too heavy.** `track-experience.js` applies up to `blur(6px)` and `brightness(0.4)`, both multiplied by `BOX_K` (1.85). Worth a pass.
- **Mobile values are inferred**, not judged on a device — now true of the spine, the band, the stars and the twinkle.
- **`README.md` is badly stale** — predates HANDOFF 2, roughly half false. Now also omits `css/spine-bg.css`, `css/star-bg.css`, `js/spine-bg.js` and `js/scroll-weight.js`.
- **The earlier album is unacknowledged on the site** — nine YouTube videos, see HANDOFF 6.
- **The YouTube unit tests are not in the repo.**
- **Buttondown deliverability unverified** — still the highest\-consequence unknown.
- **Instagram and X are owner\-supplied, not verified.**
- **`explicit` is `null` on all 28 tracks;** streaming links all `null`; `data/releases.json` entirely `PLACEHOLDER`; download links and Stripe/Gumroad not started.
- **TikTok and Spotify accounts do not exist** — dead footer links by owner's decision.
- **Accent hue collisions** — may\-26th / blue\-pills, uzi\-fruit / the\-33rd\-floor.
- **Video takes** chosen by name\-matching; most tracks have 2–4.
- **May 26th's cover→video crossfade has still never been watched.**
- **The 885 MB masters folder is still backed up by nothing.**

### Housekeeping

**Delete before committing, or add to `.gitignore`\:** `_hf-spine-source.png`, `_hf-star-source.png`, `_hf-spine-4k.png`, `_hf-star-4k.png` — **44 MB** of scratch files in the repo root from the Higgsfield round trip. `.gitignore` does not currently exclude them, so `git add -A` would commit all four.

Still obsolete from HANDOFF 7 and safe to delete: `spine-bg-trials.html`, `spine-image-test.html`, `raster-test.html`, `raster-test-2.html`, `transmissions-options.html`, `transmissions-option5-v2.html`. The device bridge cannot delete files — move them to `_to_delete/` and delete by hand.

Higgsfield element IDs for new covers:
Messenger\-A `46229f47-2d2f-45f7-a578-8d169ca5fbb7`,
Messenger\-B `37f342de-2add-4f4c-bcc7-2aa3530676d3`

* * *

## The closing line, again

HANDOFF 5 and 6 ended on *measure it, do not eyeball it*. HANDOFF 7 added *know what your instrument cannot see*. This session paid for that lesson twice more, and the second time was worse, because the evidence was sitting in the output.

The nav measured **89px at 1440, 1024, 768 and 390**. Four breakpoints, one number, no variation — and it was read as a robust result instead of as the tell it was. A constant across conditions that should vary is not a strong measurement. It is a measurement of the wrong thing.

> Measure it. Know what your instrument cannot see. And when a number refuses to move, ask what it is actually measuring.
