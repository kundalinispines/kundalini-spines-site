/* THE CLOUD SKY — the owner's WebGL cloud field, over the nebula and under
   everything else (owner's call, Aug 15 2026: "sits over the sky and
   underneath all the text, the subheadings, the pictures").

   WHERE IT SITS, AND WHY THAT WORKS
   ---------------------------------
   A fixed body child at z-index -1. css/star-bg.css already uses exactly this
   for the lightning layer, and its note at line 503 is what makes it safe:
   body must never get a z-index or a transform, because either would turn body
   into a stacking context and trap negative children inside it. Body is not
   one, so a z-index -1 child escapes to the root stacking context, where:

     - html::before / html::after / body::before / body::after — the sky — are
       ALSO at z-index -1, and tree order decides between equals. An element
       appended to body comes after html's pseudo-elements, so this paints ABOVE
       the sky.
     - Everything in normal flow paints above the whole negative layer, so the
       copy, the rail, the headings and the video all stay clear of it without
       needing a z-index of their own.

   That is the entire mechanism. Give body a transform one day and this layer
   vanishes behind the page background with no error to explain it.

   THE VALUES START FROM THE OWNER'S, tuned by hand in clouds-lab.html, with
   opacity and shadow re-balanced afterwards to kill a visible edge. To retune:
   open clouds-lab.html, drag, Copy options, replace OPTIONS below.

   SHADOW IS ZERO, AND IT HAS TO STAY THERE. In the no-content branch the
   composite writes `rgb = cloudRGB * cloudA` but `a = cloudA + shadowA * (1 -
   cloudA)` — the shadow contributes ALPHA WITHOUT COLOUR. On a premultiplied
   canvas that is literally black paint: wherever the shadow is strong and the
   cloud thin, the layer multiplies the nebula down toward black. Turned up it
   does not read as shade on cloud, it reads as black blobs, which is what the
   owner saw.

   Measured as SIGNED change against the sky (+ve lightens, -ve darkens), which
   is the metric that matters and the one an earlier pass got wrong by using
   absolute difference — that counts a black blob and a lit cloud as equally
   "present", and led to shipping the worst row here:

     opacity / shadow    net    % darker   darkest px
     0.02 / 1.00        -0.54     12.5       -235      <- shipped, the black
     0.08 / 0.39        +2.06      4.8        -92      <- owner's lab tuning
     0.08 / 0.10        +2.26      0.3        -24
     0.08 / 0.00        +2.34      0.5        -11      <- now

   Zero shadow is strictly better here: more net lift than the owner's own
   tuning AND no blackening. The cloud colour lives entirely in opacity. To make
   the layer stronger, raise OPACITY (0.12 measured +3.51 net, still clean) —
   never shadow.

   quality 0.2 is also deliberate and is what makes this affordable: the field
   renders at a fifth of the viewport and is upsampled. Clouds are soft, so it
   costs a fifth of the fragment work for no visible difference — measured
   identical fps at 1.0 and 0.2 in headless, and the shader is four multi-octave
   noise loops per pixel, so the saving is real on a weaker machine even where
   the fps counter does not show it.

   COVER IS THE DIAL FOR "HOW MUCH OF THE SKY HAS CLOUD IN IT", and at the
   owner's 0 the noise field has genuinely empty regions. Now that the field is
   nailed to the viewport (see the note by `content` below) an empty region parks
   on screen and only creeps as the field drifts, instead of scrolling past.
   Measured at 1440x900, opacity 0.08, three drift phases, cloud layer isolated
   against a flat background:

     cover   sky with no cloud   largest single empty patch
     0.00        30–34%              6.4% / 11.3% / 13.6% of the viewport
     0.05        26%                 6.4%
     0.10        19%                 5.2%
     0.15        14%                 3.8%
     0.20        10%                 2.7%

   Left at the owner's 0 because it is his tuning and the nebula fills those
   gaps on its own. If he says clouds are still missing in open sky, cover is
   the one number to raise — it adds baseline coverage everywhere without
   touching the colour or the contrast.

   The layer is decorative: aria-hidden, pointer-events none, and it never
   handles a click. Cursor wind is read from the document instead (see
   pointerTarget in js/clouds.js). Reduced motion is handled inside the library
   — the field stops advancing and settles. */
