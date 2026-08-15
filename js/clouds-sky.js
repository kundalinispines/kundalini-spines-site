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

   THE VALUES ARE THE OWNER'S, tuned by hand in clouds-lab.html and pasted back
   with its Copy options button. To retune: open clouds-lab.html, drag, Copy
   options, replace OPTIONS below. Do not "tidy" them toward the library
   defaults — opacity 0.08 against shadow 0.39 looks like a mistake and is not.
   At that pairing the cloud BODY is nearly invisible and what reads on the page
   is the shadow it throws, offset -220px. It is a drift of shade across the
   nebula rather than cloud sitting on top of it.

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
    opacity: 0.08,
    cover: 0,
    density: 1.5,
    scale: 1.1,
    speed: 0.6,
    shading: 1,
    shadow: 0.39,
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
