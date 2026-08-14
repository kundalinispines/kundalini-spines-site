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

  let tops = null;      // section id -> y on the rail (px from doc top)
  let vertEls = [];     // the vertebra spans, for the scroll pass
  let nodeBits = {};    // id -> { node, throwEl }
  let fieldR = 160;     // vertebra field radius; the --ksd-field token owns it

  /* The step is ~30px with a ±5px sway. The sway is a sine, not noise: a
     repeating irregularity reads as anatomy, whereas true randomness reads as
     a mistake. */
  function vertebraYs(height) {
    const out = [];
    let y = 26, i = 0;
    while (y < height - 20) {
      out.push(Math.round(y));
      y += 30 + Math.sin(i * 1.7) * 5;
      i++;
    }
    return out;
  }

  /* Node placement is measured off each headline's first text line, then
     re-measured whenever the layout can have moved (fonts swapping in, images
     landing, resize). The Home node sits at the footage's foot, not on its
     headline: the hero is a destination in its own right, measured by where
     the footage ends. */
  function measure() {
    const docTop = doc.getBoundingClientRect().top;
    const next = {};
    sections.forEach(function (sec) {
      if (sec.id === 'home') {
        const media = sec.el.querySelector('.ksd-hero__media');
        if (media) next[sec.id] = Math.round(media.getBoundingClientRect().bottom - docTop);
        return;
      }
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
    vertebraYs(railH).forEach(function (y) {
      let anchor = false;
      for (const sec of sections) {
        if (tops[sec.id] != null && Math.abs(tops[sec.id] - y) < 16) { anchor = true; break; }
      }
      const v = document.createElement('span');
      v.className = 'ksd-vert' + (anchor ? ' is-anchor' : '');
      v.dataset.y = y;
      v.style.top = y + 'px';
      v.style.setProperty('--ksd-arm', (anchor ? 9 : 6) + 'px');
      v.innerHTML = '<i class="l"></i><i class="r"></i>' + (anchor ? '<b></b>' : '');
      rail.appendChild(v);
      vertEls.push(v);
    });

    sections.forEach(function (sec) {
      if (tops[sec.id] == null) return;
      const wrap = document.createElement('span');
      wrap.style.cssText = 'position:absolute;left:0;width:0;top:' + tops[sec.id] + 'px;';
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
      let found = sections[0].id;
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

  /* Headlines reveal once, on the way past. */
  function watchReveals() {
    const els = sections.map(function (s) { return s.head; }).filter(Boolean);
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

  /* The merch render is SCRUBBED BY THE SCROLL, not played — the spine turns
     while the document moves and holds when it holds (owner's call, Aug 14
     2026). Progress is the element's travel through the viewport: 0 as its
     top enters at the bottom edge, 1 as its bottom exits at the top, so the
     full rotation spreads across the whole pass.

     The seek is rAF-driven and LERPED, so a wheel step reads as a settle
     rather than a snap, and a new currentTime is only written when the last
     seek has landed (v.seeking) and the move is over half a source frame —
     without both guards a fast scroll queues seeks faster than the decoder
     clears them. The ENCODE IS PART OF THIS MECHANISM: 24fps with a keyframe
     every 4 frames — at the default sparse keyframes every seek decodes a
     chain back to the last one and the scrub visibly lags. Re-encode with
     -g 4 or the feel regresses. (Serving matters too: python -m http.server
     answers without Ranges and every one of these seeks clamps to 0 — the
     scripts/serve.py rule is load-bearing here.)

     Reduced-motion visitors keep the still first frame — scroll-linked
     motion is exactly what that preference declines.

     The transparency is real alpha in the WebM (VP9); the mp4 fallback still
     carries its black backdrop, so a browser that can't take the WebM gets
     tagged is-flat and css/spine-doc.css screen-blends the black away.
     canPlayType answers ''/'maybe'/'probably' — the empty string is the no. */
  const merchVid = document.querySelector('.ksd-merch__video video');
  if (merchVid) {
    if (!merchVid.canPlayType('video/webm; codecs="vp9"')) merchVid.classList.add('is-flat');
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      let target = 0, shown = 0, raf = 0;
      const tick = function () {
        raf = 0;
        // 0.3, up from a first cut at 0.22 — the softer settle trailed the
        // scroll enough that the turn read as loose (owner's call).
        shown += (target - shown) * 0.3;
        if (!merchVid.seeking && merchVid.duration &&
            Math.abs(merchVid.currentTime - shown) > 1 / 48) {
          merchVid.currentTime = shown;
        }
        if (Math.abs(target - shown) > 0.005) raf = requestAnimationFrame(tick);
      };
      const onScrub = function () {
        if (!merchVid.duration) return;
        const r = merchVid.getBoundingClientRect();
        const p = Math.min(1, Math.max(0,
          (window.innerHeight - r.top) / (window.innerHeight + r.height)));
        // The raw pass maps 0..1 over enter-to-exit, which parks the END of
        // the rotation past the point anyone is still looking — the first cut
        // used it directly and the spine never visibly closed its turn
        // (owner's call). Re-normalising to the 0.10..0.80 slice completes
        // the full 360 while the element is still well inside the viewport,
        // with a still hold either side.
        const p2 = Math.min(1, Math.max(0, (p - 0.10) / 0.70));
        // −0.05: never ask for the exact last timestamp — seeking to
        // duration lands past the final frame in some decoders.
        target = p2 * (merchVid.duration - 0.05);
        if (!raf) raf = requestAnimationFrame(tick);
      };
      merchVid.addEventListener('loadedmetadata', onScrub);
      window.addEventListener('scroll', onScrub, { passive: true });
      window.addEventListener('resize', onScrub);
    }
  }

  measure();
  watchReveals();
  window.addEventListener('resize', measure);
  window.addEventListener('load', measure);
  setTimeout(measure, 400);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  window.addEventListener('scroll', onScroll, { passive: true });
})();
