# Kundalini Spines — Spine UI V2 Handoff 57

**Date:** September 1, 2026

Thirty-ninth handoff of the **Spine UI V2** track. `56` owns the Stripe webhook
and the wrong-diagnosis write-up; `55` owns the server and the refund bug; `51`
owns the Cloudflare migration recipe. **This session:** footer only. No sky
work, no Stripe work, no build numbers touched, no transmission filed.

---

## The one-line version

The footer's `OPEN` chip became part of the link it describes, and two bugs
fell out of doing that — a missing `var()` fallback that had been printing
seven words in pure black on five of six pages, and an `OPEN` chip that
measured **3.42:1 against the real sky** where WCAG AA wants 4.5. Both fixed,
both measured, three commits live on `main`. The measurement harness is the
most reusable thing here and is written up in full below.

---

## Corrections to handoff 56

1. **`56` is accurate as far as this session touched it.** Nothing in the
   webhook, the KV records or the STRIPE-SETUP corrections was revisited, and
   nothing here contradicts them.
2. **`56` item 6 gains a seventh instance, and it is the worst-shaped one yet.**
   The recurring defect class is "nothing tests a page's copy against its own
   state." This session found the same class in CSS: `css/site-footer.css`
   *declared* a colour that five of the six pages never rendered, and the
   declaration failed **silently and invisibly** — no console error, no failed
   request, correct-looking output. Copy that lies is findable by reading. A
   stylesheet that lies is not.
3. **The branch model in `kundalini-session-end` did not match what happened.**
   That skill says V2 work lives on `feature/spine-ui-v2` and `main` is synced
   only on the owner's word. This session worked in a `claude/` worktree and
   pushed **straight to `main` three times, each on the owner's explicit word
   at the time**. That is not a violation of the rule, but the skill has no
   shape for it, and the next session should not read the skill and conclude
   this session went around it.

---

## What shipped

Three commits, all on `main`, all live and verified on `kundalinispines.com`.

| commit | what |
| --- | --- |
| `b9e2e77` | the word `OPEN` is part of the link, not a label beside it |
| `424002f` | `--node-color` fallback; seven HZ labels stop printing black |
| `39270d2` | `OPEN` contrast measured and fixed, 3.42 → 4.77:1 worst case |

### 1. `OPEN` is clickable (`b9e2e77`)

Owner's request. The chip said `OPEN` and was the one part of the row that went
nowhere. `js/site-footer.js` `row()` now moves the chip **inside** the row's
single anchor, and the anchor takes over the `space-between` the row was doing.
`STANDBY` keeps its chip outside — there is nothing to click, and a link that
goes nowhere is the lie that footer already refuses to tell.

Inside the anchor rather than a click handler on the span, deliberately: a real
anchor keeps the keyboard, the middle click, the status bar and the copy-link
menu. The label is wrapped by **moving the anchor's child nodes**, not by
reading `textContent`, so a link that ever carries an icon keeps it.

Consequence worth knowing: the whole row is now the link — label, gutter and
word. The owner was told and accepted it.

### 2. The `var()` trap (`424002f`)

`--node-color` is defined at `:root` in `css/spine-doc.css`, and **`index.html`
is the only page that links that file.** Checked link tag by link tag: about,
merch, transmissions, archive and connect all *mention* `spine-doc.css` in
their comments and none of them load it. (An earlier read of this session said
"index and connect" — that was `grep -c` counting comment mentions, and it was
wrong. Do not trust a mention for a link.)

On those five pages `rgba(var(--node-color), 0.75)` is **invalid at
computed-value time**, and the whole declaration is dropped. An invalid custom
property value does **not** fall back to an earlier valid declaration of the
same property — it computes to `unset`.

- For `.sf-row__state--open` that was survivable and hid the bug: the chip
  inherited the link's `--text-secondary` and its border fell through to
  `currentColor`. It looked fine. It wore `#9DB2C0` on five pages and the
  intended cold white on one, and neither was a decision anyone made.
- For `.sf__seed-hz` it was not survivable. `fill` inherits, the parent `<g>`
  sets none, and the initial value is **black**. Measured on the live site:
  all seven frequency labels returned `rgb(0, 0, 0)` on merch and
  `rgba(228, 232, 235, 0.24)` on index. **Seven black words on a night sky,
  invisible since the footer shipped.**

