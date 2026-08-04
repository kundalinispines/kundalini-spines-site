/* ==========================================================================
   SCROLL WEIGHT — how heavy the page feels under a mouse wheel.

   Reads --scroll-weight off :root (defined in css/base.css, so it is site-wide
   and this file can be added to any page with one script tag). 0 is OFF and
   means genuinely native: the handler returns before it touches the event, so
   at 0 this file is inert and the page scrolls exactly as it did before it
   existed. 1 is the heaviest setting.

   WHAT IT DOES NOT DO, deliberately:

   1. NO TRANSFORM WRAPPER. The usual "smooth scroll" library moves the whole
      document with translate3d and leaves scrollY at 0. That would break this
      site specifically: the nav is position:fixed, and js/spine-bg.js positions
      the spine layer in DOCUMENT space off #tracks and drives --charge from
      window.scrollY. Under a transform scroller the column would sit still
      while the page moved past it. The real scroll position stays the truth
      here; all this does is take smaller steps toward it.

   2. NO TOUCH HIJACKING. Touch scrolling already has momentum, supplied by the
      OS and tuned better than anything here. Only `wheel` is intercepted, so
      phones and trackpad-as-touch are untouched.

   3. NO KEYBOARD HIJACKING. Page Up / Home / arrows / space and every in-page
      anchor keep going through the browser, which honours the
      `html { scroll-behavior: smooth }` already in base.css.

   So this changes the wheel and nothing else. Scrollbar drags, anchor jumps and
   the carousel's own scrollIntoView all still land where they always did — a
   `scroll` listener re-anchors the target whenever the animation is not the one
   doing the scrolling, so the two can never drift apart.

   ACCESSIBILITY: prefers-reduced-motion disables it outright, at any weight.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* Read live rather than caching, so the ?tune slider takes effect on the very
     next wheel event with no re-init. One getComputedStyle per wheel event is
     nothing next to what the browser does to handle the scroll itself. */
  function weight() {
    var v = parseFloat(getComputedStyle(root).getPropertyValue('--scroll-weight'));
    if (isNaN(v)) return 0;
    return v < 0 ? 0 : (v > 1 ? 1 : v);
  }

  function maxScroll() {
    return Math.max(0, root.scrollHeight - window.innerHeight);
  }

  var target = window.scrollY;
  var running = false;
  var lastT = 0;
  var driving = false;   /* true only while WE are the ones calling scrollTo */

  /* scroll-behavior: smooth is set on <html> in base.css, so a bare scrollTo()
     would be animated BY THE BROWSER as well — two easings fighting over the
     same value, which reads as a stutter rather than as weight. 'instant'
     overrides it per call and leaves anchor links smooth. */
  function jump(y) {
    driving = true;
    try {
      window.scrollTo({ top: y, left: 0, behavior: 'instant' });
    } catch (e) {
      /* Older engines reject the keyword. Suppress the stylesheet instead. */
      var prev = root.style.scrollBehavior;
      root.style.scrollBehavior = 'auto';
      window.scrollTo(0, y);
      root.style.scrollBehavior = prev;
    }
    driving = false;
  }

  function frame(t) {
    if (!running) return;
    var dt = lastT ? Math.min(64, t - lastT) : 16;   /* clamp tab-switch gaps */
    lastT = t;

    /* Exponential decay toward the target, with the time constant derived from
       the weight. Framing it as a time constant rather than a per-frame
       fraction is what makes it behave the same on a 60Hz and a 144Hz display —
       a fixed "move 12% of the way each frame" is more than twice as fast on
       the faster screen, which is the classic bug in this kind of code.
         weight 0.25 -> tau  36ms, barely perceptible
         weight 0.50 -> tau  85ms, clearly weighted
         weight 1.00 -> tau 280ms, heavy */
    var w = weight();
    var tau = 20 + w * w * 260;
    var k = 1 - Math.exp(-dt / tau);

    var cur = window.scrollY;
    var gap = target - cur;
    if (Math.abs(gap) < 1) {
      running = false; lastT = 0;
      jump(target);
      return;
    }
    /* MEASURED: without the 1px floor the last few pixels take longer than the
       whole rest of the movement. An exponential step gets small before the gap
       does, and the scroll position quantises to whole pixels — so once
       gap * k rounds to zero the loop spins, making no progress, until the gap
       itself falls under the cutoff. A 600px wheel tick at weight 0.5 took
       ~1.3s to finally land instead of the ~600ms the time constant predicts,
       all of it in a mushy tail. */
    var step = gap * k;
    if (step > -1 && step < 1) step = gap > 0 ? 1 : -1;
    jump(cur + step);
    requestAnimationFrame(frame);
  }

  /* Let a scrollable inner element keep its own wheel. Nothing on the site uses
     one today, but swallowing every wheel event unconditionally is how this
     kind of module breaks a modal or a code block six months later. */
  function innerScroller(el, dy) {
    while (el && el.nodeType === 1 && el !== document.body) {
      var o = getComputedStyle(el).overflowY;
      if ((o === 'auto' || o === 'scroll') && el.scrollHeight > el.clientHeight + 1) {
        if (dy < 0 ? el.scrollTop > 0
                   : el.scrollTop < el.scrollHeight - el.clientHeight - 1) return true;
      }
      el = el.parentElement;
    }
    return false;
  }

  window.addEventListener('wheel', function (e) {
    if (reduce.matches) return;
    var w = weight();
    if (!w) return;                                   /* 0 = fully native */
    if (e.ctrlKey || e.metaKey) return;               /* pinch / browser zoom */
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    if (innerScroller(e.target, e.deltaY)) return;

    var d = e.deltaY;
    if (e.deltaMode === 1) d *= 16;                   /* lines  */
    else if (e.deltaMode === 2) d *= window.innerHeight;  /* pages */

    e.preventDefault();
    if (!running) target = window.scrollY;            /* re-anchor when idle */
    target += d;
    if (target < 0) target = 0;
    var m = maxScroll();
    if (target > m) target = m;

    if (!running) { running = true; lastT = 0; requestAnimationFrame(frame); }
  }, { passive: false });

  /* Anything that scrolls the page WITHOUT going through the wheel — a
     scrollbar drag, a keyboard key, an anchor, the carousel's scrollIntoView —
     resets the target, so the next wheel tick starts from where the page
     actually is instead of yanking it back. */
  window.addEventListener('scroll', function () {
    if (!driving && !running) target = window.scrollY;
  }, { passive: true });

  /* Grabbing anything with the pointer cancels the momentum: dragging the
     carousel while the page is still gliding underneath feels broken. */
  window.addEventListener('pointerdown', function () {
    if (running) { running = false; lastT = 0; target = window.scrollY; }
  }, { passive: true });

  /* The document can get shorter under a running animation (the focus panel
     collapsing, an image failing to load), which would leave the target past
     the end and the page pinned at the bottom for a beat. */
  window.addEventListener('resize', function () {
    var m = maxScroll();
    if (target > m) target = m;
  });
})();
