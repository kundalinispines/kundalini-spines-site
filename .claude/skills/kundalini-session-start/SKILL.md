---
name: kundalini-session-start
description: Start-of-session prep for the Kundalini Spines website — read the newest handoff, connect the desktop project folder, sync the GitHub repo into the workspace, verify the desktop copy matches the remote, check for unfinished work from prior sessions, and load the project's working conventions before touching any file. Use at the START of any session that will work on the Kundalini Spines site — when the user attaches a HANDOFF file, says "let's get started" / "continue working on the site", asks to wire, tune, fix, or build anything on the website, or mentions the kundalini-spines folder — even if they never say the words "start a session". Companion to kundalini-session-end, which owns the wrap-up.
---

# Starting a Kundalini Spines session

> **This file is the canonical copy.** It lives in the repo at
> `.claude/skills/kundalini-session-start/SKILL.md` so it is version controlled,
> travels with the project, and survives plugin re-syncs. A copy may also exist
> under `AppData\Roaming\Claude\local-agent-mode-sessions\skills-plugin\...` —
> that one is app-managed and gets overwritten. **Edit this file, not that one.**
> Moved here Aug 9 2026 after an edit to the AppData copy was found to be at
> risk of being discarded.

One job: **know what is true before changing anything.** This project's entire
memory between sessions is the handoff series plus what is in git. Every
session that skipped a step below has paid for it — stale caches read as
failed fixes, a stale mobile block shipped inverted values, and a claim
believed without measuring cost a whole evening. The sequence is short;
do all of it.

## Project facts

- **Work now happens on the Spine UI V2 branch, not production `main`.** The
  owner iterates on V2; `main` (the production site) is dormant — do not build
  on it, and never push to it.
- **Working folder:** `C:\Users\Haight\Desktop\kundalini-spines-spine-ui` on the
  device "haight" (Windows) — a git **worktree** checked out to branch
  `feature/spine-ui-v2`. The production worktree
  `C:\Users\Haight\Desktop\kundalini-spines` (on `main`) is a SEPARATE checkout
  and must never be used as the V2 working directory. Confirm the working folder
  is on `feature/spine-ui-v2` (`git branch --show-current`) before editing.
- **Remote:** `https://github.com/kundalinispines/kundalini-spines-site.git`.
  V2 lives on branch **`feature/spine-ui-v2`** — pushed/backed up Aug 8 2026 with
  upstream tracking set, so `git push` backs it up. `main` is production; the
  feature branch is a sibling and can never reach it on its own.
- **Handoff series:** the V2 track uses **`V2HANDOFF N.md`** (newest = highest N;
  the series starts at 19). The old `HANDOFF 1–19` series documents the dormant
  production line — background reading only, not the live task.
- **Static HTML/CSS/JS, no build step.** Serve locally over HTTP (`python -m
  http.server 8000`) — the carousel and Transmissions use `fetch()`, blocked on
  `file://`. The V2 prototype currently lives in **`spine-lab.html`**, an
  isolated page that links the real `css/tokens.css`, `css/base.css`,
  `css/star-bg.css` (and its own inline `<style>`/`<script>` for the spine).
- **The production conventions below still describe the underlying code** V2
  builds on — the reactive background (`js/spine-bg.js`), the tuner (`/?tune`
  FIELDS/TIPS/GROUPS), the `--spine-build`/`--star-build` numbers, and
  `html.page-*` page-scoping. They apply once V2 starts wrapping those systems;
  while the prototype is isolated they do not.
- **The image-generation MCP** is the artwork pipeline (the V2 wireframe spine
  `assets/hero/spine-ui-wire.png` was generated this way, then converted to a
  transparent PNG via a luminance→alpha pass in Pillow).

## The sequence

### 1. Read the newest handoff before anything else

Usually the user attaches it. If not, it is `V2HANDOFF N.md` (highest N) in the
repo root — the V2 track's handoff (the plain `HANDOFF N.md` files are the
dormant production line). Read these parts in this order, because each exists to
stop a specific mistake:

- **"Corrections to earlier handoffs"** — first, always. Every handoff so far
  has corrected the previous one; acting on a corrected claim wastes the
  session.
- **The "do not do these" list** — binding, and cumulative: each handoff's
  list says earlier lists still stand.
- **"What is deliberate, so nobody fixes it"** — the traps that look like
  bugs (inverted polarities, values past their ceilings, dead footer links).
