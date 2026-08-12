/* ==========================================================================
   SITE FOOTER — upgrades the footer that is already in the page.
   Partner file: css/site-footer.css. Built Aug 11 2026.

   IT UPGRADES, IT DOES NOT INJECT, and the difference is the whole reason the
   owner could choose a single shared file without paying for it in SEO.

   The five pages that carry a footer already have one in their HTML, with real
   hrefs. This file MOVES those anchor nodes into a richer structure -- moves,
   not clones, so there is exactly one copy of every link in the document and
   the one on screen is the one a crawler read. If this script never runs, the
   original footer renders exactly as it does today. Nothing is lost; it is
   simply not upgraded.

   That is also why the link text and destinations are not in this file. The
   page owns them. This file owns the ARRANGEMENT.

   FOUR COLUMNS THEN AN INSTRUMENT BAND, in that order, because the owner
   settled it that way against the tempting alternative: weaving the links
   INTO the instrument blocks reads better and hides the navigation inside a
   texture. A footer whose links are hard to find has failed at the only job a
   footer has. Density lives next door to the links, never wrapped around them.
   ========================================================================== */
(function () {
  'use strict';

  var footer = document.querySelector('footer.footer');
  if (!footer || footer.classList.contains('is-upgraded')) return;
  var KS = window.KS;
  if (!KS || !KS.CHAKRAS) { console.warn('site-footer: js/ks-chakras.js must load first'); return; }

  /* The one address on the site, taken from index.html's own footer where it
     has always lived. Named here rather than harvested because four of the
     five pages never had a contact link to harvest, and a CONTACT column that
     is empty on four pages is worse than one constant with a comment. */
  var EMAIL = 'kundalinispines@gmail.com';

  /* ------------------------------------------------------------------------
     RESOLVE THE ACCENT ONCE, because var() DOES NOT WORK IN SVG PRESENTATION
     ATTRIBUTES.

     stop-color="rgba(var(--node-color), 0.72)" parses, sets, and computes to
     rgb(0, 0, 0) -- opaque black. Custom properties are substituted only in CSS
     declarations, and a presentation attribute is not one. Nothing errors,
     nothing warns, and the attribute reads back exactly as it was written, so
     it is invisible to any check that inspects the DOM rather than the
     computed style.

     IT SHIPPED THAT WAY AND THE SYMPTOM WAS EXACT. The core's 50% stop is the
     middle of the wordmark, so the one part of the word that was meant to be
     brightest was rendering as the darkest thing on the page. The owner
     reported "I-N-I is still dark"; it was pure black.

     Resolved to a literal triplet here and interpolated into every stop. The
     fallback is --node-color's own value from css/spine-ui.css, used only if
     the property is missing entirely.
     ------------------------------------------------------------------------ */
  var ACCENT = (getComputedStyle(document.documentElement)
                  .getPropertyValue('--node-color') || '240, 165, 92').trim();
  function accent(a) { return 'rgba(' + ACCENT + ', ' + a + ')'; }

  var SVGNS = 'http://www.w3.org/2000/svg';
  function svg(tag, attrs) {
    var el = document.createElementNS(SVGNS, tag);
    for (var k in attrs) if (attrs.hasOwnProperty(k)) el.setAttribute(k, attrs[k]);
    return el;
  }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* ------------------------------------------------------------------------
     HARVEST
     Everything below reads the page rather than deciding for it.
     ------------------------------------------------------------------------ */
  var navLinks = [].slice.call(footer.querySelectorAll('.footer__nav a'));
  /* index.html carries `footer--simple`, which has no nav list at all. Rather
     than invent one, fall back to the page's own primary navigation -- still
     the page's links, just harvested from where that page happens to keep
     them. */
  if (!navLinks.length) {
    var primary = document.querySelector('header nav, nav.nav, .site-nav');
    if (primary) {
      navLinks = [].slice.call(primary.querySelectorAll('a')).filter(function (a) {
        return /\.html|^\/$|^\/#/.test(a.getAttribute('href') || '');
      });
    }
  }

  var socialLinks = [].slice.call(footer.querySelectorAll('.footer__social a'));
  /* The mailto, if this page had one, belongs in CONTACT rather than LISTEN. */
  var mailLinks = socialLinks.filter(function (a) { return /^mailto:/i.test(a.getAttribute('href') || ''); });
  socialLinks = socialLinks.filter(function (a) { return mailLinks.indexOf(a) === -1; });

  var tagline = footer.querySelector('.footer__tagline');
  var taglineText = tagline ? tagline.textContent.trim() : 'Knowledge Hidden in Plain Sight';

  /* ------------------------------------------------------------------------
     A LINK'S STATE IS INFORMATION, NOT A DEAD END.
     TikTok and Spotify have shipped as href="#" for as long as this footer has
     existed -- they look live, they do nothing, and a reader who clicks one
     learns that the site is broken rather than that the channel is not open
     yet. Marking them STANDBY says the true thing, and turning one live later
     is a one-character change to the page's own href.
     ------------------------------------------------------------------------ */
  function stateOf(a) {
    var href = (a.getAttribute('href') || '').trim();
    if (!href || href === '#') return 'STANDBY';
    if (/^mailto:/i.test(href)) return 'OPEN';
    return 'OPEN';
  }

  function row(a) {
    var li = el('li', 'sf-row');
    var st = stateOf(a);
    if (st === 'STANDBY') {
      /* Not a link any more. An anchor that cannot go anywhere should not be
         focusable, should not be announced as a link, and should not offer a
         pointer cursor -- three separate small lies. */
      var span = el('span', 'sf-row__dead', a.textContent.trim());
      a.parentNode && a.parentNode.removeChild(a);
      li.appendChild(span);
    } else {
      a.classList.add('sf-row__link');
      li.appendChild(a);
    }
    li.appendChild(el('span', 'sf-row__state sf-row__state--' + st.toLowerCase(), st));
    return li;
  }

  function column(title, nodes) {
    var col = el('div', 'sf-col');
    col.appendChild(el('h2', 'sf-col__head', title));
    var ul = el('ul', 'sf-col__list');
    nodes.forEach(function (n) { ul.appendChild(n); });
    col.appendChild(ul);
    return col;
  }

  /* ------------------------------------------------------------------------
     BUILD
     ------------------------------------------------------------------------ */
  var sf = el('div', 'sf');

  /* --- the substrate: SEED OF LIFE, seven circles for seven centres.
     NOT the flower. The flower is nineteen circles and twelve of them would
     carry nothing, which makes the correspondence decorative. The seed is
     seven: one centre and six around it, each circle tangent through the
     centre point, and every one of them carries a name and a frequency. A
     figure where every element means something is the whole register of this
     project. */
  (function seed() {
    var W = 1000, H = 420, R = 132, cx = W / 2, cy = H / 2 + 8;
    /* MEET, NOT SLICE. `slice` scales to COVER, and in a footer far wider than
       the 1000x420 viewBox that meant a ~1.5x blow-up: the ring left the frame
       and its seven labels were flung outward, landing on top of TRANSMISSIONS
       and ARCHIVE in the link column. A substrate that collides with the
       navigation is not a substrate. `meet` fits the figure inside its box and
       the CSS confines that box to the lower part of the footer. */
    var g = svg('svg', { class: 'sf__seed', viewBox: '0 0 ' + W + ' ' + H,
                         preserveAspectRatio: 'xMidYMid meet', 'aria-hidden': 'true' });
    var ring = svg('g', { class: 'sf__seed-ring' });
    var pts = [[cx, cy]];
    for (var i = 0; i < 6; i++) {
      /* Started at -90deg so a circle sits on the vertical axis: the seven then
         read as a column with a body rather than as a wheel lying on its side,
         which is what the spine they describe actually is. */
      var a = (-90 + i * 60) * Math.PI / 180;
      pts.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R]);
    }
    pts.forEach(function (p) {
      ring.appendChild(svg('circle', { cx: p[0].toFixed(1), cy: p[1].toFixed(1), r: R }));
    });
    g.appendChild(ring);

    /* The seven, crown first, onto the seven centres. The order is the array's
       order, so circle 0 is the crown and the mapping is not a coincidence
       anyone has to maintain. */
    var labels = svg('g', { class: 'sf__seed-labels' });
    KS.CHAKRAS.forEach(function (c, i) {
      var p = pts[i]; if (!p) return;
      var t = svg('text', { class: 'sf__seed-name', x: p[0].toFixed(1), y: (p[1] - 3).toFixed(1) });
      t.textContent = c.name;
      var h = svg('text', { class: 'sf__seed-hz', x: p[0].toFixed(1), y: (p[1] + 12).toFixed(1) });
      h.textContent = c.hz + ' HZ';
      labels.appendChild(t); labels.appendChild(h);
    });
    g.appendChild(labels);
    sf.appendChild(g);
  })();

  /* --- tier 1: the four columns. */
  var cols = el('div', 'sf__cols');

  var idcol = el('div', 'sf-col sf-col--id');
  idcol.appendChild(el('h2', 'sf-col__head', 'Kundalini Spines'));
  idcol.appendChild(el('p', 'sf-col__blurb', taglineText));
  cols.appendChild(idcol);

  cols.appendChild(column('Navigate', navLinks.map(row)));
  cols.appendChild(column('Listen', socialLinks.map(row)));

  var contact = mailLinks.slice();
  if (!contact.length) {
    var a = el('a', null, EMAIL);
    a.setAttribute('href', 'mailto:' + EMAIL);
    contact = [a];
  }
  cols.appendChild(column('Contact', contact.map(row)));
  sf.appendChild(cols);

  /* --- tier 2: the instrument band. Faint, and beside the links rather than
     around them. Everything in it is a real measured value: the runtime is the
     sum of all 28 durations in data/tracks.json, not an estimate. */
  (function instrument() {
    var band = el('div', 'sf__instr');
    var R = KS.RECORD;
    function block(head, rows) {
      var b = el('div', 'sf-instr__block');
      b.appendChild(el('span', 'sf-instr__head', head));
      rows.forEach(function (r) {
        var line = el('span', 'sf-instr__row');
        line.appendChild(el('span', 'sf-instr__k', r[0]));
        line.appendChild(el('b', 'sf-instr__v', String(r[1])));
        b.appendChild(line);
      });
      return b;
    }
    band.appendChild(block('Record', [
      ['Release', R.title], ['Year', R.year], ['Tracks', R.tracks], ['Runtime', R.runtime]
    ]));
    band.appendChild(block('Geometry', R.geometry));
    band.appendChild(block('Calibration', KS.CHAKRAS.slice(0, 4).map(function (c) {
      return [c.name, c.hz + ' Hz'];
    })));
    band.appendChild(block('', KS.CHAKRAS.slice(4).map(function (c) {
      return [c.name, c.hz + ' Hz'];
    })));
    sf.appendChild(band);
  })();

  /* --- the base: KUNDALINI SPINES, outline only, cropped by the footer.
     The owner's original idea, in the one place on the site where it is not
     redundant. On the navigator it would have restated a wordmark the entrance
     played four seconds earlier; here you have scrolled a whole page to reach
     it, and a huge wordmark across a footer's base is what a footer's base is
     for.

     SVG TEXT, NOT -webkit-text-stroke, and that is forced rather than
     preferred: the stroke has to take a GRADIENT (see the torch below), and
     the CSS property only accepts a colour. */
  var mark, grad, torchCtl = null;
  /* The core's centre stop and the torch's redraw, held at module scope so the
     tuning panel can reach both. BRIGHTNESS IS NOT A TORCH PROPERTY: the core
     is painted even where the torch never binds (touch, reduced motion), so a
     control living inside the torch's closure would be unreachable exactly
     where the core is the only thing on screen. */
  var coreStop = null, torchApply = null;

  /* ------------------------------------------------------------------------
     THE TUNABLES — two numbers, and they are the shape of the shine.

       r         how far the light reaches. Bigger lights more of the word.
       ceilBias  how far ABOVE the rule the source sits, in viewBox units.
                 0 puts it exactly on the rule -- the owner's constraint, the
                 light never descends past it. Negative lifts it further away,
                 which flattens the shine toward a graze; positive is clamped
                 to 0 so the rule stays a hard floor no dial can breach.

     PERSISTED, deliberately. Dialling a value in and losing it to a reload has
     cost this project real work before, so both survive in localStorage under
     one key. The panel that writes them only exists at /?tune -- see below --
     so a visitor never pays for any of this.
     ------------------------------------------------------------------------ */
  /* WHERE THE TORCH SITS WHEN NOBODY IS POINTING AT IT.

     It used to park at the ceiling above the word's centre, which put the pool
     squarely over I-N-I: the shine was on before the reader had done anything,
     so there was nothing for moving the pointer to reveal. It now parks a full
     radius clear of the letterforms, so at rest the travelling layer
     contributes NOTHING and the wordmark shows only its static core.

     DERIVED FROM r, not a constant. The radius is tunable at /?tune, and a
     fixed park would slide back into range the moment the size was dialled up
     -- the effect would quietly switch itself on at some slider position and
     look like a bug in the slider. +80 is clearance beyond the reach so the
     outermost stop is still short of the cap line. */
  function restCy() { return -(TORCH.r + 80); }

  var TORCH_KEY = 'ks.footerTorch';
  /* THE SETTLED VALUES, dialled in at /?tune on about.html Aug 11 2026 and
     pasted back from the panel's own Copy. core 0.12 is a long way down from
     the 0.72 this was built at -- that number was chosen while the middle of
     the wordmark was rendering as opaque black, so every judgement made
     against it was made against a bug. Once the centre actually lit, far less
     of it was wanted.

     DEFAULTS ARE A RECORD, NOT LITERALS SCATTERED AROUND. Reset used to
     restore three hardcoded numbers, which meant the moment these values moved
     the button would have quietly restored the OLD ones -- a control that
     silently disagrees with the source it is meant to return you to. */
  var TORCH_DEFAULTS = { r: 530, ceilBias: 0, core: 0.12 };
  var TORCH = { r: TORCH_DEFAULTS.r, ceilBias: TORCH_DEFAULTS.ceilBias,
                core: TORCH_DEFAULTS.core };
  try {
    var saved = JSON.parse(localStorage.getItem(TORCH_KEY) || 'null');
    if (saved && isFinite(saved.r)) TORCH.r = saved.r;
    if (saved && isFinite(saved.ceilBias)) TORCH.ceilBias = saved.ceilBias;
    if (saved && isFinite(saved.core)) TORCH.core = saved.core;
  } catch (err) {}
  (function wordmark() {
    var W = 1000, H = 150;
    var s = svg('svg', { class: 'sf__mark', viewBox: '0 0 ' + W + ' ' + H,
                         preserveAspectRatio: 'xMidYMid meet', 'aria-hidden': 'true' });
    var defs = svg('defs');

    /* THE CORE — always lit, and it does not move.
       The middle of the wordmark stays warm whether or not anyone is pointing
       at it, so the mark has a resting state of its own rather than being
       dead until touched. A left-to-right linear ramp, warm at 50% and neutral
       at both ends, which lands the lit region on LINI -- "KUNDALINI SPINES"
       is sixteen characters and its centre falls just after that run.
       The travelling torch is a SECOND copy of the text drawn over this one;
       where the torch is weak it is nearly transparent and this shows through,
       which is what lets the light move to the outer letters without the
       centre ever going out. */
    var core = svg('linearGradient', { id: 'sf-core', x1: '0', y1: '0', x2: '1', y2: '0' });
    [['0%',   'rgba(128, 128, 128, 0.16)'],
     ['28%',  'rgba(198, 190, 172, 0.30)'],
     ['50%',  accent(TORCH.core)],   /* the brightest point in the word, and it
                                              lands on LINI because the ramp is
                                              centred and the word is centred. */
     ['72%',  'rgba(198, 190, 172, 0.30)'],
     ['100%', 'rgba(128, 128, 128, 0.16)']].forEach(function (st) {
      var st0 = svg('stop', { offset: st[0], 'stop-color': st[1] });
      if (st[0] === '50%') coreStop = st0;      /* the one the brightness dial drives */
      core.appendChild(st0);
    });
    defs.appendChild(core);
    /* userSpaceOnUse so cx/cy are viewBox coordinates and the pointer can be
       mapped straight onto them without knowing the element's size. */
    /* r=400, up from 300. At 300 the lit pool covered barely three letterforms
       of a sixteen-character word, so the effect read as a smudge rather than
       as a light being carried across a wall -- and over a lit nebula the
       difference between the lit and unlit stroke was not surviving the
       backdrop at all. 400 lights roughly a third of the word, which is enough
       to see the temperature travel without the whole thing coming up at once. */
    /* r=520, up from 400. The centre is now clamped ABOVE the letterforms, so
       the pool has to travel further before its edge reaches them; at 400 the
       grazing light barely touched the cap line and the shine read as nothing
       at all. The radius buys reach, not intensity -- the falloff does that. */
    grad = svg('radialGradient', { id: 'sf-torch', gradientUnits: 'userSpaceOnUse',
                                   cx: W / 2, cy: restCy(), r: TORCH.r });
    /* THE FALLOFF IS DESATURATION, NOT DIMMING -- the owner's reading of the
       reference, and the more interesting of the two. Away from the cursor the
       stroke is a flat neutral grey; under it the stroke carries the scene's
       warm node colour at full strength. The letterforms never change weight,
       so nothing appears to move: only the colour temperature travels. */
    /* THE OUTER STOPS GO FULLY TRANSPARENT, which they did not when this layer
       was the only one. It now sits OVER the static core, so any alpha out here
       would grey the core's warm centre back out -- the travelling light has to
       add and never subtract. */
    var stops = [['0%',   'rgba(255, 246, 232, 0.95)'],
                 ['16%',  accent(0.72)],
                 ['40%',  accent(0.30)],
                 ['70%',  'rgba(198, 186, 164, 0.10)'],
                 ['100%', 'rgba(198, 186, 164, 0)']];
    stops.forEach(function (st) {
      grad.appendChild(svg('stop', { offset: st[0], 'stop-color': st[1] }));
    });
    defs.appendChild(grad);
    s.appendChild(defs);

    /* TWO COPIES OF THE SAME WORD, stacked. The lower one carries the static
       core so the centre is lit at rest; the upper one carries the travelling
       torch and is nearly transparent everywhere the torch is weak, so the
       core reads through it. One element could not do both: a stroke takes one
       paint, and these two need to coexist rather than replace each other. */
    var base = svg('text', { class: 'sf__mark-text sf__mark-text--core', x: W / 2, y: H - 26,
                             'text-anchor': 'middle', stroke: 'url(#sf-core)', fill: 'none' });
    base.textContent = 'KUNDALINI SPINES';
    s.appendChild(base);

    mark = svg('text', { class: 'sf__mark-text sf__mark-text--torch', x: W / 2, y: H - 26,
                         'text-anchor': 'middle', stroke: 'url(#sf-torch)', fill: 'none' });
    mark.textContent = 'KUNDALINI SPINES';
    s.appendChild(mark);
    sf.appendChild(s);
    sf.__svg = s;
  })();

  /* --- the copyright line, kept as the page wrote it. */
  var copy = footer.querySelector('.footer__copyright');
  var foot = el('div', 'sf__foot');
  if (copy) { copy.classList.add('sf__copy'); foot.appendChild(copy); }
  foot.appendChild(el('span', 'sf__seal', 'KNOWLEDGE HIDDEN IN PLAIN SIGHT'));
  sf.appendChild(foot);

  footer.appendChild(sf);
  footer.classList.add('is-upgraded');

  /* ------------------------------------------------------------------------
     THE TORCH
     Two attribute writes per pointer burst, and no frame loop: the gradient's
     centre IS the cursor, so there is nothing to animate between events. The
     `pending` guard coalesces a burst of moves into one write per frame, which
     is the same shape READOUT uses and keeps an idle page scheduling nothing.

     Bound on the FOOTER, not on window: this only matters while the reader is
     down here, and a listener that runs for the whole page to serve one
     element at the bottom of it is the kind of cost that never shows up in a
     profile because it is spread across everything.
     ------------------------------------------------------------------------ */
  (function torch() {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      /* Static, centred, and slightly warmer than the resting stroke. The
         effect exists to reward moving the pointer; with motion suppressed it
         becomes an even wash rather than nothing at all. */
      footer.classList.add('sf-torch-static');
      return;
    }
    var svgEl = sf.__svg, pending = false, px = 0, py = 0, rect = null, ceil = null;
    /* True until the pointer has actually been inside the footer, and true
       again the moment it leaves. Without it the first apply() would use the
       0,0 the coordinates initialise to and light the top-left corner. */
    var parked = true;
    function apply() {
      pending = false;
      if (parked) {
        grad.setAttribute('cx', 500);
        grad.setAttribute('cy', restCy().toFixed(1));
        return;
      }
      if (!rect) rect = svgEl.getBoundingClientRect();
      if (!rect.width || !rect.height) { rect = null; return; }
      /* Viewport px -> viewBox units. preserveAspectRatio is xMidYMid meet, so
         the drawing is letterboxed and the scale is the SMALLER of the two
         ratios; using width alone would drift the torch vertically on any
         viewport where the box is not exactly 1000:150. */
      var sx = rect.width / 1000, sy = rect.height / 150, s = Math.min(sx, sy);
      var ox = (rect.width - 1000 * s) / 2, oy = (rect.height - 150 * s) / 2;

      /* THE CEILING — the light never descends past the rule that separates
         navigate/listen/contact from record/geometry/calibration.

         That rule sits ABOVE the wordmark, so clamping the gradient's centre
         to it means the source is always overhead and only the lower edge of
         its pool ever reaches the letterforms. The result grazes the tops of
         the glyphs instead of glowing through their middles, which is the
         difference between a shine and a lamp -- the owner's word was shine.

         Derived from the rule's real position rather than hardcoded, so it
         survives any change to the band heights above it. Cached with the
         rect and invalidated by the same events. */
      if (ceil === null) {
        var ruleEl = footer.querySelector('.sf__instr');
        var ruleY = ruleEl ? ruleEl.getBoundingClientRect().top : rect.top;
        ceil = (ruleY - rect.top - oy) / s;        /* negative: above the viewBox */
      }
      var cy = (py - rect.top - oy) / s;
      var lid = ceil + Math.min(0, TORCH.ceilBias);   /* positive can never lower it */
      grad.setAttribute('cx', ((px - rect.left - ox) / s).toFixed(1));
      grad.setAttribute('cy', Math.min(cy, lid).toFixed(1));
    }
    footer.addEventListener('pointermove', function (e) {
      parked = false;
      px = e.clientX; py = e.clientY;
      if (pending) return;
      pending = true;
      requestAnimationFrame(apply);
    }, { passive: true });
    footer.addEventListener('pointerleave', function () {
      /* Out of range, not merely home. Leaving the footer returns the wordmark
         to its static core alone -- the same state it loads in -- so the shine
         is something the reader causes rather than something already running. */
      parked = true;
      apply();
    });
    function invalidate() { rect = null; ceil = null; }

    /* Only the redraw is published. The control object is built at module
       scope so it exists whether or not this closure ever ran. */
    torchApply = apply;
    window.addEventListener('resize', invalidate);
    window.addEventListener('scroll', invalidate, { passive: true });

    /* Lab hook, mirroring window.__music / window.__spineLab / window.__cal.
       Not used by the page; it is how the torch can be driven or inspected
       from a console without the tuning panel being present. */
    window.__sfTorch = torchCtl;
  })();


  /* ------------------------------------------------------------------------
     THE CONTROL SURFACE — one object, three values, one place they persist.
     Built here rather than inside the torch so brightness stays reachable on a
     touch device or under prefers-reduced-motion, where the torch never binds
     and the static core is the entire wordmark.
     ------------------------------------------------------------------------ */
  torchCtl = {
    get: function () { return { r: TORCH.r, ceilBias: TORCH.ceilBias, core: TORCH.core }; },
    set: function (k, v) {
      TORCH[k] = v;
      if (k === 'r' && grad) grad.setAttribute('r', v);
      /* Brightness rewrites the one stop it owns. The rest of the ramp is
         deliberately left alone: the neutral shoulders are what the centre is
         bright AGAINST, and scaling them with it would keep the contrast
         constant and make the dial do nothing. */
      if (k === 'core' && coreStop) coreStop.setAttribute('stop-color', accent(v));
      if (torchApply) torchApply();
      try { localStorage.setItem(TORCH_KEY, JSON.stringify(TORCH)); } catch (e) {}
    }
  };

  /* ==========================================================================
     THE TUNING PANEL — only ever runs at /?tune

     Same gate the spine tuner uses (js/spine-bg.js), so there is one thing to
     remember rather than two. A visitor never sees it, never downloads a
     stylesheet for it, and never pays a listener for it: nothing below this
     line executes unless the query string asks for it.

     It writes through torchCtl, which is the same path the pointer uses, so
     what is on screen while dragging is exactly what a visitor would get --
     the panel cannot flatter itself with a preview the real code does not do.
     ========================================================================== */
  (function tuner() {
    /* NO REGEX. This guard was written with a word-boundary escape in it and
       a generator turned that escape into a literal backspace character
       (0x08), producing a pattern that
       could never match and was invisible in every diff and every grep. Reading
       the query string as data cannot rot that way. */
    var tuneOn = new URLSearchParams(location.search).has('tune');
    if (!tuneOn || !torchCtl) return;

    var box = document.createElement('div');
    box.className = 'sf-tune';
    box.innerHTML =
      '<b>Footer torch</b>' +
      '<label>Size<i data-out="r"></i>' +
        '<input type="range" data-k="r" min="120" max="1400" step="10"></label>' +
      '<label>Height above rule<i data-out="ceilBias"></i>' +
        '<input type="range" data-k="ceilBias" min="-400" max="0" step="5"></label>' +
      '<label>Brightness<i data-out="core"></i>' +
        '<input type="range" data-k="core" min="0" max="1" step="0.02"></label>' +
      '<button type="button" data-act="copy">Copy values</button>' +
      '<button type="button" data-act="reset">Reset</button>' +
      '<span class="sf-tune__note">persisted &middot; /?tune only</span>';
    document.body.appendChild(box);

    function paint() {
      var v = torchCtl.get();
      box.querySelectorAll('input').forEach(function (i) { i.value = v[i.dataset.k]; });
      box.querySelector('[data-out="r"]').textContent = v.r + ' units';
      box.querySelector('[data-out="ceilBias"]').textContent = v.ceilBias + ' units';
      box.querySelector('[data-out="core"]').textContent = Number(v.core).toFixed(2);
    }
    box.addEventListener('input', function (e) {
      var k = e.target.dataset.k; if (!k) return;
      torchCtl.set(k, Number(e.target.value));
      paint();
    });
    box.addEventListener('click', function (e) {
      var a = e.target.dataset.act;
      if (a === 'reset') {
        Object.keys(TORCH_DEFAULTS).forEach(function (k) { torchCtl.set(k, TORCH_DEFAULTS[k]); });
        paint();
      }
      if (a === 'copy') {
        var v = torchCtl.get();
        /* The exact edits, not the numbers alone -- a value without its home
           is a note somebody has to decode later. */
        var txt = 'js/site-footer.js  ->  var TORCH = { r: ' + v.r +
                  ', ceilBias: ' + v.ceilBias + ', core: ' + v.core + ' };';
        (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject())
          .then(function () { e.target.textContent = 'Copied'; },
                function () { e.target.textContent = txt; })
          .then(function () { setTimeout(function () { e.target.textContent = 'Copy values'; }, 1600); });
      }
    });
    paint();
  })();

})();
