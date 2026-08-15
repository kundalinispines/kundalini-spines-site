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
    /* CONTINUING THE SKY OVER OPAQUE MEDIA.

       The layer sits under all content, so every opaque element is a hard-edged
       hole in it. Swept at opacity 0.9 across the whole document, the holes are:
       the hero scrim, the nav, the track cards, and — the ones the owner
       objected to — the two scrubbable film-row videos, 195 and 184 tiles of
       dead rectangle with the sky carrying on around them.

       These mirrors fix that WITHOUT a second cloud field. A second instance
       would seed its own random time and never line up; instead each overlay
       copies the exact region of the real canvas that lies behind its video, so
       the field continues across the video as one piece of sky.

       It has to happen inside the render frame — a WebGL canvas clears its
       drawing buffer once composited, and a copy taken at any other moment is
       silently blank. That is what onFrame is for. The alternative,
       preserveDrawingBuffer, costs a readback on every frame forever.

       Only the film-row videos are mirrored. The hero is deliberately left as a
       hole — the owner does not want cloud on the footage — and the track cards
       are protected behaviour that nothing here should reach into. */
    var mirrors = [];
    Array.prototype.forEach.call(
      document.querySelectorAll('.ksd-filmrow__media'), function (fig) {
        var vid = fig.querySelector('video');
        if (!vid) return;
        // isolate so the overlay cannot escape the figure's own stacking context
        fig.style.position = 'relative';
        fig.style.isolation = 'isolate';
        var mc = document.createElement('canvas');
        mc.setAttribute('aria-hidden', 'true');
        mc.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;' +
          'z-index:1;pointer-events:none';
        fig.appendChild(mc);
        mirrors.push({ el: vid, canvas: mc, ctx: mc.getContext('2d') });
      });

    function paintMirrors(source) {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      for (var i = 0; i < mirrors.length; i++) {
        var m = mirrors[i];
        var r = m.el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight || r.width < 2) continue;
        var w = Math.max(1, Math.round(r.width * dpr));
        var h = Math.max(1, Math.round(r.height * dpr));
        if (m.canvas.width !== w || m.canvas.height !== h) {
          m.canvas.width = w;
          m.canvas.height = h;
        }
        m.ctx.clearRect(0, 0, w, h);
        // Source rect is the video's viewport box in device pixels — the main
        // canvas is fixed and viewport-sized, so this is literally the sky the
        // video is standing in front of.
        m.ctx.drawImage(source, r.left * dpr, r.top * dpr, r.width * dpr, r.height * dpr,
                        0, 0, w, h);
      }
    }

    var instance = window.KSClouds.create({
      source: src,
      content: document.documentElement,
      output: out,
      pointerTarget: document,
      onFrame: mirrors.length ? paintMirrors : null
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
