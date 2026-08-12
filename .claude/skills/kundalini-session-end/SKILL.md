---
name: kundalini-session-end
description: End-of-session checklist for the Kundalini Spines website — commit and push outstanding work to GitHub, confirm nothing internal leaked, and hand the project cleanly to a new chat. Use when the user says they are done, wrapping up, ending the session, closing out, or asks how to push their changes, how to save their work, how to start a new chat on this project, or how to hand off to a new session.
---

# Ending a Kundalini Spines session

> **This file is the canonical copy.** It lives in the repo at
> `.claude/skills/kundalini-session-end/SKILL.md` so it is version controlled,
> travels with the project, and survives plugin re-syncs. A copy may also exist
> under `AppData\Roaming\Claude\local-agent-mode-sessions\skills-plugin\...` —
> that one is app-managed and gets overwritten. **Edit this file, not that one.**

Two jobs, in this order: **get the work into GitHub**, then **make the next chat useful**. Do not skip the second — this project has no memory between sessions except the handoff file.

## Project facts

- **This is the Spine UI V2 track.** Work lives on branch **`feature/spine-ui-v2`**, never `main`. `main` is the dormant production site — do not commit to it, do not merge V2 into it, and do not open or merge a pull request into it without explicit approval.
- **Folder:** `C:\Users\Haight\Desktop\kundalini-spines-spine-ui` — a git **worktree** on `feature/spine-ui-v2`. The production worktree `C:\Users\Haight\Desktop\kundalini-spines` (on `main`) is separate; never use it here. Confirm `git branch --show-current` reads `feature/spine-ui-v2` before any commit.
- **Remote:** `https://github.com/kundalinispines/kundalini-spines-site.git`. V2 pushes to branch **`feature/spine-ui-v2`** — already on GitHub with upstream tracking set (since Aug 8 2026), so `git push` backs it up.
- **Static HTML/CSS/JS, no build step.** Serve with **`python scripts/serve.py`** — the carousel and Transmissions use `fetch()`, which browsers block on `file://`. **Not `python -m http.server 8000`**, which this file recommended until Aug 12 2026: it answers media requests with no `Accept-Ranges`, so Chrome reports `video.seekable` as `[[0, 0]]` and every `currentTime` assignment silently clamps to 0. No console error, no failed request. Three sessions' video measurements were invalidated by it (V2HANDOFF 23), and the `kundalini-session-start` skill was corrected at the time while this one was missed. The V2 prototype is `spine-lab.html`.
- Claude reaches these files but **the user runs every git command below themselves** — walk them through it and read the output back.

## Part 1 — Push the work

Ask the user to run these in the project folder and paste back the output.

### 1. See what changed

```
git status
```

**Read the output with them rather than assuming.** Things to actually check:

- Are you on `feature/spine-ui-v2`? The first line of `git status` must say so. If it says `main`, **stop** — that is the wrong worktree.
- Are all the changed files ones this session touched? An unexpected file is worth a question before it gets committed.
- Is anything large or private appearing? `.gitignore` already excludes `ks-backup-*.zip`, `*-Track-Art*.zip`, `_to_delete/` and `setup/`. If a backup zip or anything from the 885 MB masters folder shows up as untracked, **stop** — it should not enter the repo.
- Untracked handoff files (`V2HANDOFF *.md`) do need adding — they belong in the repo.

### 2. Commit

```
git add -A
git commit -m "<summary of what actually changed>"
```

Write a real message describing the change, not "updates". Past examples:

- `feat: add spine navigation shell prototype (spine-lab)`
- `Add V2HANDOFF 19`

Prefer staging the specific V2 files by name over `git add -A` when it makes the intent clearer; either is fine as long as step 1 showed nothing unexpected.

### 3. Push

```
git push
```

Expect a line like `4e81d07..<new>  feature/spine-ui-v2 -> feature/spine-ui-v2` (upstream is already set, so a bare `git push` works — no `-u` needed). If it says `Everything up-to-date` but `git status` showed changes, the commit did not happen — go back to step 2. **The push target is `feature/spine-ui-v2`; a line mentioning `main` means something is wrong — stop.**

### 4. Confirm it landed

```
git log --oneline -3
git status
```

`git status` should say **working tree clean**. That is the actual proof the session's work is safe, not the push output.

## Part 2 — Deployment state

**Pushing `feature/spine-ui-v2` backs up the work; it does not publish anything.** Production publishing is a `main` concern and stays dormant (as of production HANDOFF 5, GitHub Pages was disabled and DNS for `kundalinispines.com` was the blocker — do not enable it from the V2 branch).

If the repo has a GitHub↔Vercel integration that builds feature branches, the push may produce a **preview deployment of V2** — useful for comparing against production, and harmless. Do not modify production deployment configuration to make it happen. Never promise the V2 branch is "live" on the real domain — it is a preview at most.

## Part 3 — Hand off to the next chat

### Is the handoff current?

Look at the newest `V2HANDOFF N.md` (the V2 track's series — the plain `HANDOFF N.md` files belong to the dormant production line). If this session changed anything it does not describe, **the handoff is stale and should be updated before the session ends.** A stale handoff is worse than none, because the next session trusts it.

Offer to write the next one. Follow the established shape:

- **Lead with corrections to the previous handoff.** Every one so far has had claims that went out of date. Put them first, not buried.
- **Record findings that were measured**, with the date and how they were measured — so nobody re-derives them.
- **Include a "do not do these" list** where a wrong fix is tempting. The `no-cors` warning in `js/newsletter.js` exists because the wrong fix looks like the right one.
- **Note what is deliberate**, so a later session does not "clean up" an intentional decision — dead TikTok/Spotify footer links, unreferenced `js/music-page.js`, empty Transmissions channels.
- **Distinguish verified from asserted.** If something was taken on the user's word rather than checked, say so.
- **"Not seen" is no longer an acceptable default.** Headless Chrome screenshots work on this machine — the recipe is in `kundalini-session-start` step 8. If a visual change shipped without a single screenshot being taken and looked at, that is a gap to name in the handoff, not a limitation to describe. Three sessions were judged blind before this was discovered, and the first screenshot found a bug that measurement had not.
- **Keep the "Still open" list honest** — move closed items out, and say when something is closed rather than leaving it looking unresolved.

Write it as a working document, export to `V2HANDOFF N.md` (the V2 series; it starts at 19 and increments — do not reuse the plain `HANDOFF` numbers), and place it in the project folder root. Then it needs its own commit and push — go back to Part 1.

### Starting the new chat

Tell the user to start a new chat and **attach the newest `V2HANDOFF N.md`**, plus any earlier handoff it says is still required reading.

A good opening message for the new chat names the goal:

> Here's the latest V2 handoff for Kundalini Spines (Spine UI V2 branch). I want to work on <thing> this session.

The new session will also need folder access to `C:\Users\Haight\Desktop\kundalini-spines-spine-ui` (the V2 worktree, **not** the production `kundalini-spines` folder) — it should request it early, and confirm it is on `feature/spine-ui-v2` before editing.

## Before you say you are done

Confirm out loud, each one checked rather than assumed:

- `git status` reports a clean working tree
- `git log` shows the session's commits, and they are pushed
- The newest handoff describes what actually happened this session
- The handoff itself is committed
- Anything visual that shipped was screenshotted and looked at, or the handoff says plainly that it was not
- The user knows what is *not* done — anything left open, and anything waiting on them

Then give a short plain-language summary: what changed, what is still open, and the single most useful next step.