This is the third time this exact trap has been sprung in this footer — see the
`ACCENT` note in `js/site-footer.js`, where the wordmark's brightest stop
rendered pure black for the same reason. **Any `var(--node-color)` in these
files needs the literal after it.**

### 3. The contrast fix (`39270d2`)

`css/site-footer.css` had said in writing that `--open` had never been judged,
right underneath the `STANDBY` note that had been. It was judged this session
and it was failing. Numbers and method below.

---

## The measurement harness, written up so nobody re-derives it

Playwright from Python, one browser instance, `python scripts/serve.py 8043`.

1. Screenshot the element as it renders (**A**).
2. Screenshot the same clip with `visibility: hidden` on that element (**B**).
   That removes the ink *and* its border, exposing the background that was
   actually behind the glyphs. No guessing at what the sky was doing under it.
3. Per-pixel WCAG between A and B, restricted to `delta >= 0.90 * delta.max()`
   — the fully-inked pixels. Antialiased edges always score badly and mean
   nothing.
4. **Sweep viewports.** The same chip measured 3.42:1 at 834×1112 and 7.9:1
   over dark sky. One viewport is one sample, not an answer.
5. **Run a known-good element through the same code as a control.** `STANDBY`
   has a recorded ~8.5:1 in the stylesheet; the harness returned 9.36:1 for it.
   That agreement is what made the `OPEN` number worth acting on.

For a glyph carrying a `text-shadow`, A-vs-B **understates** — the ink sits on
shadow-darkened sky, not raw sky. Sample the halo (`0.10 <= delta < 0.35`) from
A for the true local background, or knowingly quote the conservative number.

**Headless is fine for this.** Headless vs headed on the same footer region:
mean 33.28 vs 33.27. And the footer sky is not a canvas at all —
`document.querySelectorAll('canvas')` is empty on merch.html — so the WebGL
caution from the sky work does not apply here.

### The numbers

228 chip samples, 6 pages × 6 viewports, Sept 1 2026. Worst core-pixel ratio:

| viewport | before | after | `STANDBY` (control) |
| --- | --- | --- | --- |
| 834×1112 | **3.42** | 4.77 | 9.27 |
| 1024×768 | **4.40** | 6.31 | 11.04 |
| 1440×900 | **4.57** | 6.72 | 11.30 |
| 1920×1080 | **4.66** | 6.86 | 11.21 |
| 390×844 | **4.09** | 6.70 | 10.79 |

The failures are all where the footer lands on the lit nebula — the NAVIGATE
column at most sizes. On the worst chip, **100% of the fully-inked pixels were
under 4.5:1.** Over dark sky the same chip measured 7.9:1, which is exactly why
one page at one size had said "fine" for as long as the footer has existed.

The remedy is the one `STANDBY` already uses and **it needed both halves**: the
two-pass shadow alone reached only 3.91:1. Full alpha *with* the shadow
measures 6.42:1 against the pixels the glyph is actually drawn on, and 4.77:1
by the conservative reading above.

---

## Verified vs. asserted

**Verified** (measured or seen, this session):

- All three commits are on `origin/main` and serving from `kundalinispines.com`
  — computed styles read back off the live pages after each deploy.
- Every `OPEN` chip hit-tests to its own `href` with a pointer cursor; both
  `STANDBY` chips resolve to no link. Checked on live merch and live index.
- A real click on the word `OPEN` navigated to `merch.html`.
- Hover with a real pointer puts the row's link into `:hover` from the chip
  itself — proof the chip is inside the anchor.
- Layout unchanged: labels flush left, chips flush right, same baseline and
  9px size, at 1440 and at 375.
- The seven HZ labels, live, on merch: `rgba(228, 232, 235, 0.24)` ×7.
- The footer was **screenshotted and looked at** — mobile at 375, and 8×
  magnified crops of the worst chip before and after. Not judged blind.

**Asserted, not verified:**

- That the deploy pipeline ran green. `gh` is **not installed on this box**
  (checked both shells), so no CI run was ever read. Every "it is live" claim
  here comes from reading the live site, which is better evidence anyway.
- That 3.42:1 is the true global worst. It is the worst of 228 samples across
  the viewports listed; a viewport not swept could be worse.
- The `~8.5:1` recorded for `STANDBY` in August was not reproduced exactly —
  this harness says 9.36:1. Same order, different spot or scroll. Nobody
  should treat either number as canonical to two decimals.

