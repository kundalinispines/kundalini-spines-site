#!/usr/bin/env python
"""Build every asset deep-field-lab.html needs to mark one clip.

    python scripts/build-marker-clip.py <source.mp4> <slug>
    python scripts/build-marker-clip.py ~/Downloads/hf_20260818_093844_....mp4 deep-field-2

Writes, all derived from the one source:

    assets/video/<slug>.webm          VP9  crf 31, -g 4
    assets/video/<slug>.mp4           x264 crf 22, -g 4
    assets/video/<slug>-poster.jpg    frame 0
    assets/lab/<slug>-strip.jpg       one 8x80 tile per frame
    assets/lab/<slug>-sprites.jpg     20-column grid of 160x90 thumbs
    assets/lab/<slug>-lum.json        per-frame mean luma, normalised 0..1

Then add the slug to the CLIPS table in deep-field-lab.html — that table is the
only other place a clip is named, and this script prints the block to paste.

WHY -g 4, ON BOTH ENCODES. The marker lab seeks on every arrow-key press and
every pixel of a timeline drag. A seek costs the decode of one keyframe plus
the chain after it, so sparse keyframes turn a frame step into a stall. This is
a project-wide rule for scrubbed clips and it is in the handoffs' "do not do
these" list; it is not an optimisation to weigh against file size.

WHY THE SPRITE SHEET IS 20 COLUMNS. deep-field-lab.html reads a thumbnail with
`f % 20` and `Math.floor(f / 20)`. Rows extend as far as the frame count needs,
so only the column count is load-bearing — change it here and the page's hover
preview shows the wrong frame, silently.

WHY LUMINANCE IS MEASURED OFF THE 160x90 THUMBS rather than full frames: it is
a mean over the whole frame either way, the thumbs are already being decoded
for the sprite sheet, and it saves a second pass over 1920x1080. The absolute
numbers are recorded as lumMin/lumMax and the wave is normalised between them,
so the units only have to be consistent WITHIN a clip. THEY ARE NOT COMPARABLE
ACROSS CLIPS — the first clip's figures are 10-bit and everything since is
8-bit. The lab's banner says so too; do not read two clips' waves against each
other.

THE WEBM IS NOT BYTE-REPRODUCIBLE. libvpx-vp9 with -row-mt 1 splits the frame
across threads, and the result depends on how that scheduling falls — two runs
over the same input give the same file SIZE and different bytes. The mp4, the
poster, the strip, the sprite sheet and the JSON all reproduce exactly. So a
byte-diff of a regenerated webm against the committed one is not a signal; do
not go looking for what changed.

There is no system ffmpeg or ffprobe on the build box. ffmpeg comes from the
imageio_ffmpeg pip package, and frame counts are taken by decoding rather than
from a container field, because the container has lied before.
"""

import json
import os
import subprocess
import sys

import imageio_ffmpeg
from PIL import Image

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FF = imageio_ffmpeg.get_ffmpeg_exe()
COLS = 20            # must match deep-field-lab.html's f % 20
TILE_W, TILE_H = 8, 80        # filmstrip tile
THUMB_W, THUMB_H = 160, 90    # sprite cell, and the .tl__peek box


def run(args, label):
    print(":: " + label, flush=True)
    if subprocess.run([FF, "-hide_banner", "-loglevel", "error", "-y"] + args).returncode:
        sys.exit("FAILED: " + label)


