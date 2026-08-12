/* ==========================================================================
   CALIBRATION — READOUT's information over a Seed of Life
   Partner file: css/field/v-calibration.css. Built Aug 11 2026.

   Expression two of the pair. The site footer is expression one; both read
   js/ks-chakras.js, so a frequency is defined once and the two surfaces cannot
   disagree about what the throat is.

   THE SEED CARRIES NO LABELS, and that is a decision taken after building the
   alternative and looking at it.

   It began with all seven named on their circle centres -- name, frequency and
   English gloss -- revealed by a small torch. Three problems arrived in order:
   the centre circle sits exactly where the pointer travels to reach nodes 3
   and 4, so the crown's label ambushed the reader on the way to a click; the
   marks' amber is the navigator's own --node-color, so seven glowing dots read
   as seven more things to click; and the two that landed nearest the node
   string, AJNA and MANIPURA, were the worst of both.

   Three placements were built to solve the first problem -- moving the label
   off the axis, moving the whole figure off the axis, and suppressing the
   centre near a node. All three worked. None of them touched the second
   problem, which is the real one: ANY mark in that palette, anywhere on this
   stage, competes with the navigation for the same meaning. The owner's call
   was to stop tuning and remove the dots and the text outright.

   So the seed is now what it should probably always have been here: a
   construction. Seven circles, no legend, no marks, nothing that could be
   mistaken for a control. The names and frequencies live in READOUT's
   calibration ladder out in the left margin, which is where they were before
   this module suppressed them -- see the note in the CSS.

   WHAT WENT WITH THE LABELS: the torch, the three placement modes, the
   node-aware suppression, and the static fallback for coarse pointers. All of
   them existed to serve marks that no longer exist. Deleting them is the
   point; a switch with nothing behind it is worse than no switch.
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
    var W = 1440, H = 900, R = 168, cx = W / 2, cy = H / 2;
    var svg = s('svg', { class: 'cal-seed', viewBox: '0 0 ' + W + ' ' + H,
                         preserveAspectRatio: 'xMidYMid slice', 'aria-hidden': 'true' });

    /* Six around one at exactly one radius, so every circle passes through the
       centre point -- that tangency is what makes it a seed rather than a ring
       of circles. Started at -90deg so a circle sits ON the vertical axis: the
       figure then reads as a column with a crown rather than as a wheel lying
       on its side, which matters beside a spine. */
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
