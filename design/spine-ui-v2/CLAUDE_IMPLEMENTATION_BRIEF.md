# Claude Implementation Brief — Spine UI V2

This brief is intended for Claude Code while working inside the experimental Kundalini Spines redesign branch.

## Mission
Port the existing Kundalini Spines website into a new spine-based UI without discarding core production systems.

## Mandatory protected systems
Do not casually rewrite or remove the following:

1. Existing hero video
2. Existing music experience
3. Existing audio-reactive / side-chained background
4. Existing track carousel and track cards
5. Existing Archive / RSS feed system
6. Existing tuner / live visual control system
7. Existing site atmosphere / background

## Core design references
Use these files as the main visual references:

- `mockups/00-master-concept-spine-navigation.png`
- `mockups/01-idle-resting.png`
- `mockups/02-hover-pre-focus.png`
- `mockups/03-card-activation.png`
- `mockups/04-active-view-reading-mode.png`
- `mockups/05-transition-next-node.png`

Read these docs before implementation:

- `DESIGN_REFERENCE.md`
- `MOCKUP_CATALOG.md`
- `INTERACTION_STATES.md`

## Implementation philosophy
This is a **progressive refactor**, not a full rebuild.

The spine should become the new interaction/navigation framework around existing working experiences.

## Existing-site integration goals

### Hero
- keep the current hero as the opening section
- introduce the spine after or through the hero transition

### Music
- keep the current music experience highly prominent
- preserve the existing reactive background behavior
- preserve current track carousel logic
- treat Music as an immersive destination, not a small informational card

### Archive
- preserve current RSS/feed logic
- treat Archive as a major destination node
- allow it to fill a large card or immersive content shell

### Tuner
- do not remove it
- extend it to tune spine-specific properties
- reuse the existing parameter architecture when possible

## State expectations
The spine should support:

- idle / resting
- hover / pre-focus
- activation
- active / reading
- transition / next node

## Design constraints
- Use the existing site background rather than the black mockup background.
- Maintain a restrained, technical, occult, schematic tone.
- Use rigid connector geometry.
- Keep ambient spine motion subtle.
- Avoid turning the site into a generic dashboard.

## Recommended build order
1. Audit existing site architecture.
2. Build spine shell and nodes.
3. Add idle ambient animation.
4. Add hover / pre-focus state.
5. Add activation / card state proof-of-concept.
6. Integrate one smaller content node.
7. Integrate Music as immersive.
8. Integrate Archive as immersive/large-card.
9. Adapt the tuner.
10. Refine responsive behavior.

## Safety reminder
All work should occur on the experimental redesign branch and in the separate experimental working copy.
