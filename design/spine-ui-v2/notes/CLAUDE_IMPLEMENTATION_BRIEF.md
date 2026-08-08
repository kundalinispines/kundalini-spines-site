# Claude Code — Spine UI V2 Implementation Brief

## Read First
Before modifying the site, read:
1. `../DESIGN_REFERENCE.md`
2. `MOCKUP_CATALOG.md`
3. `INTERACTION_STATES.md`
4. visually inspect all files under `../mockups/`

## This Is Not a Greenfield Rebuild
Audit the existing site first. The Spine UI is a presentation/navigation layer around working production systems.

## Mandatory Audit
Locate and document:
- hero video component
- track carousel and track-card components
- audio/player lifecycle and state
- reactive / side-chained music background
- Archive route/page
- RSS fetching/parsing/caching/rendering
- visual tuner and custom sliders
- tuner persistence / CSS-variable or state architecture
- existing site background system
- routing/navigation
- responsive rules
- animation stack

Create a reuse matrix: `KEEP`, `WRAP`, `MODIFY`, `REPLACE`.
`REPLACE` should be rare and justified.

## Non-Negotiable Protection Rules
- Do not rebuild the current reactive music background unless a proven technical limitation requires it.
- Do not duplicate the track carousel.
- Do not discard existing RSS/archive behavior.
- Do not remove the tuner.
- Do not replace the current website background with the mockup's black board.
- Do not perform a full-site rewrite.

## Experience Hierarchy
1. Existing hero video = entrance
2. Spine UI = navigation/world interface
3. Music = immersive primary destination
4. Archive/RSS = immersive primary destination
5. Story/Members/Ethos/Timeline/etc. = smaller connected cards

## Music Mode
When Music activates:
- keep the existing music component
- keep current player/track state
- keep side-chain/audio-reactive behavior
- keep reactive background visually prominent
- expand the music experience to dominate the viewport
- reduce competing UI
- keep the spine as restrained navigation

## Archive Mode
When Archive activates:
- retain current RSS implementation
- allow feed/index to occupy a large/full viewport state
- preserve loading, error, caching, metadata, and data behavior
- keep spine navigation accessible

## Tuner Extension
Extend the existing tuner instead of creating a second system.

Candidate controls:

### Spine
- opacity
- breathe amount
- breathe speed
- vertebra illumination
- energy intensity
- energy speed

### Nodes
- idle opacity
- hover intensity
- active intensity
- pulse size
- pulse speed

### Connectors
- width
- opacity
- draw duration
- ghost opacity

### Cards
- background opacity
- border intensity
- blur
- entrance distance
- entrance duration

### Immersive Modes
- spine opacity during Music
- secondary UI opacity during Music
- archive overlay/background balance
- transition duration

Prefer the tuner's existing CSS-variable/state architecture.

## Performance
The existing site already carries video, audio, reactive visuals, carousel animation, and RSS content.

Prefer lightweight Spine UI techniques:
- SVG
- CSS transforms
- opacity
- `stroke-dasharray` / `stroke-dashoffset`
- existing Framer Motion stack if present
- centralized CSS custom properties

Avoid introducing another heavy continuous rendering system without a strong reason.
