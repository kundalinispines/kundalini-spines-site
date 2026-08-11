/* ============================================================================
   WORDMARK — the driver. Pairs with css/wordmark.css; read the block comment
   there first, it carries the measurements and the reasoning this file
   implements. Built Aug 10 2026.

   TWO JOBS, AND ONLY TWO.

   1. JUSTIFY. Size the type so the LONGEST line fills the measure naturally,
      then scale every other line horizontally to match it.
   2. RUN. Add .is-inked once, on cue, and let CSS transitions do the rest.

   The reveal deliberately has NO rAF clock. js/shutter-text.js has one because
   its slats need per-frame amplitudes and a scrubbable timeline; this effect is
   three transitions on two elements, and a class toggle is the whole of it.
   Anything here that starts sampling frames is doing something the CSS should
   have been asked to do.

   ---------------------------------------------------------------------------
   WHY SIZE FROM THE LONGEST LINE

   The first version of this fixed one font-size and stretched BOTH lines out to
   the measure. Measured on the specimen sheet: KUNDALINI came out at scaleX
   2.20 and SPINES at 3.28 — a horizontal stretch that destroys the letterforms
   and makes every candidate face look identical, which is the exact opposite of
   what the lockup is for.

   Width scales linearly with font-size, so sizing from the longest line closes
   the whole thing in one pass and needs no iteration:

       size    = refSize * measure / maxNatural
       scaleX  = maxNatural / natural

   The long line lands on exactly 1.00 — undistorted — and SPINES lands near
   1.50, which is what the owner's reference actually shows: wider letterforms
   on the short line, not tracking.

   ---------------------------------------------------------------------------
   NATURAL WIDTHS MUST BE READ UNSCALED

   Every measurement clears the transform first. Reading a scaled box back
   returns the width it was last set to, so the factor compounds on each call
   and a couple of resizes walk the lockup off the screen. Cleared, measured,
   restored — in that order, every time.
   ============================================================================ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.Wordmark = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* A family that provably does not exist. Anything measuring the same as this
     resolved to the same fallback and has NOT loaded. */
  var NONSENSE = '"Zzz No Such Face At All"';
  var PROBE_TEXT = 'KUNDALINI SPINES';

  /* THE LOAD PROBE, AND WHY IT MEASURES THE DOM RATHER THAN A CANVAS.

     Two failures, both caught here on Aug 10 2026:

     1. document.fonts.check() reports true for a family the browser cannot
        paint. entrance-lab.html linked no webfont at all and still answered
        true for "Big Shoulders Display". It is not a usable probe.

     2. A canvas probe is not usable EITHER, for this face. Google serves
        Archivo's compressed cut with font-stretch: 62% on the @font-face, so
        selecting it requires that descriptor. The canvas font shorthand this
        function first used —  '900 100px "Archivo"' — asks for the default
        100% stretch, matches nothing, and reports FALLBACK for a font that
        loaded perfectly well. The first run of this module said exactly that
        and the warning was, briefly, believed.

     So the probe renders a real span carrying the ELEMENT'S OWN computed font
     properties, and swaps only the family. Whatever selects the face on the
     page selects it here, including descriptors nobody remembered to copy. */
  function probeSpan(ref) {
    var s = document.createElement('span');
    s.textContent = PROBE_TEXT;
    s.setAttribute('aria-hidden', 'true');
    s.style.cssText = 'position:absolute!important;left:-99999px!important;' +
                      'top:0!important;white-space:nowrap!important;' +
                      'visibility:hidden!important;pointer-events:none!important;';
    if (ref) {
      var cs = getComputedStyle(ref);
      s.style.fontWeight = cs.fontWeight;
      s.style.fontStretch = cs.fontStretch;
      s.style.fontStyle = cs.fontStyle;
      s.style.fontVariationSettings = cs.fontVariationSettings;
      s.style.letterSpacing = cs.letterSpacing;
      s.style.textTransform = cs.textTransform;
    }
    s.style.fontSize = '100px';
    return s;
  }

  function isLoadedOn(ref, family) {
    var s = probeSpan(ref);
    document.body.appendChild(s);
    s.style.fontFamily = '"' + family + '"';
    var real = s.getBoundingClientRect().width;
    s.style.fontFamily = NONSENSE;
    var fallback = s.getBoundingClientRect().width;
    document.body.removeChild(s);
    return { loaded: Math.abs(real - fallback) > 0.5, real: real, fallback: fallback };
  }

  function Wordmark(el, opts) {
    this.el = el;
    this.o = opts || {};
    this.inner = el.querySelector('.wm__inner') || el;
    this.lines = [].slice.call(el.querySelectorAll('.wm__line'));
    this.refSize = this.o.refSize || 132;
    this.played = false;
    this.laidOut = false;
  }

  /* ---- layout: justify the lines to a shared measure. Idempotent. */
  Wordmark.prototype.layout = function () {
    var el = this.el;
    var lines = this.lines;
    if (!lines.length) { return this; }

    var stage = this.o.stage || el.parentNode;
    var stageW = stage.getBoundingClientRect().width;
    var frac = parseFloat(getComputedStyle(el).getPropertyValue('--wm-measure')) || 0.56;
    var target = stageW * frac;
    if (!(target > 0)) { return this; }

    /* Measure at the reference size with every transform cleared, and with the
       lockup's own width released — otherwise a previous run's width is the box
       these natural widths get measured inside. */
    el.style.width = 'auto';
    this.inner.style.fontSize = this.refSize + 'px';

    var natural = lines.map(function (line) {
      var ink = line.querySelector('.wm__ink') || line;
      var prev = ink.style.transform;
      ink.style.transform = 'none';
      var w = ink.getBoundingClientRect().width;
      ink.style.transform = prev;
      return w;
    });

    var maxNat = Math.max.apply(null, natural);
    if (!(maxNat > 0)) { return this; }

    var size = this.refSize * target / maxNat;
    this.inner.style.fontSize = size.toFixed(2) + 'px';
    el.style.width = Math.round(target) + 'px';

    lines.forEach(function (line, i) {
      line.style.setProperty('--sx', (maxNat / natural[i]).toFixed(4));
    });

    this.laidOut = true;
    this.metrics = { measure: target, size: size, natural: natural, maxNatural: maxNat,
                     scale: natural.map(function (n) { return maxNat / n; }) };
    return this;
  };

  /* ---- run. One class; CSS owns the timing. */
  Wordmark.prototype.play = function () {
    if (this.played) { return this; }
    this.played = true;
    var el = this.el;
    if (!this.laidOut) { this.layout(); }
    el.classList.remove('is-holding');

    /* Flush so the pre-transition state is a real computed value. Without it
       the class can land in the same style recalculation as the unhide and the
       transitions never get a start value to run from — the lockup simply
       appears, fully inked, which reads as the effect being broken rather than
       fast. */
    void el.offsetWidth;

    var start = parseFloat(getComputedStyle(el).getPropertyValue('--wm-start-ms')) || 0;
    var self = this;
    if (start > 0) {
      window.setTimeout(function () { el.classList.add('is-inked'); }, start);
    } else {
      el.classList.add('is-inked');
    }
    return this;
  };

  /* Total run length, so a caller can schedule the next beat against it rather
     than against a number copied out of the stylesheet. */
  Wordmark.prototype.total = function () {
    var cs = getComputedStyle(this.el);
    function ms(name) { return parseFloat(cs.getPropertyValue(name)) || 0; }
    return ms('--wm-start-ms') +
           Math.max(ms('--wm-dev-ms') + ms('--wm-line-lead'),
                    ms('--wm-rule-delay') + ms('--wm-rule-ms') + ms('--wm-mark-ms'));
  };

  /* Jump straight to the inked state with NO animation. This is the cut-on-the-
     edit arrival, the reduced-motion path, and the "just be there" default.

     .is-instant is a CLASS, not element.style.transition = 'none', and the
     difference is the whole function. transition is not inherited and every
     transition in css/wordmark.css is declared on a child of .wm, so writing
     transition:none on .wm suppresses nothing — the first version of this did
     exactly that and faded the lockup up over 1265ms while reading, in code,
     as an instant jump.

     Add, apply, FLUSH, remove. The flush is what commits the final values
     while the suppression is still in force; without it the class is added and
     removed inside one style recalculation and the transitions run anyway. */
  Wordmark.prototype.settle = function () {
    this.played = true;
    if (!this.laidOut) { this.layout(); }
    var el = this.el;
    el.classList.add('is-instant');
    el.classList.remove('is-holding');
    el.classList.add('is-inked');
    void el.offsetWidth;
    el.classList.remove('is-instant');
    return this;
  };

  /* ---- THE REGISTRATION SNAP.

     Land misregistered, hold that for one painted frame, then pull true.

     THE DOUBLE requestAnimationFrame IS THE WHOLE TRICK. The offset state has
     to be COMMITTED — computed, and actually painted — before the class that
     produces it is removed, or the browser coalesces "apply offsets" and
     "remove offsets" into one style recalculation, finds no change in the
     computed transform, and starts no transition at all. The lockup then simply
     appears in register and the effect reads as not working rather than as
     fast. One rAF gets you the style flush; the second guarantees a paint has
     gone out. Cheap insurance for something that fails invisibly.

     is-instant covers the arrival itself so the displaced state does not
     animate INTO existence — only out of it. */
  Wordmark.prototype.snap = function () {
    if (!this.laidOut) { this.layout(); }
    this.played = true;
    var el = this.el;

    el.classList.add('is-instant', 'is-snapping');
    el.classList.remove('is-holding');
    el.classList.add('is-inked');
    void el.offsetWidth;
    el.classList.remove('is-instant');

    var raf = (typeof requestAnimationFrame === 'function')
      ? requestAnimationFrame : function (f) { return setTimeout(f, 16); };
    raf(function () {
      raf(function () { el.classList.remove('is-snapping'); });
    });
    return this;
  };

  Wordmark.prototype.reset = function () {
    this.played = false;
    this.el.classList.remove('is-inked', 'is-snapping', 'is-instant');
    return this;
  };

  /* ---- mount.

     THE FONT GATE IS NOT OPTIONAL. Every number above comes out of
     measureText/getBoundingClientRect against the rendered face, so laying out
     before the webfont lands justifies the lockup to the fallback's metrics and
     never corrects itself. The element stays .is-holding (visibility:hidden,
     so the box still exists to measure) until document.fonts.ready resolves.

     opts.family + opts.weight, when given, are additionally width-checked
     against a nonsense family and the result is reported on the returned
     object as .fontLoaded. fonts.ready resolving only means the font LOADING
     process finished — including finishing by failing. */
  function mount(el, opts) {
    opts = opts || {};
    var wm = new Wordmark(el, opts);

    function ready() {
      /* Probed against .wm__inner, which is where the family, weight and the
         load-bearing font-stretch: 62% actually resolve. */
      if (opts.family) {
        var r = isLoadedOn(wm.inner, opts.family);
        wm.fontLoaded = r.loaded;
        wm.fontProbe = r;
        if (!r.loaded && window.console && console.warn) {
          console.warn('[wordmark] "' + opts.family + '" did not load (' +
                       r.real.toFixed(2) + 'px vs fallback ' + r.fallback.toFixed(2) +
                       'px) — the lockup has been justified against fallback ' +
                       'metrics and will be wrong.');
        }
      } else {
        wm.fontLoaded = null;
      }
      wm.layout();
      el.classList.remove('is-holding');
      if (typeof opts.onready === 'function') { opts.onready(wm); }
    }

    el.classList.add('is-holding');

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(ready);
    } else {
      window.addEventListener('load', ready);
    }

    var raf = 0;
    window.addEventListener('resize', function () {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function () { wm.layout(); });
    });

    return wm;
  }

  return { mount: mount, isLoadedOn: isLoadedOn };
}));
