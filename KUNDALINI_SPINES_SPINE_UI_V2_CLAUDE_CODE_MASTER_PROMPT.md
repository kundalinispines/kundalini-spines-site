# KUNDALINI SPINES — SPINE UI V2
## CLAUDE CODE MASTER IMPLEMENTATION PROMPT

You are working on the existing Kundalini Spines website.

This project is an **experimental V2 redesign** that ports the existing production website into a spine-based navigation and interaction system.

This is **NOT** a greenfield rebuild.

This is **NOT** permission to rewrite working systems.

The objective is to preserve the existing website's strongest production components and progressively wrap them inside a new living-spine UI framework.

---

# 0. ABSOLUTE FIRST PRIORITY — PROTECT THE EXISTING SITE

Before modifying any code, create an isolated V2 development environment.

The current production site must remain untouched.

## Existing production copy

The existing desktop working copy should remain exactly where it currently exists.

Do not modify it.

Do not switch it to the experimental branch.

Do not use it as the active V2 development directory.

---

# 1. CREATE A SEPARATE LOCAL V2 COPY

Create a fresh clone of the existing GitHub repository in a new desktop folder.

Preferred local folder:

```text
kundalini-spines-spine-ui
```

Example structure:

```text
Desktop/
├── kundalini-spines/
│   └── existing production working copy
│
└── kundalini-spines-spine-ui/
    └── experimental Spine UI V2
```

Do NOT simply overwrite or repurpose the existing working copy.

Use a fresh Git clone whenever possible.

---

# 2. CREATE A NEW GITHUB FEATURE BRANCH

Inside the new V2 clone:

1. Inspect the remote repository.
2. Confirm the production/default branch.
3. Pull the latest production state.
4. Confirm the working tree is clean.
5. Record the production commit hash.
6. Create:

```text
feature/spine-ui-v2
```

7. Push the feature branch to GitHub.
8. Confirm that the local V2 directory is tracking this branch.

Do NOT push redesign code directly to the production branch.

Do NOT merge automatically.

Do NOT force push.

Do NOT rewrite production history.

---

# 3. VERIFY DEVELOPMENT ISOLATION

Before doing any implementation work, report:

```text
Production repository:
Production/default branch:
Production commit hash:

Experimental local path:
Experimental branch:
Experimental branch-point commit:
GitHub remote:
```

Confirm explicitly:

> All Spine UI V2 development will occur only in the experimental working copy and feature/spine-ui-v2 branch.

---

# 4. DESIGN REFERENCE PACKAGE

The project includes the Spine UI V2 design package at approximately:

```text
design/spine-ui-v2/
```

Read every Markdown file before implementation.

Expected reference files include:

```text
design/spine-ui-v2/
├── mockups/
│   ├── 00-master-concept-spine-navigation.png
│   ├── 01-idle-resting.png
│   ├── 02-hover-pre-focus.png
│   ├── 03-card-activation.png
│   ├── 04-active-view-reading-mode.png
│   └── 05-transition-next-node.png
│
├── DESIGN_REFERENCE.md
├── MOCKUP_CATALOG.md
├── INTERACTION_STATES.md
└── CLAUDE_IMPLEMENTATION_BRIEF.md
```

These files are required reading.

---

# 5. DESIGN AUTHORITY

The provided mockups are authoritative for:

- the spine concept
- spine positioning logic
- vertebra/node behavior
- rigid connector geometry
- node animation states
- card activation behavior
- card emergence behavior
- active/read state
- focus transfer
- transition behavior
- general spatial relationship between spine and content

The mockups are NOT authoritative for:

- black mockup background
- placeholder typography
- placeholder brand names
- Lorem Ipsum
- explanatory annotation panels
- generic presentation-board styling

The production implementation should combine the **interaction architecture of the mockups** with the **actual visual identity of the existing Kundalini Spines website**.

---

# 6. EXTREMELY IMPORTANT — EXISTING TRACK CARD ANIMATION IS PROTECTED

The existing music carousel card animation system is a protected production behavior.

