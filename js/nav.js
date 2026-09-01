// Nav: scroll state + accessible mobile menu toggle
(function () {
  /* ---- The sky lock: --sky-lock, touch devices only ----------------------
     This file hosts it because it is the ONE script every sky page loads,
     detail pages included — the sky itself is CSS-only by design and this is
     a progressive enhancement on top, so it must not live in a page-specific
     module. It runs BEFORE the .nav early-return on purpose: a page without
     a nav still has a sky.

     WHY IT EXISTS — owner on Brave for Android, 1 Sep 2026: with every fixed
     layer pinned to 100lvh (css/star-bg.css build 30) the sky held still
     against the collapsing URL bar, EXCEPT when Brave's bottom toolbar popped
     up — Brave recomputes the large viewport itself when that bar appears,
     so even lvh moves there and `cover` re-crops the sky.

     THE MECHANISM: publish the largest viewport height ever observed at the
     current width as --sky-lock (px). The sky layers read
     var(--sky-lock, 100lvh), so a browser whose lvh is honest never sees a
     different number (max(lvh, innerHeight) == lvh there — the probe measures
     real lvh in px), while a browser that shrinks lvh under its own UI keeps
     the old maximum and the sky stays put. The lock only ever GROWS; a WIDTH
     change (orientation flip, split-screen) resets it, because a different
     width is a different page geometry, not browser chrome.

     COARSE-POINTER GATED, deliberately: on desktop lvh == vh and window
     resizes are real geometry changes the sky should follow — a sticky
     maximum there would stop the sky rescaling when the window shrinks.
     Phones and tablets are where dynamic browser chrome exists at all.

     BUILD 32 — THE LOCK REMEMBERS ACROSS PAGE LOADS. The owner still saw
     the sky move after build 31, and the hole was the lock's lifecycle, not
     its coverage: lockH started at 0 on EVERY page load, and a page is
     normally opened with Brave's chrome up — so each load published the
     shrunken height, and the first scroll-down (chrome hides, viewport
     grows) grew the lock and re-cropped the sky once. Once per page, every
     page, which reads as "still moving". The per-width maximum is now
     persisted (ks.skyLock in localStorage, {w, h}) and seeded at script
     run, so a revisited width starts already locked at the tall height and
     only the first-ever scroll at a given width can move the sky. A stale
     OVERSIZED value is harmless — the layer overscans below the viewport
     and holds still; an undersized one grows on first observation, which is
     just the old behaviour once. */
  if (window.matchMedia('(pointer: coarse)').matches &&
      window.CSS && CSS.supports && CSS.supports('height', '100lvh')) {
    const probe = document.createElement('div');
    probe.style.cssText =
      'position:absolute;top:0;left:0;width:0;height:100lvh;visibility:hidden;pointer-events:none';
    document.body.appendChild(probe);
    const LOCK_KEY = 'ks.skyLock';
    let lockW = window.innerWidth;
    let lockH = 0;
    try {
      const saved = JSON.parse(localStorage.getItem(LOCK_KEY) || 'null');
      if (saved && saved.w === lockW && isFinite(saved.h) && saved.h > 0) lockH = saved.h;
    } catch (e) {}
    if (lockH) document.documentElement.style.setProperty('--sky-lock', lockH + 'px');
    const setSkyLock = () => {
      if (window.innerWidth !== lockW) { lockW = window.innerWidth; lockH = 0; }
      const h = Math.max(probe.offsetHeight, window.innerHeight);
      if (h > lockH) {
        lockH = h;
        document.documentElement.style.setProperty('--sky-lock', lockH + 'px');
        try { localStorage.setItem(LOCK_KEY, JSON.stringify({ w: lockW, h: lockH })); } catch (e) {}
      }
    };
    setSkyLock();
    window.addEventListener('resize', setSkyLock);
  }

  /* ---- html.sky-center: the Android center-anchor (star-build 34) --------
     The build-33 measurement (V2HANDOFF 53): the sky layers are pixel-still
     in page space, and what the owner sees is the BROWSER translating the
     whole rendered surface as its toolbars animate — top bar ~56 CSS px of
     screen shift, invisible to every DOM metric. Page code cannot stop it;
     it can only choose an anchor whose screen drift is smallest. For an
     anchor at fraction f of the viewport, drift = -topBarΔ + f·totalΔ;
     centring (f = 0.5) turns Brave's 56 px ride into ~4 px (measured bars:
     top 56, bottom 63) and halves top-bar-only Chrome. ANDROID-GATED, not
     coarse-gated: bottom-bar-only browsers (iOS Safari) have topBarΔ = 0,
     the top anchor is already perfect there, and centring would ADD ~25 px
     of drift. css/star-bg.css and css/deep-field-bg.css carry the matching
     rules; js/clouds-sky.js pins its stage the same way. */
  if (/Android/i.test(navigator.userAgent) &&
      window.matchMedia('(pointer: coarse)').matches &&
      window.CSS && CSS.supports && CSS.supports('height', '100lvh')) {
    document.documentElement.classList.add('sky-center');
  }

  /* ---- ?skydiag: on-device sky diagnostics (star-build 33) ----------------
     The build-32 lock verified locally and the owner STILL sees the sky
     move on-device — continuously, while swiping. Every hypothesis left
     standing is about what Brave does with the layout viewport mid-gesture,
     which no desktop harness reproduces (the browser pane cannot even fire
     a real emulated resize — see V2HANDOFF 53). So: measure on the phone.
     Open any page with ?skydiag and swipe; every row shows
     current [min–max since reset]; TAP THE PANEL to reset the ranges after
     the load settles, swipe up and down a few times, screenshot.

     HOW TO READ IT:
     - `sky h` / `bb h` ranges widen while swiping -> the layer BOX is still
       changing; the lock is being rewritten or overridden — look at `lock`
       and `writes`.
     - boxes hold but `scr t` ranges -> the layout viewport itself is
       translating against the screen during chrome animation and the fixed
       stack rides it; no sizing fix can help — the answer is visualViewport
       compensation.
     - everything holds and the sky still visibly moves -> what moves is not
       these layers; suspect the cloud canvas contents or a non-sky layer.
     Costs nothing without the query flag; removal is this one block. */
  if (/[?&]skydiag\b/.test(location.search)) {
    const mm = {};
    const track = (k, v) => {
      if (!isFinite(v)) return 0;
      const s = mm[k] || (mm[k] = { min: v, max: v });
      if (v < s.min) s.min = v;
      if (v > s.max) s.max = v;
      return v;
    };
    const fmt = (k, v, d) => {
      d = d || 0;
      const s = mm[k];
      return v.toFixed(d) + (s ? ' [' + s.min.toFixed(d) + '–' + s.max.toFixed(d) + ']' : '');
    };
    const dprobe = document.createElement('div');
    dprobe.style.cssText =
      'position:absolute;top:0;left:0;width:0;height:100lvh;visibility:hidden;pointer-events:none';
    /* The sentinel copies the sky layers' exact geometry so its rect IS the
       sky box, readable where a pseudo-element's is not. */
    const sky = document.createElement('div');
    sky.style.cssText =
      'position:fixed;top:0;left:0;width:2px;height:100lvh;visibility:hidden;pointer-events:none';
    if (window.CSS && CSS.supports && CSS.supports('height', '100lvh')) {
      sky.style.height = 'var(--sky-lock, 100lvh)';
    }
    const panel = document.createElement('pre');
    panel.style.cssText =
      'position:fixed;top:72px;left:8px;z-index:2147483647;margin:0;padding:6px 8px;' +
      'font:10px/1.5 monospace;color:#8f8;background:rgba(0,0,0,.75);border-radius:4px;white-space:pre';
    let evR = 0, evS = 0, lockWrites = 0, lastLock = '';
    panel.addEventListener('click', () => {
      for (const k in mm) delete mm[k];
      evR = 0; evS = 0; lockWrites = 0;
    });
    document.body.appendChild(dprobe);
    document.body.appendChild(sky);
    document.body.appendChild(panel);
    window.addEventListener('resize', () => { evR++; }, { passive: true });
    window.addEventListener('scroll', () => { evS++; }, { passive: true });
    const vv = window.visualViewport;
    const draw = () => {
      const rect = sky.getBoundingClientRect();
      const lock =
        getComputedStyle(document.documentElement).getPropertyValue('--sky-lock').trim() || '(unset)';
      if (lock !== lastLock) { if (lastLock) lockWrites++; lastLock = lock; }
      const bb = parseFloat(getComputedStyle(document.body, '::before').height) || 0;
      const vvT = vv ? vv.offsetTop : 0;
      /* The build in the title is READ, not written: a hardcoded label
         shipped saying b33 on the build-34 deploy and cost a round of
         "still stale?" — the computed --star-build cannot lie. */
      const starBuild =
        getComputedStyle(document.documentElement).getPropertyValue('--star-build').trim() || '?';
      panel.textContent =
        'SKY DIAG b' + starBuild + ' (tap=reset)\n' +
        'in  ' + fmt('iw', track('iw', innerWidth)) + ' x ' + fmt('ih', track('ih', innerHeight)) + '\n' +
        'lvh ' + fmt('lvh', track('lvh', dprobe.offsetHeight)) + '\n' +
        'lock ' + lock + '  writes ' + lockWrites + '\n' +
        (vv
          ? 'vv h ' + fmt('vvh', track('vvh', vv.height)) + ' top ' + fmt('vvt', track('vvt', vvT)) +
            ' sc ' + fmt('vvs', track('vvs', vv.scale), 2) + '\n'
          : 'vv (none)\n') +
        'sky t ' + fmt('st', track('st', rect.top)) + ' h ' + fmt('sh', track('sh', rect.height)) + '\n' +
        'scr t ' + fmt('sct', track('sct', rect.top - vvT)) + '\n' +
        'bb h ' + fmt('bb', track('bb', bb)) + '\n' +
        'ev r' + evR + ' s' + evS + '  y ' + Math.round(window.scrollY);
    };
    /* rAF for smoothness while swiping, but never rAF ALONE: a hidden or
       throttled tab freezes rAF entirely (measured in the browser pane —
       the panel stayed empty until an interval was added), so a slow
       interval keeps the readout truthful everywhere. draw() is one
       idempotent render; only loop() re-queues. */
    const loop = () => { draw(); requestAnimationFrame(loop); };
    loop();
    setInterval(draw, 500);
  }

  const nav = document.querySelector('.nav');
  const toggle = document.querySelector('.nav__toggle');
  const links = document.querySelector('.nav__links');
  if (!nav) return;

  /* ---- The collapse: --nav-p, written on every scroll frame --------------
     The bar is a continuous mechanism (see css/components.css): every visual
     value interpolates over the same 0→1 travel, computed here from a 150px
     scroll ramp. rAF-throttled so a wheel flurry costs one write per frame.
     Reduced motion still collapses — the pinned compact bar is a layout
     affordance, not decoration — it just does it in one step.
     (.is-scrolled is no longer toggled; the class in static markup is inert.) */
  const COLLAPSE_PX = 150;
  const still = window.matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;
  const onScroll = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      const y = window.pageYOffset || document.documentElement.scrollTop || 0;
      const p = still.matches ? (y > 8 ? 1 : 0) : Math.min(1, Math.max(0, y / COLLAPSE_PX));
      nav.style.setProperty('--nav-p', p.toFixed(4));
      setNavH(); // padding-block change; ResizeObserver watches the content box and misses it
    });
  };

  /* ---- Publish the nav's height as --nav-h -------------------------------
     THE NAV'S HEIGHT IS NOT A CONSTANT AND MUST NOT BE HARDCODED.
     It is padding plus the line boxes of the mark and the links, so it depends
     on which fonts have actually loaded. Before the webfonts arrive it is one
     height; after Archivo and the Plex faces swap in it is another. It also
     moves with browser zoom and with a user's minimum-font-size setting.

     This exists because css/track-experience.css needs it: scroll-margin-top on
     #tracks decides where an anchor jump parks the section relative to this bar,
     and getting it wrong by a few pixels exposes the last rows of the hero video
     in the strip below the bar — a thin band of moving footage under the
     hairline. It was hardcoded at 86px, derived from a measured 89px nav. That
     89 was measured in an environment where fonts.googleapis.com was blocked, so
     it was the FALLBACK font's metric, not the real one. The tell was that it
     came out as exactly 89 at 1440, 1024, 768 and 390 — a number that does not
     move across four breakpoints is a number that is not measuring what you
     think it is.

     Re-published on font load, on resize, and on any change to the element
     itself, so the value can never be stale. */
  const root = document.documentElement;
  const setNavH = () => {
    root.style.setProperty('--nav-h', Math.round(nav.getBoundingClientRect().height) + 'px');
  };
  setNavH();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(setNavH);
  window.addEventListener('resize', setNavH);
  if (window.ResizeObserver) new ResizeObserver(setNavH).observe(nav);

  /* Wired here, after setNavH exists — onScroll's frame callback calls it. */
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const isOpen = links.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
      toggle.textContent = isOpen ? 'Close' : 'Menu';
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    links.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => {
        links.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.textContent = 'Menu';
        document.body.style.overflow = '';
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && links.classList.contains('is-open')) {
        links.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.textContent = 'Menu';
        document.body.style.overflow = '';
        toggle.focus();
      }
    });
  }
})();
