# Kundalini Spines — Spine UI V2 Handoff 43

**Date:** August 20, 2026

Twenty-fifth handoff of the **Spine UI V2** track (branch `feature/spine-ui-v2`).
`42` owns the seven feather masks and the `LIVE` side-by-side; `41` owns the
journey landing on `index.html` and the first mobile pass. The plain
`HANDOFF 1`–`19` series documents the dormant production site on `main`.

---

## The one-line version

**The feather went live — feather only, glow and foreground still parked. The
About page took the infinity spine and the last two film-row clips, though not
where anyone expected. "Download — $1" became "Purchase Rise Up" and there is
now a three-edition purchase page, deliberately wired to nothing. Four commits.**

---

## Corrections to earlier handoffs

- **42's "the masks are gated off with the rest of the feather below 768px" is
  FALSE.** It was listed under *asserted*, and checking it disproved it:
  `css/filmrow-atmos.css` carries **no width media query at all**, only
  `prefers-reduced-motion`. Phones get the feather, resolve the masks, and fetch
  the same 120.4KB. Measured at 390×844 and looked at — it reads well against
  the star field, arguably better than desktop because the VHS is not running
  there. If phones should not pay the 120.4KB, that media query still does not
  exist and nothing was ever relying on it.

- **42's open item 1 (decide `LIVE`) is CLOSED.** The owner asked for "the
  feathers on the videos" and, shown row 1 in four states, chose the feather
  **alone**.

- **42's open item 4 (two clips left for film rows) is CLOSED, but not as
  written.** `last-train-below` and `the-black-archive` did not go on film rows.
  They are on `about.html`, in sections 09 and 07. There is no fourth film row
  and none is planned.

- **42's note that a fourth film row is what would force a repeat mask still
  stands**, and is now less likely to ever matter.

## TWO CLAIMS I WROTE AND CORRECTED BEFORE THEY SHIPPED

Same category as 42's pair, recorded for the same reason — in both cases the
wrong version was already written in the confident voice this codebase uses:

- **"`--fr-focus` is never written when the glow is off."** False. `focusPass()`
  ran unconditionally and on every scroll, writing the property on three figures
  for a layer that is not painting. Checking the claim is what found the waste.
  It is now gated on `LAYERS.glow || TUNE`.

- **"The stub lines are caused by the two floats overlapping, so `clear` fixes
  it."** Measured: the vertical overlap is **4px**, so `clear` moves the figure
  3px and fixes nothing. The real cause was paragraph 3 opening inside the 206px
  channel between the floats against a 938px measure. The wrong fix and its dead
  CSS were removed rather than left in.

**Both were caught only because the number got measured before the comment
shipped.** That is now four handoffs running.

## WHAT SHIPPED

### 1. The feather is live — and only the feather (42's item 1)

`LIVE = true`, `LAYERS = { feather: true, glow: false, fg: false }`. Masks are
42's `3 / 1 / 2`, untouched. Measured against the real files, not an intercepted
flag: three mask PNGs now fetch that never fetched before — **120.4KB total**,
all 200 — the masks resolve on the `<video>` at `100% 100%`, no foreground
canvas mounts, and `scrollWidth` is 1440 against a 1440 viewport.

**`LIVE` and `LAYERS` are not the same switch.** Do not "tidy" `LAYERS` back to
three trues to match `LIVE`; the glow and the foreground are unapproved, and the
flags being separate is what lets the owner take them one at a time.

**A real consequence of glow:false:** the glow no longer applies **at `/?tune`
either**, because the tab is seeded from `LAYERS` through `readShipped()`. That
is correct — Reset restores what the files say — but it is a change, and the
glow is now a toggle you switch on to judge it. Verified the toggle still works:
it adds `.has-fr-glow`, injects the overflow guard, and a centred row reads
`--fr-focus` 0.952.

### 2. The About footage arrives with the paragraph

The About figure was the only film-row media not in the reveal system at all —
it sat fully visible while the copy faded in beside it. It now carries
`ksd-reveal` plus **`data-reveal-step="1"`**, a new override in `stageReveals()`
(`js/deep-field-bg.js`) that sets the stagger slot explicitly.

It is a slot **index**, not a delay in ms, so it still tracks `--df-stagger` from
the tuner; a hardcoded `90ms` would have frozen this one element while every
other reveal moved with the slider. Sampled every frame through the reveal:
**0.0000 opacity divergence** across the full 900ms.

Needed because the copy is a separate column, so the figure is last in the
markup and document order would have given it slot 4 — 360ms, after the button.

### 3. `about.html` took the infinity spine and both remaining clips

