/* ==========================================================================
   SPINE UI V2 — the living-spine navigator, behaviour layer
   Partner file: css/spine-ui.css (presentation). Extracted from spine-lab.html
   Aug 10 2026.

   WHAT THIS FILE OWNS
     - NODES[]: THE six-node table. This is the single source of truth for it.
       hero-scrub-lab.html currently carries a hand-copied duplicate; killing
       that duplication is the whole reason this file exists. Read the table
       from window.__spineLab.nodes rather than re-typing it.
     - Node + decorative-point construction, and the ping-delay derivation that
       keeps every flash synced to the rising comet.
     - Roving tabindex and keyboard navigation on the toolbar.
     - Card open / close, placement, and the rigid connector draw.

   WHAT DELIBERATELY STAYED IN spine-lab.html
     The ?tune panel (FIELDS / TIPS / GROUPS, the spine-lab-tune-v1 store, and
     its buttons). It is a lab instrument, not part of the navigator. It talks
     to this file only through the window.__spineLab hooks defined below, which
     is the entire contract between them.

   Expects the markup spine-lab.html has: #spine-nav-stage, #spine-nav,
   #spine-card, .spine-connectors, #spine-hint. It no-ops on a page without
   them, so it is safe to load anywhere.
   ========================================================================== */

/* ==========================================================================
   SPINE UI V2 — prototype controller (vanilla, no deps)

   State mirrors the master prompt's SpineUIState, adapted to plain JS:
     { activeNode, hoveredNode, previousNode, mode, transitioning }
   modes: 'navigation' (idle) | 'card' (informational open)
   Immersive nodes (Music, Archive) show a "wired in a later stage" stub —
   this prototype deliberately does NOT touch those systems.
   ========================================================================== */
