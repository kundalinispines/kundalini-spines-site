# Kundalini Spines — Spine UI V2 Handoff 46

**Date:** August 23, 2026

Twenty-eighth handoff of the **Spine UI V2** track (branch `feature/spine-ui-v2`).
`45` owns the album masthead on the three purchase surfaces and the nav repoint;
`44` owns the deep-field deep-link fix; `43` owns the feather going live. The
plain `HANDOFF 1`–`19` series documents the dormant production site on `main`.

---

## The one-line version

**The lightning was answering about half the snares the owner could hear, and it
was not the threshold — the 200Hz body-coincidence gate was rejecting 48% of all
noise onsets, a fifth of them real snares whose body simply arrived a frame late.
The window is two-sided now, it has a slider (`--snare-coinc`), the owner retuned
the whole snare channel by ear afterwards, and a second bug was found and fixed
on the way: the detector never attached to the first sample after a page load.**

---

## Corrections to earlier handoffs

- **45's "Still open" list is stale by five commits, and no handoff describes
  them.** Between 45 and this session, another Aug 23 session landed `82dbb72`
  (reference PNGs renamed), `d747702` (`connect.html`'s stale comment),
  `f555798` (purchase pages under `forced-colors`), `90c76e1` (carousel clipped
  on short laptops) and `ff7bc76` (deep-field back-nav replays forward). By
  their commit messages those close 45's open items **11, 6, 17 and 4**
  respectively. **Asserted, not verified** — this session read the messages and
  the file lists, not the diffs. The next session should either check them or
  keep treating them as open.

- **45's open item 8 — "judge the fork strike on a phone" — got sharper, not
  closed.** The fork was a lab-only setting when 8 was written; `--snare-all` now
  ships at **0.12** site-wide, so roughly one strike in eight lights all five
  bolt patterns at once on the live home page. It has never been seen on a
  phone.

- **The snare block in `css/spine-bg.css` said "MEASURED at these defaults:
  3-15 strikes per 20s (mean 9) … concentration 0.66"; that is no longer what
  ships and the file now carries both tables side by side.** Any number quoted
  about the snare from here on has to say which config it belongs to — the
  sweep's `hz 2500 / sens 2.2`, or the owner's `hz 1600 / sens 1.95 / coinc 85`.
  They differ by 70% on strike count.

- **A spawned side-task described this session's second bug as a script-ordering
  mistake. It is not; it is a race, and the distinction changes the fix.** See
  §3.

---

## WHAT SHIPPED

### 1. The body gate goes two-sided — the missing snares

The owner's report: the lightning hits about half the snares. The instinct — and
the ask — was that `s sns` was too strict and the slider needed to reach lower.
**It was measured before anything was written, per HANDOFF 13's rule, and the
instinct was wrong.** `scripts/snare-tuning.py` now prints the tally that settled
it, over all 28 samples at what was then shipped:

```
609 noise-band onsets, 260 accepted
293 (48%) rejected by the BODY GATE
 43 by everything else combined — refractory 17, pending-busy 19, kick veto 7
```

The threshold was never the bottleneck. The gate was, and it was **one-sided**:
it asked whether the 200Hz body band had *already* fired within 45ms. Of the 293
rejects, the nearest body onset arrived **0–45ms after** the noise onset 63 times
(22%) and 45–100ms after another 66; 133 had no body within 100ms at all and were
correctly refused. Which band crosses its threshold first is a property of the
mix, not of the drum.

**The fix costs nothing, because the candidate was already being held.** The
coincidence is now tested when `pendingSnare` *releases*, 45ms after the onset,
instead of at the onset — so the window reads `--snare-coinc` ms backward and up
to `VETO` (45) ms forward. Same latency, same state, no new machinery.
`js/spine-bg.js` and `scripts/snare-tuning.py` were changed together; the Python
remains the specification.

Measured, 28 samples, at the sweep's `hz 2500 / sens 2.2`:

| window | strikes / 20s | concentration (mean / worst) | ≥0.5 |
|---|---|---|---|
| one-sided 45 (before) | 9.0 | 0.66 / 0.42 | 25/28 |
| two-sided 45 | 10.9 | 0.62 / 0.31 | 20/28 |
| two-sided 100 | 12.0 | 0.59 / 0.31 | 20/28 |
| two-sided 150 | 12.8 | 0.57 / 0.31 | 19/28 |

**Read the concentration drop as a metric artefact before reading it as a
regression.** Concentration scores how tightly strikes cluster at *one* phase
between reference kicks, so catching the second real snare in a bar lowers it by
construction. What it cannot do is tell a recovered snare from a recovered hat —
which is exactly why the window became a slider instead of a new constant.

### 2. The tuner: one new slider, one widened range, and the owner's values

- **`s coin` / `--snare-coinc`**, new, 30–150ms, step 5. The recall control.
- **`s sns` floor lowered 1.5 → 1.2** as the owner asked. It is documented on the
  slider and in the stylesheet as the wrong lever, with the numbers: at the
  swept window, sens 2.0 buys 13.2 strikes for 0.57 concentration, 1.5 buys 19.1
  for 0.32, and 1.2 buys 22.6 for 0.20 — that last one is the hat detector this
  project's offline proof exists to catch.
- `FIELDS.length` is **49**; the coverage check logs `[tune] 49 sliders, all with
  hover tips`.

**Then the owner tuned it by ear and those values were baked in.** They are a
decision, not a drift, and both files say so:

| slider | variable | was | now |
|---|---|---|---|
| s fork | `--snare-all` | 0 | **0.12** — promoted from lab-only to the live site |
| s sns | `--snare-sens` | 2.2 | **1.95** |
| s coin | `--snare-coinc` | 45 | **85** |
| s hz | `--snare-freq` | 2500 | **1600** |
| s ms | `--snare-decay` | 410 | unchanged — already 410 in `html.page-home` |
| s bolt | `--snare-bolt` | 1 | unchanged — already the baseline |

The two that already matched were **deliberately not re-declared**, per the rule
in the page blocks about not stranding copies of old numbers.

Measured at the owner's config, same 28 samples: **15.6 strikes per 20s (10–21),
concentration 0.45 mean / 0.16 worst, ≥0.5 on 12 of 28**, from 940 noise onsets
→ 437 strikes. That is **+43% over the fixed default and +73% over what the
owner was hearing that morning**, and it is measurably less consistent about
where in the bar it lands. Both sit outside what the offline sweep recommends:
1.95 is under the 2.0 the sweep called the hat line, and 1600 is under the 2000
where the body starts bleeding into the noise band — i.e. the two bands stop
being independent evidence and the coincidence gate gets easier to satisfy by
accident. The owner took the trade with the numbers in front of them.

`--spine-build` **42 → 43**, with a changelog entry. `--star-build` and
`--df-build` untouched.

### 3. The detector never heard the first sample of a page load

Found while verifying §1. On a fresh load, pressing play on the track already on
screen played audio and produced **no lightning at all**: the `/?tune` meter read
`not built · 0 kicks`. Stepping one track fixed it for the rest of the session,
which is why it read as a flaky detector rather than a bug — and why the owner
has been able to tune the snare for weeks without hitting it.

**It is a race, not a script-ordering mistake.** `init()` in
`js/track-experience.js` hangs off `fetch('data/tracks.json')`, and on localhost
that promise resolves *between two of the script tags at the bottom of
`index.html`* — that file is tag 4 of the footer block, `js/spine-bg.js` is tag
8, and the microtask lands in the gap while the parser works through
spine-doc / deep-field / newsletter / scroll-weight. Measured in the browser:

```
2128.3 ms  ANNOUNCED Blue Pills   ← ks:sample-ready dispatched
2217.4 ms  LISTENER registered    ← js/spine-bg.js runs, 89 ms late
```

A slower fetch reverses it and the event arrives normally, so **"re-dispatch on
`load`" or reordering the tags would work here and fail elsewhere.** A late
subscriber has to be able to ask. So:

- `js/track-experience.js` parks the element on **`section.ksCurrentSample`**
  immediately before dispatching — the same handover, left where someone
  arriving second can still find it, not the prototype-patching hunt HANDOFF 7
  ruled out.
- `js/spine-bg.js` factors the binding into `listenTo(audio)` behind a
  `listened` WeakMap, subscribes to the event, then calls
  `listenTo(section.ksCurrentSample)` once at init.

Whichever side wins, the element is bound exactly once. The WeakMap is keyed by
element for the same reason `sources` is, and is a WeakMap rather than a WeakSet
only to keep the capability guard at the top of that block (`window.WeakMap`)
honest.

### 4. `.claude/launch.json`

Gained `runtimeExecutable: python` / `runtimeArgs: ["scripts/serve.py"]`. It was
a URL-only attach entry, so the preview tooling could not start the server
itself. Same port, same URL.

---

## How this was verified

Playwright (Python), against `python scripts/serve.py` — never `file://`, never
`python -m http.server`.

- **Offline first**, all 28 samples, before any browser code changed. The
  instrumented harness reproduces the previously documented figures exactly
  (9.0 hits, 0.66/0.42, 25 of 28), which is what makes the rest of its numbers
  trustworthy.
- **Live A/B on one track, same 18s of audio:** `s coin` 30 → 2 snares, 150 → 7,
  kicks unchanged at 18 vs 20. The slider does what the offline run says.
- **The §3 fix, fresh load, play WITHOUT touching the nav:** `running · <90Hz 9
  kicks · >1.6kHz 5 snares`. Was `not built · 0 kicks`.
- **The event path still works:** same test with a track change first → still
  `running`.
- **Double-bind guard:** three duplicate `ks:sample-ready` announcements of the
  same element, then play → still `running`, not `failed`. Without the WeakMap
  the second `createMediaElementSource` would throw.
- **`about.html`, `music.html`, `home-deepfield-lab.html`** all load clean and
  inherit the new values; **no console errors on any page**.
- Computed on `index.html`: `build 43, sens 1.95, freq 1600, coinc 85, all 0.12,
  decay 410, bolt 1`.

**Set `reduced_motion="no-preference"` on the browser context.** Headless
defaults to `reduce` and `attach()` returns early on it — the meter reads
`not built` and it looks like a broken detector. This cost time twice.

**NO SCREENSHOT WAS TAKEN, and that is a real gap by this project's standard.**
The judgement here is auditory and rate-based rather than pictorial, and it was
checked by counters instead: strike counts per fixed window, and one run that
caught a fork mid-flash with 5 bolts lit, which is `--snare-all: 0.12` working.
Nobody has *looked* at the retuned lightning on the live page, and nobody has
seen it on a phone.

### Running the offline harness again

`scripts/snare-tuning.py` needs **scipy** and a **real ffmpeg**, neither of which
is installed on this machine by default:

- `pip install scipy imageio-ffmpeg`, then copy
  `imageio_ffmpeg/binaries/ffmpeg-win-x86_64-*.exe` somewhere as `ffmpeg.exe`.
- The only ffmpeg already on disk,
  `C:\Program Files (x86)\eRightSoft\SUPER\ffmpeg.exe`, **is a decoy** — it
  decodes a 20s mp3 to 786 bytes.
- Put it on PATH **from PowerShell** (`$env:PATH = "...;" + $env:PATH`). A
  Git-Bash-style `/c/...` PATH with colons does not reach `subprocess` and the
  run dies with `WinError 2`.
- A full 28-sample run is a couple of minutes on its `Pool(8)`.

---

## Do not do these

- **Do not "restore" `s sns` 2.2 / `s hz` 2500 because they score better
  offline.** They are the sweep's pick; 1.95 / 1600 are the owner's ear. Re-run,
  show both rows, and ask.
- **Do not reach for `s sns` when strikes are missing** — it was never the
  bottleneck, and the bottom of its range is a hat detector. `s coin` is the
  recall control. If the lightning ever reads *jittery* rather than sparse,
  `s sns` is the first number to walk back, before the window.
- **Do not quote a snare figure without naming its config.**
- **Do not reintroduce a "step a track first" step when testing the detector.**
  That was the §3 bug; if the meter says `not built` now, something is genuinely
  wrong.
- **Do not decouple `section.ksCurrentSample` from the `ks:sample-ready`
  dispatch.** Whatever is announced is what must be parked.
- **Do not remove the `listened` WeakMap** — both attach paths can reach the same
  element, and `createMediaElementSource` throws the second time.
- Still: never `python -m http.server`, never `file://`, no Python text-mode
  writes to JS/CSS/HTML.

## Git state

- Branch `feature/spine-ui-v2`. Session start `ff7bc76`.
- **One code commit** covering all four strands above — they interleave inside
  `js/spine-bg.js` and could not be split cleanly by file. Then this handoff.
- **Five files touched:** `js/spine-bg.js`, `css/spine-bg.css`,
  `scripts/snare-tuning.py`, `js/track-experience.js`, `.claude/launch.json`.
- **No new binaries. 0 bytes of media added.**
- `--spine-build` 42 → **43**, so a normal reload picks the stylesheet up.
- `main` untouched. No PR.

## Still open

1. **Listen to the retuned snare on real hardware, and look at it.** Nothing
   visual was screenshotted this session, and 0.12 fork + 15.6 strikes/20s is a
   busier lightning layer than anyone has actually watched.
2. **The fork strike on a phone** (45's item 8, now live rather than lab-only).
3. **Verify the five undocumented Aug 23 commits** actually closed 45's items 4,
   6, 11 and 17, or restore them to this list.
4. **Wire the purchase page, or decide not to yet.** Needs the owner: Stripe
   account, real prices, the Payment-Links-vs-backend call in `STRIPE-SETUP.md`.
   Fulfilment is unbuilt. GitHub Pages is static.
5. **Whether phones should pay the 120.4KB of feather masks.**
6. **Whether the glow and the foreground ever ship.** Both judgeable at `/?tune`.
7. **No Purchase entry in the nav** — a design question, not an edit-cost one.
8. **Assign masks 04–07 to rows**, or call 3 / 1 / 2 final.
9. **Judge the hero-wait (~675ms).**
10. **A glow gradient block** for `rain-transmission-rooftop`.
11. **A JS transcription of the vertebral rhythm** for mask 06, plus a parity
    story for 07.
12. **Mobile judgement calls** (41's item 5): nav links 25px, tablets ≥768 taking
    the 4.9MB clip, About at 3.55:1 under AA.
13. **Whether the VHS should run on phones.**
14. **The lab's fate**, now that it duplicates `index.html`.
15. **Phase two of the Music handoff** — playback gating; four hooks, none used.
16. **A `-g 48` re-export of the spine render.**
17. The two filmrow labs still scrubbing; the doc-rail ring inversion; the
    frame-budget decision; `music.html` still a redirect stub; stale amber-era
    `?tune` TIPS prose; the two missing trivia files; the astral scrim; the
    inherited pile.

---

## Starting the next V2 chat

Attach this file. The working folder is
`C:\Users\Haight\Desktop\kundalini-spines-spine-ui` on `feature/spine-ui-v2`.
Serve with `python scripts/serve.py`, browse `http://localhost:8000` — never
`file://`, never `python -m http.server`.

The single most useful next step is **item 1**: load the home page, play a
sample, and watch the lightning for a minute. Every number in this handoff says
the detector is answering far more of the record than it was; nobody has yet
confirmed with their eyes that it looks better rather than merely busier.
