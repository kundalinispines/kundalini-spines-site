/* ==========================================================================
   SPINE COIL — the twin serpents, extracted.

   WHAT THIS IS
   Two strands half a turn apart winding around a lit central channel, with a
   beam thrown up the column ahead of the wavefront. Ida and pingala around
   sushumna. It was born inside hero-scrub-lab.html as a scroll-linked cue
   hugging assets/hero/spine-aster.svg. That artwork is retired; this module
   re-hosts the coil onto assets/hero/spine-ui-wire.png and turns it into a
   ONE-SHOT: it runs once up the column when triggered and then stops. There is
   no scroll input and no --scan-live motion gate any more.

   HOW TO USE IT
     var coil = SpineCoil.create({
       back:  document.getElementById('coilBack'),   // canvas BEFORE the spine
       front: document.getElementById('coilFront'),  // canvas AFTER  the spine
       config: SpineCoil.readCssVars(document.documentElement)
     });
     coil.run();            // one shot, base to crown, then fades and clears
     coil.seek(0.62);       // park a single frame (tests, screenshots)
     coil.setConfig({ turns: 6 });
     coil.metrics();        // { maxExtent, minRatio, ... } — see below

   THE CANVAS PAIR IS NOT OPTIONAL AND ITS ORDER IS LOAD-BEARING.
   The back canvas must sit BEFORE the spine in the markup and the front canvas
   AFTER it. Each strand is walked once and split by depth: the half of the ring
   facing away from the viewer goes to the back canvas and passes behind the
   column, the near half goes to the front and passes in front of it. That split
   IS the illusion of winding around rather than lying on. One canvas cannot do
   it. Nor can SVG without a path per segment, and there are hundreds a frame,
   each carrying its own width, colour and glow.

   Both canvases must also carry `width: 100%; height: 100%` in CSS. A canvas is
   a replaced element, so `position:absolute; inset:0` with auto width resolves
   to the INTRINSIC 300x150 (the content attributes), not to the containing
   block the way a div would. This module sizes the backing store from the
   measured box, so without those two declarations the element feeds its own
   measurement back into itself and the height runs away — measured at 300x754
   against an artwork box of 345.6x619.2 before the rule existed.

   CSS VARIABLES ARE READ AT INIT AND ON INPUT, NEVER PER FRAME.
   getComputedStyle() forces style resolution; doing it inside the draw loop
   costs a layout flush every frame for values that change when a human moves a
   slider. readCssVars() is a separate call the caller makes when it knows
   something changed.
   ========================================================================== */

