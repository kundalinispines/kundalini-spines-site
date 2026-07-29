# Sitemap

```
/                           Home
/music                      Music index (releases + tracks)
/music/[release-slug]       Release detail (cover, tracks, streaming links, audio player)
/transmissions               Transmissions index
/transmissions/[number]      Transmission detail (expanded view)
/archive                     Archive index (filterable by category)
/archive/[category]          Archive category view
/archive/[category]/[id]     Archive entry detail
/about                        About + Messengers + contact/social
```

Notes:
- Flat, shallow structure on purpose — three primary destinations from the homepage (Music, Transmissions, Archive), one supporting page (About). No nested department/division hierarchy.
- URLs are lowercase, hyphenated, human-readable (`/music/night-transmission-ep`, not `/m/rel-0004`).
- Every content page gets its own canonical URL + Open Graph metadata (see 06-architecture.md).