- **"Still open"** — the top item is usually the session's likely task.

The newest handoff names which earlier ones still own material. Do not read
the whole series by default — read what the task needs. If deep context is
required across many handoffs, summarize them through a subagent rather than
loading them all.

### 2. Check the claude.ai project for unfinished work

Look for `claude/session-*-progress.md` in the attached project. An
interrupted session may have left verified work that never reached the
desktop or GitHub. If a progress note exists, honor it before starting
anything new — it says what was delivered and what was not.

### 3. Connect the desktop folder — one dialog

Request access to `C:\Users\Haight\Desktop\kundalini-spines-spine-ui` (the V2
worktree — **not** the production `kundalini-spines` folder). One request, the
minimal set; repeated permission dialogs spend the user's patience.

### 4. Get the V2 branch into the workspace

On the desktop the worktree is already on `feature/spine-ui-v2` — just confirm
and read the log. In a cloud workspace, clone and check out the V2 branch:

```
git clone https://github.com/kundalinispines/kundalini-spines-site.git
cd kundalini-spines-site
git checkout feature/spine-ui-v2
git log --oneline -3
```

The newest commit's message should describe the previous session's work as the
handoff tells it. If the handoff describes work the log does not show, say so
before proceeding — either the push never happened or the handoff is ahead of
reality. (`main` will sit a couple commits behind; that is expected — V2 is
ahead of it and never merges back without approval.)

### 5. Verify the desktop copy matches origin — do not assume it

Stage the files the session will touch and **byte-diff them against origin**.
For V2 prototype work that is at minimum `spine-lab.html` and
`assets/hero/spine-ui-wire.png`; only add the production files
(`css/spine-bg.css`, `css/star-bg.css`, `js/spine-bg.js`, `index.html`,
`about.html`) if the task actually reaches into the reactive background or
tuner. In this desktop worktree the check is a plain `git status` /
`git log` — the "clone vs desktop" split below is the cloud-workspace case:

- **Identical** → work in the clone. This is the normal case when the last
  session ended through `kundalini-session-end`.
- **Different** → the desktop has uncommitted work and the desktop is the
  truth. Copy the desktop versions over the clone's, tell the user what
  differs, and offer to fold a commit-and-push into the session's end.

This check is cheap and it is the only thing standing between the session
and silently reverting the user's uncommitted work.

### 6. Confirm the build numbers — only if the task touches the reactive background

The isolated V2 prototype (`spine-lab.html`) does not use these; skip this step
for prototype-only work. When the task does reach into `css/spine-bg.css` /
`css/star-bg.css`:

```
grep -m1 "spine-build" css/spine-bg.css
grep -m1 "star-build" css/star-bg.css
```

They must match what the newest production handoff says shipped. A mismatch means
the handoff is stale or the sync went wrong — resolve it before editing, because
the reactive-background conventions below hang off "the handoff describes this
code".

### 7. Check Higgsfield MCP — only if the task might generate assets

If the session's task could involve new or revised artwork, confirm the
Higgsfield MCP is connected (a cheap read like listing workspaces or balance
does it) and note the credit balance. Do not generate anything unprompted —
generated assets need the black-floor treatment (see the handoffs) and cost
credits, so generation is always the user's call.

### 8. Stand up the verification loop before it is needed

The project's standard is **measure it, do not eyeball it** — every change
gets verified in a real browser before it is delivered. Set this up early:

**Use Playwright. It is installed on this box** (Aug 10 2026): the **Python**
package, `playwright` 1.62.0 via pip on Python 3.14.6, with Chrome for Testing
151.0.7922.34 under `%LOCALAPPDATA%\ms-playwright\`. There is still **no Node, no
npm and no npx** — the Python package needs none of them, so do not go looking
for them. `playwright.exe` is not on PATH; invoke it as `python -m playwright`.

Ignore any older instruction about `/opt/pw-browsers/chromium` (that described a
cloud workspace) and any claim that Playwright is unavailable here — an earlier
version of this step said exactly that, and V2HANDOFF 21 repeats it. Both are
superseded.

**Do this early, before any feel judgement.** For three sessions every visual
decision was made blind, because the assistant's in-app browser pane does not
composite: `requestAnimationFrame` fired once in 4.5 seconds, CSS transitions
never advanced, and screenshots came back solid black — proven by capturing with
the HUD visible and finding that invisible too. Verified Aug 9 2026: the pane is
not a substitute for this, and the first real screenshot found a bug that days of
measurement had not (HUD sliders rendering in default browser blue).

Serve with `python -m http.server 8000`, then drive it from Python:

```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    b = p.chromium.launch(channel="chromium")   # full Chrome, NOT the headless shell
    page = b.new_page(viewport={"width": 1440, "height": 900})
    page.goto("http://localhost:8000/hero-scrub-lab.html", wait_until="load")
    page.screenshot(path=r"C:\...\absolute\shot.png")   # absolute path
    b.close()