---

## Do not do these

1. **Do not write `var(--node-color)` without the literal fallback** in
   `css/site-footer.css` or `js/site-footer.js`. Three separate bugs, one
   cause. `var(--node-color, 228, 232, 235)`.
2. **Do not "simplify" the OPEN chip back to a sibling of the link.** It is
   inside the anchor on purpose and the whole row is the link on purpose.
3. **Do not make the resting `OPEN` chip dimmer to create a hover state.** The
   ink is at full alpha *because* of the measurement; hover moved to the border
   alone for exactly this reason, and the label beside it still lifts.
4. **Do not judge legibility on this site from the declared colour values.**
   Near-white on dark "obviously fine" was wrong by 1.1 stops. Measure.
5. **Do not use `python -m http.server`** for any of this
   (no Range header), and **do not run two Chrome sweeps at once** — one
   instance, sequential pages.
6. **Do not read a `grep -c` hit for a stylesheet as proof a page loads it.**
   Comments mention files. Check for the `<link>` tag.

---

## What is deliberate, so nobody fixes it

- **`STANDBY` chips are not links and sit outside the anchor.** TikTok and
  Spotify. Unchanged intent from the original footer.
- **The whole row is clickable on `OPEN` rows**, gutter included. Owner
  accepted this explicitly when it was raised.
- **The chip's border stays at `0.28` and is unjudged.** It is decoration; the
  word carries the meaning. Over the bright nebula the box is faint. If the box
  is ever made to *mean* something, it needs its own measurement.
- **`index.html` is the only page loading `spine-doc.css`.** Not fixed by
  adding the stylesheet to five pages — the fallback was the smaller, safer
  change, and the token file carries far more than one triplet.
- **No transmission was filed.** A footer affordance and a contrast fix are not
  something a visitor would notice as a milestone. If the owner disagrees, the
  `kundalini-transmission` skill owns it and it is a one-off commit.

---

## Git state

- `main` — `39270d2`, has all three commits, deployed and live.
- Production worktree `C:\Users\Haight\Desktop\kundalini-spines` — on `main` at
  `39270d2`, **clean**, fast-forwarded this session.
- `feature/spine-ui-v2` — `29e53fc` on the remote, **3 behind `main` and 0
  ahead**. It does not have the footer work.
- V2 worktree `C:\Users\Haight\Desktop\kundalini-spines-spine-ui` — at
  `df80a66`, **6 behind its own remote**. Not touched this session.

**The V2 branch can be brought level with one fast-forward** — there is nothing
to merge, the divergence is zero:

```
git push origin main:feature/spine-ui-v2
```

Left undone on purpose: it is a branch-model act, and the owner was not asked.

---

## Still open

Carried from `56`, all unchanged — nothing in this session touched Stripe:

1. **No real customer sale has gone through the webhook.** A `403` on Event
   deliveries means the edge bot filter, not the handler.
2. **The async payment branch is untested.**
3. **No download-count cap.** Still the highest-value hardening.
4. **Reissue is still manual.**
5. **Deluxe and Artifact remain `checkoutUrl: null`.** Artifact needs a
   `status` flip too.
6. **Nothing tests any page's copy against its own state** — now seven
   instances, and this session proved the class extends to stylesheets.

New this session:

7. **`feature/spine-ui-v2` is 3 behind `main`.** One command, above.
8. **The chip's border has never been measured.** Item, not defect — see
   "What is deliberate".
9. **No other `var()` in the codebase was audited for the same missing
   fallback.** Three were found by accident in one file. A sweep for
   `var(--[a-z-]+)` used inside `rgb()`/`rgba()`/`fill` on pages that may not
   define the token is a half-hour job that would close the class.

---

## Starting the next V2 chat

Attach this file. `56` remains required reading for the Stripe webhook and the
wrong-diagnosis write-up; `55` for the refund bug and the copy sweep; `51` for
the Cloudflare migration recipe.

> Here's the latest V2 handoff for Kundalini Spines. I want to work on <thing>
> this session.

If the work is V2 track, the new session needs
`C:\Users\Haight\Desktop\kundalini-spines-spine-ui` and should confirm it is on
`feature/spine-ui-v2` **and pull** before editing — it is 6 behind. If the work
is a direct fix to the live site like this session's, it happens on `main`, and
**every push to `main` is a deploy**, so it happens only on the owner's word,
each time.