- **The infinity spine** sits beside *Hard Drums, Dark Rooms*. Its PNG was
  **already transparent** — the white was the viewer compositing — and the ink
  is neutral grey (~179) carried entirely by alpha, so **nothing was
  recoloured**. Trimmed 768×512 → its 467×228 content box, lossless webp:
  **52.9KB against 148KB**, alpha identical.
- Section 02 moved from `ks-cols` to `ks-body--flow`: **a float inside CSS
  multi-column floats within its own column**, roughly half the measure.
- **Both clips were tried in section 02 first and taken out** — see the
  corrections above. They are now where the subject matches:
  `the-black-archive` in **07 A Language of Symbols**, whose copy names the
  sacred geometry, Metatron's Cube and spine model actually visible in the
  frame; `last-train-below` in **09**, beside *"two lifelong friends, two MCs"*
  and the Seattle-to-Honolulu recap. Both sections had no media and are
  single-column, so **04 and 08 keep their two-up rhythm**.
- **NOT scrubbed**, on the owner's word and the page's own convention:
  `about.html` does not load `js/spine-doc.js`, so `scrubToScroll` does not
  exist there. They loop in view like the graveyard clip — which is why the
  encode **skips `-g 4`**: dense keyframes buy seek performance and nothing
  seeks. 900×600 h264 crf 25, no audio: **640KB and 426KB from 6.5MB and
  5.9MB**, and a full-size frame from each was looked at to confirm the shadows
  do not block up.
- **`js/about-feature.js` was `querySelector` — singular** — with the element
  captured in a closure. Two failures: only the first clip would ever be found,
  and every observer entry would have driven that captured element. Now
  `querySelectorAll` plus `entry.target`.

### 4. "Purchase Rise Up", and a purchase page wired to nothing

`Download — $1` is gone. **That button was never once a real link for any
visitor** — `links.download` is null on all 28 tracks, so everyone got the
disabled placeholder. The placeholder branch is dropped because the destination
is a file in the repo. `js/music-wrap.js` had a **second** Purchase Rise Up node
that only raised a toast; it goes to the page now.

New: `purchase.html` (three editions), `css/purchase.css`,
`js/purchase-checkout.js`, `purchase-success.html`, `purchase-cancelled.html`,
`STRIPE-SETUP.md`. Built by two subagents against a fixed markup contract.

**NOTHING IS WIRED, on the owner's instruction ("the site is not live").** All
three `checkoutUrl` are `null`; artifact is `coming-soon` and says *"inventory
not yet configured"* rather than faking stock. `KSPurchase.start()` returns
`{ok:false, reason}` — never throws, never navigates, never creates `dataLayer`.
No secret of any kind is in the repo.

**THE BLOCKING FACT FOR WHOEVER WIRES IT:** this site deploys to **GitHub Pages**
(`.github/workflows/deploy-pages.yml`, from `main`). It is static — **no server,
no serverless runtime, no environment-variable mechanism**. A real Checkout
Session needs the secret key server-side and a webhook needs an endpoint, so
**neither can run on this host as configured**. Payment Links work on Pages
today; a full flow needs a small serverless backend. All of this is in
`STRIPE-SETUP.md`.

`merch.html` shows the editions too, with **every CTA an `<a>` to
purchase.html** — no buy control there, so there is ONE surface to wire later
instead of two that drift.

### 5. "Connected" on connect.html

Reported as a centring fault, and it was real — but nothing was wrong with
`text-align`. Measured at 1440: the h1 wraps to four lines and **three centre to
the pixel** (Stay 241px, "to the" 341px, Signal 360px, all at centre 720).
**"Connected" is 609px in a 523px box**, centre 762.

`--fs-hero` is `clamp(2.75rem, 9vw, 8.25rem)`, so the heading runs at 129.6px at
1440, where that one unbreakable word outgrows `.newsletter__inner`'s 56ch and
overflows right. Capped at `min(var(--fs-hero), 6.75rem)`: the word scales at
4.699px of width per 1px of font-size, so 108px puts it at 507px with 16px to
spare (111.3px is the largest that still fits).

**It only breaks wide** — the column stops growing at 56ch while 9vw does not,
crossing past ~1160px. At 900 and 390 it was centred correctly all along, which
is why it reads as desktop-only.

## THE BUG TO FIX FIRST — the deep-field background arrives frozen at `/#tracks`

**Reported by the owner at the end of this session, reproduced and measured
before it was written down. Nothing was changed; this is the next session's
first job.**

### What they saw

Sitting on Transmissions or Archive, clicking **Music** in the top nav: the
reactive background under the carousel "isn't loading", and playing a track
shows "just the video still image".

