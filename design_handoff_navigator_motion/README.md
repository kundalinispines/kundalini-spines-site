# Handoff: Navigator motion and card deployment

## Overview

Six changes to the Spine UI V2 navigator on `feature/spine-ui-v2`. They make the idle column read as alive, make the crosshair point at the thing it connects to, and make the rising energy pass something a node *causes* rather than a loop that happens to be running.

Nothing here is a redesign. Every change either retargets a token `css/spine-ui.css` already owns, uses a token that file declares but never reads, or adds a state it does not have.

## About the design files

`spine-ui.motion.patch.css` is the deliverable and it is **real, drop-in CSS written against your existing class names** — `.spine-node`, `.spine-node__reticle`, `.spine-card`, `.spine-connectors`, `.spine-point`, `.spine__energy`, `.spine-stage`. Load it after `css/spine-ui.css` and it applies to the navigator you already have. Delete it and the navigator returns exactly as it was; `css/spine-ui.css` is never edited.

The other two files are **references, not code to ship**:

- `NavigatorReference.jsx` — a React recreation used to judge the changes. Its card content is invented placeholder copy and its markup is not yours. Do not port it.
- `navigator-motion.css` — the same rules written for that recreation's own class names. Kept only so you can see the keyframes in isolation.

**The card content in the reference does not match your site.** Your cards read from the real content model; the reference carries stand-in copy. Only the *behaviour and the surface treatment* transfer.

## Fidelity

**High-fidelity.** Every value below is a real number, not an approximation, and each one was judged on screen against the live nebula backdrop.

---

## The six changes

### 1. The idle string reads brighter — CSS only

| Token | Was | Now |
|---|---|---|
| `--node-idle-opacity` | 0.79 | **0.88** |
| `--node-glow-a` | 0.59 | **0.68** |
| `--node-dim-when-active` | 0.78 | **0.86** |

Over the nebula the six nodes at 0.79 sat too far back to read as live destinations. Raised as tokens, not as rules, so the `?tune` panel still drives them.

### 2. The crosshair is one-sided and points at the card — CSS only

`.spine-node__reticle .rx` is a 300px rule centred on the node, so half of it leaves the spine on the side the card is **not** on — a line with nothing at the end of it, competing with the connector that does mean something.

It now runs `calc(var(--reticle-w) / 2)`, anchored at the dot and growing toward `data-side`. The gradient is the node's own amber with a deliberately **weak** falloff — `.92 → .86 at 68% → .62` — so it holds its colour end to end rather than dying in the first third. Three drop-shadows (3px / 9px / 20px at .9 / .6 / .34) give it bloom, and `scaleY(.6)` thins the ink so it reads as emitted light rather than a drawn rule.

The endpoint square follows to the same side, takes the amber, and **fades out at full open**: it is a pre-focus mark saying "the line stops here" while the destination is hypothetical, and once the card is open the card *is* the endpoint.

The existing `scaleX(.62)` / `scaleX(1)` hover and active states are preserved — only the anchor and the vertical scale are added.

### 3. The emission reaches the card — CSS only

The open card takes a hairline of the same amber: `outline: 1px solid rgba(var(--node-color), .34)` plus `0 0 22px -6px` of the same at .30, and its first ghost frame goes to .22.

**Outline, not border, and this matters.** `.spine-card`'s border is doing the glass work — lit lip on the spine side, darkened far edge — and a second colour on those pixels fights it. `outline` sits outside the box, so the two never overlap. The rule restates the two shadows the original already carries, because it is a whole-property override.

### 4. The established connector is lit — CSS + one line of JS

`--connector-active` is declared in `css/spine-ui.css` and **read by nothing**. At `--connector-color` (bone at .72) over the lit sky the settled line is barely separable from the backdrop, which reads as a connector that never drew rather than as one drawn quietly.

**JS:** in `js/spine-ui.js`, where the connector draw completes, add `is-established` to the `.conn-active` path. Remove it when the connector retracts.

### 5. The pass runs once, parks, and departs from the open node — CSS + JS

Three behaviours, one mechanism.

