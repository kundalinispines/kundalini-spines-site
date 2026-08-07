# Kundalini Spines — Session Handoff 17

**Date:** August 7, 2026

**Supersedes:** nothing wholesale. `HANDOFF 3`–`6` still own their material. `7` owns the spine layer's architecture. `8` owns the glow band and the 4K regeneration. `9` owns the four\-band star field. `10` owns the kick\-reactive rebuild and the biquad detector. `11` owns the WARP correction. `12` owns the mirror tile and the cloud mask. `13` owns the nebula/kick rewiring. `14` owns the page\-scoping architecture and pattern a. `15` owns the snare detector, `--spine-on`, and the tuner minimize button. `16` owns the generated\-candidate containment story (patterns b/c) — that story is untouched; this session added a second, parallel path beside it.

**What this document does:** it closes HANDOFF 16's "next session" task. The three reference frames became three shipped strike patterns — **d, e, f** — and the discovery that forced a new extraction path is recorded so nobody re\-walks its dead ends. The owner approved the result on his hardware in this session ("it's beautiful — perfect").

* * *

## The one\-line version

**Five strike patterns rotate.** `.star-bolt` is now five divs — `--a`, `--c` (unchanged), and `--d/--e/--f` extracted directly from `reference/nebula-with-lightning-target-2/3/4.png` by a new **reference\-frame mode** in `scripts/bolt-extract.py`. The snare machine picks the next pattern at random among the other four — never the same twice in a row, the owner's rule, whose two\-pattern reduction was the strict alternation of build 19. `--star-build` is **20**. `--spine-build` is unchanged at **35**; `css/spine-bg.css` was not touched. **No new CSS variables** — the patterns share `s bolt` and `bolt b`, same as before, on purpose.

## Corrections to earlier handoffs — read first

**1\. HANDOFF 16's "HANDOFF 14's registration applies to them directly" is wrong in the way that matters.** The v1 constants (scale 0.60650, offset (28, 326)) do land each frame within \~10px — but the frames are **re\-renders of the scene, not crops of our sky**. Measured before anything was built: the original target matches the sky at star scale (fine\-band NCC 0.63); the three new frames match at cloud\-mass scale only (fine NCC −0.03, \+0.09, 0.00 at their best per\-frame warps). They carry their own stars and their own cloud texture. Registration alone does not make v1's exact\-subtraction recipe apply — see the dead ends below.

**2\. HANDOFF 16's open question — patterns vs intensity states — is settled.** The owner's call: each frame is its own pattern, built "the way v1 was" from the reference itself. d \= the sparse left\-core crackle (frame \-2), e \= the heaviest full\-band state (frame \-3), f \= the upper\-right arm emphasis (frame \-4).

**3\. HANDOFF 16's "a future third pattern takes d" is consumed.** d/e/f are now taken; the next new pattern takes **g**. b remains retired.

## The reference\-frame path — why it exists, and the dead ends

`scripts/bolt-extract.py` now has two modes, dispatched on candidate size: 3840×2144 (or near) runs the generated\-candidate path exactly as HANDOFF 16 left it; **1948×807 runs `main_ref()`**, the reference\-frame path. Its header comment carries the full story; the short version, so the dead ends are not retried:

