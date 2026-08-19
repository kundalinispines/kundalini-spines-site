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
      /* A SECTION MAY DECLARE WHERE ITS NODE BELONGS, in absolute document px,
         and if it does that wins over the headline measurement below.

         Added for the deep-field home background. Music is landed on a scroll
         position chosen so the carousel and its controls are framed, and by
         then "Enter the Tracks" is off the top of the screen — so a node
         measured off that headline sits above the viewport and the section you
         are actually looking at has no visible node at all. Music now publishes
         the focused card's centre instead (js/deep-field-bg.js), which is on
         screen for the whole time you are there.

         Nothing on index.html sets this attribute, so every node there is
         placed exactly as before. */
      const declared = parseFloat(sec.el.getAttribute('data-ksd-node-y'));
      if (isFinite(declared)) {
        next[sec.id] = Math.round(declared - (docTop + window.pageYOffset));
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
    // The rail element itself is pulled down to railTop; its `bottom: 0` in the
    // stylesheet does the rest, so the cord ends where the document does.
    rail.style.top = railTop + 'px';
    /* AND ONLY NOW IS IT ALLOWED TO PAINT. The stylesheet keeps .ksd-rail
       hidden until this class arrives, because `top` is a MEASURED value and
       everything before this line is the unmeasured 0 — which put the cord
       down the full height of the hero video, the exact thing the Aug 15 2026
       call removed it from. Measured Aug 17 2026 at 1440x900: 874ms, 255
       frames, of cord across the footage before this ran. Adding it here
       rather than at the end of the function is deliberate — `top` is the only
       thing that has to be right for the rail to be in the correct place; the
       vertebrae and nodes appended below are additive and can land a frame
       later without anything being in the wrong position. */
    rail.classList.add('is-placed');
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

    /* A section may declare where it wants to be landed on, and if it does,
       that wins. Anchor navigation (the nav links, /#tracks) already honours
       scroll-margin-top because the browser applies it; this function did not,
       so the two routes to the same section could arrive in different places.
       That is exactly what happened on the deep-field home background: Music
       sets a NEGATIVE scroll-margin-top so the carousel and its controls land
       framed, the nav link obeyed it and the rail node did not, and clicking
       the spine dropped you 279px short with the card half off the screen.

       Falls back to --nav-h when a section declares nothing, which is every
       section on index.html except #tracks — and #tracks there asks for
       nav-h minus 4, so the only change to the production page is those 4px. */
    const smt = parseFloat(getComputedStyle(sec.el).scrollMarginTop) || 0;
    const off = smt !== 0 ? smt : navH;
    const y = sec.el.getBoundingClientRect().top + window.pageYOffset - off;
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

  /* VIDEO IS SCRUBBED BY THE SCROLL, NEVER PLAYED. ONE clip uses this now — the
     merch spine render (owner's call, Aug 14 2026). The About footage was
     scrubbed here too from Aug 15, and both film rows were, until the owner
     called it on Aug 17 2026: the rows now play and loop on their own, see
     playInView below. The function stays general and stays here because the
     merch render still depends on every word of what follows, and because two
     callers is what forced it into one place to begin with — it was written
     twice first, and the second copy is how the About clip nearly shipped
     without the -g 4 re-encode the mechanism depends on.

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
     exactly what that preference declines, so the caller gates on it.

     ---------------------------------------------------------------------
     NO CALLER TODAY (Aug 17 2026). Every clip this drove was unwired from the
     scroll on the owner's call within a few hours: first the two film rows,
     then the merch render. Nothing on any page that loads this file scrubs any
     more, so this function is dead as it stands.

     IT IS KEPT RATHER THAN DELETED, deliberately, and this note is here so the
     next session does not read the silence as an oversight. The lerp constant,
     the 1/48 write threshold and the !seeking coalescing guard all have owner
     decisions and measurements behind them that are recorded nowhere else, and
     js/deep-field-bg.js's own scrub loop was copied from this one. Deleting it
     costs that record; leaving it costs a screenful. Delete it once the owner
     has lived with self-playing clips long enough to be sure.
     --------------------------------------------------------------------- */
  function scrubToScroll(v) {
    let target = 0, shown = 0, raf = 0, settleTries = 0;
    const tick = function () {
      raf = 0;
      // 0.3, up from a first cut at 0.22 — the softer settle trailed the
      // scroll enough that the turn read as loose (owner's call).
      const settled = Math.abs(target - shown) <= 0.005;
      if (settled) shown = target;
      else { shown += (target - shown) * 0.3; settleTries = 0; }

      /* TWO THRESHOLDS. Half a source frame while the scroll is MOVING —
         anything tighter queues seeks faster than the decoder retires them,
         which is what makes naive scrubbers feel like glue. Tighter once it
         SETTLES, because the resting frame is the one anybody actually looks
         at.

         FIXED Aug 17 2026. Before this the loop rescheduled on |target - shown|
         alone, checked after the write attempt, so a final iteration that
         collided with an in-flight seek dropped its write and scheduled
         nothing — leaving the picture up to a frame short until the next
         scroll event. Found on the deep-field background, where every movement
         ends on a composed flash frame and one frame is visible; on these
         column-width film rows it never was. Re-verified after the change on
         all three clips this drove that day (the merch render and both film
         rows; the rows stopped being scrubbed later the same day).
         Bounded at six extra frames so a decoder that will not report the time
         it was handed cannot spin rAF forever. */
      const thresh = settled ? 1 / 200 : 1 / 48;
      if (!v.seeking && v.duration && Math.abs(v.currentTime - shown) > thresh) {
        v.currentTime = shown;
      }
      const landing = settled && v.duration &&
        Math.abs(v.currentTime - shown) > thresh && settleTries < 6;
      if (landing) settleTries++;
      if (!settled || landing) raf = requestAnimationFrame(tick);
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

  /* THE FILM ROWS PLAY THEMSELVES AND LOOP FOREVER (Aug 17 2026, owner's call).
     They were scroll-scrubbed by scrubToScroll until today; they are not driven
     by scroll position in any way any more. The merch render is untouched and
     still scrubs.

     LOOPING IS THE `loop` PROPERTY, not an `ended` handler that rewinds. The
     handler only gets to run after the decoder has retired the final frame and
     stopped, so the wrap costs a visible hitch at the seam; loop wraps inside
     the media pipeline and there is no seam to see. Same reason there is no
     timeupdate watchdog seeking back near the end — that is the same hitch with
     extra jitter.

     PLAYBACK IS GATED ON VISIBILITY, matching watchReveals' observer above.
     Three autoplaying clips decoding off-screen buy nothing and cost CPU and
     battery; what you SEE is identical to playing unconditionally, because the
     only frames a paused-off-screen clip misses are frames nobody is looking
     at. One difference from watchReveals: it unobserves on the way in, because
     a reveal happens once. This one must keep listening in both directions
     forever, so nothing is ever unobserved.

     THE ELEMENT MAY HAVE NO DATA WHEN THIS RUNS, and asking a dry element to
     play is how this silently does nothing. On home-deepfield-lab.html the rows
     ship preload="none" on purpose (js/deep-field-bg.js holds 9.3MB of
     below-the-fold video off the connection until the hero can play through, or
     first scroll, or a 4s backstop) and are only then upgraded to preload="auto"
     and load()ed. load() RESETS the element and pauses it, so a play() issued
     before the release is thrown away even if it had started. So the wanted
     state is kept in `want` and re-asserted on every arrival of data rather
     than fired once. index.html ships preload="none" on these rows too - it
     shipped "auto" until Aug 18 2026, when the deep-field port deferred them
     and js/deep-field-bg.js took over upgrading them - so both pages now take
     the same path here, and both land in the same place.

     THE play() PROMISE IS CAUGHT, always. It rejects whenever the browser
     declines the autoplay — and an unhandled rejection is a console error, on a
     page whose bar is zero console errors. muted is what buys the autoplay in
     the first place; these clips carry no audio track at all, so the attribute
     is set here as well as in the markup — dropping it from the markup one day
     would otherwise turn every row into a silent no-op that looks like a bug in
     this file.

     The -g 4 keyframe-dense encode these clips carry is surplus to playback
     (it exists for seeking, and scrubToScroll's note explains why). It costs
     file size and nothing else, so nothing here depends on it — but a future
     re-encode is now free to drop it FOR THESE TWO, and must not for the merch
     render. */
  /* A LOOP OVER PART OF A CLIP, because `loop` can only wrap the whole file.

     Used by the merch render, whose full revolution does not fill the encode —
     see the measurement where it is wired. tIn/tOut are seconds; playback runs
     [tIn, tOut) and jumps back to tIn.

     WHY rAF AND NOT `timeupdate`: timeupdate fires about 4x a second, so the
     wrap could overshoot by up to 250ms of wall time and land well past the
     matching frame — the whole point is to hit one exact frame. rAF gives
     ~16ms. requestVideoFrameCallback would be tighter still but stops firing
     while paused, so it would need re-arming on every play; the pump below is
     already gated on play/pause and costs one float compare per frame. */
  function loopRange(v, tIn, tOut) {
    v.loop = false;               // the native wrap would take the whole file
    let raf = 0;
    const pump = function () {
      raf = 0;
      if (!v.paused) {
        /* Both directions. Under is not hypothetical: js/deep-field-bg.js
           calls load() to upgrade preload, which resets currentTime to 0 —
           below tIn — and without this the clip would play the few frames
           that sit outside the revolution every time that happens. */
        if (v.currentTime >= tOut - 0.001 || v.currentTime < tIn - 0.001) {
          v.currentTime = tIn;
        }
        raf = requestAnimationFrame(pump);
      }
    };
    const start = function () { if (!raf) raf = requestAnimationFrame(pump); };
    v.addEventListener('play', start);
    v.addEventListener('pause', function () {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
    });
    v.addEventListener('loadeddata', function () {
      if (v.currentTime < tIn) v.currentTime = tIn;
    });
    start();
  }

  function playInView(v, rate, tIn, tOut) {
    v.loop = true;
    v.muted = true;
    if (tOut > tIn) loopRange(v, tIn, tOut);   // overrides v.loop itself

    /* THE RATE IS RE-APPLIED RATHER THAN SET ONCE, and both properties are
       written. load() resets playbackRate back to defaultPlaybackRate, and
       js/deep-field-bg.js calls load() on these elements when it upgrades them
       off preload="none" — so a rate assigned only at wiring time would quietly
       snap back on the home page while staying correct on any page without that
       module. Writing defaultPlaybackRate is what makes the reset land on the
       wanted value instead of on 1x. */
    const speed = rate > 0 ? rate : 1;
    v.defaultPlaybackRate = speed;
    v.playbackRate = speed;

    let want = false;
    const attempt = function () {
      // v.paused goes false the instant play() is called, not when it resolves,
      // so this also stops a burst of ready-state events queueing a second one.
      if (!want || !v.paused) return;
      if (v.playbackRate !== speed) v.playbackRate = speed;
      const p = v.play();
      if (p && p.catch) p.catch(function () {});
    };
    // loadeddata is the first point there is a frame to show; canplay covers a
    // re-arrival after deep-field-bg.js's load(), which fires no loadeddata if
    // the bytes are already in the cache.
    v.addEventListener('loadeddata', attempt);
    v.addEventListener('canplay', attempt);
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        want = e.isIntersecting;
        if (want) attempt();
        else if (!v.paused) v.pause();
      });
    }, { threshold: 0.01 });
    // No kick-off call after this: observe() always delivers one entry for the
    // element's CURRENT state, so a row already on screen at load starts from
    // that first callback like any other.
    io.observe(v);
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

    /* THE RENDER TURNS ON ITS OWN NOW (owner's call, Aug 17 2026), where it
       used to be scrubbed by scroll like the film rows were until earlier the
       same day.

       IT LOOPS OVER A MEASURED 360, NOT OVER THE WHOLE FILE. The encode is 241
       frames but ONE REVOLUTION IS 237 OF THEM — the last four overshoot past
       the start, so a plain `loop` wrapped from an orientation the turn had
       already passed and jumped backwards a few degrees every 8 seconds.

       MEASURED Aug 17 2026: every one of the 241 frames was decoded to a
       downsampled luma+alpha signature, and for each candidate start frame the
       best-matching frame at least 60% of the clip later was found by RMS
       distance. The winner is f3 -> f240 at distance 14.6. Read it against the
       clip's own noise floor rather than against zero: ADJACENT frames in this
       thing score a median of 7.6 and run as high as 22.4, because it is a lit
       metallic surface turning ~1.5 degrees a frame. So the wrap now costs
       about what an ordinary frame step costs, and less than the clip's worst
       one. (The runners-up agree it is a real minimum, not a fluke of the
       metric: f2->f238 and f0->f238 both land at 15.3, and it degrades
       smoothly from there — f4 18.2, f5 21.0.)

       f3 starts at 0.1001s and f240 at 8.0086s, so the revolution is 7.9085s
       against the file's 8.042s. Playback runs [IN, OUT) and jumps to IN.

       THESE TWO NUMBERS BELONG TO THIS ENCODE and nothing else. Re-export the
       render and they are wrong — re-run the scan rather than nudging them.

       SLOW ON PURPOSE, and the rate is a token rather than a constant: the clip
       runs 8.042s at 1x, which is a brisk turn for something meant to sit
       behind body copy as an object rather than to be watched. --ksd-spine-rate
       is where that judgement lives; css/spine-doc.css records what the
       resulting seconds-per-revolution actually are at each setting.

       Read off :root rather than the element so it can be turned from devtools
       and from a page-scoped block, the same way --ksd-field already is. */
    const SPIN_IN = 0.1001;    // f3,   the frame f240 comes back round to
    const SPIN_OUT = 8.0086;   // f240, one full revolution later
    const rate = parseFloat(getComputedStyle(document.documentElement)
                              .getPropertyValue('--ksd-spine-rate')) || 0.75;
    if (!reducedMotion) playInView(merchVid, rate, SPIN_IN, SPIN_OUT);
  }

  /* Every film row on the page, not a named list — the owner has more clips
     coming and each one should be markup plus an encode, never another line
     here. Add a .ksd-filmrow__media and it plays.

     Reduced-motion visitors get no playback at all, and the poster attribute in
     the markup is what they see instead — a still frame chosen for each clip,
     which is the honest answer for a preference that declines motion. Same gate
     the scrub used to sit behind, so nothing changed for those visitors today.
     Note the poster survives the preload upgrade: js/deep-field-bg.js load()s
     these elements on every device, and an element that has loaded but never
     played still shows its poster rather than frame zero. */
  if (!reducedMotion) {
    document.querySelectorAll('.ksd-filmrow__media video').forEach(function (v) {
      playInView(v);      // wrapped, not passed bare: forEach also hands over
                          // the index and the list, and a second parameter here
                          // one day would silently start receiving them.
    });
  }

  measure();
  watchReveals();
  window.addEventListener('resize', measure);
  window.addEventListener('load', measure);
  setTimeout(measure, 400);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  window.addEventListener('scroll', onScroll, { passive: true });
})();
