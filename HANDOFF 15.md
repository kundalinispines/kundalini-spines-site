# Kundalini Spines — Session Handoff 15

**Date:** August 6, 2026

**Supersedes:** nothing wholesale. `HANDOFF 3`–`6` still own their material. `7` still owns the spine layer's architecture. `8` owns the glow band and the 4K regeneration. `9` owns the four\-band star field. `10` owns the kick\-reactive rebuild and the biquad detector. `11` owns the WARP correction. `12` owns the mirror tile and the cloud mask. `13` owns the nebula/kick rewiring. `14` owns the lightning asset and the page\-scoping architecture.

**What this document does:** it wires the lightning layer in, then rewires it onto a **snare detector** that was proven offline against all 28 samples before any browser code was written — recording the broken gate that proof caught. It also turns the spine off on the home page behind a new toggle, adds a minimize button to the tuner, and hands the next session a start\-of\-session skill so this prep stops being re\-derived from scratch.

* * *

## The one\-line version

**The lightning is live and it answers the SNARE, not the kick.** `.star-bolt` is driven by a second envelope, `--snare`, from a two\-band coincidence detector with a symmetric kick veto — hz 2500 / sens 2.2, phase concentration 0.66 mean across all 28 samples, 3–15 strikes per 20s. The kick and the snare are two channels on purpose: the kick moves the column, the shake and the nebula; the snare strikes the lightning and strikes nothing else. Separately, `--spine-on: 0` in `html.page-home` turns the spine column off on the home page — the first value ever to land in that block.

## Corrections to earlier handoffs — read first

**1\. HANDOFF 14's §4 wiring shape is correct but its kick coupling is superseded.** The layer was built exactly to the specified shape and verified — then the owner clarified the design: the lightning side\-chains to the *snare*, not the kick. `--kick-bolt` existed for about an hour inside this session and never reached a commit; the shipped rule is `opacity: calc(var(--snare) * var(--snare-bolt))`. Do not reintroduce a kick term.