## DO NOT CHANGE IT

Preserve the existing:

- track-card animation choreography
- card motion
- card scaling
- hover behavior
- active-card behavior
- carousel timing
- carousel transitions
- carousel easing
- track-card spatial behavior
- audio relationship
- reactive visual relationship

Do not redesign the track carousel simply because the new spine mockups show other card animations.

The new spine card animation rules apply to informational spine cards.

They do NOT automatically apply to the existing music track cards.

### If a conflict occurs

If the existing carousel animation cannot technically coexist with the new Spine UI:

STOP.

Before changing it:

1. Explain the exact technical conflict.
2. Explain why the existing behavior cannot be preserved.
3. Propose the smallest possible modification.
4. Describe what visual behavior would change.
5. Wait for approval.

Do not make the change first.

This rule is non-negotiable.

---

# 7. PROTECTED EXISTING SYSTEMS

The following systems must be audited and preserved.

## A. Hero Video

Preserve the existing:

- video
- playback behavior
- responsive behavior
- loading behavior
- visual layering
- media handling
- current production functionality

The hero remains the entrance to the site.

---

## B. Music Experience

Preserve the existing:

- track carousel
- track cards
- audio player
- audio state
- metadata
- track selection
- playback
- track interactions
- streaming/purchase actions
- audio-reactive visual background
- music side-chain / reactive visual behavior
- tuner integration
- performance optimizations

Music is one of the most important parts of the website.

Do not simplify it to make the spine easier to build.

The spine architecture must accommodate the music system.

---

## C. Reactive Music Background

The existing reactive background is a protected component.

Audit:

- Web Audio logic
- frequency/amplitude analysis
- side-chain behavior
- render loop
- CSS/canvas/WebGL implementation if applicable
- performance behavior
- connection to active track/player state
- tuner-controlled values

Do not rebuild it unless absolutely necessary.

---

## D. Archive / RSS

The current Archive page and RSS work must be preserved.

Audit:

- archive route
- RSS source
- RSS parser
- data fetching
- feed rendering
- archive card/item structure
- images/media
- sorting
- filtering
- pagination
- caching
- revalidation
- loading state
- error state
- item expansion behavior

The Archive will become part of the new Spine UI rather than being discarded.

---

## E. Tuner

The existing tuner is a protected internal tool.

Audit:

- tuner component
- sliders
- parameter groups
- CSS variables
- state architecture
- context/providers
- persistence behavior
- localStorage if used
- current visibility logic
- existing controlled parameters

Do not remove it.

Do not build a competing second tuner.

Extend the existing tuner architecture.

---

# 8. SITE EXPERIENCE HIERARCHY

The intended hierarchy is:

```text
HERO
↓
SPINE INTRODUCTION
↓
SPINE NAVIGATION
↓
CONTENT EXPERIENCES
```

Content experiences are divided into two categories.

---

# 9. PRIMARY IMMERSIVE EXPERIENCES

## MUSIC

Music is the FIRST major spine node after the hero.

Music should remain one of the most prominent visual experiences on the site.

Suggested order:

```text
01 — MUSIC
02 — STORY
03 — MEMBERS
04 — ETHOS
05 — ARCHIVE
06 — TIMELINE
```

Use actual existing site terminology where appropriate.

---

# 10. HERO → SPINE TRANSITION

Selected design direction:

The spine should gradually assemble/fade into existence as the user leaves the hero.

Do not hard-cut between hero and spine.

Suggested progression:

1. Hero remains fully dominant.
2. As the user scrolls toward the next section:
   - faint central spine structure becomes visible
   - vertebrae progressively appear
   - node locations become visible
   - subtle energy animation begins
3. Spine becomes fully interactive once the navigation experience has entered the viewport.

Keep this cinematic but restrained.

Do not over-animate it.

---

# 11. SPINE POSITION

Normal desktop state:

```text
Spine centered
```

Immersive states:

The spine may shift or collapse to create space.

Do not force it to remain perfectly centered when Music or Archive needs the viewport.

