/* ==========================================================================
   SHUTTER TEXT — the driver.  Pairs with css/shutter-text.css; read the block
   comment there first, it carries the measurements this file implements.

   One rAF clock drives everything: the slats, the global blur/opacity
   envelope, and the eyebrow cross-fade. That is deliberate rather than three
   CSS animations — a single clock is the only way the HUD's time scrub and the
   verification hook (window.__shutter.seek) can freeze the whole moment at an
   arbitrary millisecond, which is how this was checked against the reference
   frames in the first place.

   PUBLIC SURFACE
     ShutterText.mount(el, opts)   -> instance
     instance.play() / .seek(ms) / .set(opts) / .total()
     window.__shutter              -> the mounted title, for the screenshot rig
   ========================================================================== */
(function (global) {
  'use strict';

  /* ---------------------------------------------------------------- easing */

  /* Newton-Raphson cubic-bezier, same shape as the CSS timing function so the
     numbers in the HUD mean what they say. FITTED, not picked: two usable
     points come out of the frames — at 9% of the run the reference had moved
     6% of the way (d02), at 58% it had moved 82% (d05, band 5). A quartic-out
     gives 31% at the first point and is far too eager; the site's own
     --ease-standard (0.4,0,0.2,1) gives 4.5% / 72% and is slightly too lazy at
     the tail. (0.35,0,0.15,1) splits them. */
  var EASE = [0.35, 0, 0.15, 1];

  function bezier(x1, y1, x2, y2) {
    var cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    var cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    function fx(t) { return ((ax * t + bx) * t + cx) * t; }
    function dx(t) { return (3 * ax * t + 2 * bx) * t + cx; }
    function fy(t) { return ((ay * t + by) * t + cy) * t; }
    return function (x) {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      var t = x, i, e, d;
      for (i = 0; i < 6; i++) {
        e = fx(t) - x;
        if (Math.abs(e) < 1e-5) break;
        d = dx(t);
        if (Math.abs(d) < 1e-6) break;
        t -= e / d;
      }
      return fy(t < 0 ? 0 : t > 1 ? 1 : t);
    };
  }
  var ease = bezier(EASE[0], EASE[1], EASE[2], EASE[3]);

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  /* ------------------------------------------------------------ blur ladder */

  /* Directional blur means feGaussianBlur with a two-value stdDeviation
     ("N 0") — CSS filter: blur() is isotropic and would smear the slats
     vertically into each other, which is the one thing the reference never
     does. stdDeviation is not a CSS-settable property, so it cannot be
     animated from a custom property; instead the page ships a LADDER of
     filters and the script swaps which one each copy points at. Eleven rungs,
     spaced roughly geometrically: at 60fps the blur is changing by more than
     one rung per frame through the fast part of the run, so the quantisation
     is invisible. The obvious alternative — stacking N ghost copies at
     decreasing opacity — costs 5x the elements and produces visible banding on
     a hard-edged condensed face. */
  var SD = [0, 1, 2, 3, 4.5, 6, 8, 11, 15, 20, 27];

  function rung(sd) {
    var i, best = 0, bd = Infinity, d;
    for (i = 0; i < SD.length; i++) {
      d = Math.abs(SD[i] - sd);
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  }

  /* ------------------------------------------------------------- amplitudes */

  /* MEASURED off ref2/d02_2.04s.png, as fractions of the line width — see the
     TRAVEL note in the stylesheet. Bands 2 and 3 are raised from the measured
     0.006 / 0.002 to 0.03 / 0.02: at 40ms in, a residual of 3px and 1px is
     within the blur's own footprint, so the true amplitude is unrecoverable
     from the frames and anything under ~1% of the width is indistinguishable
     from a slat that never moved. These keep them alive without pretending to
     a precision the recording does not have. */
  var AMP5 = [0.34, 0.03, 0.02, 0.53, 0.55];

  /* Any band count resamples that curve rather than randomising, so changing
     the HUD's band slider changes the pitch without changing the character —
     the two near-static slats stay near the top-middle, the two long throws
     stay at the bottom, at 3 bands or at 9. */
  function amplitudes(n) {
    var out = [], i, x, f, a, b;
    for (i = 0; i < n; i++) {
      x = n === 1 ? 0 : (i / (n - 1)) * (AMP5.length - 1);
      a = Math.floor(x); b = Math.min(a + 1, AMP5.length - 1); f = x - a;
      out.push(AMP5[a] * (1 - f) + AMP5[b] * f);
    }
    return out;
  }

  /* ---------------------------------------------------------- cap metrics */

  /* THE SLAT GRID IS THE INK EXTENT OF THE ACTUAL STRING, divided by N.

     The reference word is IMMERSE — all caps — so its ink extent IS its cap
     height, and dividing that by 5 is what the measurement recovered. The
     naive generalisation, "divide cap height by N and stretch the top and
     bottom slats to cover the ascenders and the g", was built first and is
     wrong: on "Knowledge Hidden" it makes the outer two slats 22px and 24px
     against 9px for the middle three, and the headline stops reading as five
     slats and starts reading as a three-part tear. Captured and looked at
     before it was changed.

     So the rule that actually generalises is N EQUAL SLATS ACROSS THE INK, and
     it collapses to the reference exactly when the string is all caps. Canvas
     TextMetrics measures that per string: actualBoundingBoxAscent/Descent of
     the real text is its true ink box (the k/l/d/h tops and the g tail here),
     while fontBoundingBoxAscent/Descent give the em box the CSS line box is
     built around, which is what locates the baseline.

     Measured after document.fonts.ready, never before — on the fallback face
     (Arial Narrow) the ascent is different enough to put every boundary in the
     wrong place, and the failure is silent. */
  var metricCache = {};

  /* THE CACHE KEY MUST CHANGE WHEN THE FACE DOES, AND THE FONT SHORTHAND DOES
     NOT. Measured Aug 11 2026: before and after the webfont arrives the
     shorthand is byte-identical —

         normal 800 56px "Big Shoulders Display", "Arial Narrow", sans-serif

     — because it is the CSS declaration, not the face that got selected from
     it. So a build performed before the font landed cached the FALLBACK metrics
     under a key every later build also computes, and every later build reused
     them for the life of the page. Confirmed: with the real face loaded and the
     line box back to its correct width, a fresh reset() + seek() still produced
     the fallback grid 16 / 25.5 / 33.5 / 41.5 / 49.5.

     A measured width is the cheap discriminator. It costs one measureText on a
     context that gets created anyway, and it changes the instant the SELECTED
     face changes — which is exactly the event the cache has to notice. Rounded
     to 2dp so sub-pixel jitter between otherwise identical states cannot
     fragment the cache. */
  var FACE_PROBE = 'HKnowledge';

  function faceStamp(font) {
    var c = faceStamp._c ||
            (faceStamp._c = document.createElement('canvas').getContext('2d'));
    c.font = font;
    return c.measureText(FACE_PROBE).width.toFixed(2);
  }

  function metrics(font, text) {
    /* U+0000 as the separator, written as an ESCAPE and not as a raw byte.
       A literal NUL in the source makes grep and ripgrep classify this file as
       binary and skip it, and it confuses diffs -- but the separator itself is
       right: it is the one character that cannot occur in a font shorthand or
       in headline text, so ('12px A','BC') and ('12px AB','C') cannot collide
       the way they would with an empty or a space separator. Aug 10 2026. */
    var key = font + '\u0000' + faceStamp(font) + '\u0000' + text;
    if (metricCache[key]) return metricCache[key];
    var c = document.createElement('canvas').getContext('2d');
    c.font = font;
    var m = c.measureText(text);
    var h = c.measureText('H');
    var out = {
      inkAsc:  m.actualBoundingBoxAscent  || 0,
      inkDesc: m.actualBoundingBoxDescent || 0,
      cap:     h.actualBoundingBoxAscent  || 0,
      asc:     m.fontBoundingBoxAscent    || 0,
      desc:    m.fontBoundingBoxDescent   || 0
    };
    metricCache[key] = out;
    return out;
  }

  /* ------------------------------------------------------------- instance */

  function Shutter(el, opts) {
    this.el = el;
    this.lines = [];
    this.eyebrow = opts && opts.eyebrow ? opts.eyebrow : null;
    this.raf = 0;
    this.t = 0;
    this.paused = false;
    this.built = false;

    this.o = {
      bands: 5,        /* MEASURED = 5. See the stylesheet. */
      run: 430,        /* ms a single slat takes to travel */
      stagger: 22,     /* ms between slat starts, top first, bottom last */
      lineLead: 70,    /* ms line 2 starts after line 1 */
      travel: 1,       /* scale on the measured amplitudes */
      ghost: 1,        /* scale on ghost opacity — see the HUD note */
      ghostLead: 0.42, /* MEASURED 0.40 on d02 band 4 */
      eyebrowMs: 380
    };

    /* BLUR IS IN CAP HEIGHTS, NOT PIXELS, and that is the whole reason this
       block exists. First pass hard-coded the stdDeviation ceiling at 30px and
       a 12px global floor, taken straight off a reference whose cap height is
       81px. This headline's cap is 45px at 1440 and 26px at 375, so those same
       numbers blurred every slat wider than the letters were tall and the
       capture came back as five grey bars with no letterforms in it at all.
       Every constant below is a fraction of the measured cap height, so the
       effect looks the same on a desktop hero and on a phone.

       MEASURED, off the word-edge falloff in the frames (85%-to-15% distance,
       against the 3px the settled frame shows for pure antialiasing):
         - the two near-static slats sit at 6-11px falloff all run ->
           sigma ~ 2-3px on an 81px cap  ->  ENV_SD = 0.035 cap
         - the long-throw slats never stop being readable as letters in any
           frame, which caps sigma at roughly a quarter of the cap height ->
           SD_MAX = 0.24 cap
       The 95px falloff measured on band 5 at 2.04s is NOT blur — it is the gap
       between the text copy at -271 and the ghost at -108. Reading it as blur
       is what produced the grey bars. */
    this.ENV_SD = 0.035;   /* global floor, x cap, decaying to 0 */
    this.SD_MAX = 0.11;    /* ceiling on the velocity term, x cap */
    this.SD_GAIN = 0.28;   /* stdDeviation per px-of-travel-per-frame */

    /* THE GHOST IS BLURRED LESS THAN THE TEXT, at 0.8x, and that is not a taste
       call. It is 42% of the way home (see ghostLead), so it is travelling at
       42% of the text's speed and a motion blur that tracks velocity has to be
       smaller for it. The first version had it at 1.3x on the assumption that a
       ghost should be the softer of the two; captured at 260ms it came back as
       a solid amber bar across the whole line with no letterforms left in it,
       because a horizontal sigma near 11px on a 45px cap closes the ~6px gaps
       between glyphs. The reference's accent copy is smeared but still legibly
       letter-shaped in every frame it appears in. */
    this.SD_GHOST = 0.8;
    if (opts && opts.o) this.set(opts.o);

    this.reduced = global.matchMedia &&
      global.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  Shutter.prototype.set = function (o) {
    for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) this.o[k] = o[k];
    /* is-running comes off with the slats. Leaving it on after a teardown puts
       the headline in the one state that has neither slats nor visible base
       text — an invisible h1 — which is what a caller that set() without a
       following play() would have been left with. */
    if (this.built) { this.teardown(); this.el.classList.remove('is-running'); }
    return this;
  };

  /* Total wall time of the whole moment: the last slat of the last line has to
     both start and finish. */
  Shutter.prototype.total = function () {
    var nLines = this.el.querySelectorAll('.sh-line').length || 1;
    return this.o.run
      + (this.o.bands - 1) * this.o.stagger
      + (nLines - 1) * this.o.lineLead;
  };

  Shutter.prototype.teardown = function () {
    var i, l;
    for (i = 0; i < this.lines.length; i++) {
      l = this.lines[i];
      while (l.bandEls.length) l.el.removeChild(l.bandEls.pop());
    }
    this.lines = [];
    this.built = false;
  };

  Shutter.prototype.build = function () {
    var self = this;
    var lineEls = this.el.querySelectorAll('.sh-line');
    var cs = getComputedStyle(this.el);
    var fontShort = cs.fontStyle + ' ' + cs.fontWeight + ' ' +
                    cs.fontSize + ' ' + cs.fontFamily;
    var fs = parseFloat(cs.fontSize);
    var amps = amplitudes(this.o.bands);
    this.cap = 0;     /* render() sizes every blur against this; set per build */

    Array.prototype.forEach.call(lineEls, function (lineEl, li) {
      var H = lineEl.getBoundingClientRect().height;
      var W = lineEl.getBoundingClientRect().width;
      var text = lineEl.getAttribute('data-text') ||
                 lineEl.textContent.trim();

      var m = metrics(fontShort, text);
      /* Fallback ratios if TextMetrics returned nothing (older Safari): a
         slightly-off pitch beats no slats. */
      var asc  = m.asc  || fs * 0.80;
      var desc = m.desc || fs * 0.20;
      var inkA = m.inkAsc  || fs * 0.76;
      var inkD = m.inkDesc || fs * 0.16;
      self.cap = self.cap || m.cap || fs * 0.72;

      /* Baseline inside the line box: half-leading above the em box, then the
         ascent.

         THE GRID RUNS ASCENDER-TOP TO BASELINE, and the descender is folded
         into the last slat rather than being given grid of its own. Dividing
         the FULL ink box (ascender to descender) was tried and captured: one
         letter in "Knowledge Hidden" has a descender, so the g tail alone
         stretched the box 11px and pushed the fifth slat entirely below the
         baseline, where four of the five slats did all the work and the fifth
         carried a single tail. Ascender-to-baseline is the span where every
         glyph has ink, so N slats across it is N slats you can actually see.
         It also still collapses to the reference exactly: for an all-caps word
         like IMMERSE, ascender-top to baseline IS the cap height. Sanity check
         against the recording — reference pitch 16.2px on an 81px cap =
         0.200 cap; here 9.2px on a 45px cap = 0.204 cap. */
      var halfLead = (H - (asc + desc)) / 2;
      var baseline = halfLead + asc;
      var inkTop = baseline - inkA;
      var pitch = inkA / self.o.bands;

      /* IF THE LINE WRAPPED the ink grid is meaningless — actualBoundingBox is
         measured on one canvas run of the string, so it would band the first
         visual row and leave the rest unsliced. H > 1.5 em boxes is the tell.
         Fall back to N equal slices of the whole element: the pitch is wrong
         but nothing vanishes. Reachable at 375px only if the type grows;
         measured at 375 and not currently hit (each line is exactly one 40px
         line box there). */
      var wrapped = H > (asc + desc) * 1.5;

      var rec = { el: lineEl, bandEls: [], bands: [], W: W, delay: li * self.o.lineLead };

      for (var b = 0; b < self.o.bands; b++) {
        var top, hgt;
        if (wrapped) {
          top = (H / self.o.bands) * b;
          hgt = H / self.o.bands;
        } else {
          top = inkTop + pitch * b;
          hgt = pitch;
        }
        /* Outer overhangs. 1.5px at the top for the antialiased fringe on the
           k/l/d/h tips; at the bottom, the descender depth so the g tail rides
           with the slat its letter belongs to. The bottom slat is therefore
           taller in BOX terms but not in INK terms — the extra strip is empty
           for every glyph except the one — so the rhythm the eye reads is still
           even. Getting this wrong in the other direction (outer slats stretched
           to the line box edges) doubled their apparent height and turned the
           shutter into a three-part tear; that version was captured and binned. */
        if (b === 0) { hgt += 1.5; top -= 1.5; }
        if (b === self.o.bands - 1) { hgt += inkD + 1.5; }

        var band = document.createElement('span');
        band.className = 'sh-band';
        band.setAttribute('aria-hidden', 'true');
        band.style.top = top + 'px';
        band.style.height = hgt + 'px';

        var ghost = document.createElement('span');
        ghost.className = 'sh-copy sh-copy--ghost';
        ghost.textContent = text;
        var txt = document.createElement('span');
        txt.className = 'sh-copy sh-copy--text';
        txt.textContent = text;

        /* Both copies are pulled back up by the slat's own offset so the text
           inside every slat lands on the same baseline as the settled line. */
        ghost.style.top = txt.style.top = (-top) + 'px';
        ghost.style.height = txt.style.height = H + 'px';

        band.appendChild(ghost);   /* ghost UNDER text — see the stylesheet */
        band.appendChild(txt);
        lineEl.appendChild(band);

        rec.bandEls.push(band);
        rec.bands.push({
          band: band,
          ghost: ghost,
          txt: txt,
          amp: amps[b] * W * self.o.travel,
          delay: rec.delay + b * self.o.stagger,
          lastG: -1,
          lastT: -1
        });
      }
      self.lines.push(rec);
    });

    this.built = true;
  };

  /* Render the whole moment at wall-clock time `t` ms. Pure function of t —
     no state carried between frames, which is what makes seek() honest. */
  Shutter.prototype.render = function (t) {
    var o = this.o;
    var total = this.total();
    var gp = clamp(t / total, 0, 1);
    var ge = ease(gp);

    /* GLOBAL ENVELOPE, two parts.

       BLUR FLOOR — real, and measured: the near-static slats never go fully
       sharp mid-run (6-11px edge falloff against 3px settled), so there is a
       whole-headline softness riding under the per-slat motion. 0.035 cap.

       OPACITY — nearly flat, and this corrects an earlier misreading worth
       recording. Total ink mass across the frames drops to ~52% of settled at
       2.04s, which looks like a hard fade-in. It is not: the long-throw slats
       are displaced 271px and half the word is simply clipped off the left of
       the component, so the mass leaves the frame rather than the letters
       fading. PEAK column ink, which blur and clipping do not move, only drops
       to 0.88 of settled. So the reference barely fades at all.
       0.62 -> 1 here is a deliberate small departure, not the measurement: the
       reference loops on a component that is already lit, so it never has to
       arrive out of nothing, where this headline enters an empty sky. */
    var cap = this.cap || 45;
    var envSd = this.ENV_SD * cap * (1 - ge);
    var envA = 0.62 + 0.38 * ge;
    var sdCeil = this.SD_MAX * cap;

    for (var i = 0; i < this.lines.length; i++) {
      var line = this.lines[i];
      for (var b = 0; b < line.bands.length; b++) {
        var s = line.bands[b];
        var lp = clamp((t - s.delay) / o.run, 0, 1);
        var e = ease(lp);

        /* Negative = left of home. Every slat comes from the same side: with a
           one-directional entry the RIGHT end of each line is the last place to
           be filled, which is the "rightmost settles last" the owner read off
           the recording. Alternating direction per slat reads as a shuffle, not
           a shutter. */
        var off = -s.amp * (1 - e);

        /* Velocity in px per frame, central difference over one 60fps frame.
           Blur follows velocity because that is what motion blur is; tying it
           to the remaining distance instead leaves a slat that has stopped
           still smeared. */
        var v = s.amp * (
          ease(clamp((t - s.delay + 8.35) / o.run, 0, 1)) -
          ease(clamp((t - s.delay - 8.35) / o.run, 0, 1))
        );
        v = Math.abs(v);

        var sdT = Math.min(sdCeil, v * this.SD_GAIN) + envSd;
        var sdG = Math.min(sdCeil, v * this.SD_GAIN * this.SD_GHOST) + envSd;
        var rT = rung(sdT), rG = rung(sdG);

        /* THE ENVELOPE GOES ON THE SLAT, NOT ON THE TEXT COPY. Put it on the
           text and the text is translucent, so the amber ghost underneath shows
           straight through every glyph and the whole slat reads as one amber
           bar instead of bone letters with amber sticking out past them —
           which is exactly what the 200ms and 330ms captures showed before this
           moved. On the slat, ghost and text fade as one unit and the text
           still occludes the ghost inside it, which is how the reference
           composites: its accent is only ever visible where the word has not
           arrived yet. */
        s.band.style.opacity = envA.toFixed(3);
        s.txt.style.transform = 'translate3d(' + off.toFixed(2) + 'px,0,0)';
        if (rT !== s.lastT) {
          s.txt.style.filter = rT === 0 ? 'none' : 'url(#shBlur' + rT + ')';
          s.lastT = rT;
        }

        /* The ghost sits 42% of the way home from the text — MEASURED 0.40 on
           d02 band 4 (text -271, accent -108). It is only visible while the
           slat is actually moving, and the threshold is in cap heights for the
           same reason the blur is: 0.3 cap of travel per frame is full
           strength, which puts the accent at full on the long-throw slats and
           at nothing on the near-static ones — exactly the split the accent
           measurements across d02..d09 show (bands 2 and 3 never registered any
           accent at all, bands 4 and 5 held it until 2.39s and 2.46s). */
        /* (1 - e) on top of the velocity term, because the accent dies FASTER
           than the motion does. MEASURED: at 2.32s the reference's accent
           saturation is down to 0.03-0.06 on bands 4 and 5, yet d06 at that
           same instant still shows band 5 blurred and short of its mark. Purely
           velocity-driven, the amber was still at ~0.66 at the equivalent
           moment here and the headline stayed orange far too long. */
        var ga = clamp(clamp(v / (0.3 * cap), 0, 1) * (1 - e) * 1.05 * o.ghost, 0, 1);
        s.ghost.style.transform =
          'translate3d(' + (off * o.ghostLead).toFixed(2) + 'px,0,0)';
        s.ghost.style.opacity = ga.toFixed(3);
        if (rG !== s.lastG) {
          s.ghost.style.filter = rG === 0 ? 'none' : 'url(#shBlur' + rG + ')';
          s.lastG = rG;
        }
      }
    }

    if (this.eyebrow) {
      var ep = ease(clamp(t / this.o.eyebrowMs, 0, 1));
      this.eyebrow.style.opacity = (1 - ep).toFixed(3);
      this.eyebrow.style.transform = 'translateY(' + (-6 * ep).toFixed(2) + 'px)';
    }
  };

  Shutter.prototype.settle = function () {
    this.el.classList.remove('is-running');
    this.teardown();
    if (this.eyebrow) {
      this.eyebrow.style.opacity = '0';
      this.eyebrow.style.transform = 'translateY(-6px)';
    }
  };

  Shutter.prototype.play = function () {
    var self = this;
    cancelAnimationFrame(this.raf);

    if (this.reduced) {
      /* Plain fade, no slats, no filters, no rAF.

         WHAT THIS ACTUALLY DOES ON A REDUCED-MOTION MACHINE: nothing visible.
         MEASURED — a bare probe div with `transition: opacity 400ms linear`
         reads 0.167 at 120ms in a normal context and 1 with zero running
         animations in a reduced-motion one. Chromium does not merely expose the
         media query, it refuses to run CSS transitions at all while the
         preference is set. So the headline appears instantly there. That is the
         correct outcome and is left alone: the transition below is the declared
         intent for engines that do run it, and an instant appearance is
         strictly safer than a fade, never the reverse. Do not "fix" this by
         moving the ramp onto rAF — that would drive an animation the user's own
         browser has just decided not to run.

         The fade is written as inline style rather than a class flip for a
         reason that survives regardless: the jump to 0 has to happen with the
         transition OFF, or every replay fades the headline OUT over 420ms and
         only then back in.

         420ms is stated here rather than taken from --motion-slow because that
         token is deliberately zeroed inside the reduce block in tokens.css. */
      this.el.classList.remove('is-running', 'is-armed');
      this.teardown();
      var texts = this.el.querySelectorAll('.shutter__text');
      var i;
      for (i = 0; i < texts.length; i++) {
        texts[i].style.transition = 'none';
        texts[i].style.opacity = '0';
      }
      if (this.eyebrow) {
        this.eyebrow.style.transition = 'none';
        this.eyebrow.style.opacity = '1';
        this.eyebrow.style.transform = 'none';
      }
      void this.el.offsetWidth;   /* flush: makes 0 a real computed start value */
      for (i = 0; i < texts.length; i++) {
        texts[i].style.transition = 'opacity 420ms cubic-bezier(0.4, 0, 0.2, 1)';
        texts[i].style.opacity = '1';
      }
      if (this.eyebrow) {
        this.eyebrow.style.transition = 'opacity 420ms cubic-bezier(0.4, 0, 0.2, 1)';
        this.eyebrow.style.opacity = '0';
      }
      return this;
    }

    if (this.built) this.teardown();
    this.el.classList.add('is-running');
    this.build();
    this.t = 0;
    this.paused = false;
    this.render(0);

    var t0 = null, total = this.total();
    function step(now) {
      if (t0 === null) t0 = now;
      if (self.paused) { self.raf = requestAnimationFrame(step); return; }
      self.t = now - t0;
      if (self.t >= total) { self.t = total; self.render(total); self.settle(); return; }
      self.render(self.t);
      self.raf = requestAnimationFrame(step);
    }
    this.raf = requestAnimationFrame(step);
    return this;
  };

  /* Freeze at an exact millisecond. This is the verification hook: it rebuilds
     the slats if they were torn down, holds the rAF loop, and renders one
     deterministic frame. */
  Shutter.prototype.seek = function (ms) {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    if (this.reduced) return this;
    if (!this.built) { this.el.classList.add('is-running'); this.build(); }
    this.t = clamp(ms, 0, this.total());
    this.paused = true;
    if (this.t >= this.total()) { this.render(this.total()); this.settle(); return this; }
    this.el.classList.add('is-running');
    this.render(this.t);
    return this;
  };

  Shutter.prototype.reset = function () {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.teardown();
    this.el.classList.remove('is-running', 'is-armed');
    if (this.eyebrow) { this.eyebrow.style.opacity = ''; this.eyebrow.style.transform = ''; }
    return this;
  };

  function mount(el, opts) { return new Shutter(el, opts); }

  global.ShutterText = { mount: mount, EASE: EASE, SD: SD, AMP5: AMP5 };
}(window));
