/* ==========================================================================
   FIELD VARIANT — HALO  (behaviour)
   Partner file: css/field/v-halo.css. One of five competing readings of the
   same problem: at rest the left and right thirds of the navigator are empty
   and the composition reads unfinished.

   HALO'S ANSWER IS AIR, NOT MARKS.

   Another variant owns leader lines; this one has none, on purpose. Its job in
   the comparison is to answer a single question — did the emptiness need
   STRUCTURE, or did it only need COMPANY? So everything here is either type or
   a curve, and there is deliberately less of both than the brief allows.

   TWO LAYERS
     1. The geometry substrate — a vesica / flower-of-life construction built
        from ONE unit radius and centred on the spine's axis. Circles, never the
        straight-line Metatron construction the sibling variant uses.
     2. The marginalia — the seven chakras at their true heights, SPLIT across
        the two margins: the naming on the left, the measure on the right. See
        buildMarginalia() for why the split is the restraint move and not a
        gimmick.

   NO IDLE FRAME LOOP. This project runs zero idle requestAnimationFrame and
   that is a measured, defended property, so the only reactivity here is a
   pointermove listener, which fires while the hand moves and not otherwise.
   Nothing in the CSS animates on a timer either — an infinite keyframe would
   repaint forever, which costs the same battery the rAF ban was protecting.
   ========================================================================== */
