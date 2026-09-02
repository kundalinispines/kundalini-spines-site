# Kundalini Spines — Spine UI V2 Handoff 59

**Date:** September 2, 2026

Forty-first handoff of the **Spine UI V2** track. `58` owns the deep-field
choreography and the hero seam; `57` the footer contrast harness; `56` the
Stripe webhook; `55` the server and the refund bug; `51` the Cloudflare
migration recipe. **This session:** no site work at all. The **MP3 download
package in R2 was rebuilt and replaced**, because the one shipped on Aug 31
carried the wrong audio. One copy commit, this handoff, **released to `main`
on the owner's word.** No transmission filed — the owner says no download had
been taken, so nothing a visitor could notice changed.

---

## The one-line version

The `KundaliniSpines_RiseUp_MP3.zip` object in the `kundalini-spines-album`
bucket held the **192 kbps streaming masters** from Aug 31 to 03:22 on Sep 2;
it now holds the **320 kbps studio masters**, same key, same filenames inside,
same tags, art, booklet and tracklist, audio bit-identical to the owner's
master files. The code did not change; only the printed "271 MB" became
"373 MB".

---

## Corrections to handoff 55 and the Aug 31 packaging chat

1. **The Aug 31 package was built from the wrong source.** The chat that built
   it (session "RiseUp album ZIP preparation", Aug 31) took its MP3s from a
   zip the owner supplied, and that zip held the *streaming* masters (192 kbps,
   about -12 to -15 LUFS). The owner's *studio* masters (320 kbps, -6 to -8.5
   LUFS) are what the Digital Edition was meant to deliver. The chat's own
   check — "28/28 audio streams bit-identical to your masters" — was true and
   beside the point: it proved nothing had been re-encoded, not that the
   right masters had gone in. **Owner's report, found by the owner.**
2. **`55`'s "271 MB" is retired everywhere it was printed.** Success-page
   readout, the confirmation email in `stripe-webhook.js`, the comment in
   `download.js`, and `STRIPE-SETUP.md` §3 all now say 373 MB (`f68475d`).
   The WAV figure (1.4 GB / 1,395 MB) is unchanged.
3. **`55`'s "the 271 MB MP3 goes through the dashboard fine" no longer
   applies.** At 373 MB the MP3 zip is past the dashboard's single-PUT limit
   too. Both objects now go up with rclone.

---

## What was done

### 1. The package (built and verified, Desktop only — not in the repo)

