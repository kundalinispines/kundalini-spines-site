// Track Experience — arch-depth carousel, single always-focused view.
//
// There is no longer a "rest" state: the centered track is always the hero and
// the focus panel below it is always populated. Browsing happens by
// drag, arrow keys, the ‹ › buttons, or clicking a side card. Deliberately NOT
// by scroll wheel — that hijacked the page scroll — and no longer by hover-pan
// either: drifting the pointer toward the edge stole the carousel out from
// under whatever you were reaching for.
//
// The geometry constants below (0.85 angle rate, 260/130 recede/drop, 1.85 hero
// scale, 0.75 push-out, -2.5 pull-in, MAX_SIDE fade) were tuned empirically
// against real on-screen measurements at a 250px card width and are
// load-bearing — re-measure before changing them.
//
// Card media: a track renders as a looping muted <video> when it has a
// `artworkVideo` (or `videoUrl`) field, otherwise as an <img> of `artwork`.
// Each card is a still image with an optional video layered on top at opacity 0.
// The video fades in only while that track's sample is audible, so at rest you
// are always looking at the full-quality still, never a decoded video frame. Files are fetched lazily
// (hero + immediate neighbours only), so adding motion to all 27 tracks costs a
// few MB in flight, not the whole library.
//
// Data-driven from data/tracks.json so new tracks need no component changes.
(function () {
  const section = document.querySelector('.track-experience');
  if (!section) return;

  const viewport = section.querySelector('.track-arc-viewport');
  const row = section.querySelector('.track-arc');
  const focusPanel = section.querySelector('.track-focus-panel');
  if (!viewport || !row || !focusPanel) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Settled hero overlay ----
  // See .track-hero-layer in track-experience.css for the measurements. Short
  // version: the cards live inside a shared 3D rendering context (perspective
  // on the viewport + preserve-3d on the row) which Chrome rasterises once at a
  // fixed scale, costing ~44% of the artwork's detail. A card cannot leave that
  // context by changing its own transform — only by not being a descendant. So
  // the settled hero is repainted by this layer, which is a sibling of the
  // viewport, and the real card is held at opacity 0 underneath it.
  const heroLayer = document.createElement('div');
  heroLayer.className = 'track-hero-layer';
  heroLayer.setAttribute('aria-hidden', 'true');
  const heroLayerImg = document.createElement('img');
  heroLayerImg.alt = '';
  heroLayer.appendChild(heroLayerImg);
  // The overlay carries the video as well as the still. A video left playing in
  // the card would be back inside the 3D context, paying exactly the cost this
  // layer exists to avoid, so the overlay takes ownership of hero playback for
  // as long as it is up. Never both at once — see syncLayerVideo().
  const heroLayerVideo = document.createElement('video');
  heroLayerVideo.muted = true;
  heroLayerVideo.loop = true;
  heroLayerVideo.playsInline = true;
  heroLayerVideo.preload = 'none';
  heroLayerVideo.setAttribute('disablepictureinpicture', '');
  heroLayerVideo.setAttribute('aria-hidden', 'true');
  heroLayer.appendChild(heroLayerVideo);
  (viewport.parentElement || section).appendChild(heroLayer);
  let heroLayerCard = null;   // the card the overlay is currently standing in for

  let tracks = [];
  let target = 0, current = 0;
  let focusedIndex = 0;   // the track the panel is describing
  let panelIndex = null;  // what the panel currently shows, to avoid rebuild churn
  let heroIndex = null;   // last card treated as hero, for card-video play/pause

  // Drag-to-rotate
  let dragging = false, dragStartX = 0, dragStartTranslate = 0, dragMoved = false, dragPointerId = null;
  let suppressClick = false;

  let currentSample = null; // { audio, fill, status, btn, icon }
  let running = false;      // is the rAF loop alive?
  // True while the carousel is gliding to a destination setFocus() already
  // chose. See the guard in render() — it is what stops the animation from
  // "following" every track it passes over on the way there.
  let snapping = false;
  let samplePlaying = false;// card video only rolls while the track is audible
  let flattenHero = false;  // settled: hero drops its 3D transform (see render)

  const counterIndex = focusPanel.querySelector('.track-focus-nav__index');
  const counterTotal = focusPanel.querySelector('.track-focus-nav__total');

  const MAX_SIDE = 2;          // cards visible per side
  // The card box is BOX_K times the layout step, so the hero needs no scaling at
  // all and every other magnitude that used to be multiplied by the hero scale
  // (sibling scales, shadow spread, blur radius) is divided by BOX_K to
  // compensate — the rendered result is pixel-identical, just rasterised sharp.
  const BOX_K = 1.85;
  const HERO_SCALE = 1;
  const DRAG_THRESHOLD = 6;    // px before a press counts as a drag, not a click
  const VIDEO_FADE_MS = 350;   // must match .track-card__video's opacity transition
  const PERSPECTIVE = 1800;    // must match .track-arc-viewport's perspective
  const HERO_Z = 100;          // hero's translateZ
  // translateZ under perspective is a uniform scale about the perspective
  // origin. 1800 / (1800 - 100) = 1.0588 — the magnification we must reproduce
  // exactly when the hero is flattened to 2D.
  const Z_SCALE = PERSPECTIVE / (PERSPECTIVE - HERO_Z);

  // A click's e.target can resolve to the row itself under nested 3D transforms
  // (a real browser hit-testing quirk), so fall back to a geometric hit test.
  function cardAt(x, y) {
    for (const card of row.querySelectorAll('.track-card')) {
      const r = card.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return card;
    }
    return null;
  }

  fetch('data/tracks.json')
    .then((r) => r.json())
    .then((data) => {
      tracks = (data && data.tracks) || [];
      if (!tracks.length) throw new Error('empty');
      init();
    })
    .catch(() => {
      row.innerHTML = '<p class="empty-state" role="status">Tracks could not be loaded right now.</p>';
    });

  // Card media markup — <video> when the track supplies one, else <img>.
  // The source goes in data-src, not src: with 27 video cards, letting the
  // browser fetch them all on load would cost tens of megabytes before the user
  // has done anything. attachVideo() promotes data-src -> src only for the hero
  // and its immediate neighbours, so at most three are ever in flight.
  function cardMedia(t) {
    // The still is ALWAYS present and is what you see at rest. A <video> with a
    // poster is not good enough: the moment it buffers, the browser swaps the
    // poster for a decoded video frame, which is softer than the still even
    // while paused. So the video is a separate layer stacked on top at opacity
    // 0, faded in only while the track is actually rolling.
    const still = `<img class="track-card__media track-card__still" src="${t.artwork}" alt="" loading="lazy" draggable="false">`;
    const video = t.artworkVideo || t.videoUrl || null;
    if (!video) return still;
    return still + `<video class="track-card__media track-card__video" data-src="${video}" muted loop playsinline preload="none" disablepictureinpicture aria-hidden="true"></video>`;
  }

  function init() {
    tracks.forEach((t, i) => {
      const li = document.createElement('li');
      li.className = 'track-card';
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', 'false');
      li.setAttribute('aria-label', `${t.title} — ${t.oneLiner || ''}`);
      li.tabIndex = -1;
      // No visible caption: real cover art carries its own title, and the
      // overlay collided with it. The title lives in the focus panel; screen
      // readers still get it from the aria-label above.
      li.innerHTML = cardMedia(t);
      li.dataset.i = i;
      row.appendChild(li);
    });

    if (counterTotal) counterTotal.textContent = String(tracks.length);

    // Land the first frame with filters already correct, no dim-in transition.
    row.classList.add('is-priming');

    // ---- Click: side card centers + plays, centered card toggles play ----
    // Bound on the viewport, not the row: while a drag holds pointer capture the
    // click retargets to the capturing element, so a row-level listener misses it.
    viewport.addEventListener('click', (e) => {
      if (suppressClick) { suppressClick = false; return; }
      const card = e.target.closest('.track-card') || cardAt(e.clientX, e.clientY);
      if (!card) return;
      const idx = Number(card.dataset.i);
      if (idx === focusedIndex) {
        toggleSample();
      } else {
        setFocus(idx, true);
        playSample();
      }
    });

    row.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); setFocus(focusedIndex + 1, true); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); setFocus(focusedIndex - 1, true); }
      if (e.key === 'Enter' || e.key === ' ') {
        const card = e.target.closest('.track-card');
        if (!card) return;
        e.preventDefault();
        const idx = Number(card.dataset.i);
        if (idx === focusedIndex) toggleSample();
        else { setFocus(idx, true); playSample(); }
      }
    });

    // ---- Drag to rotate ----
    viewport.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      dragging = true;
      dragMoved = false;
      snapping = false;   // a hand on the carousel outranks any snap in flight
      dragStartX = e.clientX;
      dragStartTranslate = current;
      dragPointerId = e.pointerId;
      kick();
    });

    viewport.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - dragStartX;
      if (!dragMoved && Math.abs(dx) > DRAG_THRESHOLD) {
        // Capture only once it's a real drag — capturing on pointerdown would
        // retarget the click that a simple press-and-release produces.
        dragMoved = true;
        viewport.classList.add('is-dragging');
        try { viewport.setPointerCapture(e.pointerId); } catch (_) {}
      }
      if (dragMoved) {
        target = clampTranslate(dragStartTranslate + dx);
        current = target; // 1:1 with the pointer while dragging — no lag
        kick();
      }
    });

    function endDrag(e) {
      if (!dragging) return;
      dragging = false;
      viewport.classList.remove('is-dragging');
      if (dragPointerId !== null) {
        try { viewport.releasePointerCapture(dragPointerId); } catch (_) {}
        dragPointerId = null;
      }
      if (dragMoved) {
        suppressClick = true;
        settleToNearest();
      }
      dragMoved = false;
    }
    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);

    // No wheel handler by design: the carousel used to swallow scroll events to
    // change tracks, which trapped the page when you were only trying to scroll
    // past the section. Browsing is drag / arrows / ‹ › / click.

    window.addEventListener('resize', () => { target = centeredFor(focusedIndex); current = target; kick(); });

    section.querySelector('.track-focus-nav__btn[data-dir="prev"]')
      .addEventListener('click', () => setFocus(focusedIndex - 1, true));
    section.querySelector('.track-focus-nav__btn[data-dir="next"]')
      .addEventListener('click', () => setFocus(focusedIndex + 1, true));

    // Nothing to "close" to any more — stop playback and move on down the page.
    const closeBtn = focusPanel.querySelector('.track-focus-panel__close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        stopSample();
        const next = section.nextElementSibling;
        if (next) next.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
      });
    }

    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') stopSample(); });

    focusPanel.classList.add('is-visible');

    setFocus(Math.floor(tracks.length / 2), true);
    current = target;

    // Scroll-reveal: nothing elsewhere in the codebase toggles this class, which
    // would otherwise leave the section permanently invisible (opacity:0).
    //
    // ARRIVING BY LINK SKIPS THE REVEAL. #tracks is the target of the nav's
    // MUSIC link, of the hero's "Listen Now" button, and of any shared URL
    // carrying the hash — all of which drop you ON the section. The entrance is
    // written to be noticed in passing as you scroll down to it; played at the
    // top of the viewport, immediately after a jump, it is just the page
    // visibly assembling itself in front of you. So in that case show it
    // straight away and suppress the transition for one frame, rather than
    // animating from a state the visitor never saw.
    // Both halves of the entrance have to be suppressed, not just the fade: the
    // opacity transition is on the section, the 24px slide is on .track-arc-wrap
    // (see the comment on it in css/track-experience.css). Killing only the
    // section's transition leaves the content visibly sliding into place, which
    // is the part you actually notice.
    const revealNow = () => {
      if (section.classList.contains('is-visible')) return;
      const wrap = section.querySelector('.track-arc-wrap');
      const prev = section.style.transition;
      const prevWrap = wrap ? wrap.style.transition : null;
      section.style.transition = 'none';
      if (wrap) wrap.style.transition = 'none';
      section.classList.add('is-visible');
      // Two frames: one for the class to take effect with no transition, one to
      // hand the transitions back before anything else can animate.
      requestAnimationFrame(() => requestAnimationFrame(() => {
        section.style.transition = prev;
        if (wrap) wrap.style.transition = prevWrap;
      }));
    };

    if (location.hash === '#tracks') revealNow();
    document.querySelectorAll('a[href="#tracks"]').forEach((a) => {
      a.addEventListener('click', revealNow);
    });

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) { section.classList.add('is-visible'); io.disconnect(); }
        });
      }, { threshold: 0.15 });
      io.observe(section);
    } else {
      section.classList.add('is-visible');
    }

    kick();

    // Two frames later the initial filters are painted; re-enable transitions
    // so subsequent track changes still animate.
    requestAnimationFrame(() => requestAnimationFrame(() => row.classList.remove('is-priming')));
  }

  // ---- Geometry helpers ----
  // w is the card's layout box; step is how far apart consecutive cards sit,
  // which the negative right margin pulls back below the box width.
  function stepSize() {
    const c = row.querySelector('.track-card');
    const cs = getComputedStyle(c);
    const gap = parseFloat(getComputedStyle(row).gap) || 0;
    const w = parseFloat(cs.width);
    const mr = parseFloat(cs.marginRight) || 0;
    return { w, step: w + mr + gap };
  }
  function centeredFor(i) {
    const { w, step } = stepSize();
    return viewport.getBoundingClientRect().width / 2 - (i * step + w / 2);
  }
  function clampTranslate(t) { return Math.min(centeredFor(0), Math.max(centeredFor(tracks.length - 1), t)); }
  function nearestIndexForTranslate(t) {
    const { w, step } = stepSize();
    const vw = viewport.getBoundingClientRect().width;
    return Math.max(0, Math.min(tracks.length - 1, Math.round((vw / 2 - t - w / 2) / step)));
  }

  // setFocus(i, snap) — snap moves the carousel; without it we're just following
  // the card that drifted under the center during a drag.
  function setFocus(i, snap) {
    const idx = Math.max(0, Math.min(tracks.length - 1, i));
    if (snap) { target = centeredFor(idx); snapping = true; kick(); }
    if (idx === focusedIndex && panelIndex === idx) return;
    focusedIndex = idx;
    updatePanel(idx);
  }
  function settleToNearest() { setFocus(nearestIndexForTranslate(current), true); }

  function heroCard() { return row.querySelector('.track-card[aria-selected="true"]'); }

  // Position the overlay exactly over `card` and show it. Integer left/top and
  // no transform of its own: variant P in the isolation test showed a
  // fractional offset costs ~2%, and there is no reason to spend it.
  function showHeroLayer(card) {
    if (!card) { hideHeroLayer(); return; }
    const still = card.querySelector('.track-card__still');
    if (!still) { hideHeroLayer(); return; }

    const host = heroLayer.offsetParent || viewport.parentElement || section;
    const hr = host.getBoundingClientRect();
    const cr = card.getBoundingClientRect();
    if (!cr.width || !cr.height) { hideHeroLayer(); return; }

    const src = still.currentSrc || still.getAttribute('src');
    if (heroLayerImg.getAttribute('src') !== src) heroLayerImg.setAttribute('src', src);
    heroLayer.style.left = Math.round(cr.left - hr.left) + 'px';
    heroLayer.style.top = Math.round(cr.top - hr.top) + 'px';
    heroLayer.style.width = Math.round(cr.width) + 'px';
    heroLayer.style.height = Math.round(cr.height) + 'px';
    // The card's shadow goes with it: the card is about to drop to opacity 0.
    heroLayer.style.boxShadow = card.style.boxShadow;
    heroLayer.classList.add('is-showing');
    heroLayerCard = card;
    card.style.opacity = '0';
    syncLayerVideo(card);
  }

  // Move hero playback onto the overlay and off the card, or wind it back down.
  // The card's <video> is paused rather than rewound so the handover is
  // frame-accurate in both directions.
  function syncLayerVideo(card) {
    const cv = card.querySelector('.track-card__video');
    if (!cv || !card.classList.contains('is-rolling')) {
      heroLayer.classList.remove('is-rolling');
      if (!heroLayerVideo.paused) heroLayerVideo.pause();
      // Hold the frame through the fade, then rewind once invisible — the same
      // rule the card's own video follows, for the same reason.
      clearTimeout(heroLayerVideo._rewind);
      heroLayerVideo._rewind = setTimeout(() => { heroLayerVideo.currentTime = 0; }, VIDEO_FADE_MS);
      return;
    }
    const vsrc = cv.getAttribute('src') || cv.dataset.src;
    if (!vsrc) return;
    if (heroLayerVideo.getAttribute('src') !== vsrc) heroLayerVideo.setAttribute('src', vsrc);
    clearTimeout(heroLayerVideo._rewind);
    if (!cv.paused) {
      try { heroLayerVideo.currentTime = cv.currentTime; } catch (e) { /* not seekable yet */ }
      cv.pause();
    }
    heroLayer.classList.add('is-rolling');
    const pr = heroLayerVideo.play();
    if (pr && pr.catch) pr.catch(() => {});
  }

  function hideHeroLayer() {
    const card = heroLayerCard;
    heroLayerCard = null;
    heroLayer.classList.remove('is-showing', 'is-rolling');
    if (card) {
      card.style.opacity = '1';
      // Hand playback back to the card if the sample is still running, picking
      // up at the frame the overlay reached.
      const cv = card.querySelector('.track-card__video');
      if (cv && card.classList.contains('is-rolling') && samplePlaying && !reducedMotion) {
        try { cv.currentTime = heroLayerVideo.currentTime; } catch (e) { /* not seekable yet */ }
        const pr = cv.play();
        if (pr && pr.catch) pr.catch(() => {});
      }
    }
    if (!heroLayerVideo.paused) heroLayerVideo.pause();
  }

  function render() {
    row.style.transform = `translateX(${current}px)`;
    const { w, step } = stepSize();
    const gap = parseFloat(getComputedStyle(row).gap) || 0;
    // The layout box is bigger than the old card, so its centre sits lower in
    // the row by half the difference. Subtract that back out to keep the arch
    // sitting exactly where it did before the box was enlarged.
    const boxOffsetY = (w - (step - gap)) / 2;
    const center = viewport.getBoundingClientRect().width / 2;
    let nearestIdx = 0, nearestDist = Infinity;

    row.querySelectorAll('.track-card').forEach((card) => {
      const i = Number(card.dataset.i);
      const cardCenter = current + i * step + w / 2;
      const offset = cardCenter - center;
      const abs = Math.abs(offset);
      const stepUnits = offset / step;
      const isHero = abs < step / 2;
      const sign = offset < 0 ? -1 : 1;

      // Arch geometry: rotation, skew, drop and recede all ease in from the same
      // angle, so a neighbour never rotates faster than it pulls back in depth.
      const angle = Math.min(Math.PI / 2, Math.abs(stepUnits) * 0.85);
      const ease = Math.sin(angle);
      const archDrop = 130 * (1 - Math.cos(angle));
      const archRecede = 260 * ease;

      const rotationY = 38 * ease * sign;
      const skew = 7 * ease * sign;
      const depthZ = isHero ? 100 : (100 - archRecede);
      const yPos = (isHero ? -30 : (-30 + archDrop)) - boxOffsetY;
      const brightness = isHero ? 1 : Math.max(0.4, 1.05 - abs / 900);
      const scale = isHero ? HERO_SCALE : Math.max(0.52, 0.9 - abs / 1000) / BOX_K;
      // BLUR — the two cards either side of the hero are SHARP.
      //
      // Ring is measured in layout steps, not px, so it survives the --card-w
      // breakpoints: 250px desktop, 190px at 900, min(42vw,190px) at 600.
      // |stepUnits| < 0.5 is the hero; 0.5..1.5 is the immediate neighbour on
      // either side. Both stay at blur 0, so the three centre cards read as one
      // sharp group and the arch falls away behind them.
      //
      // WHY THIS IS A RAMP AND NOT AN `if`. The row translates continuously
      // under a drag or a hover-pan, so a card crosses the 1.5-step line mid
      // gesture. A hard cut there would snap it from 0 to ~4.7px of blur in one
      // frame — the same class of visible pop the arch geometry avoids by
      // easing rotation, drop and recede off one shared angle. `gate` fades the
      // blur in across 1.5..2.0 steps and is exactly 0 at the boundary, so the
      // neighbour is sharp for its whole ring and the card behind it arrives
      // already blurred.
      //
      // The 2 + abs/220 curve and the 6px cap are unchanged; only its ORIGIN
      // moved outward by 1.5 steps. So ring 2 lands at 4.7px where it used to
      // be 7.9px, and the cap is now reached around ring 6 instead of ring 4.
      // That also walks back some of the "side-card blur is too heavy" note in
      // the handoffs, but it was not the goal here — if the far cards now read
      // as too soft, raise the /220, not the base.
      const ringGate = Math.min(1, Math.max(0, (Math.abs(stepUnits) - 1.5) / 0.5));
      const blurAbs = Math.max(0, abs - 1.5 * step);
      const blur = isHero ? 0 : ringGate * Math.min(6, 2 + blurAbs / 220) * BOX_K;
      // NO CARD SHADOWS. This was two rounds of wrong before it was right, so
      // the reasoning is here in full — do not reinstate them without reading it.
      //
      // The hero originally carried `0 81px 118px rgba(0,0,0,0.62)` plus a
      // second 44px layer. Against a #050505 page a pure-black shadow paints
      // BELOW the background — measured (2,2,2) against the page's (5,5,5) —
      // so the first fix was to recolour them to rgba(5,5,5,...), where
      // 5 over 5 composites to exactly 5 at any alpha and the shadow becomes
      // mathematically invisible on flat black while still grounding the cards
      // against anything lit behind them.
      //
      // That identity does not hold on real hardware. Bisected on the owner's
      // machine (Brave, GPU compositing, wide-gamut display): restoring these
      // shadows ALONE, with the spine layer hidden and every other suspect
      // suppressed, brought the blobs straight back. Colour-managed GPU
      // compositing does not round 5-over-5 to 5, and an 81px-offset, 118px-blur
      // shadow turns that error into a large soft disc around the centre card
      // and a second one beneath it.
      //
      // None of this reproduces headlessly — HANDOFF 3 already warns that
      // headless Chromium has no GPU and cannot reproduce raster problems. Every
      // measurement I could take said the region was within 1-2 levels of the
      // page. The bisect on real hardware is the only thing that found it.
      //
      // They cost nothing to remove: on a page whose background is flat black
      // everywhere the cards sit, a shadow has nothing to fall on. Depth comes
      // from the arch transform, the per-card scale and the 1px border. If a
      // lighter background ever appears behind the carousel, reintroduce them as
      // a SMALL tight shadow (a 118px blur is what made it read as a blob) and
      // re-check on real hardware, not headless.
      const shadow = 'none';

      // Cap how many cards show per side so it's never lopsided — anything past
      // MAX_SIDE steps out fades away instead of piling up.
      const fadeStart = MAX_SIDE - 0.15;
      const fadeEnd = MAX_SIDE + 0.5;
      const sideOpacity = isHero ? 1 : Math.max(0, Math.min(1, 1 - (Math.abs(stepUnits) - fadeStart) / (fadeEnd - fadeStart)));

      // Push the immediate neighbours out from behind the enlarged hero, then
      // pull the outer pair back toward them so the ranks don't cross over.
      const roundedStep = Math.round(Math.abs(stepUnits));
      let extraX = 0;
      if (roundedStep === 1) {
        extraX = sign * step * 0.75;
      } else if (roundedStep === 2) {
        const rank1Final = step * 1.75;
        const rank2Base = step * 2;
        const rank2Final = rank2Base - (-2.5) * (rank2Base - rank1Final);
        extraX = sign * (rank2Final - rank2Base);
      }

      if (isHero && flattenHero) {
        // SETTLED HERO — 2D only.
        // translateZ keeps an element on the GPU compositing path no matter what
        // will-change says, and Chrome reuses whatever raster scale that layer
        // was last given: a card that spent its life small arrives at the centre
        // and is stretched from a small texture, which is the softness you see
        // until something forces a repaint. Swapping to the algebraically
        // identical 2D transform takes the settled card off that path so it is
        // painted normally, at full resolution.
        //
        // translateZ(z) maps a point P to O + (P - O) * Z_SCALE, where O is the
        // perspective origin (centre of the viewport). Reproducing that with a
        // plain scale about the card's own centre needs a compensating offset.
        const vr = viewport.getBoundingClientRect();
        const rr = row.getBoundingClientRect();
        const originY = vr.top + vr.height / 2;
        const boxCentreY = rr.top + w / 2;            // card box centre, untransformed
        const dx = (cardCenter - center) * (Z_SCALE - 1);
        const dy = (boxCentreY - originY) * (Z_SCALE - 1) + yPos * Z_SCALE;
        card.style.transform = `translateX(${extraX + dx}px) translateY(${dy}px) scale(${scale * Z_SCALE})`;
      } else {
        card.style.transform = `translateX(${extraX}px) translateY(${yPos}px) rotateY(${rotationY}deg) translateZ(${depthZ}px) skewY(${skew}deg) scale(${scale})`;
      }
      // The hero gets NO filter at all rather than a no-op `brightness(1)
      // blur(0px)`. Any filter forces the element into its own buffer that
      // Chrome composites in sRGB, which both costs a rasterisation step and
      // slightly shifts colour on wide-gamut displays. Omitting it keeps the
      // centred card on the plain, colour-managed paint path.
      card.style.filter = isHero ? 'none' : `brightness(${brightness}) blur(${blur}px)`;
      // The lifted hero is held at 0 by showHeroLayer; don't fight it.
      card.style.opacity = (card === heroLayerCard) ? '0' : String(sideOpacity);
      card.style.boxShadow = shadow;
      card.style.zIndex = isHero ? '999' : String(500 - Math.round(abs));
      card.setAttribute('aria-selected', String(isHero));
      card.tabIndex = i === focusedIndex ? 0 : -1;

      if (abs < nearestDist) { nearestDist = abs; nearestIdx = i; }
    });

    // Follow whatever card has drifted under the centre (drag / hover-pan)
    // without fighting the translate that put it there.
    //
    // NOT while snapping, and that guard is load-bearing. A click on a side
    // card runs `setFocus(idx, true); playSample();` (js:168-169) — focus and
    // panel are already correct for the DESTINATION on the first frame, and
    // the sample is already playing. But the carousel then GLIDES there, and
    // for every frame of that glide the card nearest the centre is one of the
    // tracks in between. Without this guard each of those re-entered
    // setFocus -> updatePanel -> stopSample() + wireSamplePlayer(fresh Audio),
    // so the sample that had just started was paused ~10ms later and thrown
    // away, and the panel landed on the right track holding an Audio nobody
    // ever played.
    //
    // That was the "jumps land paused" defect in V2HANDOFF 25, measured Aug 11
    // 2026 and wrongly attributed there to call ordering inside wireSamplePlayer
    // (it is synchronous, so ordering was never the problem) — the probe that
    // settled it counted `ks:sample-ready` events, which fire once per rewire:
    // a one-card click rewired 3 times, a jump across 8 tracks rewired 8.
    // It was never Music-specific; index.html's carousel had it too.
    //
    // Cleared when the glide settles (see tick) and on pointerdown, so a drag
    // that interrupts a snap goes straight back to following the cards.
    if (!snapping && nearestIdx !== focusedIndex) setFocus(nearestIdx, false);
    if (nearestIdx !== heroIndex) { heroIndex = nearestIdx; updateCardVideos(nearestIdx); }
  }

  // Promote data-src -> src once, so the file is only ever fetched on demand.
  function attachVideo(v) {
    if (v.dataset.src) { v.src = v.dataset.src; delete v.dataset.src; }
  }

  // The hero card's video rolls only while its sample is actually playing —
  // browsing the carousel shows still artwork. Neighbours are loaded but never
  // played, so hitting play right after stepping across is instant.
  function updateCardVideos(hero) {
    row.querySelectorAll('video.track-card__video').forEach((v) => {
      const card = v.closest('.track-card');
      const i = Number(card.dataset.i);
      if (Math.abs(i - hero) <= 1) attachVideo(v);
      if (i === hero && samplePlaying && !reducedMotion) {
        clearTimeout(v._rewind);
        card.classList.add('is-rolling');
        const pr = v.play();
        if (pr && pr.catch) pr.catch(() => {});
      } else {
        card.classList.remove('is-rolling');
        if (!v.paused) {
          v.pause();
          // Do NOT rewind yet. The clip is a slow push-in, so snapping to frame
          // 0 the instant it pauses jumps the framing wide while the video is
          // still visible. Let it hold its frame through the fade-out and
          // dissolve into the still, then rewind once it's invisible.
          clearTimeout(v._rewind);
          v._rewind = setTimeout(() => { v.currentTime = 0; }, VIDEO_FADE_MS);
        }
      }
    });
    // Rolling state just changed. If the overlay is already standing in for
    // this same card it keeps ownership and only re-syncs its video — pulling
    // it down and rebuilding it here would flash the soft card on every
    // play/pause. It only comes down if the hero itself has changed.
    const hc = heroCard();
    if (heroLayerCard) {
      if (heroLayerCard === hc) syncLayerVideo(heroLayerCard);
      else hideHeroLayer();
    } else if (flattenHero && !running) {
      showHeroLayer(hc);
    }
  }

  function setSamplePlaying(on) {
    if (samplePlaying === on) return;
    samplePlaying = on;
    updateCardVideos(focusedIndex);
  }

  // The loop parks itself when nothing is moving. This is not just a battery
  // saving: while a composited layer is continuously animating, Chrome keeps it
  // on a low-resolution raster, which visibly softens the artwork. Stopping the
  // loop lets it re-rasterise the settled card at full device resolution.
  function kick() {
    if (running) return;
    running = true;
    row.classList.add('is-animating');
    requestAnimationFrame(tick);
  }

  function tick() {
    // The overlay stands in for a SETTLED hero, so it comes down as soon as
    // anything genuinely moves — but not merely because kick() was called.
    // pointerdown fires kick() for every click, including a click on the
    // centred card to toggle playback, which moves nothing: dropping the
    // overlay there put the soft in-row card on screen for a couple of frames
    // and restarted the video's opacity fade, which read as a flinch or a
    // double-click. Deciding here means we can look at whether the carousel
    // is actually going anywhere. dragMoved, not dragging: a press that never
    // passes DRAG_THRESHOLD is a click.
    if (dragMoved || Math.abs(target - current) >= 0.05) {
      if (heroLayerCard) hideHeroLayer();
      flattenHero = false;    // back into 3D space while anything is moving
    }
    if (!dragging) current += (target - current) * (reducedMotion ? 1 : 0.12);
    render();

    const settled = !dragging && Math.abs(target - current) < 0.05;
    if (settled) {
      current = target;
      snapping = false;               // arrived; follow the centre again
      render();                       // final exact placement, still in 3D
      running = false;
      row.classList.remove('is-animating');
      // Now flatten the hero and repaint it. Done on the next frame so the
      // settled 3D position is committed first and the swap can't be coalesced
      // into the same paint.
      requestAnimationFrame(() => {
        if (running) return;          // something moved again; leave it in 3D
        flattenHero = true;
        render();
        // render() has just written the hero's final rect; mirror it outside
        // the 3D context so it can rasterise at full resolution.
        showHeroLayer(heroCard());
      });
      return;
    }
    requestAnimationFrame(tick);
  }

  // ---- Focus panel ----
  function updatePanel(i) {
    if (panelIndex === i) return;
    panelIndex = i;
    stopSample();

    const t = tracks[i];
    applyAccent(t, i);
    focusPanel.querySelector('.track-focus-panel__eyebrow').textContent =
      (t.release || 'Rise Up') + (t.year ? ' · ' + t.year : '');
    focusPanel.querySelector('.track-focus-panel__title').textContent = t.title;
    focusPanel.querySelector('.track-focus-panel__desc').textContent = t.description || t.oneLiner || '';
    if (counterIndex) counterIndex.textContent = String(i + 1);

    section.querySelector('.track-focus-nav__btn[data-dir="prev"]').disabled = i === 0;
    section.querySelector('.track-focus-nav__btn[data-dir="next"]').disabled = i === tracks.length - 1;

    buildLinks(t);
    wireSamplePlayer(t);
  }

  // ---- Accent colour, sampled from the artwork ----
  // The eyebrow, the track number, the play button and the sample bar all read
  // from --track-accent. It used to come from a hand-assigned accentColor in
  // tracks.json — six shades shared across 27 tracks, and dark enough on a
  // black panel to be invisible. Now it is pulled out of the cover art itself,
  // so it is always the right colour for whatever is on screen and needs no
  // upkeep as the remaining artwork lands. accentColor stays as the fallback
  // used until the image decodes, and if the sample fails.
  const accentCache = new Map();

  function setAccent(v) { focusPanel.style.setProperty('--track-accent', v); }

  function applyAccent(track, i) {
    const fallback = track.accentColor || 'var(--color-bone)';
    if (accentCache.has(track.slug)) { setAccent(accentCache.get(track.slug)); return; }
    setAccent(fallback);
    if (!track.artwork) return;
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      const a = accentFromImage(img) || fallback;
      accentCache.set(track.slug, a);
      if (panelIndex === i) setAccent(a);   // don't paint a track we've left
    };
    img.onerror = () => accentCache.set(track.slug, fallback);
    img.src = track.artwork;
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    const l = (mx + mn) / 2;
    if (!d) return [0, 0, l];
    const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    let h;
    if (mx === r) h = ((g - b) / d + (g < b ? 6 : 0));
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    return [h * 60, s, l];
  }

  // Take the accent from the artwork's most VIVID pixels, not its average.
  // Averaging picks the wash — 33rd Floor came out copper, because the frame is
  // mostly warm brick and sodium light, and the red beam that actually reads as
  // the track's colour is a thin sliver. So each pixel is scored s^3 against a
  // lightness window centred on 0.55, the top 5% by that score are kept, and
  // only those get bucketed by hue. Cubing saturation is what lets a small
  // vivid feature outvote a large muted one; the lightness window keeps
  // near-black and blown-out pixels from qualifying on saturation noise.
  // 128px sample rather than 64: a thin feature has to survive the downscale.
  function accentFromImage(img) {
    const N = 128;
    const cvs = document.createElement('canvas');
    cvs.width = N; cvs.height = N;
    const ctx = cvs.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, N, N);
    let data;
    try { data = ctx.getImageData(0, 0, N, N).data; } catch (e) { return null; }

    const px = [];
    for (let i = 0; i < data.length; i += 4) {
      const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);
      const window = 1 - Math.abs(l - 0.55) * 1.6;
      if (window <= 0) continue;
      const v = s * s * s * window;
      if (v <= 0) continue;
      px.push([v, h, s, l]);
    }
    if (px.length < 32) return null;

    px.sort((a, b) => b[0] - a[0]);
    const keep = px.slice(0, Math.max(32, Math.round(px.length * 0.05)));

    const BINS = 24, W = new Array(BINS).fill(0), SA = new Array(BINS).fill(0), LA = new Array(BINS).fill(0);
    for (const [v, h, s, l] of keep) {
      const b = Math.min(BINS - 1, Math.floor(h / (360 / BINS)));
      W[b] += v; SA[b] += s * v; LA[b] += l * v;
    }
    let best = -1, bestW = 0;
    for (let i = 0; i < BINS; i++) if (W[i] > bestW) { bestW = W[i]; best = i; }
    if (best < 0) return null;

    // Keep the hue the artwork gave us; hold saturation and lightness inside a
    // band that stays legible on the black panel without tipping into neon.
    const h = Math.round(best * (360 / BINS) + (360 / BINS) / 2);
    const s = Math.round(Math.min(0.76, Math.max(0.48, (SA[best] / bestW) * 1.15)) * 100);
    const l = Math.round(Math.min(0.66, Math.max(0.55, (LA[best] / bestW) * 1.35)) * 100);
    return `hsl(${h} ${s}% ${l}%)`;
  }

  // ---- Streaming / download links (placeholders until each is connected) ----
  function buildLinks(track) {
    const linkButtons = [
      ['stream', 'Stream Now'],
      ['spotify', 'Spotify'],
      ['appleMusic', 'Apple Music'],
      ['youtubeMusic', 'YouTube Music'],
    ].map(([key, label]) => {
      const href = track.links && track.links[key];
      return href
        ? `<a class="btn btn--ghost" href="${href}" target="_blank" rel="noopener">${label}</a>`
        : `<span class="btn btn--ghost is-placeholder" aria-disabled="true">${label}</span>`;
    }).join('');

    const downloadHref = track.links && track.links.download;
    const downloadButton = downloadHref
      ? `<a class="btn btn--primary" href="${downloadHref}">Download — $1</a>`
      : `<span class="btn btn--primary is-placeholder" aria-disabled="true">Download — $1</span>`;

    let actions = focusPanel.querySelector('.track-focus-panel__actions');
    if (!actions) {
      actions = document.createElement('div');
      actions.className = 'track-focus-panel__actions';
      const note = document.createElement('p');
      note.className = 'track-focus-panel__actions-note';
      note.textContent = 'Streaming links go live once each platform is connected. Downloads open once payment is set up.';
      const anchor = focusPanel.querySelector('.track-focus-panel__close');
      focusPanel.insertBefore(actions, anchor);
      focusPanel.insertBefore(note, anchor);
    }
    actions.innerHTML = linkButtons + downloadButton;
  }

  // ---- 20-second sample playback ----
  function wireSamplePlayer(track) {
    const root = focusPanel.querySelector('.track-sample-player');
    const btn = root.querySelector('.track-sample-player__btn');
    const icon = btn.querySelector('span');
    const fill = root.querySelector('.track-sample-player__bar-fill');
    const status = root.querySelector('.track-sample-player__status');
    const cap = track.sampleDuration || 20;

    icon.innerHTML = '&#9654;';
    fill.style.width = '0%';
    btn.disabled = false;
    btn.setAttribute('aria-label', `Play sample of ${track.title}`);
    status.textContent = 'Play Sample';
    section.classList.remove('is-playing');
    setSamplePlaying(false);

    if (!track.sampleUrl) {
      status.textContent = 'Sample coming soon';
      btn.disabled = true;
      currentSample = null;
      return;
    }

    const audio = new Audio(track.sampleUrl);
    audio.preload = 'none';

    audio.addEventListener('play', () => {
      icon.innerHTML = '&#10074;&#10074;';
      btn.setAttribute('aria-label', `Pause sample of ${track.title}`);
      section.classList.add('is-playing');
      setSamplePlaying(true);
    });
    audio.addEventListener('pause', () => {
      icon.innerHTML = '&#9654;';
      btn.setAttribute('aria-label', `Play sample of ${track.title}`);
      status.textContent = 'Play Sample';
      section.classList.remove('is-playing');
      setSamplePlaying(false);
    });
    audio.addEventListener('timeupdate', () => {
      fill.style.width = Math.min(100, (audio.currentTime / cap) * 100) + '%';
      if (audio.currentTime >= cap) { audio.pause(); audio.currentTime = 0; fill.style.width = '0%'; }
    });
    audio.addEventListener('ended', () => { fill.style.width = '0%'; status.textContent = 'Play Sample'; });
    audio.addEventListener('error', () => { status.textContent = 'Sample unavailable'; btn.disabled = true; });

    btn.onclick = toggleSample;

    currentSample = { audio, fill, status, btn, icon };

    /* HAND THE ELEMENT OVER — for js/spine-bg.js's kick detector.
       Frequency analysis needs AudioContext.createMediaElementSource(el), which
       needs the element REFERENCE. It does not need a DOM node, so a detached
       Audio() is fine — but this one is private to this closure and there is no
       selector that reaches it. Announce it rather than let another file go
       hunting, which is what HANDOFF 7 ruled out ("patching its prototype would
       be worse").

       Fired on every panel change, so a listener sees one event per track and
       must key its graph by element — createMediaElementSource throws on a
       second call for the SAME element. Nothing here depends on anyone
       listening; with no listener this is an event into the void and playback
       is untouched. */
    section.dispatchEvent(new CustomEvent('ks:sample-ready', {
      detail: { audio: audio, title: track.title || null }
    }));
  }

  function playSample() {
    if (!currentSample || currentSample.btn.disabled) return;
    const { audio, status, btn } = currentSample;
    status.textContent = 'Loading…';
    audio.play()
      .then(() => { status.textContent = 'Playing sample'; })
      .catch(() => { status.textContent = 'Sample unavailable'; btn.disabled = true; });
  }

  function toggleSample() {
    if (!currentSample) return;
    if (currentSample.audio.paused) playSample();
    else currentSample.audio.pause();
  }

  function stopSample() {
    if (!currentSample) return;
    currentSample.audio.pause();
    currentSample.audio.currentTime = 0;
    if (currentSample.fill) currentSample.fill.style.width = '0%';
    if (currentSample.status) currentSample.status.textContent = 'Play Sample';
    section.classList.remove('is-playing');
    setSamplePlaying(false);
    // currentSample is deliberately KEPT. It used to be nulled here, which made
    // the player inert until the track changed: playSample() and toggleSample()
    // both bail on !currentSample, and only updatePanel() rebuilds it. Since
    // js:252 binds Escape -> stopSample() unguarded at document level, ONE
    // Escape anywhere on the page — even with nothing open — killed the play
    // button, so Music opened silently ever after. Measured Aug 11 2026: clean
    // open played; open after any Escape did not.
    // Nulling was never load-bearing: updatePanel() calls stopSample() and then
    // immediately hands the field a fresh element via wireSamplePlayer(), and
    // the no-sampleUrl branch there nulls it explicitly on its own.
  }
})();
