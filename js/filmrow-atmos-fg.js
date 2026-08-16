/* THE FILM ROW FOREGROUND ATMOSPHERE — window.KSFilmrowFG
   Layer three of the boundary dissolve (owner's brief, Aug 16 2026). Layers one
   and two — the edge feather and the glow field — live behind and around the
   video and are owned elsewhere. THIS layer is the only one that sits IN FRONT
   of the footage.

   WHAT IT IS FOR
   --------------
   The film rows are hard rectangles pasted onto a starfield. Feathering the
   edge softens the cut but still leaves the video as a self-contained plate:
   everything inside it belongs to the video, everything outside belongs to the
   page. What actually erases a rectangle is MATERIAL THAT DOES NOT RESPECT IT —
   a wisp of smoke that starts over the sky and finishes over the footage. So
   the one rule this module exists to serve is that particles STRADDLE the
   boundary. Material that stops at the edge, however soft, re-draws the very
   line it was hired to remove.

   Three constraints fall straight out of that, and every default below is
   chosen against them:

     - SELECTED EDGES, NOT A BORDER. Ringing all four edges evenly is a vignette,
       and a vignette is a rectangle. Default weights are top 1, right 0.85,
       bottom 0.45, left 0 — asymmetric, with one edge bare.
     - THE CENTRE STAYS READABLE. Material reaches inward at most `reach` of the
       box's SHORT side (default 0.30) and fades to nothing before it gets
       there, so the middle ~40% of the frame is untouched by construction, not
       by luck.
     - IT MUST NOT READ AS DIRT. Two things do that work. The canvas is
       screen-blended, so the layer can only ever ADD light — see the note in
       css/filmrow-atmos-fg.css. And the material is placed in CLUMPS along each
       edge rather than evenly, because evenly-spaced specks read as sensor dust
       and clumps read as weather.

   PARALLAX: IT LAGS THE SCRUB
   ---------------------------
   js/spine-doc.js maps scroll position to video.currentTime with
     p  = clamp((innerHeight - rect.top) / (innerHeight + rect.height))
     p2 = clamp((p - 0.10) / 0.70)
   This module recomputes p2 from THE SAME RECT and offsets the whole field by
     (p2 - 0.5) * boxHeight * parallax
   downward as p2 rises. The field is pinned to the element, so the element
   already carries it up the screen at page speed; pushing it back down as the
   scrub advances is what makes the atmosphere trail the footage — over the same
   stretch of scroll the footage advances a full second of its clip and the
   atmosphere moves a few pixels.

   Default 0.18. MEASURED as the alpha-weighted vertical centroid of the field
   canvas at 1440x900 on a 426px-tall box: 300px of scroll moves the field
   19.4px down relative to the element, and the same test at parallax 0 moves it
   0.00px — so the option is provably the thing doing it and 0 really is off.

   IT NEVER TOUCHES THE VIDEO. No listener is attached to the <video>, its
   currentTime is never read or written, and its layout box is never changed.
   The rect is read from the .ksd-filmrow__media figure, which is the same box.
   The scrub's own listeners are untouched and unaware this exists. If a future
   pass is tempted to hook `seeked` for a smoother lock: don't. Every seek the
   scrub makes fires it, and a rAF kicked off per seek is a second animation
   loop racing the first.

   COST. One canvas per row. Fourteen soft forms and ninety points at default
   density, all drawImage of pre-baked sprites — no per-frame gradients, no
   filter, no shadowBlur, nothing that touches the video's own pixels. Painting
   is capped at 40Hz (see PAINT_MS), the rAF is stopped entirely by an
   IntersectionObserver when the row is off screen, and the scroll handler is
   passive and only stores a number.

   TUNING. Every default here was judged in filmrow-fg-lab.html against the real
   black-tide clip on the real sky. To retune: open that lab, drag, press Copy
   options, and paste the result as the second argument to attach().

   API
     window.KSFilmrowFG.attach(mediaEl, options) -> { setOptions(o), destroy() }
   Options, defaults and ranges are documented on DEFAULTS below. */

