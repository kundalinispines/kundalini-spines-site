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
  var mark, grad;
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
     ['28%',  'rgba(198, 190, 172, 0.38)'],
     ['50%',  'rgba(var(--node-color), 0.92)'],   /* 0.60 -> 0.92: LINI sits exactly where
                                              the page's spine column is brightest, so the core
                                              was competing with the most luminous thing on the
                                              page and losing. */
     ['72%',  'rgba(198, 190, 172, 0.38)'],
     ['100%', 'rgba(128, 128, 128, 0.16)']].forEach(function (st) {
      core.appendChild(svg('stop', { offset: st[0], 'stop-color': st[1] }));
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
                                   cx: W / 2, cy: -60, r: 520 });
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
                 ['16%',  'rgba(var(--node-color), 0.72)'],
                 ['40%',  'rgba(var(--node-color), 0.30)'],
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
    function apply() {
      pending = false;
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
      grad.setAttribute('cx', ((px - rect.left - ox) / s).toFixed(1));
      grad.setAttribute('cy', Math.min(cy, ceil).toFixed(1));
    }
    footer.addEventListener('pointermove', function (e) {
      px = e.clientX; py = e.clientY;
      if (pending) return;
      pending = true;
      requestAnimationFrame(apply);
    }, { passive: true });
    footer.addEventListener('pointerleave', function () {
      /* Home is the CENTRE, at the ceiling. The wordmark's rest state is the
         static core lit on LINI, so parking the torch above the middle simply
         reinforces where the core already is -- leaving the footer produces no
         visible event, which is what a footer should do. */
      grad.setAttribute('cx', 500);
      grad.setAttribute('cy', (ceil === null ? -40 : ceil).toFixed(1));
    });
    function invalidate() { rect = null; ceil = null; }
    window.addEventListener('resize', invalidate);
    window.addEventListener('scroll', invalidate, { passive: true });
  })();
})();
