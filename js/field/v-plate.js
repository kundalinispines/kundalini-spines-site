/* ==========================================================================
   FIELD VARIANT — PLATE  (behaviour)
   Partner file: css/field/v-plate.css. One of five competing readings of the
   background field; the host page mounts exactly one at a time and sets
   html.v-plate while this one is up.

   THE READING: an anatomical plate. The spine is the specimen, the margins
   are the caption block, and the seven centres are called out by leader lines
   the way a bone is called out in a Gray's plate — name first, function and
   frequency underneath, low contrast, nothing shouting.

   That is the whole argument for this variant: the empty thirds are not a
   composition problem to be decorated away, they are the place a plate keeps
   its KEY. A visitor who has never heard the word chakra gets told what the
   glowing column actually is, without a single sentence of body copy.

   WHAT THIS FILE OWNS
     - CHAKRAS[]: the seven-centre table, ORDER AND SIDE included.
     - The Metatron's-cube construction, generated rather than hand-authored.
     - The one piece of pointer reactivity: the callout nearest the pointer's
       height comes up out of the low-contrast rest state.

   NO IDLE LOOP. This project runs zero idle requestAnimationFrame and that is
   a measured, defended property, not an accident. The only thing that ever
   fires here is a pointermove listener, which by definition runs only while
   the pointer is moving, and it writes to the DOM only when the nearest
   callout actually CHANGES — a swept mouse produces at most seven writes
   crossing the whole stage, not one per event.
   ========================================================================== */