---

# 12. LIVING SPINE BEHAVIOR

The spine should feel alive.

However, its default animation should be restrained.

Default state:

- subtle
- low-amplitude
- elegant
- technical
- organic without feeling soft
- almost anatomical/machine-like

Potential animation:

- subtle breath cycle
- slight vertebral illumination
- energy traveling vertically
- low-frequency pulses
- occasional node shimmer
- very subtle structure movement
- faint energy transfer between vertebrae

Avoid:

- jelly movement
- excessive wobble
- aggressive glow
- bright neon
- rapid pulsing
- constant visual noise

The tuner should allow stronger values for experimentation.

---

# 13. SPINE STATE MODEL

The visual states are:

```text
IDLE
HOVER / PRE-FOCUS
ACTIVATION
ACTIVE / READING
TRANSITION
```

Use the supplied mockups as the authoritative reference.

---

# 14. STATE 01 — IDLE / RESTING

Reference:

```text
01-idle-resting.png
```

Behavior:

- spine visible
- nodes visible
- no content expanded
- low-opacity visual structure
- subtle ambient motion
- system feels ready

Animation:

- soft breath
- faint energy travel
- occasional micro-node pulse

---

# 15. STATE 02 — HOVER / PRE-FOCUS

Reference:

```text
02-hover-pre-focus.png
```

Behavior:

- hovered node brightens
- focus/pulse ring becomes visible
- potential connection path begins appearing
- target content may appear as a ghost preview

Rigid connectors should only partially draw during pre-focus.

---

# 16. STATE 03 — ACTIVATION

Reference:

```text
03-card-activation.png
```

When clicked:

1. Node locks active.
2. Energy pulse emanates from node.
3. Rigid connector draws outward.
4. Connector visibly fills from spine toward endpoint.
5. Content begins appearing.
6. Main card settles into place.

Informational cards may use ghosted/depth frames during entry.

---

# 17. STATE 04 — ACTIVE / READING MODE

Reference:

```text
04-active-view-reading-mode.png
```

Behavior:

- selected informational content is fully readable
- active node remains highlighted
- secondary cards become quieter
- spine remains alive
- motion reduces to ambient animation

Reading state should be calmer than activation.

---

# 18. STATE 05 — TRANSITION / NEXT NODE

Reference:

```text
05-transition-next-node.png
```

Behavior:

1. Active card recedes.
2. Existing line fades/retracts.
3. Energy moves through spine.
4. New target node highlights.
5. New connector draws.
6. New content enters.

The user should visually understand that focus traveled through the spine.

---

# 19. CONNECTOR DESIGN

Connector lines should be:

- rigid
- geometric
- architectural
- schematic
- technical

Use:

- straight segments
- 30°
- 45°
- 90° turns where appropriate

Avoid:

- Bézier web lines
- soft organic branches
- spaghetti routing

Preferred implementation:

- SVG
- stroke-dasharray
- stroke-dashoffset
- Framer Motion or existing motion system
- lightweight GPU-safe animation

---

# 20. SMALL INFORMATIONAL CARDS

Sections like:

- Story
- Members
- Ethos
- Timeline
- related informational content

should use a shared visual system.

However:

THEY DO NOT NEED IDENTICAL DIMENSIONS.

Selected behavior:

```text
Shared visual language
+
Flexible card dimensions/layouts
```

Examples:

Story may be editorial.

Members may support two profiles.

Ethos may use text + symbolic imagery.

Timeline may use milestones.

Maintain visual family consistency without forcing identical templates.

---

# 21. MUSIC — IMMERSIVE NODE

Music is special.

It does NOT behave like a normal spine content card.

When MUSIC activates:

- existing music experience becomes dominant
- carousel remains unchanged unless absolutely necessary
- reactive music background remains fully active
- track cards become the visual foreground
- music interaction takes over most/all of viewport
- secondary informational cards retreat
- spine navigation becomes minimal

Target size:

```text
approximately 100svh
```

where appropriate.

