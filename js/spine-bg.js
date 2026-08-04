/* ==========================================================================
   SPINE BACKGROUND — scroll-linked charge front.
   Pairs with css/spine-bg.css. Loaded by index.html only.

   The layer spans from the top of #tracks to the bottom of the document and is
   built here rather than in the HTML, so index.html carries one script tag and
   no extra markup. It is inert: aria-hidden, pointer-events:none, and it never
   listens for anything the carousel wants.
   ========================================================================== */
(function () {
  'use strict';

  var anchor = document.getElementById('tracks');
  if (!anchor) return;

  /* ---- build the layer ---- */
  var layer = document.createElement('div');
  layer.className = 'spine-bg';
  layer.setAttribute('aria-hidden', 'true');
  layer.innerHTML =
    '<div class="spine-bg__art spine-bg__art--dim"></div>' +
    '<div class="spine-bg__art spine-bg__art--lit"></div>' +
    '<div class="spine-bg__bloom"></div>' +
    '<div class="spine-bg__scan"></div>';
  document.body.insertBefore(layer, document.body.firstChild);

  var top = 0, height = 0;

  /* Measure where the layer starts and how tall it is, in DOCUMENT space.
     Called on resize, on font load, and — importantly — whenever the document
     changes height. */
  function measure() {
    var r = anchor.getBoundingClientRect();
    var newTop = Math.round(r.top + window.scrollY);
    var newHeight = Math.max(0, document.documentElement.scrollHeight - newTop);
    if (newTop === top && newHeight === height) return false;
    top = newTop;
    height = newHeight;
    layer.style.top = top + 'px';
    layer.style.height = height + 'px';
    return true;
  }

  /* MEASURED BUG, do not "simplify" this back.
     The obvious formula — a reading line 55% down the viewport, progress =
     (read - regionTop) / regionHeight — can never reach 1, because the region
     ends at the bottom of the document and so can never be scrolled past that
     line. It topped out at 81% on a 1440x900 page and the last fifth of the
     column stayed dark forever. The front is mapped over the SCROLL RANGE
     instead, finishing exactly when the document bottoms out, which is the
     only position guaranteed to be reachable. */
  function charge() {
    var y = window.scrollY;
    var vh = window.innerHeight;
    var start = top - vh * 0.55;
    var end = Math.max(start + 1, top + height - vh);
    var p = (y - start) / (end - start);
    if (p < 0) p = 0; else if (p > 1) p = 1;
    document.documentElement.style.setProperty('--charge', p.toFixed(4));
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; charge(); });
  }

  function remeasure() { measure(); charge(); }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', remeasure);

  /* The carousel fetches data/tracks.json and builds its cards AFTER this runs,
     which changes the document height — so a one-shot measurement at load is
     wrong by however tall the carousel turns out to be. Watching the body
     covers that, plus lazy images, font swap, and the focus panel changing
     height as tracks are selected. Without this the column stopped short of
     the footer on first paint and only corrected itself on the next resize. */
  if (window.ResizeObserver) {
    new ResizeObserver(remeasure).observe(document.body);
  } else {
    setTimeout(remeasure, 400);
    setTimeout(remeasure, 1500);
  }

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);
  window.addEventListener('load', remeasure);

  remeasure();

  /* ========================================================================
     PLAYBACK PULSE
     track-experience.js already toggles `is-playing` on .track-experience when
     a sample starts and stops. The spine layer is a body child, not a
     descendant of that section, so no selector can reach it from there —
     mirror the flag onto <html> instead and let CSS do the rest.
     Reading existing state rather than hooking the player keeps this decoupled:
     the sample is a detached `new Audio()` with no DOM node, so there is
     nothing to listen to directly, and patching its prototype would be worse.
     ======================================================================== */
  var section = document.querySelector('.track-experience');
  if (section && window.MutationObserver) {
    var syncPulse = function () {
      document.documentElement.classList.toggle(
        'is-spine-pulsing', section.classList.contains('is-playing'));
    };
    new MutationObserver(syncPulse).observe(section, {
      attributes: true, attributeFilter: ['class']
    });
    syncPulse();
  }

  /* ========================================================================
     TUNING PANEL — only ever runs at /?tune
     Visitors never load it, so this is safe to leave in the repo: without the
     flag nothing below the guard executes and no markup is created.
     Open http://localhost:8000/?tune, dial it in on the REAL page rather than
     a mock, then press Copy and paste the block into the :root of
     css/spine-bg.css. That is the whole workflow — no numbers relayed by hand.
     ======================================================================== */
  if (!/[?&]tune\b/.test(location.search)) return;

  var FIELDS = [
    { v: '--spine-w',     label: 'width',  min: 120, max: 640, step: 5,    unit: 'px' },
    { v: '--spine-dim',   label: 'dim',    min: 0,   max: 0.6, step: 0.01, unit: ''   },
    { v: '--spine-lit',   label: 'lit',    min: 0,   max: 1.6, step: 0.02, unit: ''   },
    { v: '--spine-glow',  label: 'glow',   min: 0,   max: 1,   step: 0.02, unit: ''   },
    { v: '--spine-feather', label: 'reach', min: 10, max: 900, step: 10,   unit: 'px' },
    { v: '--spine-offset', label: 'shift',  min: -900, max: 900, step: 10, unit: 'px' },
    { v: '--spine-bias',   label: 'bias',   min: -2, max: 5, step: 0.05, unit: ''   },
    /* THE GLOW BAND. `band` is the lit zone's height in px, measured up from the
       charge front; `soft` is the softness of its top edge only. 3000 is OFF —
       the top edge clears the layer and the mask is the old half-plane — so the
       slider's far right is "no band", not "a huge band". Its far LEFT is
       nothing lit at all, because the top edge lands on the front. */
    { v: '--spine-band',   label: 'band',   min: 0,  max: 3000, step: 20, unit: 'px' },
    { v: '--spine-band-feather', label: 'soft', min: 0, max: 800, step: 10, unit: 'px' },
    { v: '--spine-bloom', label: 'flare',  min: 0,   max: 1.5, step: 0.05, unit: ''   },
    { v: '--spine-beam',  label: 'beam',   min: 0,   max: 1.5, step: 0.05, unit: ''   },
    { v: '--spine-scrim', label: 'scrim',  min: 0,   max: 1.5, step: 0.05, unit: ''   },
    { v: '--spine-pulse-lo', label: 'puls lo', min: 0, max: 1.6, step: 0.02, unit: ''   },
    { v: '--spine-pulse-hi', label: 'puls hi', min: 0, max: 1.6, step: 0.02, unit: ''   },
    { v: '--spine-pulse-ms', label: 'puls ms', min: 600, max: 8000, step: 100, unit: 'ms' },
    /* NOT A SPINE CONTROL. How heavy the page feels under a mouse wheel, read by
       js/scroll-weight.js. It is here because this is the only tuning panel on
       the site, but it lives in a different stylesheet — `file` below makes Copy
       CSS emit it under its own heading so it does not get pasted into
       spine-bg.css, where it would work on the front page and nowhere else.
       0 is off and means genuinely native. Wheel only; touch, keyboard and
       anchors are untouched, and reduced motion disables it. */
    { v: '--scroll-weight', label: 'scroll', min: 0, max: 1, step: 0.05, unit: '',
      file: 'css/base.css' },
    /* THE STAR FIELD, css/star-bg.css. `stars` is its brightness (0 = off, and
       under screen blending that is identical to the layer not being there);
       `hue` is saturation, 1 = the hero footage as shot (deep blue), 0 = the
       colourless grade the spine artwork was made to match. Those two greys are
       the only place on the page where the site disagrees with itself, so judge
       them against the spine, not on their own. */
    { v: '--star-dim', label: 'stars', min: 0, max: 1.4, step: 0.05, unit: '',
      file: 'css/star-bg.css' },
    { v: '--star-sat', label: 'hue',   min: 0, max: 1.4, step: 0.05, unit: '',
      file: 'css/star-bg.css' },
    /* TWINKLE. `twnk` is the idle amplitude, `twnk hi` the one that takes over
       while a sample is playing — same is-spine-pulsing flag that drives the
       spine's breathing, so the sky and the column answer the play button
       together. `twnk ms` is the cycle length. Set twnk to 0 for a dead static
       sky; set both equal to make the player stop affecting it. */
    { v: '--star-twinkle',    label: 'twnk',    min: 0, max: 1.2, step: 0.02, unit: '',
      file: 'css/star-bg.css' },
    { v: '--star-twinkle-hi', label: 'twnk hi', min: 0, max: 1.5, step: 0.02, unit: '',
      file: 'css/star-bg.css' },
    { v: '--star-twinkle-ms', label: 'twnk ms', min: 800, max: 12000, step: 100, unit: 'ms',
      file: 'css/star-bg.css' },
    /* DESYNC — how far apart the four star bands run, and the A/B for the whole
       four-band rebuild.
         0 = all four on one clock with no delay. Because the band images are a
             true PARTITION of what build 6 crushed out at runtime, this renders
             build 6 exactly. It is an identity, not an approximation.
         1 = the shipped spread: periods 1x / 1.37x / 1.79x / 2.31x, four phases.
       If the sky reads as one object breathing, come UP. If it reads as too
       busy, come DOWN this rather than pulling the amplitude — amplitude
       changes how bright the twinkle is, desync changes whether it reads as a
       sky at all. */
    { v: '--star-desync', label: 'desync', min: 0, max: 1, step: 0.05, unit: '',
      file: 'css/star-bg.css' },
    /* The soft glow on the nebula, separate from the star cores above. The stars
       flare from their whitest points; the clouds only swell. */
    { v: '--star-cloud',      label: 'cloud',   min: 0, max: 1.2, step: 0.02, unit: '',
      file: 'css/star-bg.css' }
  ];
  var HOME = 'css/spine-bg.css';

  var css = document.createElement('style');
  css.textContent =
    '.spine-tune{position:fixed;right:12px;bottom:12px;z-index:9999;background:rgba(5,5,5,.94);' +
    'border:1px solid #2E2E2E;padding:10px 12px;font:11px/1.5 "IBM Plex Mono",monospace;' +
    'color:#8F8F8F;letter-spacing:.08em;backdrop-filter:blur(8px);min-width:240px}' +
    '.spine-tune h6{margin:0 0 8px;color:#D8D0BE;font:inherit;letter-spacing:.14em;text-transform:uppercase}' +
    '.spine-tune label{display:flex;align-items:center;gap:8px;margin:5px 0}' +
    '.spine-tune span:first-child{width:44px;text-transform:uppercase}' +
    '.spine-tune input{flex:1;accent-color:#D8D0BE}' +
    '.spine-tune b{width:46px;text-align:right;color:#F2F2EE;font-weight:400}' +
    '.spine-tune button{margin-top:8px;width:100%;background:#D8D0BE;color:#050505;border:0;' +
    'padding:6px;font:inherit;letter-spacing:.12em;text-transform:uppercase;cursor:pointer}' +
    '.spine-tune p{margin:6px 0 0;color:#6B6B6B;max-width:none}';
  document.head.appendChild(css);

  var box = document.createElement('div');
  box.className = 'spine-tune';
  var build = getComputedStyle(document.documentElement).getPropertyValue('--spine-build').trim() || '?';
  var hasOldScrim = !!getComputedStyle(document.querySelector('.track-focus-panel') || document.body, '::before')
      .backgroundImage.match(/radial/);
  var starBuild = getComputedStyle(document.documentElement).getPropertyValue('--star-build').trim();
  box.innerHTML = '<h6>Spine tuning &middot; css build ' + build +
    (starBuild ? ' &middot; star ' + starBuild : ' <em style="color:#D8534F;font-style:normal">NO STAR CSS</em>') +
    (hasOldScrim ? ' <em style="color:#D8534F;font-style:normal">STALE CSS</em>' : '') + '</h6>' +
    '<p id="spine-jsck" style="margin:0 0 6px">checking js...</p>';

  /* CSS and JS are cached independently, so "css build 10" says nothing about
     whether track-experience.js reloaded. The card shadows live in that file;
     if it is stale they are still rgba(0,0,0,...) and paint below the page
     background, which is the blob. Read the shadow off the live overlay and
     say which one is loaded, rather than leaving it to be argued about. */
  setTimeout(function () {
    var out = document.getElementById('spine-jsck');
    var el = document.querySelector('.track-hero-layer');
    var sh = el ? getComputedStyle(el).boxShadow : '';
    if (!sh || sh === 'none') { out.textContent = 'js: no hero shadow to read yet'; return; }
    if (/rgba\(0, 0, 0/.test(sh)) {
      out.innerHTML = '<b style="color:#D8534F">STALE JS</b> — card shadows are still ' +
        'pure black. Hard-reload (Ctrl+Shift+R).';
    } else {
      out.innerHTML = '<span style="color:#7FB37F">js OK</span> — card shadows are page-black.';
    }
  }, 2500);

  var read = function (name) {
    return parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));
  };

  FIELDS.forEach(function (f) {
    var start = read(f.v);
    var row = document.createElement('label');
    row.innerHTML = '<span>' + f.label + '</span>';
    var input = document.createElement('input');
    input.type = 'range';
    input.min = f.min; input.max = f.max; input.step = f.step; input.value = start;
    var out = document.createElement('b');
    out.textContent = start + f.unit;
    input.addEventListener('input', function () {
      document.documentElement.style.setProperty(f.v, input.value + f.unit);
      out.textContent = input.value + f.unit;
    });
    row.appendChild(input); row.appendChild(out);
    box.appendChild(row);
    f._input = input;
    f._out = out;
  });

  /* ---- ISOLATE: bisect the blob on the user's own hardware ----------------
     Everything above is measurable from a headless screenshot. This is not:
     the reported blob does not reproduce here, and HANDOFF 3 is explicit that
     headless has no GPU and cannot reproduce raster problems at all. So rather
     than guessing at causes remotely, step through suspects on the real
     machine and see which one makes it disappear. */
  /* VIEW MODES. This started as a bisect tool for the card-shadow blob; that is
     solved, so it is now for seeing what the spine is doing underneath the
     content. Ghosting the cards rather than hiding them keeps their geometry on
     screen, so the glow can be judged against where they actually sit instead of
     from memory. The last two entries are the old diagnostic modes, kept because
     they cost nothing and found a real bug once. */
  /* The six full-screen layers css/star-bg.css owns: base sky, four twinkle
     bands, clouds. Kept as one string so a mode cannot hide five of six by
     accident, which is how the old 'stars off' entry drifted. */
  var STAR_LAYERS = 'body::before,body::after,html::before,html::after,main::before,main::after';
  var KEEP_BANDS  = 'main::before,main::after{visibility:visible!important}';

  var ISOLATE = [
    ['— normal page —', ''],
    ['cards ghosted 12%', '.track-card,.track-hero-layer{opacity:.12!important}'],
    ['cards hidden', '.track-card,.track-hero-layer{visibility:hidden!important}'],
    ['cards + panel hidden', '.track-card,.track-hero-layer{visibility:hidden!important}.track-focus-panel{visibility:hidden!important}'],
    /* KEEP-BANDS. Since star-bg.css build 8, two of the four star bands live on
       main::before and main::after. `visibility` INHERITS into pseudo-elements,
       so every mode that hides main also silently switches off half the sky —
       which reads as "the twinkle broke" rather than as "this view mode hid
       it". Every entry below that hides main puts the two pseudo-elements back
       explicitly. Add the same clause to any new mode that hides main. */
    ['spine only (all content off)',
      'main,.footer,.nav{visibility:hidden!important}' + KEEP_BANDS],
    /* MASK ONLY. Swaps the artwork for a flat white column, so what is on screen
       is the MASK and nothing else — the band's top edge, the charge front and
       both feathers are directly visible and directly measurable.
       This exists because the previous attempt at a band was judged from the
       composite page, where the profile is dominated by the artwork's vertebrae:
       a change that did nothing looked like it was working, and a change that
       worked looked like it did nothing. Judge band/soft/bias here first, then
       switch back to "cards ghosted" to place it against the real cards. */
    ['mask only (flat column)',
      'main,.footer,.nav{visibility:hidden!important}' + KEEP_BANDS +
      '.spine-bg__scan,.spine-bg__bloom{display:none!important}' +
      '.spine-bg__art{background-image:linear-gradient(#FFF,#FFF)!important;' +
      'background-size:var(--spine-w) 100%!important;background-position:50% 0!important}'],
    ['spine layer off', '.spine-bg{display:none!important}'],
    /* All six star layers, not just the base sky. Before build 8 there was only
       one twinkle layer and this entry hid the sky alone, which left the cores
       flickering over black and looked like the mode had not worked. */
    ['stars off', STAR_LAYERS + '{display:none!important}'],
    /* THE BAND VIEW. Base sky and clouds off, page content hidden, amplitude
       forced to 1, so what is on screen is the four twinkle bands and nothing
       else. This is where you can actually see whether they are running out of
       phase — at the shipped 0.04 amplitude the movement is far too small to
       judge, and at desync 0 versus 1 the difference here is unmistakable.
       Forced with !important because the sliders write inline styles on <html>,
       which would otherwise win. */
    ['star bands only (amp 1)',
      'body::before,html::after{display:none!important}' +
      'main,.footer,.nav,.spine-bg{visibility:hidden!important}' + KEEP_BANDS +
      ':root{--star-twinkle:1!important;--star-twinkle-hi:1!important}'],
    ['scrims off', '.newsletter::before,main>.section::before,.track-experience::before{display:none!important}']
  ];
  var isoStyle = document.createElement('style');
  document.head.appendChild(isoStyle);
  var isoAt = 0;
  var isoRow = document.createElement('label');
  isoRow.innerHTML = '<span>hide</span>';
  var isoBtn = document.createElement('button');
  isoBtn.style.cssText = 'margin:0;flex:1;background:#1F1F1F;color:#D8D0BE;text-align:left;padding:4px 8px';
  isoBtn.textContent = ISOLATE[0][0];
  isoBtn.addEventListener('click', function () {
    isoAt = (isoAt + 1) % ISOLATE.length;
    isoStyle.textContent = ISOLATE[isoAt][1];
    isoBtn.textContent = ISOLATE[isoAt][0];
    isoBtn.style.color = isoAt ? '#F2F2EE' : '#D8D0BE';
  });
  isoRow.appendChild(isoBtn);
  box.appendChild(isoRow);

  /* ---- Paste a saved block back in ---------------------------------------
     Copy CSS is only half a round trip. Without this, restoring an earlier
     setting means typing seven numbers back into seven sliders by hand and
     getting one of them wrong. Accepts anything containing --spine-* or
     --scroll-* / --star-* lines, so a whole :root block pasted straight out of
     any of the three stylesheets works — comments, braces and unrelated properties are ignored,
     including the "css/base.css" headings Copy CSS writes. */
  var pasteWrap = document.createElement('div');
  pasteWrap.style.cssText = 'margin-top:8px';
  var paste = document.createElement('textarea');
  paste.rows = 2;
  paste.placeholder = 'paste a --spine-… block here';
  paste.style.cssText = 'width:100%;background:#0A0A0A;border:1px solid #2E2E2E;color:#D8D0BE;' +
    'font:11px/1.4 "IBM Plex Mono",monospace;padding:5px 6px;resize:vertical;box-sizing:border-box';
  var apply = document.createElement('button');
  apply.textContent = 'Apply pasted';
  apply.style.cssText = 'margin-top:4px';
  apply.addEventListener('click', function () {
    var found = 0, unknown = [];
    var re = /(--(?:spine|scroll|star)-[a-z-]+)\s*:\s*([^;\n}]+)/g, m;
    while ((m = re.exec(paste.value))) {
      var name = m[1], val = m[2].trim();
      var f = null;
      for (var i = 0; i < FIELDS.length; i++) if (FIELDS[i].v === name) f = FIELDS[i];
      if (!f) {
        /* Derived values, not controls — they are computed from the sliders and
           would be overwritten by them anyway. Ignore silently rather than
           reporting a paste of the real :root block as half-unrecognised. */
        if (name !== '--spine-build' && name !== '--spine-contrast' &&
            name !== '--star-build' && name !== '--star-twinkle-amp' && name !== '--star-cloud-amp' &&
            name !== '--band-t0' && name !== '--band-t1') unknown.push(name);
        continue;
      }
      var num = parseFloat(val);
      if (isNaN(num)) continue;
      /* Clamp to the slider's own range, otherwise an out-of-range value applies
         to the page but the slider snaps elsewhere and the two disagree. */
      num = Math.min(f.max, Math.max(f.min, num));
      document.documentElement.style.setProperty(f.v, num + f.unit);
      f._input.value = num;
      f._out.textContent = num + f.unit;
      found++;
    }
    note.textContent = found
      ? 'applied ' + found + ' value' + (found === 1 ? '' : 's') +
        (unknown.length ? ' · ignored ' + unknown.join(', ') : '')
      : 'nothing recognised — expects --spine-… lines';
  });
  pasteWrap.appendChild(paste);
  pasteWrap.appendChild(apply);

  var copy = document.createElement('button');
  copy.textContent = 'Copy CSS';
  var note = document.createElement('p');
  copy.addEventListener('click', function () {
    /* Grouped by destination file. Everything without a `file` belongs in
       spine-bg.css's :root as before; anything with one gets its own heading,
       because a value pasted into the wrong stylesheet here fails in a way that
       looks like the slider not working: spine-bg.css is loaded by index.html
       only, so a site-wide variable pasted into it silently applies to the front
       page and to nothing else. */
    var groups = {}, order = [];
    FIELDS.forEach(function (f) {
      var dest = f.file || HOME;
      if (!groups[dest]) { groups[dest] = []; order.push(dest); }
      groups[dest].push('  ' + f.v + ': ' + f._input.value + f.unit + ';');
    });
    var text = order.map(function (dest) {
      return (order.length > 1 ? '/* ' + dest + ' */\n' : '') + groups[dest].join('\n');
    }).join('\n\n');
    (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject())
      .then(function () { note.textContent = 'copied — paste into :root'; })
      .catch(function () { note.textContent = text; });
  });
  box.appendChild(copy);
  box.appendChild(pasteWrap);
  box.appendChild(note);
  document.body.appendChild(box);

  /* The mobile media query sets its own values. Anything dialled here is an
     inline style on <html>, which outranks it — so a phone-width window shows
     the desktop numbers you are dragging, not the mobile ones. Say so rather
     than let it look like the media query is broken. */
  var warn = function () {
    note.textContent = window.innerWidth <= 600
      ? 'note: below 600px the media query is being overridden by these sliders'
      : '';
  };
  window.addEventListener('resize', warn);
  warn();
})();