(function () {
  'use strict';

  // ---- node model. Order + terminology per master prompt §9, using the
  //      site's real destinations for immersive nodes. y is % of stage height.
  var NODES = [
    { id: 'music', idx: '01', title: 'Music', kind: 'immersive', side: 'right', y: 14,
      eyebrow: 'Immersive Node',
      body: '<p>The track experience is the site’s dominant instrument — an arch-depth carousel over a kick- and snare-reactive sky.</p><p>In the full build, this node expands to fill the viewport and the spine collapses to a thin line beside it. It is wrapped, never rebuilt, in a later approved stage.</p>',
      cta: 'Later stage', href: '#' },

    { id: 'story', idx: '02', title: 'Our Story', kind: 'card', side: 'left', y: 29,
      eyebrow: 'Transmission',
      body: '<p>Two Messengers. One Signal. Kundalini Spines began as coded transmissions passed between the streets and the stars — mysticism, sacred geometry, and lived experience folded into sound.</p><p>The Messengers don’t claim mastery over the Signal. They receive it, interpret it, and carry it forward.</p>',
      cta: 'Read the story', href: 'about.html' },

    { id: 'members', idx: '03', title: 'The Messengers', kind: 'card', side: 'right', y: 44,
      eyebrow: 'Two Voices',
      body: '<p>A two-member project moving between underground hip-hop, symbolism, ancient knowledge, and speculative thought.</p><p>Neither stands above the work. Each is an antenna for the same current — one signal, split into two hands.</p>',
      cta: 'Meet the Messengers', href: 'about.html' },

    { id: 'ethos', idx: '04', title: 'Our Ethos', kind: 'card', side: 'left', y: 59,
      eyebrow: 'The Method',
      body: '<p>Knowledge hidden in plain sight. Nothing here is decoration — every mark, interval, and image is placed to be decoded.</p><p>Restraint over noise. Structure over spectacle. The architecture of the spine, made audible.</p>',
      cta: 'Learn the method', href: 'about.html' },

    { id: 'archive', idx: '05', title: 'Archive', kind: 'immersive', side: 'right', y: 74,
      eyebrow: 'Immersive Node',
      body: '<p>Recovered artwork, transmissions, and released signals — filed and filterable, fed from the offline YouTube sync.</p><p>In the full build this expands into a large panel while keeping the spine in view. Data plumbing is preserved; only the presentation grows.</p>',
      cta: 'Later stage', href: 'archive.html' },

    { id: 'timeline', idx: '06', title: 'Timeline', kind: 'card', side: 'left', y: 88,
      eyebrow: 'Milestones',
      body: '<p>The Signal has a chronology — first transmissions, first tracks, the releases still to surface.</p><p>Milestones thread down the spine, each vertebra a moment the current passed through.</p>',
      cta: 'Trace the timeline', href: '#' }
  ];

  // ---- refs
  var stage   = document.getElementById('spine-nav-stage');
  var navbar  = document.getElementById('spine-nav');
  var card    = document.getElementById('spine-card');
  // A page that does not carry the navigator markup gets nothing rather than a
  // thrown reference. Added at extraction time so this file can be loaded by a
  // page that only wants to READ window.__spineLab.nodes.
  if (!stage || !navbar || !card) {
    window.__spineLab = window.__spineLab || { nodes: NODES,
      resyncEnergy: function () {}, restartMotion: function () {} };
    return;
  }
  var svg     = stage.querySelector('.spine-connectors');
  var connEl  = svg.querySelector('.conn-active');
  var headEl  = svg.querySelector('.conn-head');
  var hint    = document.getElementById('spine-hint');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- state
  var S = { activeNode: null, hoveredNode: null, previousNode: null,
            mode: 'navigation', transitioning: false };
  var nodeEls = {};   // id -> button
  var previewTimer = null;

  // the idle energy RISES bottom(92%)->top(8%) over --spine-ui-energy-ms, linearly.
  // For that upward pass a node/point at y% is lit when the ping animation's flash
  // (at cycle 0) lands, which needs delay -(y-8)/84 * period. CSS-only, no loop.
  var energyMs = parseFloat(getVar('--spine-ui-energy-ms')) || 7000;
  function energyDelay(y) {
    var f = Math.max(0, Math.min(1, (y - 8) / 84));
    return (-f * energyMs).toFixed(0) + 'ms';
  }

  // ---- build nodes
  NODES.forEach(function (n, i) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'spine-node';
    btn.style.setProperty('--y', n.y + '%');
    btn.dataset.id = n.id;
    btn.dataset.side = n.side;
    btn.dataset.kind = n.kind;
    btn.setAttribute('aria-label', n.title + (n.kind === 'immersive' ? ' (immersive node)' : ''));
    btn.setAttribute('aria-expanded', 'false');
    btn.tabIndex = i === 0 ? 0 : -1;   // roving tabindex
    btn.innerHTML =
      '<span class="spine-node__reticle" aria-hidden="true">' +
        '<i class="rx"></i><i class="sq sq--l"></i><i class="sq sq--r"></i>' +
      '</span>' +
      '<span class="spine-node__ring"></span>' +
      '<span class="spine-node__ring spine-node__ring--2"></span>' +
      '<span class="spine-node__ping"></span>' +
      '<span class="spine-node__dot"></span>' +
      '<span class="spine-node__label"><span class="idx">' + n.idx + '</span>' + n.title.toUpperCase() +
        '<span class="kind">' + (n.kind === 'immersive' ? 'Immersive · later' : 'Card') + '</span></span>';
    navbar.appendChild(btn);
    nodeEls[n.id] = btn;
    btn.querySelector('.spine-node__ping').style.animationDelay = energyDelay(n.y);

    btn.addEventListener('click', function () { activate(n.id); });
    btn.addEventListener('mouseenter', function () { preFocus(n.id); });
    btn.addEventListener('mouseleave', function () { clearPreFocus(n.id); });
    btn.addEventListener('focus', function () { preFocus(n.id); });
    btn.addEventListener('blur', function () { clearPreFocus(n.id); });
  });

  // ---- decorative energy-points: faint light nodes spaced along the cord
  //      between the real destinations (non-interactive ambience, per the
  //      reference images' string of dots).
  (function buildPoints() {
    var realY = NODES.map(function (n) { return n.y; });
    for (var y = 8; y <= 92; y += 3.4) {
      var nearReal = realY.some(function (ry) { return Math.abs(ry - y) < 3.2; });
      if (nearReal) continue;
      var p = document.createElement('span');
      p.className = 'spine-point';
      p.style.setProperty('--y', y.toFixed(2) + '%');
      p.style.animationDelay = energyDelay(y);   // flash as the light passes
      navbar.appendChild(p);
    }
  })();

  // ---- hooks for the ?tune panel below.
  //      resyncEnergy() MUST run whenever --spine-ui-energy-ms changes: every
  //      ping delay is derived from the period, so changing the period alone
  //      silently slides every node flash off the comet head. restartMotion()
  //      drops all running animations back to t=0 so the sync can actually be
  //      judged from a known phase instead of whatever moment you looked.
  window.__spineLab = {
    // The six-node table, exposed so a consuming page reads it from here instead
    // of hand-copying it. hero-scrub-lab.html still carries its own duplicate;
    // this is the hook that lets a later pass delete that copy. Read-only by
    // convention — the navigator does not watch it for changes.
    nodes: NODES,
    resyncEnergy: function () {
      energyMs = parseFloat(getVar('--spine-ui-energy-ms')) || 7000;
      NODES.forEach(function (n) {
        nodeEls[n.id].querySelector('.spine-node__ping').style.animationDelay = energyDelay(n.y);
      });
      Array.prototype.forEach.call(navbar.querySelectorAll('.spine-point'), function (p) {
        p.style.animationDelay = energyDelay(parseFloat(p.style.getPropertyValue('--y')));
      });
    },
    restartMotion: function () {
      if (!document.getAnimations) return;
      document.getAnimations().forEach(function (a) {
        try { a.currentTime = 0; } catch (err) {}
      });
    }
  };

  // ---- roving keyboard nav on the toolbar
  navbar.addEventListener('keydown', function (e) {
    var order = NODES.map(function (n) { return n.id; });
    var curId = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.id : null;
    var i = order.indexOf(curId);
    if (i === -1) return;
    var next = null;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = order[(i + 1) % order.length];
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = order[(i - 1 + order.length) % order.length];
    else if (e.key === 'Home') next = order[0];
    else if (e.key === 'End') next = order[order.length - 1];
    if (next) {
      e.preventDefault();
      order.forEach(function (id) { nodeEls[id].tabIndex = -1; });
      nodeEls[next].tabIndex = 0;
      nodeEls[next].focus();
    }
  });

  // ---- pre-focus (hover): brighten + partial connector preview (~25%)
  function preFocus(id) {
    if (S.mode === 'card' && S.activeNode === id) return;
    S.hoveredNode = id;
    nodeEls[id].classList.add('is-prefocus');
    dismissHint();
    if (S.mode !== 'card' && !reduceMotion) drawConnector(id, 0.25, true);
  }
  function clearPreFocus(id) {
    nodeEls[id].classList.remove('is-prefocus');
    if (S.hoveredNode === id) S.hoveredNode = null;
    if (S.mode !== 'card') hideConnector();
  }

  // ---- activation
  function activate(id) {
    var n = nodeById(id);
    dismissHint();

    // toggle off if re-clicking the active node
    if (S.mode === 'card' && S.activeNode === id) { deactivate(); return; }

    S.previousNode = S.activeNode;
    S.activeNode = id;
    S.mode = 'card';
    S.transitioning = true;
    stage.classList.add('is-card');

    Object.keys(nodeEls).forEach(function (k) { nodeEls[k].classList.remove('is-active'); });
    nodeEls[id].classList.add('is-active');
    nodeEls[id].setAttribute('aria-expanded', 'true');

    populateCard(n);
    positionCard(n);

    // draw the rigid connector, THEN let the card emerge at its end
    card.hidden = false;
    // force layout so the card has measurable geometry for the connector
    void card.offsetWidth;
    drawConnector(id, 1, false);
    var drawMs = reduceMotion ? 1 : (parseFloat(getVar('--connector-draw-ms')) || 520);
    card.style.transitionDelay = (drawMs * 0.7) + 'ms, ' + (drawMs * 0.7) + 'ms, 0s';
    requestAnimationFrame(function () { card.classList.add('is-open'); });
    window.setTimeout(function () { S.transitioning = false; }, drawMs + 300);
  }

  function deactivate() {
    if (S.mode !== 'card') return;
    var id = S.activeNode;
    S.previousNode = id;
    S.transitioning = true;
    card.classList.remove('is-open');
    hideConnector();
    if (id && nodeEls[id]) {
      nodeEls[id].classList.remove('is-active');
      nodeEls[id].setAttribute('aria-expanded', 'false');
      nodeEls[id].focus();
    }
    stage.classList.remove('is-card');
    S.activeNode = null;
    S.mode = 'navigation';
    window.setTimeout(function () {
      if (S.mode === 'navigation') { card.hidden = true; }
      S.transitioning = false;
    }, (parseFloat(getVar('--card-enter-ms')) || 440) + 40);
  }

  // ---- card content + placement
  function populateCard(n) {
    card.querySelector('.spine-card__idx').textContent = n.idx + ' / 06';
    card.querySelector('.spine-card__eyebrow').textContent = n.eyebrow;
    card.querySelector('.spine-card__title').textContent = n.title;
    card.querySelector('.spine-card__body').innerHTML = n.body;
    var cta = card.querySelector('.spine-card__cta');
    cta.querySelector('.cta-text').textContent = n.cta;
    cta.setAttribute('href', n.href);
    card.classList.toggle('is-immersive', n.kind === 'immersive');
    card.classList.toggle('side-left', n.side === 'left');
    card.classList.toggle('side-right', n.side === 'right');
    card.querySelector('.spine-card__flag').textContent = n.kind === 'immersive' ? 'Later' : 'Active';
  }

  function positionCard(n) {
    // place the card on the node's side, vertically centered on the node,
    // clamped inside the viewport.
    card.style.top = ''; card.style.left = ''; card.style.right = '';
    if (window.innerWidth <= 760) return; // CSS handles the phone layout
    var stageRect = stage.getBoundingClientRect();
    var nodeRect = nodeEls[n.id].getBoundingClientRect();
    var nodeCy = nodeRect.top + nodeRect.height / 2 - stageRect.top;
    var cardW = card.offsetWidth || 360;
    var gap = 190; // room for the rigid branch — keeps text clear of the spine glow
    var cardH = card.offsetHeight || 300;
    var top = Math.max(90, Math.min(nodeCy - cardH / 2, stageRect.height - cardH - 24));
    card.style.top = top + 'px';

    // Horizontal placement is measured off the NODE, not off 50% — the ?tune
    // panel slides the whole axis (--axis-shift) while the stage's 50% stays
    // put, so anchoring to 50% would leave the card behind. Then clamp into the
    // usable width: while the panel is open it owns a lane on the right, and at
    // 1280px a right-side card otherwise runs underneath it. MIN_GAP stops the
    // clamp from ever pushing a card back into the spine glow it has to clear.
    var MIN_GAP = 70, EDGE = 24;
    var panelEl = document.querySelector('.tune:not(.is-collapsed)');
    var panelW = panelEl ? panelEl.offsetWidth : 0;
    var axisX = nodeRect.left + nodeRect.width / 2 - stageRect.left;
    var left;
    if (n.side === 'left') {
      left = Math.min(Math.max(EDGE, axisX - gap - cardW), axisX - MIN_GAP - cardW);
    } else {
      left = Math.max(axisX + MIN_GAP,
                      Math.min(axisX + gap, stageRect.width - panelW - EDGE - cardW));
    }
    card.style.left = left + 'px';
  }

  // ---- rigid connector: node on the axis -> horizontal -> 90deg -> into card.
  //      progress 1 = full; <1 = preview stub. Uses stroke-dashoffset draw.
  function drawConnector(id, progress, isPreview) {
    if (window.innerWidth <= 760) return;
    var stageRect = stage.getBoundingClientRect();
    var nodeRect = nodeEls[id].getBoundingClientRect();
    var nx = nodeRect.left + nodeRect.width / 2 - stageRect.left;
    var ny = nodeRect.top + nodeRect.height / 2 - stageRect.top;
    var n = nodeById(id);
    var dir = n.side === 'left' ? -1 : 1;

    var d;
    if (progress < 1) {
      // preview: a short horizontal stub off the node
      var stub = 70 * progress * 4; // ~70px at 0.25
      d = 'M ' + nx + ' ' + ny + ' H ' + (nx + dir * stub);
    } else {
      // full rigid path to the card's near edge, then a step to its mid-height
      var cardRect = card.getBoundingClientRect();
      var targetX = (dir === -1 ? cardRect.right : cardRect.left) - stageRect.left;
      var targetY = cardRect.top + cardRect.height / 2 - stageRect.top;
      var elbowX = nx + dir * 46;           // first rigid run off the spine
      d = 'M ' + nx + ' ' + ny +
          ' H ' + elbowX +
          ' V ' + targetY +
          ' H ' + targetX;
    }
    connEl.setAttribute('d', d);
    connEl.classList.toggle('is-preview', !!isPreview);

    var len = connEl.getTotalLength();
    connEl.style.transition = 'none';
    connEl.style.strokeDasharray = len;
    connEl.style.strokeDashoffset = len;
    connEl.style.opacity = '1';
    // next frame: animate the fill (base line reveals from the spine outward)
    void connEl.getBoundingClientRect();
    var ms = isPreview ? 240 : (reduceMotion ? 1 : (parseFloat(getVar('--connector-draw-ms')) || 520));
    var ease = getVar('--connector-ease') || 'ease';
    requestAnimationFrame(function () {
      connEl.style.transition = 'stroke-dashoffset ' + ms + 'ms ' + ease;
      connEl.style.strokeDashoffset = '0';
    });

    // energy head — a short bright segment that runs the line to the card, in
    // sync with the fill. Only on full activation, never on the hover preview.
    if (!isPreview && progress >= 1 && !reduceMotion) {
      var head = 16;
      headEl.setAttribute('d', d);
      headEl.style.transition = 'none';
      headEl.style.strokeDasharray = head + ' ' + (len + head);
      headEl.style.strokeDashoffset = '0';   // dash sits at the spine end
      headEl.style.opacity = '1';
      void headEl.getBoundingClientRect();
      requestAnimationFrame(function () {
        headEl.style.transition = 'stroke-dashoffset ' + ms + 'ms ' + ease;
        headEl.style.strokeDashoffset = (-len).toFixed(1);  // travels to the card
      });
      window.setTimeout(function () {   // arrive, then fade the head, leaving the lit line
        headEl.style.transition = 'opacity 260ms ease';
        headEl.style.opacity = '0';
        connEl.style.stroke = 'var(--connector-active)';
      }, ms + 20);
    } else {
      headEl.style.opacity = '0';
    }
  }
  function hideConnector() {
    connEl.style.transition = 'opacity 200ms ease';
    connEl.style.opacity = '0';
    connEl.style.stroke = '';   // back to the default (dimmer) line for next time
    headEl.style.transition = 'opacity 160ms ease';
    headEl.style.opacity = '0';
  }

  // ---- card close affordances
  card.querySelector('.spine-card__close').addEventListener('click', deactivate);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && S.mode === 'card') deactivate();
  });
  // clicking empty stage closes
  stage.addEventListener('click', function (e) {
    if (S.mode === 'card' && !e.target.closest('.spine-card') && !e.target.closest('.spine-node')) deactivate();
  });

  // ---- keep geometry correct on resize
  var resizeTimer = null;
  window.addEventListener('resize', function () {
    if (S.mode !== 'card' || !S.activeNode) return;
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(function () {
      positionCard(nodeById(S.activeNode));
      drawConnector(S.activeNode, 1, false);
    }, 120);
  });

  // ---- helpers
  function nodeById(id) { for (var i = 0; i < NODES.length; i++) if (NODES[i].id === id) return NODES[i]; return null; }
  function getVar(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
  function dismissHint() { if (hint) hint.classList.add('is-hidden'); }
})();