---

# 22. MUSIC MODE — SPINE COLLAPSE

Selected behavior:

In Music mode, the spine collapses to a minimal structure.

Preferred representation:

```text
thin spine line
+
nodes
+
active Music node
```

Do not allow full spine UI to compete with the reactive music experience.

The music visualization must remain the dominant visual layer.

The collapsed spine should still allow navigation away from Music.

---

# 23. DO NOT COVER THE MUSIC VISUALIZER

Avoid placing unnecessary informational cards over the Music experience.

Small utility/navigation elements are acceptable.

The visual hierarchy should be:

```text
Reactive music background
↓
Track carousel
↓
Minimal spine navigation
↓
Optional tiny secondary UI
```

NOT:

```text
Spine cards covering track experience
```

---

# 24. ARCHIVE — HYBRID IMMERSIVE NODE

Archive should be treated as a major experience.

Selected behavior:

Archive should expand to occupy most of the viewport while retaining more visible spine context than Music mode.

Think:

```text
large immersive archive panel
+
visible spine relationship
```

rather than a tiny pop-out card.

---

# 25. ARCHIVE ITEM BEHAVIOR

Selected behavior:

Archive items should expand inside the Archive experience.

Do not automatically route users to a completely separate page unless existing architecture makes it necessary.

Preferred flow:

```text
Archive node
→
Archive immersive feed
→
Select item
→
Item expands inside Archive experience
→
Return to feed
```

Preserve RSS functionality.

---

# 26. SPINE NAVIGATION MODEL

Selected behavior:

Use a HYBRID navigation model.

The site should still scroll naturally.

However, spine nodes should also activate content experiences in place.

Therefore:

- scrolling remains meaningful
- spine nodes can change active content
- immersive nodes can temporarily control the viewport
- the site should not feel like a rigid SPA dashboard

---

# 27. HEADER

Preserve the current header/navigation architecture.

Restyle it where appropriate so it visually belongs with the spine design.

Do NOT immediately eliminate the existing navigation.

The spine becomes an additional/primary experiential navigation system.

Header simplification may be evaluated later.

---

# 28. EXISTING SITE BACKGROUND

The mockups use black backgrounds for presentation.

DO NOT replace the actual site background with generic black.

Preserve the existing Kundalini Spines visual atmosphere.

New UI should sit over the current environment.

Use a mixture of:

- transparent surfaces
- translucent surfaces
- selective dark surfaces
- selective blur
- readable opaque surfaces where needed

Selected design behavior:

```text
Mix transparency based on readability
```

Do not force every card to be transparent.

---

# 29. TUNER VISIBILITY

Selected behavior:

The tuner should be hidden from ordinary users.

Use a private/admin-style toggle.

Possible implementation:

- hidden shortcut
- development toggle
- existing control mechanism
- unobtrusive admin trigger

Do not expose a development dashboard prominently to normal visitors.

---

# 30. TUNER PERSISTENCE

Preserve the existing persistence behavior.

Do not change the way settings currently persist unless necessary.

If existing tuner settings use localStorage or another persistence model, continue using it.

---

# 31. EXTEND TUNER FOR SPINE UI

Potential controls:

## Spine

- opacity
- scale
- breath amplitude
- breath speed
- vertebra brightness
- energy intensity
- energy speed

## Nodes

- size
- inactive opacity
- hover intensity
- active intensity
- ring size
- pulse speed

## Connectors

- line thickness
- line opacity
- brightness
- draw duration
- preview opacity
- active energy intensity

## Informational Cards

- card background opacity
- blur
- border brightness
- entry duration
- scale
- offset

## Immersive Modes

- collapsed spine opacity
- Music navigation opacity
- Archive spine visibility
- transition duration

Do not add useless sliders.

Keep tuner organized.

---

# 32. CENTRALIZE DESIGN VARIABLES

Where appropriate, expose spine properties through existing token/CSS-variable architecture.

Examples:

