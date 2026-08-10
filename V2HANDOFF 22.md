# Kundalini Spines — Spine UI V2 Handoff 22

**Date:** August 10, 2026

Fourth handoff of the **Spine UI V2** track (branch `feature/spine-ui-v2`). Read
`V2HANDOFF 21.md` alongside this one — it still owns the entrance sequence, the
twin serpents, the dust handoff and the reduced-navigator warning. `20` owns the
aster asset split and the settled idle read; `19` owns the navigator architecture
and the stack reframe. The plain `HANDOFF 1`–`19` series documents the dormant
production site on `main` and is background reading only.

---

## The one-line version

**A tooling session: no site code was changed at all.** Playwright now runs on
this machine, the entrance was seen for the first time, and 21's instruction not
to install Playwright is wrong and has been corrected at the source.

---

## READ THIS FIRST: 21 tells you to do the wrong thing

V2HANDOFF 21 states, in its "…and it was solved before the session ended"
section: *"No Node, no npm and no Playwright are present — do not try to install
them."* The `kundalini-session-start` skill said the same in step 8 and routed
all visual work through a headless-Chrome `--screenshot` recipe.

**That is now false.** Playwright ships a **Python** package. This box has Python
3.14.6 and pip 26.1.2. It installed in about ninety seconds with no Node
anywhere in the picture.

The skill has been rewritten. **This handoff cannot rewrite 21** — when you read
21's headless-Chrome guidance, ignore it.

---

## Corrections to V2HANDOFF 21

21 was accurate when written. These parts are now out of date:

- **"No Playwright — do not try to install it"** — installed Aug 10 2026 and
  verified working. See below.
- **The headless-Chrome limitation "video does NOT render" no longer binds.**
  It is still true *of headless Chrome*, and that fallback is still documented.
  It is not true of the tooling now available.
- **Still-open item 1, the `?cap=` capture parameter, is DOWNGRADED — not done,
  but no longer the blocker it was described as.** 21 calls it "the highest-value
  thing available to this track" because headless captured the page only *as
  loaded*. Playwright drives the page directly (`page.evaluate`,
  `page.mouse.wheel`), so scroll states are already reachable. `?cap=` is now a
  convenience for deterministic repeat captures. **Do not spend a session on it
  believing it unblocks the visual pass. It does not, any more.**
- **Still-open item 2, "LOOK AT IT", is STARTED, not closed.** Exactly one frame
  has been seen — the entrance at rest, `scrub 0.00`. The coil, the dust, the
  bones and the cut are all still unseen.
- **Still-open item 3, the blue HUD sliders, is CONFIRMED STILL PRESENT** and
  still unfixed. Seen directly this session, not inferred.

---

## Git state

- Branch `feature/spine-ui-v2`, worktree `C:\Users\Haight\Desktop\kundalini-spines-spine-ui`.
- Session start: `532309c`, level with `origin/feature/spine-ui-v2`, working tree clean.
- `main` = `origin/main` = `13083d9`, untouched. No PR opened.
- **Zero site files modified.** The only repo change is
  `.claude/skills/kundalini-session-start/SKILL.md` (step 8 rewritten) plus this
  handoff. Everything else this session happened outside the repo.

---

## What shipped

### 1. Playwright for Python

```
python -m pip install playwright
python -m playwright install chromium
```

- `playwright` **1.62.0**; deps `greenlet` 3.5.4 (a real cp314 wheel exists),
  `pyee` 13.0.1, `typing-extensions` 4.16.0.