;(function (global) {
  'use strict';

  var TAU = Math.PI * 2;

  /* ---------------------------------------------------------------- geometry

     MEASURED, NOT GUESSED. assets/hero/spine-ui-wire.png, Pillow, alpha channel
     at threshold 24, 2026-08-10. The file is 1200x2150.

         art bounding box    x 424..774,  y 80..2069   ->  351 x 1990
         centre x            599.20, sd 0.82 over all 1990 drawn rows
         widest halfwidth    174.5 at y = 1729 (the sacral ala)
         mid-column waists   69.8 .. 132.8
         biggest one-row jump 31.6 units at y = 1486

     Finding 1: THE COLUMN IS DRAWN DEAD STRAIGHT. sd 0.82 on the centre over
     1990 rows. CX is therefore a constant and there is no centre curve to
     follow. (The aster measured 600.44 sd 0.72 — the same finding, twice, on
     two different drawings. Do not go looking for an S-curve.)

     Finding 2: THE RAW WIDTH PROFILE HAS ONE-ROW CLIFFS, where a process's
     near-horizontal top edge enters the scanline: 98.5 -> 131.0 between two
     adjacent rows at y=1486. A coil interpolating raw per-row widths visibly
     jerks there. PROFILE below is therefore a smoothed UPPER ENVELOPE, not the
     raw profile — see the derivation on it.

     CORRECTION TO V2HANDOFF 21, which records the wire as "22% wider than the
     aster, aspect 0.212 vs 0.174", from a bounding box of x 381..820, y 34..2107.
     That measured the GLOW HALO, not the drawn bone — it was taken at a
     near-zero alpha cut. At a real threshold the two artworks are nearly the
     same size (aster 345x1988, wire 351x1990) and their sacral peaks agree
     within 2 units. The 22% figure and everything derived from it, including
     the 0.95919 height-match factor, are wrong. Do not reuse them.

     The genuine difference between the two drawings is the WAISTS: the aster
     narrowed to 55-57 between vertebrae, the wire never goes below about 70 and
     mostly sits 78-103. The aster's profile driven onto the wire would cut the
     coil INTO the vertebrae through the whole mid-column. That, not size, is
     why this array had to be re-derived. */
  var VB_W = 1200, VB_H = 2150;
  var CX = 599.2, Y_TOP = 80, Y_BOT = 2069;

  /* PROFILE — halfwidth of the wire artwork in viewBox units, 40 samples evenly
     spaced from y=80 to y=2069 (step 51.0). DERIVATION, so it can be redone:

       1. per row, halfwidth = max(CX - firstOpaqueX, lastOpaqueX - CX)
       2. per sample, take the MAX halfwidth within +/-26 rows of it. At step
          51 those windows tile the column exactly, so no drawn row is missed.
       3. running max over each sample and its two immediate neighbours. This is
          what turns a one-row cliff into a ramp 51 units long instead of 1.
       4. a 1-2-1 smoothing pass, then clamp each sample back up to its own
          step-2 window max. The clamp is what keeps it an UPPER envelope: the
          smoothing rounds the shoulders of the plateaus step 3 created without
          ever letting the curve sink into the silhouette.

     VERIFIED: linearly interpolating this array and comparing against all 1990
     drawn rows, the worst the envelope ever sits below the true silhouette is
     0.48 units, at y=1501 — a mid-segment sag between two samples. CLEARANCE
     (cfg.clear, default 14) is added on top of this everywhere, so the coil
     still clears the bone by 13.5 units at that single worst row and by 14
     everywhere else.

     Landmarks: the peak 175.2 is the sacral ala, the widest thing in the
     drawing; 133.8 at the very top is the cervical cap, which is the SECOND
     widest peak — the cervical region is not the narrow part; the true minimum
     is 82.6 at y=1100, in the lumbar waist. */
  var PROFILE = [
    133.8, 133.8, 125.0, 108.4, 104.1, 113.6, 122.6, 125.8, 122.5, 115.8,
    110.8, 107.0, 103.8, 102.8, 102.3, 101.3, 100.3,  97.3,  92.8,  88.0,
     82.6,  89.5, 108.9, 120.8, 126.0, 131.0, 136.3, 143.3, 146.8, 151.1,
    162.6, 172.5, 175.2, 175.0, 172.6, 162.8, 143.0, 117.6,  87.5,  61.3
  ];
  var P_STEP = (Y_BOT - Y_TOP) / (PROFILE.length - 1);

  /* THE VIRTUAL EYE SITS ABOVE THE CROWN. Do not move it to mid-screen.
     With a mid-screen eye the ellipse's minor axis passes through ZERO exactly
     as the wavefront crosses centre, and the ring degenerates into a flat
     horizontal line — the very shape the serpents were built to replace,
     arriving at the worst possible moment. From above, every ring is seen from
     above, stays open the whole way up, and the foreshortening tightens as the
     coil climbs, which reads as the energy gathering.
     RATIO_MIN is a hard floor on minor/major, set at the measured safe minimum.
     At EYE_Y = Y_TOP - 420 the formula lands on 0.2123 at the crown anyway; the
     floor is there so that clamping the wavefront slightly above the crown (or
     retuning EYE_Y) cannot silently walk it down toward the flat line. */
  var EYE_Y = Y_TOP - 420;
  var RATIO_A = 0.16, RATIO_B = 0.30, RATIO_MIN = 0.212;

  var REST_R = 96;   /* halfwidth used at hug 0 — a constant-radius cylinder */

  var DEFAULTS = {
    /* Amber is quoted verbatim from the navigator's --node-color in
       spine-lab.html so the two systems speak the same language. Do not drift
       it. */
    color:  '240, 165, 92',
    /* The SECOND strand's tone at split 1. A visual pass found that "the two
       strands are not distinguishable from each other", which is fatal for a
       twin-serpent read — two identical helices half a turn apart look like one
       coil at double frequency. They are separated here by TONE and WEIGHT
       rather than by hue: strand B leans toward pale gold, strand A stays the
       amber above. A cool lunar tint for ida (the traditional pairing) was
       considered and left out of the default because it introduces a hue the
       palette does not otherwise carry — set --coil-color-b if you want it. */
    colorB: '255, 236, 208',
    core:   '255, 250, 244',
    split:  0.58,    /* 0 = the two strands identical, 1 = full separation */

    turns:  2.0,     /* per strand, base to crown. Twin wants fewer than one.
                        Tuned 2026-08-11, down from 3.5: at 3.5 the two strands
                        read as one coil at double frequency. */
    beam:   0.28,    /* strength of the lit channel and the reach above it.
                        Tuned 2026-08-11, up from 0.10. */
    hug:    1,       /* 1 = follow the measured envelope, 0 = constant radius */
    clear:  9,       /* viewBox units of air between silhouette and coil */
    far:    0.64,    /* multiplier on the far half's presence — see below */

    /* HOW WIDE THE FRONT/BACK CROSSOVER IS BLENDED, in sin(theta) units.
       0 restores the original hard split. See the block above drawRun. */
    blend:  0.90,    /* tuned 2026-08-11, up from 0.60 */

    samples:   280,  /* points per strand per canvas */
    buckets:   12,   /* recency quantisation; see the note on drawRun */
    tailTurns: 0.18, /* fraction of one turn over which the head tapers away */

    /* THE GESTURE IS durationMs + holdMs + fadeMs, and only the first was ever
       reachable. Asked to shorten the run below the old 900ms slider floor, the
       floor that actually bites is the 1040ms of tail these two carry: at
       durationMs 150 the travel is 13% of what you see and the other 87% is a
       coil sitting still and then dissolving. Both are now CSS variables and
       both are on the HUD. */
    durationMs: 3060,  /* base to crown. Tuned 2026-08-11, up from 2300. */
    holdMs:        0,  /* full coil, motionless, before it lets go */
    fadeMs:      200,  /* dissolve. Tuned 2026-08-11, down from 620 — with the
                          longer travel the gesture is now 3060 + 0 + 200, so
                          the tail is 6% of it rather than the 21% it was. */
    inFrac:     0.06 /* fraction of the run spent fading the coil in */
  };

  /* CSS variable names, in the order the caller usually wants them. */
  var CSS_VARS = {
    '--coil-color':   'color',
    '--coil-color-b': 'colorB',
    '--coil-core':    'core',
    '--coil-split':   'split',
    '--coil-turns':   'turns',
    '--coil-beam':    'beam',
    '--coil-hug':     'hug',
    '--coil-clear':   'clear',
    '--coil-far':     'far',
    '--coil-blend':   'blend',
    '--coil-ms':      'durationMs',
    '--coil-hold':    'holdMs',
    '--coil-fade':    'fadeMs'
  };

  function rgb(str) {
    var p = String(str).split(',');
    return [parseFloat(p[0]) || 0, parseFloat(p[1]) || 0, parseFloat(p[2]) || 0];
  }
  function mix(a, b, t) {
    return (a[0] + (b[0] - a[0]) * t).toFixed(0) + ',' +
           (a[1] + (b[1] - a[1]) * t).toFixed(0) + ',' +
           (a[2] + (b[2] - a[2]) * t).toFixed(0);
  }
  /* Quantisation levels for the crossover blend. It rides along in the run key
     exactly as recency and taper do, so a blended handoff still costs a handful
     of strokes rather than one per sample. 6 is enough that the cross-fade
     reads as continuous — at the authored blend width that is a step every
     ~0.12 of sin(theta), well under the eye's ability to pick out a boundary in
     a moving beam. */
  var BLEND_STEPS = 6;

  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function smooth(t) { return t * t * (3 - 2 * t); }

  /* Read every coil variable off an element. Colours come back as the raw
     "r, g, b" triplet the stylesheet holds; numbers are parsed, and anything
     absent or unparseable is simply left out so the caller's defaults survive. */
  function readCssVars(el) {
    var cs = getComputedStyle(el || document.documentElement), out = {};
    for (var name in CSS_VARS) {
      if (!CSS_VARS.hasOwnProperty(name)) continue;
      var key = CSS_VARS[name], raw = cs.getPropertyValue(name);
      if (!raw || !raw.trim()) continue;
      raw = raw.trim();
      if (key === 'color' || key === 'colorB' || key === 'core') { out[key] = raw; continue; }
      var v = parseFloat(raw);
      if (isFinite(v)) out[key] = v;
    }
    return out;
  }

  function create(opts) {
    opts = opts || {};
    var cvBack = opts.back, cvFront = opts.front;
    if (!cvBack || !cvFront) throw new Error('SpineCoil.create needs { back, front } canvases');

    var cfg = {}, pal = null, weight = null, alphaF = null;
    for (var k in DEFAULTS) if (DEFAULTS.hasOwnProperty(k)) cfg[k] = DEFAULTS[k];

    /* ------------------------------------------------------------- config */
    function setConfig(next) {
      if (next) for (var k in next) if (next.hasOwnProperty(k) && next[k] != null) cfg[k] = next[k];
      bake();
      return cfg;
    }

    /* Colour strings are built ONCE per config change, not per stroke. Every
       segment's colour is a function of its recency bucket only, so a palette
       of `buckets` entries per strand per depth covers the whole frame. This
       is the difference between ~900 string concatenations a frame and 48. */
    function bake() {
      var B = Math.max(2, cfg.buckets | 0);
      var base = rgb(cfg.color), other = rgb(cfg.colorB), core = rgb(cfg.core);
      var s = clamp01(cfg.split);
      var tone = [base, rgb(mix(base, other, s))];
      pal = [];
      /* Tone alone was not enough to tell them apart at the size the coil
         actually renders — 86vh of a 2150-unit box is a scale of about 0.36, so
         a 7-unit strand is 2.5 CSS px and two amber lines 2.5px wide read as
         one texture. Strand B is also drawn finer and slightly quieter, which
         is what makes the pair read as two things at a glance. */
      weight = [1, 1 - 0.24 * s];
      alphaF = [1, 1 - 0.12 * s];
      for (var si = 0; si < 2; si++) {
        var far = [], near = [];
        for (var b = 0; b < B; b++) {
          var rec = (b + 0.5) / B;
          /* the near half whitens as it approaches the leading turn; the far
             half never does — it is behind the bone and should stay a colour,
             not a highlight. */
          near.push(mix(tone[si], core, clamp01((rec - 0.55) / 0.45) * 0.8));
          far.push(mix(tone[si], core, clamp01((rec - 0.75) / 0.25) * 0.2));
        }
        pal.push({ near: near, far: far, base: tone[si].join(',') });
      }
    }

    /* ----------------------------------------------------------- the shape */
    function halfAt(y) {
      var f = (y - Y_TOP) / P_STEP;
      if (f <= 0) return PROFILE[0];
      if (f >= PROFILE.length - 1) return PROFILE[PROFILE.length - 1];
      var i = Math.floor(f);
      return PROFILE[i] + (PROFILE[i + 1] - PROFILE[i]) * (f - i);
    }
    function ringAt(y) {
      var hw = halfAt(y) * cfg.hug + REST_R * (1 - cfg.hug);
      var rx = hw + cfg.clear;
      var r = RATIO_A + RATIO_B * ((y - EYE_Y) / (Y_BOT - EYE_Y));
      if (r < RATIO_MIN) r = RATIO_MIN;
      return { rx: rx, ry: rx * r };
    }

    /* Numbers for verification rather than for drawing: the widest the coil
       ever gets, the tightest the ellipse ever gets, and where each happens. */
    function metrics() {
      var maxExtent = 0, maxAtY = 0, minRatio = Infinity, minAtY = 0;
      for (var y = Y_TOP; y <= Y_BOT; y++) {
        var g = ringAt(y), r = g.ry / g.rx;
        if (g.rx > maxExtent) { maxExtent = g.rx; maxAtY = y; }
        if (r < minRatio) { minRatio = r; minAtY = y; }
      }
      return {
        maxExtent: maxExtent, maxExtentAtY: maxAtY,
        minRatio: minRatio, minRatioAtY: minAtY,
        artMaxHalfwidth: 174.5, profileMax: Math.max.apply(null, PROFILE),
        clearanceAtWidest: maxExtent - 174.5
      };
    }

    /* -------------------------------------------------------------- canvas */
    function fit(cv) {
      var r = cv.getBoundingClientRect();
      if (!r.width || !r.height) return null;
      var dpr = Math.min(global.devicePixelRatio || 1, 2);
      var w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
      if (cv.width !== w) cv.width = w;
      if (cv.height !== h) cv.height = h;
      var ctx = cv.getContext('2d');
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, w, h);
      var s = Math.min(w / VB_W, h / VB_H);
      ctx.setTransform(s, 0, 0, s, (w - VB_W * s) / 2, (h - VB_H * s) / 2);
      /* shadowBlur is NOT scaled by the transform — it stays in device pixels,
         while everything else here is in viewBox units. Stash the factor rather
         than writing blur radii as if they shared that space. */
      ctx.__blur = dpr;
      return ctx;
    }
    function clear(cv) {
      var ctx = cv.getContext('2d');
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
    }

    /* ------------------------------------------------------- one strand half

       THIS IS DRAWN AS POLYLINES, NOT AS INDEPENDENT SEGMENTS, and that is a
       fix rather than an optimisation. The first version stroked every sample
       pair on its own; a visual pass found the result "reads as a ladder of
       crescents, not twin serpents" — hundreds of separate round-capped stubs
       that the eye refuses to join into a continuous line, worst on the far
       half where alpha sat at 0.09-0.22.

       Here the walk accumulates points into a run and flushes the run as ONE
       path whenever its appearance would have to change. Appearance is
       quantised: recency into `buckets` levels, head taper into 8. Inside a run
       every point shares a width, an alpha, a colour and a glow, so it can be
       one stroke with round joins — a continuous strand. Consecutive runs share
       their boundary point, so the quantisation shows as a gentle gradient
       rather than as gaps. It is also perhaps 40 strokes a pass instead of 280.

       THE HEAD TAPERS TO NOTHING. The other half of that visual pass found "a
       detached glowing nub at the wavefront": the brightest, widest segment
       travels nearly horizontally at the ring's edge and lineCap round leaves
       it as a blunt stub sitting in empty space, reading as a rendering glitch.
       Recency alone cannot fix it — recency is what makes the head bright. So
       width AND alpha are multiplied by a smoothstepped taper over the last
       `tailTurns` of a turn, and the strand comes to a needle point instead of
       an amputation. What now marks the wavefront is the channel and the reach,
       which is what they are for. */
    function walk(ctx, yF, uF, phase, near, si) {
      var S = Math.max(40, cfg.samples | 0);
      var B = Math.max(2, cfg.buckets | 0), T = 8;
      var BL = (cfg.blend > 0.001) ? BLEND_STEPS : 0;   /* 0 = hard split */
      var bl = cfg.blend;
      var tailU = Math.max(0.004, cfg.tailTurns / Math.max(cfg.turns, 0.25));
      var pts = null, key = -1, kRec = 0, kTap = 0, kBl = BL, px = 0, py = 0, has = false;

      for (var i = 0; i <= S; i++) {
        var y = Y_BOT + (yF - Y_BOT) * (i / S);
        var u = (Y_BOT - y) / (Y_BOT - Y_TOP);
        var th = u * cfg.turns * TAU + phase;
        var g = ringAt(y);
        var d = Math.sin(th);
        /* +ry for the near half: the eye is above, so the half of the ring
           nearest the viewer projects LOWER on screen (canvas y grows down). */
        var nx = CX + g.rx * Math.cos(th), ny = y + g.ry * d;

        /* THIS CANVAS'S SHARE OF THE POINT.
           Hard split: 1 on your own half, 0 on the other. Blended: a
           smoothstep across |sin th| < blend, so both canvases carry the point
           near the crossover and neither owns it outright. */
        var f = (BL === 0) ? ((d > 0) ? 1 : 0)
                           : smooth(clamp01((d + bl) / (2 * bl)));
        var dw = near ? f : 1 - f;

        var k = -1, rb = 0, tb = 0, bb = BL;
        if (dw > 0.004) {
          /* recency — the leading turn is the bright one, everything behind it
             is the trail it has already laid. Cubed-ish so the falloff is fast
             enough that the crown reads as a single travelling event. */
          var rec = Math.pow(u / uF, 3.2);
          var t = smooth(clamp01((uF - u) / tailU));
          rb = Math.min(B - 1, Math.floor(rec * B));
          tb = Math.min(T, Math.round(t * T));
          bb = (BL === 0) ? 0 : Math.round(dw * BL);
          k = (rb * (T + 1) + tb) * (BL + 1) + bb;
        }
        if (k !== key) {
          if (pts && pts.length >= 4) drawRun(ctx, pts, near, si, kRec, kTap, kBl, BL);
          pts = (k >= 0) ? (has ? [px, py, nx, ny] : [nx, ny]) : null;
          key = k; kRec = rb; kTap = tb; kBl = bb;
        } else if (pts) {
          pts.push(nx, ny);
        }
        px = nx; py = ny; has = true;
      }
      if (pts && pts.length >= 4) drawRun(ctx, pts, near, si, kRec, kTap, kBl, BL);
    }

    /* THE CROSSOVER SEAM, AND WHY IT NEEDED A BLEND.

       The strand is one helix walked twice and split by depth: sin(theta) > 0
       goes on the front canvas, < 0 on the back, with the spine PNG painted
       between them. At the two crossover points the strand hands off from one
       canvas to the other — and the two halves are deliberately drawn very
       differently, because the far half has to fight the bone to read at all.
       At full recency that handoff was a step from w 7.4 to 3.8 and alpha 0.94
       to 0.50, in one sample. It read as the beam being severed and restarted.

       WHERE THE BLEND SITS, MEASURED — an earlier version of this comment
       warned that anything past ~0.6 "is not a blend, it is a disappearance".
       That was overstated, and checking it against ringAt() and the measured
       profile is what corrected it.

       x = CX + rx*cos(theta), so sin = 0 means |cos| = 1: the ring's extreme
       left and right. THE HANDOFF MIDPOINT IS THERE, and there the strand sits
       exactly `clear` units outside the silhouette by construction — 9 units at
       the authored clearance — so the 50/50 crossing is always visible on both
       canvases at every height. That is the part that matters and it cannot be
       occluded at any blend width.

       The blend's TAILS do go behind the bone. At blend 0.60 the arc spans
       |cos| > 0.8, and its innermost reach is 0.8*rx = 0.8*half + 7.2, which is
       inside the silhouette at every row sampled — worst 27.8 units in, at
       y=1738. That is harmless: only the BACK canvas is occluded there, and the
       far strand passing behind the bone is the entire point of the depth
       split. The fade simply completes out of sight.

       So the useful ceiling is not a cliff. Wider blends move more of the
       crossfade behind the column, which softens the handoff and eventually
       wastes it; they never break it.

       WIDTH IS SHARED, ALPHA IS SPLIT. Both canvases compute the SAME lerped
       width at a given point, so there is no step in the silhouette to see.
       Each then draws in its own colour at its own alpha scaled by its share,
       so the two overlap and cross-fade through the handoff. */
    function drawRun(ctx, pts, near, si, rb, tb, bb, BL) {
      var B = Math.max(2, cfg.buckets | 0), T = 8;
      var rec = (rb + 0.5) / B, t = tb / T;
      if (t <= 0) return;

      /* dw: this canvas's share. f: how NEAR the point is, shared by both
         canvases so their widths agree. */
      var dw = (BL > 0) ? (bb / BL) : 1;
      if (dw <= 0.004) return;
      var f = near ? dw : 1 - dw;

      var w, a, col, p = pal[si];
      var wNear = (3.6 + 3.8 * rec) * t * weight[si];
      var wFar  = (2.7 + 1.1 * rec) * t * weight[si];
      w = wFar + (wNear - wFar) * f;

      if (near) {
        a = (0.34 + 0.60 * rec) * t * alphaF[si] * dw;
        col = p.near[rb];
      } else {
        /* THE FAR HALF WAS TOO FAINT TO READ AS A STRAND. It sat at 0.09-0.22
           and the eye simply lost it behind the bone, which is half of why the
           coil read as crescents. 0.20-0.50 here, with a glow on the leading
           part, and it stays a strand all the way round. It cannot spill in
           front of the column no matter how bright it gets — it is on the back
           canvas, which the spine is painted over.

           Width comes from the shared lerp above, NOT from its own formula —
           that is what removes the step in the silhouette at the crossover. */
        a = (0.20 + 0.30 * rec) * t * cfg.far * alphaF[si] * dw;
        col = p.far[rb];
      }
      if (a <= 0.004 || w <= 0.06) return;

      ctx.beginPath();
      ctx.moveTo(pts[0], pts[1]);
      for (var i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);

      var b = ctx.__blur;
      if (near && rec > 0.45) {
        ctx.shadowColor = 'rgba(' + p.base + ',' + (0.9 * t).toFixed(3) + ')';
        ctx.shadowBlur = 11 * b * t;
      } else if (!near && rec > 0.55) {
        ctx.shadowColor = 'rgba(' + p.base + ',' + (0.45 * t).toFixed(3) + ')';
        ctx.shadowBlur = 7 * b * t;
      } else {
        ctx.shadowBlur = 0;
      }
      ctx.strokeStyle = 'rgba(' + col + ',' + a.toFixed(3) + ')';
      ctx.lineWidth = w;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }

    /* sushumna — the lit core the strands wind around, base to wavefront.
       Straight, because finding 1 says the column is. */
    function channel(ctx, yF) {
      if (cfg.beam <= 0.01) return;
      var b = ctx.__blur;
      ctx.beginPath(); ctx.moveTo(CX, Y_BOT); ctx.lineTo(CX, yF);
      ctx.lineCap = 'round';
      ctx.shadowColor = 'rgba(' + cfg.color + ',0.75)'; ctx.shadowBlur = 13 * b;
      ctx.strokeStyle = 'rgba(' + cfg.color + ',' + (0.30 * cfg.beam).toFixed(3) + ')';
      ctx.lineWidth = 14; ctx.stroke();
      ctx.shadowBlur = 6 * b;
      ctx.strokeStyle = 'rgba(' + cfg.core + ',' + (0.34 * cfg.beam).toFixed(3) + ')';
      ctx.lineWidth = 3.6; ctx.stroke();
    }

    /* the reach — light thrown up the column ahead of the wavefront, into spine
       the coil has not arrived at yet, so the cue points where it is going. It
       also now carries the job of MARKING the wavefront, which the strands used
       to do by ending in a bright blunt stub.

       IT IS A STACK OF FEATHERED BANDS, NOT ONE FILLED TRAPEZOID. The first
       version was a single quad filled with a vertical gradient: soft top and
       bottom, but the two SIDES were polygon edges, and against a star field
       those read at 3x zoom as two hard diagonal lines converging over the
       thoracic spine — a visible shape rather than light. Every band here
       carries its own left-to-right gradient that reaches zero at both ends, so
       the beam has no edge in any direction. Bands overlap by roughly 2x and
       are dimmed to suit, which also removes any banding between them.
       Gradient stops rather than ctx.filter, deliberately: filter blur is not
       reliably in the same space as the canvas transform. */
    function reach(ctx, yF) {
      if (cfg.beam <= 0.01) return;
      var top = Math.max(yF - 330, Y_TOP - 60);
      if (top >= yF - 10) return;
      var rx = ringAt(yF).rx, a = cfg.beam, am = cfg.color;
      var N = 48, span = yF - top, h = span / N;
      ctx.shadowBlur = 0;
      for (var i = 0; i < N; i++) {
        var t = i / (N - 1);                       /* 0 at the front, 1 above */
        var v = a * 0.26 * Math.pow(1 - t, 2.1);
        if (v <= 0.002) continue;
        var y = yF - span * t;
        var w = rx * (0.92 - 0.66 * t);            /* narrows as it climbs */
        var gr = ctx.createLinearGradient(CX - w, 0, CX + w, 0);
        gr.addColorStop(0,    'rgba(' + am + ',0)');
        gr.addColorStop(0.30, 'rgba(' + am + ',' + (v * 0.5).toFixed(4) + ')');
        gr.addColorStop(0.5,  'rgba(' + am + ',' + v.toFixed(4) + ')');
        gr.addColorStop(0.70, 'rgba(' + am + ',' + (v * 0.5).toFixed(4) + ')');
        gr.addColorStop(1,    'rgba(' + am + ',0)');
        ctx.fillStyle = gr;
        ctx.fillRect(CX - w, y - h, 2 * w, h * 2);
      }
    }

    /* -------------------------------------------------------------- drawing
       p is the wavefront's progress up the FULL element box (0 at the bottom
       edge, 1 at the top), not up the art — the caller may be masking the
       artwork with a percentage of the same box, and the two must be derived
       the same way or they drift apart. */
    var lastP = 0, lastAlpha = 1;
    function draw(p, alpha) {
      lastP = p; lastAlpha = (alpha == null) ? 1 : alpha;
      var back = fit(cvBack), front = fit(cvFront);
      if (!back || !front) return false;

      var yF = VB_H * (1 - p);
      if (yF > Y_BOT) yF = Y_BOT;
      if (yF < Y_TOP) yF = Y_TOP;          /* clamped AT the crown, not above
                                              it: past the crown the ellipse
                                              ratio would slide under the 0.212
                                              floor's natural value. */
      var uF = (Y_BOT - yF) / (Y_BOT - Y_TOP);
      if (uF <= 0.002) return true;

      /* fade in over the first slice of the run so the coil arrives rather than
         appearing; the fade OUT is the runner's job. */
      var ga = lastAlpha * clamp01(p / Math.max(cfg.inFrac, 0.001));
      if (ga <= 0.002) return true;
      back.globalAlpha = ga; front.globalAlpha = ga;

      walk(back, yF, uF, 0, false, 0);
      walk(back, yF, uF, Math.PI, false, 1);
      channel(back, yF);
      reach(back, yF);
      walk(front, yF, uF, 0, true, 0);
      walk(front, yF, uF, Math.PI, true, 1);
      return true;
    }

    /* --------------------------------------------------------- the one shot
       It runs once up the column when triggered and then stops. No scroll, no
       motion gate. The tail is a hold at the crown and then a fade of the whole
       drawing, which is what makes it read as arriving and dissipating rather
       than as being switched off. */
    var raf = 0, t0 = 0, phase = '', onDone = null;
    function frame(now) {
      var d = Math.max(1, cfg.durationMs);
      var e = now - t0;
      if (phase === 'run') {
        var p = e / d;
        if (p >= 1) { p = 1; phase = 'hold'; t0 = now; }
        /* ease in, ease out — the energy gathers, travels, and settles */
        var q = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
        draw(q, 1);
      } else if (phase === 'hold') {
        draw(1, 1);
        if (e >= cfg.holdMs) { phase = 'fade'; t0 = now; }
      } else if (phase === 'fade') {
        var f = clamp01(e / Math.max(1, cfg.fadeMs));
        draw(1, 1 - smooth(f));
        if (f >= 1) { stop(); if (onDone) onDone(); return; }
      }
      raf = global.requestAnimationFrame(frame);
    }
    function run(o) {
      o = o || {};
      stop();
      onDone = o.onDone || null;
      phase = 'run';
      t0 = (global.performance && performance.now) ? performance.now() : Date.now();
      raf = global.requestAnimationFrame(frame);
    }
    function stop() {
      if (raf) global.cancelAnimationFrame(raf);
      raf = 0; phase = '';
      clear(cvBack); clear(cvFront);
    }
    function seek(p) { stop(); draw(clamp01(p), 1); }
    function running() { return !!raf; }

    setConfig(opts.config);

    return {
      setConfig: setConfig,
      config: function () { return cfg; },
      draw: draw,
      seek: seek,
      run: run,
      stop: stop,
      running: running,
      metrics: metrics,
      ringAt: ringAt,
      halfAt: halfAt,
      progress: function () { return lastP; }
    };
  }

  global.SpineCoil = {
    create: create,
    readCssVars: readCssVars,
    DEFAULTS: DEFAULTS,
    PROFILE: PROFILE,
    GEOMETRY: {
      viewBox: { w: VB_W, h: VB_H },
      cx: CX, yTop: Y_TOP, yBot: Y_BOT,
      eyeY: EYE_Y, ratioMin: RATIO_MIN, profileStep: P_STEP
    }
  };

})(window);