### What is actually happening

Every off-index page links Music as **`/#tracks`**, so the click is a full page
load of `index.html` that lands already inside the Music section. Measured at
1440×900:

| how you arrive at Music | deep-field video | `--df-lum` |
|---|---|---|
| **scrolled** down the page | `paused: false` — playing | 0.1576 |
| **landed** on `/#tracks` | **`paused: true`, frozen at 3.479s** | 0.1576 |
| then one scroll nudge | recovers, `currentTime` runs on to 5.291 | 0.8583 |

So the background is not failing to load — `readyState` is **4** in every case,
the clip is fully buffered. **It is parked on a single frame and never told to
start.** That is precisely "just the video still image", and it clears itself
the moment the visitor scrolls, which is why it can look intermittent.

### Where to start

`js/deep-field-bg.js`. The only `vid.play()` is in **`playTo()` (~line 658)**,
and the leg machinery that calls it is driven by `onScroll`, bound at **~line
1664**. A hash landing produces no scroll event, so nothing appears to make the
first call. Note that **the deep-link case was already thought about** — the
boot dissolve at ~line 1670 carries a comment beginning *"The deep-link case:
arriving at /#tracks lands already inside Music"* — so the sky handover was
handled and the video's first leg seemingly was not. Read that block before
changing anything; the fix is probably one call, in the place that comment
already identified.

### One discrepancy, left honest

The owner said this happens from **Transmissions and Archive but not Merch**.
Measured here, **Merch behaves identically to Transmissions** — same `/#tracks`
href on all five off-index pages, same frozen frame on arrival. Either the
Merch case is timing-dependent on their machine, or the difference is something
this harness does not reproduce. **Do not assume Merch is exempt**, and do not
assume the owner is wrong either — check it on the real machine.

### Not yet investigated

Whether the same freeze affects `/#about`, `/#merch`, `/#transmissions`,
`/#archive` or `/#newsletter`. Only `#tracks` was tested, because that is what
was reported. It would be surprising if `#tracks` were special.

## What is deliberate, so nobody fixes it

Everything in 30–42's lists still stands, except where corrected above.
Additionally:

- **`LAYERS` is feather-only while `LIVE` is true.** Not an oversight.
- **The glow does not apply at `/?tune` by default any more.** Correct
  behaviour, and a change; the toggle is how you judge it.
- **The `$1` placeholder branch is gone and must not come back.** The streaming
  buttons above it still branch because their hrefs genuinely are still null.
- **`merch.html` has a sixth stylesheet and prices**, both of which its own
  comments used to forbid. Both comments were **rewritten rather than
  contradicted**: the "NOT a shop" note named the undecided payment question as
  its reason and that is now answered *for the album only* — the garments and
  prints still have no price and no buy control, because nothing about selling
  physical merchandise has been decided.
- **The album price appears in three places** — both pages' markup and
  `EDITIONS` in `js/purchase-checkout.js`. Change one, change all three.
- **`purchase-success.html` / `purchase-cancelled.html` are absent from
  `sitemap.xml` on purpose** — indexing them would put "TRANSMISSION RECEIVED"
  in search results for people who never bought anything.
- **Masks 04–07 are still on no row**, and the markup is still 3 / 1 / 2.

## Do not do these

Everything in 19–42's lists still stands. Additionally:

- **Do not assume the feather is gated off on phones.** It is not, and no media
  query exists to make it so.
- **Do not set `LAYERS` back to three trues** to "match" `LIVE`.
- **Do not fix a stub-line wrap with `clear` without measuring the overlap
  first.** Here it was 4px and `clear` would have moved the figure 3px.
- **Do not float anything inside `ks-cols`** — CSS multi-column floats it within
  its own column.
- **Do not add `-g 4` to the About clips.** They loop; nothing seeks.
- **Do not put a buy control on `merch.html`.** Checkout stays on one surface.
- **Do not put a Stripe secret, webhook secret or price ID into this repo.**
  There is no env mechanism and no server to hold one.
- Still: never `python -m http.server`, never `file://`, no Python text-mode
  writes to JS/CSS/HTML.

## Verified vs. asserted

**Verified by tooling and looked at** (Aug 20 2026, Playwright/Chromium over
`scripts/serve.py`):

- The feather live on all three rows at 1440×900 and at 390×844, screenshotted
  and looked at; masks 200, no console or page errors.
- The reveal sampled frame-by-frame: 0.0000 divergence, plus a natural-scroll
  run and a mid-fade screenshot.
- Phone and reduced-motion reveal paths both reach opacity 1 — the case where a
  figure could have stranded invisible.