(function () {
  'use strict';
  if (!window.KSClouds) return;

  var OPTIONS = {
    opacity: 0.02,
    cover: 0,
    density: 16,
    scale: 1.5,
    speed: 0.6,
    shading: 1,
    shadow: 0,
    shadowOffsetX: -600,
    shadowOffsetY: -600,
    shadowSoftness: 1,
    wind: 1,
    windRadius: 90,
    quality: 0.2,
    color: [0.615686274509804, 0.6980392156862745, 0.7529411764705882]
  };

  /* ==========================================================================
     THE TUNING PATH

     OPTIONS above stays the SHIPPED source of truth -- the literal the Copy
     button prints and the only thing to edit when a value is settled. Nothing
     below ever rewrites it, so reading this file still tells you what a
     visitor gets.

     Until Aug 16 2026 the only way to move these numbers was clouds-lab.html,
     which renders the field over a mock stage with two paragraphs on it. That
     is the wrong judge: the whole point of this layer is how it reads against
     the real nebula, the hero, the rail and the film rows, and none of those
     exist in the lab. The panel now also opens at /?tune on the real page --
     the same gate js/spine-bg.js and js/site-footer.js use, so there is one
     thing to remember rather than three. The lab stays: it is still the place
     to explore wild values without the site around them.

     Values dialled here persist for this browser, the same bargain the footer
     torch makes: the cache-busting workflow reloads constantly, and a panel
     that forgets on every reload cannot be used to judge anything. Reset puts
     the file's values back, and the note line says so whenever the live field
     is running on something other than what is committed. */
  var STORE_KEY = 'ks.cloudSky';

  /* tint 0..1 walks Archive Black -> Moonlight: one slider instead of a colour
     picker. Same mapping as clouds-lab.html on purpose, so a value dialled in
     either place means the same thing in the other. */
  var TINT_A = [0x03 / 255, 0x04 / 255, 0x0F / 255];   /* --color-black */
  var TINT_B = [0x9D / 255, 0xB2 / 255, 0xC0 / 255];   /* --color-moonlight */
  function tintColor(t) {
    return [TINT_A[0] + (TINT_B[0] - TINT_A[0]) * t,
            TINT_A[1] + (TINT_B[1] - TINT_A[1]) * t,
            TINT_A[2] + (TINT_B[2] - TINT_A[2]) * t];
  }
  /* Derived from the shipped colour instead of hard-coded to 1, so pasting a
     different colour into OPTIONS still opens the slider in the right place.
     Projected on the blue channel because it has the widest span of the three
     (0.059 -> 0.753) and so loses the least precision. */
  function tintOf(c) {
    if (!c) return 1;
    var t = (c[2] - TINT_A[2]) / (TINT_B[2] - TINT_A[2]);
    return Math.max(0, Math.min(1, Math.round(t * 100) / 100));
  }

  var state = {};
  for (var key in OPTIONS) if (key !== 'color') state[key] = OPTIONS[key];
  state.tint = tintOf(OPTIONS.color);
  var shipped = {};
  for (var sk in state) shipped[sk] = state[sk];
  try {
    var saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
    if (saved) for (var s in state) if (isFinite(saved[s])) state[s] = saved[s];
  } catch (e) {}

  /* What actually reaches the shader: every state key except tint, which is
     resolved into the colour triplet the library wants. */
  function liveOptions() {
    var o = {};
    for (var k in state) if (k !== 'tint') o[k] = state[k];
    o.color = tintColor(state.tint);
    return o;
  }

  function build() {
    /* Fixed, not absolute: the sky does not scroll, so neither does this. It
       also keeps the canvas viewport-sized — an absolute wrapper would take the
       document's height and ask for a canvas thousands of pixels tall. */
    var stage = document.createElement('div');
    stage.className = 'ks-cloud-sky';
    stage.setAttribute('aria-hidden', 'true');
    stage.style.cssText = 'position:fixed;inset:0;z-index:-1;pointer-events:none';
    /* Pinned to the large viewport for the same reason as every layer in
       css/star-bg.css (see the @supports block below .star-bolt there): a
       phone's collapsing URL bar resizes the layout viewport mid-scroll, and
       an inset:0 stage would resize the canvas with it — the field re-crops
       and the clouds creep against the nebula they are glued to. 100lvh is
       the collapsed-chrome height, so the box holds still and clientWidth/
       clientHeight (which size the canvas below) stop moving during scroll.
       Guarded exactly like the CSS: unguarded, an lvh-less browser would drop
       the height but keep bottom:auto and collapse the stage to zero. */
    if (window.CSS && CSS.supports && CSS.supports('height', '100lvh')) {
      stage.style.bottom = 'auto';
      /* --sky-lock (js/nav.js) overrides lvh on touch devices for Brave's
         bottom toolbar, same as the CSS layers — see star-bg.css build 31. */
      stage.style.height = 'var(--sky-lock, 100lvh)';
      /* Android center-anchor, matching the CSS layers (star-bg.css build
         34; the gate's reasoning is in js/nav.js, which runs before this
         file and publishes the class). */
      if (document.documentElement.classList.contains('sky-center')) {
        stage.style.top = 'var(--sky-cen, calc(50% - var(--sky-lock, 100lvh) / 2))';
      }
    }

    var src = document.createElement('canvas');
    src.style.display = 'none';

    var out = document.createElement('canvas');
    out.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none';

    stage.appendChild(src);
    stage.appendChild(out);
    document.body.appendChild(stage);

    /* content IS THE FIXED STAGE, and that one choice is what makes the layer
       persistent (owner, Aug 15 2026: "that layer will be FIXED above the
       nebula, with everything else layered on top of it").

       js/clouds.js offsets the noise field by content.scrollTop / clientHeight.
       Pointed at document.documentElement — which an earlier pass tried — that
       offset IS the page scroll, so the whole field translated through the
       viewport 1:1 with the document: at every scroll depth you were looking at
       a different piece of noise, with fresh cloud continuously arriving from
       below. That is the "scrubbing in" the owner kept seeing. Measured with the
       drift frozen and the page content hidden, the isolated cloud layer at
       scroll 200/400/600/800 correlated 0.94–0.99 with the scroll-0 layer SHIFTED
       BY THE SCROLL, and 0.21/0.06/0.00/-0.05 with it left in place — the field
       was glued to the document, not to the sky.

       The stage is position:fixed, so its scrollTop and scrollLeft are
       permanently 0 and uOffset never moves. Its clientWidth/clientHeight are the
       viewport, so the canvas stays viewport-sized instead of asking for one
       thousands of pixels tall. The field is now nailed to the viewport exactly
       like the nebula it sits on: scrolling changes nothing about it. What does
       change it is time — speed 0.6 keeps the clouds drifting, which the owner
       wants. Never ship speed 0; freeze it only to measure.

       NO MIRRORING OVER MEDIA. The layer sits under all in-flow content, so the
       hero, the film-row videos and the track cards each punch a hole in it.
       That is correct and wanted: the owner's stack is nebula, then clouds, then
       "text, headings, scrubbable videos, the carousel, etcetera" on top. An
       earlier pass painted mirror canvases over the two .ksd-filmrow__media
       videos to continue the field across them; that has been removed. The
       clouds belong in the open sky, and only there. */
    var instance = window.KSClouds.create({
      source: src,
      content: stage,
      output: out,
      pointerTarget: document
    }, liveOptions());

    /* No WebGL2, or a lost context: take the layer back out rather than leave
       an empty canvas over the sky. The nebula underneath is the whole design
       on its own and always was. */
    if (!instance) {
      stage.remove();
      /* Say so, once. The graceful bail is right — the nebula alone is the
         design — but a silent one cost a debugging round: "no clouds" in a
         browser is indistinguishable from a broken layer until someone opens
         devtools and finds nothing. Measured in real Brave on this machine
         (fresh profile, RTX 3090 Ti): WebGL2 works and the layer paints, so a
         Brave showing no clouds is that PROFILE blocking WebGL — Shields
         fingerprint protection on "strict", or hardware acceleration off —
         not the site and not Brave. */
      console.warn('[cloud-sky] WebGL2 unavailable — cloud layer skipped. ' +
        'Likely hardware acceleration off or fingerprint protection blocking WebGL.');
      return;
    }
    window.__cloudSky = instance;
    tuner(instance);
  }

  /* ==========================================================================
     THE TUNING PANEL — only ever runs at /?tune

     Nothing below this line executes on a normal load: no panel, no stylesheet,
     no rAF, no listeners. A visitor pays nothing for it.

     It writes through instance.setOptions(), which is the same call the lab
     makes and the same one the initial build uses, so the panel cannot flatter
     itself with a preview the real code does not do.

     IT DOES NOT OWN A BOX. This was briefly its own top-left panel, and that
     immediately reproduced the problem every other tuner already had: it landed
     on the footer torch's hide button, which no screenshot showed and only a
     Playwright click interception caught. There is now one shared shell
     (js/tune-panel.js) and this registers a tab in it, so there is no corner to
     collide over and one hide button instead of four. Do not give this file a
     fixed position, panel chrome, or a minimize button again.
     ========================================================================== */
  function tuner(instance) {
    /* The shared shell owns the /?tune gate now: KSTunePanel.tab() returns null
       off it, so there is ONE gate for four tuners instead of four copies of
       the same read. The old local copy carried a note about never writing this
       as a regex -- a generator once turned a word-boundary escape into a
       literal backspace (0x08), giving a pattern that could never match and was
       invisible in every diff and every grep. That note now lives in
       js/tune-panel.js, the only place that reads the query string.

       Fails soft if the shell is missing: a page that forgot the script tag
       loses its controls, not its clouds. */
    if (!window.KSTunePanel) return;
    var P = window.KSTunePanel;
    var body = P.tab('sky', 'Sky', 'the WebGL cloud field drifting over the nebula');
    if (!body) return;

    /* Ranges and tips are the owner's documented ones, carried over from
       clouds-lab.html rather than re-invented -- two panels disagreeing about
       what `density` means is worse than one panel. The lab's hard-won note
       applies here too: `cover` must not go below 0, because js/clouds.js does
       Math.max(cover, 0) before the shader sees it, so a negative slider would
       read -0.1 while the field got 0. A control that lies about what it is
       sending is worse than no control.

       `g` groups a field into a collapsible section. Fourteen flat rows made
       the tab a scroll; grouped, the three you are actually dialling fit on
       screen at once. */
    var FIELDS = [
      { k: 'opacity', g: 'form', label: 'opacity', min: 0, max: 1, step: 0.01,
        tip: 'Maximum opacity of the cloud layer. THIS is how you make the layer stronger, never shadow' },
      { k: 'cover', g: 'form', label: 'cover', min: 0, max: 1, step: 0.01,
        tip: 'Base cloud coverage added everywhere. At 0 the sky has genuinely empty patches; 0.10 leaves 19% bare, 0.20 leaves 10%' },
      { k: 'density', g: 'form', label: 'density', min: 0, max: 16, step: 0.1,
        tip: 'How sharply the shapes condense out of the noise field' },
      { k: 'scale', g: 'form', label: 'scale', min: 0.3, max: 3, step: 0.05,
        tip: 'Cloud pattern scale. LOWER values make BIGGER clouds' },
      { k: 'tint', g: 'form', label: 'tint', min: 0, max: 1, step: 0.01,
        tip: 'Cloud colour, Archive Black at 0 to Moonlight at 1. Ships at 1' },

      { k: 'speed', g: 'motion', label: 'speed', min: 0, max: 5, step: 0.05,
        tip: 'Drift speed. 0 freezes the sky -- freeze only to measure, never ship it' },
      { k: 'wind', g: 'motion', label: 'wind', min: 0, max: 1, step: 0.01,
        tip: 'How strongly the cursor parts the clouds. They drift shut after' },
      { k: 'windRadius', g: 'motion', label: 'wind radius', min: 20, max: 900, step: 10,
        tip: 'Radius of the cursor clearing, in CSS px' },

      { k: 'shading', g: 'shade', label: 'shading', min: 0, max: 1, step: 0.01,
        tip: 'Internal depth shading. On a dark ground it lifts highlights' },
      { k: 'shadow', g: 'shade', label: 'shadow', min: 0, max: 1, step: 0.01,
        tip: 'BLACK PAINT, not shade. The shadow term is alpha without colour on a premultiplied canvas, so it multiplies the nebula toward black. Ships at 0 and should stay there' },
      { k: 'shadowOffsetX', g: 'shade', label: 'shadow x', min: -600, max: 600, step: 10,
        tip: 'Horizontal shadow displacement in CSS px. Positive shifts right' },
      { k: 'shadowOffsetY', g: 'shade', label: 'shadow y', min: -600, max: 600, step: 10,
        tip: 'Vertical shadow displacement in CSS px. Positive shifts down' },
      { k: 'shadowSoftness', g: 'shade', label: 'shadow soft', min: 0, max: 1, step: 0.01,
        tip: 'How diffuse the shadow edges are' },

      { k: 'quality', g: 'cost', label: 'quality', min: 0.2, max: 1, step: 0.05,
        tip: 'Field resolution as a fraction of the viewport. Clouds are soft, so 0.2 measured visually identical to 1.0 for a fifth of the fragment work' }
    ];

    /* Form open by default because it is where a session starts; the rest
       collapsed. The shell remembers each one after that. */
    var GROUPS = [
      ['form', 'Form', true],
      ['motion', 'Motion', false],
      ['shade', 'Shading', false],
      ['cost', 'Cost', false]
    ];

    var paints = [];
    GROUPS.forEach(function (g) {
      var sec = P.section(body, 'sky-' + g[0], g[1], g[2]);
      FIELDS.forEach(function (f) {
        if (f.g !== g[0]) return;
        paints.push(P.slider(sec, f,
          function () { return state[f.k]; },
          function (v) { state[f.k] = v; apply(); }));
      });
    });

    var row = P.row(body);
    P.button(row, 'Reset', function () {
      for (var n in shipped) state[n] = shipped[n];
      apply();
    });
    var copyBtn = P.button(row, 'Copy options', function () {
      P.copy(copyBtn, note, copyText(), 'Copy options');
    });
    var note = P.note(body);

    /* The exact edit, not the numbers alone -- a value without its home is a
       note somebody has to decode later. Prints the whole OPTIONS literal ready
       to replace the one at the top of this file. */
    function copyText() {
      var o = liveOptions();
      var order = ['opacity', 'cover', 'density', 'scale', 'speed', 'shading',
                   'shadow', 'shadowOffsetX', 'shadowOffsetY', 'shadowSoftness',
                   'wind', 'windRadius', 'quality'];
      var lines = order.map(function (n) { return '    ' + n + ': ' + o[n] + ','; });
      lines.push('    color: [' + o.color.join(', ') + ']');
      return 'js/clouds-sky.js  ->  var OPTIONS = {\n' + lines.join('\n') + '\n  };';
    }

    function apply() {
      instance.setOptions(liveOptions());
      paints.forEach(function (p) { p(); });
      try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {}
      /* Say plainly when the field is running on something other than what is
         committed. Persisted values are the right default for tuning, but they
         also mean the owner can be looking at a sky no other machine shows --
         and that has read as "the site changed" before. */
      var off = [];
      for (var n in shipped) if (state[n] !== shipped[n]) off.push(n);
      note.innerHTML = off.length
        ? 'live values differ from the file: <em>' + off.join(', ') + '</em> &middot; Reset restores'
        : 'matches js/clouds-sky.js &middot; persisted &middot; /?tune only';
    }

    apply();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
