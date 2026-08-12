/* ==========================================================================
   CALIBRATION — READOUT's information over a labelled Seed of Life
   Partner file: css/field/v-calibration.css. Built Aug 11 2026.

   Expression two of the pair the owner settled. The site footer is expression
   one; this is the same system stated on the navigator, and the two share
   js/ks-chakras.js so a frequency is defined once and cannot disagree with
   itself across the site.

   WHAT IT IS. The owner liked READOUT's information density and HALO's
   circles, and asked for the circles rebuilt as the circle of life carrying
   the chakra names and frequencies.

   WHAT IT IS NOT, and this is worth being exact about: it is NOT
   READOUT + HALO. Composing those two the way FUSION composed PLATE and
   MANDALA would put TWO labellings of the same seven centres on screen --
   HALO's marginalia down both margins and READOUT's calibration ladder in
   column B -- which is the one thing FUSION proved a composition cannot
   afford. So this takes READOUT whole, and draws its own Seed of Life rather
   than borrowing HALO's rings, which are a seed-plus-bloom construction with
   no labels and no way to carry any.

   THE SUBTRACTION IS THE SAME IDEA AS FUSION'S. READOUT's own chakra ladder
   is switched off in CSS, because the seed now carries those seven names and
   frequencies on its circle centres. Everything else READOUT states -- the
   station block, the record, the harmonics, the channels -- is untouched and
   is exactly why this reading exists.

   SEED, NOT FLOWER. Seven circles: one centre, six around it at exactly one
   radius, so every circle passes through the centre point. Seven circles,
   seven centres, seven frequencies, nothing left over and nothing invented.
   The flower is nineteen and twelve of them would carry nothing.
   ========================================================================== */
