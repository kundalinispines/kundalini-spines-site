/* VOLUMETRIC CLOUDS — WebGL2 field, dropped in by the owner Aug 15 2026 as a
   React/TypeScript component and ported here to plain ES5-ish JS because this
   site has no build step and no React. The port is faithful: same three shader
   passes, same uniforms, same defaults. What was removed is only the wrapper —
   the <Clouds> component, the hooks and the type declarations.

   TWO CONSUMERS: clouds-lab.html (the tuning lab) and js/clouds-sky.js (the
   live layer on index.html, which owns the shipped OPTIONS and the placement
   rationale — read its header before changing anything here). The CSS nebula
   in css/star-bg.css is untouched underneath; this drifts over it.

   THE html-in-canvas PATH IS DEAD ON ARRIVAL HERE, and that is fine. The
   original renders page content INTO the cloud field so the clouds can refract
   and fog it, using drawElementImage()/requestPaint() — an experimental Chrome
   API that is off in every browser this project targets. supportsHtmlInCanvas()
   reports it, and without it uHasContent is 0 and the field composites as a
   TRANSPARENT OVERLAY instead. That is the mode we want anyway: the existing
   nebula shows through from underneath rather than being sampled into the
   effect. The refraction and fogBlur options do nothing in this mode — they
   are kept so the code still matches the source it came from.

   COLOUR: `color: "auto"` walks up the parents looking for a background colour
   and uses it as the cloud base. On this site that finds Archive Black
   (#03040F) and paints near-black clouds over a near-black sky, which reads as
   nothing at all. Pass an explicit [r,g,b] in 0..1 for anything visible — the
   lab panel defaults to a cold pale blue. */
