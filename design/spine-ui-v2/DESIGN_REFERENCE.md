# Spine UI V2 — Design Reference

## Purpose

This document is the primary source-of-truth for the Spine UI V2 direction for the Kundalini Spines website redesign.

The redesign should be treated as a **progressive refactor of the existing site**, not a full rebuild. Existing working production systems should be preserved and integrated into the new spine-driven UI.

## Authoritative visual references

Use the following mockups as the primary visual references, in this order:

1. `mockups/00-master-concept-spine-navigation.png` — master concept / overall layout direction
2. `mockups/01-idle-resting.png` — idle state
3. `mockups/02-hover-pre-focus.png` — hover / pre-focus state
4. `mockups/03-card-activation.png` — activation state
5. `mockups/04-active-view-reading-mode.png` — active/open reading state
6. `mockups/05-transition-next-node.png` — transition / next-node state

## What is authoritative

The following qualities are intentional and should be preserved in the implementation:

- Central vertical **spine** as the main navigation framework.
- The spine should feel **alive**, with subtle ambient motion.
- Nodes are associated with content destinations.
- Connectors should be **rigid, geometric, technical**, and drawn outward from the spine.
- Node interactions should support distinct states:
  - idle
  - hover / pre-focus
  - activation
  - active / reading
  - transition
- Smaller sections can appear as connected cards.
- The design language should feel:
  - technical
  - architectural
  - occult
  - premium
  - cinematic
  - restrained
- Typography and card styling should feel schematic and intentional, not playful.

## What is NOT authoritative

The mockups are blueprint presentations, not literal final-production comps.

The following should **not** be copied literally:

- The plain black mockup background.
- Placeholder copy like “Lorem ipsum”.
- Placeholder brand labels like `BRANDNAME`.
- Presentation-only callout panels whose only purpose is to explain interaction states.
- Exact sample labels if current site terminology differs.

## Production design constraints

The final implementation must preserve the existing Kundalini Spines atmosphere.

Important constraints:

- Keep the **existing site background** rather than replacing it with a plain black background.
- Preserve the **existing hero video** as the opening experience.
- Preserve the **existing music experience**, especially:
  - track carousel
  - audio-reactive / side-chained reactive background
  - current music visual prominence
- Preserve the **Archive / RSS** system and port it into the new navigation model.
- Preserve the **tuner** and adapt it to the new spine system.

## Experience hierarchy

The redesign should distinguish between:

### 1. Entrance experience
- Hero video

### 2. Navigation framework
- Spine UI

### 3. Primary immersive nodes
- Music
- Archive

### 4. Smaller connected nodes / cards
- Story
- Members
- Ethos
- Timeline
- Other informational sections

## Music node guidance

Music is one of the most important experiences on the site.

When the Music node is activated:

- the music experience should become large and immersive
- the existing carousel remains the main viewport experience
- the reactive background remains intact
- the spine remains visible only as a secondary navigation layer if needed
- small auxiliary cards should not visually overpower the music experience

## Archive node guidance

The Archive should be able to expand into a major content experience similar in importance to the Music node.

When Archive is active:

- RSS/feed content becomes the dominant content area
- the feed may occupy a large card or immersive panel
- smaller secondary node cards can recede
- the spine still anchors the interaction

## Tuner guidance

The current tuner must survive the redesign.

It should continue to expose useful live controls and may be extended to adjust things like:

- spine opacity
- glow intensity
- node pulse
- connector brightness
- card opacity
- transition speed
- immersive state opacity levels

## Final reminder

This redesign is a **port/refactor** of the existing site into a spine-driven UI system. It is not a blank-slate redesign.
