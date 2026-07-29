# Technical Architecture

## Stack — adapted from the master brief

The brief specifies Next.js/React/TypeScript. This build environment has no outbound network access, so packages beyond what's already installed (Next.js is not present) can't be fetched — `npm install next` fails here. Two paths:

- **This environment (what I'll build unless you say otherwise):** static HTML5 + CSS + vanilla JS. No build step, no bundler, no dependency install. Every page is a real `.html` file; shared chrome (nav/footer) is duplicated per page rather than templated, since there's no server/build process to assemble includes. Deploys as-is to Vercel, Netlify, GitHub Pages, or any static host — drag-and-drop or `git push`.
- **Alternative:** hand this same content model/tokens/component plan to Claude Code (which has network access) to scaffold the actual Next.js/TypeScript/Tailwind/Framer Motion version from the brief. Nothing here is wasted either way — tokens, JSON content, sitemap, and component plan all transfer directly.

Going with the static build for now. Folder structure:

```
/                    index.html, music.html, transmissions.html, archive.html, about.html
/music/[slug].html   one file per release (generated from releases.json content)
/css/tokens.css      design tokens (done)
/css/base.css        reset + typography + layout primitives
/css/components.css  component styles
/js/audio-player.js  Web Audio API player, no autoplay
/js/archive-filter.js
/js/nav.js           scroll state + mobile menu
/data/*.json         content (done)
/assets/...          images, audio, favicons
sitemap.xml, robots.txt
```

## Fonts
Loaded via `<link>` to Google Fonts (Oswald, Source Serif 4, IBM Plex Mono) with `font-display: swap`; this only requires network in the visitor's browser, not in this build environment.

## SEO / sharing
Each HTML page ships its own `<title>`, meta description, canonical link, and Open Graph/Twitter card tags, populated from the matching content JSON. One `sitemap.xml` listing all real routes; `robots.txt` allowing all crawlers.

## Accessibility & performance baseline
- Semantic landmarks (`<nav>`, `<main>`, `<footer>`), heading hierarchy never skips a level
- Every interactive element keyboard-reachable with a visible focus ring (`--focus-ring`)
- `prefers-reduced-motion` respected globally (tokens already zero out durations)
- Images lazy-loaded (`loading="lazy"`) except the hero; explicit width/height to prevent layout shift
- Audio never autoplays; player is fully keyboard-operable
- Alt text written per-image from content JSON, not generic filenames

## Responsive strategy
Mobile-first CSS; breakpoints from tokens: 480 / 768 / 1024 / 1280 / 1440. Nav collapses to overlay menu below 768px. Grids (Archive, Releases) go 1 → 2 → 3 columns across those breakpoints. Hero copy and type scale use `clamp()` (see tokens) instead of breakpoint-specific overrides where possible.