**Departs from the open node.** At full deployment the rising light restarts at that node's own height and carries on up the column, so the energy reads as leaving the thing you just activated. Implemented as a **negative** `animation-delay`, which *enters* the pass part-way through rather than restarting and clipping it — so its speed never changes.

The pass runs `top: 92% → 8%`, so for a node at `y` percent:

```js
const ENERGY_MS = parseFloat(getComputedStyle(document.documentElement)
  .getPropertyValue('--spine-ui-energy-ms'));           // 7000
const delay = -Math.round(((92 - node.y) / 84) * ENERGY_MS);
stage.style.setProperty('--ks-phase-delay', delay + 'ms');
```

**Every layer riding the pass takes the same offset or they desync** — `.spine__energy`, `.spine-node__ping` and `.spine-point` all read `--ks-phase-delay` in the patch.

The delay only takes effect on a fresh animation, so the three layers must be **restarted** when it changes. Either toggle the animation off and force a reflow, or re-key the elements:

```js
[energyEl, ...pingEls, ...pointEls].forEach(el => {
  el.style.animation = 'none';
  void el.offsetWidth;          // reflow — do not remove, this is the restart
  el.style.animation = '';
});
```

**Runs once and parks.** `.spine-stage.is-card` sets `animation-iteration-count: 1` and `animation-fill-mode: forwards`, so the light finishes its climb, leaves the top of the column and stays gone until the next activation. Looping, the rise reads as a metronome that happens to be running.

**Caused, not scheduled.** Add `has-chosen` to `.spine-stage` on the first activation and never remove it. The free-running rise then belongs to the opening state only — it is what tells a visitor the column is alive before they have touched it. A beam climbing from the base *between* two cards is the system talking over itself.

### 6. The open node's ping is bigger, not brighter — CSS only

`.spine-node.is-active .spine-node__ping` goes 26px → **46px**. It is already the lit one, so size is the only axis left that reads as "and this one".

---

## Two things the reference does that your navigator may already handle

Both were bugs in the React recreation, not in your code — check whether `positionCard()` already covers them.

**The card sits beside its node.** Pinned to the top of the stage, a node at 87% threw a ~350px vertical connector leg across the whole frame and the line stopped reading as "this node reaches that card". The card's head row should sit level with the node, clamped to a 90px floor and 24px above the stage foot — which is what your `positionCard` clamp already describes.

**The preview and the deployed line must be the same path.** Computed separately — the dotted preview from one inset, the lit line from the card's measured rect — the route the preview promises visibly snaps to a different one the moment it establishes. Derive both from one function of node + stage, and position the card *from* that geometry rather than deriving the geometry from the card. The card's own height must not enter it: cap with `max-height` and scroll `.spine-card__body`, which `css/spine-ui.css` already does.

---

## Design tokens touched

```
--node-idle-opacity      0.88     (was 0.79)
--node-glow-a            0.68     (was 0.59)
--node-dim-when-active   0.86     (was 0.78)
--ks-phase-delay         NEW      negative ms, written to .spine-stage by JS
```

Unchanged and relied on: `--node-color` (240,165,92), `--reticle-w` (300px), `--connector-active`, `--connector-color`, `--card-enter-ms`, `--connector-draw-ms`, `--spine-ui-energy-ms`, `--ease-standard`, `--motion-base`.

## New classes the JS must set

| Class | On | When |
|---|---|---|
| `is-established` | `.conn-active` path | connector draw completes; removed on retract |
| `has-chosen` | `.spine-stage` | first activation, never removed |
| `--ks-phase-delay` | `.spine-stage` (property) | on activation, from the formula above |

## Reduced motion

The patch clears the crosshair's drop-shadows under `prefers-reduced-motion`. Everything else inherits the suppression `css/spine-ui.css` already declares; no new animation is introduced that is not gated by an existing rule.

## Files

```
spine-ui.motion.patch.css   THE DELIVERABLE — load after css/spine-ui.css
NavigatorReference.jsx         Reference only. Placeholder copy, not your markup.
navigator-motion.css        Reference only. The same rules for the reference's classes.
```