**2\. HANDOFF 13's two\-band gate prose is underspecified, and its naive reading is broken.** "2 kHz noise rising AND 200 Hz body rising together" read as a *frame\-delta* check — body RMS higher than last frame — measured **26 accepted onsets per 20s against \~22 kicks, phase concentration 0.30, 1 of 28 tracks above 0.5**. A frame delta is positive about half the time regardless of the drums, so the "gate" passed nearly everything. What reproduces (and beats) HANDOFF 13's 0.63 is a **coincidence of ONSETS**\: the body band runs its own full threshold machine (base/peak/floor/rising/armed, the same shape as the kick's), and a noise\-band onset counts only if the body machine fired within 45ms. Presumably 13's offline experiment did this too; the prose just never said so. The measurement, the failed gate, and the sweep are all recorded in `scripts/snare-tuning.py`.

**3\. The veto in HANDOFF 13 must be SYMMETRIC, which real\-time code cannot do for free.** The kick's own beater click crosses 2.5kHz a few ms *before* the low band's RMS trips, so "no kick in the last 45ms" still fires on the kick itself. The shipped detector holds each candidate **pending for 45ms** and cancels it if a kick lands while it waits. Cost: the flash lags the acoustic snare by \~3 frames, well inside the window where sound and light read as simultaneous. This is a decision, not lag — do not "optimize" the deferral away.

**4\. HANDOFF 14 left `--star-build` unbumped at 15 with a note to bump it if it bothered the next reader.** It is now **17** (16 \= the lightning layer, 17 \= the snare rewire), and `--spine-build` is **35**.

**5\. HANDOFF 14's open item about `css/spine-bg.css` line 3 ("Loaded by index.html only") is closed** — both that header and the matching stale line in `js/spine-bg.js` now name both pages. The similar stale lines in `css/base.css` (lines 17–18) and `css/star-bg.css` (\~line 151) were left untouched; they are still wrong in the same direction.

* * *

## The snare detector — proven offline first, and what the proof caught

HANDOFF 13's sequencing rule — *finish proving it in Python against all 28 samples first, then write browser code* — was followed, and it earned its keep on the first run: the naive delta\-gate above would have shipped as lightning striking on hats and vocals, reading as "the detector is jittery," which is a far harder bug to see than "it does not work."

**The shipped design** (all constants mirrored between `scripts/snare-tuning.py` and `js/spine-bg.js` — if they ever disagree, the Python is the specification):

- **2\.5kHz highpass ×3 (Q 1.0) → RMS** — the snare's noise burst, same threshold machine as the kick. 13's reasoning for a high band stands: the obvious 150–400Hz body band cross\-triggers with the kick 27% of the time, the noise band 2.7%.
- **200Hz bandpass (one stage) → RMS** with its **own onset machine** (sens 1.5, fixed) — the coincidence gate. A snare is the one thing in these mixes that onsets both bands at once; hats have no body, bass has no noise.
- **±45ms kick veto via the pending hold** described above. Refractory 150ms (kicks use 190; snares sit on the backbeat and 150 never truncated a real pattern offline).

**Measured, all 28 samples, shipped defaults (hz 2500 / sens 2.2 / body 1.5):**

```
  phase concentration     0.66 mean · 0.42 worst · >= 0.5 on 25 of 28
  strikes per 20s         3-15 (mean 9), against 16-31 reference kicks
  naive delta-gate        0.42 at the same sens (18/20s); 0.30 at sens 1.6 (26/20s)
  HANDOFF 13's benchmark  0.63 on its 8-track subset, all >= 0.5
```

The three tracks under 0.5 — `extra-zoom` 0.42, `kabal` 0.44, `may-26th` 0.44 — are the busiest percussion on the record; their strikes still land musically, at two places in the bar rather than one.

**What concentration does and does not prove**, kept from 13 so it is not lost: it measures *consistency*, not correctness. There is no hand\-labelled snare ground truth, so these numbers say "it fires at one stable place in the bar," and the owner's ear is the last word on whether that place is the snare. The owner listened on real hardware this session and called it good, with settings he may still adjust — `s sns` is the first lever (stricter \= fewer, looser bleeds onto hats below \~2.0), against the new second meter bar in `?tune`.

**End\-to\-end verification** ran real audio through the live graph in a browser (an `Audio` element dispatched via `ks:sample-ready`, exactly as `track-experience.js` does): the kick forced to 1 moved the bolt by exactly nothing, `--snare` fired in bursts peaking at 0.94, the bolt lit only on those, and pause cleared both envelopes and the class.

## What else was built

### 1\. The lightning layer itself (build 16, then rewired in 17)

Exactly HANDOFF 14 §4's shape: `.star-bolt` injected from `js/spine-bg.js` as a body child beside the spine build, `position: fixed; inset: 0; z-index: -1; mix-blend-mode: screen`, `nebula-lightning-4k.webp` at 50% 50% / cover, static `brightness(var(--star-bolt-bright))` in the filter, idle opacity 0, the animated rule scoped to `:root.is-spine-kicking`. Registered in the reduced\-motion rule (with `!important`, since the scoped rule outranks it otherwise), in `STAR_LAYERS` (now seven layers), hidden in the `star bands only` view mode, and in the tuner. MEASURED at 1440×900: the bolt\-only delta moves light on **2\.6% of the frame with zero pixels darkened**, matching 14's \~3% prediction; the filaments sit inside the nebula's diagonal and the blacks hold.

### 2\. `--spine-on` — the spine is off on the home page (build 35)

The owner's call, made after the lightning went in: the sky carries the motion on index.html now and the column had become the third thing moving. A new 0/1 toggle multiplies into the opacities of `.spine-bg__art` (both copies), `__bloom` and `__scan` — **on the children, never on `.spine-bg` itself**, because parent opacity below 1 creates a stacking context and the screen blend resolves against the group's transparent backdrop: the HANDOFF 7 grey rectangle through a different property. `html.page-home { --spine-on: 0 }`; about.html inherits the baseline 1 and is untouched. Everything else keeps running on home — the script, `--charge`, both detectors, the tuner (drag `on` to 1 to see the column as tuned).

### 3\. Tuner: snare group, `on` toggle, minimize

`FIELDS` went 34 → **40** this session: `on` (column group, step 1), the snare group (`s bolt` / `s ms` / `s sns` / `s hz`, open by default), `bolt b` in sky, plus the short\-lived `k bolt` replaced by `s bolt`. The Apply\-pasted regex now covers the `--snare-` prefix; the hidden\-slider filter hides `--snare-*` with `--kick-*` where the detector cannot attach (about.html logs `12 kick/snare sliders … HIDDEN`); the meter carries a second pair of bars (snare envelope, then 2.5kHz level against threshold — tune `s sns` against that caret exactly as `k sns` against the first). A **minimize button** (`−`, top\-right) collapses the panel to a `+ tune` corner chip — same element, nothing torn down, undialed slider values survive, remembered across reloads in `localStorage` as `ks-tune-panel`. The chip's styling needed `button.spine-tune__min` selectors: the shared `.spine-tune button` rule is (0,1,1) and beats a bare class.

### 4\. A session\-start skill

`kundalini-session-start` was built and delivered to the owner's Claude account (it is not a repo file). It encodes the prep this session performed: newest handoff corrections\-first, check the Claude project for interrupted\-session notes, one folder\-access dialog, clone the repo, **byte\-verify the desktop copy against origin/main before any edit**, confirm build numbers, stand up browser verification, and a gated Higgsfield MCP check. Companion to `kundalini-session-end`. Next session: attach this handoff and the skill should trigger on "let's get started."

## Do not do these

- **Do not wire the lightning back to `--kick`, and do not "unify" the two envelopes.** Two instruments, two channels, the owner's explicit design.
- **Do not read "rising" in a gate spec as a frame delta.** Onset machines only. And do not ship any detector change without re\-running `scripts/snare-tuning.py` — the naive gate looked plausible and measured 0.30.
- **Do not scale `--snare` by `--kick-gain`.** The snare's amount lives in `--snare-bolt`; coupling the outputs retunes the lightning every time the column is tuned.
- **Do not remove the 45ms pending hold** from the snare machine. It is the symmetric veto; without it the kick's beater click fires the lightning.
- **Do not put an opacity (or z\-index) on `.spine-bg`.** `--spine-on` multiplies the children. Parent opacity between 0 and 1 is the grey rectangle again.
- **Do not lower `--snare-sens` much below 2.0 expecting more snares** — the sweep shows you get hats first. Raise `--star-bolt-bright` for brighter strikes, `--snare-bolt` for harder ones; the sens is the *listening* control.
- **Do not give the body band sliders.** 1.3 → 2.0 moved concentration \~0.05 in the sweep; a slider that does nothing reads as broken. It is a fixed constant with the measurement beside it.
- **Do not "fix" the minimize chip overlapping the sound\-off control.** The full panel always covered that corner, and the tuner exists only at `?tune`.
- Everything in HANDOFF 7–14's lists still stands.

## What is deliberate, so nobody "fixes" it

- **`--snare-sens: 2.2` is stricter than `--kick-sens: 1.8` on purpose** — the high band is busier (hats, sibilance, vocals).
- **There is no `is-snare-kicking` class.** One loop runs both machines; `:root.is-spine-kicking` means "the detector loop is running," and both envelopes start and stop together.
- **The lightning flash lags the snare by \~45ms.** The symmetric veto's price, chosen knowingly.
- **`html.page-home` now carries exactly one value**, and the one\-value\-only\-when\-different rule from 14 still governs both page blocks.
- **No mobile overrides were added for `--star-bolt-bright`, `--snare-*` or `--spine-on`.** Nobody has looked at any of this on a phone; a guessed number reads as a decision. The mobile block's existing rot (14 §3) is unchanged and now has more company.
- **`scripts/snare-tuning.py` imports `kick-tuning.py` by file path** (hyphenated name, `SourceFileLoader`) — not renamed to underscores, for the same reason the HANDOFF files keep their names: the kick harness is referenced by name in comments and its own docstring.

## Files changed this session

**Changed:**

- `css/star-bg.css` — the `.star-bolt` layer and its snare rule; `--star-bolt-bright` and `--snare-bolt` declared; the reduced\-motion rule extended. `--star-build` 15 → **17**.
- `css/spine-bg.css` — the `--snare` envelope and its three listening controls, with the offline measurements in the comments; `--spine-on` and its consumption notes; `html.page-home` gets its first value; the stale line\-3 header fixed. `--spine-build` 32 → **35**.
- `js/spine-bg.js` — `.star-bolt` injection; the snare side chains (3× highpass \+ body bandpass, two analysers, both observing only); three more state machines in the frame loop with the pending hold; `--snare` written under its own change guard; tuner FIELDS 34 → **40**, snare group, `on` toggle, minimize button, meter extended, paste regex widened to `snare`.
- `index.html`, `about.html` — **unchanged.** The whole session landed in two stylesheets and one script.

**New:** `scripts/snare-tuning.py` — the offline proof harness. Run it from the repo root before touching any detector constant.

**Delivered outside the repo:** the `kundalini-session-start` skill, to the owner's Claude account.

## Still open

- **The owner may retune the snare by ear** — settings shipped as measured, owner said "pretty good, I can adjust a little." The sliders and the second meter bar exist for exactly this.
- **The lightning asset covers \~70% of the nebula** (14 §3). Unchanged; the outer wing still wants a v2 pass.
- **DNS for `kundalinispines.com`** — unchanged, still the single blocker on anything being reachable. Enable sequence in HANDOFF 5.
- **The mobile overrides are stale, three inverted** (14), and the snare/lightning/spine\-toggle work adds three more variables with no phone review. Largest technical item.
- **The ≤600px cascade fix is still unverified at a real narrow viewport** (14).
- **Three of five pages are still flat black** — `archive.html`, `transmissions.html`, `music.html` (a redirect).
- **`--kick-decay` is one envelope for the kick's three consumers.** The snare having its own decay resolves the lightning's share of this item, not the rest.
- **`TIPS` drift from 14 stands unchanged** — the drifted tips listed there were deliberately left; they are still actively misleading.
- **Buttondown deliverability unverified; `explicit` null on all 28 tracks; streaming links null; `data/releases.json` placeholder; TikTok/Spotify links dead by decision; the 885 MB masters folder still backed up by nothing; 27 unreferenced cover files** — all unchanged.

**Closed since HANDOFF 14:**

- **"THE LIGHTNING LAYER IS NOT WIRED IN."** Wired, verified, then rewired to the snare — the design the owner actually wanted.
- **"The snare detector is measured but not built."** Proven against all 28 samples and built; the proof harness is in `scripts/`.
- **The spine on the home page** — off by owner's decision, behind a real toggle.
- **`css/spine-bg.css` line 3's stale header.**
- **The tuner panel occupying the sky while judging the sky** — the minimize chip.

## The closing line, again

HANDOFF 5 and 6 ended on *measure it, do not eyeball it*. 7 added *know what your instrument cannot see*. 8 added *when a number refuses to move, ask what it is actually measuring*. 9 added *take the baseline*. 10 added *check that it measures the thing you care about*. 11 added *check the machine*. 12 added *check the exception too*. 13 added *know where every control's ceiling is*. 14 added *check where the value lives, not just what it is*.

This session added one about words. HANDOFF 13 said "both bands rising together," and the obvious reading of that sentence — a frame delta — parses, compiles, runs, and fires 26 times per 20 seconds on hats. The correct gate was a coincidence of onsets, which is what 13's experiment almost certainly did and its prose never said. The only thing that caught the difference was re\-running the numbers before writing the browser code.

> Measure it. Know what your instrument cannot see. When a number refuses to move, ask what it is actually measuring. Take the baseline. Check that it measures the thing you care about. Check the machine. Check the exception too. Know where every control's ceiling is. Check where the value lives, not just what it is. And when a handoff hands you a design in prose, re\-derive it from the measurement before you build it — a sentence can describe two different mechanisms, and the wrong one also runs.