- **v1's recipe verbatim (subtract the fitted sky, hue/size gates) keeps the render difference, not the lightning.** The delta reads as a brighter copy of the clouds: warm star residuals everywhere plus broad cold texture mismatch no hue gate can separate from glow.
- **A linear delta asset reads at roughly half strength under the layer's screen blend.** Screen is sub\-additive over a lit background. v1 never hit this because its painted bolts saturate over dark lanes (asset peak 255); the frames' veins sit on bright cloud. The asset must be the **screen\-inverse**, `q = 255·(ref−fit)/(255−fit)`, which reproduces the reference at opacity 1 by construction. Probed numerically: at the 200 brightest vein pixels, screen(fit, q) equals the reference exactly.
- **Vein\-seeded keeps with a wide halo (σ24) read as cloud brightening, not lightning** — near dense vein fields the halo union covers whole cloud patches, and hard hue\-gate boundaries posterize. What ships is the **vein network only**\: `q − localMedian(q, 31px)`, which kills every broad field (grade mismatch AND the reference's own cloud illumination — the sky's own clouds light through the screen blend at composite time, so broad illumination comes free), plus a synthesized discharge halo (0.9·gauss σ5 \+ 0.5·gauss σ14), everything recolored to the filament cold (0.72/0.82/1.0).
- **Containment is 25→60 γ1 in this mode, not 45→85 γ²** — a stated decision, in the script header. The shipped ramp corrals generator\-invented geometry; these frames' geometry is the owner's own reference, so the ramp's only job is killing subtraction noise on dark sky. 45→85 γ² measured against the frames crushes exactly what they add (frame \-2's crackle fell to 0.22% of frame lit, near\-invisible).
- **Gain is normalized after the 4K warp** (vein\-core p99.7 → 245): the 1.65× upscale spreads 1–2px vein cores and eats \~20% of their peak, so normalizing before the warp ships dim cores no matter what.
- **Registration per frame:** v1 constants \+ ECC affine refinement on mid\-band luminance (cc 0.90 / 0.91 / 0.89; the affine terms are \~1% scale and subpixel shear — real frame drift, not noise). The script prints the cc and says to stop and look below 0.8.

**Measured, the shipped assets (decoded from the WebPs, not the arrays):** `d` 98.45% black, 1.34% lit, peak 248, 28 KB (4K) \+ 10 KB. `e` 97.82% black, 1.89% lit, peak 255, 32 \+ 12 KB. `f` 97.09% black, 2.56% lit, peak 255, 40 \+ 15 KB. Min nonzero 1 per channel — no `--star-black` treatment needed. All 3840×2144, same rule as ever: halve or double, never resize to anything else.

## Verified this session (cloud Chromium, CSSOM \+ canvas readback \+ real audio)

Build 20 computed on both pages; five divs, correct backgrounds, exactly one `.is-struck`; only the struck div's opacity follows `--snare` (0.8 forced test: struck 0.8, others 0); canvas readback decoded all three new 4K assets pixel\-perfect (lit\>8: 1.12 / 1.64 / 2.24% at half size, peaks 248/248/255); 20s of `may-26th-sample.mp3` through the live graph gave **11 strikes, sequence `eacaecdcead`, zero immediate repeats**, peak `--snare` 0.94; pause cleared the envelope, the class, and left all five divs at 0; reduced\-motion holds all five at 0 under forced class \+ snare; about.html injects all five, inert, no page errors. **The composite's pixels were not verified from the container** (the HANDOFF 16 blind spot stands) — **the owner watched strikes on his hardware and approved.** His eye is the record.

## Do not do these

- **Do not run a reference frame through the generated\-candidate path or vice versa.** The dispatch is on image size; if a future reference frame arrives at a different size, extend the dispatch, don't force a path.
- **Do not tighten the reference\-mode ramp to 45→85 γ² for symmetry.** The asymmetry is measured (the story above). If a pattern leaks on real hardware, tighten the reference mode's ramp and rebuild — and leave the generated path's alone.
- **Do not move the gain normalization back before the 4K warp** — thin\-core peak loss, measured at \~20%.
- **Do not "even out" pattern d's sparseness.** The states differ in coverage because the owner's frames differ; d is sparse because its reference is sparse.
- **Do not reuse slot letter b. The next pattern letter is g.**
- Everything in HANDOFF 7–16's lists still stands: never wire the lightning to `--kick`, never remove the 45ms pending hold, per\-pattern brightness sliders stay forbidden, container screenshots stay untrusted for bolt layers.

## What is deliberate, so nobody "fixes" it

- **Two ramps in one script** (45→85 γ² generated / 25→60 γ1 reference) — see above.
- **a and c stay in the rotation** alongside d/e/f. Five patterns, one shared brightness, one shared strike amount.
- **The rotation is random\-no\-repeat again** — build 19's strict alternation was the two\-pattern reduction of this same rule, not a different design. The injection comment records the lineage.
- **The `?tune` meter's `bolt` letter** still names the pattern the next strike lights; it now walks five letters.
- **No new CSS variables, no tuner changes** — FIELDS/TIPS/GROUPS untouched this session.

