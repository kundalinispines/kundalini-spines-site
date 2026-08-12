# Read this before you build from README.md

Added Aug 12 2026, after this drop was implemented. Kept in the folder rather
than only in the handoff because whoever opens this next will read `README.md`
first, and `README.md` is the file that caused the problem.

**This was shipped.** It lives in `css/spine-ui.css` and `js/spine-ui.js` on
`feature/spine-ui-v2`, commit `2c798ac`. The folder is kept as the reference the
implementation was judged against, not as work still to do.

## `README.md` is a summary, not a spec — `NavigatorReference.jsx` is the spec

The README describes six changes. `NavigatorReference.jsx` does substantially
more, and **the single most visible behaviour in it is described in neither the
README nor `spine-ui.motion.patch.css`**: a four-phase reroute between two cards
(the established line retracts back into the spine, a lamp carries the focus
along the column, the new line fires, then the card lands). It was built from the
README first, and the owner's response was that it did not land like the design
did. Everything below was then found by reading the JSX.

Also absent from the prose: the preview draws the *whole* dotted route rather
than a stub; the connector elbow sits at 55% of the run to the card; the card's
head row sits level with the node; the endpoint square rides the tip of the
scaled rule at opacity .62.

The README's closing section ("Two things the reference does that your navigator
may already handle") frames the preview path and the card placement as things to
*check*. Both were checked. Neither was already handled.

## Three claims in the drop that are wrong against this codebase

1. **"`--connector-active` is declared and read by nothing."** It was being
   applied as an inline `connEl.style.stroke = 'var(--connector-active)'` at the
   end of the connector draw, which is why a settled connector had always been
   bone. It is a class now.
2. **`transition` on `.spine-card.is-open`** (patch section 3) is (0,2,0) against
   the list on `.spine-card` (0,1,0), and a transition runs off the after-change
   style — so adding the class swaps the whole list and the card snaps in instead
   of rising. It would have silently deleted the card's entrance.
3. **`animation-delay: var(--ks-phase-delay)`** (patch section 5) is dead on
   `.spine-node__ping` and `.spine-point`. `js/spine-ui.js` has always written
   `style.animationDelay` inline on those — that is the per-element sync to the
   comet head — and inline beats a stylesheet. The phase is folded into the
   inline value instead. Relatedly, the README's restart snippet uses the
   `animation` shorthand, whose `none` writes every longhand inline including
   `animation-delay: 0s`, wiping that sync permanently.

## Two places the shipped code departs from the reference on purpose

- **`yEnd`.** The reference hardcodes `top + 46` (the card's head row). At the
  ends of the rail that cannot be honoured — a 320px card's head row will not sit
  level with a node at 88% of a 900px window — and it threw a 190–220px vertical
  connector leg. The arrival point is clamped toward the node's own height
  instead; worst leg falls to 45px. The full measurement is in `geoFor()`.
- **`animation-iteration-count`.** Kept at 1, per the reference, which means the
  ping and point flashes do not fire while a card is open. It was "fixed" to 2
  during implementation and rejected: an open card is meant to be one departing
  beam on an otherwise still column.

## Do not port

`NavigatorReference.jsx` and `navigator-motion.css` are reference only. The JSX's
card copy is invented placeholder text and its node table is the pre-Aug-11 six
node model (Story / Members / Music / Transmissions / Archive / Ethos), which no
longer matches `NODES[]` in `js/spine-ui.js`. `spine-ui.motion.patch.css` is
superseded — its content is folded into `css/spine-ui.css`, with the corrections
above applied. Loading it now would fight the shipped rules.
