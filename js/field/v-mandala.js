/* ==========================================================================
   FIELD VARIANT — MANDALA                        (partner: css/field/v-mandala.css)

   The geometry-dominant reading of the empty thirds. The other four variants
   answer "what goes in the margins"; this one refuses the question and asks
   whether the navigator is a DIAGRAM rather than a page — one large Metatron's
   cube built on the spine's axis, the seven registered against its rim, and
   almost no type.

   WHY THE CONSTRUCTION IS GENERATED AND NOT DRAWN BY HAND
   The Fruit of Life is thirteen tangent circles on a triangular lattice and the
   cube is every one of the 78 chords between their centres. Hand-authored SVG
   for that is 78 pairs of coordinates a human eyeballed, and an eyeballed
   Metatron's cube is instantly wrong to anyone who knows the figure — the
   inner and outer rings stop being collinear with the centre and the six long
   spokes bend. This brand's whole thesis is coded knowledge, so the figure is
   computed from one number (the rim radius) and nothing else.

   THE ONE PLACEMENT DECISION WORTH ARGUING WITH
   The construction is centred on the HEART (y 53%), not on the middle of the
   stage. That is the only exact coincidence between the diagram and the body
   that this figure actually offers — see COINCIDE below — and spending it on
   Anahata is what makes "the geometry and the body are the same diagram at
   different scales" a true statement here instead of a caption.

   NO ROTATION, DELIBERATELY. A slow @keyframes spin is the obvious move on a
   mandala and it is the wrong one on this page: the reading cards open ON TOP
   of this layer and people read them. Anything turning underneath a paragraph
   is read as the paragraph drifting. The only reactivity is a pointer lens
   (see LENS), which fires on pointermove and never when the pointer is still.
   No rAF, no interval — this project runs zero idle frames and that is a
   measured, defended property, not an accident.
   ========================================================================== */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';

  /* The seven, top to bottom. Verbatim across all five variants so the
     comparison is of compositions and not of data. Transliterated Latin only:
     no Devanagari face is loaded and a missing glyph would fall back to a
     tofu box, which is a worse failure than plain letters.

     `en` is carried and NOT drawn. It is here so the table stays copyable
     between the five variants without an edit; MANDALA's brief is numbers and
     frequencies, and CROWN / THIRD EYE is the prose the other readings spend
     their margins on. Deleting it would make the next variant's table differ
     from this one for no reason, which is how five variants stop comparing. */
  var CHAKRAS = [
    { n: 7, name: 'SAHASRARA',    en: 'CROWN',        hz: 963, y: 12 },
    { n: 6, name: 'AJNA',         en: 'THIRD EYE',    hz: 852, y: 27 },
    { n: 5, name: 'VISHUDDHA',    en: 'THROAT',       hz: 741, y: 40 },
    { n: 4, name: 'ANAHATA',      en: 'HEART',        hz: 639, y: 53 },
    { n: 3, name: 'MANIPURA',     en: 'SOLAR PLEXUS', hz: 528, y: 66 },
    { n: 2, name: 'SVADHISTHANA', en: 'SACRAL',       hz: 417, y: 79 },
    { n: 1, name: 'MULADHARA',    en: 'ROOT',         hz: 396, y: 92 }
  ];

  /* ---- THE FIVE NUMBERS. Everything else in this file is derived. ---------

     RIM_W_MAX / TOP_PAD size the figure. The rim radius is
         R = min(RIM_W_MAX * w, 0.53h - TOP_PAD)
     and on a 1440x900 stage the height term wins at R = 451px, so the figure
     spans 902px of 1440 and its outermost circles reach 211px into each 480px
     third — with the register's type carrying on out to about 545px from the
     axis. That is the whole point of this variant, so if it has to be dialled
     back, dial the OPACITIES first and this second.

     Only the top clearance is enforced. The rim therefore runs about 28px past
     the foot of a 900px stage, which is intentional: the CONSTRUCTION is fully
     visible (its own vertical reach is 0.893R, so it clears both edges), and
     only the added bounding circle bleeds. The gap that leaves at dead-bottom
     centre is where spine-lab's CONTINUE / ARROW KEYS marker sits, so the two
     stay out of each other's way.

     SPINE_BAND / SPINE_DIM are the guard on "never overpower the spine". The
     figure is masked down to SPINE_DIM in a soft band SPINE_BAND wide either
     side of the axis — which is where the centre circle, the inner ring and
     all six spoke crossings live. The z-order alone is not enough insurance:
     the field is z-index 1 and the spine is 10, but the wireframe is a
     transparent PNG at 0.64 opacity, so anything busy behind it reads THROUGH
     it as texture on the bone. */
  var RIM_W_MAX  = 0.46;
  var TOP_PAD    = 26;
  var SPINE_BAND = 250;
  var SPINE_DIM  = 0.40;

  /* COINCIDE — how close a construction row has to be to a chakra height,
     as a fraction of stage height, before it is marked as the same point.

     This is computed rather than staged, and the honest result at 1440x900 is
     that there is exactly ONE: the centre circle on Anahata, which is exact
     because the figure is centred there. The other four rows land 39-57px off
     the nearest chakra and nothing legitimate closes that gap — the seven are
     spaced 13% apart (15% at the crown) and the construction's rows are spaced
     0.3464R apart, and the only R that reconciles them is 338px, which is a
     figure small enough to leave the thirds as empty as they started.

     So MANDALA shows the near-misses AS near-misses. That is more interesting
     than a fake alignment and it is the actual finding: the body's rhythm and
     the diagram's rhythm are not the same rhythm at this scale. Raising this
     to 0.045 lights the throat, solar plexus and root rows too, at the cost of
     claiming a correspondence that is 39px wrong. */
  var COINCIDE = 0.02;

  var LENS_R = 260;   /* radius of the pointer lens, px */

  function f(n) { return Math.round(n * 100) / 100; }

  function svg(name, attrs) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) {
      if (Object.prototype.hasOwnProperty.call(attrs, k)) e.setAttribute(k, attrs[k]);
    }
    return e;
  }

  /* ---- THE CONSTRUCTION ---------------------------------------------------
     Thirteen circle centres of radius r, returned in local coordinates around
     (0,0):
        index 0      the centre circle
        index 1-6    the inner ring, centres at 2r  — tangent to the centre and
                     to each other
        index 7-12   the outer ring, centres at 4r  — tangent to the inner ring
                     and COLLINEAR with it through the centre, which is the
                     property most approximations lose

     Ring angles are 0, 60, ... 300 degrees, i.e. VERTICES LEFT AND RIGHT. The
     other legal orientation (30, 90, ...) puts five of the thirteen centres
     directly on the spine, which is the more meaningful figure and the wrong
     one for this brief: it is 11% narrower and its extra height is height this
     stage does not have, so it would surrender exactly the horizontal reach
     the variant exists to test. Rotate by adding Math.PI/6 to `a` if you want
     to see it. */
  function construct(R) {
    var r = R / 5;          /* the rim passes through the outer circles' far
                               edges: 4r + r = 5r = R, tangent at six points. */
    var c = [{ x: 0, y: 0 }];
    var k, a;
    for (k = 0; k < 6; k++) {
      a = k * Math.PI / 3;
      c.push({ x: 2 * r * Math.cos(a), y: 2 * r * Math.sin(a) });
    }
    for (k = 0; k < 6; k++) {
      a = k * Math.PI / 3;
      c.push({ x: 4 * r * Math.cos(a), y: 4 * r * Math.sin(a) });
    }
    return { r: r, c: c };
  }

  /* ---- module state, so unmount can undo everything it did ---- */
  var host = null;
  var lensGrad = null;
  var box = null;
  var resizeTimer = 0;
  var retries = 0;

  function measure() {
    if (host) box = host.getBoundingClientRect();
  }

  function onMove(e) {
    if (!lensGrad || !box) return;
    lensGrad.setAttribute('cx', f(e.clientX - box.left));
    lensGrad.setAttribute('cy', f(e.clientY - box.top));
  }

  function onScroll() { measure(); }

  function onResize() {
    /* A one-shot debounce, not a loop: the timer is armed by the event and
       disarmed by the rebuild. The figure is laid out in stage PIXELS (the
       viewBox is 1:1 with the box) so that type never scales with the frame,
       which means a resize genuinely has to rebuild rather than just stretch. */
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      resizeTimer = 0;
      if (host) build(host);
    }, 150);
  }

  function build(root) {
    root.innerHTML = '';

    var rect = root.getBoundingClientRect();
    var w = Math.round(rect.width);
    var h = Math.round(rect.height);
    /* Not laid out yet — only reachable if mount() lands before the stage has
       height. THREE deferred retries and then it gives up, deliberately: an
       uncapped "try again in 80ms" is a setInterval wearing a different hat,
       and this project runs no idle timers. If the field is genuinely never
       sized the right outcome is an empty layer, not a heartbeat. The resize
       listener is still live and will build it the moment anything moves. */
    if (w < 2 || h < 2) {
      if (!resizeTimer && retries < 3) {
        retries++;
        resizeTimer = setTimeout(function () {
          resizeTimer = 0;
          if (host) build(host);
        }, 80);
      }
      return;
    }
    retries = 0;
    box = rect;

    var cx = w / 2;
    var cy = h * 0.53;            /* the heart. See the header note. */
    var R  = Math.min(RIM_W_MAX * w, cy - TOP_PAD);
    if (R < 60) return;

    var g = construct(R);
    var c = g.c;
    var i, j, k, d;

    var s = svg('svg', {
      'class': 'mnd',
      viewBox: '0 0 ' + w + ' ' + h,
      width: '100%',
      height: '100%',
      focusable: 'false',
      'aria-hidden': 'true'
    });

    /* ---- defs: the spine guard, and the lens ---- */
    var defs = svg('defs', {});

    /* White with stop-opacity, never a grey stop-color. A luminance mask's
       treatment of grey depends on whether the engine linearises it first,
       which is genuinely ambiguous between engines; alpha is not. */
    var fade = svg('linearGradient', {
      id: 'mnd-fade', gradientUnits: 'userSpaceOnUse',
      x1: 0, y1: 0, x2: w, y2: 0
    });
    [[0, 1], [(cx - SPINE_BAND) / w, 1], [cx / w, SPINE_DIM],
     [(cx + SPINE_BAND) / w, 1], [1, 1]].forEach(function (st) {
      fade.appendChild(svg('stop', {
        offset: f(Math.min(1, Math.max(0, st[0])) * 100) + '%',
        'stop-color': '#fff', 'stop-opacity': st[1]
      }));
    });
    defs.appendChild(fade);

    /* THE MASK REGION IS DELIBERATELY BIGGER THAN THE STAGE, and this is not
       spare padding — it is the fix for a bug this had.

       A userSpaceOnUse mask CLIPS to its x/y/width/height. At 0,0,w,h that
       region stops at the foot of the stage, and the rim is drawn past it on
       purpose (see TOP_PAD) — so the bottom arc of the rim was masked to zero
       and simply vanished, leaving a figure that looked like it had been cut
       flat instead of bleeding off frame. The gradient itself needs no change:
       spreadMethod pads to its last stop, which is opaque white, so everything
       out here is unmasked exactly as intended. */
    var mask = svg('mask', {
      id: 'mnd-spine-guard', maskUnits: 'userSpaceOnUse',
      x: -w, y: -h, width: w * 3, height: h * 3
    });
    mask.appendChild(svg('rect', { x: -w, y: -h, width: w * 3, height: h * 3, fill: 'url(#mnd-fade)' }));
    defs.appendChild(mask);

    /* THE LENS. The diagram brightens where the pointer is, and only while the
       pointer is moving — the handler writes two attributes and returns. It is
       parked off-canvas until the first move so a page that is never touched
       never shows it. Delete the three lens blocks and the listener if it
       reads as a smudge; nothing else depends on them. */
    lensGrad = svg('radialGradient', {
      id: 'mnd-lens', gradientUnits: 'userSpaceOnUse',
      cx: -9999, cy: -9999, r: LENS_R
    });
    lensGrad.appendChild(svg('stop', { offset: '0%',   'stop-color': '#fff', 'stop-opacity': 1 }));
    lensGrad.appendChild(svg('stop', { offset: '55%',  'stop-color': '#fff', 'stop-opacity': 0.45 }));
    lensGrad.appendChild(svg('stop', { offset: '100%', 'stop-color': '#fff', 'stop-opacity': 0 }));
    defs.appendChild(lensGrad);

    var lensMask = svg('mask', {
      id: 'mnd-lens-mask', maskUnits: 'userSpaceOnUse',
      x: -w, y: -h, width: w * 3, height: h * 3
    });
    lensMask.appendChild(svg('rect', { x: -w, y: -h, width: w * 3, height: h * 3, fill: 'url(#mnd-lens)' }));
    defs.appendChild(lensMask);

    s.appendChild(defs);

    /* ---- the figure, all of it inside the spine guard ---- */
    var geo = svg('g', { id: 'mnd-geo', mask: 'url(#mnd-spine-guard)' });

    /* ALL 78 CHORDS, AS ONE PATH.
       One path element means one stroke operation, so the many places where
       chords lie on top of each other — every spoke carries three collinear
       pairs — do not accumulate into a darker line. Painting them as 78
       separate elements would make the six spokes read three times heavier
       than the rest of the web, which is the exact artefact that makes a
       generated Metatron's cube look hand-drawn. */
    d = [];
    for (i = 0; i < 13; i++) {
      for (j = i + 1; j < 13; j++) {
        d.push('M' + f(cx + c[i].x) + ' ' + f(cy + c[i].y) +
               'L' + f(cx + c[j].x) + ' ' + f(cy + c[j].y));
      }
    }
    geo.appendChild(svg('path', { 'class': 'mnd-web', d: d.join('') }));

    /* THE READ-ME LINES, drawn again on top at higher opacity: both hexagons,
       both hexagrams, and the six spokes. The full 78 is correct but it is a
       thicket — at a single flat opacity the figure reads as a grey haze and
       the cube stops being recognisable. These thirty segments are the ones a
       person actually traces when they look at it. They are a SUBSET of the
       78, not additions; nothing here is outside the construction. */
    d = [];
    function seg(a, b) {
      d.push('M' + f(cx + c[a].x) + ' ' + f(cy + c[a].y) +
             'L' + f(cx + c[b].x) + ' ' + f(cy + c[b].y));
    }
    for (k = 0; k < 6; k++) {
      seg(1 + k, 1 + (k + 1) % 6);        /* inner hexagon */
      seg(7 + k, 7 + (k + 1) % 6);        /* outer hexagon */
      seg(0, 7 + k);                      /* spoke — passes through inner k */
    }
    [[1, 3, 5], [2, 4, 6], [7, 9, 11], [8, 10, 12]].forEach(function (t) {
      seg(t[0], t[1]); seg(t[1], t[2]); seg(t[2], t[0]);
    });
    geo.appendChild(svg('path', { 'class': 'mnd-frame', d: d.join('') }));

    /* the thirteen circles */
    var circles = svg('g', {});
    for (i = 0; i < 13; i++) {
      circles.appendChild(svg('circle', {
        'class': i === 0 ? 'mnd-circle mnd-circle--lit' : 'mnd-circle',
        cx: f(cx + c[i].x), cy: f(cy + c[i].y), r: f(g.r)
      }));
    }
    geo.appendChild(circles);

    /* the rim. NOT part of Metatron's cube — it is the mandala's frame, and it
       is admissible because it is exact rather than decorative: at radius 5r it
       is tangent to all six outer circles. It is also the line the seven are
       registered against, below. */
    geo.appendChild(svg('circle', { 'class': 'mnd-rim', cx: f(cx), cy: f(cy), r: f(R) }));

    /* ---- the seven, twice over -------------------------------------------
       Once as CHORDS of the rim at their true stage heights — the body's rows
       inscribed on the diagram — and once as marks where those chords meet the
       rim. The chords are the only non-radial thing in the figure and they are
       the first thing to cut if this starts reading as a grid; the arc of
       marks survives without them, it just looks less explained.

       x = sqrt(R^2 - dy^2) is a plain circle intersection, which is why the
       marks bulge to the full radius at the heart (dy = 0) and pull back in
       toward the axis at the crown and the root. That arc is the composition. */
    var reg = [];
    var dchord = [];
    for (i = 0; i < CHAKRAS.length; i++) {
      var ch = CHAKRAS[i];
      var yPx = h * ch.y / 100;
      var dy = yPx - cy;
      var x = Math.sqrt(Math.max(0, R * R - dy * dy));
      /* Only reachable on a window narrower than it is tall, where the width
         term wins and the crown can fall outside the rim. The CSS hides the
         register below 900px anyway; this is belt and braces against NaN. */
      if (x < R * 0.2) x = R * 0.2;
      dchord.push('M' + f(cx - x) + ' ' + f(yPx) + 'L' + f(cx + x) + ' ' + f(yPx));
      reg.push({ ch: ch, y: yPx, x: x });
    }
    geo.appendChild(svg('path', { 'class': 'mnd-chord', d: dchord.join('') }));

    /* the construction's own node points. Inside the guard on purpose: the
       five on the y-row through the heart sit on and beside the spine, where a
       full-strength dot would compete with the navigator's real amber node. */
    var lit = COINCIDE * h;
    var nodes = svg('g', {});
    for (i = 0; i < 13; i++) {
      var ny = cy + c[i].y;
      var near = null, best = 1e9;
      for (j = 0; j < CHAKRAS.length; j++) {
        var dd = Math.abs(h * CHAKRAS[j].y / 100 - ny);
        if (dd < best) { best = dd; near = CHAKRAS[j]; }
      }
      var isLit = best <= lit;
      nodes.appendChild(svg('circle', {
        'class': isLit ? 'mnd-node mnd-node--lit' : 'mnd-node',
        cx: f(cx + c[i].x), cy: f(ny), r: isLit ? 3.4 : 2.4
      }));
      /* One numeral per lit ROW, hung on that row's outermost centre — where
         there is field to put it, rather than on the axis-most one, which is
         underneath the spine and its real node. Rows are compared by y because
         the construction has at most five of them and floating point is exact
         enough here: the two arms of a row are the same sin() term negated. */
      var maxX = -1e9;
      for (j = 0; j < 13; j++) {
        if (Math.abs(c[j].y - c[i].y) < 0.5 && c[j].x > maxX) maxX = c[j].x;
      }
      if (isLit && Math.abs(c[i].x - maxX) < 0.5) {
        var num = svg('text', {
          'class': 'mnd-node-idx',
          x: f(cx + c[i].x + 11), y: f(ny - 9)
        });
        num.textContent = '0' + near.n;
        nodes.appendChild(num);
      }
    }
    geo.appendChild(nodes);

    s.appendChild(geo);

    /* the lens rides above the figure and re-states it, masked to a soft disc */
    var lens = svg('g', { 'class': 'mnd-lens', mask: 'url(#mnd-lens-mask)' });
    var use = svg('use', {});
    use.setAttribute('href', '#mnd-geo');
    use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#mnd-geo');
    lens.appendChild(use);
    s.appendChild(lens);

    /* ---- THE REGISTER, and it is unmasked ---------------------------------
       It lives out past the rim at |x| >= 0.5R, well clear of the spine band,
       so the guard would only cost it contrast.

       ASYMMETRIC ON PURPOSE, which is the one liberty taken with a figure that
       is otherwise sixfold symmetric: the numeral alone on the left, the name
       and the frequency on the right. The geometry is symmetric; READING it is
       not — you come in on a number and leave with a name and a pitch. A
       mirrored register would double the type for no added information, and
       type is the thing this variant is supposed to be spending least of.

       Baselines are explicit px offsets rather than dominant-baseline. That
       attribute is supported everywhere now but its exact result still differs
       by a pixel or two between engines, and this type sits on a computed
       line where a two-pixel drift is visible. Nudge the +11 / +1 / +14 here
       if a face change moves them. */
    var rg = svg('g', { 'class': 'mnd-register' });
    for (i = 0; i < reg.length; i++) {
      var e = reg[i];

      rg.appendChild(svg('circle', { 'class': 'mnd-tick', cx: f(cx - e.x), cy: f(e.y), r: 2.6 }));
      rg.appendChild(svg('circle', { 'class': 'mnd-tick', cx: f(cx + e.x), cy: f(e.y), r: 2.6 }));

      var t = svg('text', { 'class': 'mnd-num', x: f(cx - e.x - 16), y: f(e.y + 11), 'text-anchor': 'end' });
      t.textContent = e.ch.n;
      rg.appendChild(t);

      t = svg('text', { 'class': 'mnd-hz', x: f(cx + e.x + 16), y: f(e.y + 1) });
      t.textContent = e.ch.hz + ' HZ';
      rg.appendChild(t);

      t = svg('text', { 'class': 'mnd-name', x: f(cx + e.x + 16), y: f(e.y + 14) });
      t.textContent = e.ch.name;
      rg.appendChild(t);
    }
    s.appendChild(rg);

    root.appendChild(s);
  }

  window.__field = window.__field || {};
  window.__field.mandala = {
    mount: function (root) {
      host = root;
      build(root);
      window.addEventListener('resize', onResize);
      window.addEventListener('scroll', onScroll, { passive: true });
      /* The lens is driven motion, so it goes away with everything else that
         moves. The CSS hides .mnd-lens under the same query; this stops the
         listener being bound at all. */
      if (!window.matchMedia || !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        window.addEventListener('pointermove', onMove, { passive: true });
      }
    },
    unmount: function (root) {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointermove', onMove);
      if (resizeTimer) { clearTimeout(resizeTimer); resizeTimer = 0; }
      retries = 0;
      host = null; lensGrad = null; box = null;
      root.innerHTML = '';
    }
  };
})();