(function (global) {
  'use strict';

  var DEFAULTS = {
    scale: 1,
    speed: 0.6,
    cover: 0.1,
    density: 2.5,
    shading: 0.1,
    color: 'auto',
    opacity: 0.64,
    shadow: 0.06,
    shadowOffsetX: 200,
    shadowOffsetY: -10,
    shadowSoftness: 1,
    wind: 0.6,
    windRadius: 350,
    refraction: 0,
    fogBlur: 0,
    quality: 1
  };

  var VERT = [
    '#version 300 es',
    'precision highp float;',
    'layout(location = 0) in vec2 aPos;',
    'void main () { gl_Position = vec4(aPos, 0.0, 1.0); }'
  ].join('\n');

  var FIELD_FRAG = [
    '#version 300 es',
    'precision highp float;',
    'out vec4 outColor;',
    'uniform vec2 uResolution;',
    'uniform vec2 uOffset;',
    'uniform float uTime;',
    'uniform float uScale;',
    'uniform float uCover;',
    'uniform float uDensity;',
    'const mat2 m = mat2(1.6, 1.2, -1.2, 1.6);',
    'vec2 hash (vec2 p) {',
    '  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));',
    '  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);',
    '}',
    'float noise (vec2 p) {',
    '  const float K1 = 0.366025404;',
    '  const float K2 = 0.211324865;',
    '  vec2 i = floor(p + (p.x + p.y) * K1);',
    '  vec2 a = p - i + (i.x + i.y) * K2;',
    '  vec2 o = (a.x > a.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);',
    '  vec2 b = a - o + K2;',
    '  vec2 c = a - 1.0 + 2.0 * K2;',
    '  vec3 h = max(0.5 - vec3(dot(a, a), dot(b, b), dot(c, c)), 0.0);',
    '  vec3 n = h * h * h * h',
    '    * vec3(dot(a, hash(i)), dot(b, hash(i + o)), dot(c, hash(i + 1.0)));',
    '  return dot(n, vec3(70.0));',
    '}',
    'float fbm (vec2 n) {',
    '  float total = 0.0;',
    '  float amplitude = 0.1;',
    '  for (int i = 0; i < 7; i++) {',
    '    total += noise(n) * amplitude;',
    '    n = m * n;',
    '    amplitude *= 0.4;',
    '  }',
    '  return total;',
    '}',
    'void main () {',
    '  vec2 p = gl_FragCoord.xy / uResolution + uOffset;',
    '  vec2 asp = vec2(uResolution.x / uResolution.y, 1.0);',
    '  float q = fbm(p * asp * uScale * 0.5);',
    '  float r = 0.0;',
    '  vec2 uv = p * asp * uScale;',
    '  uv -= q - uTime;',
    '  float weight = 0.8;',
    '  for (int i = 0; i < 8; i++) {',
    '    r += abs(weight * noise(uv));',
    '    uv = m * uv + uTime;',
    '    weight *= 0.7;',
    '  }',
    '  float f = 0.0;',
    '  uv = p * asp * uScale;',
    '  uv -= q - uTime;',
    '  weight = 0.7;',
    '  for (int i = 0; i < 8; i++) {',
    '    f += weight * noise(uv);',
    '    uv = m * uv + uTime;',
    '    weight *= 0.6;',
    '  }',
    '  f *= r + f;',
    '  float c = 0.0;',
    '  float t2 = uTime * 2.0;',
    '  uv = p * asp * uScale * 2.0;',
    '  uv -= q - t2;',
    '  weight = 0.4;',
    '  for (int i = 0; i < 7; i++) {',
    '    c += weight * noise(uv);',
    '    uv = m * uv + t2;',
    '    weight *= 0.6;',
    '  }',
    '  float c1 = 0.0;',
    '  float t3 = uTime * 3.0;',
    '  uv = p * asp * uScale * 3.0;',
    '  uv -= q - t3;',
    '  weight = 0.4;',
    '  for (int i = 0; i < 7; i++) {',
    '    c1 += abs(weight * noise(uv));',
    '    uv = m * uv + t3;',
    '    weight *= 0.6;',
    '  }',
    '  c += c1;',
    '  float coverage = clamp(uCover + uDensity * f * r + c, 0.0, 1.0);',
    '  outColor = vec4(coverage, clamp(c, 0.0, 1.0), 0.0, 1.0);',
    '}'
  ].join('\n');

  var WIND_FRAG = [
    '#version 300 es',
    'precision highp float;',
    'out vec4 outColor;',
    'uniform sampler2D uPrev;',
    'uniform vec2 uResolution;',
    'uniform float uDecay;',
    'uniform vec2 uA;',
    'uniform vec2 uB;',
    'uniform float uRadius;',
    'uniform float uStrength;',
    'void main () {',
    '  vec2 uv = gl_FragCoord.xy / uResolution;',
    '  float prev = texture(uPrev, uv).r * uDecay;',
    '  vec2 asp = vec2(uResolution.x / uResolution.y, 1.0);',
    '  vec2 p = uv * asp;',
    '  vec2 a = uA * asp;',
    '  vec2 b = uB * asp;',
    '  vec2 pa = p - a;',
    '  vec2 ba = b - a;',
    '  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);',
    '  float d = length(pa - ba * h) / max(uRadius, 1e-4);',
    '  float stamp = exp(-d * d * 3.0) * uStrength;',
    '  outColor = vec4(clamp(prev + stamp, 0.0, 1.0), 0.0, 0.0, 1.0);',
    '}'
  ].join('\n');

  var COMPOSITE_FRAG = [
    '#version 300 es',
    'precision highp float;',
    'out vec4 outColor;',
    'uniform sampler2D uField;',
    'uniform sampler2D uContent;',
    'uniform sampler2D uWind;',
    'uniform vec2 uResolution;',
    'uniform vec2 uContentScale;',
    'uniform vec3 uBase;',
    'uniform float uShading;',
    'uniform float uOpacity;',
    'uniform float uShadow;',
    'uniform vec2 uShadowShift;',
    'uniform float uShadowLod;',
    'uniform float uWindAmt;',
    'uniform float uRefraction;',
    'uniform float uFogBlur;',
    'uniform float uHasContent;',
    'void main () {',
    '  vec2 uv = gl_FragCoord.xy / uResolution;',
    '  vec2 field = texture(uField, uv).rg;',
    '  float wind = texture(uWind, uv).r * uWindAmt;',
    '  float cov = field.r - wind;',
    '  float mist = smoothstep(0.04, 0.9, cov);',
    '  float cloudA = mist * uOpacity;',
    '  float lum = dot(uBase, vec3(0.299, 0.587, 0.114));',
    '  float sh = clamp(field.g, 0.0, 1.0);',
    '  float k = uShading * 0.35;',
    '  vec3 cloudRGB = lum > 0.5',
    '    ? uBase - vec3((1.0 - sh) * k)',
    '    : uBase + vec3(sh * k);',
    '  cloudRGB = clamp(cloudRGB, 0.0, 1.0);',
    '  vec2 sUv = uv + uShadowShift;',
    '  float s = textureLod(uField, sUv, uShadowLod).r',
    '    - texture(uWind, sUv).r * uWindAmt;',
    '  float shadowA = smoothstep(0.35, 1.0, s) * uShadow * (1.0 - mist);',
    '  float a;',
    '  vec3 rgb;',
    '  if (uHasContent > 0.5) {',
    '    vec2 e = vec2(8.0) / uResolution;',
    '    float gx = texture(uField, uv + vec2(e.x, 0.0)).r',
    '      - texture(uField, uv - vec2(e.x, 0.0)).r;',
    '    float gy = texture(uField, uv + vec2(0.0, e.y)).r',
    '      - texture(uField, uv - vec2(0.0, e.y)).r;',
    '    vec2 rUv = uv + vec2(gx, gy) * uRefraction * mist;',
    '    vec3 fogged = textureLod(',
    '      uContent, vec2(rUv.x, 1.0 - rUv.y) * uContentScale, mist * uFogBlur * 5.0',
    '    ).rgb;',
    '    vec3 layer = mix(fogged, cloudRGB, cloudA) * (1.0 - shadowA);',
    '    float aF = smoothstep(0.02, 0.2, mist);',
    '    a = aF + shadowA * (1.0 - aF);',
    '    rgb = layer * aF;',
    '  } else {',
    '    a = cloudA + shadowA * (1.0 - cloudA);',
    '    rgb = cloudRGB * cloudA;',
    '  }',
    '  outColor = vec4(rgb, a);',
    '}'
  ].join('\n');

  function supportsHtmlInCanvas() {
    if (typeof document === 'undefined') return false;
    var probe = document.createElement('canvas');
    var ctx = probe.getContext('2d');
    return Boolean(ctx && typeof ctx.drawElementImage === 'function' &&
      typeof probe.requestPaint === 'function');
  }

  function createClouds(elements, options) {
    var config = {};
    var key;
    for (key in DEFAULTS) config[key] = DEFAULTS[key];
    for (key in (options || {})) config[key] = options[key];

    var source = elements.source;
    var content = elements.content;
    var output = elements.output;
    /* pointerTarget is an addition to the original, and it exists for the
       site-wide sky layer. There, `content` is a FIXED full-viewport div: that
       is what keeps the field locked to the viewport like the rest of the sky
       (its scrollLeft/scrollTop are permanently 0, so uOffset never drifts with
       the page) and what keeps the canvas viewport-sized instead of
       document-sized. But a fixed decorative div is pointer-events: none, so no
       pointermove ever reaches it and the cursor wind would be dead. Listening
       on the document instead restores it without giving the layer a hit area.
       Defaults to content, so the lab is unaffected. */
    var pointerTarget = elements.pointerTarget || content;

    var gl = output.getContext('webgl2', {
      alpha: true,
      depth: false,
      stencil: false,
      antialias: false,
      premultipliedAlpha: true
    });
    if (!gl || gl.isContextLost()) return null;

    var sourceCtx = source.getContext('2d');
    var htmlInCanvas = Boolean(sourceCtx &&
      typeof sourceCtx.drawElementImage === 'function' &&
      typeof source.requestPaint === 'function');

    var contentDirty = false;
    var wake = function () {};

    if (htmlInCanvas) {
      source.onpaint = function () {
        try {
          sourceCtx.reset();
          sourceCtx.drawElementImage(content, 0, 0);
          contentDirty = true;
          wake();
        } catch (e) {}
      };
    }

    function compile(type, text) {
      var shader = gl.createShader(type);
      gl.shaderSource(shader, text);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Clouds shader error:', gl.getShaderInfoLog(shader));
      }
      return shader;
    }

    function link(fragSource) {
      var vs = compile(gl.VERTEX_SHADER, VERT);
      var fs = compile(gl.FRAGMENT_SHADER, fragSource);
      var program = gl.createProgram();
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      var uniforms = {};
      var count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
      for (var i = 0; i < count; i++) {
        var info = gl.getActiveUniform(program, i);
        uniforms[info.name] = gl.getUniformLocation(program, info.name);
      }
      return { program: program, vs: vs, fs: fs, uniforms: uniforms };
    }

    var field = link(FIELD_FRAG);
    var windPass = link(WIND_FRAG);
    var composite = link(COMPOSITE_FRAG);

    var quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    var fieldTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, fieldTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    var contentTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, contentTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA,
      gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
    gl.generateMipmap(gl.TEXTURE_2D);

    function makeWindTexture() {
      var texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return texture;
    }
    var windTextures = [makeWindTexture(), makeWindTexture()];
    var windIndex = 0;

    var fbo = gl.createFramebuffer();

    var fieldW = 0;
    var fieldH = 0;
    var contentScaleX = 1;
    var contentScaleY = 1;

    var baseColor = [1, 1, 1];
    var probe = document.createElement('canvas');
    probe.width = probe.height = 1;
    var probeCtx = probe.getContext('2d', { willReadFrequently: true });

    function syncBaseColor() {
      if (config.color !== 'auto') { baseColor = config.color; return; }
      if (!probeCtx) return;
      var el = content;
      while (el) {
        var bg = getComputedStyle(el).backgroundColor;
        if (bg && bg !== 'transparent') {
          probeCtx.clearRect(0, 0, 1, 1);
          probeCtx.fillStyle = bg;
          probeCtx.fillRect(0, 0, 1, 1);
          var d = probeCtx.getImageData(0, 0, 1, 1).data;
          if (d[3] > 0) {
            baseColor = [d[0] / 255, d[1] / 255, d[2] / 255];
            return;
          }
        }
        el = el.parentElement;
      }
      baseColor = [1, 1, 1];
    }

    function syncCanvasSize() {
      var cw = content.clientWidth;
      var ch = content.clientHeight;
      if (cw > 0 && ch > 0) {
        var wpx = cw + 'px';
        var hpx = ch + 'px';
        if (output.style.width !== wpx) output.style.width = wpx;
        if (output.style.height !== hpx) output.style.height = hpx;
      }
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var width = Math.max(1, Math.round(output.clientWidth * dpr));
      var height = Math.max(1, Math.round(output.clientHeight * dpr));
      if (output.width !== width || output.height !== height) {
        output.width = width;
        output.height = height;
      }
      contentScaleX = htmlInCanvas ? Math.min(1, cw / Math.max(source.clientWidth, 1)) : 1;
      contentScaleY = htmlInCanvas ? Math.min(1, ch / Math.max(source.clientHeight, 1)) : 1;
      var quality = Math.min(Math.max(config.quality, 0.2), 1);
      var cap = 1440 / Math.max(output.clientWidth, 1);
      var q = Math.min(quality, cap);
      var nextW = Math.max(16, Math.round(output.clientWidth * q));
      var nextH = Math.max(16, Math.round(output.clientHeight * q));
      if (nextW !== fieldW || nextH !== fieldH) {
        fieldW = nextW;
        fieldH = nextH;
        gl.bindTexture(gl.TEXTURE_2D, fieldTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, fieldW, fieldH, 0, gl.RGBA,
          gl.UNSIGNED_BYTE, null);
        gl.generateMipmap(gl.TEXTURE_2D);
        for (var i = 0; i < windTextures.length; i++) {
          gl.bindTexture(gl.TEXTURE_2D, windTextures[i]);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, fieldW, fieldH, 0, gl.RGBA,
            gl.UNSIGNED_BYTE, null);
        }
      }
      if (htmlInCanvas) {
        var cssWidth = Math.max(1, Math.round(source.clientWidth));
        var cssHeight = Math.max(1, Math.round(source.clientHeight));
        if (source.width !== cssWidth * dpr || source.height !== cssHeight * dpr) {
          source.width = cssWidth * dpr;
          source.height = cssHeight * dpr;
        }
        source.requestPaint();
      }
    }

    syncCanvasSize();
    syncBaseColor();

    function uploadContent() {
      if (!htmlInCanvas || !contentDirty) return;
      contentDirty = false;
      gl.bindTexture(gl.TEXTURE_2D, contentTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      gl.generateMipmap(gl.TEXTURE_2D);
    }

    var pointerX = 0.5, pointerY = 0.5;
    var prevPointerX = 0.5, prevPointerY = 0.5;
    var hasPointer = false;
    var lastPointerMove = 0;
    var time = Math.random() * 64;

    function render(delta) {
      uploadContent();

      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D, fieldTexture, 0);
      gl.viewport(0, 0, fieldW, fieldH);
      gl.useProgram(field.program);
      gl.uniform2f(field.uniforms.uResolution, fieldW, fieldH);
      gl.uniform2f(field.uniforms.uOffset,
        content.scrollLeft / Math.max(content.clientWidth, 1),
        -content.scrollTop / Math.max(content.clientHeight, 1));
      gl.uniform1f(field.uniforms.uTime, time);
      gl.uniform1f(field.uniforms.uScale, Math.max(config.scale, 0.05));
      gl.uniform1f(field.uniforms.uCover, Math.max(config.cover, 0));
      gl.uniform1f(field.uniforms.uDensity, Math.max(config.density, 0));
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      var prevWind = windTextures[windIndex];
      var nextWind = windTextures[1 - windIndex];
      windIndex = 1 - windIndex;
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D, nextWind, 0);
      gl.useProgram(windPass.program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, prevWind);
      gl.uniform1i(windPass.uniforms.uPrev, 0);
      gl.uniform2f(windPass.uniforms.uResolution, fieldW, fieldH);
      gl.uniform1f(windPass.uniforms.uDecay, Math.pow(0.5, delta / 0.7));
      var moved = Math.sqrt(Math.pow(pointerX - prevPointerX, 2) +
        Math.pow(pointerY - prevPointerY, 2));
      var stamping = hasPointer && moved > 0;
      gl.uniform2f(windPass.uniforms.uA, prevPointerX, prevPointerY);
      gl.uniform2f(windPass.uniforms.uB, pointerX, pointerY);
      gl.uniform1f(windPass.uniforms.uRadius,
        Math.max(config.windRadius, 1) / Math.max(output.clientHeight, 1));
      gl.uniform1f(windPass.uniforms.uStrength,
        stamping ? Math.min(0.2 + moved * 12, 1) * 0.5 : 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      prevPointerX = pointerX;
      prevPointerY = pointerY;

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.bindTexture(gl.TEXTURE_2D, fieldTexture);
      gl.generateMipmap(gl.TEXTURE_2D);

      gl.viewport(0, 0, output.width, output.height);
      gl.useProgram(composite.program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, fieldTexture);
      gl.uniform1i(composite.uniforms.uField, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, contentTexture);
      gl.uniform1i(composite.uniforms.uContent, 1);
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, nextWind);
      gl.uniform1i(composite.uniforms.uWind, 2);
      gl.uniform2f(composite.uniforms.uResolution, output.width, output.height);
      gl.uniform2f(composite.uniforms.uContentScale, contentScaleX, contentScaleY);
      gl.uniform3f(composite.uniforms.uBase, baseColor[0], baseColor[1], baseColor[2]);
      gl.uniform1f(composite.uniforms.uOpacity, Math.min(Math.max(config.opacity, 0), 1));
      gl.uniform1f(composite.uniforms.uShading, Math.max(config.shading, 0));
      gl.uniform1f(composite.uniforms.uShadow, Math.min(Math.max(config.shadow, 0), 1));
      gl.uniform2f(composite.uniforms.uShadowShift,
        -config.shadowOffsetX / Math.max(output.clientWidth, 1),
        config.shadowOffsetY / Math.max(output.clientHeight, 1));
      gl.uniform1f(composite.uniforms.uShadowLod,
        Math.min(Math.max(config.shadowSoftness, 0), 1) * 4);
      gl.uniform1f(composite.uniforms.uWindAmt, Math.min(Math.max(config.wind, 0), 1));
      gl.uniform1f(composite.uniforms.uRefraction,
        Math.max(config.refraction, 0) / Math.max(output.clientWidth, 1));
      gl.uniform1f(composite.uniforms.uFogBlur, Math.min(Math.max(config.fogBlur, 0), 1));
      gl.uniform1f(composite.uniforms.uHasContent, htmlInCanvas ? 1 : 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    var raf = 0;
    var lastTime = performance.now();
    var destroyed = false;
    var running = false;
    var visible = true;

    var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    var reducedMotion = motionQuery.matches;

    function frame(now) {
      if (destroyed) return;
      if (!visible) { running = false; return; }
      var delta = Math.min((now - lastTime) / 1000, 1 / 30);
      lastTime = now;
      if (!reducedMotion) time += delta * config.speed * 0.03;
      render(delta);
      var windActive = now - lastPointerMove < 3000;
      if (reducedMotion && !windActive && !contentDirty) { running = false; return; }
      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (destroyed || running || !visible) return;
      running = true;
      lastTime = performance.now();
      raf = requestAnimationFrame(frame);
    }

    wake = start;
    start();

    function onMotionChange() { reducedMotion = motionQuery.matches; start(); }
    motionQuery.addEventListener('change', onMotionChange);

    var observer = new ResizeObserver(function () { syncCanvasSize(); start(); });
    observer.observe(output);
    observer.observe(content);

    var intersection = new IntersectionObserver(function (entries) {
      var last = entries[entries.length - 1];
      visible = last ? last.isIntersecting : true;
      if (visible) start();
    });
    intersection.observe(output);

    function onPointerMove(event) {
      var rect = output.getBoundingClientRect();
      var x = (event.clientX - rect.left) / Math.max(rect.width, 1);
      var y = 1 - (event.clientY - rect.top) / Math.max(rect.height, 1);
      if (!hasPointer) { prevPointerX = x; prevPointerY = y; hasPointer = true; }
      pointerX = x;
      pointerY = y;
      lastPointerMove = performance.now();
      start();
    }
    function onPointerLeave() { hasPointer = false; }

    pointerTarget.addEventListener('pointermove', onPointerMove, { passive: true });
    pointerTarget.addEventListener('pointerleave', onPointerLeave, { passive: true });
    pointerTarget.addEventListener('scroll', start, { passive: true });

    var themeTimer = 0;
    function onThemeShift() {
      syncBaseColor();
      start();
      window.clearTimeout(themeTimer);
      themeTimer = window.setTimeout(function () { syncBaseColor(); start(); }, 300);
    }
    var themeObserver = new MutationObserver(onThemeShift);
    themeObserver.observe(document.documentElement, {
      attributes: true, attributeFilter: ['class', 'style', 'data-theme']
    });
    var schemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    schemeQuery.addEventListener('change', onThemeShift);

    return {
      htmlInCanvas: htmlInCanvas,
      setOptions: function (next) {
        var changed = false;
        for (var k in next) if (config[k] !== next[k]) { changed = true; break; }
        if (!changed) return;
        for (var k2 in next) config[k2] = next[k2];
        syncCanvasSize();
        syncBaseColor();
        start();
      },
      resize: function () { syncCanvasSize(); start(); },
      destroy: function () {
        destroyed = true;
        cancelAnimationFrame(raf);
        observer.disconnect();
        intersection.disconnect();
        themeObserver.disconnect();
        schemeQuery.removeEventListener('change', onThemeShift);
        window.clearTimeout(themeTimer);
        motionQuery.removeEventListener('change', onMotionChange);
        pointerTarget.removeEventListener('pointermove', onPointerMove);
        pointerTarget.removeEventListener('pointerleave', onPointerLeave);
        pointerTarget.removeEventListener('scroll', start);
        if (htmlInCanvas) source.onpaint = null;
        gl.deleteTexture(fieldTexture);
        gl.deleteTexture(contentTexture);
        gl.deleteTexture(windTextures[0]);
        gl.deleteTexture(windTextures[1]);
        gl.deleteFramebuffer(fbo);
        gl.deleteProgram(field.program);
        gl.deleteProgram(windPass.program);
        gl.deleteProgram(composite.program);
        gl.deleteShader(field.vs);
        gl.deleteShader(field.fs);
        gl.deleteShader(windPass.vs);
        gl.deleteShader(windPass.fs);
        gl.deleteShader(composite.vs);
        gl.deleteShader(composite.fs);
        gl.deleteBuffer(quad);
      }
    };
  }

  global.KSClouds = {
    create: createClouds,
    supportsHtmlInCanvas: supportsHtmlInCanvas,
    DEFAULTS: DEFAULTS
  };
})(window);
