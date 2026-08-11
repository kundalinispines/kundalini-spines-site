/* ==========================================================================
   MUSIC WRAP — behaviour for the Music immersive node
   Partner files: music-lab.html (markup + presentation), css/spine-ui.css
   (the navigator this morphs), css/track-experience.css (the carousel this
   wraps). Built Aug 11 2026.

   THE RULE THIS FILE IS WRITTEN UNDER
     js/track-experience.js, js/spine-ui.js and js/spine-bg.js are NOT
     modified and NOT patched. Everything below reaches the carousel through
     three doors it already had:

       1. Synthetic clicks on .track-card. track-experience.js:160 binds its
          click to the VIEWPORT and resolves the card with
          `e.target.closest('.track-card')`, so dispatching a click on any
          card element -- including one that is not currently rendered --
          runs setFocus(idx, true) + playSample(). That is the entire jump
          mechanism for INDEX, SIGNAL and deep links. Stepping there with
          repeated prev/next clicks would have been 27 animated hops.
       2. Reading .track-focus-nav__index. focusedIndex is private to the
          module's closure, but the counter is written from it (js:688) and
          is a live region, so a MutationObserver on it is a reliable feed of
          "which track are we on" that costs the module nothing.
       3. Clicking .track-sample-player__btn, which is wired to the module's
          own toggleSample (js:868).

   WHAT THIS FILE OWNS
     - The reveal gate (see revealCarousel).
     - The node morph: six navigator destinations become six Music actions,
       and back again, verbatim.
     - Open / close, the beat, the URL, focus, and autoplay.
     - The six actions: CLOSE, INDEX, DECODE, SIGNAL, SHARE, SKY.
   ========================================================================== */
