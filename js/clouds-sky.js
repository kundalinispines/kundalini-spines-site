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
    opacity: 0.08,
    cover: 0,
    density: 1.5,
    scale: 1.1,
    speed: 0.6,
    shading: 1,
    shadow: 0,
    shadowOffsetX: -220,
    shadowOffsetY: -10,
    shadowSoftness: 1,
    wind: 0.97,
    windRadius: 350,
    quality: 0.2,
    color: [0.615686274509804, 0.6980392156862745, 0.7529411764705882]
  };

  function build() {
    /* Fixed, not absolute: the sky does not scroll, so neither does this. It
       also keeps the canvas viewport-sized — an absolute wrapper would take the
       document's height and ask for a canvas thousands of pixels tall. */
    var stage = document.createElement('div');
    stage.className = 'ks-cloud-sky';
    stage.setAttribute('aria-hidden', 'true');
    stage.style.cssText = 'position:fixed;inset:0;z-index:-1;pointer-events:none';

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
    }, OPTIONS);

    /* No WebGL2, or a lost context: take the layer back out rather than leave
       an empty canvas over the sky. The nebula underneath is the whole design
       on its own and always was. */
    if (!instance) {
      stage.remove();
      return;
    }
    window.__cloudSky = instance;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