```

Then `Read` the PNG. Notes that will otherwise cost time:

- **`channel="chromium"` matters.** The default headless shell is the cut-down
  binary; the full Chrome for Testing build is what decodes video.
- **The screenshot path must be absolute**, same as the old Chrome recipe.
- **`page.evaluate()` and `page.mouse.wheel()` reach any state**, so scroll
  position, HUD toggles and mid-animation frames are all directly reachable.

**Video renders — this is the big change.** Verified Aug 10 2026 against
`hero-scrub-lab.html`: rAF ran at ~61fps (122 frames in 2.006s), the H.264 mp4
decoded and painted real pixels (12,451 of 14,400 sampled pixels lit), and
`requestVideoFrameCallback` fired with 83 presented frames. Canvas, SVG, CSS and
images render too. **The whole page is capturable, hero video included.**

**Headless Chrome via `--screenshot` still works as a fallback** and needs no
install, but it **cannot render video** (captures at `--virtual-time-budget=500`
and `=6000` came back byte-identical) and cannot reach anything behind scroll
position. Prefer Playwright; reach for Chrome only if Playwright is somehow
broken.

**On `?cap=`:** earlier handoffs call a `?cap=coil:0.6` style parameter the
highest-value item on the track, because headless captured the page only *as
loaded*. Playwright removes that blocker — it can scroll and set state directly.
The parameter is now a **convenience for deterministic repeat captures**, not a
prerequisite. Do not treat it as blocking the visual pass.

Alongside the screenshots, keep the numeric checks — they catch different things:

- Verify CSS by reading **computed values in the browser**, never by
  re-reading the file — a syntax error in these comment-dense stylesheets
  presents as a silent no-op, not an error.
- `getComputedStyle` does not report mid-animation values; pause the
  animation and step it, or screenshot and difference the pixels.
- Transitions do not advance in the in-app pane, so a value read straight after
  setting it returns the *old* one. Set `transition: none` before reading, or the
  reading is meaningless.

## Conventions that bite — the short list

The handoffs are the authority; these are only the ones that recur every
session, kept here so they are loaded before the first edit:

- **Delivery loop:** edit in the cloud clone → verify in the browser →
  `SendUserFile` → `device_commit_files` back to the desktop (with mtime
  guards when the file was staged earlier). Never edit the user's files
  blind, and never claim delivery until the commit call returns written.
- **A new CSS variable is not done** until it is in the tuner's `FIELDS`,
  `TIPS` (single-quoted strings — **no apostrophes**, one kills the panel),
  and `GROUPS`; the Apply-pasted regex covers its prefix; page-scoped blocks
  anchor to `<html>` (never `<body>` — pseudo-elements of `html` cannot see
  body variables); any page block sits **above** the `@media (max-width:
  600px)` block and that block's selector list names every page class.
- **Bump the build numbers** (`--spine-build`, `--star-build`) on every
  change to their stylesheet. They exist because a cached stylesheet is
  indistinguishable from a change that did not work.
- **Tell the user to hard-reload (Ctrl+Shift+R)** after JS or HTML changes —
  CSS and JS cache independently in their browser, and this has produced
  false bug reports twice in one session.
- **Comment culture:** changes carry comments in the file recording what was
  measured, when, and why the obvious alternative is wrong — written for the
  next session, in the voice the codebase already uses.

## Before the first edit

Confirm, each one checked rather than assumed: newest handoff read
(corrections first) · progress notes checked · folder connected · repo
cloned and log matches the handoff · desktop verified against origin ·
build numbers match · **one Playwright screenshot taken and actually looked at** ·
task list created for the session's work.

Then start the actual task — usually the top of the handoff's "Still open"
list, or whatever the user named.

## Wrapping up

When the user says they are done, switch to **`kundalini-session-end`** —
it owns the commit/push flow, the leak check, and writing the next handoff.