```css
--spine-opacity
--spine-scale
--spine-energy
--spine-breathe
--spine-breathe-duration

--node-idle-opacity
--node-hover-intensity
--node-active-intensity
--node-pulse-duration

--connector-opacity
--connector-width
--connector-draw-duration

--spine-card-opacity
--spine-card-blur

--music-spine-opacity
--archive-spine-opacity
```

Use existing tuner architecture rather than creating redundant systems.

---

# 33. STATE MANAGEMENT

Prefer centralized state.

Conceptually:

```ts
interface SpineUIState {
  activeNode: SpineNodeId | null
  hoveredNode: SpineNodeId | null
  previousNode: SpineNodeId | null

  mode:
    | "navigation"
    | "card"
    | "music"
    | "archive"

  transitioning: boolean
}
```

Adapt this to the existing codebase.

Do not introduce unnecessary state libraries.

---

# 34. MOBILE DESIGN

Do NOT assume the desktop spine layout will simply shrink.

Selected direction:

Prototype TWO mobile navigation approaches.

Recommended candidates:

### Prototype A
Vertical compact spine rail.

### Prototype B
Horizontal spine/node stepper.

Show both before choosing the final mobile implementation.

Do not fully implement both production versions.

Produce lightweight prototypes and explain:

- usability
- screen efficiency
- music interaction
- archive readability
- accessibility
- relationship to desktop concept

Wait for approval before committing to one mobile direction.

---

# 35. RESPONSIVE BEHAVIOR

## Desktop

- full spine architecture
- rigid branching
- immersive Music
- immersive Archive
- richer animation

## Tablet

- simplified connector routing
- reduced card spread
- spine retained

## Mobile

Decision pending prototype review.

---

# 36. ANIMATION INTENSITY

Default animation should be subtle.

The tuner should allow stronger values.

Selected design:

```text
restrained production defaults
+
art-direction range via tuner
```

---

# 37. MOTION PERFORMANCE

The current site already has substantial visual systems.

Do not create another unnecessarily heavy render loop.

Prefer:

- SVG
- CSS transforms
- opacity
- Framer Motion if already installed
- existing animation system
- requestAnimationFrame only where justified
- GPU-friendly transforms

Avoid:

- unnecessary WebGL
- duplicate render loops
- constant expensive DOM measurement
- huge filter chains
- heavy blur everywhere

Music mode performance is a priority.

---

# 38. ACCESSIBILITY

Maintain:

- keyboard navigation
- visible focus states
- semantic controls
- screen reader labels
- accessible audio controls
- carousel accessibility
- Archive readability
- reduced motion support

For:

```css
prefers-reduced-motion
```

disable/reduce:

- energy travel
- decorative pulse
- long connector draws
- spine breathing

Navigation must still function.

---

# 39. DESIGN CHARACTER

The production UI should feel:

- underground
- architectural
- occult
- anatomical
- military schematic
- cinematic
- premium
- mysterious
- technical
- intentional

Avoid:

- generic SaaS
- gamer HUD overload
- excessive cyberpunk
- neon rainbow
- bubbly UI
- cartoon spine
- glassmorphism everywhere

---

# 40. FIRST REQUIRED TASK — FULL REPOSITORY AUDIT

Before major implementation, inspect the repository.

Report the following.

## Project Architecture

- framework
- Next.js version
- React version
- routing
- Tailwind setup
- animation libraries
- component architecture
- data architecture
- state management
- asset strategy

## Hero

- component path
- media path/source
- loading logic
- responsive behavior
- associated styles

## Music

- music section component
- carousel component
- track-card component
- animation logic
- player/audio engine
- active track state
- metadata source
- reactive background
- side-chain implementation
- tuner dependencies

## Archive

- route
- RSS source
- parser
- fetching method
- caching
- feed components
- archive item components
- expansion logic
- current implementation status

## Tuner

- component path
- visibility mechanism
- slider definitions
- state architecture
- persistence
- CSS variables
- controlled values

## Existing Header

- component
- navigation
- mobile behavior

## Background System

