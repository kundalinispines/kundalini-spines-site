# Spine UI V2 — Interaction States

This document summarizes the intended state model shown in the mockups.

## State 01 — Idle / Resting
**Reference:** `mockups/01-idle-resting.png`

### Behavior
- spine is visible and centered
- all nodes are visible
- no node is active
- no main content card is expanded
- ghosted/collapsed secondary card presence is acceptable
- subtle ambient motion continues

### Animation intent
- soft breath pulse
- faint energy moving vertically through the spine
- occasional micro pulse
- low visual noise

---

## State 02 — Hover / Pre-Focus
**Reference:** `mockups/02-hover-pre-focus.png`

### Behavior
- a hovered node brightens
- focus ring expands or pulses outward
- possible related paths are previewed
- card endpoints remain ghosted or lightly previewed
- the system visually anticipates activation

### Animation intent
- short hover pulse
- preview line draw to partial length
- subtle particle or energy motion toward potential targets

---

## State 03 — Card Activation
**Reference:** `mockups/03-card-activation.png`

### Behavior
- node becomes active
- rigid connector lines fire outward from the node
- lines fill visibly from the spine toward the content
- the main card scales/emerges into place
- secondary cards may appear in a staggered sequence

### Animation intent
- node pulse
- connector draw
- opacity + scale entrance
- subtle layered-depth emergence

---

## State 04 — Active View / Reading Mode
**Reference:** `mockups/04-active-view-reading-mode.png`

### Behavior
- one card becomes the main readable content surface
- the active node remains visually locked
- secondary cards remain visible but dimmed
- the spine continues subtle ambient motion
- the user can continue reading or switch nodes

### Animation intent
- minimal movement
- steady active node pulse
- restrained line glow
- card “breathing” at very low intensity if appropriate

---

## State 05 — Transition / Next Node
**Reference:** `mockups/05-transition-next-node.png`

### Behavior
- current content exits or recedes
- active connector fades/disconnects
- energy pulse travels through the spine
- next target node highlights
- new connector draws
- next content enters

### Animation intent
- pulse transfer through spine
- old card fade/slide back
- new card fade/scale in
- connector rerouting

---

## Implementation note

Not every content type must use the exact same card behavior.

Primary immersive nodes like **Music** and **Archive** may adopt the same state logic conceptually while presenting content in larger custom shells.
