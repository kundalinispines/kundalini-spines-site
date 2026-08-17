/* ==========================================================================
   FILM-ROW ATMOSPHERE — the switch, the glow's scroll response, and the tuner.

   Three layers dissolve the two scrubbed film rows into the nebula.  This file
   owns none of their look; it owns whether they apply and how they are dialled:

     1. FEATHER  css/filmrow-atmos.css  .has-fr-feather + data-fr-mask
     2. GLOW     css/filmrow-atmos.css  .has-fr-glow + --fr-glow-* + --fr-focus
     3. FOREGROUND  js/filmrow-atmos-fg.js + css/filmrow-atmos-fg.css,
        a standalone module mounted through KSFilmrowFG.attach(figure, opts).

   Read css/filmrow-atmos.css before changing anything here: it carries the
   measurements behind every number, the argument for masking the <video> and
   not the figure, and the reason the scroll response drives `opacity` rather
   than the gradients' alphas.

   -------------------------------------------------------------------------
   THE SHIP FLAG
   -------------------------------------------------------------------------
   LIVE is false on purpose.  The owner has not approved the look for the
   public site (Aug 16 2026), so a visitor gets the page exactly as it was:
   no classes added, no listeners bound, no canvas mounted, nothing measured.
   At /?tune the layers apply regardless, so they can be judged on the real
   page against the real nebula rather than in a lab.

   Turning it on later is the one line below.  Nothing else needs editing.

   -------------------------------------------------------------------------
   ONE THING HERE IS A WORKAROUND, NOT A DESIGN: the glow layer's ::before
   reaches 90% of the figure's width past its right edge, which puts 499px of
   SCROLLABLE overflow on the document and lets a trackpad swipe slide the whole
   site sideways.  index.html now carries the real fix in its head --
   `main { overflow-x: clip }`, on `main` and NOT on `body`, which was tried
   first and measurably does not work.  overflowGuard() below injects the same
   rule while the glow is applied, so the effect stays self-contained on any
   page that takes the stylesheet without that line; on index.html it is
   redundant. The measurements for all of it are at overflowGuard().

   -------------------------------------------------------------------------
   THE ONE HARD CONSTRAINT: BOTH CLIPS ARE SCRUBBED BY THE SCROLL.
   -------------------------------------------------------------------------
   js/spine-doc.js maps scroll position onto video.currentTime for every
   .ksd-filmrow__media video.  Nothing in this file touches the <video>: no
   listener on it, no read or write of currentTime, and the focus measurement
   is taken off the FIGURE.  The figure is the scrub's parent, so measuring it
   costs the same rect the scrub already forces and nothing extra.

   Measured Aug 16 2026 in Chrome at 1440x900, index.html, a 24-step scroll
   sequence sampling video.currentTime at each step, run with the layers off
   and then on: the two sequences agreed to 0.000s at every step on both clips.
   The scrub's own write threshold is 1/48s (0.0208s), so anything under that
   would have been noise anyway; there was nothing to be noise.

   -------------------------------------------------------------------------
   WHY --fr-focus IS NOT THE SCRUB'S WINDOW
   -------------------------------------------------------------------------
   Three different mappings of scroll position now exist on this element and
   that is deliberate — see the DELIBERATE block at the top of
   css/filmrow-atmos.css.  The scrub runs on a re-normalised (p - 0.10) / 0.70
   slice of the element's travel; the foreground module carries its own copy of
   that for parallax; this file's --fr-focus is the distance from the FIGURE's
   centre to the viewport's centre, peaking at 1 when the row is centred.
   Reflected light is about whether the thing is in front of you, not about
   where the clip is in its own timeline.  Do not unify them.

   -------------------------------------------------------------------------
   THE TUNER
   -------------------------------------------------------------------------
   A `Film` tab on the shared shell (js/tune-panel.js), merging what used to be
   two separate lab panels — filmrow-atmos-lab.html (feather + glow) and
   filmrow-fg-lab.html (foreground).  Off /?tune, KSTunePanel.tab() returns null
   and none of it is built.

   EVERY CONTROL STARTS FROM THE COMMITTED VALUE, READ FROM WHERE IT IS
   COMMITTED — the stylesheet through the CSSOM, the foreground module through
   KSFilmrowFG.defaults, the mask variant off the markup.  There is not one
   duplicated number in this file.  See readShipped() for why that matters more
   than it looks like it should.

   Dialled values persist under localStorage 'ks.filmrowAtmos', read only at
   /?tune, and the note line names anything that differs from the files.

   TWO PARAMETERS ARE NOT IN THE TAB, AND CANNOT BE.  The feather mask's `depth`
   and `softness` are baked into the PNG by scripts/make-filmrow-mask.py; at
   runtime there is only an image, and its depth is not recoverable from it.
   Re-deriving them would mean re-implementing the whole generator in JS, which
   filmrow-atmos-lab.html already does and pays for with a parity check against
   the baked file — that belongs in a lab, not on the live page.  What this tab
   does instead is print the bake command line in Copy values, carrying the
   values the shipped PNGs were baked at, so the round trip is one paste.

   The mask VARIANT is tunable, because that is just which baked file is used.
   It moves as a PAIR: row 1 takes the variant, row 2 takes the next one, the
   same rule the lab's seed slider used.  Two rows wearing the same silhouette
   down one page reads as a frame, which is the thing being removed.
   ========================================================================== */
