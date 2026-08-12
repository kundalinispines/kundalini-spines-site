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
    /* userSpaceOnUse so cx/cy are viewBox coordinates and the pointer can be
       mapped straight onto them without knowing the element's size. */
    /* r=400, up from 300. At 300 the lit pool covered barely three letterforms
       of a sixteen-character word, so the effect read as a smudge rather than
       as a light being carried across a wall -- and over a lit nebula the
       difference between the lit and unlit stroke was not surviving the
       backdrop at all. 400 lights roughly a third of the word, which is enough
       to see the temperature travel without the whole thing coming up at once. */
    grad = svg('radialGradient', { id: 'sf-torch', gradientUnits: 'userSpaceOnUse',
                                   cx: W / 2, cy: H / 2, r: 400 });
    /* THE FALLOFF IS DESATURATION, NOT DIMMING -- the owner's reading of the
       reference, and the more interesting of the two. Away from the cursor the
       stroke is a flat neutral grey; under it the stroke carries the scene's
       warm node colour at full strength. The letterforms never change weight,
       so nothing appears to move: only the colour temperature travels. */
    var stops = [['0%',   'rgba(var(--node-color), 1)'],
                 ['18%',  'rgba(var(--node-color), 0.82)'],
                 ['42%',  'rgba(198, 186, 164, 0.46)'],
                 ['72%',  'rgba(150, 148, 143, 0.26)'],
                 ['100%', 'rgba(128, 128, 128, 0.16)']];
    stops.forEach(function (st) {
      grad.appendChild(svg('stop', { offset: st[0], 'stop-color': st[1] }));
    });
    defs.appendChild(grad);
    s.appendChild(defs);

    mark = svg('text', { class: 'sf__mark-text', x: W / 2, y: H - 26,
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
    var svgEl = sf.__svg, pending = false, px = 0, py = 0, rect = null;
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
      grad.setAttribute('cx', ((px - rect.left - ox) / s).toFixed(1));
      grad.setAttribute('cy', ((py - rect.top - oy) / s).toFixed(1));
    }
    footer.addEventListener('pointermove', function (e) {
      px = e.clientX; py = e.clientY;
      if (pending) return;
      pending = true;
      requestAnimationFrame(apply);
    }, { passive: true });
    footer.addEventListener('pointerleave', function () {
      /* Home, not off. The wordmark's rest state is the torch parked in the
         middle -- switching it off entirely would make leaving the footer a
         visible event, which is the opposite of what a footer should do. */
      grad.setAttribute('cx', 500); grad.setAttribute('cy', 75);
    });
    window.addEventListener('resize', function () { rect = null; });
    window.addEventListener('scroll', function () { rect = null; }, { passive: true });
  })();
})();