- All three About placements screenshotted at 1440 and 390; aspect 1.496 against
  1.500 native, so no crop; each clip plays only when its own section is in view.
- All 10 root pages: **zero console errors, zero page errors, zero 4xx, zero
  horizontal overflow** at 1440.
- `purchase.html` / success / cancelled at 1440 and 390; `KSPurchase.start()`
  proven to fail gracefully for all three reasons; repo-wide secret grep clean.
- connect.html line boxes at 2560/1440/1200/1024/900/390 — every line centre
  within 1px, no line overflowing.

**Asserted / not verified:**

- **No Stripe account exists and nothing was tested against Stripe.** The
  checkout path has never run end to end because there is nothing to run it
  against.
- The purchase pages have not been seen on a real phone, only at a 390 viewport.
- Keyboard focus was checked on `purchase.html` by a subagent, not by me.
- `STRIPE-SETUP.md`'s recommendations are reasoning, not something exercised.
- Everything 42 and 41 list as asserted is still asserted: the ~675ms hero-wait,
  the fork strike on a phone, Safari, the mp4 fallback.

## Git state

- Branch `feature/spine-ui-v2`. Session start `d903fda` (handoff 42).
- **Four commits** plus this handoff:
  `1710ce4` feather ships · `f090650` About media · `c32b10d` purchase rough-in ·
  `4e99759` connect heading.
- New binaries: **+1.1MB** (one webp, two mp4s).
- `--spine-build` 42, `--star-build` 29, `--df-build` 11 — **untouched**, no
  reactive-background stylesheet changed.
- `main` untouched. No PR.

## Still open

1. **THE DEEP-FIELD FREEZE AT `/#tracks`** — see the section above. Reproduced
   and measured, not yet fixed, and it is the owner's own report. **Start here.**
2. **Wire the purchase page, or decide not to yet.** Needs the owner: a Stripe
   account, real prices, and the Payment-Links-vs-backend call in
   `STRIPE-SETUP.md`. Fulfilment (secure download, email, variant capture,
   edition numbering) is entirely unbuilt.
3. **Whether phones should pay the 120.4KB of masks** — now a real question,
   since 42 wrongly assumed they did not.
4. **Whether the glow and the foreground ever ship.** Both are wired and
   judgeable at `/?tune`.
5. **`.btn` is 42px tall site-wide**, under the 44px touch target. Pinned for
   the purchase CTAs only; the real fix is in `css/components.css` and touches
   every page.
6. **No Purchase entry in the nav** — a seven-file edit, and `merch.html`
   documents why a nav that changes shape per page is worse than an absent one.
7. **connect.html's comment claims it shares geometry with index.html's
   newsletter block so the two "can never drift".** index.html no longer has
   that heading, so the note is already stale.
8. **Assign masks 04–07 to rows**, or call 3 / 1 / 2 final.
9. **Judge the hero-wait (~675ms)**, and the fork strike on a phone.
10. **A glow gradient block** for `rain-transmission-rooftop`.
11. **A JS transcription of the vertebral rhythm** for mask 06, plus a parity
    story for 07.
12. Rename the reference PNGs (`Untitled-2.png`, `Untitled-2fix.png`).
13. **Mobile judgement calls** (41's item 5): nav links 25px, signup button
    42px, tablets ≥768 taking the 4.9MB clip, About at 3.55:1 under AA.
14. **Whether the VHS should run on phones.**
15. **The lab's fate**, now that it duplicates `index.html`.
16. **Phase two of the Music handoff** — playback gating; four hooks, none used.
17. **A `-g 48` re-export of the spine render.**
18. The two filmrow labs still scrubbing; the doc-rail ring inversion; the
    frame-budget decision; `music.html` still a redirect stub; stale amber-era
    `?tune` TIPS prose; the two missing trivia files; the astral scrim; the
    inherited pile.

---

## Starting the next V2 chat

Attach this file. The working folder is
`C:\Users\Haight\Desktop\kundalini-spines-spine-ui` on `feature/spine-ui-v2`.
Serve with `python scripts/serve.py`, browse `http://localhost:8000` — never
`file://`, never `python -m http.server`.

> Here's the latest V2 handoff. The feather is live, the About page is finished,
> and there's a purchase page roughed in but wired to nothing. I want to
> <thing> this session.

The owner decides when the site is ready to be finished, so **do not wire
Stripe, ship the glow, or promote anything to live unprompted.** If they want a
suggestion, item 4 (the 44px touch target) is self-contained and needs no
decision from them; item 2 is one media query once they say yes or no.
