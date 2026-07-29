# Legacy Music page (retired 2026-07-28)

`music.html` was a standalone page rendering a flat 3-column grid of all 28 tracks.
It is now a redirect to `/#tracks`. This file preserves what it was, because there
is no git repo in this project and nothing is recoverable from history.

## Why it was retired

It read the same `data/tracks.json` and played the same 20-second samples as the
homepage carousel, and rendered strictly less: cover, release/duration label,
title, oneLiner, sample player. The carousel renders all of that **plus** the full
description, the video art, the sampled accent colour, prev/next, and
`buildLinks()` — the streaming and download buttons the grid never had at all.

It was also a second implementation of the sample player: `js/music-page.js` and
`js/audio-player.js` duplicated logic that already lives in
`js/track-experience.js`, meaning two places to fix every future audio bug.

The carousel has breakpoints at 1024px and 768px, so the grid was not serving as a
small-screen fallback either.

## What should replace it, if anything

Not this grid. The carousel is **discovery** — browse one track at a time. A Music
page earns its place only as the thing the carousel is not: a **directory** — flat,
scannable, all 28 at once, with stream/download/buy buttons, for someone who
already knows what they want. That page becomes worth building when the pending
streaming links, downloads, and Stripe/Gumroad actually land. Until then it would
be the same subset problem again.

## Still on disk, now unreferenced

- `js/music-page.js` — grid render + per-card sample wiring
- `js/audio-player.js` — was only ever loaded by this page

Neither is loaded by any page now. They are kept on purpose; delete them knowingly.

## The retired markup

```html
<main id="main">
  <section class="section container" style="padding-top: calc(var(--space-24) + 3rem);">
    <div class="section-header">
      <span class="label">Music</span>
      <h1>Releases &amp; Tracks</h1>
      <p>Every release, track, and streaming link lives here the moment it&rsquo;s cleared for public release. Nothing plays without you pressing play first.</p>
    </div>

    <div class="empty-state" role="status" style="margin-bottom: var(--space-8);">
      <span class="label">Full Release</span>
      <p><strong>Rise Up</strong> isn&rsquo;t on streaming platforms yet &mdash; 20-second samples are available below for each track now. Full streaming and download links go live once each platform is connected.</p>
    </div>
    <div class="grid grid--3" id="release-grid"></div>
  </section>
</main>
```

The `empty-state` note above was the one piece of real content only this page
carried. It was moved to the carousel intro on `index.html` as
`.track-experience__note`, with "available below" reworded to "available here".
