# Kundalini Spines — Spine UI V2 Handoff 53

**Date:** August 31, 2026

Thirty-fifth handoff of the **Spine UI V2** track (branch `feature/spine-ui-v2`).
`52` owns the coinc-110 retune and the "feels old" investigation method; `51`
owns the Cloudflare migration and live-site verification recipe. **This
session:** the custom domain is confirmed live, the owner changed a Cloudflare
caching setting (recorded below), and the phone-sky saga reached **star-build
32** — the sky lock now survives page loads.

---

## The one-line version

`kundalinispines.com` serves the site and the owner set the zone's Browser
Cache TTL to "Respect Existing Headers" (verified passing the origin's
`max-age=0, must-revalidate` through untouched); the owner still saw the sky
move on the phone at build 31, the hole was the lock resetting on every page
load, and build 32 persists the per-width maximum in localStorage —
verified locally, **not yet judged on-device**.

---

## Corrections to earlier handoffs

- **52's DNS hold is over.** `kundalinispines.com` and `www` both serve the
  site through Cloudflare (checked today: correct headers, ETags matching
  `pages.dev`, `CF-Cache-Status` present). 52's open item 2 is **CLOSED**.
- **Two sky builds shipped between 52 and this handoff with NO handoff of
  their own** — `d50a094` (build 30: every fixed sky layer pinned to
  `100lvh`) and `8edbff1` (build 31: layers read `var(--sky-lock, 100lvh)`,
  published by `js/nav.js` against Brave's bottom toolbar), and `main` was
  synced to `8edbff1` and deployed. Their record is the commit messages and
  the build ledger in `css/star-bg.css`; nothing here contradicts them.

---

## OWNER ACTION, on the record: Cloudflare Browser Cache TTL

The owner set the zone's **Browser Cache TTL to "Respect Existing Headers"**
(Cloudflare dashboard → Caching → Configuration) on the `kundalinispines.com`
zone.

**Why it matters:** Pages serves the CSS/JS with
`Cache-Control: public, max-age=0, must-revalidate` + ETag — the header 52's
"stale cache is near-impossible" claim rests on. A zone-level Browser Cache
TTL (default 4 hours) would have REWRITTEN that for browsers on the custom
domain, so visitors could hold stale CSS/JS for hours after a release.
"Respect Existing Headers" lets the origin's revalidate-every-load policy
win on the custom domain exactly as it does on `pages.dev`.

**Verified same day** (HEAD on `css/base.css`):

| Host | Cache-Control | Note |
|---|---|---|
| `kundalini-spines.pages.dev` | `public, max-age=0, must-revalidate` | origin baseline |
| `kundalinispines.com` | same, passed through | `CF-Cache-Status: REVALIDATED`, weak ETag (`W/…`) — edge copy revalidating per hit, correct |
| `www.kundalinispines.com` | same, passed through | ETag matches the other two hosts |

**Do not "fix" the weak ETag on the apex** — it is Cloudflare marking its
edge-cached copy and revalidation demonstrably works.

---

## The sky, part three: build 31 held within a page and forgot between pages

**Symptom (owner, on-device, this session):** the sky still moves at
star-build 31, on the live site, with `--sky-lock` deployed.

**Diagnosis (code-read, then reproduced locally):** the lock's coverage was
complete — every fixed sky layer reads `var(--sky-lock, 100lvh)`, including
the cloud stage and `.df-bg` — but its LIFECYCLE was not. `js/nav.js` started
`lockH` at 0 on every page load, and a phone page normally OPENS with
browser chrome up, i.e. at the shrunken height. So every navigation published
the small height, and the first scroll-down (chrome hides, viewport grows)
grew the lock and re-cropped the `cover` layers once. One jump per page,
every page — which reads as "still moving".

**The fix (star-build 32, `js/nav.js` + ledger in `css/star-bg.css`):** the
per-width maximum is persisted as `ks.skyLock` (`{w, h}`) in localStorage and
seeded at script run. A revisited width starts already locked at the tall
height; only the first-ever scroll at a given width can still move the sky,
once per width per device, ever. A width change (rotation, split-screen)
still resets — a different width is different geometry, not chrome. A stale
oversized value is harmless (the layer overscans below the viewport and
holds still); an undersized one grows on first observation.

**Verified locally** (browser pane, emulated coarse pointer at 390px wide):
fresh state at 390x700 → lock `700px`, stored; viewport grown to 844 → lock
and store `844px`; **reloaded back at 390x700 → the sky layer measures 844px
at first paint, seeded from the store** — build 31 read 700 at that moment
and jumped on scroll. Width change 390→428 correctly reset and republished.
Desktop unemulated: `--sky-lock` unset (coarse-pointer gate holds). Zero
console errors.

**Harness quirk worth keeping:** the browser pane's viewport emulation does
NOT fire a real `resize` event, so the mid-page growth step needed a manual
`window.dispatchEvent(new Event('resize'))`. The listener is fine — on
device it fires (build 31's one-time jump was that listener running). Do not
diagnose the listener as broken from an emulated-resize non-response.

## RESOLVED ON-DEVICE, later the same session: the sky is still — BRAVE moves the PAGE

Build 32's on-device verdict arrived as a 15 s screen recording of
`?skydiag` (star-build 33's overlay, shipped for exactly this). Two
independent measurements, one conclusion:

1. **The overlay, through the whole gesture:** `lock 790px, writes 0`;
   `sky t 0 [0–0] h 790 [790–790]`; `scr t [0–0]`; `bb h [790–790]` — while
   `innerHeight` swung 671→790 as chrome collapsed. Every sky layer box is
   perfectly still in page space. Builds 30–32 WORK.
2. **Frame-tracking the recording** (15 fps, template-matching the fixed
   nav wordmark, which shares the sky's fixed positioning): the whole
   fixed stack slides between two screen positions, Δ = 157 device px
   ≈ 56 CSS px, in exact sync with Brave's URL-bar visibility — nine
   cycles in 15 s, one per swipe-direction change, ~150–250 ms each.

**The mechanism:** Brave's compositor translates the entire rendered web
surface as its toolbars hide/show. The layout viewport top loses ~56 CSS px
(top bar) while the viewport height gains ~119 (top 56 + bottom 63). No DOM
metric sees it — which is why the overlay reads stable while the eye sees
motion. This is standard Android-browser behaviour; every fixed element on
every site rides it. **It cannot be removed by page code. Do not attempt
another sizing/locking fix for it — the locks are done and proven.**

**The one real mitigation — SHIPPED as star-build 34 / df-build 15 on the
owner's pick ("Ship it, Android-only"):** `html.sky-center` (published by
js/nav.js on Android + coarse + lvh) re-anchors every pinned layer to the
viewport centre — `top: calc(50% - var(--sky-lock, 100lvh) / 2)` — in
css/star-bg.css, css/deep-field-bg.css and the cloud stage in
js/clouds-sky.js. A percentage top re-resolves as the viewport height
animates, so the screen drift becomes |−Δtop + Δh/2|: ~3.7 CSS px on Brave
(both bars, 16× better) and ~28 px on top-bar-only Chrome (2× better).
Android-gated rather than coarse-gated because bottom-bar-only browsers
(iOS Safari) have Δtop = 0 — the top anchor is already perfect there and
centring would ADD ~25 px. Verified in the pane at an emulated Android
390px viewport: lock 844 at innerHeight 700 computes top −72 on every
layer including the cloud stage, html::after keeps its overscan centred
(−97.31 → centre exactly 50%), desktop shows no class and top 0.

**Build 34 measured on-device and superseded the same session (build 35).**
The owner's second recording showed the sky still riding the full chrome
shift, and one panel frame explained it browser-side: with the bars fully
returned it read `in x 790` while `vv h 734` was still animating — **Brave
leaves `innerHeight` stale until the gesture settles, while
`visualViewport.height` animates with the bars.** Build 34's
`top: calc(50% - lock/2)` resolves against innerHeight, so it could only
correct AFTER each transition (full ride during, snap after — the exact
failure mode the previous section flagged as possible). Build 35 / df 16
moves the centring into JS: js/nav.js writes `--sky-cen =
(visualViewport.height - lock) / 2` on vv-resize + scroll + a 250 ms
interval, guarded against pinch-zoom (`scale != 1` returns) and the soft
keyboard (chrome delta capped at 220 CSS px); the CSS reads
`var(--sky-cen, <the 34 calc>)` so no-visualViewport browsers degrade to
34 exactly. The ?skydiag panel gained a `cen` / `bb t` row (proves the
writes live) and its title now READS `--star-build` instead of asserting
it — a hardcoded `b33` survived the 34 deploy and read as a stale site.
Verified in the pane: cen −72.0 written by the interval alone at an
emulated 844-lock/700-viewport, all layers following; desktop
class-free, top 0, zero console errors.

## Verified vs. asserted — and the honest gap

**Verified:** everything above, locally. **Asserted / NOT verified:** the
sky holding still in real Brave on the owner's phone at build 32. The
first-ever scroll at a given width will still move the sky ONCE (nothing to
seed from yet) — after that, page loads at that width start tall. If the
owner reports movement on EVERY page or CONTINUOUS breathing mid-scroll at
build 32, the diagnosis above is wrong in some new way — first check
`getComputedStyle(document.documentElement).getPropertyValue('--sky-lock')`
and `localStorage.getItem('ks.skyLock')` on the device before touching code.

---

## What is deliberate, so nobody fixes it

- **`ks.skyLock` stores one width, not a history.** Rotation re-learns in
  one scroll; a table of widths is complexity without a reported symptom.
- **The seed does not use `screen.height`** — display cutouts and gesture
  bars make it a guess; the store only ever holds observed viewport heights.
- Everything in 52's deliberate list stands (110 interpolated and labelled;
  JS `COINC` a fallback mirror; 51's list beneath it).

## Do not do these

- **Do not sync `main` unprompted** — a sync DEPLOYS. Build 32 is on the
  feature branch only until the owner says otherwise.
- **Do not revert the Cloudflare Browser Cache TTL setting** — and if cache
  behaviour ever looks wrong, re-run the header table above before touching
  the zone.
- Carried and binding: no GitHub Pages; no fulfilment Worker unprompted;
  never `python -m http.server`, never `file://`; no paid deliverables in
  the repo; no Python text-mode writes to JS/CSS/HTML.

---

## Git state

- Branch `feature/spine-ui-v2`. Session start `8edbff1` (= `origin/main` at
  the time, deployed).
- Commits: `3d927df` (build 32, `js/nav.js` + `css/star-bg.css`) and this
  handoff's own — pushed, **and released**: `main` fast-forwarded to the
  branch head on the owner's explicit "sync main and ill test".

---

## Still open

1. **Build 35 on the owner's phone** — build 35 (`88ee5aa`) was RELEASED
   on the owner's "sync main" and confirmed live on kundalinispines.com
   (`--star-build: 35` served) the same evening; awaiting the on-device
   verdict. The panel title now proves the build
   (it reads `--star-build`), and the `cen` row must be seen CHANGING
   during a swipe (0 ↔ ~−60) for the mechanism to be live. If the sky
   still rides with cen visibly moving, the residual is the vv-event
   latency and the next lever is unknown; if cen sits frozen, find out why
   before touching the mechanism. Frame-track any new recording
   (track_nav.py pattern) — and mind that starry IN-FLOW artwork polluted
   the star tracker once already; pick sky patches by hand.
2. **The listen test at coinc 110** (52's item 1, unchanged).
3. **The fulfilment Worker** — waits on the owner's go.
4. **Live Stripe link swap** — the real domain now exists; still waits on
   the owner taking real money.
5. **STRIPE-SETUP.md GitHub-Pages sweep** — when the Worker starts.
6. **MCP OAuth from an interactive session** — the authed Cloudflare
   servers still won't load headless.
7. Deluxe/Artifact phase 2; refund & delivery policy page; Stripe Tax.

**Carried from 47–52, unchanged:** phones and the feather masks; glow
judgement at `/?tune`; masks 04–07; the hero-wait; rooftop glow; mask-06
transcription; 41's mobile calls; VHS on phones; the labs' fate; the `-g 48`
re-export; leg-aware clip pause; filmrow labs; doc-rail ring inversion;
`music.html` stub; stale TIPS prose; missing trivia files; astral scrim; the
inherited pile.

---

## Starting the next V2 chat

Attach this file. Working folder
`C:\Users\Haight\Desktop\kundalini-spines-spine-ui` on `feature/spine-ui-v2`.
Serve with `python scripts/serve.py` — never `file://`, never
`python -m http.server`. The site is LIVE at https://kundalinispines.com
(and `kundalini-spines.pages.dev`) at star-build 32; a release to `main`
deploys. Likely first task: hear the owner's on-device verdict on the
build-32 sky and act on it.
