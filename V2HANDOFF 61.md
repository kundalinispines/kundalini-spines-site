# Kundalini Spines — Spine UI V2 Handoff 61

**Date:** September 9, 2026 (session ran Sept 8–9)

Forty-third handoff of the **Spine UI V2** track. `60` owns the BTCPay
checkout; `59` the MP3 package; `58` the deep field and the hero seam; `57`
the footer contrast harness; `56` the Stripe webhook; `51` the Cloudflare
migration recipe. **This session: the Lightning milestone logged, the purchase
buttons finished, and three performance passes** — Firefox's scroll cost on
the home page, the carousel's settle and its returning card flash, and the
sample player's fill. Seven code commits plus this handoff, **released to
`main` on the owner's word at the end of the session** (see Git state for the
hash and the deploy run).

---

## The one-line version

The live site now says Lightning is on (transmission 008, with artwork on 007
and 008), the Digital card reads **Pay with Card / Pay with Bitcoin** with an
outline glyph on each, Firefox scrolls the home page at half the previous
main-thread cost, the carousel settles in a fixed 340 ms and no longer flashes
on a new track, the outermost cards blur only on their outer third, and the
sample bar's fill runs smoothly with a spark on its tip.

---

## Corrections to handoff 60

1. **`60` Still open item 1 ("transmission 007 is filed but not yet
   released") was already closed before this session started.** `main` had
   been fast-forwarded to `2838141` at 12:11 UTC on Sept 8 (deploy run
   34224677526, success) and kundalinispines.com served 007 at the top of the
   log. The handoff was written before that release and never amended.
2. **`60` Still open item 2 (Lightning) is closed, on the owner's word.** The
   owner reported at the start of this session that they had funded the node,
   bought the Digital Edition over Lightning on the live site, and received the
   downloads and the confirmation email. Nobody in the session saw the invoice,
   the webhook delivery or the inbox. **Transmission 008 "Lightning is on" was
   filed on that word** and is now live.
3. **`60` said the Bitcoin button carries "no Bitcoin glyph — the label says
   the word", and the card comment argued that as deliberate.** Reversed by
   the owner this session; the comment was rewritten to record the decision
   rather than deleted. Both Digital buttons now carry an inline outline glyph.
4. **HANDOFF 3's carousel rule "the card is dropped to opacity 0 and the
   overlay shown in the same breath" is no longer how it works.** The overlay
   now waits for its still to decode. HANDOFF 3's four overlay rules (down in
   `tick()` not `kick()`; `updateCardVideos()` never hides it for the same
   hero; `render()` leaves the lifted card's opacity alone; `showHeroLayer()`
   idempotent) all still hold.
5. **`kundalini-session-start` step 8 says video measurements need
   Playwright's Chromium.** True, and now there is also a Firefox path: the
   installed Firefox 155 can be driven without a driver (see
   `scripts/perf-scroll.py`). Playwright's own Firefox build is still not
   installed and was not needed.

---

## What shipped (seven commits, `3f3d018 … 0f92926`, all on `main`)

### `3f3d018` — transmission 008, artwork on 007 and 008

- `data/transmissions.json` gains **008 "Lightning is on"**, channel `filed`,
  dated 2026-09-08, `internal: purchase.html`, at the top. Body says the same
  Bitcoin button leads to the same invoice, the invoice now offers Lightning
  beside the on-chain address, a Lightning payment settles in seconds, delivery
  is unchanged, on-chain still counts at one confirmation, Deluxe and Artifact
  remain filed. **007's body is unchanged** — it says Lightning is not on yet,
  which was true for its date; the handoff-60 rule was a new entry, not an
  edit.
- Owner-supplied artwork: `assets/transmissions/bitcoin-accepted.webp` on 007
  ("Now Accepting Bitcoin" console scene) and
  `assets/transmissions/lightning-on.webp` on 008 ("Bitcoin Lightning" globe).
  Converted from the owner's PNGs in Downloads (`spinesbtc.png`,
  `spinesbtclightning.png`) to 1254² WebP at quality 90, the covers' encode.
  New folder ships under the deploy allowlist's existing `assets` entry.
- Verified in Playwright at 1440 and 390: 008 first, readout 08 on its own,
  both images decode at 1254, links present, no errors, no overflow.

### `7c1e8ee`, `7710f92` — the purchase buttons