## Files changed this session

**Changed:** `css/star-bg.css` (three new pattern rules, five\-pattern comment block, build history; `--star-build` 19 → **20**), `js/spine-bg.js` (five\-variant injection, random\-no\-repeat advance, comment updates), `scripts/bolt-extract.py` (the reference\-frame mode, `main_ref()`, with the dead\-end story in its header).

**New:** `assets/hero/nebula-lightning-d-4k.webp` \+ `-d.webp`, `-e-4k.webp` \+ `-e.webp`, `-f-4k.webp` \+ `-f.webp`.

**Unchanged:** `css/spine-bg.css`, both HTML pages, both detectors, all tuner FIELDS, all data files. **Zero Higgsfield credits spent** (balance \~685) — no generation was needed; the references themselves were the source, which is what the owner asked for.

**Git state at handoff time:** all nine files delivered to the desktop via the bridge. A commit also exists in the cloud clone (`ec903de`) but could not be pushed from the session (repo not in the session's authorized set — pushes go through the owner). **The desktop copy is the source of truth for the push**; the wrap\-up flow in this session covers it.

**Still awaiting manual deletion on the desktop** (HANDOFF 16's leftovers; the bridge cannot delete): `assets/hero/nebula-lightning-b-4k.webp`, `nebula-lightning-b.webp`, and the four `_hf-*.png` round\-trip files.

## Still open

- **DNS for `kundalinispines.com`** — unchanged, still the single blocker on anything being reachable. Enable sequence in HANDOFF 5.
- **The mobile overrides are stale, three inverted** (14) — unchanged, still the largest technical item. No new variables this session, so the debt did not grow.
- **The ≤600px cascade fix is still unverified at a real narrow viewport** (14).
- **Three of five pages are still flat black** — `archive.html`, `transmissions.html`, `music.html` (a redirect).
- **`--kick-decay` is one envelope for the kick's three consumers** (15) — unchanged.
- **`TIPS` drift from 14 stands unchanged** — still deliberately left, still actively misleading.
- **Buttondown deliverability unverified; `explicit` null on all 28 tracks; streaming links null; `data/releases.json` placeholder; TikTok/Spotify links dead by decision; the 885 MB masters folder still backed up by nothing; 27 unreferenced cover files** — all unchanged.

**Closed since HANDOFF 16:**

- **"The alternate\-striking references — the next session's task"** — done. Three patterns shipped from them, approved by the owner's eye on hardware.
- **"A replacement diagonal pattern (letter d) is optional"** — the letter d is now the left\-core crackle. If a diagonal variant is ever wanted, it is pattern **g**, and the generated\-candidate path is the machine for it (a diagonal is invented geometry, so the 45→85 γ² ramp is the right one).

## The closing line, again

The series so far: *measure it* (5, 6) · *know what your instrument cannot see* (7) · *ask what the number actually measures* (8) · *take the baseline* (9) · *check it measures the thing you care about* (10) · *check the machine* (11) · *check the exception* (12) · *know every control's ceiling* (13) · *check where the value lives* (14) · *re\-derive the design from the measurement* (15) · *calibrate against the reference, not a proxy* (16).

This session's addition is the reason it went in one pass where 16 needed four containment rounds. The three frames looked exactly like the original target — same scene, same size, same framing — and the previous handoff assumed the same machine would apply. One cheap measurement up front (band\-split NCC against the sky) showed they were different **kinds** of input: re\-renders, not crops. Every design decision that followed — screen\-inverse, median isolation, the gentler ramp — fell out of that one fact, and the dead ends that were hit were hit in offline composites, not in rounds on the owner's hardware.

> Before reusing a machine, measure whether the new input is the same kind of thing the machine was built for. Inputs that look identical can differ in exactly the property the machine depends on — and one measurement up front is cheaper than every wrong build it prevents.