- global background
- reactive layers
- fixed layers
- relevant visual components

---

# 41. REUSE MATRIX

Classify every major system as:

```text
KEEP
WRAP
MODIFY
REPLACE
```

REPLACE should be rare.

For every REPLACE classification, explain exactly why.

Expected tendency:

```text
Hero              KEEP / WRAP
Music             KEEP / WRAP
Track Carousel    KEEP
Track Animations   KEEP
Reactive BG        KEEP
Archive RSS        KEEP / WRAP
Tuner              KEEP / MODIFY
Header             KEEP / MODIFY
Spine              NEW
Spine Nodes        NEW
Spine Connectors   NEW
Spine Cards        NEW
```

---

# 42. IMPLEMENTATION AUTHORIZATION MODEL

Selected behavior:

Do not bulldoze through the whole project automatically.

After audit:

1. Present implementation plan.
2. Begin the smallest approved prototype.
3. Before touching a MAJOR protected system, explain what will change.
4. Ask for approval.

Major protected systems include:

- Music
- reactive background
- track carousel
- Archive RSS
- tuner
- hero architecture

Do not require approval for trivial safe refactors inside the isolated V2 branch.

---

# 43. FIRST PROTOTYPE

Selected first prototype:

```text
SPINE
+
HOVER / PRE-FOCUS
+
ONE SMALL INFORMATIONAL CONTENT CARD
```

Do NOT begin by integrating Music.

Do NOT begin by integrating Archive.

The purpose of prototype #1 is to validate the spine interaction model safely.

---

# 44. FIRST PROTOTYPE SHOULD INCLUDE

Build:

- spine shell
- several visual nodes
- idle animation
- hover/pre-focus
- one working connector
- one rigid line draw
- one informational card activation
- active card state
- exit/transition back to rest

Prefer using existing site background.

Do not create a temporary generic black dashboard if avoidable.

---

# 45. FIRST PROTOTYPE SHOULD NOT INCLUDE

Do not yet modify:

- music carousel animations
- reactive music background
- RSS internals
- tuner architecture
- hero media architecture

It is acceptable to add temporary isolated Spine tuner variables only after the tuner architecture has been audited.

---

# 46. COMMIT STRATEGY

Selected behavior:

Commit after each MAJOR DEVELOPMENT STAGE.

Suggested commits:

```text
chore: establish spine ui v2 branch baseline

feat: add spine navigation shell

feat: add spine hover and node states

feat: add spine informational card prototype

feat: integrate spine tuner controls

feat: integrate music immersive state

feat: integrate archive immersive state

feat: add hero to spine transition

feat: add responsive spine behavior

perf: optimize spine ui interactions

fix: accessibility and reduced motion
```

Do not create dozens of meaningless micro-commits.

Do not combine the entire project into one giant commit.

---

# 47. VERCEL PREVIEW STRATEGY

Selected behavior:

Do NOT prioritize deployment immediately.

Develop locally first.

After the first stable spine prototype:

1. Inspect current Vercel/GitHub integration.
2. Determine whether `feature/spine-ui-v2` automatically receives a preview deployment.
3. If available, use it.
4. Do not modify production deployment configuration unnecessarily.

The V2 preview should allow comparison between:

```text
Production site
vs.
Spine UI V2 preview
```

---

# 48. MUSIC INTEGRATION — LATER STAGE

When approved to integrate Music:

WRAP the existing experience.

Do NOT build a second carousel.

Do NOT duplicate player state.

Do NOT duplicate track data.

Do NOT remount audio unnecessarily if it interrupts playback.

Preferred architecture:

```text
Existing Music System
        ↓
Music Experience Wrapper
        ↓
Spine UI orchestration
```

NOT:

```text
Existing Music System
        ↓
Rewritten Spine Music System
```

---

# 49. MUSIC CONTINUITY

Where technically possible, activating/deactivating the Music spine state should NOT:

- restart the song
- destroy audio state
- reset the active track
- reset reactive visuals
- reset carousel state

Presentation state and playback state should remain decoupled.

