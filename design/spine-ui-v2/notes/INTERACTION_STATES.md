# Spine UI V2 — Interaction State Specification

## State 01 — Idle / Resting
Even though an exported State 01 reference is not included in this package, implementation should support it.

Behavior:
- all nodes available but restrained
- extremely subtle spine breathing
- faint vertical energy drift
- low-level node micro-pulses
- no content fully expanded
- no aggressive glow or particle effects

## State 02 — Hover / Pre-Focus
Reference: `../mockups/states/02-hover-prefocus.png`

Behavior:
- target node brightens
- subtle pulse ring expands
- related connector path partially draws/previews
- destination may appear as a faint ghost state
- no full destination launch yet

## State 03 — Activation
Reference: `../mockups/states/03-card-activation.png`

Standard card sequence:
1. node locks active
2. local pulse fires
3. rigid connector draws from spine
4. line reaches endpoint
5. card scales/fades/emerges
6. other nodes remain navigable but visually secondary

Immersive destinations use this same entry vocabulary but expand the underlying existing experience.

## State 04 — Active / Focus / Reading
Even though an exported State 04 reference is not included in this package, implementation should support it.

Behavior:
- selected destination dominates
- active node remains locked and gently pulsing
- established connector remains visible for card destinations
- surrounding nodes/cards recede
- subtle energy continues through adjacent vertebrae

### Music Active Mode
- existing music carousel dominates the viewport
- existing audio-reactive / side-chained background stays prominent
- avoid overlay clutter
- spine becomes secondary but remains available

### Archive Active Mode
- archive/RSS experience expands substantially or full-screen
- existing feed/data behavior remains intact
- spine remains available as restrained navigation

## State 05 — Transition / Next Node
Reference: `../mockups/states/05-node-transition.png`

Sequence:
1. current content recedes
2. old connector fades/retracts
3. energy travels through spine toward next node
4. next node gains focus
5. new connector draws or immersive shell expands
6. new destination becomes active

## Motion Character
Motion should be deliberate, restrained, architectural, anatomical, and slightly uncanny.

Avoid elastic bounce, jelly deformation, bright cyberpunk glow, excessive particles, fast looping pulses, or expensive decorative filters.

## Reduced Motion
Respect `prefers-reduced-motion` by reducing/removing traveling energy and continuous pulse loops while preserving all navigation and state changes.
