/* ==========================================================================
   FIELD VARIANT — GRATICULE  (behaviour)
   Partner file: css/field/v-graticule.css. One of five competing readings of
   the background field; the host mounts one at a time and sets html.v-graticule
   while this one is up.

   THE READING: the instrument, not the illustration. Nothing here NAMES
   anything. The stage is treated as a measured frame — ruled edges, an
   ordinate scale down the left, a targeting box around the column, and a
   frequency scale beside the spine where the seven centres appear as nothing
   but ticks and numbers. A visitor is not told what a chakra is; they are
   shown that the column is CALIBRATED, and that each point on it has a value.

   That is the deliberate split from the PLATE variant, which does the exact
   opposite job with the same seven rows. PLATE explains. GRATICULE measures.
   Judging them side by side is judging which of those two the navigator wants
   to be, so please do not let a later pass "improve" this one by adding the
   names back — that is not a refinement, it is a merge, and it would leave
   the comparison with nothing to decide.

   NO IDLE LOOP. The cursor rule is driven by pointermove only; it fires while
   the pointer moves and not otherwise. No rAF, no interval. The two writes
   per event (a transform variable and, when it changes, a readout string) are
   the entire cost.
   ========================================================================== */
(function () {
  'use strict';

  /* Numbers only. The order is top-down so the DOM order matches the visual
     order, which matters when someone is reading the generated markup in
     devtools trying to work out which tick is misplaced. */
  var SCALE = [
    { hz: 963, y: 12 },
    { hz: 852, y: 27 },
    { hz: 741, y: 40 },
    { hz: 639, y: 53 },
    { hz: 528, y: 66 },
    { hz: 417, y: 79 },
    { hz: 396, y: 92 }
  ];

  /* THE SCALE IS NOT LINEAR AND THE READOUT KNOWS IT.
     Read the table: 963 -> 852 -> 741 is a clean 111/111 per 15 and 13 points
     of height, but 417 -> 396 is 21Hz across the same 13 points as the 111Hz
     steps above it. Any y->Hz interpolation would therefore print numbers
     that disagree with the ticks it is sitting next to, which is exactly the
     kind of confident-and-wrong instrument this design language is supposed
     to be the opposite of.
     So the cursor reads out the ORDINATE — its own height as a percentage of
     the frame — and lets the frequency scale speak only at the seven places
     it actually has a value. */

  /* ---- geometry: the circle-and-square construction.
     Deliberately NOT Metatron — that figure belongs to the PLATE variant, and
     two variants quoting the same motif is two skins of one idea.

     This is ad quadratum: a square, the circle inscribed in it, the square
     inscribed in THAT rotated 45 degrees, and so on inward, each step
     shrinking by 1/root-2. It is the construction a draughtsman uses to
     divide a frame, which is why it belongs to the instrument reading rather
     than to the anatomical one.

     The one flourish is the ring of bearing ticks on the outer circle, every
     10 degrees with a long mark on the quarters. That is what tips the figure
     from "sacred geometry" to "reticle" — a circle you can take a reading off
     is an instrument; a circle you cannot is an ornament. */
  function construction() {
    var r0 = 232, out = [], r = r0, rot = 0, k, h, a, i, len;

    out.push('<rect x="' + -r0 + '" y="' + -r0 + '" width="' + (r0 * 2) + '" height="' + (r0 * 2) + '"/>');
    for (k = 0; k < 5; k++) {
      out.push('<circle r="' + n(r) + '"/>');
      h = r / Math.SQRT2;                 // half-side of the square inscribed in r
      out.push('<rect x="' + n(-h) + '" y="' + n(-h) + '" width="' + n(h * 2) +
               '" height="' + n(h * 2) + '" transform="rotate(' + rot + ')"/>');
      r = h;                              // the next circle is inscribed in that square
      rot = rot ? 0 : 45;
    }

    /* Axes and diagonals, drawn as one path — the construction lines a
       draughtsman would strike before anything else. */
    var ax = 'M' + -(r0 + 16) + ' 0H' + (r0 + 16) + 'M0 ' + -(r0 + 16) + 'V' + (r0 + 16) +
             'M' + -r0 + ' ' + -r0 + 'L' + r0 + ' ' + r0 +
             'M' + -r0 + ' ' + r0 + 'L' + r0 + ' ' + -r0;

    var ticks = '';
    for (i = 0; i < 36; i++) {
      a = (Math.PI / 18) * i;
      len = (i % 9 === 0) ? 20 : 11;      // long mark on the quarters
      ticks += 'M' + n(Math.cos(a) * (r0 + 4)) + ' ' + n(Math.sin(a) * (r0 + 4)) +
               'L' + n(Math.cos(a) * (r0 + 4 + len)) + ' ' + n(Math.sin(a) * (r0 + 4 + len));
    }

    return '<svg class="gr-geo" viewBox="-256 -256 512 512" xmlns="http://www.w3.org/2000/svg" focusable="false">' +
             '<g class="gr-geo__form">' + out.join('') + '</g>' +
             '<path class="gr-geo__axes" d="' + ax + '"/>' +
             '<path class="gr-geo__bear" d="' + ticks + '"/>' +
           '</svg>';
  }
  function n(v) { return Math.round(v * 100) / 100; }

  /* ---- the frequency scale, and its unnumbered twin on the other side.
     The mirror carries the same seven ticks with no numbers: it is what makes
     the pair read as ONE graticule straddling the column rather than as a
     label rail parked beside it. Numbering both sides was tried on paper and
     is worse — it turns the spine into a table with two identical columns. */
  function scales() {
    var a = '', b = '', i, s;
    for (i = 0; i < SCALE.length; i++) {
      s = SCALE[i];
      a += '<span class="gr-tk" data-i="' + i + '" style="--y:' + s.y + '%">' +
             '<i class="gr-tk__hz">' + s.hz + '</i></span>';
      b += '<span class="gr-tk gr-tk--bare" style="--y:' + s.y + '%"></span>';
    }
    return '<div class="gr-scale gr-scale--hz"><span class="gr-scale__rail"></span>' + a + '</div>' +
           '<div class="gr-scale gr-scale--mirror"><span class="gr-scale__rail"></span>' + b + '</div>';
  }

  /* ---- the ordinate.
     10 through 90 only. 0 and 100 are omitted on purpose: they would sit half
     off the top and bottom of the frame, and a scale whose end labels are
     clipped reads as a layout bug rather than as a scale. */
  function ordinate() {
    var html = '', v;
    for (v = 10; v <= 90; v += 10) {
      html += '<span style="--y:' + v + '%">' + v + '</span>';
    }
    return '<div class="gr-ord">' + html + '</div>';
  }

  var host = null, rect = null, cursor = null, read = null, ticks = null;
  var near = -1, lastRead = '', bound = false;

  function invalidate() { rect = null; }

  function onMove(e) {
    if (!host || !cursor) return;
    if (!rect) rect = host.getBoundingClientRect();
    if (!rect.height) return;

    var y = e.clientY - rect.top;
    if (y < 0 || y > rect.height) { hide(); return; }
    cursor.style.setProperty('--cy', y + 'px');
    if (!cursor.classList.contains('is-live')) cursor.classList.add('is-live');

    var t = (y / rect.height) * 100;
    /* Zero-padded to a fixed four characters. A readout that changes width as
       it travels makes the box twitch sideways beside a scale that does not
       move, and that twitch is far more visible than the digits are. */
    var txt = (t < 10 ? '0' : '') + t.toFixed(1);
    if (txt !== lastRead) { read.textContent = txt; lastRead = txt; }

    /* The rule crossing a tick lights that tick. 1.4% is ~13px at 900 — tight
       enough that the highlight belongs to the LINE rather than to the
       neighbourhood, which is the difference between a cursor and a hover. */
    var best = -1, bd = 1.4, i, dy;
    for (i = 0; i < SCALE.length; i++) {
      dy = Math.abs(SCALE[i].y - t);
      if (dy < bd) { bd = dy; best = i; }
    }
    if (best !== near) {
      if (near > -1 && ticks[near]) ticks[near].classList.remove('is-lit');
      if (best > -1 && ticks[best]) ticks[best].classList.add('is-lit');
      near = best;
    }
  }

  function hide() {
    if (cursor) cursor.classList.remove('is-live');
    if (near > -1 && ticks && ticks[near]) ticks[near].classList.remove('is-lit');
    near = -1;
  }

  window.__field = window.__field || {};
  window.__field.graticule = {
    mount: function (root) {
      /* One .gr wrapper, same reasoning as the other variants: the recede
         states are a single opacity on an element this file owns, so nothing
         here ever writes to the host's .field. */
      root.innerHTML = '<div class="gr">' +
          '<div class="gr-grid"></div>' +
          construction() +
          '<div class="gr-rule gr-rule--t"></div><div class="gr-rule gr-rule--b"></div>' +
          '<div class="gr-rule gr-rule--l"></div><div class="gr-rule gr-rule--r"></div>' +
          ordinate() +
          '<div class="gr-frame"><i></i><i></i><i></i><i></i></div>' +
          '<div class="gr-ctr"></div>' +
          scales() +
          '<div class="gr-cursor"><span class="gr-cursor__line"></span>' +
            '<span class="gr-cursor__read">50.0</span></div>' +
        '</div>';

      host   = root;
      cursor = root.querySelector('.gr-cursor');
      read   = root.querySelector('.gr-cursor__read');
      ticks  = root.querySelectorAll('.gr-scale--hz .gr-tk');
      rect = null; near = -1; lastRead = '';

      /* Hover-capable pointers only. On touch, pointermove fires mid-drag, so
         the rule would appear during a scroll and then freeze wherever the
         finger lifted — a measurement cursor stranded at a meaningless height
         is worse than no cursor. */
      if (!bound && window.matchMedia && window.matchMedia('(hover: hover)').matches) {
        window.addEventListener('pointermove', onMove, { passive: true });
        window.addEventListener('resize', invalidate, { passive: true });
        window.addEventListener('scroll', invalidate, { passive: true });
        document.addEventListener('pointerleave', hide);
        bound = true;
      }
    },
    unmount: function (root) {
      if (bound) {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('resize', invalidate);
        window.removeEventListener('scroll', invalidate);
        document.removeEventListener('pointerleave', hide);
        bound = false;
      }
      host = null; cursor = null; read = null; ticks = null;
      rect = null; near = -1; lastRead = '';
      root.innerHTML = '';
    }
  };
})();