(function (global) {
  'use strict';

  var TAU = Math.PI * 2;

  /* ---- Options -----------------------------------------------------------
     Ranges in the comments are the useful ones, not hard limits; the module
     clamps only where a value out of range would break geometry. */
  var DEFAULTS = {
    /* Master dimmer, multiplied into every particle's alpha. 0 = invisible,
       1 = as strong as the layer is built to go. Range 0..1.
       THIS IS THE ONE TO PULL IF IT EVER LOOKS LIKE DIRT.

       Measured Aug 16 2026 in filmrow-fg-lab.html at 1440x900 against the real
       black-tide clip on the real sky, drift frozen and every CSS animation
       paused so the only difference between the two frames is this layer.
       Numbers are SIGNED 0–255 change against the identical frame with the
       layer destroyed — signed, because absolute difference would score a
       darkening artefact and added light as equally "present", which is the
       mistake the cloud layer's first pass made (see js/clouds-sky.js):

         intensity   mean over video   max   % of video lifted >2   centre 40%   darkest px
           0.25           0.34          40           5.1%            0.00 / 0        0
           0.40           0.55          64           7.3%            0.00 / 0        0
           0.55           0.75          89           8.7%            0.00 / 0        0
           0.70           0.96         114           9.8%            0.00 / 0        0     <- now
           1.00           1.39         162          11.5%            0.00 / 0       -1

       Two things to read out of that table. THE CENTRE COLUMN IS ZERO AT EVERY
       LEVEL — not "small", zero: the middle 40% of the frame is not lifted by a
       single unit even at full strength, which is the readability guarantee
       holding by construction rather than by taste. And THE DARKEST PIXEL IS
       ZERO — screen cannot subtract, so there is no setting of this option that
       can put grime on the footage; the worst it can do is put too much light
       on it. The -1 at 1.00 is screenshot rounding, not a darkening.

       0.70, up from a first cut at 0.55. 0.55 was chosen to be safe and then
       looked at: it is legible on the dark black-tide water but effectively
       absent on the spine-frequency row, whose backdrop is a bright nebula that
       screen has little room to add to. 0.70 carries both. It was checked at
       1.00 first — even there the layer reads as weather and not as a dirty
       screen, so 0.70 is not near the edge of anything. */
    intensity: 0.70,

    /* Multiplies both counts below. 1 = the tuned population. Range 0..2;
       above ~1.6 the clumps merge into a continuous band and the edge comes
       back as a soft border, which is the failure this layer exists to avoid. */
    density: 1,

    /* WHICH EDGES CARRY MATERIAL. Accepts:
         'top,right'            (string, equal weight)
         ['top','right']        (array, equal weight)
         {top:1, right:0.85, …} (object, per-edge weight 0..1)
       A weight is the share of the population that edge gets, so 0 means the
       edge is bare. The default leaves LEFT at zero: at desktop the media is
       the right-hand column of .ksd-filmrow and its left edge faces the copy,
       where added light lands on type. On the stacked <=900px layout there is
       no copy beside it and the owner may well want left back — that is a
       setOptions call, not a code change. */
    edges: { top: 1, right: 0.85, bottom: 0.45, left: 0 },

    /* How far material reaches OUTWARD past the boundary, in CSS px. This is
       the "crossing" half of the layer. 56 is a little over a tenth of the
       box's height at desktop — far enough that a wisp clearly belongs to the
       page as much as the film, near enough that it does not wander into the
       copy column. Range 0..160.
       Clamped per side at measure time so the wrapper can never extend past the
       viewport's right edge; see measure(). */
    spill: 56,

    /* How far material reaches INWARD from the boundary, as a fraction of the
       box's SHORT side. This is the guard on readability: at 0.30 the top and
       bottom bands each claim 30% of the height and the middle 40% is clear
       before the alpha falloff is even applied. Range 0..0.45. */
    reach: 0.30,

    /* Parallax against the scrub, as a fraction of the box height travelled
       across the element's whole pass through the viewport. 0 pins the field to
       the element (no lag at all); 0.18 is the tuned value; above ~0.45 the
       field visibly slides and stops reading as atmosphere. Range 0..0.6. */
    parallax: 0.18,

    /* Autonomous drift speed — the slow sway that runs whether or not anyone is
       scrolling. 0 freezes the field into a still (which is also what reduced
       motion forces). 1 is roughly one full sway cycle per 30s. Range 0..2. */
    drift: 0.5,

    /* Population before `density` is applied.
       wisps = the big soft smoke/nebula forms; they do the dissolving.
       motes = the small dust and star points; they do the "in front of a lens"
       read. Ranges 0..24 and 0..240. Both are cheap — the cost is drawImage of
       a baked sprite, so 100 particles is ~100 composited quads a frame. */
    wisps: 14,
    motes: 90,

    /* Colours, most-used first: the sampler biases toward the head of the list
       (index = floor(rng^1.7 * n)), so tint[0] carries roughly two thirds of
       the material. Moonlight is the site's cold blue, spine glow its white,
       and the violet ties the wisps to the nebula behind the row. Any CSS hex. */
    tint: ['#9DB2C0', '#E4E8EB', '#7A6BA8'],

    /* 'screen' | 'plus-lighter' | 'normal'. See css/filmrow-atmos-fg.css for
       why screen is the default and what it is defending against. */
    blend: 'screen',

    /* Backing-store cap. The layer is all soft gradients, so 2 is already past
       the point of visible return and 3 on a phone is a third of the fill rate
       for nothing. Range 1..3. */
    maxDpr: 2,

    /* Layout is deterministic from this. Change it to reshuffle the clumps
       without changing any other number — the fastest way to get a second
       opinion on a composition you do not like.
       Note the module mixes a PER-ELEMENT offset into it (see elementSeed), so
       two rows on the same page do not get the same smoke twice from the same
       seed. That was the first cut's behaviour and it read as a repeat
       immediately: index.html has two film rows and both wore the same wisp in
       the same corner. */
    seed: 20260816
  };

  var EDGE_NAMES = ['top', 'right', 'bottom', 'left'];

  /* Paint no faster than 40Hz. The field is a slow sway plus a parallax offset
     that travels ~19px over a 300px scroll, so at 40Hz the worst-case lag
     during a fast flick is about a pixel — invisible — and the idle cost drops
     by a third. Measured in headless at 1440x900 with two rows live, as an
     UNTHROTTLED rAF benchmark (so the numbers are a cost proxy, not a frame
     rate anyone sees): 475 fps with no layer, 380 with it painting every frame
     — ~0.53ms per frame for two canvases — and 469 with this cap, which is
     inside the run-to-run noise of the no-layer baseline (467 on the same run).
     The cap did not shave the cost, it removed it from the measurement.
     A constant and not an option: it is a cost/quality trade with one right
     answer, not a look to tune, and every option in DEFAULTS should be one the
     owner has a reason to touch. */
  var PAINT_MS = 1000 / 40;

  /* Per-element seed offset, assigned once and remembered ON THE ELEMENT. A
     module-level counter alone would reshuffle the composition every time the
     lab's layer-off/layer-on button re-attached, which makes tuning impossible;
     hanging it off the element means the same row always gets the same field
     and a different row always gets a different one. */
  var seedCounter = 0;
  function elementSeed(el) {
    if (el.__ksfgSeed == null) el.__ksfgSeed = (seedCounter++) * 0x9E3779B1;
    return el.__ksfgSeed;
  }

  /* ---- Small helpers ----------------------------------------------------- */

  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

  function num(v, fallback) {
    var n = typeof v === 'number' ? v : parseFloat(v);
    return isFinite(n) ? n : fallback;
  }

  /* mulberry32. Deterministic and 5 lines — Math.random would reshuffle the
     composition on every reload and make "that looked better before"
     unanswerable. */
  function makeRng(seed) {
    var t = (seed >>> 0) || 1;
    return function () {
      t = (t + 0x6D2B79F5) >>> 0;
      var r = t;
      r = Math.imul(r ^ (r >>> 15), r | 1);
      r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* Sum of three uniforms, roughly normal on [-1,1]. Used for the along-edge
     spread inside a clump: a uniform spread gives a rectangular patch of
     material with visible ends, this gives one that fades out. */
  function gauss(rng) { return (rng() + rng() + rng() - 1.5) / 1.5; }

  function rgba(hex, a) {
    var h = String(hex).trim();
    if (h.charAt(0) === '#') h = h.slice(1);
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    if (!isFinite(n)) n = 0xE4E8EB;   // spine glow, if someone passes nonsense
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  /* Normalise the three accepted shapes of `edges` into one weight map. */
  function readEdges(spec) {
    var w = { top: 0, right: 0, bottom: 0, left: 0 }, i, k;
    if (spec == null) return w;
    if (typeof spec === 'string') spec = spec.split(/[\s,|]+/);
    if (Object.prototype.toString.call(spec) === '[object Array]') {
      for (i = 0; i < spec.length; i++) {
        k = String(spec[i]).trim().toLowerCase();
        if (w.hasOwnProperty(k)) w[k] = 1;
      }
      return w;
    }
    for (i = 0; i < EDGE_NAMES.length; i++) {
      k = EDGE_NAMES[i];
      if (spec[k] != null) w[k] = clamp(num(spec[k], 0), 0, 1);
    }
    return w;
  }

  /* ---- Sprites -----------------------------------------------------------
     Baked once per attach and re-baked only when the tint list changes. Every
     particle is a drawImage of one of these, which is why a hundred of them
     cost nothing: no createRadialGradient, no shadowBlur and no filter runs
     inside the frame loop. */

  /* A wisp is NOT one radial gradient. A single gradient is a bokeh dot and
     reads as a lens artefact; stamping a dozen offset lobes additively gives a
     lumpy, directional form that reads as smoke. The sprite is then masked to a
     soft disc so a rotated stamp can never show its own square corner. */
  function bakeWisp(rng, colour, size) {
    var c = document.createElement('canvas');
    c.width = c.height = size;
    var g = c.getContext('2d');
    var lobes = 10 + Math.floor(rng() * 8);
    var squash = 0.35 + rng() * 0.50;   // wisps are wider than they are tall
    g.globalCompositeOperation = 'lighter';
    for (var i = 0; i < lobes; i++) {
      var ang = rng() * TAU;
      /* 0.32 of the sprite, up from 0.24. The tighter cluster piled every lobe
         on the centre and baked out a near-radial falloff — i.e. a bokeh dot,
         the thing this sprite exists not to be. Pushing the lobes apart leaves
         the interior lumpy and the outline ragged. */
      var off = Math.pow(rng(), 0.7) * size * 0.32;
      var cx = size / 2 + Math.cos(ang) * off;
      var cy = size / 2 + Math.sin(ang) * off * squash;
      var rad = size * (0.12 + rng() * 0.20);
      var grd = g.createRadialGradient(cx, cy, 0, cx, cy, rad);
      grd.addColorStop(0, rgba(colour, 0.26));
      grd.addColorStop(0.45, rgba(colour, 0.09));
      grd.addColorStop(1, rgba(colour, 0));
      g.fillStyle = grd;
      g.beginPath();
      g.arc(cx, cy, rad, 0, TAU);
      g.fill();
    }
    g.globalCompositeOperation = 'destination-in';
    var m = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    m.addColorStop(0, 'rgba(0,0,0,1)');
    m.addColorStop(0.58, 'rgba(0,0,0,0.9)');
    m.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = m;
    g.fillRect(0, 0, size, size);
    return c;
  }

  /* A mote is a hard-ish core in a wide soft halo — the halo is what stops it
     looking like a dead pixel at 1x. `glint` adds the faint four-point cross
     that makes a subset of them read as stars rather than dust; only about a
     fifth of the motes get it, because on all of them it turns into tinsel. */
  function bakeMote(colour, size, glint) {
    var c = document.createElement('canvas');
    c.width = c.height = size;
    var g = c.getContext('2d');
    var h = size / 2;
    g.globalCompositeOperation = 'lighter';
    var halo = g.createRadialGradient(h, h, 0, h, h, h);
    halo.addColorStop(0, rgba(colour, 0.62));
    halo.addColorStop(0.18, rgba(colour, 0.28));
    halo.addColorStop(0.55, rgba(colour, 0.06));
    halo.addColorStop(1, rgba(colour, 0));
    g.fillStyle = halo;
    g.fillRect(0, 0, size, size);
    var core = g.createRadialGradient(h, h, 0, h, h, size * 0.075);
    core.addColorStop(0, rgba(colour, 0.95));
    core.addColorStop(1, rgba(colour, 0));
    g.fillStyle = core;
    g.fillRect(0, 0, size, size);
    if (glint) {
      var arm = g.createLinearGradient(0, h, size, h);
      arm.addColorStop(0, rgba(colour, 0));
      arm.addColorStop(0.5, rgba(colour, 0.30));
      arm.addColorStop(1, rgba(colour, 0));
      g.fillStyle = arm;
      g.fillRect(0, h - size * 0.012, size, size * 0.024);
      var arm2 = g.createLinearGradient(h, 0, h, size);
      arm2.addColorStop(0, rgba(colour, 0));
      arm2.addColorStop(0.5, rgba(colour, 0.30));
      arm2.addColorStop(1, rgba(colour, 0));
      g.fillStyle = arm2;
      g.fillRect(h - size * 0.012, 0, size * 0.024, size);
    }
    return c;
  }

  /* ---- attach ------------------------------------------------------------ */

  function attach(mediaEl, options) {
    if (!mediaEl || !mediaEl.nodeType) return null;

    var opts = {};
    var k;
    for (k in DEFAULTS) if (DEFAULTS.hasOwnProperty(k)) opts[k] = DEFAULTS[k];
    assign(opts, options);

    /* Anchor. Only add the class if the host is static — if a stylesheet has
       already positioned it, adopting it is enough and touching position could
       move something. */
    var addedHostClass = false;
    if (global.getComputedStyle(mediaEl).position === 'static') {
      mediaEl.classList.add('ksfg-host');
      addedHostClass = true;
    }

    var wrap = document.createElement('div');
    wrap.className = 'ksfg';
    wrap.setAttribute('aria-hidden', 'true');
    wrap.setAttribute('data-ksfg-blend', String(opts.blend));

    var canvas = document.createElement('canvas');
    canvas.className = 'ksfg__canvas';
    canvas.setAttribute('aria-hidden', 'true');
    wrap.appendChild(canvas);
    mediaEl.appendChild(wrap);

    var ctx = canvas.getContext('2d');

    /* Geometry, in CSS px in the wrapper's own space. box* is where the media
       element sits inside the (larger) wrapper. */
    var spillL = 0, spillR = 0, spillT = 0, spillB = 0;
    var boxW = 0, boxH = 0, cw = 0, ch = 0, reachPx = 0, shortSide = 0;
    var dpr = 1;

    var wisps = [], motes = [];
    var wispSprites = [], moteSprites = [];

    var progress = 0.5;          // the scrub's p2, mirrored — see header
    var raf = 0, t0 = 0, lastPaint = 0, running = false, visible = true;

    var mqReduce = global.matchMedia
      ? global.matchMedia('(prefers-reduced-motion: reduce)')
      : { matches: false, addEventListener: null, addListener: null };

    /* ---- geometry ---- */

    function measure() {
      var r = mediaEl.getBoundingClientRect();
      if (!r.width || !r.height) return false;

      var sp = clamp(num(opts.spill, DEFAULTS.spill), 0, 400);

      /* HORIZONTAL CLAMP — this is the whole no-page-overflow story.
         An absolutely positioned box contributes to scrollable overflow, so a
         56px right spill on a row whose right edge is already at the container
         boundary would grow documentElement.scrollWidth and put a horizontal
         scrollbar on the page. Clamp to the room actually available inside the
         viewport (clientWidth excludes the vertical scrollbar) and lose the
         difference. The -1 is slack against subpixel rects.
         The left side is clamped too, for a different reason: overflow to the
         LEFT is not scrollable in LTR, so it costs no scrollbar — but it is
         also invisible, and canvas pixels nobody can see are pure fill rate. */
      var docW = document.documentElement.clientWidth;
      spillR = Math.min(sp, Math.max(0, docW - r.right - 1));
      spillL = Math.min(sp, Math.max(0, r.left));
      /* Vertical is left alone: the page already scrolls, and a row is never
         the last thing in the document, so vertical spill cannot lengthen it. */
      spillT = sp;
      spillB = sp;

      boxW = r.width;
      boxH = r.height;
      shortSide = Math.min(boxW, boxH);
      reachPx = clamp(num(opts.reach, DEFAULTS.reach), 0, 0.45) * shortSide;

      cw = spillL + boxW + spillR;
      ch = spillT + boxH + spillB;

      wrap.style.left = (-spillL) + 'px';
      wrap.style.top = (-spillT) + 'px';
      wrap.style.width = cw + 'px';
      wrap.style.height = ch + 'px';

      dpr = clamp(global.devicePixelRatio || 1, 1, clamp(num(opts.maxDpr, 2), 1, 3));
      var bw = Math.max(1, Math.round(cw * dpr));
      var bh = Math.max(1, Math.round(ch * dpr));
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
      }
      return true;
    }

    /* The scrub's own mapping, recomputed off the media rect rather than the
       video's. Same numbers, same rect, no listener on the video. Kept in step
       with js/spine-doc.js scrubToScroll — if the 0.10/0.70 window is ever
       retuned there, retune it here or the atmosphere lags a clock that has
       moved. */
    function readProgress() {
      var r = mediaEl.getBoundingClientRect();
      var vh = global.innerHeight || document.documentElement.clientHeight;
      var p = clamp((vh - r.top) / (vh + r.height), 0, 1);
      progress = clamp((p - 0.10) / 0.70, 0, 1);
    }

    /* ---- population -------------------------------------------------------
       Particles are stored in EDGE-LOCAL NORMALISED coordinates:
         t  0..1 along the edge (allowed slightly outside so corners get
            material and an edge does not stop dead at 90 degrees)
         d  -1..+1 signed depth; +1 = the far end of the outward spill,
            -1 = the far end of the inward reach, 0 = exactly on the boundary
       Nothing here is in pixels, so a resize re-maps the same composition
       instead of reshuffling it. */
    function build() {
      var rng = makeRng((num(opts.seed, DEFAULTS.seed) + elementSeed(mediaEl)) >>> 0);
      var tints = (opts.tint && opts.tint.length) ? opts.tint : DEFAULTS.tint;

      /* Sprites first — the particles index into them. */
      wispSprites = [];
      moteSprites = [];
      var ti;
      for (ti = 0; ti < tints.length; ti++) {
        /* Four shape variants per colour. One variant repeated a dozen times is
           legible as a repeat even at this opacity; four is not. */
        for (var v = 0; v < 4; v++) wispSprites.push(bakeWisp(rng, tints[ti], 128));
        moteSprites.push(bakeMote(tints[ti], 32, false));
        moteSprites.push(bakeMote(tints[ti], 32, true));
      }

      var weights = readEdges(opts.edges);
      var pool = [], total = 0, i;
      for (i = 0; i < EDGE_NAMES.length; i++) {
        var wgt = weights[EDGE_NAMES[i]];
        if (wgt > 0) { total += wgt; pool.push({ edge: EDGE_NAMES[i], acc: total }); }
      }

      wisps = [];
      motes = [];
      if (!pool.length) return;   // every edge switched off is a valid "off"

      /* CLUMPS. Each live edge gets 2–3 centres; a particle joins one and
         scatters around it. This is the difference between weather and dust on
         a lens, and it is also what keeps a fully-populated edge from adding up
         to a border. */
      var clumps = {};
      for (i = 0; i < pool.length; i++) {
        var list = [];
        var n = 2 + Math.floor(rng() * 2);
        for (var c = 0; c < n; c++) {
          list.push({ at: -0.05 + rng() * 1.10, spread: 0.09 + rng() * 0.17 });
        }
        clumps[pool[i].edge] = list;
      }

      function pickEdge() {
        var x = rng() * total;
        for (var j = 0; j < pool.length; j++) if (x <= pool[j].acc) return pool[j].edge;
        return pool[pool.length - 1].edge;
      }

      function place(bias, dSpread) {
        var edge = pickEdge();
        var cl = clumps[edge];
        var pick = cl[Math.floor(rng() * cl.length)];
        return {
          edge: edge,
          t0: clamp(pick.at + gauss(rng) * pick.spread, -0.10, 1.10),
          /* Depth is drawn wide and biased slightly outward for the wisps:
             material that leans into the page dissolves the edge harder than
             material that leans into the frame, and it costs no readability. */
          d0: clamp((rng() * 2 - 1) * dSpread + bias, -0.98, 0.98)
        };
      }

      var density = Math.max(0, num(opts.density, 1));
      var nW = Math.round(clamp(num(opts.wisps, DEFAULTS.wisps), 0, 60) * density);
      var nM = Math.round(clamp(num(opts.motes, DEFAULTS.motes), 0, 600) * density);

      for (i = 0; i < nW; i++) {
        var pw = place(0.10, 0.92);
        pw.sprite = wispSprites[Math.floor(Math.pow(rng(), 1.7) * wispSprites.length)];
        pw.size = 0.17 + Math.pow(rng(), 1.3) * 0.26;   // x shortSide
        /* 0.10–0.30 before intensity and before fade(). The first cut ran
           0.030–0.085 and MEASURED AS ABSENT: 1.9% of the frame lifted by more
           than 2/255 at intensity 1, mean lift 0.23. A layer you have to be
           told is there is not doing the job. */
        pw.alpha = 0.14 + rng() * 0.24;
        /* EDGE-ALIGNED, NOT FREELY ROTATED. A wisp turned to a random angle is
           a blob; a wisp lying ALONG the edge it hangs off is a streak of
           weather hugging the frame, and that is the difference between this
           layer reading as smoke and reading as the glow field (which is a
           different agent's layer and must not be duplicated here). Base angle
           is the edge's own direction, plus +-0.35 rad of jitter so the set
           does not look ruled. */
        pw.rot = ((pw.edge === 'left' || pw.edge === 'right') ? Math.PI / 2 : 0)
               + (rng() - 0.5) * 0.70;
        /* Area-preserving stretch along that angle. 1.35–2.3 measured: below
           1.3 the streak is not readable as one, above ~2.5 it turns into a
           bar and re-draws the edge it is meant to break. */
        pw.stretch = 1.30 + rng() * 0.80;
        /* 0.008 rad/s at drift 1 — a full sway cycle turns a streak by about a
           degree. Was 0.02, which over the 30s cycle rotated an edge-aligned
           streak far enough to stop being edge-aligned. */
        pw.spin = (rng() - 0.5) * 0.008;
        pw.ph = rng() * TAU;
        pw.ph2 = rng() * TAU;
        pw.rate = 0.05 + rng() * 0.10;
        pw.rate2 = 0.04 + rng() * 0.09;
        pw.swayT = 0.02 + rng() * 0.05;
        pw.swayD = 0.05 + rng() * 0.13;
        pw.breathe = 0.10 + rng() * 0.16;
        wisps.push(pw);
      }

      for (i = 0; i < nM; i++) {
        var pm = place(0.0, 0.95);
        var tIdx = Math.floor(Math.pow(rng(), 1.7) * tints.length);
        /* ~1 in 5 gets the glint. The pair per tint is [plain, glint]. */
        pm.sprite = moteSprites[tIdx * 2 + (rng() < 0.2 ? 1 : 0)];
        pm.size = 6 + Math.pow(rng(), 2.1) * 20;        // px, sprite footprint
        pm.alpha = 0.16 + Math.pow(rng(), 1.6) * 0.62;
        pm.ph = rng() * TAU;
        pm.ph2 = rng() * TAU;
        pm.rate = 0.06 + rng() * 0.14;
        pm.rate2 = 0.05 + rng() * 0.12;
        pm.swayT = 0.004 + rng() * 0.014;
        pm.swayD = 0.02 + rng() * 0.07;
        /* Twinkle depth. 0 on roughly half of them — an entire field that
           pulses is a Christmas tree. */
        pm.tw = rng() < 0.5 ? 0 : (0.15 + rng() * 0.40);
        pm.twRate = 0.3 + rng() * 0.9;
        motes.push(pm);
      }
    }

    /* ---- mapping ----------------------------------------------------------
       Edge-local (t, d) -> wrapper pixels, plus the alpha falloff.

       The falloff has a PLATEAU across the boundary rather than a peak on it:
       |d| under 0.35 is full strength, and it eases to zero by |d| = 1. A peak
       at d = 0 would concentrate every particle on the edge line and hand back
       the rectangle in soft focus. The plateau spreads the same material across
       a band that happens to contain the edge. */
    function fade(d) {
      var a = Math.abs(d);
      if (a >= 1) return 0;
      var f = clamp((1 - a) / 0.65, 0, 1);
      return f * f * (3 - 2 * f);
    }

    /* Signed outward offset in px for a depth d on a given edge. Outward uses
       that edge's clamped spill, inward always uses reachPx. */
    function offsetPx(edge, d) {
      if (d >= 0) {
        var sp = edge === 'top' ? spillT : edge === 'bottom' ? spillB
               : edge === 'left' ? spillL : spillR;
        return d * sp;
      }
      return d * reachPx;
    }

    function positionOf(p, t, d, out) {
      var o = offsetPx(p.edge, d);
      if (p.edge === 'top') { out.x = spillL + t * boxW; out.y = spillT - o; }
      else if (p.edge === 'bottom') { out.x = spillL + t * boxW; out.y = spillT + boxH + o; }
      else if (p.edge === 'left') { out.x = spillL - o; out.y = spillT + t * boxH; }
      else { out.x = spillL + boxW + o; out.y = spillT + t * boxH; }
    }

    /* ---- paint ---- */

    var pos = { x: 0, y: 0 };

    function draw(time) {
      if (!cw || !ch) return;

      var intensity = clamp(num(opts.intensity, DEFAULTS.intensity), 0, 1);
      var parallax = clamp(num(opts.parallax, DEFAULTS.parallax), 0, 1);
      var still = mqReduce.matches;
      /* Reduced motion parks the parallax mid-travel instead of at whatever the
         scroll happens to say, so the composition is the one the layer was
         tuned at and nothing moves when the page does. */
      var p2 = still ? 0.5 : progress;
      var oy = (p2 - 0.5) * boxH * parallax;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cw, ch);
      if (intensity <= 0) return;
      ctx.globalCompositeOperation = 'lighter';

      var i, p, t, d, a, s;

      for (i = 0; i < wisps.length; i++) {
        p = wisps[i];
        t = p.t0 + Math.sin(p.ph + time * p.rate) * p.swayT;
        d = p.d0 + Math.sin(p.ph2 + time * p.rate2) * p.swayD;
        a = p.alpha * fade(d) * intensity * (1 + Math.sin(p.ph2 + time * p.rate) * p.breathe);
        if (a <= 0.002) continue;
        positionOf(p, t, d, pos);
        s = p.size * shortSide * (1 + Math.sin(p.ph + time * p.rate2) * 0.10);
        /* Area-preserving: the long axis grows by `stretch`, the short axis
           shrinks by the same factor, so `size` still means "how much material"
           and the two options stay independent in the tuner. */
        var sw = s * p.stretch, sh = s / p.stretch;
        ctx.save();
        ctx.translate(pos.x, pos.y + oy);
        ctx.rotate(p.rot + time * p.spin);
        ctx.globalAlpha = clamp(a, 0, 1);
        ctx.drawImage(p.sprite, -sw / 2, -sh / 2, sw, sh);
        ctx.restore();
      }

      for (i = 0; i < motes.length; i++) {
        p = motes[i];
        t = p.t0 + Math.sin(p.ph + time * p.rate) * p.swayT;
        d = p.d0 + Math.sin(p.ph2 + time * p.rate2) * p.swayD;
        a = p.alpha * fade(d) * intensity;
        if (p.tw) a *= 1 - p.tw * (0.5 + 0.5 * Math.sin(p.ph2 + time * p.twRate));
        if (a <= 0.002) continue;
        positionOf(p, t, d, pos);
        s = p.size;
        ctx.globalAlpha = clamp(a, 0, 1);
        ctx.drawImage(p.sprite, pos.x - s / 2, pos.y + oy - s / 2, s, s);
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    /* ---- loop ---- */

    function frame(now) {
      raf = 0;
      if (!t0) { t0 = now; lastPaint = 0; }
      if (now - lastPaint >= PAINT_MS) {
        lastPaint = now;
        draw(((now - t0) / 1000) * Math.max(0, num(opts.drift, DEFAULTS.drift)));
      }
      if (running) raf = global.requestAnimationFrame(frame);
    }

    function start() {
      /* Three separate reasons to stay still, and all of them mean "paint once,
         then stop": reduced motion, drift zeroed, and the row off screen. The
         still frame still has to be painted — an empty canvas is not a static
         state, it is a missing layer. */
      if (mqReduce.matches || !visible) {
        stop();
        draw(0);
        return;
      }
      if (running) return;
      running = true;
      if (!raf) raf = global.requestAnimationFrame(frame);
    }

    function stop() {
      running = false;
      if (raf) { global.cancelAnimationFrame(raf); raf = 0; }
    }

    /* ---- wiring ---- */

    function onScroll() { readProgress(); if (!running) draw(0); }

    function onResize() {
      if (measure()) { readProgress(); if (!running) draw(0); }
    }

    var io = null;
    if (global.IntersectionObserver) {
      /* 25% margin so the field is already settled by the time the row edges in;
         starting the loop at first pixel means the parallax jumps from its
         stored value to its live one in the first frame anyone can see. */
      io = new global.IntersectionObserver(function (entries) {
        visible = entries[entries.length - 1].isIntersecting;
        if (visible) { readProgress(); start(); } else { stop(); }
      }, { rootMargin: '25% 0px 25% 0px' });
      io.observe(mediaEl);
    }

    var ro = null;
    if (global.ResizeObserver) {
      ro = new global.ResizeObserver(onResize);
      ro.observe(mediaEl);
    }

    function onReduceChange() { measure(); readProgress(); start(); }
    if (mqReduce.addEventListener) mqReduce.addEventListener('change', onReduceChange);
    else if (mqReduce.addListener) mqReduce.addListener(onReduceChange);

    global.addEventListener('scroll', onScroll, { passive: true });
    global.addEventListener('resize', onResize);

    measure();
    build();
    readProgress();
    draw(0);
    start();

    /* ---- handle ---- */

    return {
      /* Live retune. Rebuilds the population unconditionally — a hundred
         particles and a dozen 128px sprites is well under a frame, and the
         alternative is a dirty-flag matrix over fifteen options that will be
         wrong the first time someone adds a sixteenth. */
      setOptions: function (next) {
        assign(opts, next);
        wrap.setAttribute('data-ksfg-blend', String(opts.blend));
        t0 = 0;
        measure();
        build();
        readProgress();
        draw(0);
        start();
        return this;
      },
      /* Current merged options, as a plain object. The lab's Copy button reads
         this so what gets pasted into a call site is exactly what was on screen. */
      getOptions: function () {
        var o = {}, key;
        for (key in opts) if (opts.hasOwnProperty(key)) o[key] = opts[key];
        return o;
      },
      destroy: function () {
        stop();
        global.removeEventListener('scroll', onScroll);
        global.removeEventListener('resize', onResize);
        if (mqReduce.removeEventListener) mqReduce.removeEventListener('change', onReduceChange);
        else if (mqReduce.removeListener) mqReduce.removeListener(onReduceChange);
        if (io) io.disconnect();
        if (ro) ro.disconnect();
        if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
        if (addedHostClass) mediaEl.classList.remove('ksfg-host');
        wisps = motes = wispSprites = moteSprites = [];
      }
    };
  }

  /* Shallow merge that ignores undefined, so a lab panel can hand over a sparse
     object without wiping defaults it does not have a control for. */
  function assign(target, src) {
    if (!src) return target;
    for (var k in src) {
      if (src.hasOwnProperty(k) && src[k] !== undefined) target[k] = src[k];
    }
    return target;
  }

  global.KSFilmrowFG = {
    attach: attach,
    /* Read-only-by-convention copy of the tuned defaults, so a lab can build its
       sliders from the module rather than from a second hand-kept list that
       drifts out of step the first time a default moves. */
    defaults: DEFAULTS
  };
})(window);
