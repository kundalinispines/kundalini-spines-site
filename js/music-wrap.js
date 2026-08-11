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
    if (!card) return;
    /* Held across the whole stop-then-start the module performs when it swaps
       samples, so the shuffle watcher above does not read our own outgoing
       track as a completed one. Two frames is enough: the module stops and
       starts inside the same click handler. */
    jumping = true;
    card.click();
    /* KNOWN DEFECT, measured Aug 11 2026 and NOT fixed — see V2HANDOFF 25.
       A synthetic card click changes the track but lands PAUSED. Two seconds
       after the click the section has no is-playing class, the status reads
       "Play Sample" and the button is enabled showing the play glyph, even
       though track-experience.js:168-169 does `setFocus(idx, true);
       playSample();` and clearly intends to play. Not the autoplay policy:
       play() rejecting would set "Sample unavailable" (js:894-896). The
       likeliest cause is ordering — the focus change rebuilds the panel and
       wireSamplePlayer() hands it a FRESH Audio() element, so playSample()
       acts before the element it needs exists.

       A nudge was tried here (press the play button 140ms later, guarded on
       is-playing) and it is deliberately NOT in the code: it produced a
       DOUBLE advance under shuffle — 15 -> 25 -> 26 in one completion — and a
       fix that introduces a second bug is not a fix. Diagnose the ordering
       properly before trying again. */
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { jumping = false; });
    });
  }

  /* ------------------------------------------------------------------------
     THE NODE MORPH
     Six navigator destinations become six Music actions. The buttons, their
     ids, their y positions, their ping delays and their comet sync are all
     untouched -- only the label's inner HTML changes, and the navigator's own
     copy is captured once at boot and restored verbatim on the way out. A
     morph, not a swap: a swap would read as a different component arriving.
     ------------------------------------------------------------------------ */
  /* SEVEN entries against the navigator's six nodes. The seventh, `purchase`,
     is created by this file and lives only in Music -- see makePurchaseNode.
     Order is the owner's: Purchase sits at 02 and everything below moves down
     one. */
  var ACTIONS = [
    { id: 'music',    title: 'Close',            act: closeMusic },
    { id: 'purchase', title: 'Purchase Rise Up', act: purchase },
    { id: 'story',    title: 'Index',            act: toggleIndex },
    { id: 'members',  title: 'Decode',           act: toggleDecode },
    { id: 'ethos',    title: 'Shuffle',          act: toggleShuffle },
    { id: 'archive',  title: 'Share',            act: shareTrack },
    { id: 'timeline', title: 'Sky',              act: toggleSky }
  ];
  ACTIONS.forEach(function (a, i) { a.idx = ('0' + (i + 1)).slice(-2); });

  var els = {}, navLabel = {}, navAria = {}, navY = {}, navPing = {};

  /* The seventh node. Cloned from a real one rather than hand-built, so it
     inherits the reticle / ring / ping / dot structure and every CSS rule
     that keys off it. Kept in the DOM and display:none'd outside Music --
     removing and re-adding it would drop the ping animation's phase, which is
     what keeps the node flashes synced to the rising comet. */
  function makePurchaseNode() {
    var seed = navbar.querySelector('.spine-node');
    if (!seed) return null;
    var el = seed.cloneNode(true);
    el.dataset.id = 'purchase';
    el.dataset.kind = 'immersive';
    el.className = 'spine-node is-music-only';
    el.tabIndex = -1;
    el.removeAttribute('aria-expanded');
    /* Inserted after node 01 so DOM order matches visual order, which is what
       a screen reader reads and what Tab follows. */
    seed.parentNode.insertBefore(el, seed.nextSibling);
    return el;
  }

  ACTIONS.forEach(function (a) {
    var el = navbar.querySelector('.spine-node[data-id="' + a.id + '"]');
    if (!el && a.id === 'purchase') el = makePurchaseNode();
    if (!el) return;
    els[a.id] = el;
    navLabel[a.id] = el.querySelector('.spine-node__label').innerHTML;
    navAria[a.id]  = el.getAttribute('aria-label');
    navY[a.id]     = el.style.getPropertyValue('--y');
    navPing[a.id]  = el.querySelector('.spine-node__ping').style.animationDelay;
  });

  /* ------------------------------------------------------------------------
     RE-LAYING OUT THE RAIL FOR SEVEN
     The navigator's six sit at y = 14/29/44/59/74/88. Seven need the same
     extent divided six ways: 14 -> 88 in steps of 12.333.

     The ping delay is NOT decoration and cannot be left alone. css/spine-ui.css
     drives a single upward energy pass over --spine-ui-energy-ms, and
     js/spine-ui.js gives each node a NEGATIVE animation-delay so its flash
     lands when the rising comet reaches it:  -(y-8)/84 * energyMs. Move a node
     without recomputing that and its flash fires at the wrong height, which
     reads as the string having come loose from the comet. Same formula,
     restated here rather than imported because the module does not export it.
     ------------------------------------------------------------------------ */
  var energyMs = parseFloat(getComputedStyle(root).getPropertyValue('--spine-ui-energy-ms')) || 7000;
  function pingDelay(y) {
    var f = Math.max(0, Math.min(1, (y - 8) / 84));
    return (-f * energyMs).toFixed(0) + 'ms';
  }
  function layoutRail() {
    var n = ACTIONS.length, top = 14, bottom = 88;
    var step = (bottom - top) / (n - 1);
    ACTIONS.forEach(function (a, i) {
      var el = els[a.id];
      if (!el) return;
      var y = top + step * i;
      el.style.setProperty('--y', y.toFixed(2) + '%');
      el.querySelector('.spine-node__ping').style.animationDelay = pingDelay(y);
    });
  }
  function restoreRail() {
    ACTIONS.forEach(function (a) {
      var el = els[a.id];
      if (!el) return;
      if (navY[a.id]) el.style.setProperty('--y', navY[a.id]);
      el.querySelector('.spine-node__ping').style.animationDelay = navPing[a.id] || '';
    });
  }

  function paintNodes() {
    ACTIONS.forEach(function (a) {
      var el = els[a.id];
      if (!el) return;
      var label = el.querySelector('.spine-node__label');
      if (musicOn) {
        /* NO NUMBERING. The rail carried 01-07 for a while, mirroring the
           navigator's own numbered destinations, and it was removed Aug 11
           2026 on the owner's call: the navigator numbers a fixed set of
           places you can go, which is a map; these are actions, and numbering
           actions implies an order to perform them in that does not exist.
           `idx` is still computed on ACTIONS above because it documents the
           settled order and the verification reads it — it just never
           reaches the DOM.

           The word keeps its own span. The hover rule measures where the
           first LETTER starts rather than deriving it from a font size and a
           letter-spacing that would drift the moment either changed. */
        label.innerHTML = '<span class="word">' + a.title.toUpperCase() + '</span>';
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
    if (musicOn) { layoutRail(); measureRuleLengths(); } else { restoreRail(); }
    syncToggleStates();
  }

  /* ------------------------------------------------------------------------
     THE HOVER RULE
     On hover a line grows RIGHTWARD from the dot and stops just short of the
     word's first letter, and the number fades out as it arrives — so the rule
     ends up occupying the space the number held and pointing at the name.

     Nothing points LEFT. The navigator's .spine-node__reticle is a crosshair
     drawn symmetrically about the node, which on a rail 54px from the edge
     put half its width off the viewport; it is hidden in Music and this
     replaces it.

     The length is MEASURED, not derived. --node-label-offset, the number's
     width and its 6px margin all feed it, and "05" is not the same width as
     "01" in every face. Re-measured on every morph and on resize.
     ------------------------------------------------------------------------ */
  function measureRuleLengths() {
    if (!musicOn) return;
    ACTIONS.forEach(function (a) {
      var el = els[a.id];
      if (!el) return;
      var word = el.querySelector('.word');
      if (!word) return;
      var dot = el.getBoundingClientRect();
      var w   = word.getBoundingClientRect();
      /* From the node's centre to the first letter, less an 8px breathing gap
         so the rule points at the word rather than touching it. */
      var len = Math.max(0, (w.left - (dot.left + dot.width / 2)) - 8);
      el.style.setProperty('--rule-len', len.toFixed(1) + 'px');
    });
  }
  window.addEventListener('resize', measureRuleLengths);

  /* INDEX, DECODE and SKY are toggles and should say so to a screen reader.
     CLOSE, SIGNAL and SHARE are one-shot actions and must NOT carry
     aria-pressed -- a button that reports a pressed state it does not have is
     worse than one that reports nothing. */
  function syncToggleStates() {
    if (!musicOn) return;
    if (els.story)    els.story.setAttribute('aria-pressed', String(root.classList.contains('is-index')));
    if (els.members)  els.members.setAttribute('aria-pressed', String(root.classList.contains('is-decode')));
    if (els.ethos)    els.ethos.setAttribute('aria-pressed', String(shuffleOn));
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
    var btn = e.target.closest ? e.target.closest('.spine-node') : null;
    if (!btn) return;
    if (e.key === 'Enter' || e.key === ' ') { handleNode(e, btn); return; }

    /* MUSIC OWNS ITS OWN ROVING, and it has to.
       js/spine-ui.js:185-194 rolls the arrow keys over NODES[] -- its own six
       -- and bails with `if (i === -1) return` for any id it does not know.
       The seventh node's id is `purchase`, which is not in that table, so
       landing on it would silently kill arrow navigation for the rest of the
       string. Rather than teach the module about a node that only exists
       inside Music, Music takes the whole job while it is open: same keys,
       same wrap-around, same roving tabindex, over ACTIONS instead. */
    if (!musicOn) return;
    var order = ACTIONS.map(function (a) { return a.id; });
    var i = order.indexOf(btn.dataset.id);
    if (i === -1) return;
    var next = null;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = order[(i + 1) % order.length];
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = order[(i - 1 + order.length) % order.length];
    else if (e.key === 'Home') next = order[0];
    else if (e.key === 'End') next = order[order.length - 1];
    if (!next) return;
    e.stopPropagation();
    e.preventDefault();
    ACTIONS.forEach(function (a) { if (els[a.id]) els[a.id].tabIndex = -1; });
    if (els[next]) { els[next].tabIndex = 0; els[next].focus(); }
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

  /* 02 PURCHASE RISE UP
     There is nothing to buy against yet: data/tracks.json's links.download is
     null on all 28 tracks, and the "Download — $1" price in
     track-experience.js:804 is hardcoded into a template string rather than
     coming from the data. So this reports the same thing the hidden actions
     note says, in the same words, rather than pretending at a checkout. */
  function purchase() {
    toast('Rise Up — purchase opens once payment is set up');
  }

  /* 05 SHUFFLE — shuffle PLAY, not a one-shot jump.
     It replaced SIGNAL (which only jumped to a random track) because INDEX
     already solves reaching any of the 28, which left SIGNAL a novelty. The
     real gap this fills is that the player cannot run on its own at all:
     track-experience.js:865's `ended` handler resets the fill bar and the
     status text and stops there, and the 20s cap at js:863 does the same.
     Nothing ever advances. With shuffle on, Music is something you can leave
     playing. */
  var shuffleOn = false;
  function toggleShuffle() {
    shuffleOn = !shuffleOn;
    toast(shuffleOn ? 'Shuffle on — plays through at random' : 'Shuffle off');
    syncToggleStates();
  }
  function randomOther() {
    if (tracks.length < 2) return -1;
    var cur = currentIndex(), i = cur;
    while (i === cur) i = Math.floor(Math.random() * tracks.length);
    return i;
  }

  /* TELLING "IT FINISHED" FROM "YOU PAUSED IT", without touching the module.
     Both end the same way -- .track-experience loses is-playing, the fill
     resets to 0% and the status returns to "Play Sample" -- so the class alone
     cannot distinguish them, and advancing on a deliberate pause would be
     the worst possible behaviour. The one thing that does differ is how far
     the bar got: a completed 20s sample is at ~100% the instant before it
     resets, a pause is wherever you stopped. So the peak is sampled while
     playing and read once playback stops.

     Sampled on an interval rather than rAF, and only while audible: the
     carousel deliberately runs NO idle rAF loop (measured Aug 11 2026 -- four
     registrations in an entire session) and adding one to watch a progress
     bar would undo that. */
  var fillEl = section.querySelector('.track-sample-player__bar-fill');
  var peak = 0, peakTimer = null, wasPlaying = false;

  /* Set BEFORE the module's own handler runs (capture phase on the button), so
     by the time is-playing flips, the reason is already known. Every
     deliberate stop goes through this button -- including this file's own
     autoplay()/stopSample(), which call .click() precisely so they are
     indistinguishable from the user pressing it. */
  var userToggled = false;
  if (playBtn) playBtn.addEventListener('click', function () { userToggled = true; }, true);

  /* Why the last stop was or was not treated as a completion. Exposed on
     window.__music because this decision is invisible from the DOM — the whole
     problem is that a pause and a finish look identical from outside. */
  var lastStop = null;

  /* jumpTo() dispatches a card click, and the module stops the outgoing sample
     to start the incoming one -- so is-playing drops mid-jump with nobody
     having pressed anything. Without this guard that reads as "finished" and
     shuffle advances again, from inside its own advance. */
  var jumping = false;

  function watchFill(on) {
    clearInterval(peakTimer);
    if (!on) return;
    peak = 0;
    peakTimer = setInterval(function () {
      var w = parseFloat(fillEl && fillEl.style.width) || 0;
      if (w > peak) peak = w;
    }, 200);
  }

  new MutationObserver(function () {
    var playing = section.classList.contains('is-playing');
    if (playing === wasPlaying) return;      /* class churn, not a transition */
    wasPlaying = playing;
    if (playing) { userToggled = false; watchFill(true); return; }

    /* THREE SIGNALS, because no single one is trustworthy. A completed sample
       and a deliberate pause end identically as far as the DOM is concerned:
       is-playing drops, the fill resets to 0% and the status returns to
       "Play Sample". Advancing on a pause would be the worst possible
       behaviour, so:
         - userToggled  : somebody pressed the button. Never a completion.
         - jumping      : we caused this stop ourselves.
         - peak         : how far the bar actually got.

       The peak threshold is 70, not 95. It was 95 on the assumption that a
       capped 20s sample ends at 100%, and it does not: the cap at
       track-experience.js:863 only fires if the FILE is longer than
       sampleDuration, and where the mp3 is shorter the audio simply `ended`
       first -- at a fill of length/20, which for an 18s sample is 90% and for
       a 15s one is 75%. Measured Aug 11 2026: shuffle silently never advanced
       because of exactly this. 70 clears every real sample and still sits well
       above a plausible early pause, and the two flags above are the real
       discriminators anyway. */
    var finished = !userToggled && !jumping && peak >= 70;
    lastStop = { peak: peak, userToggled: userToggled, jumping: jumping,
                 finished: finished, shuffleOn: shuffleOn, musicOn: musicOn,
                 at: Math.round(performance.now()) };
    watchFill(false);
    userToggled = false;
    if (musicOn && shuffleOn && finished) {
      var i = randomOther();
      if (i >= 0) jumpTo(i);
    }
  }).observe(section, { attributes: true, attributeFilter: ['class'] });

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
    index: toggleIndex, decode: toggleDecode, purchase: purchase,
    shuffle: toggleShuffle, share: shareTrack, sky: toggleSky,
    currentIndex: currentIndex, isOpen: function () { return musicOn; },
    isShuffling: function () { return shuffleOn; },
    lastStop: function () { return lastStop; },
    actions: ACTIONS
  };
})();