- `purchase.html` Digital card: **"Pay with Card"** (was "Own the Digital
  Album") over **"Pay with Bitcoin"**. Option one of four offered; the owner
  chose it and asked for the card glyph too. `merch.html`'s "Own the Digital
  Album" is untouched — it is a link to the page, not a payment choice.
- Both buttons carry an inline SVG outline (`.ks-cta-glyph`), 1.15em, stroke
  `currentColor`. The Bitcoin one (`--btc` modifier) turns **#F7931A with a
  5px halo on hover, focus-visible, and while the email form is open**
  (`aria-expanded="true"`); the card glyph only follows the label colour. The
  orange is a local custom property on the button, deliberately not in
  `tokens.css`. Forced colours drop the halo.
- Measured at 1440 and 390: both buttons 44px, glyphs 14.9px centred on their
  button (0.0px delta), colours as designed at rest/hover/open.

### `b3615f3` — Firefox's scroll cost on the home page (+ `scripts/perf-scroll.py`)

The owner relayed Firefox users saying the home page did not feel snappy.
Measured with the **installed Firefox 155** via a new harness: throwaway
profile, Gecko profiler armed through `MOZ_PROFILER_STARTUP` /
`MOZ_PROFILER_SHUTDOWN`, a probe injected into a temporary copy of the page,
Playwright Chromium as the control. Six-second scripted scroll, 1440×900,
240 Hz display (so 4.2 ms is the frame floor):

| run | scroll frames in 6 s | mean | median | p95 |
|---|---|---|---|---|
| Firefox before | 552 | 10.1 ms | 8.3–12.5 | 16.7 |
| Chromium | 1,436 | 4.2 ms | 4.2 | 4.3 |
| Firefox after | 1,186 | 5.1 ms | 4.2 | 8.3 |

Content main thread in the window: 5,383 → 4,326 ms of 6,000. Chromium
unchanged. **The cause:** Gecko restyles the whole document when an inherited
custom property changes on `<html>` (Blink restyles only the elements that
reference it). Two things did that every frame:

- `js/spine-bg.js` wrote `--charge` on the root — ~500 style flushes of
  600–1,700 elements, 2.6 s of CPU. Now written on `.spine-bg`; the two `:root`
  variables derived from it (`--band-t0/--band-t1`) moved onto the layer with
  it (a `var()` resolves where it is declared). `--spine-build` 44 → 45.
- `css/spine-doc.css` transitioned `background` and `width` on the rail ticks'
  `--vt`-driven values, which retarget every frame: 43,188 transition restarts
  in six seconds. The transitions are gone; `js/spine-doc.js` computes the same
  low-pass itself (exponential approach, τ 70 ms, 95% in ~210 ms) and writes
  the same 0.01 quantum. It also now snaps under reduced motion, which the
  transition never did.
- Smaller: `js/deep-field-bg.js` writes `--df-lum` on `.df-bg` (its only
  consumer is the scrim inside it; on the root it was 24–30 whole-document
  restyles a second while the clip played) and rounds `--df-sky` to two
  decimals (Gecko skips identical inline writes — tested with a shim).

Rendering verified pixel-identical to the untouched tree on `index.html` and
`about.html` at four scroll positions, all 174 rail tick values equal at rest;
the one position that differed also differs when the untouched tree is compared
with itself (its scroll re-lock lands ±2 px).

### `04417eb` — the carousel: timed glide, overlay waits for its still

- **Glide.** Was `current += (target - current) * 0.12` per frame — an
  exponential approach whose speed was the refresh rate: one-card click to
  settled measured 500 ms here (240 Hz), ~1.2 s by arithmetic at 60 Hz. Now a
  timed ease-out cubic: 340 ms one card, +40 ms per further card, cap 520, a
  sub-step correction after a drag scales with √distance (min 120). Measured
  after: click 336 ms, drag release 111 ms (was 215). Constants
  `GLIDE_MS_BASE/PER_STEP/MAX` at the top of `js/track-experience.js`.
- **Flash, mechanism one.** `showHeroLayer()` set the overlay's `<img>` src
  and showed it in the same frame with the card at opacity 0. `img.decode()`
  timed from that moment took ~50 ms whenever the hero changed, so the
  overlay's opaque background showed for three frames at 60 Hz; on a throttled
  connection the image was not even loaded. Now the still is primed (load +
  decode) into the hidden overlay at `setFocus()` and during drags, and
  `showHeroLayer()` refuses to show until the decode has landed, calling
  itself back when it does. After: decode at show time 3–6 ms (already done);
  under throttling the overlay waited 5.7 s for a lazy still and appeared with
  `complete: true`.
- **Flash, mechanism two.** Clicking another card mid-sample brought the
  overlay down onto a card whose own video was paused at a much earlier frame
  (0.34 s vs the overlay's 2.5 s) — a visible jump backwards during the
  fade-out. `hideHeroLayer()` now cuts a non-rolling card's video to the still
  with the transition suppressed for one frame.
- **Falsified on the way:** a black video frame. Under a 2 Mbps throttle the
  overlay's video had no frame for two seconds and the card's luminance never
  moved — Chromium paints a frameless video transparent.

### `edef217` — edge blur on the outermost cards; spark on the fill tip

- Of the five desktop cards only the outermost pair carried blur (4.75 px,
  whole card). Now `render()` writes the radius to `--edge-blur` and
  `.track-card::after` paints a blurred copy of the same still (`--card-art`
  on the card), masked solid at the card's outer edge and gone by ~36% in.
  Classes `is-edge-left` / `is-edge-right` carry the side; the card keeps only
  `brightness()`. The copy is oversized by 2× the radius and the card clips it
  (`overflow: hidden` added), with the background sized back down so it lands
  on the `<img>`.
- **Measured and fixed on the way:** a relative `url()` in a custom property
  resolves against the stylesheet that substitutes it in Chrome —
  `css/assets/music/…`, 404, re-requested every frame the blur changed (1,494
  requests in four seconds). The URL is made absolute in JS; after, one
  request per cover across a whole drag.
- **The effect is subtle at 1440 by nature:** the outer cards project to ~74
  px, so 4.75 px in card space is under a pixel on screen. Verified by
  Laplacian variance in six column bands (untouched tree flat; now the outer
  third ~860–900 vs ~1,000–1,220 inside) and by a test-only exaggerated radius
  with the box pinned to the card, which showed the geometry plainly on both
  sides. If the owner wants it stronger, the lever is the radius curve in
  `render()`, not the mask.
- **Spark:** `.track-sample-player__bar-fill::after`, a 7px white core with a
  tight and a wide accent halo on the fill's leading edge, gated by the
  section's `is-playing` class. Forced colours: no halo, `Highlight`.

### `0f92926` — the fill paints every frame

The fill was written on `timeupdate` (~4 Hz) with a 0.15 s width transition:
it moved for 150 ms, stood for 100, and moved again — the spark made it
obvious. Now a rAF loop reads `audio.currentTime` while the sample is audible;
`timeupdate` keeps only the 20-second cap; the transition is gone. Measured
over two seconds: before, the fill advanced on 53% of frames with stalls up to
12 frames; after, on 100% of frames with no stall. **The owner suggested a
fixed 20-second animation instead** (all 28 samples are 20 s); kept the
clock-driven fill because the sample is fetched on demand (`preload: none`)
so the audio starts late and can stall, and a fixed fill would drift. Offered
to swap if the owner prefers.

---

## Verified vs. asserted

**Verified this session, by the commands and scripts recorded in the commit
messages:** every number above; the live smoke checks after the release (see
Git state); pixel identity of the Firefox fix; the request counts; the
decode timings.

**Asserted, not verified:**

- **That Lightning worked end to end.** Owner's word (correction 2). The
  server-side proof from `60` Still open item 3 — the `InvoiceSettled`
  delivery at 200 in BTCPay, the `ok` in the Function log — is still unseen
  for BOTH the on-chain and the Lightning sale.
- **Firefox at 60 Hz.** Every Firefox number was measured on a 240 Hz display.
  The 60 Hz figures ("~1.2 s to settle", "dropped frames on a laptop") are
  arithmetic from the per-frame costs, not measurements.
- **That the edge blur reads as intended to the owner.** It was measured and
  seen at an exaggerated radius; at the real radius it is under a pixel on a
  1440 screen and the owner had not yet looked when the session closed.
- **That the Firefox users' complaint was this.** The measured cause fits the
  symptom and the browser split exactly, and the fix halves the cost; nobody
  has gone back to a complaining user.

---

## Do not do these

Earlier lists still stand. New this session:

1. **Do not write a per-frame value on `<html>` or `body`.** Write it on the
   nearest element that owns every consumer, and move any `:root` variables
   derived from it down with it. Gecko restyles the whole document otherwise;
   Chromium will not show you.
2. **Do not put a CSS transition on anything that reads `--vt`,** or on any
   value that retargets every frame. The settle is upstream in
   `js/spine-doc.js` now.
3. **Do not put a relative `url()` in a custom property.** Chrome resolves it
   against the stylesheet, Firefox against the document. `--card-art` is made
   absolute in JS for that reason.
4. **Do not put the `0.12` lerp back in the carousel,** and do not "simplify"
   `showHeroLayer()` back to set-src-and-show. Both were measured wrong.
5. **Do not remove `overflow: hidden` from `.track-card`** — the edge-blur
   copy is oversized on purpose and depends on it.
6. **Do not judge Firefox from a Chromium run.** `scripts/perf-scroll.py run
   firefox` and `analyze … scroll` are the loop. `python -m http.server` still
   breaks video (`59`/`23`).
7. **Do not touch the cloud sky or the film-row canvases for the remaining
   Firefox cost without `?skydiag`** — see Still open 2 and the memory note
   the sky carries.
8. **Do not add `perf-out/` to the repo.** It is gitignored; the profiles are
   ~90 MB each.

---

## What is deliberate, so nobody fixes it

- **007 still says Lightning is not switched on.** True for its date; 008
  above it says it is. Not an error.
- **The card glyph does not light up.** The Bitcoin mark has a colour that
  belongs to it; a card outline does not. The ghost's inversion is its state.
- **The Bitcoin glyph stays lit while the form is open**, not only on hover:
  the pointer leaves the button the moment the field takes focus.
- **The nav collapse still forces ~27–30 whole-document restyles** in
  Firefox at the start of every scroll from the top (`--nav-h` on the root,
  133 ms total). Measured, left: `--nav-h` genuinely is a root variable.
- **The clouds sky and film-row canvases keep Firefox's main thread ~30%
  busy while parked on Music** (display-list rebuilds from per-frame canvas
  updates). Measured, left — sky code has a history.
- **The fill follows the audio clock, not a fixed 20 s.** Owner asked why
  not fixed; reasons above; owner can overrule.
- **The edge blur is faint at 1440.** By nature of the projection; the mask
  is right.
- **`.claude/launch.json` in the session's throwaway worktree gained a
  `kundalini-v2` entry** that serves the spine-ui tree on 8000. It lives only
  there (the throwaway worktree, not the repo) because the preview tool runs
  from that directory and had served the wrong tree first.
- **`scripts/perf-scroll.py` writes to `perf-out/`,** which is gitignored.

---

## Git state

- **`feature/spine-ui-v2` and `main` both at the release commit** (see the
  final lines of this file for the hash and deploy run — written after the
  push). Eight commits this session: `3f3d018`, `7c1e8ee`, `7710f92`,
  `b3615f3`, `04417eb`, `edef217`, `0f92926`, plus this handoff.
- Worktrees: `kundalini-spines` (production, `main`),
  `kundalini-spines-spine-ui` (feature, this), plus `.claude/worktrees/*`
  used by assistant sessions — leave them.
- Memory notes (assistant-side, not in the repo) updated: the BTCPay note,
  and a new one on Firefox's root-variable restyle behaviour.

---

## Still open

1. **Server-side proof of both Bitcoin sales** (`60` item 3, now covering
   Lightning too): BTCPay → Webhooks → recent deliveries, one `InvoiceSettled`
   at 200 per invoice; the Function log's `ok`. Owner's login needed.
2. **The remaining Firefox costs, measured and left:** the `--nav-h` collapse
   (small, but a hitch at every scroll from the top) and the per-frame canvas
   updates on Music (~30% of the main thread while idle). The second is sky
   code; re-diagnose with `?skydiag` first.
3. **Look at the edge blur on a real screen** and decide whether the radius
   curve should rise now that only a third of the card carries it.
4. **Firefox on a 60 Hz display.** One run of `scripts/perf-scroll.py run
   firefox` on a 60 Hz machine (or with the display set to 60) would turn the
   arithmetic into a measurement.
5. **Stripe items carried from 58/59/60, unchanged:** no real customer sale
   through the Stripe webhook; async payment branch untested; no
   download-count cap; reissue manual; Deluxe and Artifact `checkoutUrl:
   null` and not in the Bitcoin `CATALOG`.
6. **From `60`:** copy-vs-state (58 item 6), the unread BTCPay version, the
   polling window and manual refund path as stated limits.
7. **From `59`/`58`:** the WAV package never re-checked against the masters;
   footer chip border unmeasured; `--df-sky-out-fwd` at 0.12; the hero decoder
   stumble.
8. **The scheduled "Stage new YouTube videos" workflow** failed at 03:30 UTC
   on both Sept 8 and Sept 9, in the feed-pull step, and passed at every other
   slot. Logs need an authenticated GitHub session. Not investigated.

---

## Starting the next V2 chat

Attach this file. `60` for the BTCPay setup and its `BTCPAY-SETUP.md`
pointers; `58` for the deep field.

> Here's the latest V2 handoff for Kundalini Spines (Spine UI V2 branch). I
> want to <thing> this session.

The new session needs `C:\Users\Haight\Desktop\kundalini-spines-spine-ui`,
should confirm it is on `feature/spine-ui-v2`, and should run
`python scripts/test-btcpay-functions.py` before touching anything under
`functions/`. **Every push to `main` is a deploy** and happens only on the
owner's word.
