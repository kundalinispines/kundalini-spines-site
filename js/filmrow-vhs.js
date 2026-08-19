/* filmrow-vhs.js — the VHS/CRT tape treatment over the film-row clips.

   WHAT THIS IS
   A WebGL2 fragment shader run over each .ksd-filmrow__media video: tape wave,
   per-line jitter, a travelling crease, head-switching noise at the bottom,
   horizontal bloom, RGB aberration, an AC brightness beat, grain, scanlines,
   vignette, barrel and a saturation/exposure trim. The three rows it covers are
   About (black-tide), Transmissions (spine-frequency) and Archive
   (rain-transmission-rooftop).

   ---------------------------------------------------------------------------
   THE SHADER IS THE OWNER'S, THE PLUMBING IS NOT, AND THAT IS DELIBERATE.

   The reference implementation supplied with this effect renders HTML into a
   canvas — `ctx.drawElementImage(el, 0, 0)` plus `canvas.requestPaint()` — and
   then runs the shader over that. THAT PATH IS NOT USED HERE and must not be
   reintroduced without a reason, for three:

     1. It is an experimental Chrome-only API ("HTML in canvas"). It is absent
        in Firefox and Safari entirely, and behind a flag in most Chrome builds,
        so the effect would silently not exist for most visitors.
     2. We are not compositing HTML. A <video> is already a first-class WebGL
        texture source: texImage2D takes the element directly. The whole
        drawElementImage detour exists to solve a problem this page does not
        have.
     3. It costs a full element rasterisation per frame, on top of the video
        decode the row is already paying for.

   So `uContent` is uploaded straight from the <video>. Everything downstream of
   the texture fetch — the whole tape() / wave / crease / switching chain — is
   the reference shader, adapted only where the HTML path leaked into it:
   `uMaxX` is gone (it existed because the content canvas could be narrower than
   the output; a video fills its own texture), and the bezel is a declared
   colour rather than a walk up the DOM looking for a background.

   ---------------------------------------------------------------------------
   HOW IT MOUNTS. The <video> stays in the DOM and keeps playing — it is the
   texture source, so it cannot be display:none — and is taken to opacity 0
   AFTER a context is successfully created. A canvas is inserted over it at the
   same box. If WebGL2 is missing, the context is lost, or the gate below says
   no, NOTHING is touched and the plain video plays exactly as it does today.
   That ordering is the whole safety story: the failure mode is the current
   page, not a blank box.

   THE GATE. Off below 768px, matching js/deep-field-bg.js's boundary and for
   the same reason: three more WebGL contexts and three more full-frame shader
   passes on a phone, on top of the cloud sky, has never been measured. Under
   reduced motion the shader still runs but TIME IS FROZEN, so the tape sits
   still — the treatment is a look, not motion, and freezing it keeps the look
   while removing every moving artefact.
*/
(function (global) {
  'use strict';

  /* Ranges here are the useful ones, not hard limits. Every one of these is a
     tuner slider — see the tab registration at the foot of this file. */
  var DEFAULTS = {
    speed: 0.25,           /* playback speed of the artefacts; 1 is normal */
    wave: 1.35,            /* slow horizontal tape wave, 0..3 */
    jitter: 0.65,          /* fine per-line horizontal jitter, 0..3 */
    crease: 0.4,           /* travelling tape crease band, 0..3 */
    switching: 0.05,       /* head-switching noise at the bottom, 0..3 */
    switchingHeight: 0.12, /* height of that band as a fraction of the frame */
    bloom: 0.27,           /* horizontal glow bleed, 0..1 */
    aberration: 2.3,       /* RGB misalignment, CSS px */
    acBeat: 0.67,          /* slow brightness beat rolling down, 0..1 */
    grain: 0.16,           /* animated static, 0..1 */
    scanlines: 0.29,       /* CRT line overlay, 0..1 */
    vignette: 0.23,        /* corner darkening, 0..1 */
    barrel: 0.03,          /* tube curvature, 0..1; 0 disables. Above 0 the row
                              goes opaque and the curved edge takes the bezel */
    saturation: 1.47,      /* 1 keeps the clip's colour, 0 is greyscale */
    exposure: 0.88         /* final brightness multiplier */
  };

  var VERT =
    '#version 300 es\n' +
    'precision highp float;\n' +
    'layout(location = 0) in vec2 aPos;\n' +
    'out vec2 vUv;\n' +
    'void main () {\n' +
    '  vUv = aPos * 0.5 + 0.5;\n' +
    '  gl_Position = vec4(aPos, 0.0, 1.0);\n' +
    '}';

  var FRAG =
    '#version 300 es\n' +
    'precision highp float;\n' +
    'in vec2 vUv;\n' +
    'out vec4 outColor;\n' +
    'uniform sampler2D uContent;\n' +
    'uniform vec2 uResolution;\n' +
    'uniform float uTime, uWave, uJitter, uCrease, uSwitching, uSwitchHeight;\n' +
    'uniform float uBloom, uAberration, uAcBeat, uGrain, uScanlines, uVignette;\n' +
    'uniform float uSaturation, uExposure, uBarrel, uCreaseNoise;\n' +
    'uniform vec3 uBezel;\n' +
    '#define PI 3.14159265\n' +
    'float hash (vec2 v) { return fract(sin(dot(v, vec2(89.44, 19.36))) * 22189.22); }\n' +
    'float iHash (vec2 v, vec2 r) {\n' +
    '  float h00 = hash(floor(v * r + vec2(0.0, 0.0)) / r);\n' +
    '  float h10 = hash(floor(v * r + vec2(1.0, 0.0)) / r);\n' +
    '  float h01 = hash(floor(v * r + vec2(0.0, 1.0)) / r);\n' +
    '  float h11 = hash(floor(v * r + vec2(1.0, 1.0)) / r);\n' +
    '  vec2 ip = smoothstep(vec2(0.0), vec2(1.0), mod(v * r, 1.0));\n' +
    '  return (h00 * (1.0 - ip.x) + h10 * ip.x) * (1.0 - ip.y)\n' +
    '    + (h01 * (1.0 - ip.x) + h11 * ip.x) * ip.y;\n' +
    '}\n' +
    'float noise (vec2 v) {\n' +
    '  float sum = 0.0; float s = 2.0;\n' +
    '  for (int i = 1; i < 7; i++) { sum += iHash(v + vec2(i), vec2(2.0 * s)) / s; s *= 2.0; }\n' +
    '  return sum;\n' +
    '}\n' +
    /* THE 1-y FLIP IS LOAD-BEARING AND IT IS NOT ABOUT THE SOURCE BEING HTML.
       It was dropped here once, on the reasoning that a <video> uploads
       top-down while a 2D canvas does not, and THE ROW CAME OUT UPSIDE DOWN —
       while every numeric check passed, because "100% of the pixels changed" is
       just as true of an inverted picture as of a correct one.
       The real reason: vUv comes from a full-screen quad, so vUv.y = 1 is the
       TOP of the screen, while texture coordinate t = 1 is the LAST row
       uploaded, which is the BOTTOM of the image. Sampling 1-y is what puts the
       top of the frame at the top of the element. */
    'vec4 tape (vec2 p) {\n' +
    '  p = clamp(p, vec2(0.0005), vec2(0.9995));\n' +
    '  return texture(uContent, vec2(p.x, 1.0 - p.y));\n' +
    '}\n' +
    'void main () {\n' +
    '  vec2 uv = vUv;\n' +
    '  float edgeMask = 1.0;\n' +
    '  if (uBarrel > 0.0) {\n' +
    '    vec2 c = uv * 2.0 - 1.0;\n' +
    '    c *= 1.0 + uBarrel * 0.15 * dot(c, c);\n' +
    '    float m = max(abs(c.x), abs(c.y));\n' +
    '    edgeMask = 1.0 - smoothstep(1.0 - 0.12 * uBarrel, 1.0, m);\n' +
    '    if (edgeMask <= 0.0) { outColor = vec4(uBezel, 1.0); return; }\n' +
    '    uv = c * 0.5 + 0.5;\n' +
    '  }\n' +
    '  vec2 uvn = uv;\n' +
    '  float t = uTime;\n' +
    '  float lineNoise = 0.0;\n' +
    '  if (uJitter + uCrease + uSwitching > 0.0) lineNoise = noise(vec2(uvn.y * 100.0, t * 10.0));\n' +
    '  if (uWave > 0.0) uvn.x += (noise(vec2(uvn.y, t)) - 0.5) * 0.005 * uWave;\n' +
    '  uvn.x += (lineNoise - 0.5) * 0.01 * uJitter;\n' +
    '  float tcPhase = clamp((sin(uvn.y * 8.0 - t * PI * 1.2) - 0.92) * uCreaseNoise, 0.0, 0.01) * 10.0 * uCrease;\n' +
    '  float tcNoise = max(lineNoise - 0.5, 0.0);\n' +
    '  uvn.x -= tcNoise * tcPhase;\n' +
    /* The head-switching band belongs at the BOTTOM of the tape, and uvn.y is
       already screen space with 0 at the bottom — so this reads uvn.y directly,
       exactly as the reference does. It was briefly rewritten as 1.0 - uvn.y to
       compensate for a texture flip that had itself been wrongly removed; two
       inversions that cancelled in the numbers and did not in the picture. */
    '  float snPhase = smoothstep(max(uSwitchHeight, 1e-4), 0.0, uvn.y) * uSwitching;\n' +
    '  uvn.y += snPhase * 0.3;\n' +
    '  uvn.x += snPhase * ((lineNoise - 0.5) * 0.2);\n' +
    '  vec4 base = tape(uvn);\n' +
    '  vec3 col = base.rgb;\n' +
    '  col *= 1.0 - tcPhase;\n' +
    '  col = mix(col, col.yzx, clamp(snPhase, 0.0, 1.0));\n' +
    '  if (uBloom > 0.0) {\n' +
    '    float px = uAberration / max(uResolution.x, 1.0);\n' +
    '    vec3 bloomSum = vec3(0.0);\n' +
    '    for (int i = -8; i <= 2; i++) {\n' +
    '      vec3 s = tape(uvn + vec2(float(i) * px, 0.0)).rgb;\n' +
    '      if (i >= -4) bloomSum.r += s.r;\n' +
    '      if (i >= -6 && i <= 0) bloomSum.g += s.g;\n' +
    '      if (i <= -2) bloomSum.b += s.b;\n' +
    '    }\n' +
    '    bloomSum *= 0.1;\n' +
    '    col = mix(col, (col + bloomSum) / 1.7, clamp(uBloom, 0.0, 1.0));\n' +
    '  }\n' +
    '  if (uAcBeat > 0.0) col *= 1.0 + clamp(noise(vec2(0.0, uv.y + t * 0.2)) * 0.6 - 0.25, 0.0, 0.1) * uAcBeat;\n' +
    '  float g = hash(uv * uResolution + fract(t) * vec2(127.1, 311.7)) - 0.5;\n' +
    '  col += g * uGrain;\n' +
    '  float scan = sin(uv.y * uResolution.y * PI) * 0.5;\n' +
    '  col *= 1.0 - uScanlines * 0.35 * scan;\n' +
    '  vec2 vd = (uv - 0.5) * vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);\n' +
    '  col *= 1.0 - uVignette * smoothstep(0.4, 1.1, length(vd));\n' +
    '  float lum = dot(col, vec3(0.299, 0.587, 0.114));\n' +
    '  col = mix(vec3(lum), col, clamp(uSaturation, 0.0, 2.0));\n' +
    '  col *= uExposure;\n' +
    '  float alpha = max(base.a, clamp(snPhase + tcPhase, 0.0, 1.0));\n' +
    '  if (uBarrel > 0.0) { col = mix(uBezel, col, edgeMask); alpha = 1.0; }\n' +
    '  outColor = vec4(col, alpha);\n' +
    '}';

  var instances = [];

  function create(video, options) {
    var config = {};
    for (var k in DEFAULTS) config[k] = DEFAULTS[k];
    if (options) for (var k2 in options) if (k2 in config) config[k2] = options[k2];

    var canvas = document.createElement('canvas');
    canvas.className = 'fr-vhs';
    canvas.setAttribute('aria-hidden', 'true');

    var gl = canvas.getContext('webgl2', {
      alpha: true, depth: false, stencil: false,
      antialias: false, premultipliedAlpha: false
    });
    if (!gl || gl.isContextLost()) return null;

    function compile(type, src) {
      var sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        /* Not console.error: this page's bar is zero console errors, and a
           driver that will not compile this is a reason to fall back quietly to
           the plain video, not to shout. */
        return null;
      }
      return sh;
    }
    var vs = compile(gl.VERTEX_SHADER, VERT);
    var fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return null;

    var program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;

    var uniforms = {};
    var n = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (var i = 0; i < n; i++) {
      var info = gl.getActiveUniform(program, i);
      uniforms[info.name] = gl.getUniformLocation(program, info.name);
    }

    var quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                  new Uint8Array([0, 0, 0, 0]));

    /* Only now is it safe to take the video down: everything that could fail
       has. Opacity, never display or visibility — a hidden media element stops
       producing frames and the texture would freeze on whatever it last had. */
    var figure = video.closest('.ksd-filmrow__media') || video.parentNode;
    figure.classList.add('has-fr-vhs');
    figure.appendChild(canvas);

    var raf = 0, destroyed = false, running = false, visible = true;
    var time = 0, lastTime = 0, haveFrame = false;

    var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var reduced = motion.matches;

    function fract(x) { return x - Math.floor(x); }
    function hash2(x, y) { return fract(Math.sin(x * 89.44 + y * 19.36) * 22189.22); }
    function smooth01(x) { return x * x * (3 - 2 * x); }
    function iHashCpu(vx, vy, r) {
      var fx = Math.floor(vx * r), fy = Math.floor(vy * r);
      var h00 = hash2(fx / r, fy / r), h10 = hash2((fx + 1) / r, fy / r);
      var h01 = hash2(fx / r, (fy + 1) / r), h11 = hash2((fx + 1) / r, (fy + 1) / r);
      var ix = smooth01(fract(vx * r)), iy = smooth01(fract(vy * r));
      return (h00 * (1 - ix) + h10 * ix) * (1 - iy) + (h01 * (1 - ix) + h11 * ix) * iy;
    }
    function noiseCpu(vx, vy) {
      var sum = 0, s = 2;
      for (var i = 1; i < 7; i++) { sum += iHashCpu(vx + i, vy + i, 2 * s) / s; s *= 2; }
      return sum;
    }

    function syncSize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      var h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    }

    function upload() {
      if (video.readyState < 2 || !video.videoWidth) return;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
      haveFrame = true;
    }

    function render() {
      upload();
      if (!haveFrame) return;
      gl.useProgram(program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(uniforms.uContent, 0);
      gl.uniform2f(uniforms.uResolution, canvas.width, canvas.height);
      gl.uniform1f(uniforms.uTime, time);
      gl.uniform1f(uniforms.uWave, Math.max(config.wave, 0));
      gl.uniform1f(uniforms.uJitter, Math.max(config.jitter, 0));
      gl.uniform1f(uniforms.uCrease, Math.max(config.crease, 0));
      gl.uniform1f(uniforms.uSwitching, Math.max(config.switching, 0));
      gl.uniform1f(uniforms.uSwitchHeight, Math.max(config.switchingHeight, 0));
      gl.uniform1f(uniforms.uBloom, config.bloom);
      var dpr = canvas.width / Math.max(canvas.clientWidth, 1);
      gl.uniform1f(uniforms.uAberration, Math.max(config.aberration, 0) * dpr);
      gl.uniform1f(uniforms.uAcBeat, Math.max(config.acBeat, 0));
      gl.uniform1f(uniforms.uGrain, Math.max(config.grain, 0));
      gl.uniform1f(uniforms.uScanlines, Math.max(config.scanlines, 0));
      gl.uniform1f(uniforms.uVignette, Math.max(config.vignette, 0));
      gl.uniform1f(uniforms.uBarrel, Math.max(config.barrel, 0));
      gl.uniform3f(uniforms.uBezel, 0, 0, 0);
      gl.uniform1f(uniforms.uCreaseNoise, noiseCpu(time, time));
      gl.uniform1f(uniforms.uSaturation, config.saturation);
      gl.uniform1f(uniforms.uExposure, Math.max(config.exposure, 0));
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    function frame(now) {
      if (destroyed) return;
      if (!visible) { running = false; return; }
      var delta = Math.min((now - lastTime) / 1000, 1 / 30);
      lastTime = now;
      if (!reduced) time += delta * config.speed;
      render();
      /* Reduced motion still paints - once - so the look is there without any
         moving artefact. It re-wakes on a resize or an option change. */
      if (reduced && haveFrame) { running = false; return; }
      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (destroyed || running || !visible) return;
      running = true;
      lastTime = performance.now();
      raf = requestAnimationFrame(frame);
    }

    syncSize();
    start();

    function onMotion() { reduced = motion.matches; start(); }
    motion.addEventListener('change', onMotion);

    var ro = new ResizeObserver(function () { syncSize(); start(); });
    ro.observe(canvas);

    var io = new IntersectionObserver(function (entries) {
      var e = entries[entries.length - 1];
      visible = e ? e.isIntersecting : true;
      if (visible) start();
    });
    io.observe(figure);

    var inst = {
      video: video,
      canvas: canvas,
      setOptions: function (next) {
        var changed = false;
        for (var key in next) {
          if (key in config && config[key] !== next[key]) { config[key] = next[key]; changed = true; }
        }
        if (changed) start();
      },
      resize: function () { syncSize(); start(); },
      destroy: function () {
        destroyed = true;
        cancelAnimationFrame(raf);
        ro.disconnect(); io.disconnect();
        motion.removeEventListener('change', onMotion);
        gl.deleteTexture(tex); gl.deleteProgram(program);
        gl.deleteShader(vs); gl.deleteShader(fs); gl.deleteBuffer(quad);
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
        figure.classList.remove('has-fr-vhs');
      }
    };
    instances.push(inst);
    return inst;
  }

  function setOptionsAll(next) {
    for (var i = 0; i < instances.length; i++) instances[i].setOptions(next);
  }
  function destroyAll() {
    while (instances.length) instances.pop().destroy();
  }

  global.KSFilmrowVHS = {
    defaults: DEFAULTS,
    create: create,
    setOptionsAll: setOptionsAll,
    destroyAll: destroyAll,
    instances: instances
  };

  /* ---- mount --------------------------------------------------------------

     THE GATE IS THE SAME 768px BOUNDARY js/deep-field-bg.js uses, and for the
     same unmeasured-risk reason: three more WebGL contexts and three more
     full-frame passes on a phone, on top of the cloud sky, has never been
     profiled on a real device. Raise this only with numbers. */
  function mount() {
    if (window.matchMedia('(max-width: 768px)').matches) return;
    var vids = document.querySelectorAll('.ksd-filmrow__media video');
    for (var i = 0; i < vids.length; i++) create(vids[i]);
    registerTuner();
  }

  /* ---- the tuner tab ------------------------------------------------------

     Registered through KSTunePanel like every other module's tab, so it only
     exists at /?tune and costs nothing otherwise. Tips are single-quoted and
     CARRY NO APOSTROPHES — one of them takes the whole panel down. */
  function registerTuner() {
    if (!window.KSTunePanel) return;
    var P = window.KSTunePanel;
    var body = P.tab('vhs', 'VHS', 'the tape treatment over the three film rows');
    if (!body) return;

    var FIELDS = [
      { k: 'speed', g: 'tape', label: 'speed', min: 0, max: 3, step: 0.05,
        tip: 'How fast the tape artefacts run. 1 is normal speed. It scales time itself, so every moving artefact slows or hurries together' },
      { k: 'wave', g: 'tape', label: 'wave', min: 0, max: 3, step: 0.05,
        tip: 'The slow horizontal tape wave - the whole frame breathing side to side. This is the artefact that reads most as tape rather than as damage' },
      { k: 'jitter', g: 'tape', label: 'jitter', min: 0, max: 3, step: 0.05,
        tip: 'Fine per-line horizontal jitter. Small values read as a worn tape; large values read as a broken one' },
      { k: 'crease', g: 'tape', label: 'crease', min: 0, max: 3, step: 0.05,
        tip: 'The travelling crease band that rolls down the frame, dragging the line it crosses and darkening it' },
      { k: 'switching', g: 'tape', label: 'switching', min: 0, max: 3, step: 0.05,
        tip: 'Head-switching noise along the BOTTOM edge, where a real VCR loses lock. It also swaps the colour channels inside the band' },
      { k: 'switchingHeight', g: 'tape', label: 'switch h', min: 0, max: 0.3, step: 0.005,
        tip: 'How tall the head-switching band is, as a fraction of the frame height' },

      { k: 'bloom', g: 'tube', label: 'bloom', min: 0, max: 1, step: 0.01,
        tip: 'Horizontal glow bleed, sampled asymmetrically per channel so bright edges smear the way a tube smears them' },
      { k: 'aberration', g: 'tube', label: 'aberration', min: 0, max: 8, step: 0.1,
        tip: 'RGB channel misalignment in CSS pixels. It also sets the spacing of the bloom taps, so the two move together' },
      { k: 'acBeat', g: 'tube', label: 'ac beat', min: 0, max: 1, step: 0.01,
        tip: 'The slow brightness beat rolling down the frame - mains hum getting into the picture' },
      { k: 'grain', g: 'tube', label: 'grain', min: 0, max: 1, step: 0.01,
        tip: 'Animated static grain. This is the one that most easily reads as dirt rather than as tape, so keep it low' },
      { k: 'scanlines', g: 'tube', label: 'scanlines', min: 0, max: 1, step: 0.01,
        tip: 'CRT line overlay. It is drawn against the OUTPUT resolution, so it stays one line per device pixel row at any size' },
      { k: 'vignette', g: 'tube', label: 'vignette', min: 0, max: 1, step: 0.01,
        tip: 'Darkening toward the corners' },
      { k: 'barrel', g: 'tube', label: 'barrel', min: 0, max: 1, step: 0.01,
        tip: 'Tube curvature bending the picture inward. 0.03 ships - just enough to round the frame. MEASURED at that value against 0 on the same frozen frame: the corners darken by 3 to 5 of 255 and the centre moves 0.2, so it reads as a slight tube rather than as a vignette. Any value above 0 also forces the row opaque and fills the curved edge with the bezel, which is black here' },

      { k: 'saturation', g: 'grade', label: 'saturation', min: 0, max: 2, step: 0.01,
        tip: 'Colour saturation. 1 keeps the clip as it is, 0 is greyscale' },
      { k: 'exposure', g: 'grade', label: 'exposure', min: 0, max: 2, step: 0.01,
        tip: 'A final brightness multiplier applied after everything else' }
    ];
    var GROUPS = [['tape', 'The tape', true], ['tube', 'The tube', true],
                  ['grade', 'Grade', true]];

    var state = {};
    for (var i = 0; i < FIELDS.length; i++) state[FIELDS[i].k] = DEFAULTS[FIELDS[i].k];

    var note = null;
    function apply() {
      var out = {};
      for (var n2 in state) out[n2] = state[n2];
      setOptionsAll(out);
      if (!note) return;
      var offs = [];
      for (var n3 in state) if (state[n3] !== DEFAULTS[n3]) offs.push(n3);
      note.textContent = offs.length
        ? offs.length + ' value(s) off the committed set: ' + offs.join(', ')
        : 'matching the committed values';
    }

    /* P.slider takes (parent, def, GET, SET) - two functions, not a value and
       an oninput. It returns a repaint closure the caller keeps and runs after
       changing state behind the panel's back, which is what Reset does below. */
    var paints = [];
    GROUPS.forEach(function (g) {
      var sec = P.section(body, 'vhs-' + g[0], g[1], g[2]);
      FIELDS.forEach(function (f) {
        if (f.g !== g[0]) return;
        paints.push(P.slider(sec, f,
          function () { return state[f.k]; },
          function (v) { state[f.k] = v; apply(); }));
      });
    });

    var row = P.row(body);
    P.button(row, 'Reset', function () {
      for (var n in DEFAULTS) state[n] = DEFAULTS[n];
      apply();
      paints.forEach(function (p) { p(); });
    });
    var copyBtn = P.button(row, 'Copy options', function () {
      P.copy(copyBtn, note, copyText(), 'Copy options');
    });
    note = P.note(body, 'matching the committed values');

    /* The whole DEFAULTS literal, ready to replace the one at the top of this
       file - a value without its home is a note somebody has to decode later. */
    function copyText() {
      var lines = FIELDS.map(function (f, i) {
        return '    ' + f.k + ': ' + state[f.k] + (i === FIELDS.length - 1 ? '' : ',');
      });
      return 'js/filmrow-vhs.js  ->  var DEFAULTS = {\n' + lines.join('\n') + '\n  };';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
}(window));
