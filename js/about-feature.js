/* ==========================================================================
   ABOUT — MAGAZINE FEATURE BEHAVIOUR
   Aug 11 2026. Three jobs, all of them small:
     1. the masthead reveal + opener parallax, driven by scroll POSITION
     2. the section-by-section reveal of everything tagged .ks-r
     3. pausing the graveyard clip whenever it is off screen

   Partner file: css/about-feature.css. Neither is useful without the other,
   and the CSS owns every value that can be expressed as a value — this file
   writes only the two properties that have to change per frame.

   NO DEPENDENCY on js/spine-bg.js or js/scroll-weight.js, and it must stay
   that way: scroll-weight damps WHEEL events toward the position the browser
   would have reached, so reading scroll position (rather than listening for
   wheel deltas) is what keeps this animation correct while that damping is on.
   ========================================================================== */
(function () {
  'use strict';

  document.documentElement.classList.remove('no-js');

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var hero   = document.querySelector('[data-about-hero]');
  var media  = document.querySelector('[data-about-parallax]');
  var words  = document.querySelectorAll('[data-about-word]');
  var eyebrow = document.querySelector('[data-about-eyebrow]');
  var deck   = document.querySelector('[data-about-standfirst]');
  var cue    = document.querySelector('[data-about-cue]');

  /* ---- 1. Masthead ------------------------------------------------------ */
  if (hero && !reduced) {
    var ticking = false;

    var ease = function (t) { return 1 - Math.pow(1 - t, 3); };
    var seg  = function (p, a, b) { return ease(Math.min(Math.max((p - a) / (b - a), 0), 1)); };

    var mask = function (el, t) {
      if (!el) return;
      /* clip-path, not opacity: the letters wipe UP out of a crop, the way a
         masthead is printed onto a photograph. 108% rather than 100% because
         Anton's descenders and the line-height's half-leading both sit below
         the box the crop is measured from — at 100% the tails of the letters
         are still visible on the first frame. */
      el.style.clipPath  = 'inset(' + ((1 - t) * 108).toFixed(2) + '% 0% 0% 0%)';
      el.style.transform = 'translate3d(0,' + ((1 - t) * 16).toFixed(2) + '%,0)';
    };

    var frame = function () {
      ticking = false;
      var vh = window.innerHeight || 1;
      /* Progress is measured against the hero's OWN track height, not against
         a fixed pixel count: the reveal then finishes at the same point in the
         reader's scroll on any viewport, and nothing needs retuning per device. */
      var travel = Math.max(hero.offsetHeight - vh, 1);
      var p = Math.min(Math.max(-hero.getBoundingClientRect().top / travel, 0), 1);

      if (media) {
        /* THE TRAVEL IS THE BOTTOM BLEED, NOT A FRACTION OF THE VIEWPORT. This
           shipped as -p * vh * 0.4 and the owner caught what that does
           (Aug 12 2026): the media was bled -14% past the stage, so the photo
           only had 0.14 * stage height of upward travel before its bottom edge
           climbed into the stage — 0.4 * vh is nearly three times that, and
           from p ≈ 0.35 the strip under the headline was raw page, with
           "SPINES" half on the photo and half on sky. The scrim is a CHILD of
           the media and left with it, so the legibility gradient went too.

           The shift is the media's overhang BELOW the stage, derived from the
           CSS so the bleed is written in exactly one place. Upward travel only
           ever spends the BOTTOM bleed — which is why about-feature.css bleeds
           asymmetrically (-4% top, -24% bottom): same total height and
           therefore the same side crop as the symmetric -14%, but 24% of
           travel instead of 14%, and the rest frame gains cap headroom. The
           6% scale is the safety margin on top. To change the drift, change
           the CSS bottom bleed; this line follows it. */
        var shift = Math.max(0, media.offsetHeight - media.offsetParent.offsetHeight + media.offsetTop);
        media.style.transform = 'translate3d(0,' + (-p * shift).toFixed(1) + 'px,0) scale(' + (1 + p * 0.06).toFixed(4) + ')';
      }

      var e = seg(p, 0.00, 0.12);
      if (eyebrow) {
        eyebrow.style.opacity = e;
        eyebrow.style.transform = 'translateY(' + ((1 - e) * 14).toFixed(1) + 'px)';
      }
      /* The two words overlap rather than running in sequence — a clean
         one-then-two stagger reads as a loading spinner, an overlap reads as
         one gesture. */
      mask(words[0], seg(p, 0.04, 0.34));
      mask(words[1], seg(p, 0.14, 0.48));

      var d = seg(p, 0.42, 0.68);
      if (deck) {
        deck.style.opacity = d;
        deck.style.transform = 'translateY(' + ((1 - d) * 14).toFixed(1) + 'px)';
      }
      if (cue) cue.style.opacity = 1 - seg(p, 0.02, 0.18);
    };

    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(frame);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    frame();
  } else if (hero) {
    /* Reduced motion: show the finished state and never touch scroll. */
    hero.classList.add('is-static');
  }

  /* ---- 2. Section reveals ----------------------------------------------- */
  var reveals = document.querySelectorAll('.ks-r');
  if (reduced || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(reveals, function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    Array.prototype.forEach.call(reveals, function (el, i) {
      /* A small stagger within each group of four. Capped at three steps —
         beyond that the last item in a long section arrives noticeably after
         the reader's eye has already reached it. */
      el.style.transitionDelay = (Math.min(i % 4, 3) * 60) + 'ms';
      io.observe(el);
    });
  }

  /* ---- 3. The graveyard clip -------------------------------------------- */
  /* Autoplay is deliberately NOT set in the markup. A looping video plays for
     the whole visit otherwise, including the ~90% of this page where it is off
     screen, and on a phone that is the single most expensive thing here. */
  var clip = document.querySelector('[data-about-clip]');
  if (clip && 'IntersectionObserver' in window) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { var pr = clip.play(); if (pr) pr.catch(function () {}); }
        else { clip.pause(); }
      });
    }, { threshold: 0.25 });
    vio.observe(clip);
  } else if (clip) {
    clip.setAttribute('autoplay', '');
  }
})();
