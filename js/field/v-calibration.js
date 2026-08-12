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
    },

    unmount: function (root) {
      var ro = window.__field && window.__field.readout;
      if (ro) ro.unmount(slot(root, 'readout'));
      document.documentElement.classList.remove('v-readout');
      slots = {};
      root.innerHTML = '';
    }
  };
})();
