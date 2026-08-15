/* SPINE DOCUMENT — the left-axis home's mechanism. Vanilla port (Aug 13 2026)
   of SpineDocScreen.jsx from the owner's design drop; the CSS half lives in
   css/spine-doc.css.

   One long scrolling page with the axis pinned to the hard left edge.
   Scrolling lights the node you are passing; clicking one jumps to it.
   No fixed positions: every node's vertical placement is MEASURED from its own
   section's headline, so the throw always points at the words it belongs to.

   Ported with one deliberate change from the reference: positions are measured
   with getBoundingClientRect against the document wrapper's own rect rather
   than offsetTop. The hero escapes the content column with negative margins
   and is position:relative, so its children's offsetTop answers "where inside
   the hero", not "where on the rail" — the rect subtraction answers the right
   question for every section the same way. */
(function () {
  const doc = document.querySelector('.ksd-doc');
  const rail = document.querySelector('.ksd-rail');
  if (!doc || !rail) return;

  const sections = Array.prototype.slice
    .call(document.querySelectorAll('[data-ksd-section]'))
    .map(function (el) {
      return {
        id: el.getAttribute('data-ksd-section'),
        label: el.getAttribute('data-ksd-label') || el.getAttribute('data-ksd-section'),
        el: el,
        head: el.querySelector('.ksd-head')
      };
    });
  if (!sections.length) return;

  let tops = null;      // section id -> y in DOC coordinates (px from doc top)
  let railTop = 0;      // where the rail begins in doc coordinates — see measure()
  let vertEls = [];     // the vertebra spans, for the scroll pass
  let nodeBits = {};    // id -> { node, throwEl }
  let fieldR = 160;     // vertebra field radius; the --ksd-field token owns it

  /* The step is ~30px with a ±5px sway. The sway is a sine, not noise: a
     repeating irregularity reads as anatomy, whereas true randomness reads as
     a mistake. Takes an explicit start because the rail no longer begins at the
     top of the document; the 26px is the inset from wherever it does begin. */
  function vertebraYs(start, end) {
    const out = [];
    let y = start + 26, i = 0;
    while (y < end - 20) {
      out.push(Math.round(y));
      y += 30 + Math.sin(i * 1.7) * 5;
      i++;
    }
    return out;
  }

  /* Node placement is measured off each headline's first text line, then
     re-measured whenever the layout can have moved (fonts swapping in, images
     landing, resize).

     The rail STARTS BELOW THE HERO (Aug 15 2026, owner's call — it used to run
     the full height of the document and crossed the footage). railTop is the
     hero video's bottom edge, measured rather than guessed, because the hero is
     a viewport-height block that escapes the content column: any constant here
     would be wrong at the next breakpoint. Everything below stays in DOC
     coordinates and is converted at the point of placement — the field maths in
     onScroll compares against document positions, so keeping one coordinate
     space and subtracting late is what stops the two from drifting apart.

     There is no Home node any more; the hero carries no data-ksd-section, so it
     never enters `sections` and the special case that used to place its node at
     the footage's foot went with it. */
  function measure() {
    const docTop = doc.getBoundingClientRect().top;
    const media = document.querySelector('.ksd-hero__media');
    railTop = media ? Math.max(0, Math.round(media.getBoundingClientRect().bottom - docTop)) : 0;
    const next = {};
    sections.forEach(function (sec) {
      if (!sec.head) return;
      const r = sec.head.getBoundingClientRect();
      // half a line down from the headline's top edge — the throw meets the
      // type at its optical centre rather than at the box edge.
      const frac = (sec.head.textContent.length > 24) ? 4 : 2;
      next[sec.id] = Math.round((r.top - docTop) + r.height / frac);
    });
    tops = next;
    build();
  }

  /* Vertebrae sit under the nodes in the stack: the node is the destination,
     the segment is the structure it is mounted on. */
  function build() {
    // clear everything but the cord
    Array.prototype.slice.call(rail.children).forEach(function (c) {
      if (!c.classList.contains('ksd-cord')) rail.removeChild(c);
    });
    vertEls = [];
    nodeBits = {};

    const railH = doc.offsetHeight;
    // The rail element itself is pulled down to railTop; its `bottom: 0` in the
    // stylesheet does the rest, so the cord ends where the document does.
    rail.style.top = railTop + 'px';
    vertebraYs(railTop, railH).forEach(function (y) {
      let anchor = false;
      for (const sec of sections) {
        if (tops[sec.id] != null && Math.abs(tops[sec.id] - y) < 16) { anchor = true; break; }
      }
      const v = document.createElement('span');
      v.className = 'ksd-vert' + (anchor ? ' is-anchor' : '');
      // dataset.y stays in DOC coordinates for onScroll's field maths; only the
      // style.top is rail-relative. Collapsing these two into one number is the
      // obvious simplification and it silently offsets the whole field by the
      // height of the hero.
      v.dataset.y = y;
      v.style.top = (y - railTop) + 'px';
      v.style.setProperty('--ksd-arm', (anchor ? 9 : 6) + 'px');
      v.innerHTML = '<i class="l"></i><i class="r"></i>' + (anchor ? '<b></b>' : '');
      rail.appendChild(v);
      vertEls.push(v);
    });

    sections.forEach(function (sec) {
      if (tops[sec.id] == null) return;
      const wrap = document.createElement('span');
      wrap.style.cssText = 'position:absolute;left:0;width:0;top:' + (tops[sec.id] - railTop) + 'px;';
      const throwEl = document.createElement('span');
      throwEl.className = 'ksd-throw';
      const node = document.createElement('button');
      node.type = 'button';
      node.className = 'ksd-node';
      node.setAttribute('aria-label', sec.label);
      node.style.top = '0';
      node.addEventListener('click', function () { jump(sec.id); });
      // the ripple pair — ring 2 exists to carry the half-cycle delay that
      // makes the radar train (see the longhand note in spine-doc.css). The
      // button's aria-label is its accessible name, so the spans add no noise.
      const ring1 = document.createElement('span');
      ring1.className = 'ksd-node__ring';
      const ring2 = document.createElement('span');
      ring2.className = 'ksd-node__ring ksd-node__ring--2';
      node.appendChild(ring1);
      node.appendChild(ring2);
      const label = document.createElement('span');
      label.className = 'ksd-label';
      label.textContent = sec.label;
      // order is load-bearing: .ksd-node.is-active + .ksd-label keeps the
      // active label up, so the label must be the node's next sibling.
      wrap.appendChild(throwEl);
      wrap.appendChild(node);
      wrap.appendChild(label);
      rail.appendChild(wrap);
      nodeBits[sec.id] = { node: node, throwEl: throwEl };
    });

    onScroll();
  }

  function jump(id) {
    const sec = sections.filter(function (s) { return s.id === id; })[0];
    if (!sec) return;
    // the LIVE bar height — this is an offset, not layout, so --nav-h is right here
    const navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 72;
    const y = sec.el.getBoundingClientRect().top + window.pageYOffset - navH;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }

  /* Scroll lights the node you are passing: whichever section owns the middle
     of the viewport is the active one. No observer thresholds — the midpoint
     test is stable at every section length, which matters when Music is twice
     as tall as the rest. */
  let frame = 0;
  function onScroll() {
    if (frame) return;
    frame = requestAnimationFrame(function () {
      frame = 0;
      const mid = window.innerHeight / 2;
      /* null, not sections[0] — while the hero owns the middle of the screen NO
         node is lit. The old default lit the first section from the moment the
         page loaded, which was invisible while Home was that first section and
         sat on the hero itself; with Home gone it would light About from the
         top of the document instead. The rail belongs to the document below the
         hero, so an unlit rail up there is the honest state. */
      let found = null;
      for (const s of sections) {
        const r = s.el.getBoundingClientRect();
        if (r.top <= mid && r.bottom >= mid) { found = s.id; break; }
        if (r.top > mid) break;
        found = s.id;
      }
      sections.forEach(function (s) {
        const bits = nodeBits[s.id];
        if (!bits) return;
        bits.node.classList.toggle('is-active', s.id === found);
        bits.throwEl.classList.toggle('is-lit', s.id === found);
      });

      const docMid = window.pageYOffset + window.innerHeight / 2;
      const base = doc.getBoundingClientRect().top + window.pageYOffset;
      /* The radius is re-read every frame, not cached at measure() time, so the
         ?tune slider is live: the panel writes --ksd-field on <html> and then
         dispatches a synthetic scroll, and this read is what picks it up. One
         getComputedStyle per rAF is noise next to the rect reads above. */
      fieldR = parseFloat(getComputedStyle(doc).getPropertyValue('--ksd-field')) || 160;
      /* The graded field (Aug 14 2026): each tick gets --vt = smoothstepped
         nearness to the viewport-centre point inside the --ksd-field radius,
         and css/spine-doc.css interpolates every visual value from it. The
         write is skipped when the rounded value is unchanged, so a settled
         page costs zero style writes: only the ~⌈2R/30⌉ ticks inside a moving
         field are ever touched in a frame. (.is-active is gone with the hard
         ±26px window it expressed; .is-passed survives — the memory state is
         a threshold, not a falloff.) */
      vertEls.forEach(function (el) {
        const d = base + Number(el.dataset.y) - docMid;
        const a = Math.abs(d);
        let t = a >= fieldR ? 0 : 1 - a / fieldR;
        t = t * t * (3 - 2 * t);
        const q = Math.round(t * 100) / 100;
        if (el._vt !== q) { el.style.setProperty('--vt', q); el._vt = q; }
        el.classList.toggle('is-passed', d < -26);
      });
    });
  }

  /* Headlines reveal once, on the way past.

     Sourced from .ksd-reveal in the DOM, NOT from `sections` (Aug 15 2026). It
     used to map over the section list, which quietly tied "does this headline
     ever appear" to "does this section have a rail node" — two unrelated
     things. The moment the hero stopped carrying data-ksd-section its <h1> was
     dropped from this list and never got .is-in, so it stayed transparent and
     the hero rendered with no headline at all. Anything marked .ksd-reveal
     reveals, whether or not the rail knows about it. */
  function watchReveals() {
    const els = Array.prototype.slice.call(document.querySelectorAll('.ksd-reveal'));
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      els.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.01, rootMargin: '0px 0px -12% 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  /* VIDEO IS SCRUBBED BY THE SCROLL, NEVER PLAYED. Two clips use this now — the
     merch spine render (owner's call, Aug 14 2026) and the About footage
     (Aug 15) — so it lives in one function rather than twice. It was written
     twice first; the second copy is how the About clip nearly shipped without
     the -g 4 re-encode the mechanism depends on.

     Progress is the element's travel through the viewport: 0 as its top enters
     at the bottom edge, 1 as its bottom exits at the top, so the clip spreads
     across the whole pass and holds whenever the document holds.

     The seek is rAF-driven and LERPED, so a wheel step reads as a settle rather
     than a snap, and a new currentTime is only written when the last seek has
     landed (v.seeking) and the move is over half a source frame — without both
     guards a fast scroll queues seeks faster than the decoder clears them.

     THE ENCODE IS PART OF THIS MECHANISM: 24fps with a keyframe every 4 frames.
     At the default sparse keyframes every seek decodes a chain back to the last
     one and the scrub visibly lags. Any clip handed to this function must be
     encoded with -g 4 — that is the cost of admission, and it roughly triples
     the file (black-tide went 708KB to 2.2MB). Re-encode without it and the
     feel regresses silently.

     Serving matters too: python -m http.server answers without Range support
     and every one of these seeks clamps to 0 — the scripts/serve.py rule is
     load-bearing here, and the failure looks like a mapping bug in this file
     rather than a server that cannot seek.

     Reduced-motion visitors keep the still first frame. Scroll-linked motion is
     exactly what that preference declines, so the caller gates on it. */
  function scrubToScroll(v) {
    let target = 0, shown = 0, raf = 0;
    const tick = function () {
      raf = 0;
      // 0.3, up from a first cut at 0.22 — the softer settle trailed the
      // scroll enough that the turn read as loose (owner's call).
      shown += (target - shown) * 0.3;
      if (!v.seeking && v.duration && Math.abs(v.currentTime - shown) > 1 / 48) {
        v.currentTime = shown;
      }
      if (Math.abs(target - shown) > 0.005) raf = requestAnimationFrame(tick);
    };
    const onScrub = function () {
      if (!v.duration) return;
      const r = v.getBoundingClientRect();
      const p = Math.min(1, Math.max(0,
        (window.innerHeight - r.top) / (window.innerHeight + r.height)));
      // The raw pass maps 0..1 over enter-to-exit, which parks the END of the
      // clip past the point anyone is still looking — the first cut used it
      // directly and the spine never visibly closed its turn (owner's call).
      // Re-normalising to the 0.10..0.80 slice finishes while the element is
      // still well inside the viewport, with a still hold either side.
      const p2 = Math.min(1, Math.max(0, (p - 0.10) / 0.70));
      // −0.05: never ask for the exact last timestamp — seeking to duration
      // lands past the final frame in some decoders.
      target = p2 * (v.duration - 0.05);
      if (!raf) raf = requestAnimationFrame(tick);
    };
    v.addEventListener('loadedmetadata', onScrub);
    window.addEventListener('scroll', onScrub, { passive: true });
    window.addEventListener('resize', onScrub);
    onScrub();
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* The merch render's transparency is real alpha in the WebM (VP9); the mp4
     fallback still carries its black backdrop, so a browser that cannot take
     the WebM gets tagged is-flat and css/spine-doc.css screen-blends the black
     away. canPlayType answers ''/'maybe'/'probably' — the empty string is the
     no. The About clip needs none of this: it is opaque footage either way. */
  const merchVid = document.querySelector('.ksd-merch__video video');
  if (merchVid) {
    if (!merchVid.canPlayType('video/webm; codecs="vp9"')) merchVid.classList.add('is-flat');
    if (!reducedMotion) scrubToScroll(merchVid);
  }

  const aboutVid = document.querySelector('.ksd-about__media video');
  if (aboutVid && !reducedMotion) scrubToScroll(aboutVid);

  measure();
  watchReveals();
  window.addEventListener('resize', measure);
  window.addEventListener('load', measure);
  setTimeout(measure, 400);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  window.addEventListener('scroll', onScroll, { passive: true });
})();
