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

   OPACITY IS THE PART THAT CLIPS; SHADOW IS THE PART THAT DOES NOT. This layer
   sits UNDER all content, so every opaque picture is a hole in it, and the
   owner reported a hard line at the bottom edge of the About video. Measured at
   that edge, in one run so the numbers compare (the field seeds its time
   randomly, so cross-run figures do not):

     opacity 0.08 / shadow 0.39   edge 1.49   presence 2.08
     opacity 0.03 / shadow 0.80   edge 0.52   presence 0.96
     opacity 0.02 / shadow 1.00   edge 0.30   presence 0.86
     opacity 0.00 / shadow 1.00   edge 0.04   presence 0.64

   Shipping the third: a fifth of the edge for 41% of the presence. The first
   diagnosis was the opposite of this — that the shadow made the big soft shapes
   that clipped — and the measurement said no: raising shadow 0 to 1 lifted
   presence by two thirds while the edge stayed flat. Cut opacity to soften a
   content edge, raise shadow to win the presence back. Doing it the other way
   round makes the line worse.

   quality 0.2 is also deliberate and is what makes this affordable: the field
   renders at a fifth of the viewport and is upsampled. Clouds are soft, so it
   costs a fifth of the fragment work for no visible difference — measured
   identical fps at 1.0 and 0.2 in headless, and the shader is four multi-octave
   noise loops per pixel, so the saving is real on a weaker machine even where
   the fps counter does not show it.

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
    density: 1.5,
    scale: 1.1,
    speed: 0.6,
    shading: 1,
    shadow: 1,
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

    /* content IS documentElement, NOT the fixed stage, and that one choice is
       what stops the clouds "scrubbing in" (owner's words, Aug 15 2026).

       js/clouds.js offsets the noise field by content.scrollTop / clientHeight.
       Pointed at the fixed stage that is permanently 0, so the field was nailed
       to the viewport while the page slid over it — and since the layer sits
       UNDER all content, every opaque block wiped across a stationary sky and
       uncovered it as it went. That wipe is what read as clouds arriving with
       the scroll, and as a hard line at the bottom edge of the About video.

       documentElement gives the same viewport-sized canvas (its clientWidth /
       clientHeight ARE the viewport) while its scrollTop is the page scroll, so
       the offset now moves the field 1:1 with the document: a cloud stays glued
       to the same place on the page and content never travels across it. The
       nebula underneath stays fixed, so what is left is parallax between the
       two rather than a reveal.

       The stage stays fixed — it is only the frame the canvas is painted in. */
    var instance = window.KSClouds.create({
      source: src,
      content: document.documentElement,
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
