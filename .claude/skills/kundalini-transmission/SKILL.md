---
name: kundalini-transmission
description: File a transmission on the Kundalini Spines site when a milestone actually lands — a release going live, sales opening, a page or feature shipping, artwork or a video landing. Use when the owner says to post/log/announce something, mentions a transmission or the log, or when a milestone has just shipped and the site does not yet mention it. Also runs as the last step of any session that shipped something a visitor would notice.
---

# Filing a transmission

The Channel Terminal on `transmissions.html` is the project's public log. It is
the one place the site says *what changed and when*, in its own voice, and
**it goes stale silently** — nothing warns you that the record went on sale and
the log never mentioned it. That is exactly what happened on Sept 1 2026: the
Digital Edition went live, four other pages were corrected to match, and the
transmissions feed still ended in July.

One job: **when a milestone lands, file it in the same session that shipped it.**

## What counts as a milestone

File one when a visitor could notice the change:

- A **release going live** — a record, a track, a video, artwork.
- **Commerce changing state** — sales opening or closing on an edition, a
  price change, a new edition becoming buyable.
- **A page or feature shipping** that a visitor can use.
- **A channel opening** — a platform link going from STANDBY to live.

Do **not** file one for: refactors, comment fixes, doc updates, build-number
bumps, tuning passes nobody asked about, or anything only visible at `/?tune`.
A log padded with invisible work stops being read.

**If in doubt, ask the owner.** A transmission is public and permanent-feeling;
it is cheap to ask and expensive to walk back.

## The data file is the whole job

Everything derives from **`data/transmissions.json`**. Channels, counts, the
`05 RECORDS DECODED` readout and the ordering all come from it — there is no
build step, no API and no third-party service. `transmissions.html` is not
edited to add an entry.

Read the `_note`, `_template` and `_channelsNote` keys at the top of that file
before writing. They are the schema and they are current.

### The rules that bite

- **Newest first, at the TOP of `entries`. The page does not sort.** An entry
  appended at the bottom appears at the bottom, looking like old news.
- **`id` is the next number, zero-padded to 3.** It is the log number shown on
  the left. Check the current top entry rather than assuming.
- **No `seed: true` on a real entry.** The `seed` entries are placeholder
  statements written so the page had something real at launch. A genuine
  milestone is not seeded, and marking it so invites a later session to delete
  it as filler.
- **`mediaAlt` is required whenever `media` is set.** Describe the image.
- **`internal` wins over `href` if both are set.** Use `internal` for a page on
  this site (`purchase.html`, `/#tracks`), `href` for the post on a platform.
- **`channel` must be one of the ids in `channels`** — `x`, `instagram`,
  `tiktok`, `youtube`, `spotify`, `filed`. A project statement that is not a
  platform post is **`filed`**.
- **`time` is optional** and is normally omitted for filed pieces.

## The voice

Read the three or four entries above yours and match them. The register is the
site's: **declarative, unhurried, specific, no marketing.** No exclamation
marks, no "we're excited to", no urgency, no discount language.

Say what a person actually gets, and say what is *not* open in the same breath
so the entry cannot be read as more than it is. Transmission 005 is the worked
example:

> **Rise Up is open** — The Digital Edition is available. Twenty-eight tracks,
> delivered twice — as MP3s to listen to and as the WAV masters to keep — and
> both download from the confirmation page the moment the payment clears.
> Nothing waits on a person. The Deluxe and Artifact editions stay filed: they
> are physical objects, and they go out when they exist rather than when they
> are announced.

That last sentence is doing real work. Without it the entry reads as the whole
shop opening.

**Do not let the entry outlive its facts.** This project has now shipped four
separate defects where a sentence about site-wide state stayed true only until
it wasn't (V2HANDOFF 55, "Copy that outlived its facts"). A transmission is
dated and reads as a statement about *that day*, which mostly protects it — but
avoid claims that are about the site's permanent state ("purchasing is now
open" ages badly the day it isn't).

## Verify before committing

The file is hand-edited JSON with em-dashes in it, so a broken entry is a real
possibility and it takes the whole page down with it — the feed is `fetch`ed,
and a parse error renders an empty terminal, not an error message.

Serve with `python scripts/serve.py` (**never** `file://` — the `fetch()` is
blocked, and never `python -m http.server`), then check, in this order:

1. **It is still valid JSON.** `python -c "import json,io;
   d=json.load(io.open('data/transmissions.json',encoding='utf-8'));
   print(len(d['entries']), [e['id'] for e in d['entries']])"`
2. **The entry is at the top** and the id sequence is descending.
3. **In a real browser** (Playwright — see `kundalini-session-start` step 8):
   the row renders first, the record count picked it up on its own, the row
   opens to show the body, any `media` resolves with a non-zero
   `naturalWidth`, and the `internal`/`href` link is present.
4. **No page errors, no failed requests, no horizontal scroll**, desktop and
   mobile.

A screenshot, looked at. "It should render" is not a check.

## Then

Commit the data file on its own with a message saying what shipped and why the
entry says what it does. If the milestone itself is still unreleased, **do not
release the transmission ahead of it** — a log entry announcing something that
is not live yet is the same class of defect this skill exists to prevent, in
the opposite direction.

Releasing is `git push origin feature/spine-ui-v2:main`, it **deploys**, and it
happens only on the owner's word — see `kundalini-session-end`.