(function () {
  'use strict';

  var root    = document.documentElement;
  var section = document.querySelector('.track-experience');
  var navbar  = document.getElementById('spine-nav');
  var panel   = document.querySelector('.track-focus-panel');
  if (!section || !navbar || !panel) return;   /* not this page */

  var beat    = document.getElementById('beat');
  var toastEl = document.getElementById('toast');
  var row     = section.querySelector('.track-arc');
  var counter = section.querySelector('.track-focus-nav__index');
  var playBtn = section.querySelector('.track-sample-player__btn');
  var reduce  = window.matchMedia('(prefers-reduced-motion: reduce)');

  var tracks  = [];        /* our own copy — see fetchTracks */
  var musicOn = false;

  /* ------------------------------------------------------------------------
     THE REVEAL GATE
     css/track-experience.css:66-69 ships .track-experience at opacity 0 and
     .track-arc-wrap 24px low; .is-visible is what releases both. On
     index.html an IntersectionObserver adds it as you scroll to the section.
     Here the section sits inside a panel that is visibility:hidden until
     Music opens, and track-experience.js:259-260 warns exactly what happens
     if nobody adds the class: "nothing elsewhere in the codebase toggles
     this class, which would otherwise leave the section permanently
     invisible (opacity:0)."

     Added unconditionally at boot rather than on open, and with transitions
     suppressed for two frames -- the same two-frame flush revealNow() uses at
     js:275-289, and for the same reason: the entrance animation is written to
     be caught in passing while scrolling, and played at the moment a panel
     opens it is just the page assembling itself in front of you. The beat
     overlay is this page's arrival; the component's own is redundant here.
     ------------------------------------------------------------------------ */
  function revealCarousel() {
    if (section.classList.contains('is-visible')) return;
    var wrap = section.querySelector('.track-arc-wrap');
    var prevS = section.style.transition, prevW = wrap ? wrap.style.transition : null;
    section.style.transition = 'none';
    if (wrap) wrap.style.transition = 'none';
    section.classList.add('is-visible');
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      section.style.transition = prevS;
      if (wrap) wrap.style.transition = prevW;
    }); });
  }
  revealCarousel();

  /* ------------------------------------------------------------------------
     OUR OWN COPY OF THE TRACK DATA
     track-experience.js fetches data/tracks.json into a closure we cannot
     read, so INDEX, DECODE, SIGNAL and SHARE fetch it a second time. That is
     28KB (measured: transferSize 28,712 B) and it is the honest price of not
     editing the module to expose its array. scripts/serve.py sends
     Cache-Control: no-store, so it really is a second request in the lab;
     behind a normal cache it would not be.
     ------------------------------------------------------------------------ */
  function fetchTracks() {
    return fetch('data/tracks.json')
      .then(function (r) { return r.json(); })
      .then(function (d) { tracks = (d && d.tracks) || []; return tracks; })
      .catch(function () { tracks = []; return tracks; });
  }

  /* Wait for the module to finish building. Its cards arrive on a fetch, so
     they do not exist when this file first runs. Measured Aug 11 2026: 272ms
     median from script start to 28 cards in the DOM and painted, of which
     255ms is the JSON round trip and 17.3ms is real work. */
  function whenBuilt(cb) {
    if (row.querySelectorAll('.track-card').length) return cb();
    var tries = 0;
    (function poll() {
      if (row.querySelectorAll('.track-card').length) return cb();
      if (++tries > 240) return;            /* ~4s at 60fps, then give up quietly */
      requestAnimationFrame(poll);
    })();
  }

  /* ------------------------------------------------------------------------
     WHICH TRACK ARE WE ON
     ------------------------------------------------------------------------ */
  function currentIndex() {
    var n = parseInt(counter && counter.textContent, 10);
    return isFinite(n) ? n - 1 : 0;         /* the counter is 1-based */
  }
  function currentTrack() { return tracks[currentIndex()] || null; }

  /* Jump to any track by dispatching the click the module is already
     listening for. `true` on setFocus animates the move, and playSample()
     follows, which is what makes the sky answer. */
  function jumpTo(i) {
    var card = row.querySelector('.track-card[data-i="' + i + '"]');
    if (card) card.click();
  }

  /* ------------------------------------------------------------------------
     THE NODE MORPH
     Six navigator destinations become six Music actions. The buttons, their
     ids, their y positions, their ping delays and their comet sync are all
     untouched -- only the label's inner HTML changes, and the navigator's own
     copy is captured once at boot and restored verbatim on the way out. A
     morph, not a swap: a swap would read as a different component arriving.
     ------------------------------------------------------------------------ */
  var ACTIONS = [
    { id: 'music',    idx: '01', title: 'Close',  act: closeMusic },
    { id: 'story',    idx: '02', title: 'Index',  act: toggleIndex },
    { id: 'members',  idx: '03', title: 'Decode', act: toggleDecode },
    { id: 'ethos',    idx: '04', title: 'Signal', act: randomTrack },
    { id: 'archive',  idx: '05', title: 'Share',  act: shareTrack },
    { id: 'timeline', idx: '06', title: 'Sky',    act: toggleSky }
  ];

  var els = {}, navLabel = {}, navAria = {};
  ACTIONS.forEach(function (a) {
    var el = navbar.querySelector('.spine-node[data-id="' + a.id + '"]');
    if (!el) return;
    els[a.id] = el;
    navLabel[a.id] = el.querySelector('.spine-node__label').innerHTML;
    navAria[a.id]  = el.getAttribute('aria-label');
  });

  function paintNodes() {
    ACTIONS.forEach(function (a) {
      var el = els[a.id];
      if (!el) return;
      var label = el.querySelector('.spine-node__label');
      if (musicOn) {
        label.innerHTML = '<span class="idx">' + a.idx + '</span>' + a.title.toUpperCase();
        el.setAttribute('aria-label', a.title);
      } else {
        label.innerHTML = navLabel[a.id];
        if (navAria[a.id]) el.setAttribute('aria-label', navAria[a.id]);
        /* aria-pressed is a Music-only idea — see syncToggleStates. Leaving a
           stale one on a navigator destination would report a toggle state
           the button does not have. */
        el.removeAttribute('aria-pressed');
      }
    });
    syncToggleStates();
  }

  /* INDEX, DECODE and SKY are toggles and should say so to a screen reader.
     CLOSE, SIGNAL and SHARE are one-shot actions and must NOT carry
     aria-pressed -- a button that reports a pressed state it does not have is
     worse than one that reports nothing. */
  function syncToggleStates() {
    if (!musicOn) return;
    if (els.story)    els.story.setAttribute('aria-pressed', String(root.classList.contains('is-index')));
    if (els.members)  els.members.setAttribute('aria-pressed', String(root.classList.contains('is-decode')));
    if (els.timeline) els.timeline.setAttribute('aria-pressed', String(!root.classList.contains('is-sky-off')));
  }

  /* Intercept in the CAPTURE phase on the container. js/spine-ui.js binds its
     click to each button in the BUBBLE phase, so stopping propagation here
     runs first and activate() never opens the reading card. There is no
     .spine-card in Music by design: of the six nodes, three are instant
     actions, one is a toast, one swaps the focus panel's contents and one
     replaces the carousel. Only one wants a surface and it is the one that
     should take the carousel's place rather than sit on top of it. */
  function handleNode(e, btn) {
    /* NAVIGATOR MODE: only node 01 is ours. It is the immersive node, and
       js/spine-ui.js would otherwise open its "wired in a later stage" stub
       card -- the placeholder this whole page exists to replace. Every other
       node falls through untouched, so Our Story, The Messengers, Our Ethos,
       Archive and Timeline still open their reading cards exactly as before. */
    if (!musicOn) {
      if (btn.dataset.id !== 'music') return;
      e.stopPropagation();
      e.preventDefault();
      openMusic();
      return;
    }
    e.stopPropagation();
    e.preventDefault();
    var a = ACTIONS.filter(function (x) { return x.id === btn.dataset.id; })[0];
    if (a) a.act();
  }

  navbar.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('.spine-node') : null;
    if (btn) handleNode(e, btn);
  }, true);

  /* Same interception for the keyboard. spine-ui.js's roving tabindex still
     moves focus along the string; only activation is ours. */
  navbar.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var btn = e.target.closest ? e.target.closest('.spine-node') : null;
    if (btn) handleNode(e, btn);
  }, true);

  /* ------------------------------------------------------------------------
     OPEN / CLOSE
     ------------------------------------------------------------------------ */
  function openMusic(opts) {
    if (musicOn) return;
    opts = opts || {};
    musicOn = true;
    root.classList.add('is-music');
    paintNodes();

    /* The beat. The spine's collapse carries the motion; this overlay covers
       the swap above it. Never a fade on an ancestor of the carousel -- see
       the note on .music in music-lab.html. The class is removed, the layout
       flushed and re-added so a second open replays it (V2HANDOFF 24's
       finding 11: without the flush the class never left the computed style
       and the animation never re-triggers). */
    if (!reduce.matches) {
      beat.classList.remove('is-running');
      void beat.offsetWidth;
      beat.classList.add('is-running');
    }

    /* The panel was visibility:hidden, which lays out but does not paint, so
       widths were already correct. Firing resize anyway is one line and it is
       the module's own recentre path (js:235) -- cheap insurance against a
       future host that hides the panel some other way. */
    window.dispatchEvent(new Event('resize'));

    if (!opts.silent) pushHash();

    whenBuilt(function () {
      if (opts.slug) {
        var i = indexOfSlug(opts.slug);
        if (i >= 0 && i !== currentIndex()) { jumpTo(i); }
        else { autoplay(); }
      } else {
        /* No jump: the carousel already opens on
           setFocus(Math.floor(tracks.length / 2)) = index 14, Blue Pills
           (track-experience.js:256). "The same track as the current build"
           costs nothing to honour -- it is the default. */
        autoplay();
      }
      focusCarousel();
      syncDecode();
    });
  }

  function closeMusic() {
    if (!musicOn) return;
    musicOn = false;
    root.classList.remove('is-music', 'is-index', 'is-decode');
    stopSample();
    paintNodes();
    /* Focus returns to the node it came from, which keeps spine-ui.js's
       roving tabindex coherent. */
    if (els.music) els.music.focus();
    clearHash();
  }

  /* Autoplay is permitted here: Music is opened by a click, so the gesture
     the AudioContext needs has already happened and spine-bg.js's route()
     guard (only route once ctx.state is 'running') is satisfied. Without this
     the sample waits for a second click, the sky stays still, and the payoff
     the whole entrance is built toward never fires. */
  function autoplay() {
    if (section.classList.contains('is-playing')) return;
    if (playBtn) playBtn.click();
  }
  function stopSample() {
    if (section.classList.contains('is-playing') && playBtn) playBtn.click();
  }
  function focusCarousel() {
    var hero = row.querySelector('.track-card[tabindex="0"]') || row.querySelector('.track-card');
    if (hero) hero.focus({ preventScroll: true });
  }

  /* ------------------------------------------------------------------------
     THE SIX ACTIONS
     ------------------------------------------------------------------------ */

  /* 02 INDEX — replaces the carousel. Never overlays it: the tracks are
     either the main event or they are not on screen. */
  function toggleIndex() {
    var on = !root.classList.contains('is-index');
    root.classList.toggle('is-index', on);
    if (on) buildIndex();
    syncToggleStates();
  }

  var indexBuilt = false;
  function buildIndex() {
    fillIndex();
    /* AFTER fillIndex, not before. Marking first meant the very first open
       marked a grid that did not exist yet, so nothing carried aria-current
       until the second open. Caught in verification Aug 11 2026. */
    markIndexCurrent();
  }
  function fillIndex() {
    if (indexBuilt) return;
    var grid = document.getElementById('mindex-grid');
    var count = document.getElementById('mindex-count');
    if (!grid || !tracks.length) return;
    if (count) count.textContent = String(tracks.length);
    tracks.forEach(function (t, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'mindex__cell';
      b.dataset.i = i;
      b.setAttribute('aria-label', t.title + (t.duration ? ' — ' + t.duration : ''));
      b.innerHTML = '<span class="mindex__n">' + String(i + 1).padStart(2, '0') + '</span>' +
                    '<img src="' + t.artwork + '" alt="" loading="lazy" draggable="false">';
      b.addEventListener('click', function () {
        jumpTo(i);
        root.classList.remove('is-index');   /* jumping returns you to the carousel */
        syncToggleStates();
        focusCarousel();
      });
      grid.appendChild(b);
    });
    indexBuilt = true;
  }
  function markIndexCurrent() {
    var cur = currentIndex();
    var cells = document.querySelectorAll('.mindex__cell');
    for (var i = 0; i < cells.length; i++) {
      cells[i].setAttribute('aria-current', String(Number(cells[i].dataset.i) === cur));
    }
  }

  /* 03 DECODE — swaps the focus panel's contents rather than adding a
     surface. Zero new pixels, which is the only option available: the panel
     fits 900px with 112.14px of slack and nothing scrolls. */
  var decodeEl = null;
  function ensureDecode() {
    if (decodeEl) return decodeEl;
    var desc = panel.querySelector('.track-focus-panel__desc');
    decodeEl = document.createElement('div');
    decodeEl.className = 'mdecode';
    decodeEl.innerHTML = '<p class="mdecode__title"></p><p class="mdecode__rows"></p>';
    if (desc && desc.parentNode) desc.parentNode.insertBefore(decodeEl, desc.nextSibling);
    else panel.appendChild(decodeEl);
    return decodeEl;
  }
  function toggleDecode() {
    var on = !root.classList.contains('is-decode');
    root.classList.toggle('is-decode', on);
    if (on) syncDecode();
    syncToggleStates();
  }
  function syncDecode() {
    if (!root.classList.contains('is-decode')) return;
    var t = currentTrack();
    if (!t) return;
    var el = ensureDecode();
    el.querySelector('.mdecode__title').textContent = t.title || '';
    /* title and duration reach the screen here for the FIRST time in this
       component's life: the <h3> is .sr-only by design because the artwork
       carries the name, and `duration` is populated on all 28 tracks and
       rendered nowhere. `geometry` is one of 84 visualTheme values no line of
       code in the repo reads. */
    var g = t.visualTheme && t.visualTheme.geometry;
    el.querySelector('.mdecode__rows').innerHTML =
      (t.duration ? '<span>Length<b>' + t.duration + '</b></span>' : '') +
      (g ? '<span>Geometry<b>' + g + '</b></span>' : '') +
      (t.release ? '<span>Release<b>' + t.release + '</b></span>' : '');
  }

  /* 04 SIGNAL — a real answer to 28 tracks behind +/-1 stepping. */
  function randomTrack() {
    if (tracks.length < 2) return;
    var cur = currentIndex(), i = cur;
    while (i === cur) i = Math.floor(Math.random() * tracks.length);
    jumpTo(i);
    if (root.classList.contains('is-index')) {
      root.classList.remove('is-index');
      syncToggleStates();
    }
  }

  /* 05 SHARE — a copy-link, not platform buttons. data/tracks.json's `links`
     object is 140 null cells; there is nothing to share TO yet. */
  function shareTrack() {
    var t = currentTrack();
    var url = location.origin + location.pathname + '#music' + (t && t.slug ? '/' + t.slug : '');
    var done = function () { toast('Link copied — ' + (t ? t.title : 'Music')); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done, function () { toast(url); });
    } else {
      toast(url);
    }
  }

  /* 06 SKY — the explicit switch for the thing Music turns on, and the manual
     equivalent of prefers-reduced-motion for anyone who never set it. */
  function toggleSky() {
    root.classList.toggle('is-sky-off');
    toast(root.classList.contains('is-sky-off') ? 'Sky still' : 'Sky reactive');
    syncToggleStates();
  }

  var toastTimer = null;
  function toast(text) {
    if (!toastEl) return;
    toastEl.textContent = text;
    toastEl.classList.add('is-up');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-up'); }, 2600);
  }

  /* ------------------------------------------------------------------------
     EXITS
     Three, as settled: Esc, node 01 CLOSE, and the rail.

     ESCAPE CLOSES MUSIC OUTRIGHT, including from inside INDEX. It does not
     cascade. track-experience.js:252 has its own unguarded document-level
     `Escape -> stopSample()`, which fires alongside this and produces exactly
     the wanted behaviour by accident -- panel closed, audio stopped. That is
     why the module needs no edit here, and why this comment exists rather
     than a guard. INDEX has its own way back: the 02 node toggles it, and
     clicking any cover jumps and returns.
     ------------------------------------------------------------------------ */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && musicOn) closeMusic();
  });

  /* The rail. .spine is aria-hidden and 2px wide, so it gets a wider hit
     strip and is a POINTER convenience only -- node 01 and Esc are the
     accessible paths, which is why no role or tabindex is added here. */
  var spineEl = document.querySelector('.spine');
  if (spineEl) spineEl.addEventListener('click', function () { if (musicOn) closeMusic(); });

  /* ------------------------------------------------------------------------
     THE URL
     One history entry for Music, so Back exits. The slug is kept current with
     replaceState as you browse -- pushing on every track change would bury
     the exit under 28 entries.
     ------------------------------------------------------------------------ */
  function hashFor() {
    var t = currentTrack();
    return '#music' + (t && t.slug ? '/' + t.slug : '');
  }
  function pushHash() {
    try { history.pushState({ music: true }, '', hashFor()); } catch (err) {}
  }
  function syncHash() {
    if (!musicOn) return;
    try { history.replaceState({ music: true }, '', hashFor()); } catch (err) {}
  }
  function clearHash() {
    try { history.pushState({ music: false }, '', location.pathname); } catch (err) {}
  }
  function indexOfSlug(slug) {
    for (var i = 0; i < tracks.length; i++) if (tracks[i].slug === slug) return i;
    return -1;
  }

  window.addEventListener('popstate', function () {
    var wants = /^#music\b/.test(location.hash);
    if (wants && !musicOn) openMusic({ silent: true, slug: slugFromHash() });
    else if (!wants && musicOn) { musicOn = false;
      root.classList.remove('is-music', 'is-index', 'is-decode');
      stopSample(); paintNodes(); if (els.music) els.music.focus(); }
  });
  function slugFromHash() {
    var m = location.hash.match(/^#music\/(.+)$/);
    return m ? m[1] : null;
  }

  /* ------------------------------------------------------------------------
     THE FEED: which track are we on
     focusedIndex is private to the module. The counter is written from it and
     is already a live region, so observing it is a read-only tap that costs
     the module nothing and cannot desync -- if the counter is wrong the
     visible UI is wrong too.
     ------------------------------------------------------------------------ */
  if (counter) {
    new MutationObserver(function () {
      syncDecode();
      markIndexCurrent();
      syncHash();
    }).observe(counter, { childList: true, characterData: true, subtree: true });
  }

  /* ------------------------------------------------------------------------
     BOOT
     ------------------------------------------------------------------------ */
  fetchTracks().then(function () {
    if (/^#music\b/.test(location.hash)) {
      /* Deep link: straight in, no history entry of our own (the URL is
         already what it should be) and no entrance to sit through. */
      openMusic({ silent: true, slug: slugFromHash() });
    }
  });

  /* Lab hooks, mirroring window.__spineLab / window.__entrance. Not used by
     the page itself. */
  window.__music = {
    open: openMusic, close: closeMusic,
    index: toggleIndex, decode: toggleDecode,
    signal: randomTrack, share: shareTrack, sky: toggleSky,
    currentIndex: currentIndex, isOpen: function () { return musicOn; }
  };
})();
