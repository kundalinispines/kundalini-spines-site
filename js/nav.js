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
