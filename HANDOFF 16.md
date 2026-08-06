# Kundalini Spines — Session Handoff 16

**Date:** August 6, 2026

**Supersedes:** nothing wholesale. `HANDOFF 3`–`6` still own their material. `7` still owns the spine layer's architecture. `8` owns the glow band and the 4K regeneration. `9` owns the four\-band star field. `10` owns the kick\-reactive rebuild and the biquad detector. `11` owns the WARP correction. `12` owns the mirror tile and the cloud mask. `13` owns the nebula/kick rewiring. `14` owns the lightning asset and the page\-scoping architecture. `15` owns the snare detector, `--spine-on`, and the tuner minimize button.

**What this document does:** it gives the lightning a second strike pattern — the first filaments in the nebula's outer wing — alternating with the HANDOFF 14 original on each snare, and records the four containment rounds it took to make a generated pattern *look like it belongs*, each round with the metric that sounded rigorous and measured the wrong thing. A third pattern was built, tuned, and removed by the owner's eye in the same session. The machine that builds patterns is now a repo script; the next session's task and its reference images are already in `reference/`.

* * *

## The one\-line version

**The lightning alternates between two patterns.** `.star-bolt` is now two divs — `--a` (the HANDOFF 14 asset) and `--c` (a burst inside the outer wing's white cloud) — and the snare machine moves `.is-struck` between them on each accepted strike. `--star-build` is **19**. `--spine-build` is unchanged at **35**; `css/spine-bg.css` was not touched this session. No new CSS variables exist: the patterns share `s bolt` and `bolt b` on purpose, and the `?tune` meter now shows which pattern is lit (`bolt a` / `bolt c`).

## Corrections to earlier handoffs — read first

**1\. HANDOFF 14's "KNOWN GAP: the outer wing has no filaments" is half\-closed.** Pattern c puts the first filaments in the upper\-right arm. *Half*, because they live only in the arm's bright white mass (see the containment story below) — the faintest cloud still has none, and that is now a decision, not a gap.

**2\. HANDOFF 15's wiring prose is superseded in one detail.** The strike rule is no longer `:root.is-spine-kicking .star-bolt` — it is `:root.is-spine-kicking .star-bolt.is-struck`, and only the div carrying `.is-struck` lights. Everything else 15 says about the layer (idle 0, snare channel only, scoped\-class reasoning, reduced\-motion coverage) still holds, and holds for **both** divs, because they share the `.star-bolt` class — that sharing is load\-bearing (STAR\_LAYERS, the view modes, and the reduced\-motion rule all address the lightning by class).

**3\. There is no pattern b, and the letter is retired.** A second diagonal pattern shipped mid\-session as build 18, was re\-contained three times against the owner's reference, and was removed by his eye ("it just doesn't look right"). A future third pattern takes **d**. If you find `nebula-lightning-b-*.webp` on the desktop, they are orphans awaiting manual deletion — they are already gone from git.

## The containment story — read before building any pattern

`scripts/bolt-extract.py` is the machine that turns a "sky \+ painted filaments" candidate into a shipped asset (it recreates HANDOFF 14's pipeline for v1 and adds what this session learned). Its step comments carry the full story; the short version, so nobody re\-tries the dead ends:

- **The hue gate is size\-aware now.** The wing candidate painted its primary bolt core warm cream; the v1\-era "delete warm pixels" rule (right for star residuals) deleted the core and the survivor halo read as lightning with a black crack down the middle. Three "hollow\-core fill" heuristics were built for what a stage\-by\-stage probe finally showed was never a hollow core. The fix: warm *specks* die as star residuals, warm pixels in *bolt\-sized structures* (bbox diag ≥ 25px) are painted core — kept at their luminance, recolored to the filament cold (0.72/0.82/1.0).
- **Containment is the visible glow, not the mask.** `cloud-mask.webp`'s alpha is a broad band (\~0.84 well past the bright clouds); filaments over mask\-covered\-but\-faint sky read as lightning *outside* the clouds on real hardware. The shipped weight is blurred sky luminance (σ30) through a squared ramp **45→85**.
- **Two calibration metrics failed before the eye settled it, and both are recorded so they are not retried.** (1) "v1 retains 0.994 of its energy" — v1 kept its energy because it was *already* in the bright clouds; b/c kept riding the dim top edge. (2) "match v1's filament\-weighted glow distribution" (72.9 mean / 59.1 p25) — matched exactly, still read wrong, because the metric is blind to *geometry*\: one unbroken 2000px run through mid\-brightness cloud is not the same thing as short bursts dying inside the white cores, whatever its statistics. Contrast was also measured and is **not** the difference (b/c sat *softer* against their cloud than v1: delta/glow p50 0.28–0.33 vs 0.68). What finally matched the owner's reference: live strictly in the white cloud mass, 45→85 γ², keeping \~0.31/0.27 of the raw candidates, plus a post\-weight orphan cleanup (drop components \< 25px bbox diag or peaking \< 20).

**Measured, the shipped assets:** `a` 96.72% exact black, 3.14% of frame lit (unchanged since 14). `c` 97.94% black, 2.06% lit, floor 0.000/0.000/0.000, 25 KB (4K) \+ 8 KB (half). Both are the same 3840×2144 as the sky — halve or double, never resize to anything else.

## What else was learned, so it is not re\-derived

- **This cloud container's Chromium cannot composite the `.star-bolt` layers at all** — not headless, not headed under Xvfb, not even v1, which is proven on the owner's hardware. The sky pseudo\-layers paint (twinkle diffs prove it); the fixed z:\-1 real elements' background images never reach the screenshot. HANDOFF 7's line got a second, literal act: know what your instrument cannot see. The verification set that works from the cloud: **CSSOM computed values, canvas readback** (all three assets decoded pixel\-perfect; `a` measured 2.60% lit — HANDOFF 15's own figure), **real\-audio end\-to\-end** (an `Audio` element via `ks:sample-ready`, exactly as 15 did), and the offline screen\-blend composites. Pixel deltas of the live composite must be measured on real hardware.
- **The Higgsfield CDN is unreachable from the cloud session in both directions** — same as the desktop finding in `.gitignore`, so the `_hf-*.png` browser round trip through the owner is still the only way to get generation results into the pipeline. `media_import_url` *does* work with GitHub raw URLs of this public repo, which is how the sky reached the generator. Cost this session: 28 credits (7 × nano\-banana\-pro 4K), balance \~691.
- **Alternation vs random:** with two patterns, the owner's "never the same twice in a row" *is* strict alternation — the code advances `(boltAt + 1) % bolts.length` and the injection comment says why that is the three\-pattern rule's reduction, not a redesign.

## Verified this session (real audio through the live graph, cloud Chromium)

Build 19 computed on both pages; two divs, correct backgrounds, exactly one `.is-struck`; only the struck div's opacity follows `--snare` (0.8/0/0 forced test); 20s of `may-26th-sample.mp3` gave 9 strikes alternating `101010101`, zero repeats; pause cleared `--snare`, the class, and left both divs at 0; about.html injects both divs, inert at opacity 0, no page errors. **Not verified anywhere: the composite's pixels** (see the container blind spot above) — the owner watched the strikes on real hardware through the four containment rounds, and his eye is the record.

## Do not do these

- **Do not re\-derive the containment through an energy or distribution metric.** Both are measured failures (the story above). The ramp is 45→85 γ² and the calibration instrument is the owner's eye against `reference/nebula-with-lightning-target.png`.
- **Do not reuse the slot letter b.** A future pattern is d. The letter is retired in the CSS comment and here.
- **Do not "unify" the two bolt divs or give patterns separate brightness/amount sliders.** They share `--snare-bolt` and `--star-bolt-bright` deliberately — per\-pattern knobs would be two sliders doing one job, and the tuner's culture is that a slider that does nothing distinct reads as broken.
- **Do not trust this container's screenshots for anything on the bolt layers.** Canvas readback and CSSOM are the instruments here; pixels are measured on the owner's hardware.
- **Do not resize the lightning assets to anything but half or double** (the `cover` alignment rule, HANDOFF 14).
- Everything in HANDOFF 7–15's lists still stands, including: never wire the lightning to `--kick`, never read "rising" as a frame delta, never remove the 45ms pending hold, never put opacity on `.spine-bg` itself.

## What is deliberate, so nobody "fixes" it

- **Pattern c is dimmer and smaller than its first cut** (2.06% of frame vs 10.59%). Three containment rounds *removed* light on purpose; if strikes read faint on hardware, the lever is `bolt b` (static brightness), not a looser ramp.
- **Two patterns alternate deterministically.** Not a downgrade from random — the two\-pattern reduction of the owner's no\-repeat rule.
- **`html.page-home` still carries exactly one value** (`--spine-on: 0`); this session added nothing to any page block and no mobile overrides — the mobile rot (14 §3) is unchanged and still the largest technical item.
- **The `?tune` meter's `bolt` letter names the pattern the NEXT strike lights** — it advances at strike acceptance, so mid\-flash it names the lit one.
- **`scripts/bolt-extract.py` prints its full measurement block on every run.** Run it from the repo root; compare against the numbers above before shipping any new asset.

## Files changed this session

**Changed:** `css/star-bg.css` (two pattern divs' rules, `.is-struck` gating, retired\-letter note; `--star-build` 17 → **19**), `js/spine-bg.js` (two\-div injection, alternation in the snare accept path, `bolt` meter field; FIELDS unchanged at 40).

**New:** `scripts/bolt-extract.py` (the pattern\-building machine — the longest comments in the repo are its step 4 and 6b, on purpose); `assets/hero/nebula-lightning-c-4k.webp` \+ `nebula-lightning-c.webp`; `reference/nebula-with-lightning-target-2.png`, `-3.png`, `-4.png` (see Next session).

**Unchanged:** `css/spine-bg.css`, `index.html`, `about.html`, both detectors, all tuner FIELDS.

**Awaiting manual deletion on the desktop** (the bridge cannot delete): `assets/hero/nebula-lightning-b-4k.webp`, `nebula-lightning-b.webp`, and the four `_hf-*.png` round\-trip files (gitignored).

## Next session: alternate striking, and its references are already in the repo

The owner supplied three new frames of the original target scene — **`reference/nebula-with-lightning-target-2/3/4.png`**, exactly 1948×807 like the original, so **HANDOFF 14's registration (scale 0.60650, offset (28, 326)) applies to them directly**. They show the same nebula with *different* lightning states: `-2` sparse crackle around the left core, `-3` the heaviest — veins threading the whole band at full intensity, `-4` a middle state emphasizing the upper\-right arm. The owner wants the strikes' variety to move toward these. Open questions for that session to settle with him before building: whether these become additional patterns (letters d, e, f) through `scripts/bolt-extract.py` — the same registration, subtraction, and containment machinery should apply — or whether some become intensity *states* of existing patterns. The extraction script and its recorded lessons are the starting point; prove any new pattern's look against these references, not against a computed proxy.

## Still open

- **The alternate\-striking references above** — the next session's task.
- **A replacement diagonal pattern (letter d) is optional** — the owner removed b but liked the idea of variety; the three new references may supply it.
- **DNS for `kundalinispines.com`** — unchanged, still the single blocker on anything being reachable. Enable sequence in HANDOFF 5.
- **The mobile overrides are stale, three inverted** (14) — unchanged again, still the largest technical item. This session added no new variables, so the debt did not grow.
- **The ≤600px cascade fix is still unverified at a real narrow viewport** (14).
- **Three of five pages are still flat black** — `archive.html`, `transmissions.html`, `music.html` (a redirect).
- **`--kick-decay` is one envelope for the kick's three consumers** (15) — unchanged.
- **`TIPS` drift from 14 stands unchanged** — still deliberately left, still actively misleading.
- **Buttondown deliverability unverified; `explicit` null on all 28 tracks; streaming links null; `data/releases.json` placeholder; TikTok/Spotify links dead by decision; the 885 MB masters folder still backed up by nothing; 27 unreferenced cover files** — all unchanged.

**Closed since HANDOFF 15:**

- **"The lightning asset covers \~70% of the nebula; the outer wing still wants a v2 pass"** — half\-closed by pattern c, and the remaining faint\-cloud emptiness is now a decision (the containment ramp), not an omission.
- **"Every strike would be identical, which 2–3 variants fixes"** (HANDOFF 13's line) — fixed: two patterns alternate; more are a solved problem now that the pipeline is a script.

## The closing line, again

HANDOFF 5 and 6 ended on *measure it, do not eyeball it*. 7 added *know what your instrument cannot see*. 8 added *when a number refuses to move, ask what it is actually measuring*. 9 added *take the baseline*. 10 added *check that it measures the thing you care about*. 11 added *check the machine*. 12 added *check the exception too*. 13 added *know where every control's ceiling is*. 14 added *check where the value lives, not just what it is*. 15 added *re\-derive a design from the measurement before you build it*.

This session added the counterweight to the whole series. Two calibration metrics were built, both rigorous, both computed correctly — energy retention, then distribution matching — and both measured the wrong thing, because "looks like it belongs in the clouds" is a property of geometry and reference, not of any statistic that was cheap to compute. The owner's eye rejected each round in seconds, and each rejection was then *confirmed* by measurement after the fact. The numbers are still the instrument of record for everything they can see. For what they cannot:

> Measure it — and when the thing you are matching is a look, calibrate against the reference, not against a proxy that is easy to compute. The eye finds in seconds what the metric cannot see at all; then measure *why* the eye was right, and write that down instead.