def probe(src):
    """fps and exact frame count, by decoding the stream."""
    out = subprocess.run([FF, "-hide_banner", "-i", src, "-map", "0:v:0",
                          "-c", "copy", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    fps = None
    for line in out.splitlines():
        if " fps," in line and "Stream" in line:
            fps = float(line.split(" fps,")[0].split(",")[-1].strip())
    frames = None
    for line in out.splitlines():
        if line.startswith("frame="):
            frames = int(line.split("frame=")[1].split()[0])
    if not fps or not frames:
        sys.exit("could not read fps/frames from ffmpeg output")
    # 24 rather than 24.0, so the JSON matches the hand-built deep-field one and
    # the two files can be diffed against each other without noise.
    if fps == int(fps):
        fps = int(fps)
    return fps, frames


def main():
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    src, slug = sys.argv[1], sys.argv[2]
    if not os.path.isfile(src):
        sys.exit("no such file: " + src)

    fps, frames = probe(src)
    print("source: %s  %d frames @ %g fps  %.4fs" % (src, frames, fps, frames / fps))

    vid = os.path.join(REPO, "assets", "video")
    lab = os.path.join(REPO, "assets", "lab")
    tmp = os.path.join(REPO, ".build-frames-" + slug)
    os.makedirs(tmp, exist_ok=True)

    run(["-i", src, "-an", "-c:v", "libvpx-vp9", "-crf", "31", "-b:v", "0",
         "-g", "4", "-row-mt", "1", "-pix_fmt", "yuv420p",
         os.path.join(vid, slug + ".webm")], "webm  VP9 crf31 -g 4")
    run(["-i", src, "-an", "-c:v", "libx264", "-crf", "22", "-g", "4",
         "-preset", "slow", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
         os.path.join(vid, slug + ".mp4")], "mp4   x264 crf22 -g 4")
    run(["-i", src, "-frames:v", "1", "-q:v", "4",
         os.path.join(vid, slug + "-poster.jpg")], "poster")
    run(["-i", src, "-vf", "scale=%d:%d" % (THUMB_W, THUMB_H), "-q:v", "3",
         os.path.join(tmp, "f%05d.jpg")], "%d thumbs" % frames)

    names = sorted(os.listdir(tmp))
    if len(names) != frames:
        sys.exit("expected %d frames, extracted %d" % (frames, len(names)))

    rows = (frames + COLS - 1) // COLS
    sheet = Image.new("RGB", (COLS * THUMB_W, rows * THUMB_H), (0, 0, 0))
    strip = Image.new("RGB", (frames * TILE_W, TILE_H), (0, 0, 0))
    raw = []
    for i, name in enumerate(names):
        im = Image.open(os.path.join(tmp, name)).convert("RGB")
        sheet.paste(im, ((i % COLS) * THUMB_W, (i // COLS) * THUMB_H))
        strip.paste(im.resize((TILE_W, TILE_H), Image.LANCZOS), (i * TILE_W, 0))
        g = im.convert("L")
        raw.append(sum(g.tobytes()) / float(g.width * g.height))

    sheet.save(os.path.join(lab, slug + "-sprites.jpg"), quality=82, optimize=True)
    strip.save(os.path.join(lab, slug + "-strip.jpg"), quality=88, optimize=True)

    lo, hi = min(raw), max(raw)
    span = (hi - lo) or 1.0
    with open(os.path.join(lab, slug + "-lum.json"), "w", encoding="utf-8") as fh:
        json.dump({"fps": fps, "frames": frames,
                   "duration": round(frames / fps, 7),
                   "lumMin": round(lo, 1), "lumMax": round(hi, 1),
                   "lum": [round((v - lo) / span, 4) for v in raw]}, fh)

    for name in names:
        os.remove(os.path.join(tmp, name))
    os.rmdir(tmp)

    brightest = sorted(range(frames), key=lambda i: -raw[i])[:8]
    print("\nsprites %dx%d   strip %dx%d   luma %.1f..%.1f"
          % (sheet.width, sheet.height, strip.width, strip.height, lo, hi))
    print("brightest frames: %s" % sorted(brightest))
    print("\nPaste into the CLIPS table in deep-field-lab.html:\n")
    print("    '%s': {" % slug)
    print("      label:  '%s'," % slug)
    print("      source: '%s'," % os.path.basename(src))
    print("      base:   'assets/video/%s'," % slug)
    print("      lab:    'assets/lab/%s'," % slug)
    print("      fps: %g, frames: %d," % (fps, frames))
    print("      lsKey:  'ks-%s-marks-v1'" % slug)
    print("    }")


if __name__ == "__main__":
    main()