---

# 50. ARCHIVE INTEGRATION — LATER STAGE

When approved:

WRAP existing archive/RSS architecture.

Create an immersive Archive experience around existing data logic.

Do not rewrite the RSS source unless necessary.

Archive presentation may evolve significantly.

Archive data plumbing should remain stable.

---

# 51. HEADER REFINEMENT

Do not radically replace the header during the first implementation.

Initial goal:

- preserve structure
- adjust styling
- improve relationship with spine
- ensure it does not compete visually

Further simplification can occur after V2 is evaluated.

---

# 52. FOLDER ORGANIZATION

Prefer a modular structure conceptually similar to:

```text
components/
├── spine/
│   ├── SpineNavigator
│   ├── Spine
│   ├── SpineNode
│   ├── SpineConnector
│   ├── SpineEnergy
│   ├── SpineCard
│   └── SpineExperienceShell
│
├── experiences/
│   ├── MusicExperience
│   ├── ArchiveExperience
│   ├── StoryCard
│   ├── MembersCard
│   ├── EthosCard
│   └── TimelineCard
```

Adapt this to existing conventions.

Do not reorganize the entire repository just to match this example.

---

# 53. DO NOT DUPLICATE EXISTING COMPONENTS

Before creating:

```text
MusicExperience
TrackCarousel
TrackCard
Player
ArchiveFeed
RSSParser
Tuner
```

search for the existing equivalent.

Reuse it.

---

# 54. NON-NEGOTIABLE RULES

Do not:

- touch production branch
- automatically merge V2
- rewrite the site from scratch
- remove the tuner
- remove RSS functionality
- rebuild music visualization without necessity
- change track carousel animation without approval
- duplicate the track carousel
- replace existing player state unnecessarily
- sacrifice reactive music behavior
- replace existing background with generic mockup black
- force every content type into the same card layout
- force desktop spine layout directly onto mobile
- deploy to production without approval

---

# 55. STOP CONDITIONS

STOP and request guidance if:

- preserving track carousel animation becomes impossible
- music audio state would need to be rewritten
- reactive background would need major reconstruction
- RSS architecture must be fundamentally replaced
- tuner persistence must change
- production deployment settings must change
- existing data would need migration
- a destructive Git operation is required

---

# 56. FIRST RESPONSE REQUIRED FROM CLAUDE

Before writing major feature code, return a report containing:

## A. Git Safety

- production/default branch
- production commit
- V2 branch
- local V2 folder
- remote tracking status

## B. Architecture

- framework
- major components
- route structure
- animation stack
- state system

## C. Hero Analysis

## D. Music Analysis

Include specific analysis of:

- track-card animation
- carousel motion
- audio
- reactive background
- side-chain behavior

## E. Archive / RSS Analysis

## F. Tuner Analysis

## G. Header Analysis

## H. Existing Background Analysis

## I. Reuse Matrix

```text
KEEP / WRAP / MODIFY / REPLACE
```

## J. Proposed V2 File Structure

## K. Proposed First Prototype Files

## L. Performance Risks

## M. Integration Risks

## N. Recommended Prototype Plan

Then proceed only with:

```text
Spine shell
+
Idle state
+
Hover / pre-focus
+
One informational card
```

Do not integrate Music, Archive, Hero internals, or major tuner changes until that prototype has been reviewed.

---

# 57. OVERALL PROJECT PRINCIPLE

The Spine UI is an orchestration layer around the existing Kundalini Spines world.

The existing site already contains valuable systems.

Preserve them.

The final goal is:

```text
CURRENT KUNDALINI SPINES SITE
+
LIVING SPINE NAVIGATION
+
RIGID ARCHITECTURAL CONTENT SYSTEM
+
IMMERSIVE MUSIC
+
IMMERSIVE ARCHIVE
+
LIVE TUNER CONTROL
```

—not a replacement site that merely resembles the mockups.

Build incrementally.

Protect existing behavior.

Prioritize visual identity, music performance, reversibility, and maintainability.