- Browsers land in `%LOCALAPPDATA%\ms-playwright\`: **Chrome for Testing
  151.0.7922.34** (191.8 MiB), headless shell (114.5 MiB), ffmpeg (1.3 MiB),
  winldd (0.1 MiB).
- **`playwright.exe` is not on PATH** — pip warns about this. Use
  `python -m playwright`. Nothing is broken; do not "fix" the PATH.
- **Launch with `channel="chromium"`.** The default is the cut-down headless
  shell. The full Chrome for Testing build is the one that decodes video.

### 2. The entrance was seen

First real capture of `hero-scrub-lab.html`, 1440×900, at rest. It renders: the
two hooded messengers from the hero video, the DOM title *"Knowledge Hidden in
Plain Sight"*, the full HUD across the bottom with all its dials legible.

### 3. `kundalini-session-start` step 8 rewritten

Replaced the headless-Chrome recipe with a Playwright one, kept headless Chrome
documented as a fallback with its video limitation intact, downgraded `?cap=`
from blocker to convenience, and changed the closing checklist line to "one
Playwright screenshot taken and actually looked at".

### 4. Third-party skills installed (outside the repo)

`github.com/mattpocock/skills`, plugin manifest v1.2.3, MIT. Both documented
install routes were dead ends here — `npx skills@latest` needs Node, and no
`claude` CLI exists on PATH — so the repo was cloned and the **25 skills named in
`.claude-plugin/plugin.json`** were copied to **`C:\Users\Haight\.claude\skills\`**
(user scope, deliberately *not* the project, so they stay out of this repo).
203 KB, 74 files. The repo's `deprecated/`, `in-progress/` and `misc/` folders
were skipped, matching what the plugin ships.

**Five were then parked** to `C:\Users\Haight\.claude\skills-disabled\` (moved,
not deleted — a sibling directory, so it is not scanned):

| parked | why |
|---|---|
| `code-review` | name collides with the built-in `/code-review` command |
| `handoff` | would compete with `kundalini-session-end` for the wrap-up |
| `tdd` | auto-fires on "fix this bug"; this repo has no test runner at all |
| `prototype` | the whole V2 track *is* throwaway labs; it would fire constantly |
| `research` | writes its findings as a Markdown file **into the repo** |

**20 active, and the auto-trigger surface is down from 11 to 6:**
`codebase-design`, `diagnosing-bugs`, `domain-modeling`, `grilling`,
`resolving-merge-conflicts`, `writing-for-agents`. The other 14 are user-invoked
only. Restore any parked one with
`mv ~/.claude/skills-disabled/<name> ~/.claude/skills/`.

---

## Measured findings (date + method, so nobody re-derives them)

All measured Aug 10 2026 against `python -m http.server 8000`, via a Playwright
probe script driving `hero-scrub-lab.html`.

1. **The pane-vs-Playwright gap is enormous, and it is a compositing gap.**

   | | in-app pane (21) | headless Chrome (21) | Playwright (now) |
   |---|---|---|---|
   | rAF | 1 frame / 4.5s | n/a | **122 frames / 2006ms** (~61fps) |
   | video | — | poster only, byte-identical captures | **decodes and paints** |
   | `requestVideoFrameCallback` | never fired | never fired | **fired, 83 presented frames** |

2. **The hero mp4 genuinely decodes.** `currentSrc` resolved to
   `messengers-hero-video.mp4` (mp4 is listed first, as 20 finding 1 requires),
   `readyState` 4, duration **8.768s**, **1920×1080**. `canPlayType` returned
   `probably` for both H.264 and VP9 — Chrome for Testing carries proprietary
   codecs, which plain Chromium builds do not. Drawing the video to a canvas gave
   **12,451 of 14,400 sampled pixels lit, mean luma 74.9**. Zero console errors.

3. **The page owns `video.currentTime`; a naive seek is overridden.** The probe
   seeked to 5.469s, waited for `seeked`, and then read `currentTime` back as
   **0**. The pixels drawn were real either way, but the timestamp was not the
   requested one. **Anything that needs a specific frame must go through the
   page's own scroll/scrub path, not a raw `currentTime` assignment** — the
   entrance logic will fight it. This is the first thing to solve for capturing
   the coil and the dust.

4. **Something is drawn at `scrub 0.00 / aster 0.00` and it is not identified.**
   The capture shows a spine outline and flower-of-life geometry centred on
   screen, plus faint small "KUNDALINI SPINES" text, behind the DOM title. It is
   either baked into the hero video's first frame or the aster is leaking through
   at reveal 0. **Not resolved this session** — the server was closed before it
   could be checked. If it is the aster, it is a real bug and it means the reveal
   has no dark start. **Check this first next session; it is a two-minute test now.**

5. **No `${CLAUDE_PLUGIN_ROOT}` in any mattpocock skill.** Every internal
   reference is relative to its own skill folder, which is why a plain directory
   copy works in place of the plugin install.

---

## Do not do these

Everything in 19, 20 and 21's lists still stands. Additionally:

- **Do not follow V2HANDOFF 21's headless-Chrome instructions**, and do not
  repeat its "do not install Playwright" line. Both are superseded by the
  rewritten step 8.
- **Do not go looking for Node, npm or npx.** They are still absent. Playwright
  here is the Python package and needs none of them.
- **Do not launch Playwright without `channel="chromium"`** if video matters —
  the default headless shell is not the same binary.
- **Do not set `video.currentTime` directly** to reach a frame in
  `hero-scrub-lab.html`. See finding 3.
- **Do not build `?cap=` believing it unblocks the visual pass.** It does not any
  more. Build it only if deterministic repeat captures are wanted for their own sake.
- **Do not install the mattpocock skills a second time** via
  `/plugin install mattpocock-skills`. The README warns that both routes together
  give every skill twice. If the plugin route is ever used, delete
  `~/.claude/skills/` first.
- **Do not un-park the five disabled skills without a reason.** Each was parked
  for a specific collision, listed above.

---

## What is deliberate, so nobody "fixes" it

- **The skills went to user scope, not the project.** They are third-party and
  general-purpose; putting them in `.claude/skills/` would commit 203 KB of
  someone else's workflow into the band's site repo and mix them with the two
  canonical project skills.
- **Parked, not deleted.** Moving to a sibling directory keeps them one command
  from restoration and leaves the decision reversible.
- **`implement`, `to-spec` and `to-tickets` were kept despite assuming a stack
  this repo does not have** (no `package.json`, no tests, no issue tracker). They
  are user-invoked only, so they cannot fire on their own, and the install is
  user-scope — removing them would be over-reach for other projects.
- **Headless Chrome was left documented as a fallback** rather than deleted from
  the skill. It needs no install and still works for everything except video.

---

## Verified vs. asserted

**Verified by tooling this session:**
- Git isolation and branch parity — `git status` / `git fetch`, clean at `532309c`.
- Every Playwright figure in finding 1 and 2, from a probe script whose raw JSON
  output was read back.
- The entrance capture — an actual PNG, actually looked at.
- The blue HUD sliders, seen in that PNG.
- All 25 skills installed with `SKILL.md` present, frontmatter intact, `name:`
  matching folder, UTF-8 preserved; then 5 moved and both directories re-listed.
- Port 8000 closed at the end (pid 38592 stopped, re-checked as not listening).

**Asserted / NOT verified:**
- **The entrance is still 95% unseen.** One frame, at rest. The coil, the dust,
  the bones, the cut and the tooltips remain unjudged — the entire "NOTHING WAS
  SEEN" caveat of handoff 21 survives except for that single frame.
- **Finding 4 is an open question, not a conclusion.** It may be nothing.
- **Nothing was re-verified after the tooling change.** Every arithmetic-only
  claim in 21 is still arithmetic-only.
- **Playwright has only ever been pointed at `hero-scrub-lab.html`.** The other
  three labs and the production pages have not been opened with it.
- **`prefers-reduced-motion` still never tested** on any of the four labs.
- **No mobile work at all**, still true of all four labs.
- **Performance still unmeasured** — the coil's ~880 `stroke()` calls a frame and
  the dust's ~7,800 particles have never been timed.

---

## Still open

1. **Resolve finding 4** — is that spine outline the video or the aster? Two
   minutes with Playwright, and it gates whether the reveal is correct at all.
2. **LOOK AT THE REST OF IT.** Coil mid-travel, dust mid-sweep, the bones, the
   intro cut. Needs the finding-3 workaround (drive the page's own scroll).
3. **Fix the blue HUD sliders** — `.hud input[type=range] { accent-color: rgb(240,165,92); }`.
   Confirmed still present. One line, three handoffs old.
4. **The `css/spine-ui.css` + `js/spine-ui.js` extraction.** Overdue — the
   six-node table lives in two files and is hand-synced. The `codebase-design`
   skill is now installed and aimed at exactly this.
5. **Time the coil and the dust** on real hardware.
6. **Confirm the ring-2 fix** — owner's call, changes a look already signed off.
7. **`spine-ui-wire.png` → webp.** 640 KB, in the entrance flow.
8. **Scroll-linked vs Timed once** for the aster reveal — still no verdict.
9. **Mobile** — four labs, no mobile answer anywhere.
10. **Production scroll-unlock answer.** The lab's Reset button is not it.
11. **`?cap=`** — downgraded to optional. See corrections.
12. **Tuner integration; Music / Archive immersive wraps** — unchanged from 19.

**Closed since 21:** the "assistant cannot see" problem, properly this time —
video included, not just canvas and CSS.

---

## Housekeeping

A memory note was written recording the Playwright install and that 21's
guidance is superseded, because that instruction actively misdirects and the
handoff files are the only thing a new session reads.

`python -m http.server 8000` was closed at the end of the session. The
mattpocock clone lives in the session scratchpad and is disposable; re-clone
from `github.com/mattpocock/skills` if the skills ever need updating, since a
manual copy gets no automatic updates.

---

## Starting the next V2 chat

Attach this file (`V2HANDOFF 22.md`), `V2HANDOFF 21.md`, `20` and `19`. The new
session needs folder access to `C:\Users\Haight\Desktop\kundalini-spines-spine-ui`
(the V2 worktree, **not** production `kundalini-spines`) and should confirm
`feature/spine-ui-v2` before editing. Serve with `python -m http.server 8000`.

**Reload note:** python's server sends 304s. Hard-reload or use a `?cb=`
cache-buster.

A good opening message:

> Here's the latest V2 handoff for Kundalini Spines (Spine UI V2 branch).
> Playwright works now — start by screenshotting the entrance and telling me
> what is actually on screen at scrub 0.
