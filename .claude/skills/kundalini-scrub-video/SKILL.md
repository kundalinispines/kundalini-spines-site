---
name: kundalini-scrub-video
description: Add one of the owner's clips to a Kundalini Spines section as a scroll-scrubbed video — encode it, lay it out beside the copy, wire the scrub, and verify it. Use when the owner drops an .mp4/.mov and asks to put it on a page, add footage next to a section's text, make a video turn or move with the scroll, or re-encode a clip already on the site. Covers the video pipeline only; kundalini-session-start owns session prep.
---

# Adding a scrubbed video to a Kundalini Spines section

The owner keeps finished clips in `C:\Users\Haight\Desktop\Spine Home Photo and
Video\`. Each one goes on the site the same way: encoded for seeking, laid
beside a section's copy as one block, driven by scroll position, then measured.

Two clips already run this way — the merch spine render and the About black
tide. Read them before building a third: `index.html` `#about` and `#merch`,
`.ksd-about` / `.ksd-merch` in `css/spine-doc.css`, `scrubToScroll` in
`js/spine-doc.js`.

## The mechanism already exists

`scrubToScroll(video)` in `js/spine-doc.js` owns the mapping, the lerp and the
seek guards. A new clip **calls it** — it does not get its own copy:

```js
const nextVid = document.querySelector('.ksd-next__media video');
if (nextVid && !reducedMotion) scrubToScroll(nextVid);
```

That function was duplicated once, and the duplicate is exactly how the About
clip nearly shipped without the `-g 4` encode below.

## 1. Probe the source

ffmpeg ships with the `imageio_ffmpeg` pip package; there is no system ffmpeg
and **no ffprobe** — use `ffmpeg -i` and read the stream line.

```bash
FF=$(python -c "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())")
"$FF" -hide_banner -i "SOURCE" -f null - 2>&1 | grep -E "Duration|Stream"
```

Record duration, dimensions, fps and bitrate. These sources run ~9–10 Mbps for
a sub-1200px frame — heavily over-encoded, so expect the shipped file to be a
fraction of the original.

## 2. Encode — `-g 4` is the whole job

A keyframe every 4 frames is what makes the clip seekable at scroll speed. At
default spacing every seek decodes a chain back to the last keyframe and the
scrub visibly lags — and it presents as a janky page, not as a bad encode, so
it is easy to misdiagnose for an hour. It roughly triples the file (black-tide
went 708KB → 2.2MB). Pay it.

```bash
"$FF" -y -i "SOURCE" -map 0:v:0 -an -map_metadata -1 \
  -c:v libvpx-vp9 -crf 33 -b:v 0 -g 4 -row-mt 1 -threads 12 \
  -deadline good -cpu-used 1 assets/video/NAME.webm

"$FF" -y -i "SOURCE" -map 0:v:0 -an -map_metadata -1 \
  -c:v libx264 -crf 24 -g 4 -preset slow -pix_fmt yuv420p \
  -movflags +faststart assets/video/NAME.mp4

"$FF" -y -ss 1.2 -i "SOURCE" -frames:v 1 -q:v 4 assets/video/NAME-poster.jpg
```

Look at the poster before shipping it — `-ss` lands wherever it lands.

A clip with real transparency is a different encode (`yuva420p`, and a tighter
crop). `#merch` in `index.html` documents that path, including why ffmpeg's own
decoder reports a VP9-alpha file as plain `yuv420p`.

## 3. Markup

```html
<figure class="ksd-next__media">
  <video muted playsinline preload="auto" aria-hidden="true"
         poster="assets/video/NAME-poster.jpg">
    <source src="assets/video/NAME.webm" type="video/webm">
    <source src="assets/video/NAME.mp4" type="video/mp4">
  </video>
</figure>
```

`preload="auto"` because the scrub seeks from the first wheel tick and
metadata-only leaves a blank stage until a range fetch lands. The videos carry
no audio track. Leave `loop` and `autoplay` off and let `scrubToScroll` own
`currentTime` — a playing video fights every seek it makes.

## 4. Layout — grid, and pin the crop

Put the headline inside the copy column with the prose when the owner wants the
section to read as **one block**; the taller column is what lets the film carry
real height beside it.

Use `display: grid` with explicit `fr` proportions. Flex was tried and the split
barely moved however the bases were set — with equal `flex-grow` the free space
divides evenly and the ratio sits near 1:1 whatever the basis says.

Give the media box a fixed `aspect-ratio` rather than stretching it to the
copy's height. A landscape clip beside a text column is always the shorter of
the two, so filling the height means cropping the width — and stretching lets
that crop swing with the viewport: 22% at 1440 but 44% at 1100, because the copy
grows taller as it narrows while the film grows thinner. A pinned ratio holds
one crop everywhere. Check where the subjects sit across the frame and confirm
a centred crop keeps them whole.

Below ~900px the section stacks; drop the ratio and let the clip return to its
own proportions, since nothing stands beside it to match.

## 5. Verify — measured, not eyeballed

Serve with `python scripts/serve.py` and drive it with Playwright. **Never
`python -m http.server`**: it answers without Range support, every seek clamps
to 0, and the page looks like it has a mapping bug in `spine-doc.js`. Never a
`file://` path either.

Every item below gets a number or a screenshot:

- **WebM selected**, `paused` true at every scroll depth, `seekable` covering
  the full duration.
- **Mapping monotonic**, reaching the end by ~80% of the element's travel.
- **Settled drift zero** — sample `currentTime` several times after the scroll
  stops; it must not move.
- **The existing clips still scrub** — anything touching `scrubToScroll` is a
  shared edit.
- **Crop constant** across widths: compare box aspect to `videoWidth/videoHeight`.
- **Clears the rail** at 2560/1440/900/390 — the axis rule: nothing covers the
  spine rail.
- **Zero horizontal overflow**, zero console errors, zero 4xx. One 404 on
  `fonts.gstatic.com` is pre-existing and external.
- **Reduced motion** holds frame 0 and never seeks.
- **A screenshot you actually looked at**, at desktop and at 390.

## Two ways to break this file silently

Both produce no error and look correct in the source:

- **Editing CSS or JS with a Python text-mode write on Windows** flips the file
  to CRLF and rewrites every line — a two-line change lands as a 1800-line
  diff. Use the Edit tool, or write bytes (`open(p,'wb')`).
- **A stray line outside a `/* */` block** in these comment-dense stylesheets
  makes the following rule a no-op. The layout simply does not apply. Read
  computed values in the browser rather than re-reading the file.