(function () {
  'use strict';

  var SVG_NS = 'http://www.w3.org/2000/svg';

  /* The seven, top to bottom, exactly as the five variants agreed them so the
     comparison is about design and not about drifting data. `y` is percent from
     the top of the stage — the same convention .spine-node uses for its --y, so
     a chakra block and a node at the same percentage genuinely line up. */
  var CHAKRAS = [
    { idx: 'VII', name: 'SAHASRARA',    english: 'Crown',        hz: 963, y: 12 },
    { idx: 'VI',  name: 'AJNA',         english: 'Third Eye',    hz: 852, y: 27 },
    { idx: 'V',   name: 'VISHUDDHA',    english: 'Throat',       hz: 741, y: 40 },
    { idx: 'IV',  name: 'ANAHATA',      english: 'Heart',        hz: 639, y: 53 },
    { idx: 'III', name: 'MANIPURA',     english: 'Solar Plexus', hz: 528, y: 66 },
    { idx: 'II',  name: 'SVADHISTHANA', english: 'Sacral',       hz: 417, y: 79 },
    { idx: 'I',   name: 'MULADHARA',    english: 'Root',         hz: 396, y: 92 }
  ];

  /* Geometry is authored in a 1440x900 viewBox — the target viewport — and the
     SVG then covers whatever the stage actually is (preserveAspectRatio slice).
     Authoring at the target size means every number below can be read against
     the real composition: the spine column is ~380px wide, so anything inside
     x = 720 +/- 190 is BEHIND the spine and anything past ~530/910 is in the
     empty third this variant exists to fill. */
  var VB_W = 1440, VB_H = 900, CX = 720, CY = 450;

  /* The whole construction descends from ONE radius. That is the point of
     sacred geometry and it is also why this file has almost no magic numbers:
     every circle below is R, 2R or 3R, or sits at a lattice distance derived
     from R. Retuning the substrate is a single-number edit. */
  var R = 230;

  /* How near the cursor has to get before a chakra lifts, in CSS px. Rows are
     ~13% of 900px apart (~117px), so a reach of 280 overlaps its neighbours —
     that is intended. The falloff below is squared, which keeps the lift late
     and local: at 140px away (a whole row's distance) the neighbour is only at
     0.25, so one block is clearly THE one without the others going dark. */
  var REACH = 280;

  var rows = [];          /* [{ el, blocks: [nameBlock, measureBlock] }] */
  var rects = [];         /* viewport rects, measured lazily — see measure() */
  var needsMeasure = true;
  var litRow = -1;
  var litValue = -1;
  var bound = false;

  /* ------------------------------------------------------------------------
     GEOMETRY
     ------------------------------------------------------------------------ */

  function svgEl(name, parent, cls) {
    var el = document.createElementNS(SVG_NS, name);
    if (cls) el.setAttribute('class', cls);
    if (parent) parent.appendChild(el);
    return el;
  }

  function circle(parent, cx, cy, r) {
    var c = svgEl('circle', parent);
    c.setAttribute('cx', cx.toFixed(1));
    c.setAttribute('cy', cy.toFixed(1));
    c.setAttribute('r', r.toFixed(1));
    /* The SVG is scaled to cover the stage, so a plain stroke-width would grow
       with it and the substrate would stop being a hairline on tall viewports.
       Set as an attribute rather than in CSS: the property has thinner support
       than the presentation attribute, and this has to survive unseen. */
    c.setAttribute('vector-effect', 'non-scaling-stroke');
    return c;
  }

  /* Ring of `count` circles of radius `r`, centres at distance `d` from the
     axis, first one at `startDeg` measured anticlockwise from east. */
  function ringOfCircles(parent, d, r, startDeg, count) {
    var step = 360 / count;
    for (var k = 0; k < count; k++) {
      var t = (startDeg + k * step) * Math.PI / 180;
      circle(parent, CX + d * Math.cos(t), CY - d * Math.sin(t), r);
    }
  }

  function buildGeometry() {
    var svg = svgEl('svg', null, 'halo-geo');
    svg.setAttribute('viewBox', '0 0 ' + VB_W + ' ' + VB_H);
    /* slice, not meet: the substrate must COVER the stage at any aspect ratio.
       meet would letterbox it and leave the very corners — the emptiest part of
       the composition — bare, which is the opposite of the assignment. */
    svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    svg.setAttribute('focusable', 'false');
    svg.setAttribute('aria-hidden', 'true');

    /* Drawn back to front, faintest structure first, so the one warm circle
       ends up on top of the cool ones where they cross. */

    /* The outer halo — two bare concentric rings at 2R and 3R. 3R reaches
       x = 720 +/- 690, i.e. within 30px of a 1440 frame, and the CSS mask fades
       it almost to nothing out there. A ring that dissolves before it closes
       reads as continuation rather than as a border, which is the difference
       between a substrate and a vignette. */
    var halo = svgEl('g', svg, 'halo-geo__rings');
    circle(halo, CX, CY, R * 2);
    circle(halo, CX, CY, R * 3);

    /* The bloom — the flower's second lattice ring, six circles at R*sqrt(3)
       from the axis. These are the ones doing the actual work of the brief:
       their bodies swing out to roughly x = 170 and x = 1270, straight through
       the empty thirds, as curves rather than as marks. */
    var bloom = svgEl('g', svg, 'halo-geo__bloom');
    ringOfCircles(bloom, R * Math.sqrt(3), R, 0, 6);

    /* The seed of life — six circles of radius R at distance R. Seven circles
       once the core below is counted, for seven chakras; that rhyme is the
       reason this variant stops at the seed instead of continuing to the
       nineteen-circle flower, which would have been busier and said less.
       Started at 90deg so two of the six sit exactly ON the vertical axis,
       which is what puts a true vesica lens over the spine rather than beside
       it — the whole point of choosing vesica over Metatron here. */
    var seed = svgEl('g', svg, 'halo-geo__seed');
    ringOfCircles(seed, R, R, 90, 6);

    /* The core. One circle, on the axis, in the node amber — the only warm mark
       in the entire variant. It is what the thing is named for: a halo around
       the spine, stated once and never repeated. */
    var core = circle(svg, CX, CY, R);
    core.setAttribute('class', 'halo-geo__core');

    return svg;
  }

  /* ------------------------------------------------------------------------
     MARGINALIA
     ------------------------------------------------------------------------ */

  function div(cls, parent) {
    var el = document.createElement('div');
    el.className = cls;
    if (parent) parent.appendChild(el);
    return el;
  }

  function span(cls, text, parent) {
    var el = document.createElement('span');
    el.className = cls;
    el.textContent = text;
    if (parent) parent.appendChild(el);
    return el;
  }

  function buildMarginalia() {
    var wrap = div('halo-margins');

    for (var i = 0; i < CHAKRAS.length; i++) {
      var c = CHAKRAS[i];

      /* A row is a zero-height rule across the full stage at the chakra's true
         height, carrying no ink of its own. It exists so the two halves are ONE
         record: they light together, they recede together, and a later pass
         cannot accidentally desynchronise them. */
      var row = div('halo-row', wrap);
      row.style.setProperty('--y', c.y + '%');

      /* THE SPLIT. The obvious reading of "blocks in both margins" is to repeat
         all seven on each side, and that was tried on paper and rejected: it
         doubles the ink to say nothing new, in the variant whose entire brief is
         restraint. So the record is split the way an anatomical plate splits it
         — naming on one side, measure on the other, at the same height. The eye
         draws the line between them for free, which is how this variant gets
         the reading of a callout diagram while owning no leader lines at all. */
      var nameBlock = div('halo-block halo-block--name', row);
      span('halo-name', c.name, nameBlock);
      span('halo-english', c.english, nameBlock);

      var measureBlock = div('halo-block halo-block--measure', row);
      var hz = span('halo-hz', c.hz + ' ', measureBlock);
      span('halo-unit', 'HZ', hz);
      span('halo-index', c.idx, measureBlock);

      rows.push({ el: row, blocks: [nameBlock, measureBlock] });
    }

    return wrap;
  }

  /* ------------------------------------------------------------------------
     REVEAL ON APPROACH

     The entrance headline is "Knowledge Hidden in Plain Sight", so the seven
     rest below the threshold of notice and surface only for the hand that goes
     looking. That is the one piece of reactivity in this variant, and it is
     literal rather than decorative.
     ------------------------------------------------------------------------ */

  /* Rects are measured on the first move rather than at mount. Mount happens
     while the host is still assembling the stage and before webfonts settle, so
     anything measured there is measuring the wrong layout; deferring also keeps
     mount() free of a forced synchronous layout. */
  function measure() {
    rects.length = 0;
    for (var i = 0; i < rows.length; i++) {
      var pair = [];
      for (var k = 0; k < 2; k++) {
        var r = rows[i].blocks[k].getBoundingClientRect();
        /* A block hidden by the narrow-viewport rules reports a zero rect at
           the document origin, which would otherwise sit invitingly close to a
           cursor in the top-left corner and light the wrong row. */
        if (r.width > 0) pair.push(r);
      }
      rects.push(pair);
    }
    needsMeasure = false;
  }

  function invalidate() { needsMeasure = true; }

  /* Distance from a point to a rectangle — zero when the point is inside it.
     Rectangle rather than centre because the blocks are wide and short: measured
     to their centres, the far end of SVADHISTHANA would feel further away than
     the near end of ANAHATA, and the wrong row would light. */
  function distanceTo(rect, x, y) {
    var dx = Math.max(rect.left - x, 0, x - rect.right);
    var dy = Math.max(rect.top - y, 0, y - rect.bottom);
    return Math.sqrt(dx * dx + dy * dy);
  }

  function setLift(index, value) {
    if (index !== litRow) {
      if (litRow > -1) {
        /* Removing rather than zeroing lets the CSS declaration supply the rest
           state, so there is one place that decides what "unlit" means. */
        rows[litRow].el.style.removeProperty('--halo-lift');
      }
      litRow = index;
      /* Forget the cached value with the row it belonged to. Without this, a
         hand crossing from one chakra to the next at the same distance would
         match the previous row's value, the write would be skipped as a no-op,
         and the new row would stay dark — the effect failing precisely at the
         moment it is being used. */
      litValue = -1;
    }
    if (index < 0 || value === litValue) return;
    litValue = value;
    rows[index].el.style.setProperty('--halo-lift', value);
  }

  function onMove(e) {
    if (needsMeasure) measure();

    var nearest = -1, nearestD = Infinity;
    for (var i = 0; i < rects.length; i++) {
      for (var k = 0; k < rects[i].length; k++) {
        var d = distanceTo(rects[i][k], e.clientX, e.clientY);
        if (d < nearestD) { nearestD = d; nearest = i; }
      }
    }

    if (nearest < 0 || nearestD >= REACH) { setLift(-1, 0); return; }

    /* Squared falloff — see REACH. Quantised to twentieths so a slow hand does
       not push a fresh style write on every one of a hundred pointer samples;
       the CSS transition smooths the steps back out. */
    var lift = 1 - nearestD / REACH;
    setLift(nearest, Math.round(lift * lift * 20) / 20);
  }

  function bind() {
    /* Approach is a pointer idea. A touch screen has no approach — the finger
       is either absent or already arrived — so on coarse pointers the seven
       simply sit at their rest contrast, which is a legible design in itself
       and costs nothing to run. */
    if (!window.matchMedia || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('resize', invalidate, { passive: true });
    window.addEventListener('scroll', invalidate, { passive: true });
    bound = true;
  }

  function unbind() {
    if (!bound) return;
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('resize', invalidate);
    window.removeEventListener('scroll', invalidate);
    bound = false;
  }

  /* ------------------------------------------------------------------------
     MODULE
     ------------------------------------------------------------------------ */

  window.__field = window.__field || {};
  window.__field.halo = {
    mount: function (root) {
      if (!root) return;
      /* Mounting twice must not leave two sets of listeners on the window or a
         stale rows[] pointing at detached nodes. */
      this.unmount(root);

      var host = div('halo');
      host.appendChild(buildGeometry());
      host.appendChild(buildMarginalia());
      root.appendChild(host);

      needsMeasure = true;
      bind();
    },

    unmount: function (root) {
      unbind();
      rows.length = 0;
      rects.length = 0;
      litRow = -1;
      litValue = -1;
      needsMeasure = true;
      if (root) root.innerHTML = '';
    }
  };
})();