(function () {
  'use strict';

  /* ---- THE SHIP FLAG ---------------------------------------------------- */

  var LIVE = false;   // false = layers apply only at /?tune; true = every visitor sees them

  /* Which layers ship when LIVE goes true.  Separate from LIVE because the
     owner may well approve the feather and the glow — which are static paint —
     before approving a canvas that animates in front of the footage.  This
     literal is the shipped source of truth in the js/clouds-sky.js sense: the
     tuner never rewrites it, so reading this file still tells you what a
     visitor gets, and Copy values prints it ready to replace. */
  var LAYERS = { feather: true, glow: true, fg: true };

  /* Where the panel's dialled values persist, for this browser only, and read
     only at /?tune.  DECLARED UP HERE, NOT NEXT TO THE PANEL CODE THAT USES IT,
     and that is not tidiness — restore() runs before the runtime mounts anything
     and therefore before the panel section of this file is reached.  With the
     declaration down there, `var` hoisting made STORE_KEY *exist* but hold
     undefined at that point, so getItem(undefined) looked up the key "undefined",
     got null, and restore() returned having done nothing.  No error, no warning:
     tuning simply stopped surviving a reload, which reads as "the panel forgot",
     not as a bug.  Caught by testing the reload rather than by reading the code. */
  var STORE_KEY = 'ks.filmrowAtmos';

  /* ---- GATE ------------------------------------------------------------- */

  /* Read as DATA and never as a regex — js/tune-panel.js explains why (a
     word-boundary escape in a guard like this once got rewritten into a literal
     backspace, giving a pattern that could never match and was invisible in
     every diff).  Read independently of the shell rather than through
     KSTunePanel.on so the runtime still gates correctly if the shell is ever
     dropped from a page that keeps this file. */
  var TUNE = new URLSearchParams(location.search).has('tune');
  if (!LIVE && !TUNE) return;

  var rows = [].slice.call(document.querySelectorAll('.ksd-filmrow__media'));
  if (!rows.length) return;

  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduced = mqReduce.matches;

  var FG = window.KSFilmrowFG;
  var hasFG = !!(FG && typeof FG.attach === 'function');

  /* ==========================================================================
     THE SHIPPED VALUES ARE READ, NEVER RETYPED.

     Not one number the panel starts from is a literal in this file.  Every one
     is read from the place that actually ships it:

       glow          the declarations in css/filmrow-atmos.css, through the
                     CSSOM, falling back to the computed style
       foreground    window.KSFilmrowFG.defaults
       mask variant  the data-fr-mask attribute in index.html
       bake          not read at all — Copy values prints the command WITHOUT
                     --depth/--softness so scripts/make-filmrow-mask.py's own
                     defaults stay the only copy of them

     A duplicate would drift the first time someone retunes the stylesheet, and
     the failure is silent in the worst way: the tab would go on reporting
     "matches the files" while showing something else, and Reset would put the
     stale number back into a live page.  Cost of reading instead: one CSSOM
     walk at /?tune, once.
     ========================================================================== */

  /* THE CSSOM, not the computed style, for the declared glow numbers.  Two
     reasons.  --fr-glow-resp is pinned to 0 by the reduced-motion query in
     css/filmrow-atmos.css, so under that preference the computed value is 0 and
     Copy values would print `--fr-glow-resp: 0.00` — a panel quietly rewriting
     the stylesheet's committed value.  And the computed value of
     --fr-glow-scale is the substituted token stream, where what belongs in the
     file is the calc() as written.  The computed style is still the fallback,
     and it cannot fail to answer: all four are @property-typed with initial
     values, so a missing declaration resolves to the initial rather than to
     nothing. */
  function declared() {
    var out = {}, sheets = document.styleSheets, i, j, rules, r;
    for (i = 0; i < sheets.length; i++) {
      var href = sheets[i].href || '';
      if (href.indexOf('filmrow-atmos.css') < 0) continue;
      try { rules = sheets[i].cssRules; } catch (e) { continue; }   /* cross-origin */
      if (!rules) continue;
      for (j = 0; j < rules.length; j++) {
        r = rules[j];
        /* The BASE rule only. Anything inside a media query is a context, not
           the committed value — see --fr-glow-resp above. */
        if (!r.style || r.selectorText !== '.ksd-filmrow__media') continue;
        ['--fr-glow-grow', '--fr-glow-base', '--fr-glow-resp',
         '--fr-glow-scale'].forEach(function (p) {
          var v = r.style.getPropertyValue(p);
          if (v !== '' && v != null) out[p] = v.trim();
        });
      }
    }
    return out;
  }

  /* The computed values as they stand BEFORE anything here writes an inline
     property — the only moment the element can be asked what the files say.
     Copied out as strings: getComputedStyle returns a LIVE object, so holding
     the object and reading it after the first slider move would hand back the
     tuned value and call it the shipped one. */
  var atLoad = (function () {
    var cs = getComputedStyle(rows[0]), o = {};
    ['--fr-glow-grow', '--fr-glow-base', '--fr-glow-resp',
     '--fr-glow-scale'].forEach(function (p) { o[p] = cs.getPropertyValue(p).trim(); });
    return o;
  })();

  /* The mask variant, off the markup, before the tuner can write over it. */
  var MARKUP_MASK = parseInt(rows[0].getAttribute('data-fr-mask'), 10) || 1;

  /* Re-derives the whole shipped snapshot from the sources above.  Called at
     load AND by Reset, so Reset restores what the files say NOW rather than
     replaying a snapshot taken at some other moment. */
  function readShipped() {
    var d = declared();
    var num = function (p, fallback) {
      var v = parseFloat(d[p] != null ? d[p] : atLoad[p]);
      return isFinite(v) ? v : fallback;
    };
    return {
      feather: LAYERS.feather,
      glow: LAYERS.glow,
      fg: LAYERS.fg,
      maskVariant: MARKUP_MASK,
      glowGrow: num('--fr-glow-grow', 0.2),
      /* IN TUNING MULTIPLES, which is not the CSS's unit.  The stylesheet draws
         every gradient at twice its tuned alpha and halves the layer back with
         --fr-glow-base, so the file's 0.5 is 1.00x on the slider.  The owner
         judges the multiple; applyGlow and Copy values do the halving.  Same
         convention filmrow-atmos-lab.html used, so a value dialled in either
         place means the same thing in the other. */
      glowBase: num('--fr-glow-base', 0.5) * 2,
      glowResp: num('--fr-glow-resp', 0.35),
      /* Text, not a number: printed back into the file verbatim so Copy values
         cannot invent a formula the stylesheet does not use. */
      glowScaleDecl: d['--fr-glow-scale'] || 'calc(0.5 + 2.5 * var(--fr-glow-grow))',
      fgOpts: fgShipped()
    };
  }

  /* The foreground layer's shipped values are the MODULE's defaults, snapshotted
     into a plain object so nothing here can write through to them.
     js/filmrow-atmos-fg.js publishes them for exactly this reason: a hand-copied
     duplicate goes stale the first time the module is retuned.  attach() is
     therefore called with only the keys that DIFFER from those defaults; at rest
     that is nothing at all, and Copy values says so. */
  function fgShipped() {
    var d = (FG && FG.defaults) || {};
    var e = d.edges || {};
    return {
      intensity: d.intensity, density: d.density, spill: d.spill,
      reach: d.reach, parallax: d.parallax, drift: d.drift,
      wisps: d.wisps, motes: d.motes, edgeFeather: d.edgeFeather,
      edges: { top: e.top, right: e.right, bottom: e.bottom, left: e.left }
    };
  }

  /* ---- STATE ------------------------------------------------------------
     Everything the tab can move, in one object, so Reset is a copy and the note
     line is a diff.  Only the tuner ever changes it. */
  var SHIPPED = readShipped();

  function cloneState(src) {
    var o = {}, k;
    for (k in src) if (src.hasOwnProperty(k) && k !== 'fgOpts') o[k] = src[k];
    o.fgOpts = {};
    for (k in src.fgOpts) {
      if (!src.fgOpts.hasOwnProperty(k)) continue;
      o.fgOpts[k] = (k === 'edges') ? {
        top: src.fgOpts.edges.top, right: src.fgOpts.edges.right,
        bottom: src.fgOpts.edges.bottom, left: src.fgOpts.edges.left
      } : src.fgOpts[k];
    }
    return o;
  }

  var state = cloneState(SHIPPED);

  /* Persisted tuning is read BEFORE the runtime applies anything, so a tuned
     page mounts once with the tuned values instead of mounting the files' and
     then tearing the foreground down and rebuilding it a tick later.  Gated on
     the shell as well as on /?tune: with no panel there is nothing to explain a
     value that is not in any file, and an unexplainable difference is exactly
     what the note line exists to prevent. */
  var TUNING = TUNE && !!(window.KSTunePanel && window.KSTunePanel.on);
  if (TUNING) restore();

  /* ==========================================================================
     THE RUNTIME
     ========================================================================== */

  function applyToggles() {
    rows.forEach(function (el) {
      el.classList.toggle('has-fr-feather', !!state.feather);
      el.classList.toggle('has-fr-glow', !!state.glow);
    });
    overflowGuard(!!state.glow);
  }

  /* ==========================================================================
     WORKAROUND — DELETE THIS ONCE index.html CARRIES THE ONE-LINE FIX.

     THE GLOW LAYER MAKES THE PAGE SCROLL SIDEWAYS.  .has-fr-glow::before is
     `position:absolute; inset:-90%`, so it reaches 90% of the figure's width
     past the figure on every side.  The figure is the right-hand column of
     .ksd-filmrow, so the right-hand reach lands outside the viewport and lands
     in the document's SCROLLABLE overflow.  Measured Aug 16 2026 on index.html,
     scrolled to the first film row, by toggling one class at a time:

         layers                     documentElement.scrollWidth - clientWidth
         none / feather only              0px  (1440 wide)     0px  (390 wide)
         foreground only                  0px                  0px
         GLOW ON                        499px                241px

     499px is 0.9 x the 554px figure, which is the ::before's right-hand reach
     exactly.  The foreground module is NOT involved — it clamps its own spill
     per side at measure time, and that clamp holds.

     It is not theoretical and it is not just a number: `window.scrollBy(500,0)`
     and a real horizontal wheel gesture both moved the page to scrollX 499.  It
     reads as the whole site sliding off its axis under a trackpad swipe.  It
     does not show up in a screenshot, and the first pass here did not notice it
     because at scrollX 0 nothing looks wrong.

     THE FIX NOW LIVES IN index.html — `main { overflow-x: clip; }` in its head.

     IT IS `main`, NOT `body`, AND THAT CORRECTION IS MEASURED.  This guard
     originally injected `body{overflow-x:clip}` on the reasoning that body's
     overflow propagates to the viewport.  It does not do so here: with the rule
     in the page, body computed to `clip` and `scrollBy(500,0)` STILL moved the
     page to scrollX 499.  Tried on every candidate ancestor at 1440x900,
     Aug 16 2026 — body does not stop it; `html`, `main`, `.ksd-doc`,
     `.ksd-doc__col` and `.ksd-filmrow` all do.  `main` wins because it is the
     narrowest scope that is still exactly viewport-wide (1440 at left 0), so it
     clips only what was already off-screen and leaves root overflow semantics
     alone; the last two start at x=136 and would cut glow that is still
     visible in the left margin.

     One correction, recorded so it is not re-derived: `html` was briefly
     rejected for collapsing the cloud canvas to 0x0.  It does not.
     js/clouds-sky.js builds a hidden `src` canvas before the visible `out`
     one, and `.ks-cloud-sky canvas` selects the hidden one — the visible canvas
     measures 1440x900 with or without the clip.

     CLIP, NOT HIDDEN — overflow-x:hidden computes overflow-y to `auto`, which
     makes the element a scroll container, and a scroll container becomes the
     nearest scrolling ancestor for anything position:sticky inside it.  On
     `main` that is the rail.  `clip` clips without creating one.

     This guard is kept because it travels with the glow: any page that takes
     css/filmrow-atmos.css without the head rule gets the clip anyway, and it is
     removed again the moment the glow layer is switched off.  On index.html it
     is simply redundant with the page's own line.  Feature-gated because there
     is no acceptable fallback — `hidden` would trade a sideways scroll for a
     broken sticky rail.
     ========================================================================== */
  var guardEl = null;
  function overflowGuard(on) {
    var can = window.CSS && CSS.supports && CSS.supports('overflow-x', 'clip');
    if (on && !guardEl && can) {
      guardEl = document.createElement('style');
      guardEl.setAttribute('data-fr-overflow-guard', '');
      guardEl.textContent = 'main{overflow-x:clip}';
      document.head.appendChild(guardEl);
    } else if (!on && guardEl) {
      guardEl.parentNode.removeChild(guardEl);
      guardEl = null;
    }
  }

  /* Row 1 takes the variant, row 2 the next one, wrapping at 3 — the three
     baked masks come from three seeds precisely so the rows differ. */
  function maskFor(i) { return ((state.maskVariant - 1 + i) % 3 + 3) % 3 + 1; }

  function applyMask() {
    rows.forEach(function (el, i) {
      el.setAttribute('data-fr-mask', String(maskFor(i)));
    });
  }

  /* WRITE NOTHING AT THE SHIPPED VALUE — remove the inline property instead, so
     the stylesheet owns it again.  An inline style outranks the media query in
     css/filmrow-atmos.css, and this is the same trap the lab fell into: it wrote
     --fr-glow-resp inline from its slider, which beat
     `@media (prefers-reduced-motion: reduce) { --fr-glow-resp: 0 }`, so the lab
     reported 0.35 where the shipped page had 0.  Removing rather than restating
     also makes the tab's "matches the file" claim literally true in the
     computed style, not merely arithmetically true.

     Only ever called from the tuner.  With no tuner the stylesheet is untouched
     and there is not one inline property on the figures. */
  function applyGlow() {
    rows.forEach(function (el) {
      setVar(el, '--fr-glow-grow', state.glowGrow, SHIPPED.glowGrow);
      setVar(el, '--fr-glow-base', state.glowBase * 0.5, SHIPPED.glowBase * 0.5);
      /* Under reduced motion the stylesheet pins this to 0 and the field holds
         full brightness; the tab shows a note instead of a slider. */
      if (!reduced) setVar(el, '--fr-glow-resp', state.glowResp, SHIPPED.glowResp);
    });
  }

  function setVar(el, name, value, shippedValue) {
    if (value === shippedValue) el.style.removeProperty(name);
    else el.style.setProperty(name, value);
  }

  /* ---- the foreground module ------------------------------------------- */

  var fgHandles = [];

  /* Only the keys that differ from the module's defaults, so the module keeps
     owning its own tuning.  Returns null when nothing differs. */
  function fgOverrides() {
    var out = null, k;
    for (k in state.fgOpts) {
      if (!state.fgOpts.hasOwnProperty(k)) continue;
      if (k === 'edges') {
        var eOut = null;
        for (var e in state.fgOpts.edges) {
          if (state.fgOpts.edges[e] !== SHIPPED.fgOpts.edges[e]) {
            eOut = eOut || {};
            eOut[e] = state.fgOpts.edges[e];
          }
        }
        /* Partial edge maps are fine — the module normalises whatever it is
           given — but a partial map would leave the untouched edges at THEIR
           defaults rather than at what the tab shows, which is only the same
           thing by luck.  Send the whole map whenever any edge moved. */
        if (eOut) { out = out || {}; out.edges = state.fgOpts.edges; }
        continue;
      }
      if (state.fgOpts[k] !== SHIPPED.fgOpts[k]) { out = out || {}; out[k] = state.fgOpts[k]; }
    }
    return out;
  }

  /* Every key the tab owns, at its current value.  setOptions MERGES into the
     module's live options, so a live update must send the WHOLE set and never
     the sparse diff: push spill and intensity both off default, then put
     intensity back, and the diff no longer mentions intensity — the module
     would keep the old one forever.  Found by reasoning about the merge, which
     is cheaper than finding it as "one slider stopped working". */
  function fgFull() {
    var o = {}, k;
    for (k in state.fgOpts) {
      if (!state.fgOpts.hasOwnProperty(k)) continue;
      o[k] = (k === 'edges') ? {
        top: state.fgOpts.edges.top, right: state.fgOpts.edges.right,
        bottom: state.fgOpts.edges.bottom, left: state.fgOpts.edges.left
      } : state.fgOpts[k];
    }
    return o;
  }

  function applyFG() {
    if (!hasFG) return;
    if (state.fg && !fgHandles.length) {
      /* Sparse on ATTACH, because attach() merges onto the module's DEFAULTS —
         so the module keeps owning every value the tab has not moved. */
      fgHandles = rows.map(function (el) { return FG.attach(el, fgOverrides() || {}); })
                      .filter(Boolean);
    } else if (state.fg && fgHandles.length) {
      var o = fgFull();
      fgHandles.forEach(function (h) { h.setOptions(o); });
    } else if (!state.fg && fgHandles.length) {
      fgHandles.forEach(function (h) { h && h.destroy && h.destroy(); });
      fgHandles = [];
    }
  }

  /* ---- focusPass — the glow's scroll response ---------------------------
     Ported verbatim from filmrow-atmos-lab.html, which marks it as the only
     script the shipped effect wants.  focus is 1 when the figure's centre sits
     on the viewport's centre and falls to 0 as it leaves.  One passive scroll
     listener coalesced into one rAF, writing one custom property that only
     feeds a colour — no layout is invalidated and no raster is redone; the
     property is typed <number> in css/filmrow-atmos.css so `opacity` stays a
     compositor-only change while it moves.

     WITHOUT THIS EVERYTHING STILL WORKS: --fr-focus stays 0 and the field sits
     at 65% of full at the shipped --fr-glow-resp.  It is the optional part.

     Reduced motion opts out entirely — scroll-linked motion is exactly what the
     preference declines — and css/filmrow-atmos.css pins --fr-glow-resp to 0 in
     the same query, so the field holds FULL brightness rather than dimming to
     something the visitor cannot explain. */
  var focusRAF = 0;
  function focusPass() {
    focusRAF = 0;
    var vh = window.innerHeight;
    rows.forEach(function (el) {
      var b = el.getBoundingClientRect();
      var d = Math.abs((b.top + b.height / 2) - vh / 2);
      var f = 1 - Math.min(1, d / (vh / 2 + b.height / 2));
      el.style.setProperty('--fr-focus', f.toFixed(3));
    });
  }
  function queueFocus() { if (!focusRAF) focusRAF = requestAnimationFrame(focusPass); }

  applyToggles();
  applyFG();
  if (!reduced) {
    window.addEventListener('scroll', queueFocus, { passive: true });
    window.addEventListener('resize', queueFocus);
    focusPass();
  }

  /* ==========================================================================
     THE TUNING PANEL — a tab on the shared shell, only ever at /?tune.

     Values dialled here persist for this browser, the bargain js/clouds-sky.js
     and the footer torch already make: the cache-busting workflow reloads
     constantly and a panel that forgets on every reload cannot be used to judge
     anything.  The store is only ever READ at /?tune, so a persisted value can
     never reach a visitor.  Reset puts the files' values back, and the note line
     says plainly whenever the live page is running on something other than what
     is committed — a persisted value the owner had forgotten has read as "the
     site changed" before.
     ========================================================================== */

  var Panel = window.KSTunePanel;
  if (!Panel) return;
  var body = Panel.tab('film', 'Film', 'the film-row atmosphere: feather, glow, foreground');
  if (!body) return;

  /* The runtime above already applied the classes and mounted the foreground
     from the restored state. These two are tuner-only — nothing writes
     data-fr-mask or an inline --fr-glow-* on a page without the panel. */
  applyMask();
  applyGlow();

  var paints = [];
  var note;

  /* ---- FEATHER ---------------------------------------------------------- */

  var fSec = Panel.section(body, 'film-feather', 'Feather');
  paints.push(Panel.toggle(fSec, 'feather layer',
    function () { return state.feather; },
    function (v) { state.feather = v; applyToggles(); sync(); }));
  paints.push(Panel.slider(fSec, {
    label: 'mask pair', min: 1, max: 3, step: 1,
    fmt: function (v) { return maskFor(0) + ' / ' + maskFor(1); },
    tip: 'Which baked mask each row wears. Three variants are baked from three ' +
         'seeds; row 1 takes this one and row 2 the next, so the two silhouettes ' +
         'are never the same. Writes data-fr-mask on the figures.'
  }, function () { return state.maskVariant; },
     function (v) { state.maskVariant = v; applyMask(); sync(); }));
  Panel.note(fSec, 'depth and softness are baked into the PNG by ' +
    'scripts/make-filmrow-mask.py and cannot be read back at runtime — Copy ' +
    'values prints the bake command for them.');

  /* ---- GLOW ------------------------------------------------------------- */

  var gSec = Panel.section(body, 'film-glow', 'Glow');
  paints.push(Panel.toggle(gSec, 'glow layer',
    function () { return state.glow; },
    function (v) { state.glow = v; applyToggles(); sync(); }));
  paints.push(Panel.slider(gSec, {
    label: 'size', min: 0.15, max: 0.25, step: 0.01,
    fmt: function (v) { return '+' + Math.round(v * 100) + '%'; },
    tip: 'How much bigger the glow field is than the clip (--fr-glow-grow). It ' +
         'scales the LOBES: the ::before box is fixed at 2.8x the clip so no lobe ' +
         'is ever clipped by it. See the box note in css/filmrow-atmos.css.'
  }, function () { return state.glowGrow; },
     function (v) { state.glowGrow = v; applyGlow(); sync(); }));
  paints.push(Panel.slider(gSec, {
    label: 'intensity', min: 0, max: 2, step: 0.05,
    fmt: function (v) { return Number(v).toFixed(2) + 'x'; },
    tip: 'Master dimmer, in multiples of the measured tuning. 1.00x is the tuning ' +
         '(--fr-glow-base 0.5); lobe peaks run 5-13% alpha there. It drives the ' +
         'layer’s opacity, not the gradient alphas, so moving it costs no repaint.'
  }, function () { return state.glowBase; },
     function (v) { state.glowBase = v; applyGlow(); sync(); }));
  if (reduced) {
    Panel.note(gSec, 'scroll resp: off. prefers-reduced-motion is on, so ' +
      'css/filmrow-atmos.css pins --fr-glow-resp to 0 and the field holds full ' +
      'intensity. No slider here, because a slider that moves and does nothing ' +
      'is worse than none.');
  } else {
    paints.push(Panel.slider(gSec, {
      label: 'scroll resp', min: 0, max: 1, step: 0.05,
      fmt: function (v) { return Math.round(v * 100) + '%'; },
      tip: 'How much of the intensity the scroll owns (--fr-glow-resp). 0.35 means ' +
           'the field sits at 65% away from focus and reaches 100% when the row is ' +
           'centred. A fraction OF the base, so the field never goes dark.'
    }, function () { return state.glowResp; },
       function (v) { state.glowResp = v; applyGlow(); sync(); }));
  }

  /* ---- FOREGROUND ------------------------------------------------------- */

  var xSec = Panel.section(body, 'film-fg', 'Foreground');
  if (!hasFG) {
    Panel.note(xSec, 'js/filmrow-atmos-fg.js is absent — no foreground layer to ' +
      'tune. It must load BEFORE this file.');
  } else {
    paints.push(Panel.toggle(xSec, 'foreground layer',
      function () { return state.fg; },
      function (v) { state.fg = v; applyFG(); sync(); }));

    /* Ranges are the module's documented useful ones; the VALUES come from
       KSFilmrowFG.defaults, never from a copy kept here. */
    var FG_FIELDS = [
      ['intensity', 0, 1, 0.01, 'Master dimmer on every particle. The one to pull if it ever looks like dirt. Screen cannot subtract, so no setting of this can put grime on the footage.'],
      ['density', 0, 2, 0.05, 'Multiplies both populations. Above ~1.6 the clumps merge into a continuous band and the edge comes back as a soft border.'],
      ['spill', 0, 160, 1, 'How far material reaches OUTWARD past the boundary, in CSS px. Clamped per side at measure time so it can never push the page wider than the viewport.'],
      ['edgeFeather', 0, 120, 1, 'How far the field dissolves at the outer border of its own canvas, in CSS px. This is what stops the layer reading as a box: a wisp is a sprite up to ~490px long placed by its centre, so without a feather the canvas cuts the tails off square. Added outside the spill, so raising it does not eat the crossing. 0 restores the square cut.'],
      ['reach', 0, 0.45, 0.01, 'How far material reaches INWARD, as a fraction of the box’s short side. The readability guard: at 0.30 the middle 40% is clear before falloff.'],
      ['parallax', 0, 0.6, 0.01, 'Lag against the scrub, as a fraction of the box height over the element’s whole pass. Above ~0.45 the field visibly slides and stops reading as atmosphere.'],
      ['drift', 0, 2, 0.05, 'Autonomous sway, running whether or not anyone scrolls. 0 freezes it, which is also what reduced motion forces. 1 is about one cycle per 30s.'],
      ['wisps', 0, 24, 1, 'The big soft smoke forms — they do the dissolving. Population before density.'],
      ['motes', 0, 240, 1, 'The small dust and star points — they do the "in front of a lens" read. Population before density.']
    ];
    FG_FIELDS.forEach(function (f) {
      var k = f[0];
      paints.push(Panel.slider(xSec, {
        label: k, min: f[1], max: f[2], step: f[3], tip: f[4]
      }, function () { return state.fgOpts[k]; },
         function (v) { state.fgOpts[k] = v; applyFG(); sync(); }));
    });

    /* EDGES: which sides carry material, as a share of the population. Left is
       0 by default because at desktop the media is the right-hand column and its
       left edge faces the copy, where added light lands on type. */
    ['top', 'right', 'bottom', 'left'].forEach(function (e) {
      paints.push(Panel.slider(xSec, {
        label: 'edge ' + e, min: 0, max: 1, step: 0.05,
        tip: e === 'left'
          ? 'Share of the population on the left edge. 0 by default: at desktop that edge faces the copy column and added light there lands on type.'
          : 'Share of the population on the ' + e + ' edge. 0 leaves it bare.'
      }, function () { return state.fgOpts.edges[e]; },
         function (v) { state.fgOpts.edges[e] = v; applyFG(); sync(); }));
    });
  }

  /* ---- RESET / COPY / NOTE ---------------------------------------------- */

  var btnRow = Panel.row(body);
  Panel.button(btnRow, 'Reset', function () {
    /* Re-read rather than replay: the stylesheet and the module are the sources,
       and they are read again here so a Reset after an edit-and-reload puts back
       what the files say now. */
    SHIPPED = readShipped();
    state = cloneState(SHIPPED);
    applyToggles(); applyMask(); applyGlow(); applyFG();
    if (!reduced) focusPass();
    sync();
  });
  var copyBtn = Panel.button(btnRow, 'Copy values', function () {
    Panel.copy(copyBtn, note, copyText(), 'Copy values');
  });
  note = Panel.note(body, '');

  /* THE EXACT EDITS, NOT THE NUMBERS ALONE — a value without its home is a note
     somebody has to decode later.  This effect lands in four places (a bake, a
     stylesheet, the markup and this file), so all four come out, in the order
     they have to be done in. */
  function copyText() {
    var a = maskFor(0), b = maskFor(1);
    var cls = 'ksd-filmrow__media' +
      (state.feather ? ' has-fr-feather' : '') + (state.glow ? ' has-fr-glow' : '');
    var out = [
      '# 1. the baked masks. depth and softness are NOT tunable in the panel —',
      '#    they live in the PNG, and scripts/make-filmrow-mask.py holds the only',
      '#    copy of the values the shipped ones were baked at. No --depth or',
      '#    --softness here on purpose: bare, this reproduces them exactly. Pass',
      '#    the flags to change them, then reload to see it.',
      'python scripts/make-filmrow-mask.py --seed ' + a,
      'python scripts/make-filmrow-mask.py --seed ' + b,
      '',
      '/* 2. css/filmrow-atmos.css — the glow numbers on .ksd-filmrow__media.',
      '   --fr-mask is NOT printed: the stylesheet already maps data-fr-mask 1/2/3',
      '   onto the three baked files, so the variant belongs in the markup below',
      '   and restating it here would repoint the "1" case at the wrong PNG. */',
      '.ksd-filmrow__media {',
      '  --fr-glow-grow: ' + state.glowGrow.toFixed(2) + ';',
      '  --fr-glow-scale: ' + SHIPPED.glowScaleDecl + ';',
      '  /* ' + state.glowBase.toFixed(2) + 'x the tuning; the gradients are drawn at 2x, so halve it */',
      '  --fr-glow-base: ' + (state.glowBase * 0.5).toFixed(3) + ';',
      '  --fr-glow-resp: ' + state.glowResp.toFixed(2) + ';',
      '  --fr-focus: 0;',
      '}',
      '',
      '<!-- 3. index.html — the two figures. The has-fr-* classes are added at',
      '     runtime by js/filmrow-atmos.js and are shown here only so the intended',
      '     state is legible; put them in the markup only if the layers should',
      '     survive with script off. data-fr-* DO belong in the markup. -->',
      '<figure class="' + cls + '" data-fr-mask="' + a + '" data-fr-glow="black-tide">',
      '<figure class="' + cls + '" data-fr-mask="' + b + '" data-fr-glow="spine-frequency">',
      '',
      '/* 4. js/filmrow-atmos.js — the ship flag and which layers ship */',
      'var LIVE = ' + (LIVE ? 'true' : 'false') + ';   // ' +
        (LIVE ? 'every visitor sees them' : 'set true to show every visitor'),
      'var LAYERS = { feather: ' + !!state.feather + ', glow: ' + !!state.glow +
        ', fg: ' + !!state.fg + ' };'
    ];
    var o = fgOverrides();
    out.push('');
    out.push('/* 5. js/filmrow-atmos.js — the foreground module\'s options. */');
    if (!o) {
      out.push('/* Nothing differs from KSFilmrowFG.defaults — leave fgShipped() alone. */');
    } else {
      out.push('/* These differ from KSFilmrowFG.defaults. Either paste them as the');
      out.push('   overrides in fgShipped(), or better, move them into DEFAULTS in');
      out.push('   js/filmrow-atmos-fg.js so the module stays the one source. */');
      out.push(JSON.stringify(o, null, 2));
    }
    return out.join('\n');
  }

  /* ---- sync: repaint, persist, and say what is off the file -------------- */

  function drift() {
    var off = [], k;
    for (k in SHIPPED) {
      if (!SHIPPED.hasOwnProperty(k) || k === 'fgOpts') continue;
      if (state[k] !== SHIPPED[k]) off.push(k);
    }
    for (k in SHIPPED.fgOpts) {
      if (!SHIPPED.fgOpts.hasOwnProperty(k)) continue;
      if (k === 'edges') {
        for (var e in SHIPPED.fgOpts.edges) {
          if (state.fgOpts.edges[e] !== SHIPPED.fgOpts.edges[e]) off.push('edge ' + e);
        }
      } else if (state.fgOpts[k] !== SHIPPED.fgOpts[k]) off.push('fg ' + k);
    }
    return off;
  }

  function sync() {
    paints.forEach(function (p) { p(); });
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {}
    var off = drift();
    note.innerHTML = off.length
      ? 'live values differ from the files: <em>' + off.join(', ') + '</em> &middot; Reset restores'
      : 'matches the files &middot; persisted &middot; /?tune only' +
        (LIVE ? '' : ' &middot; <em>LIVE is false</em>, so a visitor sees none of this');
  }

  /* Read key by key against SHIPPED rather than trusting the blob: a store
     written by an older build can be missing keys, carry ones that no longer
     exist, or hold a string where a number belongs, and any of those would
     otherwise reach setOptions and the stylesheet unchecked. */
  function restore() {
    var raw;
    try { raw = localStorage.getItem(STORE_KEY); } catch (e) { return; }
    if (!raw) return;
    var saved;
    try { saved = JSON.parse(raw); } catch (e) { return; }
    if (!saved || typeof saved !== 'object') return;
    for (var k in SHIPPED) {
      if (!SHIPPED.hasOwnProperty(k) || k === 'fgOpts') continue;
      if (typeof saved[k] === typeof SHIPPED[k]) state[k] = saved[k];
    }
    var sf = saved.fgOpts;
    if (!sf || typeof sf !== 'object') return;
    for (var f in SHIPPED.fgOpts) {
      if (!SHIPPED.fgOpts.hasOwnProperty(f)) continue;
      if (f === 'edges') {
        if (!sf.edges || typeof sf.edges !== 'object') continue;
        for (var e in SHIPPED.fgOpts.edges) {
          if (typeof sf.edges[e] === 'number') state.fgOpts.edges[e] = sf.edges[e];
        }
      } else if (typeof sf[f] === 'number') {
        state.fgOpts[f] = sf[f];
      }
    }
  }

  sync();

  /* Reachable from the console and from the Playwright checks. */
  /* Functions, not references: Reset REPLACES both objects, so a bare reference
     captured here would go stale the first time it is pressed. */
  window.__filmrowAtmos = {
    LIVE: LIVE, rows: rows, focusPass: focusPass, copyText: copyText,
    state: function () { return state; },
    shipped: function () { return SHIPPED; },
    handles: function () { return fgHandles; }
  };
})();