(function () {
  'use strict';

  var SVGNS = 'http://www.w3.org/2000/svg';
  function s(tag, attrs) {
    var el = document.createElementNS(SVGNS, tag);
    for (var k in attrs) if (attrs.hasOwnProperty(k)) el.setAttribute(k, attrs[k]);
    return el;
  }

  var slots = {};
  function slot(root, name) {
    if (!slots[name] || slots[name].parentNode !== root) {
      var d = document.createElement('div');
      d.className = 'cal-slot cal-slot--' + name;
      root.appendChild(d);
      slots[name] = d;
    }
    return slots[name];
  }

  /* A real box, not display:contents. FUSION learned this the hard way: a
     boxless wrapper has no rect, and a parent that sizes itself from
     getBoundingClientRect() measures 0x0 and builds nothing, silently. */

  function drawSeed(root) {
    var KS = window.KS;
    if (!KS || !KS.CHAKRAS) { console.warn('v-calibration: js/ks-chakras.js must load first'); return; }

    var W = 1440, H = 900, R = 168, cx = W / 2, cy = H / 2;
    var svg = s('svg', { class: 'cal-seed', viewBox: '0 0 ' + W + ' ' + H,
                         preserveAspectRatio: 'xMidYMid slice', 'aria-hidden': 'true' });

    /* Six around one, starting at -90deg so a circle sits ON the vertical
       axis. That matters here in a way it did not in the footer: the spine is
       a column, and a seed whose first circle is directly above the centre
       reads as a body with a crown rather than as a wheel lying on its side. */
    var pts = [[cx, cy]];
    for (var i = 0; i < 6; i++) {
      var a = (-90 + i * 60) * Math.PI / 180;
      pts.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R]);
    }

    var ring = s('g', { class: 'cal-seed__ring' });
    pts.forEach(function (p) {
      ring.appendChild(s('circle', { cx: p[0].toFixed(1), cy: p[1].toFixed(1), r: R }));
    });
    svg.appendChild(ring);

    /* The rim: tangent to all six outer circles at 2R, so it is exact rather
       than decorative -- the one line that closes the figure without being
       part of the construction. */
    svg.appendChild(s('circle', { class: 'cal-seed__rim', cx: cx, cy: cy, r: R * 2 }));

    var labels = s('g', { class: 'cal-seed__labels' });
    KS.CHAKRAS.forEach(function (c, i) {
      var p = pts[i]; if (!p) return;
      var g = s('g', { class: 'cal-seed__mark', 'data-n': c.n });
      g.appendChild(s('circle', { class: 'cal-seed__dot', cx: p[0].toFixed(1), cy: p[1].toFixed(1), r: 2.5 }));
      var n = s('text', { class: 'cal-seed__name', x: p[0].toFixed(1), y: (p[1] - 8).toFixed(1) });
      n.textContent = c.name;
      var h = s('text', { class: 'cal-seed__hz', x: p[0].toFixed(1), y: (p[1] + 15).toFixed(1) });
      h.textContent = c.hz + ' HZ';
      var e = s('text', { class: 'cal-seed__en', x: p[0].toFixed(1), y: (p[1] + 27).toFixed(1) });
      e.textContent = c.en.toUpperCase();
      g.appendChild(n); g.appendChild(h); g.appendChild(e);
      labels.appendChild(g);
    });
    svg.appendChild(labels);
    root.appendChild(svg);
  }

  /* ------------------------------------------------------------------------
     THE TORCH — the seven are HIDDEN until you go looking for them.

     The owner's call, and it is the brand's own thesis applied to the one
     surface that had been ignoring it: the entrance headline is literally
     "Knowledge Hidden in Plain Sight", and a diagram that states all seven
     names at rest is not hiding anything. At rest the seed is seven circles
     and seven amber dots -- a construction with marked points and no legend.
     The legend is what the pointer is for.

     SMALL, deliberately. REACH is 150px, which lights roughly one mark at a
     time: the reader is carrying a light across a diagram, not switching a
     room on. A wide radius would reveal four at once and the effect would read
     as a fade rather than as a search.

     MEASURED IN SCREEN SPACE, not viewBox space. The SVG is
     preserveAspectRatio="slice", so mapping a pointer into its coordinates
     means reproducing the cover-scale and both offsets -- three chances to be
     subtly wrong at some viewport nobody tested. getBoundingClientRect() on
     each mark gives the answer directly and is correct by construction. The
     rects are cached and invalidated on resize, so the per-move cost is
     arithmetic over seven points and nothing else.

     NO IDLE LOOP. One rAF per burst of movement, guarded by `pending`, never
     re-arming -- the same shape READOUT uses. An idle page schedules nothing.
     ------------------------------------------------------------------------ */
  var REACH = 150, STEPS = 20;
  var torch = null;

  function bindTorch(root) {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      /* No pointer to reward, or motion suppressed: show the seven at a low
         steady contrast instead. Hiding them from a reader who has no way to
         reveal them would leave the figure with no legend at all. */
      document.documentElement.classList.add('cal-static');
      return;
    }
    var marks = [].slice.call(root.querySelectorAll('.cal-seed__mark'));
    if (!marks.length) return;
    var rects = null, pending = false, px = 0, py = 0, last = [];

    function measure() {
      rects = marks.map(function (m) {
        var r = m.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      });
    }
    function apply() {
      pending = false;
      if (!rects) measure();
      for (var i = 0; i < marks.length; i++) {
        var d = Math.hypot(px - rects[i].x, py - rects[i].y);
        var t = Math.max(0, 1 - d / REACH);
        t = t * t * (3 - 2 * t);                    /* smoothstep, so the edge of
                                                       the pool is not a hard ring */
        var step = Math.round(t * STEPS);
        if (step === last[i]) continue;             /* write only on change */
        last[i] = step;
        marks[i].style.setProperty('--lift', (step / STEPS).toFixed(2));
      }
    }
    function onMove(e) {
      px = e.clientX; py = e.clientY;
      if (pending) return;
      pending = true;
      requestAnimationFrame(apply);
    }
    function onLeave() {
      for (var i = 0; i < marks.length; i++) {
        if (last[i] !== 0) { last[i] = 0; marks[i].style.setProperty('--lift', '0'); }
      }
    }
    function onResize() { rects = null; }

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerleave', onLeave);
    window.addEventListener('resize', onResize);
    torch = function () {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('resize', onResize);
      torch = null;
    };
  }

  window.__field = window.__field || {};
  window.__field.calibration = {

    mount: function (root) {
      /* READOUT's stylesheet is scoped under html.v-readout; without the class
         it would build its four columns and render them completely unstyled. */
      document.documentElement.classList.add('v-readout');
      var ro = window.__field && window.__field.readout;
      if (ro) ro.mount(slot(root, 'readout'));
      else console.warn('v-calibration: parent module missing — readout');
      drawSeed(slot(root, 'seed'));
      bindTorch(root);
    },

    unmount: function (root) {
      var ro = window.__field && window.__field.readout;
      if (ro) ro.unmount(slot(root, 'readout'));
      /* The listeners are on WINDOW, so they outlive the DOM they were built
         for. Dropping them here is not tidiness -- switching readings away and
         back would otherwise stack a second set on top of the first, each
         writing to marks the other had already removed. */
      if (torch) torch();
      document.documentElement.classList.remove('v-readout', 'cal-static');
      slots = {};
      root.innerHTML = '';
    }
  };
})();