Source: `Desktop\Kundalini Spines Rise Up\Kundalini Spines Rise Up Studio
Masters\` — 28 MP3s, 320 kbps CBR, LAME 3.99.5, with the owner's own tags
carrying the track number. Two were re-added by the owner during the session
after being found missing: track 17 `Steps from the edge-…mp3`, and
`Uzi Fruit-original.mp3` (the 5:09.1 cut; the folder's other `Uzi Fruit.mp3`
is a 5:03.7 cut and was not used). Track 15 Blue Pills is
`Home invasion.mp3`; track 12 X Files is `Twitter Files-…mp3`; track 10 Extra
Zoom is `full zoom fixed_mixdown.mp3`; track 9 Semi Auto is `Semi Auto With
guns_mixdown2.mp3`; track 26 May26th is `may 26.mp3`. The mapping was taken
from each file's own `TRCK`/`TIT2` tag and asserted against the shipped
track order, not guessed from filenames.

Treatment, matching the Aug 31 package exactly:

- Filenames `01 - Skeleton Keys-Kundalini Spines-Rise Up.mp3` … `28 - …`.
- Every existing ID3v2/ID3v1 tag stripped, then ID3v2.3 written: `TIT2` clean
  title, `TPE1`/`TPE2` Kundalini Spines, `TALB` Rise Up, `TRCK` n/28, `TDRC`
  2026, `TCON` Hip-Hop, `APIC` cover — the **same JPEG bytes** the Aug 31
  files embedded (1254², quality-90 from the Track Art PNGs).
- `Track Art/` (28 PNG, 1254²), the 12-page `Kundalini Spines - Rise Up -
  Digital Booklet.pdf` and `Rise Up - Tracklist.txt` are **byte-identical** to
  the Aug 31 zip, in the same entry order with the same compression (media
  stored, tracklist deflated). Root folder `Kundalini Spines - Rise Up (MP3)/`.
- Audio: SHA-256 of the MPEG frames of every output file equals that of its
  source file. **No re-encode, no gain.**

Verified on the finished zip: CRC test OK; 58 entries, names and order
identical to the old zip; all 28 tags as above; loudness measured with
ffmpeg `ebur128=peak=true`.

### 2. The gain check — measured, and deliberately not acted on

| | Studio masters (shipped now) | Streaming masters (Aug 31) |
|---|---|---|
| Integrated | **-5.9 to -8.5 LUFS** | -11.3 to -15.3 LUFS |
| True peak | **+0.3 to +0.9 dBTP, all 28** | -0.0 to -4.0 dBTP |
| LRA | 1.5 to 5.1 LU | 1.6 to 5.4 LU |

Every studio master overshoots full scale on decode. The owner was told this
and chose **"leave audio untouched"** — any trim means a second lossy encode,
which the owner refused on Aug 31 too. Recorded so nobody "fixes" it.

### 3. The swap

`rclone copyto` of the single file over the existing key, from this chat,
after a read-only `rclone ls` proved the remote. rclone reported
`Multi-thread Copied (replaced existing)`; the listing afterwards read
`391272317 KundaliniSpines_RiseUp_MP3.zip` — the local file's exact size —
and `1463058557 KundaliniSpines_RiseUp_WAV.zip`, untouched.

rclone lives in `Desktop\rclone-current-windows-amd64\rclone-v1.75.0-windows-amd64\rclone.exe`,
remote `r2`, config in `%APPDATA%\rclone\rclone.conf`. It is not on PATH.

### 4. The Desktop after this session

`Desktop\RiseUp_Digital_Delivery\`:

- `KundaliniSpines_RiseUp_MP3.zip` — 391,272,317 bytes — **what is in R2.**
- `KundaliniSpines_RiseUp_MP3_Streaming_Masters.zip` — 284,448,316 bytes —
  the Aug 31 package, renamed on the owner's word. **Keep it: the owner wants
  the streaming masters for Spotify and the other DSPs.** Not for R2.
- `KundaliniSpines_RiseUp_WAV.zip` — unchanged since Aug 31.

---

## Verified vs. asserted

**Verified this session:**

- The R2 object was replaced: rclone's own report plus a post-upload listing
  at the exact local byte count.
- Audio in the new zip equals the studio masters frame-for-frame (hash).
- Art, booklet and tracklist equal the Aug 31 zip byte-for-byte.
- The Aug 31 MP3 audio equals the "Streaming Masters" folder audio (same
  LUFS/peak to three decimals on the tracks checked, and the Aug 31 chat's own
  hash check against its source zip).

**Asserted, not verified:**

- **That the studio-masters folder is the intended master.** Taken on the
  owner's word; the numbers (320 kbps, -7 LUFS, +0.6 dBTP) are consistent
  with a CD-style master but do not prove intent.
- **That no download was taken between Aug 31 and Sep 2.** Owner's word.
  There is no download log to check; only Stripe would know who bought.
- **That a fresh purchase now streams the new bytes.** Not tested with a
  live purchase. The key is unchanged and `download.js` reads the object
  by key on every request, so nothing is cached in the site's path.
- **The 373 MB label on the live site.** Not screenshotted after this
  release. It is one number in a readout.

---

## Do not do these

1. **Do not `rclone copy` the delivery folder to the bucket.** The Aug 31
   wizard text (`scripts/r2-album-download.sh` stage 4) copies the whole
   folder; that folder now holds the streaming-masters zip, which would land
   in the bucket beside the real one. Use `copyto` with one file.
2. **Do not re-encode or trim the studio masters** to pull the true peak
   under 0 dBTP. Asked and refused, twice now.
3. **Do not `sed -i` a repo file in Git Bash.** It rewrote three CRLF files
   as LF and turned six one-line edits into a 1,920-line diff. Reverted with
   `git checkout --` and redone with a binary-safe Python replace. Use the
   Edit tool or Python `'rb'`/`'wb'`.
4. **Do not judge a delivery package by "audio unchanged from source".**
   That check passed on Aug 31 and the package was still wrong. Check the
   source's bitrate and loudness against what the owner says the master is.

---

## What is deliberate, so nobody fixes it

- **The tracklist truncates seconds** (5:01 for 301.5 s) and totals the exact
  durations before truncating. Reproduced exactly so the file stayed
  byte-identical.
- **`APIC` uses `encoding=0`** while every text frame uses UTF-8 — same as
  Aug 31.
- **No ID3v1 tail** on the shipped MP3s — same as Aug 31.
- **The MP3 and WAV zips carry the same Uzi Fruit edit (5:09)** by the
  owner's choice; the 5:03 cut in the masters folder is not the release.

---

## Git state

Everything this session touched is in two commits on top of `050ad4b`
(`V2HANDOFF 58`, where `main`, `feature/spine-ui-v2` and this chat's
worktree all sat at the start):

- `f68475d` copy: MP3 package is 373 MB, not 271
- this handoff

Released: `feature/spine-ui-v2` and `main` both fast-forwarded to the handoff
commit on the owner's word; the `kundalini-spines` (main) and
`kundalini-spines-spine-ui` (V2) worktrees fast-forwarded to match. **A push
to `main` is a deploy** — the only visible effect is the 373 MB readout.

---

## Still open

Carried from `58`, unchanged — nothing here touched the site:

1. **No real customer sale has gone through the webhook.**
2. **The async payment branch is untested.**
3. **No download-count cap.**
4. **Reissue is still manual.**
5. **Deluxe and Artifact remain `checkoutUrl: null`.**
6. **Nothing tests any page's copy against its own state.** This session
   added an eighth instance in kind: "271 MB" was printed in four files and
   none of them knew the object's real size.
7. **The footer chip's border has never been measured.**
8. **`--df-sky-out-fwd` at 0.12 is two thirds, not half.**
9. **The hero's decoder stumble in the first 0.2 s** is recorded, not fixed.
10. **The live site was not screenshotted after `58`'s release, nor after
    this one.**

New this session:

11. **No live purchase has pulled the new object.** The next real sale (or a
    deliberate buy-and-refund, as in `55`) is the proof; a downloaded MP3
    should read 320 kbps.
12. **The WAV package was never re-checked against the studio masters.** It
    was built from `Rise Up Wavs` on Aug 31 at about -14.3 LUFS with -3.3 to
    -4.6 dBFS peaks — a different, quieter level than the 320k studio masters.
    Whether that is the intended WAV tier is the owner's call; nobody asked
    this session.

---

## Starting the next V2 chat

Attach this file. `58` for the deep-field choreography; `57` for the contrast
harness; `56` for the Stripe webhook; `55` for the refund bug; `51` for the
Cloudflare recipe.

> Here's the latest V2 handoff for Kundalini Spines (Spine UI V2 branch). I
> want to work on <thing> this session.

The new session needs `C:\Users\Haight\Desktop\kundalini-spines-spine-ui`,
should confirm it is on `feature/spine-ui-v2`, and should serve with
`python scripts/serve.py <fresh port>` and browse `http://127.0.0.1:<port>`.
**Every push to `main` is a deploy** and happens only on the owner's word.
