// Nav: scroll state + accessible mobile menu toggle
(function () {
  const nav = document.querySelector('.nav');
  const toggle = document.querySelector('.nav__toggle');
  const links = document.querySelector('.nav__links');
  if (!nav) return;

  const onScroll = () => {
    nav.classList.toggle('is-scrolled', window.scrollY > 8);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---- Publish the nav's height as --nav-h -------------------------------
     THE NAV'S HEIGHT IS NOT A CONSTANT AND MUST NOT BE HARDCODED.
     It is padding plus the line boxes of the mark and the links, so it depends
     on which fonts have actually loaded. Before the webfonts arrive it is one
     height; after Big Shoulders and IBM Plex Mono swap in it is another. It also
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
