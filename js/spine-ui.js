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
    { id: 'music', title: 'Music', kind: 'immersive',
      eyebrow: 'Immersive Node',
      body: '<p>The track experience is the site’s dominant instrument — an arch-depth carousel over a kick- and snare-reactive sky.</p><p>In the full build, this node expands to fill the viewport and the spine collapses to a thin line beside it. It is wrapped, never rebuilt, in a later approved stage.</p>',
      cta: 'Later stage', href: '#' },

    /* STORY, MESSENGERS AND ETHOS WERE THREE NODES UNTIL Aug 11 2026, and they
       are one now — the owner's call. All three already pointed at the SAME
       href (about.html), which is what gave the game away: three vertebrae, one
       destination. A navigator whose nodes are not distinct places is a menu
       wearing a diagram's clothes.

       The three former bodies survive as the three paragraphs below, in their
       original order, so nothing written for them was lost. Their three
       eyebrows (Transmission / Two Voices / The Method) could not all survive;
       'Transmission' won because it is the one that names the SITE's own
       vocabulary rather than describing the section.

       This frees two vertebrae. The remaining four re-space across the same
       travel — the first and last y are unchanged at 14 and 88, so the rail's
       reach is identical and only the interior spacing opened up. */
    { id: 'story', title: 'Our Story', kind: 'card',
      eyebrow: 'Transmission',
      body: '<p>Two Messengers. One Signal. Kundalini Spines began as coded transmissions passed between the streets and the stars — mysticism, sacred geometry, and lived experience folded into sound.</p><p>A two-member project moving between underground hip-hop, symbolism, ancient knowledge, and speculative thought. Neither stands above the work. Each is an antenna for the same current — one signal, split into two hands.</p><p>Knowledge hidden in plain sight. Nothing here is decoration — every mark, interval, and image is placed to be decoded. Restraint over noise. Structure over spectacle. The architecture of the spine, made audible.</p>',
      cta: 'Read the full story', href: 'about.html' },

    /* MERCHANDISE TOOK ONE OF THE TWO VERTEBRAE THE MERGE FREED, Aug 11 2026.
       This is the first node added since the model was written, and it is the
       reason the merge was worth doing: the navigator had six nodes and only
       four destinations, and now it has five nodes and five.

       kind: 'card', NOT 'immersive'. Immersive nodes (Music, Archive) take over
       the viewport and collapse the spine beside them, which is a promise about
       how much is behind the click. There is still no STORE — but the reason
       given here has changed (Aug 20 2026). It used to be that links.download
       was null on all 28 tracks and the "$1" in track-experience.js was
       hardcoded, with V2HANDOFF 26 listing "how anything is bought" as an open
       decision. The owner has since made that decision: purchase.html carries
       three album editions, and the track panel's button now points at it.

       This node STAYS 'card' anyway, and that is deliberate rather than
       leftover. purchase.html is a rough-in with nothing wired to a payment
       provider, and merch.html is still objects-with-no-prices; an immersive
       node promises a storefront to expand into, and there is not one yet.
       Promote it when the editions can actually take money. */
    { id: 'merch', title: 'Merchandise', kind: 'card',
      eyebrow: 'The Objects',
      body: '<p>A lyric can become an artifact. An album image can become a symbol. A symbol can become an object you carry.</p><p>Garments, prints and pressings built to the same standard as everything else here — black, restrained, and marked only where a mark carries weight. Nothing decorative, nothing that would not survive the archive.</p>',
      cta: 'Coming soon', href: 'merch.html' },

    { id: 'archive', title: 'Archive', kind: 'immersive',
      eyebrow: 'Immersive Node',
      body: '<p>Recovered artwork, transmissions, and released signals — filed and filterable, fed from the offline YouTube sync.</p><p>In the full build this expands into a large panel while keeping the spine in view. Data plumbing is preserved; only the presentation grows.</p>',
      cta: 'Later stage', href: 'archive.html' },

    /* SIDES ALTERNATE STRICTLY: right, left, right, left, right. Going from six
       nodes to five flipped the parity, so Archive and Timeline swapped sides —
       that is the alternation being preserved, not a stray edit. `side` also
       drives which edge of the reading card catches the light (--lit-x in
       css/spine-ui.css), so a node on the wrong side is lit from the wrong
       direction and looks subtly broken rather than obviously wrong. */
    /* TIMELINE BECAME STAY CONNECTED — owner call, Aug 12 2026. Timeline had
       no destination (href '#'); the signal page (connect.html, the Buttondown
       block) is real. The id changed with the title: an id that says one thing
       over a node that says another is the literal-vs-position bug in another
       costume. Renaming a node id is safe TODAY because music-wrap.js anchors
       its rail positionally and (fixed the same day) derives its toggle ids
       from ACTIONS rather than naming ours — grep the repo for the old id
       anyway before the next rename; that is how the last two leftovers were
       found. */
    { id: 'connect', title: 'Stay Connected', kind: 'card',
      eyebrow: 'The Signal',
      body: '<p>The transmission continues between releases — new music, transmissions, visual releases, and limited announcements, directly from the Messengers.</p><p>No constant noise. Only meaningful signals.</p>',
      cta: 'Join the Signal', href: 'connect.html' }
  ];

  /* ------------------------------------------------------------------------
     GEOMETRY IS DERIVED, NOT WRITTEN — added Aug 11 2026, immediately after
     the node count changed twice in one session (six to four on the
     story/messengers/ethos merge, then to five when Merchandise took one of
     the freed vertebrae). The owner has said they may want a sixth back.

     Until now `idx`, `side` and `y` were hand-written on every entry. Changing
     the count meant renumbering every idx, re-alternating every side, and
     re-spacing every y — fifteen hand edits for one conceptual change, each
     one silent if wrong. An off-by-one idx just prints the wrong number; a
     side that breaks the alternation lights the reading card's bevel from the
     wrong edge (see --lit-x in css/spine-ui.css), which V2HANDOFF 26 records
     as invisible to every computed-style check that was pointed at it.

     ALL THREE ARE FUNCTIONS OF ARRAY POSITION, so they are computed here:

       idx   1-based, zero-padded.
       side  even index right, odd left. Index 0 is Music, on the right, which
             is where it has always been.
       y     evenly spaced between RAIL_TOP and RAIL_BOTTOM inclusive.

     These reproduce the values that were previously typed by hand. The
     original six were 14/29/44/59/74/88 and this yields 14/28.8/…/88 — the
     hand-written set was these numbers rounded, so the rule was always the
     rule and only the rounding was manual.

     TO ADD A SIXTH NODE: add one object to the array above, in the position
     you want it on the spine. Nothing else. Do not reintroduce idx/side/y as
     literals — a literal that disagrees with its position is exactly the bug
     this removes. If a node ever needs to break the alternation deliberately,
     add an explicit `sideOverride` and honour it below rather than going back
     to hand-written sides for all of them. */
  var RAIL_TOP = 14, RAIL_BOTTOM = 88;
  NODES.forEach(function (n, i) {
    n.idx  = (i + 1 < 10 ? '0' : '') + (i + 1);
    n.side = (i % 2 === 0) ? 'right' : 'left';
    n.y    = NODES.length < 2
           ? RAIL_TOP
           : RAIL_TOP + (RAIL_BOTTOM - RAIL_TOP) * i / (NODES.length - 1);
  });

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
  // the rising comet. Optional on purpose: spine-field-lab and music-lab carry
  // the navigator markup but not always the .spine block, and a missing comet
  // must not take the whole navigator down.
  var energyEl = stage.querySelector('.spine__energy');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- state
  var S = { activeNode: null, hoveredNode: null, previousNode: null,
            mode: 'navigation', transitioning: false };
  var nodeEls = {};   // id -> button
  var previewTimer = null;
  var drawSeq = 0;    // generation counter shared by the connector's four states

  // the idle energy RISES bottom(92%)->top(8%) over --spine-ui-energy-ms, linearly.
  // For that upward pass a node/point at y% is lit when the ping animation's flash
  // (at cycle 0) lands, which needs delay -(y-8)/84 * period. CSS-only, no loop.
  var energyMs = parseFloat(getVar('--spine-ui-energy-ms')) || 7000;

  /* THE PASS DEPARTS FROM THE OPEN NODE — Aug 12 2026. On activation the rising
     light restarts at that node's own height and carries on up the column, so
     the energy reads as leaving the thing you just activated rather than as a
     loop that happens to be running.

     phaseMs is a NEGATIVE animation-delay, which ENTERS the pass part-way
     through instead of restarting and clipping it — the travel speed never
     changes. It is a whole-system offset: EVERY layer riding the pass takes the
     SAME phaseMs on top of its own per-element delay, or the comet moves and
     the flashes stay where they were.

     The comet is the reference, so its own offset is zero and its delay is
     phaseMs alone. For a node/point at y the two compose as
     -(y-8)/84*period + phaseMs, which is what energyDelay returns.

     Derivation, so the next session does not have to redo it: the comet is at
     92 - 84*(phase/period). To have it sitting at y at the moment of
     activation, phase must be (92-y)/84*period, so the delay is minus that.

     STORED AS THE NODE'S y, NOT AS MILLISECONDS. A millisecond offset is only
     true for the period it was computed against, so dragging
     --spine-ui-energy-ms in ?tune with a card open would slide the whole pass
     off the node it is supposed to be leaving — the same class of bug as the
     ping delays this file already recomputes on resync. Kept as a position, the
     offset re-derives itself for free. */
  var phaseFrom = null;   // y% the pass departs from; null = free-running

  function phaseDelayMs() {
    return phaseFrom === null ? 0 : -((92 - phaseFrom) / 84) * energyMs;
  }

  function energyDelay(y) {
    var f = Math.max(0, Math.min(1, (y - 8) / 84));
    return (-f * energyMs + phaseDelayMs()).toFixed(0) + 'ms';
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
      /* NO NUMBERING ON THE NODES. The labels carried 01-06 and the owner
         removed them Aug 11 2026, extending to the navigator the same call
         already made for the Music rail. `idx` stays on NODES because the
         reading card still reads it (populateCard: "02 / 04") — it just no
         longer reaches the node label. The TOTAL in that pair is derived from
         NODES.length now; only the per-node `idx` is still written by hand, so
         adding or removing a node means renumbering this array and nothing
         else. */
      '<span class="spine-node__label">' + n.title.toUpperCase() +
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

  // ---- the card's glass layer + the lens filter it references
  //
  // INJECTED RATHER THAN WRITTEN INTO EACH PAGE'S MARKUP. Five files carry the
  // .spine-card block -- entrance-lab, music-lab, spine-lab, music-collapse-lab
  // and hero-scrub-lab -- and hand-adding a span to all five is five chances to
  // miss one. This module already owns the card's contents (populateCard writes
  // every field in it), so it owns this too.
  //
  // WHY A REAL ELEMENT AND NOT A PSEUDO: .spine-card::before and ::after are
  // both already spoken for by the stacked ghost frames (see the CSS), which
  // build the "emergence from the spine" depth. Taking one would delete that.
  //
  // Prepended, so it sits UNDER the card's own content -- the CSS lifts the
  // real children to z-index 1 above it.
  (function buildGlass() {
    if (!card || card.querySelector('.spine-card__glass')) return;
    var g = document.createElement('span');
    g.className = 'spine-card__glass';
    g.setAttribute('aria-hidden', 'true');
    card.insertBefore(g, card.firstChild);

    // The displacement the glass references where the browser can run it.
    // Low frequency and two octaves: high-frequency noise reads as frosted
    // static rather than as a lens, and the point is that the star field
    // behind the card visibly bends. Chrome-only in practice -- Safari and
    // Firefox drop url() in backdrop-filter and fall back to the painted
    // bevel, which is the whole reason the bevel is painted and not assumed.
    if (document.getElementById('spine-lens-filter')) return;
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('id', 'spine-lens-filter');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    svg.innerHTML =
      '<defs><filter id="spine-lens" x="-15%" y="-15%" width="130%" height="130%"' +
      ' color-interpolation-filters="sRGB">' +
      '<feTurbulence type="fractalNoise" baseFrequency="0.006 0.011"' +
      ' numOctaves="2" seed="7" result="noise"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="noise" scale="26"' +
      ' xChannelSelector="R" yChannelSelector="G"/>' +
      '</filter></defs>';
    document.body.appendChild(svg);
  })();

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

  /* ---- the reroute pulse: a discrete lamp that carries the focus along the
     column between two cards. Injected for the same reason the glass span is —
     five pages carry this markup and hand-adding a span to all five is five
     chances to miss one. See .spine__pulse in css/spine-ui.css and the reroute
     sequence in activate(). */
  var pulseEl = document.createElement('span');
  pulseEl.className = 'spine__pulse';
  pulseEl.setAttribute('aria-hidden', 'true');
  navbar.appendChild(pulseEl);

  function pulseAt(y) {
    // JUMP to the start, then travel. Without killing the transition first the
    // lamp slides in from wherever it was left, which on the second reroute is
    // the previous node and reads as one continuous crawl.
    pulseEl.style.transition = 'none';
    pulseEl.style.setProperty('--y', y + '%');
    void pulseEl.offsetWidth;
    pulseEl.style.transition = '';
    pulseEl.classList.add('is-on');
  }
  function pulseTo(y) { pulseEl.style.setProperty('--y', y + '%'); }
  function pulseOff() { pulseEl.classList.remove('is-on'); }

  /* ------------------------------------------------------------------------
     THE THREE LAYERS THAT RIDE THE RISING PASS, and the two operations that
     have to treat them as one set. Added Aug 12 2026 with the phase offset.

     WHY THE DELAY IS WRITTEN INLINE AND NOT AS A CSS VARIABLE. The design
     handoff proposed `animation-delay: var(--ks-phase-delay, 0ms)` in
     css/spine-ui.css. On .spine__energy that would work; on the other two it is
     dead, because the lines above have always set style.animationDelay INLINE
     on every ping and every point (that is the per-element sync to the comet
     head) and inline beats a stylesheet rule. The result would have been a
     comet that jumps to the node while every flash stays on the old schedule —
     visible only as "the flashes are wrong now", with nothing erroring. The
     phase is therefore folded into the same inline value, by energyDelay.
     ------------------------------------------------------------------------ */
  function energyLayers() {
    var els = [].slice.call(navbar.querySelectorAll('.spine-node__ping, .spine-point'));
    if (energyEl) els.unshift(energyEl);
    return els;
  }

  function applyEnergyDelays() {
    // the comet IS the reference, so it carries the phase and nothing else.
    if (energyEl) energyEl.style.animationDelay = phaseDelayMs().toFixed(0) + 'ms';
    NODES.forEach(function (n) {
      nodeEls[n.id].querySelector('.spine-node__ping').style.animationDelay = energyDelay(n.y);
    });
    Array.prototype.forEach.call(navbar.querySelectorAll('.spine-point'), function (p) {
      p.style.animationDelay = energyDelay(parseFloat(p.style.getPropertyValue('--y')));
    });
  }

  /* THE RESTART IS NOT OPTIONAL, AND NOT FOR THE REASON YOU WOULD GUESS.
     Changing animation-delay on a running animation does re-resolve its phase,
     so the delay alone would look like it worked. The problem is the other half
     of the change: .spine-stage.is-card drops animation-iteration-count from
     infinite to 1, and per spec an animation already on iteration 3 when the
     count becomes 1 is PAST its active duration — it jumps straight to its fill
     state. The comet would vanish at the instant of the click instead of
     finishing its climb. Restarting is what gives it a fresh single run.

     animationName, NOT the `animation` shorthand. The shorthand's `none` writes
     every longhand inline, including animation-delay: 0s, which would wipe the
     per-element sync applyEnergyDelays just wrote and never restore it. (The
     handoff's snippet used the shorthand.) Touching only the name leaves the
     inline delays alone.

     One reflow for the whole set — a forced layout flushes style for the
     document, so it does not need to be per element. */
  function restartEnergyLayers() {
    var els = energyLayers();
    els.forEach(function (el) { el.style.animationName = 'none'; });
    void stage.offsetWidth;   // reflow — do not remove, this IS the restart
    els.forEach(function (el) { el.style.animationName = ''; });
  }

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
      // covers the comet as well as the pings and points now — and the phase
      // re-derives itself, because it is stored as a position not a duration.
      applyEnergyDelays();
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

  // ---- pre-focus (hover): brighten + the dotted route the card WILL take
  function preFocus(id) {
    if (S.mode === 'card' && S.activeNode === id) return;
    S.hoveredNode = id;
    nodeEls[id].classList.add('is-prefocus');
    dismissHint();
    if (S.mode !== 'card' && !reduceMotion) showPreview(id);
  }
  function clearPreFocus(id) {
    nodeEls[id].classList.remove('is-prefocus');
    if (S.hoveredNode === id) S.hoveredNode = null;
    if (S.mode !== 'card') hideConnector();
  }

  /* ========================================================================
     THE REROUTE — Aug 12 2026, built from NavigatorReference.jsx.

     Choosing a SECOND node does not cut from one card to the next. Four phases,
     and the point of all of them is that the system never disconnects from its
     own axis:

       1. RETRACT  the established line pulls its fill back INTO the spine,
                   still lit. It does not vanish; it goes home.        [draw]
       2. TRAVEL   card and connector released, the whole ambient pass goes
                   dark, and a single lamp carries the focus along the column
                   from the old node to the new one.            [draw * 0.75]
       3. FIRE     the new line draws out to where the card will be.  [draw]
       4. LAND     the line establishes, the lamp goes out, the node lights,
                   the card opens and the rising pass restarts from it.

     Total ~2.75 * --connector-draw-ms. A FIRST activation has nothing to
     retract and nothing to travel from, so it enters at phase 3.

     Under reduced motion the whole sequence is skipped — --connector-draw-ms
     is already clamped to 1ms there, so a "sequence" would be four steps inside
     three milliseconds. It goes straight to fire.
     ======================================================================== */
  var rerouteTimers = [];
  function clearReroute() {
    rerouteTimers.forEach(window.clearTimeout);
    rerouteTimers = [];
  }
  function later(fn, ms) { rerouteTimers.push(window.setTimeout(fn, ms)); }

  function activate(id) {
    var n = nodeById(id);
    dismissHint();

    // toggle off if re-clicking the active node
    if (S.mode === 'card' && S.activeNode === id) { deactivate(); return; }

    // A click mid-reroute restarts the sequence rather than queueing behind it.
    clearReroute();

    var drawMs = reduceMotion ? 1 : (parseFloat(getVar('--connector-draw-ms')) || 520);
    var from = (S.mode === 'card' && S.activeNode) ? nodeById(S.activeNode) : null;

    S.previousNode = S.activeNode;
    S.mode = 'card';
    S.transitioning = true;

    if (!from || reduceMotion) { fireTo(n, drawMs); return; }

    retractLine(drawMs);                                  // 1
    later(function () {
      releaseCard();                                      // 2
      pulseAt(from.y);
      later(function () { pulseTo(n.y); }, 30);           // one frame of settle,
      later(function () { fireTo(n, drawMs); },           // then the travel
            drawMs * 0.75);
    }, drawMs);
  }

  /* Between the two cards. NOT deactivate(): the mode stays 'card' because we
     are committed to opening one, so a hover cannot start drawing previews
     across the sequence and the stage's click-to-close still behaves. The card
     is left un-hidden — .is-open coming off is what makes it go, and re-hiding
     it here only to unhide it 400ms later flashes the reveal. */
  function releaseCard() {
    card.classList.remove('is-open');
    hideConnector();
    Object.keys(nodeEls).forEach(function (k) {
      nodeEls[k].classList.remove('is-active');
      nodeEls[k].setAttribute('aria-expanded', 'false');
    });
    stage.classList.remove('is-card');
    S.activeNode = null;
  }

  /* Phase 3. The card is populated and POSITIONED here, while it is still
     invisible, so the line has somewhere real to arrive — but the line's route
     does not depend on that having happened. geoFor() is a pure function of the
     node and the stage; see the note on it below. */
  function fireTo(n, drawMs) {
    populateCard(n);
    /* UNHIDE BEFORE POSITIONING — an element with [hidden] measures 0x0. The
       geometry no longer reads the card, so this matters less than it did, but
       the card still has to be laid out before .is-open transitions it. */
    card.hidden = false;
    void card.offsetWidth;
    positionCard(n);
    var seq = drawLine(n.id, drawMs);
    later(function () { land(n, seq); }, drawMs);
  }

  /* Phase 4. Everything that says "this node is the one" happens on this frame,
     together: the line establishes, the lamp goes out, the node lights, the
     others recede, and the pass restarts from here. Splitting them across the
     draw is what made the old version read as a menu — the card was already
     committed before the line had finished saying where it went. */
  function land(n, seq) {
    establishLine(seq);
    pulseOff();

    S.activeNode = n.id;
    stage.classList.add('is-card');

    /* THE PASS BECOMES THIS NODE'S. See the phase note at the top of the file
       for the arithmetic and css/spine-ui.css for the run-once and
       dark-between-cards halves.

       has-chosen goes on at the FIRST landing and is never taken off: the
       free-running rise is what tells a visitor the column is alive before they
       have touched it, and it has no job left once they have.

       Both classes before the restart, so the layers pick up is-card's
       iteration-count in the same frame they are re-created. */
    stage.classList.add('has-chosen');
    phaseFrom = n.y;
    applyEnergyDelays();
    restartEnergyLayers();

    nodeEls[n.id].classList.add('is-active');
    nodeEls[n.id].setAttribute('aria-expanded', 'true');

    /* NO DELAY LIST ANY MORE. The card used to enter at 70% of the draw, which
       was the old sequence's way of saying "after the connector". The connector
       has now already landed when this runs, so a delay would just be dead air.
       Cleared explicitly because a previous activation may have set one. */
    card.style.transitionDelay = '0s';
    requestAnimationFrame(function () { card.classList.add('is-open'); });
    later(function () { S.transitioning = false; },
          (parseFloat(getVar('--card-enter-ms')) || 440) + 40);
  }

  function deactivate() {
    if (S.mode !== 'card') return;
    clearReroute();
    pulseOff();
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
    later(function () {
      if (S.mode === 'navigation') { card.hidden = true; }
      S.transitioning = false;
    }, (parseFloat(getVar('--card-enter-ms')) || 440) + 40);
  }

  // ---- card content + placement
  function populateCard(n) {
    /* DERIVED, not written. This read `n.idx + ' / 06'` with the total spelled
       out as a literal, which was true for exactly as long as there were six
       nodes. Merging story/messengers/ethos into one on Aug 11 2026 took the
       count to four and would have left every card claiming to be one of six —
       a number contradicted by the four vertebrae visible behind it, and
       nothing would have errored. Padded so '4' still reads '04'. */
    var total = NODES.length < 10 ? '0' + NODES.length : String(NODES.length);
    card.querySelector('.spine-card__idx').textContent = n.idx + ' / ' + total;
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

  /* ========================================================================
     ONE GEOMETRY FUNCTION, USED BY THE PREVIEW, THE LINE AND THE CARD ALIKE.
     Aug 12 2026, from NavigatorReference.jsx.

     WHY THIS EXISTS. The preview route and the deployed route used to be
     computed differently — the preview as a 70px stub off the node, the real
     line from the card's MEASURED rect — so the dotted line promised one thing
     and the lit line went somewhere else the moment it established. Whatever
     the preview shows has to still be true when it deploys, which means one
     function and the card positioned FROM it rather than it derived from the
     card.

     IT IS PURE IN THE NODE AND THE STAGE. Nothing here reads the card, and in
     particular THE CARD'S HEIGHT MUST NEVER ENTER IT — a height is only knowable
     after a render, so a route that depends on it cannot be drawn before the
     card exists, which is exactly what phase 3 of the reroute has to do. The
     card takes `want`/`maxH` as its budget and scrolls .spine-card__body, which
     css/spine-ui.css already sets up.

     `top` puts the card's HEAD ROW level with the node (hence the 46px), not
     the card's middle. Centring it was the old behaviour and it is why a node
     at 88% threw a connector leg most of the way down the frame: the line stops
     reading as "this node reaches that card" once the vertical run is longer
     than the horizontal one.

     ---- yEnd: THE LINE ARRIVES AT THE NODE'S OWN HEIGHT, NOT AT THE HEAD ROW.
     Aug 12 2026. NavigatorReference.jsx hardcodes `yEnd = top + 46`, and for
     the nodes at the ends of the rail that is the very problem the paragraph
     above describes — the `top` clamp cannot put a 320px card's head row level
     with a node at 88% of a 900px window, so the head row lands 190px above the
     node and the connector takes a long vertical leg to reach it. Measured legs
     with the reference's rule: 190px at 1440x900, 206 at 1366x768, 212 at
     1280x720, 220 at 1280x650, 168 at 1920x1080, and -35 to -45 at the TOP node
     where the 90px floor pushes the card down instead.

     The clamp on `top` is not the thing to relax — a 320px card genuinely
     cannot sit that low. What can move is the arrival point: the line lands
     level with the node whenever the card extends that far, and falls back to
     the nearest point on the card's near edge when it does not.

     WHY THE BOUNDS ARE SAFE, measured rather than assumed. The window is
     [top + 46, top + want - 46], so the arrival is always at least a head row
     in from either end of the card. That relies on the card really being `want`
     tall, which holds because (a) when the clamp bites, maxH is exactly `want`
     and every card overflows it, and (b) when it does not, the card is its
     natural height — and the natural height of all five cards was measured at
     six viewports from 1280x650 to 1920x1080 and never came in under 361px
     against a `want` of 320. The shortest card in the model (Stay Connected,
     two paragraphs) is the floor of that. ADD A ONE-PARAGRAPH NODE AND RE-CHECK:
     a card naturally shorter than `want` is the one case where the low end of
     this window could fall past the card's own bottom edge.

     Nothing is given up in the unclamped case. Where the clamp does not bite,
     top is exactly y0 - 46, so top + 46 == y0 and the line still lands on the
     head row — this changes only the rows where the reference was already
     drawing a leg.
     ======================================================================== */
  var CARD_INSET = 0.08;  // the card sits this far off the stage's own edge
  var HEAD_ROW   = 46;    // card top -> head row, where the connector lands
  var ELBOW_F    = 0.55;  // the elbow, as a fraction of the run to the card
  var EDGE       = 24;
  var TOP_FLOOR  = 90;

  /* Mirrors --card-w: clamp(280px, 30vw, 400px), plus the max-width beside it.
     Computed rather than measured because the geometry has to be knowable while
     the card is still hidden. If --card-w is ever retuned, retune this with it —
     they are the same number said twice, and only this one can be read early. */
  function cardWidth() {
    return Math.min(Math.min(400, Math.max(280, window.innerWidth * 0.30)),
                    window.innerWidth - 2 * EDGE);
  }

  function geoFor(n) {
    var sr = stage.getBoundingClientRect();
    var w = sr.width, h = sr.height;
    var cardW = cardWidth();

    // the axis is MEASURED, not assumed to be 50%: ?tune slides the whole
    // column with --axis-shift while the stage's centre stays put.
    var nodeRect = nodeEls[n.id].getBoundingClientRect();
    var x0 = nodeRect.left + nodeRect.width / 2 - sr.left;
    var y0 = nodeRect.top + nodeRect.height / 2 - sr.top;

    // while the ?tune panel is open it owns a lane on the right.
    var panelEl = document.querySelector('.tune:not(.is-collapsed)');
    var panelW = panelEl ? panelEl.offsetWidth : 0;

    var left, near;
    if (n.side === 'left') {
      left = Math.max(EDGE, w * CARD_INSET);
      near = left + cardW;                       // the card's RIGHT edge
    } else {
      left = Math.min(w * (1 - CARD_INSET) - cardW, w - panelW - EDGE - cardW);
      near = left;                               // the card's LEFT edge
    }

    var want = Math.min(320, Math.max(180, h - 114));
    var top  = Math.round(Math.min(Math.max(y0 - HEAD_ROW, TOP_FLOOR),
                                   Math.max(TOP_FLOOR, h - EDGE - want)));
    // level with the node where the card reaches it; see the yEnd note above
    var yEnd = Math.min(Math.max(y0, top + HEAD_ROW), top + want - HEAD_ROW);
    return { x0: x0, y0: y0, left: left, near: near, top: top,
             yEnd: yEnd,
             elbow: x0 + (near - x0) * ELBOW_F,
             maxH: Math.max(180, h - top - EDGE) };
  }

  function pathFor(n) {
    var g = geoFor(n);
    return 'M ' + g.x0 + ' ' + g.y0 +
           ' H ' + g.elbow +
           ' V ' + g.yEnd +
           ' H ' + g.near;
  }

  function positionCard(n) {
    card.style.top = ''; card.style.left = ''; card.style.right = '';
    card.style.maxHeight = '';
    if (window.innerWidth <= 760) return; // CSS handles the phone layout
    var g = geoFor(n);
    card.style.top = g.top + 'px';
    card.style.left = g.left + 'px';
    // strictly tighter than the stylesheet's calc(100vh - 114px), never looser:
    // top is floored at 90 and this subtracts a further 24.
    card.style.maxHeight = g.maxH + 'px';
  }

  /* ---- the rigid connector: node on the axis -> out -> 90deg -> into the card.
     Four operations on one path element, because the preview, the draw, the
     retract and the settled line are four states of the SAME line, not four
     lines. drawSeq invalidates any timer left in flight by the previous one. */

  /* THE PREVIEW IS THE WHOLE ROUTE, DOTTED — not a stub. It was a 70px spur off
     the node, which promised nothing and then snapped to a different path on
     click. Showing the real route means the click confirms what the hover
     already said. Aug 12 2026; the stub's history is in the git log. */
  function showPreview(id) {
    if (window.innerWidth <= 760) return;
    drawSeq++;
    connEl.setAttribute('d', pathFor(nodeById(id)));
    connEl.classList.add('is-preview');
    connEl.classList.remove('is-established');
    connEl.style.transition = 'none';
    connEl.style.strokeDasharray = '4 6';
    connEl.style.strokeDashoffset = '0';
    connEl.style.opacity = '1';
    headEl.style.opacity = '0';
  }

  // returns the sequence token land() needs to prove it is still the current draw
  function drawLine(id, ms) {
    if (window.innerWidth <= 760) return -1;
    var mySeq = ++drawSeq;
    var d = pathFor(nodeById(id));
    connEl.setAttribute('d', d);
    connEl.classList.remove('is-preview', 'is-established');

    var len = connEl.getTotalLength();
    var ease = getVar('--connector-ease') || 'ease';
    connEl.style.transition = 'none';
    connEl.style.strokeDasharray = len;
    connEl.style.strokeDashoffset = len;
    connEl.style.opacity = '1';
    void connEl.getBoundingClientRect();   // flush, so the next frame animates
    requestAnimationFrame(function () {
      connEl.style.transition = 'stroke-dashoffset ' + ms + 'ms ' + ease;
      connEl.style.strokeDashoffset = '0';
    });

    // energy head — a short bright segment running the line to the card, in
    // sync with the fill. Never on the hover preview.
    if (!reduceMotion) {
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
    } else {
      headEl.style.opacity = '0';
    }
    return mySeq;
  }

  function establishLine(seq) {
    /* STALE-TIMER GUARD, and it was needed before the reroute existed too:
       closing the card inside --connector-draw-ms left this firing against a
       connector that had already been hidden. It used to only re-light a stroke
       nobody could see; now it would leave is-established on a retracted path
       and the next preview would draw bone and glowing. */
    if (seq !== drawSeq) return;
    headEl.style.transition = 'opacity 260ms ease';
    headEl.style.opacity = '0';
    /* WAS `connEl.style.stroke = 'var(--connector-active)'` — the same colour,
       applied inline. Moved onto a class so the state is visible in the DOM and
       overridable from a lab; inline beat every rule anyone could write and
       explained nothing. The transition has to be set inline because drawLine
       owns that property inline. */
    connEl.style.transition = 'stroke 260ms ease, stroke-width 260ms ease, filter 260ms ease';
    connEl.classList.add('is-established');
  }

  /* PHASE 1 OF THE REROUTE. The fill runs back to the spine end rather than the
     line fading out — and it retracts STILL LIT, because is-established is left
     alone here. The connection is being withdrawn into the system, not broken;
     hideConnector is what breaks it, and that only happens once the line has
     finished going home. */
  function retractLine(ms) {
    drawSeq++;
    var len = connEl.getTotalLength();
    var ease = getVar('--connector-ease') || 'ease';
    connEl.style.transition = 'stroke-dashoffset ' + ms + 'ms ' + ease;
    connEl.style.strokeDashoffset = len;
    headEl.style.transition = 'opacity 160ms ease';
    headEl.style.opacity = '0';
  }

  function hideConnector() {
    drawSeq++;                  // invalidate any arrival timer still in flight
    connEl.style.transition = 'opacity 200ms ease';
    connEl.style.opacity = '0';
    connEl.classList.remove('is-established', 'is-preview');
    headEl.style.transition = 'opacity 160ms ease';
    headEl.style.opacity = '0';
  }

  // resize: re-route without re-animating. The line is already established, so
  // redrawing it with drawLine would make it draw itself again on every resize.
  function reflowConnector(id) {
    if (window.innerWidth <= 760) return;
    connEl.setAttribute('d', pathFor(nodeById(id)));
    var len = connEl.getTotalLength();
    connEl.style.transition = 'none';
    connEl.style.strokeDasharray = len;
    connEl.style.strokeDashoffset = '0';
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
      reflowConnector(S.activeNode);
    }, 120);
  });

  // ---- helpers
  function nodeById(id) { for (var i = 0; i < NODES.length; i++) if (NODES[i].id === id) return NODES[i]; return null; }
  function getVar(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
  function dismissHint() { if (hint) hint.classList.add('is-hidden'); }
})();
