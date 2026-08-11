/* ==========================================================================
   FIELD VARIANT — CROP (behaviour)
   Partner file: css/field/v-crop.css, which carries the design argument and
   the raster-cost reasoning. This file does three jobs and nothing else:

     1. BUILD   the seven cropped words, their mono callouts, and one
                oversized Metatron construction, twice — once dim, once lit
                inside the torch lens.
     2. FIT     each word to a target width, so every one of them actually
                runs off its edge instead of stopping short. This is the part
                that could not be eyeballed and had to be solved.
     3. LIGHT   the torch from pointermove. No rAF, no interval, no timer.

   THIS PROJECT RUNS ZERO IDLE rAF AND THAT IS A DEFENDED PROPERTY. The torch
   writes two custom properties on an event that only fires while the pointer
   is moving; CSS does the rest. If a future pass wants easing, spring, or
   trail, it goes in the transition in the stylesheet, not in a loop here.
   ========================================================================== */
(function () {
  'use strict';

  /* The shared table. All five variants agree on these numbers — y is percent
     from the top of the stage and matches the six-node navigator's own layout
     plus the crown, which the navigator does not carry a node for.

     `side`  which edge the word runs off. Strict alternation, so the left and
             right thirds fill at the same rate and no two neighbours can
             collide horizontally — which is what lets the sizes below vary as
             wildly as they do without the rows fouling each other.
     `over`  how far past its edge the word runs, in vw. Hand-varied on
             purpose: the inner edge is rigid (the spine corridor) so the outer
             edge is the only place the composition gets to breathe. A single
             constant here reads as a rendering mistake.
     `ratio` fallback width-per-1px-of-font-size, used only if <canvas> is
             unavailable. Measured properly at mount; see fit(). */
  var CHAKRAS = [
    { n: 7, name: 'SAHASRARA',    en: 'CROWN',        hz: 963, y: 12, side: 'l', over: 14, ratio: 4.05 },
    { n: 6, name: 'AJNA',         en: 'THIRD EYE',    hz: 852, y: 27, side: 'r', over:  9, ratio: 1.68 },
    { n: 5, name: 'VISHUDDHA',    en: 'THROAT',       hz: 741, y: 40, side: 'l', over: 12, ratio: 3.87 },
    { n: 4, name: 'ANAHATA',      en: 'HEART',        hz: 639, y: 53, side: 'r', over:  8, ratio: 3.18 },
    { n: 3, name: 'MANIPURA',     en: 'SOLAR PLEXUS', hz: 528, y: 66, side: 'l', over: 15, ratio: 3.52 },
    { n: 2, name: 'SVADHISTHANA', en: 'SACRAL',       hz: 417, y: 79, side: 'r', over: 10, ratio: 5.17 },
    { n: 1, name: 'MULADHARA',    en: 'ROOT',         hz: 396, y: 92, side: 'l', over: 13, ratio: 4.21 }
  ];

  /* Transliterated Latin only. Devanagari is never load-bearing anywhere on
     this site because no font is loaded for it, and here the letterforms ARE
     the material — a tofu box at 200px would be the whole composition. */

  var CLEAR_VW = 38;     /* the corridor's left edge; mirrored at 62 in CSS */
  var MIN_VW   = 8.2;    /* SVADHISTHANA's floor — twelve letters have to go
                            somewhere and the alternative is unreadable tracking */
  var MAX_VW   = 17;     /* AJNA's ceiling. Four letters asked for 28vw, which
                            is a cap height taller than two rows of spacing.
                            Capped here and the shortfall paid in tracking,
                            which is what display type does anyway. */

  var FONT_STACK = '"Big Shoulders Display", "Arial Narrow", sans-serif';
  var FONT_SPEC  = '800 100px ' + FONT_STACK;   /* measured at 100px, so the
                                                   canvas width IS the ratio
                                                   per 1px of font-size / 100 */

  /* ---- geometry: the thirteen circles of the Fruit of Life ----------------
     Centre, six neighbours at distance 1, six next-nearest at distance root-3
     rotated 30 degrees. That is the hexagonal silhouette with a single circle
     at top and bottom, and joining all thirteen centres is the Metatron
     construction the entrance video and data/tracks.json already use.
     Extent is root-3 + 0.5 = 2.232, hence the 4.8-unit viewBox. */
  function metatron() {
    var ROOT3 = 1.7320508;
    var pts = [[0, 0]], i, a;
    for (i = 0; i < 6; i++) {                       /* inner ring, distance 1 */
      a = i * 60 * Math.PI / 180;
      pts.push([Math.cos(a), Math.sin(a)]);
    }
    for (i = 0; i < 6; i++) {                       /* outer ring, root-3, +30 */
      a = (i * 60 + 30) * Math.PI / 180;
      pts.push([Math.cos(a) * ROOT3, Math.sin(a) * ROOT3]);
    }

    var f = function (v) { return v.toFixed(4); };
    var lines = '', circles = '', j;

    for (i = 0; i < 13; i++) {
      for (j = i + 1; j < 13; j++) {
        lines += '<line x1="' + f(pts[i][0]) + '" y1="' + f(pts[i][1]) +
                 '" x2="' + f(pts[j][0]) + '" y2="' + f(pts[j][1]) +
                 '" vector-effect="non-scaling-stroke"/>';
      }
      circles += '<circle cx="' + f(pts[i][0]) + '" cy="' + f(pts[i][1]) +
                 '" r="0.5" vector-effect="non-scaling-stroke"/>';
    }

    /* stroke-opacity, not opacity: it tints the paint without giving the group
       its own raster. The lines are held under the circles so the seventy-eight
       of them read as weave rather than as a scribble where they converge. */
    return '<g id="crop-geo-src" fill="none" stroke="currentColor" stroke-width="1">' +
             '<g stroke-opacity="0.5">' + lines + '</g>' +
             '<g stroke-opacity="1">' + circles + '</g>' +
           '</g>';
  }

  function geoSvg() {
    return '<svg class="crop__geo" viewBox="-2.4 -2.4 4.8 4.8" ' +
           'preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">' +
           '<use href="#crop-geo-src" xlink:href="#crop-geo-src"/></svg>';
  }

  function pad2(n) { return n < 10 ? '0' + n : String(n); }

  /* One row of type plus its callout. The tag is emitted first only because it
     is absolutely positioned and this keeps the giant word last in source, next
     to the stroke rules that own it. */
  function rows() {
    var html = '', i, c;
    for (i = 0; i < CHAKRAS.length; i++) {
      c = CHAKRAS[i];
      html += '<div class="crop__row crop__row--' + c.side +
              (i === 0 ? ' crop__row--tagbelow' : '') + '" data-crop-i="' + i + '"' +
              ' style="--y:' + c.y + '%;--fs:' + fsFor(c, c.ratio) + ';--tr:' + trFor(c, c.ratio) + '">' +
                '<span class="crop__tag">' + pad2(c.n) + ' &middot; ' + c.hz + ' HZ &middot; ' + c.en + '</span>' +
                '<span class="crop__word">' + c.name + '</span>' +
              '</div>';
    }
    return html;
  }

  /* ---- the fit ------------------------------------------------------------
     Solve each word for a target WIDTH rather than picking a font-size, because
     the thing that has to be true is "this word runs past its edge", and that
     is a width statement. target = corridor + overshoot, both in vw.

     Everything stays in vw so the answer holds at any viewport with no resize
     listener and no measurement of the stage: width and font-size scale
     together, so the ratio solved for here is scale-free.

     Two clamps, and they fail in opposite, safe directions:
       hit MAX (short word)  -> the shortfall becomes letter-spacing, and the
                                word still ends exactly at the target.
       hit MIN (long word)   -> the word ends up WIDER than the target, i.e.
                                cropped harder. Never narrower, so a word can
                                never accidentally stop short of its edge. */
  function fsFor(c, ratio) {
    var target = CLEAR_VW + c.over;
    var fs = target / ratio;
    if (fs > MAX_VW) fs = MAX_VW;
    if (fs < MIN_VW) fs = MIN_VW;
    return Math.round(fs * 100) / 100;
  }
  function trFor(c, ratio) {
    var target = CLEAR_VW + c.over;
    var extra = target - fsFor(c, ratio) * ratio;
    if (extra <= 0) return 0;
    return Math.round((extra / c.name.length) * 1000) / 1000;
  }

  /* Canvas measureText against the SAME font stack the DOM uses, so if the
     webfont has not arrived the measurement and the render agree on the
     fallback and the layout is still correct — just sized for Arial Narrow.
     Re-run once the real face lands. */
  function measure() {
    var ctx;
    try {
      ctx = document.createElement('canvas').getContext('2d');
      if (!ctx) return null;
      ctx.font = FONT_SPEC;
      if (!ctx.measureText('M').width) return null;
    } catch (e) { return null; }

    var out = [], i, w;
    for (i = 0; i < CHAKRAS.length; i++) {
      w = ctx.measureText(CHAKRAS[i].name).width / 100;
      if (!w || !isFinite(w)) return null;
      out.push(w);
    }
    return out;
  }

  function applyFit(scope) {
    var ratios = measure();
    if (!ratios) return;                 /* the table's fallbacks stand */
    for (var i = 0; i < CHAKRAS.length; i++) {
      var els = scope.querySelectorAll('.crop__row[data-crop-i="' + i + '"]');
      var fs = fsFor(CHAKRAS[i], ratios[i]);
      var tr = trFor(CHAKRAS[i], ratios[i]);
      for (var k = 0; k < els.length; k++) {   /* base copy AND torch copy */
        els[k].style.setProperty('--fs', String(fs));
        els[k].style.setProperty('--tr', String(tr));
      }
    }
  }

  /* ---- state kept only so unmount can undo it ---------------------------- */
  var listeners = [];

  function on(target, type, fn, opts) {
    target.addEventListener(type, fn, opts);
    listeners.push([target, type, fn, opts]);
  }
  function offAll() {
    for (var i = 0; i < listeners.length; i++) {
      listeners[i][0].removeEventListener(listeners[i][1], listeners[i][2], listeners[i][3]);
    }
    listeners = [];
  }

  window.__field = window.__field || {};
  window.__field.crop = {

    mount: function (root) {
      offAll();   /* a mount without a matching unmount would otherwise stack a
                     second set of window listeners onto a dead node */
      var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var canHover = !window.matchMedia || window.matchMedia('(hover: hover)').matches;
      /* Build the torch at all only where it can mean something. A touch
         device would drag it around behind the finger, which is the opposite
         of "revealed where you are looking", and reduced-motion has a flat
         high-contrast fallback in the stylesheet that is better than a torch
         that does not move. Not building it means the mask never exists. */
      var wantTorch = canHover && !reduced;

      var html =
        '<div class="crop">' +
          '<svg class="crop__defs" aria-hidden="true" focusable="false" ' +
               'xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">' +
            '<defs>' + metatron() + '</defs>' +
          '</svg>' +
          geoSvg() +
          '<div class="crop__type">' + rows() + '</div>' +
          (wantTorch
            ? '<div class="crop__torch"><div class="crop__torch-in">' +
                geoSvg() +
                '<div class="crop__type">' + rows() + '</div>' +
              '</div></div>'
            : '') +
        '</div>';

      root.innerHTML = html;
      var crop = root.firstChild;

      applyFit(crop);
      /* The webfont usually arrives after mount. Both hooks, because .load()
         resolves for the specific face while .ready waits on the document —
         whichever lands first re-fits, the second is a cheap no-op. */
      if (document.fonts) {
        try {
          if (document.fonts.load) {
            document.fonts.load(FONT_SPEC).then(function () { applyFit(crop); }, function () {});
          }
          if (document.fonts.ready) {
            document.fonts.ready.then(function () { applyFit(crop); }, function () {});
          }
        } catch (e) { /* no Font Loading API — the sync fit stands */ }
      }

      /* The torch's inner layer is a second copy of the field and its rows
         position with top:%, so it needs the field's real pixel height or the
         lit type drifts vertically away from the dim type. Read once here and
         again on resize — never on pointermove, which would turn every move
         into a forced layout. */
      var rect = { left: 0, top: 0 };
      function remeasureBox() {
        rect = root.getBoundingClientRect();
        if (rect.width && rect.height) {
          crop.style.setProperty('--crop-field-w', rect.width + 'px');
          crop.style.setProperty('--crop-field-h', rect.height + 'px');
        }
      }
      remeasureBox();
      on(window, 'resize', remeasureBox);
      /* The navigator does not scroll today, but the stage's offset from the
         viewport is what turns clientY into a field coordinate, so a page that
         ever does scroll would otherwise light the wrong place. Passive. */
      on(window, 'scroll', function () { rect = root.getBoundingClientRect(); }, { passive: true });

      if (!wantTorch) return;

      var lit = false;
      on(window, 'pointermove', function (e) {
        crop.style.setProperty('--mx', (e.clientX - rect.left) + 'px');
        crop.style.setProperty('--my', (e.clientY - rect.top) + 'px');
        if (!lit) { lit = true; crop.classList.add('is-lit'); }
      }, { passive: true });

      /* Pointer gone: the torch fades out rather than freezing mid-field,
         where a bright patch with no cursor in it reads as a rendering fault. */
      on(document.documentElement, 'pointerleave', function () {
        lit = false;
        crop.classList.remove('is-lit');
      });
      on(window, 'blur', function () {
        lit = false;
        crop.classList.remove('is-lit');
      });
    },

    unmount: function (root) {
      /* The contract's default unmount is root.innerHTML = '' and that alone
         would leak four window-level listeners writing custom properties onto
         a detached node for the rest of the session. */
      offAll();
      root.innerHTML = '';
    }
  };
})();