(function () {
  'use strict';

  /* ---- the seven centres.
     y is percent of stage height, matching where each sits on the wireframe.
     side is which margin the callout hangs in, and it is NOT decorative
     alternation: it is chosen against the six navigator nodes, which carry
     their own hover labels 180px out from the axis on a fixed side.

     Measured against js/spine-ui.js's NODES[] at 1440x900, worst cases:
       chakra 1 @ 92% left   vs node 06 Timeline @ 88% left   -> 21px clear
       chakra 2 @ 79% right  vs node 05 Archive  @ 74% right  -> 30px clear
     Every other pair is 45px or better. Flipping any single row's side breaks
     one of those two, so treat the column as load-bearing rather than as a
     zig-zag someone liked the look of. */
  var CHAKRAS = [
    { key: '07', name: 'SAHASRARA',    en: 'CROWN',        hz: 963, y: 12, side: 'l' },
    { key: '06', name: 'AJNA',         en: 'THIRD EYE',    hz: 852, y: 27, side: 'r' },
    { key: '05', name: 'VISHUDDHA',    en: 'THROAT',       hz: 741, y: 40, side: 'l' },
    { key: '04', name: 'ANAHATA',      en: 'HEART',        hz: 639, y: 53, side: 'r' },
    { key: '03', name: 'MANIPURA',     en: 'SOLAR PLEXUS', hz: 528, y: 66, side: 'l' },
    { key: '02', name: 'SVADHISTHANA', en: 'SACRAL',       hz: 417, y: 79, side: 'r' },
    { key: '01', name: 'MULADHARA',    en: 'ROOT',         hz: 396, y: 92, side: 'l' }
  ];

  /* Transliterated Latin only. Devanagari was considered and dropped: no font
     on this site carries the script, so it would fall back to whatever the OS
     hands over — a different face, a different weight, and a different height
     per machine, inside a layer whose entire premise is a consistent
     low-contrast register. A decoration that renders unpredictably is not a
     decoration. */

  /* ---- geometry: Metatron's cube.
     Generated, not hand-authored, because the figure is 13 circles and 78
     connecting lines and hand-typing 78 coordinate pairs is how a construction
     ends up subtly asymmetric.

     THE CONSTRUCTION: the Fruit of Life — one circle at the origin, six at
     spacing d, six more at 2d on the SAME six bearings — then a line between
     every pair of the thirteen centres. Circle radius is d/2, so the ring
     circles are tangent to the centre circle and to each other, which is what
     makes the figure read as a construction rather than as scattered rings.

     Bearings start at -90deg (12 o'clock), i.e. a POINTY-TOP hexagon. Flat-top
     is the other convention and it is wrong here: this figure is centred on a
     vertical spine, and a flat-top hex puts a horizontal edge straight across
     the cord at two heights. Pointy-top puts a vertex there instead. */
  function metatron() {
    var d = 100, pts = [{ x: 0, y: 0 }], i, j, a;
    for (i = 0; i < 6; i++) {
      a = (Math.PI / 3) * i - Math.PI / 2;
      pts.push({ x: Math.cos(a) * d,     y: Math.sin(a) * d });
      pts.push({ x: Math.cos(a) * d * 2, y: Math.sin(a) * d * 2 });
    }
    var seg = [], circ = '';
    for (i = 0; i < pts.length; i++) {
      circ += '<circle cx="' + r(pts[i].x) + '" cy="' + r(pts[i].y) + '" r="' + (d / 2) + '"/>';
      for (j = i + 1; j < pts.length; j++) {
        seg.push('M' + r(pts[i].x) + ' ' + r(pts[i].y) + 'L' + r(pts[j].x) + ' ' + r(pts[j].y));
      }
    }
    /* ONE path for all 78 lines rather than 78 <line> elements. Same picture,
       one node to style and one node for the compositor to think about. The
       extent of the figure is 2d + d/2 = 250, hence the 512 box with 6 units
       of air so a 1px stroke never clips at the edge. */
    return '<svg class="pl-geo" viewBox="-256 -256 512 512" xmlns="http://www.w3.org/2000/svg" focusable="false">' +
             '<g class="pl-geo__rings">' + circ + '</g>' +
             '<path class="pl-geo__web" d="' + seg.join('') + '"/>' +
           '</svg>';
  }
  function r(n) { return Math.round(n * 100) / 100; }

  /* ---- callout markup.
     Source order is spine-side-last on the left and spine-side-first on the
     right; CSS flips the right rows with row-reverse rather than the markup
     carrying two orders, so the row is one shape with one modifier. */
  function callouts() {
    var html = '', i, c;
    for (i = 0; i < CHAKRAS.length; i++) {
      c = CHAKRAS[i];
      html +=
        '<div class="pl-cb pl-cb--' + c.side + '" data-i="' + i + '" style="--y:' + c.y + '%">' +
          '<span class="pl-cb__lab">' +
            '<span class="pl-cb__name">' + c.name + '</span>' +
            '<span class="pl-cb__meta">' + c.key + ' · ' + c.en + ' · ' + c.hz + ' HZ</span>' +
          '</span>' +
          '<span class="pl-cb__lead"></span>' +
          '<span class="pl-cb__dot"></span>' +
        '</div>';
    }
    return html;
  }

  var rows = null;      // NodeList of .pl-cb, in CHAKRAS order
  var host = null;      // the mount root, for measurement
  var rect = null;      // cached bounds; null means "re-measure on next move"
  var near = -1;
  var bound = false;

  /* The stage is 100svh and the page it sits on can scroll, so the cached
     rect goes stale on both resize and scroll. Invalidating (rather than
     re-measuring) means the layout read happens at most once per pointer
     gesture instead of once per scroll tick. */
  function invalidate() { rect = null; }

  function setNear(i) {
    if (i === near) return;                       // the write gate — see header
    if (near > -1 && rows[near]) rows[near].classList.remove('is-near');
    if (i > -1 && rows[i]) rows[i].classList.add('is-near');
    near = i;
  }

  function onMove(e) {
    if (!host) return;
    if (!rect) rect = host.getBoundingClientRect();
    if (!rect.height) return;
    var t = ((e.clientY - rect.top) / rect.height) * 100;
    /* 5.5% of stage height ~= 50px at 900. Deliberately less than half the
       13% row spacing, so there is a DEAD BAND between callouts: sweeping the
       pointer down the page lights one row at a time with darkness between,
       instead of handing the highlight off with nothing ever unlit. The plate
       should feel read, not scrubbed. */
    var best = -1, bd = 5.5, i, dy;
    for (i = 0; i < CHAKRAS.length; i++) {
      dy = Math.abs(CHAKRAS[i].y - t);
      if (dy < bd) { bd = dy; best = i; }
    }
    setNear(best);
  }
  function onLeave() { setNear(-1); }

  window.__field = window.__field || {};
  window.__field.plate = {
    mount: function (root) {
      /* Everything goes inside ONE .pl wrapper rather than straight into the
         host's container. The recede states (is-card / is-music) are a single
         opacity on that wrapper, and putting them on .field itself would mean
         this variant writing to an element the host owns and the other four
         share. One element in, one element to fade, nothing of the host's
         touched. */
      root.innerHTML = '<div class="pl">' +
          metatron() +
          '<div class="pl-reg pl-reg--tl"></div><div class="pl-reg pl-reg--tr"></div>' +
          '<div class="pl-reg pl-reg--bl"></div><div class="pl-reg pl-reg--br"></div>' +
          '<div class="pl-fig">FIG. I — SUSHUMNA · THE SEVEN CENTRES</div>' +
          '<div class="pl-callouts">' + callouts() + '</div>' +
        '</div>';

      host = root;
      rows = root.querySelectorAll('.pl-cb');
      rect = null;
      near = -1;

      /* Bound only where there is a real hovering pointer. On a touch screen
         pointermove fires only mid-drag, so the highlight would flash on
         during a scroll gesture and stay stuck on whichever row the finger
         left — worse than not having it. */
      if (!bound && window.matchMedia && window.matchMedia('(hover: hover)').matches) {
        window.addEventListener('pointermove', onMove, { passive: true });
        window.addEventListener('resize', invalidate, { passive: true });
        window.addEventListener('scroll', invalidate, { passive: true });
        document.addEventListener('pointerleave', onLeave);
        bound = true;
      }
    },
    unmount: function (root) {
      if (bound) {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('resize', invalidate);
        window.removeEventListener('scroll', invalidate);
        document.removeEventListener('pointerleave', onLeave);
        bound = false;
      }
      host = null; rows = null; rect = null; near = -1;
      root.innerHTML = '';
    }
  };
})();
