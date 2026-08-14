/* ==========================================================================
   SPINE BACKGROUND — scroll-linked charge front.
   Pairs with css/spine-bg.css. Loaded by index.html and about.html — any page
   with a [data-spine-from] anchor; the guard below returns everywhere else.

   The layer spans from the top of #tracks to the bottom of the document and is
   built here rather than in the HTML, so index.html carries one script tag and
   no extra markup. It is inert: aria-hidden, pointer-events:none, and it never
   listens for anything the carousel wants.
   ========================================================================== */
(function () {
  'use strict';

  /* WHERE THE COLUMN STARTS. Was hard-bound to #tracks, which is why this file
     could only ever run on the front page — the guard below returned on every
     other page before anything was built.

     `data-spine-from` is the general form: put it on the element the column
     should begin at, and the layer spans from there to the bottom of the
     document. index.html keeps working with no markup change because #tracks
     is still the fallback, and that ordering matters — a page that has BOTH
     should honour the explicit attribute rather than the historical id.

     Do NOT fall back to <main> or <body> if neither is present. Returning is
     correct: a page that has not opted in should not get a spine because it
     happens to have a main element, and silently anchoring to the top of the
     document would put the charge front behind the header on every page in the
     site the moment someone adds the script tag. */
  var anchor = document.querySelector('[data-spine-from]')
            || document.getElementById('tracks');
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

  /* THE LIGHTNING LAYER — a real element because all six full-viewport pseudo
     slots are spoken for (base sky, four bands, nebula; see "TWO LAYERS PER
     ELEMENT IS THE CEILING" in css/star-bg.css). Injected here rather than
     written into the HTML so star-bg.css stays one <link> with no markup, and
     injected UNCONDITIONALLY beside the spine build: it is styled entirely by
     css/star-bg.css, idles at opacity 0, and only the snare rule
     (:root.is-spine-kicking .star-bolt) ever raises it — so on a page where
     the detector cannot attach the div simply sits invisible. That is a
     stated decision, not an accident; the long note sits with the CSS.
     Nothing else in this file touches it except the strike rotation below:
     no size, no position, no listeners. If star-bg.css is not linked the
     divs are empty, unstyled, zero-height elements — inert, same as the sky
     being absent.

     FIVE OF THEM SINCE BUILD 20 — one per strike pattern (a = the HANDOFF
     14 asset, c = the outer wing from HANDOFF 16, d/e/f = the owner's three
     reference frames extracted directly by scripts/bolt-extract.py's
     reference-frame mode: d the sparse left-core crackle, e the heaviest
     full-band state, f the upper-right arm emphasis). There is no b: a
     second diagonal pattern was built, tuned through four containment
     rounds and removed by the owner's eye ("it just doesn't look right") —
     the slot letter is retired so the handoffs' history stays readable.
     All divs carry the same .star-bolt class ON PURPOSE: STAR_LAYERS, the
     view modes and the reduced-motion rule all address the lightning by
     that class, and divs sharing it inherit every one of those
     registrations for free — a variant div with its own class name would
     silently drop out of all of them. Only the div with .is-struck lights
     on a strike; the snare machine moves that class at the moment a strike
     is accepted — random among the others, never the same twice in a row
     (the owner's rule; the two-pattern builds' strict alternation was its
     reduction, and five patterns restore the original random pick). All
     five images decode at injection (~190 KB total, once) so the first
     strike of any pattern never waits on the network. */
  var BOLT_VARIANTS = ['a', 'c', 'd', 'e', 'f'];
  var bolts = [];
  for (var bi = 0; bi < BOLT_VARIANTS.length; bi++) {
    var bolt = document.createElement('div');
    bolt.className = 'star-bolt star-bolt--' + BOLT_VARIANTS[bi];
    bolt.setAttribute('aria-hidden', 'true');
    document.body.insertBefore(bolt, layer);
    bolts.push(bolt);
  }
  /* Which pattern the NEXT strike lights. Random per page load, so reloads
     do not all open on the same filaments. */
  var boltAt = Math.floor(Math.random() * bolts.length);
  bolts[boltAt].className += ' is-struck';

  var top = 0, height = 0;

  /* Measure where the layer starts and how tall it is, in DOCUMENT space.
     Called on resize, on font load, and — importantly — whenever the document
     changes height. */
  /* --spine-from shifts the START of the layer off the anchor, in px, negative
     being higher up the page. The anchor picks a landmark in the markup; this
     picks how far before it the column begins, which is a thing you want to
     drag rather than to guess and re-edit the HTML for.

     It is read here rather than applied in CSS on purpose. The layer's top and
     height are inline px set by this function — CSS cannot see the anchor, and
     a transform would move the artwork without moving the region the charge
     front is mapped over, so the front would finish in the wrong place. Read
     off documentElement because that is where the tuner writes. */
  function fromShift() {
    var v = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue('--spine-from')
    );
    return isFinite(v) ? v : 0;
  }

  function measure() {
    var r = anchor.getBoundingClientRect();
    var newTop = Math.max(0, Math.round(r.top + window.scrollY) + fromShift());
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
     KICK-REACTIVE SPINE, AND THE SNARE-REACTIVE LIGHTNING
     The pulse above is a fixed 5.3s loop that only knows whether audio is
     playing. This follows the actual kick drum and writes a decaying envelope
     to --kick once per frame, which css/spine-bg.css turns into a flash on the
     lit column and a sideways throw on the artwork, and css/star-bg.css turns
     into a flick on the star cores.

     SINCE 2026-08-06 THE SAME LOOP RUNS A SECOND DETECTOR — the snare — and
     writes a SECOND envelope, --snare, which css/star-bg.css turns into the
     lightning strike on .star-bolt. Two instruments, two channels: the kick
     never touches the lightning and the snare touches nothing else. The
     snare's numbers were proven OFFLINE FIRST against all 28 samples
     (scripts/snare-tuning.py, HANDOFF 13's sequencing rule) — the proof
     killed one wrong gate before it got here; read the harness header before
     re-tuning the constants below.

     IT DOES NOT USE THE FFT, AND THAT IS THE WHOLE POINT — see the note on the
     side chain in attach() below. The first version read
     getByteFrequencyData and it was wrong in a way that had to be heard before
     it could be measured.

     THE SHAPE OF THIS CODE IS DEFENSIVE ON PURPOSE, because one step in it is
     irreversible: createMediaElementSource(el) permanently reroutes that
     element's output through the graph. Get it wrong and the samples go SILENT
     — which is a far worse failure than no visualiser. So the order is:
     build the context, confirm it is actually RUNNING, and only then route the
     element. Every early return below leaves playback on the browser's own
     path, untouched, and leaves the page rendering exactly as build 22 did.
     ======================================================================== */
  var reduceMotion = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

  /* Read by the tuner's meter further down. Null until the graph is running,
     so the panel can say WHY nothing is moving rather than just showing 0. */
  var kickMeter = null;

  var AudioCtx = window.AudioContext || window.webkitAudioContext;

  if (section && AudioCtx && window.WeakMap) (function () {
    var root = document.documentElement;

    var ctx = null, analyser = null, buf = null, filters = null;
    /* The snare side chain: three highpass stages -> analyserS (the noise
       burst), and one 200Hz bandpass -> analyserB (the body corroborator).
       Built beside the kick chain in attach(), routed in route(). */
    var analyserS = null, bufS = null, hpFilters = null;
    var analyserB = null, bufB = null, bodyFilter = null;
    /* Keyed by ELEMENT, because wireSamplePlayer() builds a fresh Audio() on
       every panel change — 28 tracks, 28 elements over a session — and
       createMediaElementSource THROWS on a second call for the same one. */
    var sources = new WeakMap();
    var dead = false;   /* something threw; stop trying, keep audio working */

    /* Envelope state. `env` is the 0..1 decaying visual value; `sign` flips on
       every onset so consecutive hits throw the column to opposite sides — a
       shake, not a lean. `base` and `peak` are the streaming statistics the
       threshold is built from; `armed` is the leading-edge latch. */
    var env = 0, sign = 1, lastWritten = null;
    var base = 0, peak = 0, prevLevel = 0, armed = true, level = 0;
    var lastKick = -1e9, lastFrame = 0, startedAt = 0;
    var running = false, kicks = 0;

    /* Snare state — the same machine three more times over: one for the
       2.5kHz noise band, one for the 200Hz body band, and the envelope. All
       of it mirrors scripts/snare-tuning.py line for line; if the two ever
       disagree, the Python is the specification and this is the bug. */
    var envS = 0, lastWrittenS = null;
    var baseS = 0, peakS = 0, prevS = 0, armedS = true, levelS = 0;
    var baseB = 0, peakB = 0, prevB = 0, armedB = true, levelB = 0;
    var lastSnare = -1e9, lastBody = -1e9, snares = 0;
    /* A candidate strike waits here for VETO ms before it flashes, so a kick
       landing just after it can still cancel it. -1 = nothing pending. */
    var pendingSnare = -1, pendingHit = 0;

    /* MS between accepted onsets. MEASURED: with the reference rebuilt at a
       musically sane minimum spacing, the median gap between real kicks on this
       record is 827ms — 72.5 BPM, which is the tempo HANDOFF 4 recorded for
       May 26th. 190 never truncates a real pattern and it stops one drum being
       counted twice, once on its attack and once on its body. */
    var REFRACTORY = 190;
    /* Detection is suppressed for this long after the loop starts, so the
       running statistics have something in them before they are trusted. */
    var WARMUP = 300;
    /* Time constant of the running average the threshold floats on. */
    var BASE_MS = 900;
    /* Time constant of the decaying running peak. This is what makes the
       detector work in a quiet passage: the floor is a fraction of how loud
       things have RECENTLY been, not of how loud they are overall. */
    var PEAK_MS = 3000;
    /* The floor, as a fraction of that running peak. Its job is only to stop
       the detector chewing on near-silence, where a ratio against a tiny
       average means nothing. */
    var FLOOR_FRAC = 0.06;

    /* ---- SNARE CONSTANTS, all measured in scripts/snare-tuning.py ---------
       REFRACTORY_S  ms between accepted strikes. 150 against the kick's 190:
                     snares sit on the backbeat and 150 never truncated a real
                     pattern in the offline run.
       VETO          the ±ms around a live kick inside which nothing counts.
                     SYMMETRIC, which is why pendingSnare exists: the kick's
                     own beater click crosses 2.5kHz a few ms BEFORE the low
                     band trips, so "no kick recently" alone still fires on
                     the kick. A candidate therefore WAITS 45ms and a kick
                     arriving in that window cancels it. The cost is a ~3
                     frame delay on the flash, well inside the window where
                     sound and light read as simultaneous; the win is a
                     failure mode removed, not a tuning preference.
       COINC         how recent the 200Hz body onset must be for a noise-band
                     onset to count as a snare. The gate is a coincidence of
                     ONSETS, not of derivatives — the first offline attempt
                     gated on "body RMS rising", which is true half the time
                     regardless, fired 26 times per 20s and scored 0.30 phase
                     concentration. Two full threshold machines, 0.66.
       BODY_HZ/SENS  the body band. Fixed, not sliders: the sweep moved them
                     an entire step (1.3 -> 2.0) for 0.05 of concentration,
                     and a slider that does nothing reads as broken. */
    var REFRACTORY_S = 150;
    var VETO = 45;
    var COINC = 45;
    var BODY_HZ = 200;
    var BODY_SENS = 1.5;

    /* The numbers JS reads out of CSS. Re-read on a throttle rather than per
       frame — getComputedStyle 5x/sec is free, 60x/sec is not, and the only
       thing that ever changes them is a human dragging a slider. */
    var P = { gain: 1, decay: 260, sens: 1.8, freq: 90,
              sdecay: 260, ssens: 2.2, sfreq: 2500 };
    var paramsAt = -1e9;
    function readParams(now) {
      if (now - paramsAt < 200) return;
      paramsAt = now;
      var cs = getComputedStyle(root);
      var num = function (name, dflt) {
        var v = parseFloat(cs.getPropertyValue(name));
        return isNaN(v) ? dflt : v;
      };
      P.gain  = num('--kick-gain', 1);
      P.decay = Math.max(30, num('--kick-decay', 260));
      P.sens  = Math.max(1.01, num('--kick-sens', 1.8));
      var f = Math.max(30, Math.min(400, num('--kick-freq', 90)));
      if (f !== P.freq && filters) {
        P.freq = f;
        for (var i = 0; i < filters.length; i++) filters[i].frequency.value = f;
      } else {
        P.freq = f;
      }
      /* The snare's three live controls; the body band is fixed (see the
         constants above). NOT scaled by --kick-gain anywhere — the kick and
         the snare are separate channels, and coupling their outputs through
         one master would retune the lightning every time the column is. */
      P.sdecay = Math.max(30, num('--snare-decay', 260));
      P.ssens  = Math.max(1.01, num('--snare-sens', 2.2));
      var sf = Math.max(500, Math.min(8000, num('--snare-freq', 2500)));
      if (sf !== P.sfreq && hpFilters) {
        P.sfreq = sf;
        for (var j = 0; j < hpFilters.length; j++) hpFilters[j].frequency.value = sf;
      } else {
        P.sfreq = sf;
      }
    }

    function frame(now) {
      if (!running) return;

      /* Clamped, because a backgrounded tab stops calling rAF while the audio
         keeps playing — the first frame back can be seconds later, and an
         unclamped dt would collapse the envelope or make the running average
         jump to the current frame in one step. */
      var dt = lastFrame ? Math.min(100, now - lastFrame) : 16;
      lastFrame = now;
      readParams(now);

      /* THE LEVEL: plain RMS of the low-passed signal, in the TIME DOMAIN.
         Linear amplitude, not decibels, so a factor here is a factor in the
         actual signal — which is what makes --kick-sens mean something. */
      analyser.getFloatTimeDomainData(buf);
      var sum = 0;
      for (var i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
      level = Math.sqrt(sum / buf.length);

      base = base * Math.exp(-dt / BASE_MS) + level * (1 - Math.exp(-dt / BASE_MS));
      peak = Math.max(peak * Math.exp(-dt / PEAK_MS), level);

      var thr = Math.max(peak * FLOOR_FRAC, base * P.sens);
      var rising = level > prevLevel;
      prevLevel = level;

      if (!startedAt) startedAt = now;
      if (level > thr && rising && armed) {
        /* Latch immediately, whether or not the refractory lets it through, so
           one excursion above the threshold can only ever fire once. */
        armed = false;
        if (now - startedAt > WARMUP && now - lastKick > REFRACTORY) {
          lastKick = now;
          sign = -sign;
          kicks++;
          /* Size the flash against how big this hit is relative to the loudest
             thing heard recently, so a soft kick reads smaller than a hard one
             and the column has dynamics rather than a binary blink. */
          var hit = peak > 0 ? 0.35 + 0.65 * Math.min(1, level / peak) : 0.6;
          if (hit > env) env = hit;
        }
      } else if (level <= thr) {
        armed = true;
      }

      /* ---- THE SNARE, in the same order as scripts/snare-tuning.py: the
         kick machine above ran first so a same-frame kick can cancel the
         pending strike below. ---- */

      /* A candidate waiting out the ±VETO window: cancelled if a kick landed
         inside it, accepted — and only then flashed — once it closes. */
      if (pendingSnare >= 0) {
        if (lastKick > pendingSnare - VETO) {
          pendingSnare = -1;
        } else if (now - pendingSnare >= VETO) {
          lastSnare = pendingSnare;
          pendingSnare = -1;
          snares++;
          /* Move .is-struck BEFORE the envelope jump below, so this strike
             lights the pattern it lands on. Random among the OTHER
             patterns — never the same twice in a row, the owner's rule
             (see the injection note: the two-pattern builds advanced
             (boltAt+1) % length because at two patterns this rule IS
             strict alternation; at five the original random pick is back,
             not a redesign). The previous pattern's decay tail is cut
             mid-fade when this fires inside it; at REFRACTORY_S 150ms and
             s ms 260 that read as the new strike replacing the old on real
             hardware, not as a glitch — and it is exactly how a fresh
             strike should behave. */
          bolts[boltAt].classList.remove('is-struck');
          var boltNext = Math.floor(Math.random() * (bolts.length - 1));
          if (boltNext >= boltAt) boltNext++;
          boltAt = boltNext;
          bolts[boltAt].classList.add('is-struck');
          if (pendingHit > envS) envS = pendingHit;
        }
      }

      /* The 200Hz body machine. It fires no visual — its onset times are the
         gate the noise band must coincide with. */
      analyserB.getFloatTimeDomainData(bufB);
      var sumB = 0;
      for (var ib = 0; ib < bufB.length; ib++) sumB += bufB[ib] * bufB[ib];
      levelB = Math.sqrt(sumB / bufB.length);
      baseB = baseB * Math.exp(-dt / BASE_MS) + levelB * (1 - Math.exp(-dt / BASE_MS));
      peakB = Math.max(peakB * Math.exp(-dt / PEAK_MS), levelB);
      var thrB = Math.max(peakB * FLOOR_FRAC, baseB * BODY_SENS);
      var risingB = levelB > prevB;
      prevB = levelB;
      if (levelB > thrB && risingB && armedB) {
        armedB = false;
        if (now - startedAt > WARMUP) lastBody = now;
      } else if (levelB <= thrB) {
        armedB = true;
      }

      /* The 2.5kHz noise machine. An onset here is a snare only if the body
         band produced its own onset within COINC ms AND no kick sits inside
         the ±VETO window — the second half of which is what pendingSnare is
         waiting to find out. */
      analyserS.getFloatTimeDomainData(bufS);
      var sumS = 0;
      for (var is2 = 0; is2 < bufS.length; is2++) sumS += bufS[is2] * bufS[is2];
      levelS = Math.sqrt(sumS / bufS.length);
      baseS = baseS * Math.exp(-dt / BASE_MS) + levelS * (1 - Math.exp(-dt / BASE_MS));
      peakS = Math.max(peakS * Math.exp(-dt / PEAK_MS), levelS);
      var thrS = Math.max(peakS * FLOOR_FRAC, baseS * P.ssens);
      var risingS = levelS > prevS;
      prevS = levelS;
      if (levelS > thrS && risingS && armedS) {
        armedS = false;
        if (now - startedAt > WARMUP && now - lastSnare > REFRACTORY_S &&
            pendingSnare < 0 && now - lastBody <= COINC &&
            now - lastKick >= VETO) {
          pendingSnare = now;
          /* Sized now, against the band's stats at the moment of the onset,
             not at acceptance 45ms later when the transient has passed. */
          pendingHit = peakS > 0 ? 0.35 + 0.65 * Math.min(1, levelS / peakS) : 0.6;
        }
      } else if (levelS <= thrS) {
        armedS = true;
      }

      env *= Math.exp(-dt / P.decay);
      if (env < 0.002) env = 0;
      envS *= Math.exp(-dt / P.sdecay);
      if (envS < 0.002) envS = 0;

      /* Write only when the value moved. Writing a custom property on <html>
         invalidates style for the whole document, so not writing an unchanged
         one is worth a string compare.

         DO NOT EXPECT THIS TO SAVE ANYTHING DURING PLAYBACK, and do not remove
         it expecting a regression. MEASURED on the owner's machine 2026-08-05,
         old behaviour against new, back to back: it skipped 0% of frames and
         both read 62.5ms. The reason is arithmetic, not luck — the envelope
         decays with a 260ms time constant and a hit lands every ~500-800ms, so
         between hits it never reaches the 0.002 cut-off, at any frame rate, and
         consecutive frames essentially never produce the same 4-decimal string.
         What this does cover is a genuine silent passage, where it does settle.

         --kick-sign is inside the same guard deliberately: it only ever changes
         on a hit, and a hit always changes --kick, so it cannot be missed. */
      var out = (env * P.gain).toFixed(4);
      if (out !== lastWritten) {
        root.style.setProperty('--kick', out);
        root.style.setProperty('--kick-sign', sign < 0 ? '-1' : '1');
        lastWritten = out;
      }
      /* Same guard, separate channel. NOT multiplied by --kick-gain — the
         snare's own amount lives in --snare-bolt, where the layer is. */
      var outS = envS.toFixed(4);
      if (outS !== lastWrittenS) {
        root.style.setProperty('--snare', outS);
        lastWrittenS = outS;
      }

      requestAnimationFrame(frame);
    }

    function start() {
      if (running || !analyser) return;
      running = true;
      lastFrame = 0; startedAt = 0; env = 0; lastWritten = null;
      base = 0; peak = 0; prevLevel = 0; armed = true;
      envS = 0; lastWrittenS = null;
      baseS = 0; peakS = 0; prevS = 0; armedS = true;
      baseB = 0; peakB = 0; prevB = 0; armedB = true;
      lastBody = -1e9; lastSnare = -1e9; pendingSnare = -1;
      root.classList.add('is-spine-kicking');
      requestAnimationFrame(frame);
    }

    /* THE STOP IS TWO-STEP, and the order matters.
       --kick goes to 0 while .is-spine-kicking is still on, so the column lands
       back on --spine-lit under `transition: none` — instantly. Only then is
       the class dropped, which restores the 700ms filter transition with the
       value already where it belongs, so nothing smears. Drop the class first
       and the column falls from mid-flash over 700ms, which reads as the spine
       sagging every time a sample is paused. */
    function stop() {
      if (!running) return;
      running = false;
      env = 0;
      envS = 0; pendingSnare = -1;
      root.style.setProperty('--kick', '0');
      root.style.setProperty('--snare', '0');
      lastWritten = '0';
      lastWrittenS = '0';
      requestAnimationFrame(function () {
        if (!running) root.classList.remove('is-spine-kicking');
      });
    }

    function attach(audio) {
      if (dead) return;
      if (reduceMotion && reduceMotion.matches) return;

      try {
        if (!ctx) {
          ctx = new AudioCtx();

          /* ---- THE SIDE CHAIN, and why it is not an FFT -------------------
             MEASURED against a hand-built reference over all 28 samples
             (scripts/kick-tuning.py):

               getByteFrequencyData, 40-120Hz, rise threshold
                                              precision 0.44   recall 0.54
               this — biquad lowpass + RMS    precision 0.76   recall 0.79

             The owner heard the difference before any of this was measured:
             "it seems to only pick up when the audio level is at its peak and
             not isolating the kick drum frequency." Three reasons he was right,
             all structural rather than a matter of tuning:

             1. AT fftSize 2048 A BIN IS 21.5Hz, so the whole kick band is FOUR
                BINS. Every band setting tried — 30-90, 40-120, 45-95 — resolved
                to the same four bins and scored identically. The band controls
                were close to inert.
             2. getByteFrequencyData IS DECIBELS. On a limited master a
                sustained bass note holds those bins high, and a log scale
                compresses the drum's transient on top of it to almost nothing.
             3. The old version gated on `energy > runningAverage`, which is
                literally "only when this passage is louder than usual" — the
                exact symptom reported.

             A BiquadFilterNode is a real filter with a real rolloff, and RMS of
             the time domain is linear amplitude. Three lowpass stages at Q 1.0
             give a 18dB/octave skirt, which actually rejects the bass line
             instead of averaging four bins that contain it.

             NOTE THE GRAPH SHAPE. The source goes to the destination DRY. The
             filters are a branch off it, and the analyser's output is
             deliberately connected to nothing — an AnalyserNode observes
             without needing an onward connection. Put the filters in the path
             to the destination and the visitor hears a kick drum and nothing
             else. */
          analyser = ctx.createAnalyser();
          /* 1024 samples is 23ms at 44.1kHz, close to one frame at 60fps. This
             is a TIME DOMAIN buffer length here, not a spectrum — bigger just
             means a longer, laggier RMS window. */
          analyser.fftSize = 1024;
          buf = new Float32Array(analyser.fftSize);

          filters = [];
          for (var s = 0; s < 3; s++) {
            var f = ctx.createBiquadFilter();
            f.type = 'lowpass';
            f.frequency.value = P.freq;
            f.Q.value = 1.0;
            filters.push(f);
            if (s > 0) filters[s - 1].connect(f);
          }
          filters[filters.length - 1].connect(analyser);

          /* ---- THE SNARE SIDE CHAINS, same shape, same rules ------------
             Two more branches off the dry source, observing and connecting
             onward to nothing. Three highpass stages mirror the kick's three
             lowpass — an 18dB/octave skirt at 2.5kHz that actually rejects
             the mids instead of averaging them — and the single 200Hz
             bandpass is the body corroborator, one stage because it gates
             rather than measures. Same fftSize for the same reason: this is
             a time-domain RMS window, not a spectrum. */
          analyserS = ctx.createAnalyser();
          analyserS.fftSize = 1024;
          bufS = new Float32Array(analyserS.fftSize);
          hpFilters = [];
          for (var s2 = 0; s2 < 3; s2++) {
            var f2 = ctx.createBiquadFilter();
            f2.type = 'highpass';
            f2.frequency.value = P.sfreq;
            f2.Q.value = 1.0;
            hpFilters.push(f2);
            if (s2 > 0) hpFilters[s2 - 1].connect(f2);
          }
          hpFilters[hpFilters.length - 1].connect(analyserS);

          analyserB = ctx.createAnalyser();
          analyserB.fftSize = 1024;
          bufB = new Float32Array(analyserB.fftSize);
          bodyFilter = ctx.createBiquadFilter();
          bodyFilter.type = 'bandpass';
          bodyFilter.frequency.value = BODY_HZ;
          bodyFilter.Q.value = 1.0;
          bodyFilter.connect(analyserB);
        }
      } catch (err) { dead = true; return; }

      var route = function () {
        /* THE GUARD THIS WHOLE FUNCTION IS BUILT AROUND. An AudioContext starts
           suspended and only a user gesture resumes it; if autoplay policy
           refuses, routing the element into a suspended context makes the
           sample silent with no way back — createMediaElementSource cannot be
           undone. So: only route once the context is confirmed RUNNING.
           Refused means no visualiser and perfectly normal playback. */
        if (!ctx || ctx.state !== 'running') return;
        try {
          if (!sources.has(audio)) {
            var src = ctx.createMediaElementSource(audio);
            src.connect(ctx.destination);   /* DRY PATH — do this first */
            src.connect(filters[0]);        /* kick side chain, analysis only */
            src.connect(hpFilters[0]);      /* snare noise band, analysis only */
            src.connect(bodyFilter);        /* snare body band, analysis only */
            sources.set(audio, src);
          }
        } catch (err) { dead = true; return; }
        start();
      };

      if (ctx.state === 'suspended' && ctx.resume) {
        var p;
        try { p = ctx.resume(); } catch (err) { return; }
        if (p && p.then) p.then(route, function () {}); else route();
      } else {
        route();
      }
    }

    /* track-experience.js announces each sample element as it wires it. */
    section.addEventListener('ks:sample-ready', function (e) {
      var audio = e.detail && e.detail.audio;
      if (!audio) return;
      audio.addEventListener('play', function () { attach(audio); });
      audio.addEventListener('pause', stop);
      audio.addEventListener('ended', stop);
    });

    /* Reduced motion can be toggled without a reload. Honour it live — every
       other motion feature on this page does. */
    if (reduceMotion) {
      var onMotionPref = function () { if (reduceMotion.matches) stop(); };
      if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', onMotionPref);
      else if (reduceMotion.addListener) reduceMotion.addListener(onMotionPref);
    }

    kickMeter = function () {
      return {
        env: env, running: running, kicks: kicks,
        state: ctx ? ctx.state : (dead ? 'failed' : 'not built'),
        band: analyser ? '<' + Math.round(P.freq) + 'Hz' : '—',
        level: level, thr: Math.max(peak * FLOOR_FRAC, base * P.sens),
        /* The snare machine's readout, same fields one letter over. `bolt`
           is which pattern the NEXT strike lights (a/c) — it advances the
           moment a strike is accepted, so mid-flash it names the pattern
           currently lit. */
        envS: envS, snares: snares, bolt: BOLT_VARIANTS[boltAt],
        bandS: analyserS ? '>' + (P.sfreq / 1000) + 'kHz' : '—',
        levelS: levelS, thrS: Math.max(peakS * FLOOR_FRAC, baseS * P.ssens),
      };
    };
  })();

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
    /* THE WHOLE-COLUMN TOGGLE. step 1 so it snaps 0/1 — intermediate values
       are safe (it multiplies the children's opacities, never the parent's)
       but the control MEANS on/off, and a column at 0.4 reads as a bug.
       Page-scoped like everything else: html.page-home ships it at 0, so on
       the home page this slider starts at 0 and dragging it to 1 shows the
       column exactly as tuned. Copy CSS lands it in the page's own block. */
    { v: '--spine-on',    label: 'on',     min: 0,   max: 1,   step: 1,    unit: '' },
    { v: '--spine-w',     label: 'width',  min: 120, max: 640, step: 5,    unit: 'px' },
    { v: '--spine-dim',   label: 'dim',    min: 0,   max: 0.6, step: 0.01, unit: ''   },
    { v: '--spine-lit',   label: 'lit',    min: 0,   max: 1.6, step: 0.02, unit: ''   },
    { v: '--spine-glow',  label: 'glow',   min: 0,   max: 1,   step: 0.02, unit: ''   },
    { v: '--spine-feather', label: 'reach', min: 10, max: 900, step: 10,   unit: 'px' },
    { v: '--spine-from',   label: 'start',  min: -2000, max: 1000, step: 10, unit: 'px' },
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
    /* THE KICK. Two groups: what it LOOKS like, then what it LISTENS to.
       Tune in that order — get the listening right against the meter below
       first, with the look turned up high enough to be unmissable, then bring
       the look back down to taste. Doing it the other way round means judging
       a detector you cannot see the output of.
         k fl   brightness added to the lit column per unit of envelope.
         k px   how far the artwork throws sideways. WHOLE COLUMN, not just the
                lit band — see the note in spine-bg.css for why it cannot be
                lit-only. 0 leaves the flash alone, which is a complete look.
         k amt  master multiplier on the envelope. 0 is off.
         k ms   decay time constant. Short reads as a tick, long as a swell.
         k sns  how far above the running average counts as a hit, as a
                MULTIPLE of it. This is now a ratio of real amplitude, not of
                decibels, so 1.8 means genuinely 1.8x. Come here FIRST if it
                fires on everything (down) or on nothing (up). MEASURED against
                a reference over all 28 samples: 1.8 gives precision 0.76 /
                recall 0.79; 1.5 trades precision for recall (0.70 / 0.81);
                past ~2.5 the quiet tracks start dropping out.
         k hz   the lowpass cutoff of the side chain, in Hz — the actual
                "isolate the kick" control. 90 measured best. Up towards 150
                lets more of the bass line in; below ~60 you start losing the
                drum's own fundamental on the lighter tracks.
         k sky  how hard the star cores answer. Lives in star-bg.css. */
    { v: '--kick-flash', label: 'k fl',  min: 0, max: 1.2, step: 0.02, unit: '' },
    { v: '--kick-shake', label: 'k px',  min: 0, max: 40,  step: 1,    unit: '' },
    { v: '--kick-gain',  label: 'k amt', min: 0, max: 3,   step: 0.05, unit: '' },
    { v: '--kick-decay', label: 'k ms',  min: 60, max: 900, step: 10,  unit: '' },
    { v: '--kick-sens',  label: 'k sns', min: 1.1, max: 3.5, step: 0.05, unit: '' },
    { v: '--kick-freq',  label: 'k hz',  min: 40, max: 220, step: 5,   unit: '' },
    { v: '--kick-stars', label: 'k sky', min: 0, max: 1,   step: 0.02, unit: '',
      file: 'css/star-bg.css' },
    /* k neb — the nebula's own kick, split off --kick-stars on 2026-08-05.
       The cores and the clouds clip at different places, so a single knob could
       not drive both: filling the cloud headroom through the old `* 0.5` needed
       --kick-stars at 1.0, which puts the cores at 1.46 against a ceiling of 1.
       Max 1 because --star-cloud * 1.8 is 0.486 while playing, so much past 0.5
       is spent against the clamp and the top of this slider does nothing. */
    { v: '--kick-cloud', label: 'k neb', min: 0, max: 1,   step: 0.02, unit: '',
      file: 'css/star-bg.css' },
    /* THE SNARE — the lightning's channel, separate from the kick on purpose:
       the kick moves the column, the shake and the nebula; the snare strikes
       the lightning and strikes nothing else. Defaults proven offline against
       all 28 samples in scripts/snare-tuning.py before any of this was
       written — read its header before re-tuning, especially before lowering
       s sns, which is stricter than the kick's sens because the high band is
       busier and everything below ~2.0 bled onto the hats in the sweep.
         s bolt  how hard a strike lands, per unit of envelope. Max 1 and the
                 WHOLE range is real, unlike k neb: the layer idles at
                 opacity 0, so no resting baseline spends the headroom. For
                 brightness reach for `bolt b` in the sky group — this is the
                 envelope's range, and spending range on brightness is the
                 --star-cloud trap again.
         s ms    the strike's decay. Its own envelope, not the kick's — the
                 two decays are independent.
         s sns   threshold multiple on the 2.5kHz noise band.
         s hz    the noise band's highpass cutoff. The 200Hz body gate and
                 the ±45ms kick veto are fixed in code, measured, not
                 sliders. */
    { v: '--snare-bolt', label: 's bolt', min: 0, max: 1,   step: 0.02, unit: '',
      file: 'css/star-bg.css' },
    { v: '--snare-decay', label: 's ms', min: 60, max: 900, step: 10, unit: '' },
    { v: '--snare-sens', label: 's sns', min: 1.5, max: 3.5, step: 0.05, unit: '' },
    { v: '--snare-freq', label: 's hz', min: 1000, max: 5000, step: 100, unit: '' },
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
    /* BLACK POINT, in levels out of 255, subtracted from the sky before it
       screens onto the page. 0 is an exact identity — build 8 pixel for pixel.
       This is the control for "the blacks are not black": the wash is the faint
       dust across 58% of the frame sitting ~9 levels of blue above the page,
       and a subtract kills that while barely touching the star cores (187 -> 175
       across the whole slider). Reach for this rather than `stars`, which dims
       the stars along with the dust — and rather than `hue`, which was measured
       against it and lost: at equal nebula cost it blackens less AND discards
       the deep-blue grade. By 6 the red and green channels are already at page
       black and everything left is blue. Above ~14 the nebula reads as cut out
       rather than fading. */
    { v: '--star-black', label: 'black', min: 0, max: 16, step: 1, unit: '',
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
      file: 'css/star-bg.css' },
    /* cloud b — the nebula's brightness, which lives in the cloud filter rather
       than in `cloud` above. Hard-coding it in build 13 quietly removed the
       nebula's brightness control from this panel, since `cloud` had been that
       control until the kick work moved the brightness into the filter.
       Max 3 because the two are a pair: at the shipped cloud 0.27 the useful
       range is roughly 1.0 to 2.6, and past 3 the glow is the dominant light
       source on the page, which HANDOFF 8 already tried and rejected at 0.92.
       Drag this one for "more nebula". Dragging `cloud` for it works, and it
       spends the headroom the kick needs, which is the trap. */
    { v: '--star-cloud-bright', label: 'cloud b', min: 0.2, max: 3, step: 0.05, unit: '',
      file: 'css/star-bg.css' },
    /* bolt b — static brightness of the lightning filaments, in the layer's
       filter so it is unclamped, same split as cloud b. THIS is the lever if
       the strikes read faint. Max 4 rather than cloud b's 3 because the asset
       is far cheaper than the cloud: 0.351/255 mean on ~3% of frame at
       envelope 0.35, against the cloud's ~1.94/255 on ~50% — there is real
       headroom before it dominates the page. 0 is off. */
    { v: '--star-bolt-bright', label: 'bolt b', min: 0, max: 4, step: 0.05, unit: '',
      file: 'css/star-bg.css' },
    /* THE DOCUMENT RAIL — the left-axis spine of the home document
       (css/spine-doc.css + js/spine-doc.js), added Aug 14 2026 with the graded
       tick field and the node ripple. All seven live in spine-doc.css, whose
       :root block is index-only, so like the kick set these are hidden on any
       page without a .ksd-rail — see the gate below.
         field    the tick field falloff radius. Read by js/spine-doc.js every
                  scroll frame, so the slider handler nudges a scroll event to
                  show the change without the mouse leaving the slider.
         ring on  the size the ripple scales OUT FROM while focused; ring sz is
                  the resting size and only shapes the first frames.
         colour   is a CHOICES row, not a slider — the value is an RGB triplet
                  from the cold palette, and a range input cannot say that. The
                  build loop, Copy CSS and Apply pasted all branch on
                  `choices`. */
    { v: '--ksd-field',        label: 'field',    min: 40,  max: 400,  step: 10,   unit: 'px',
      file: 'css/spine-doc.css' },
    { v: '--node-ring',        label: 'ring sz',  min: 10,  max: 64,   step: 2,    unit: 'px',
      file: 'css/spine-doc.css' },
    { v: '--node-ring-active', label: 'ring on',  min: 20,  max: 120,  step: 2,    unit: 'px',
      file: 'css/spine-doc.css' },
    /* Labels stay at 7 characters or fewer — the 56px name column was MEASURED
       for a 7-char worst case (see the CSS note on .spine-tune span) and an
       8-char label wraps to a second line, which is exactly the row-height bug
       that measurement fixed. */
    { v: '--ring-scale',       label: 'reach',    min: 1,   max: 3,    step: 0.05, unit: '',
      file: 'css/spine-doc.css' },
    { v: '--ring-peak-a',      label: 'peak',     min: 0,   max: 1,    step: 0.02, unit: '',
      file: 'css/spine-doc.css' },
    { v: '--node-pulse-ms',    label: 'pulse',    min: 500, max: 4000, step: 50,   unit: 'ms',
      file: 'css/spine-doc.css' },
    { v: '--ring-color',       label: 'colour',   file: 'css/spine-doc.css',
      choices: [
        { name: 'white',    val: '228, 232, 235' },   /* --spine-glow, the cold default */
        { name: 'bone',     val: '214, 213, 208' },   /* #D6D5D0 */
        { name: 'moon',     val: '157, 178, 192' },   /* #9DB2C0 */
        { name: 'crimson',  val: '161, 51, 62'  },    /* #A1333E — mind the ~2/page budget */
        { name: 'deep red', val: '126, 38, 48'  }     /* #7E2630 */
      ] }
  ];
  var HOME = 'css/spine-bg.css';

  /* ---- HOVER TIPS --------------------------------------------------------
     Kept as a lookup rather than a `tip` key on each FIELDS entry, because
     FIELDS is already carrying prose comments between its rows and threading a
     third string through each literal made it unreadable. One object also
     means the coverage check below is a single loop rather than an eyeball.

     These are DISTILLED FROM THE STYLESHEET COMMENTS, which stay the long form
     — a tip is the thing you read mid-drag, not the documentation. Where a
     control is inverted, vestigial or does not do what its name says, that is
     what the second clause is for; it is the only reason several of these are
     worth hovering at all.

     No apostrophes anywhere in these strings. They are single-quoted literals
     and a stray one is a syntax error that takes the whole panel with it, on a
     file where the panel is the only way to see what you just changed. The
     check below enforces it rather than trusting the next edit. */
  var TIPS = {
    /* column */
    '--spine-on': 'The whole spine layer, 1 on or 0 off — art, flare and beam together. Page scoped: the home page ships 0, about ships the baseline 1',
    '--spine-w': 'Width the column renders at, not the artwork width. The phone override is stale, still 390px against 130px here',
    '--spine-dim': 'Brightness of the uncharged column. Shipped at 0.22, which is BRIGHTER than lit at 0.18, so judge the pair by eye, not by name',
    '--spine-lit': 'Brightness of the charged column. At 0.18 it is darker than dim at 0.22, presumed deliberate, so the names no longer describe the relationship',
    '--spine-glow': '1 keeps the halo baked into the artwork as generated, 0 crushes it to hard lines. Most of the effect is in the first notch below 1',
    '--spine-feather': 'Length in px of the ramp between lit and dark at the charge front. Very short lengths leave bias no ramp to move',
    '--spine-from': 'Where the column STARTS, in px from its anchor section, negative being higher up the page. Moves the whole region, so the charge front remaps with it. This is the one to drag if the column begins too far down',
    '--spine-offset': 'Slides the artwork vertically inside the layer, negative moves it up. The charge front, beam and scrims all stay put',
    '--spine-bias': 'Where the ramp sits relative to the charge front. Travel is in card heights, so 2 to 3 parks the glow behind the hero card',
    /* band */
    '--spine-band': 'Height in px of the lit band. INVERTED at the top: 3000 means no band rather than a huge one, and 0 lights nothing at all',
    '--spine-band-feather': 'Softness of the band top edge only. Inert while band sits at its 3000px off value, because there is no edge to soften',
    /* flare + scrim */
    '--spine-bloom': 'Flare riding the charge front, off at 0. This and beam are the only layers that blend normally, so layer order matters only while one is on',
    '--spine-beam': 'Crimson scan line at the charge front, off at 0. Past 1 the opacity is capped and it drives brightness instead',
    '--spine-scrim': 'Multiplier on every section scrim. Shipped at 0 but fully live; it attenuates the backdrop rather than painting, so there is no shape to look for',
    /* breathing pulse */
    '--spine-pulse-lo': 'Low point of the breathing while a sample plays. Shipped at 0, so the column dips all the way to black each cycle',
    '--spine-pulse-hi': 'High point of the breathing while a sample plays. 0.1 sits below lit at 0.18, so pressing play visibly DARKENS the column',
    '--spine-pulse-ms': 'Length of one full breath while a sample plays. The kick detector overrides this loop whenever the analyser is running',
    /* kick */
    '--kick-flash': 'Brightness added to the lit column per unit of envelope. Lit band only, unlike the shake, which moves everything',
    '--kick-shake': 'How far a hit throws the artwork sideways in px. Moves the WHOLE column, not just the lit band. 0 leaves the flash, a complete look',
    '--kick-gain': 'Master multiplier on the envelope at the output. 0 silences the effect but the detector and the meter below keep running',
    '--kick-decay': 'Decay time constant in ms, short reads as a tick and long as a swell. The detector will not refire inside 190ms whatever this says',
    '--kick-sens': 'Hit threshold as a MULTIPLE of the running average, not decibels. Come here first if it fires on everything, down, or nothing, up',
    '--kick-freq': 'Lowpass cutoff of the side chain in Hz, the actual isolate the kick control. 90 measured best; toward 150 lets the bass line in',
    '--kick-stars': 'How hard the star cores answer a hit. Scales the twinkle waveform rather than adding a flash, and lives in the star stylesheet',
    '--kick-cloud': 'How hard the nebula brightens on a hit. MEASURED dead above 0.51 at the shipped cloud, and that limit moves when cloud moves',
    /* snare */
    '--snare-bolt': 'How hard the lightning strikes per unit of SNARE envelope, its own channel, never the kick. Whole 0 to 1 range is real. Brightness is bolt b',
    '--snare-decay': 'Decay of the strike in ms, tail reads about 2 to 3x this. Independent of k ms — the snare is a second envelope',
    '--snare-sens': 'Snare threshold as a MULTIPLE of the 2.5kHz band average. Stricter than the kick on purpose; below about 2 it starts firing on hats',
    '--snare-freq': 'Highpass cutoff of the snare noise band in Hz. 2500 measured best over all 28 samples. The 200Hz body gate is fixed and separate',
    /* page feel */
    '--scroll-weight': 'How heavy the page feels under a mouse wheel, 0 is genuinely native. Wheel only, and reduced motion disables it',
    /* sky */
    '--star-dim': 'Brightness of the whole sky field, 0 is off. For the milky wash reach for black instead, this dims the stars along with the dust',
    '--star-sat': 'Saturation. 1 is the hero footage as shot, deep blue; 0 is the colourless grade the spine artwork was made to match',
    '--star-black': 'Levels out of 255 subtracted before the sky screens, the right lever for the wash. 0 is an exact identity, above 14 the nebula reads cut out',
    '--star-twinkle': 'Idle twinkle amplitude across the four bands, 0 gives a dead static sky. Ships equal to the playing value, so the player changes nothing',
    '--star-twinkle-hi': 'Twinkle amplitude while a sample plays. Ships identical to the idle value, so the play button deliberately no longer moves the stars',
    '--star-twinkle-ms': 'Length of one twinkle cycle. The cloud breath runs at 2.7x this, so it is the clock for the whole sky, not just the stars',
    '--star-desync': 'Spread of the four band clocks. 1 is the shipped 1x/1.37x/1.79x/2.31x, 0 renders build 6 exactly. Too busy, come down here, not the amplitude',
    '--star-cloud': 'Headroom split for the nebula, not its brightness. Keep it low so the kick has room; for a brighter glow drag cloud b instead',
    '--star-cloud-bright': 'How bright the nebula is, carried in the cloud filter so it is not clamped. THIS is the one to drag for more or less glow',
    '--star-bolt-bright': 'Brightness of the lightning filaments, in the layer filter so it is not clamped. Faint strikes, drag this up, not the kick range',
    /* rail */
    '--ksd-field': 'Falloff radius in px each side of the viewport centre for the rail tick field. Ticks step about 30px, so 160 lights about 9 of them',
    '--node-ring': 'Resting size of the ripple ring before a node is focused. Rings are invisible until focus, so this only shapes the first frames of each pulse',
    '--node-ring-active': 'Ring size while a node is focused, the base the ripple scales out from. The focused node itself also scales 1.3, which multiplies this',
    '--ring-scale': 'How far a ripple travels before dissolving, as a multiple of its size. Short stays a tight halo on the node, long reaches toward the labels',
    '--ring-peak-a': 'Ripple brightness at the start of its travel. It always fades to nothing by the end of the cycle, so this sets the peak, not a floor',
    '--node-pulse-ms': 'One full ripple cycle. The second ring rides half a cycle behind automatically, so the radar train stays even at any speed',
    '--ring-color': 'Ripple colour, five stops from the cold palette. The node core stays white regardless; crimson is rationed to about two uses a page'
  };

  var css = document.createElement('style');
  css.textContent =
    '.spine-tune{position:fixed;right:12px;bottom:12px;z-index:9999;background:rgba(5,5,5,.94);' +
    'border:1px solid #2E2E2E;padding:10px 12px;font:11px/1.5 "IBM Plex Mono",monospace;' +
    /* MAX-WIDTH IS LOAD-BEARING — do not remove it as redundant. The panel is
       position:fixed with no width, so it shrink-to-fits: its width is its own
       max-content, and a <p> contributes its ENTIRE text as one unwrapped line
       to max-content regardless of white-space. On index.html the widest thing
       is a slider row and the panel settles at 327px. On about.html the two
       prose lines about the unavailable kick detector are ~70 and ~150 chars,
       and the panel measured 1350px — over half a 2560px screen. Capping at
       328px leaves index.html's natural width untouched (327 < 328, so nothing
       about the home page changes) and forces the prose to wrap on every other
       page. Any future long string in here is covered by the same cap. */
    'color:#8F8F8F;letter-spacing:.08em;backdrop-filter:blur(8px);min-width:240px;max-width:328px}' +
    /* padding-right clears the minimize button pinned to the panel corner —
       the build line can run the full width on about.html. */
    '.spine-tune h6{margin:0 0 8px;padding-right:26px;color:#D8D0BE;font:inherit;letter-spacing:.14em;text-transform:uppercase}' +
    '.spine-tune label{display:flex;align-items:center;gap:8px;margin:5px 0}' +
    /* 44px wrapped the two-word labels — `puls lo`, `puls hi`, `puls ms`,
       `twnk hi`, `twnk ms` — onto a second line, which made those five rows
       taller than the rest and split the hover underline across both lines.
       MEASURED in the browser: the wrap clears at 54px and not at 52. The
       longest label is 7 characters, and canvas measureText puts those at
       46.36px, but it does NOT count letter-spacing, and .08em at 11px adds
       0.88px per character — so the real cost is 46.36 + 7*0.88 = 52.5px.
       56 is that plus headroom. Checked against "IBM Plex Mono", the generic
       monospace fallback and DejaVu Sans Mono: all three measure identically,
       so this does not depend on the webfont having loaded.
       The panel does not get wider, it stays 328px: the 12px comes out of the
       slider, 192px -> 180px. Worth knowing what that costs at the tightest
       control rather than assuming it is free — `band` is the worst, 150 steps
       across the track, so it goes from 1.28px per step to 1.20px. Every other
       field is 60 steps or fewer and has 3px or more. If a slider ever does
       need finer travel, widen the panel rather than narrowing this column
       back; the wrap is the thing that was actually costing a row of height. */
    '.spine-tune span:first-child{width:56px;text-transform:uppercase}' +
    '.spine-tune input{flex:1;accent-color:#D8D0BE}' +
    '.spine-tune b{width:46px;text-align:right;color:#F2F2EE;font-weight:400}' +
    '.spine-tune button{margin-top:8px;width:100%;background:#D8D0BE;color:#050505;border:0;' +
    'padding:6px;font:inherit;letter-spacing:.12em;text-transform:uppercase;cursor:pointer}' +
    '.spine-tune p{margin:6px 0 0;color:#6B6B6B;max-width:none}' +
    /* THE PANEL OUTGREW THE SCREEN. It is a fixed box pinned to the bottom
       right, so when the control count passed about 20 the top of it went off
       the top of the viewport and those rows became unreachable — silently,
       because a fixed element does not scroll the page to reveal itself.
       Two changes: the rows live in their own scroll area, and they are
       grouped into collapsible sections so the common case is short enough not
       to need scrolling at all.
       min-height:0 on the scroller is load-bearing — a flex child defaults to
       min-height:auto, which refuses to shrink below its content, and without
       it the box grows past the viewport again and the overflow never engages. */
    '.spine-tune{display:flex;flex-direction:column;max-height:calc(100vh - 24px)}' +
    '.spine-tune__scroll{flex:1 1 auto;min-height:0;overflow-y:auto;' +
      'overscroll-behavior:contain;margin:0 -2px;padding:0 2px}' +
    '.spine-tune__scroll::-webkit-scrollbar{width:8px}' +
    '.spine-tune__scroll::-webkit-scrollbar-thumb{background:#2E2E2E}' +
    '.spine-tune__scroll::-webkit-scrollbar-track{background:transparent}' +
    '.spine-tune details{border-top:1px solid #1C1C1C}' +
    '.spine-tune summary{cursor:pointer;padding:5px 0;color:#8F8F8F;' +
      'text-transform:uppercase;letter-spacing:.14em;list-style:none;' +
      '-webkit-user-select:none;user-select:none}' +
    '.spine-tune summary::-webkit-details-marker{display:none}' +
    '.spine-tune summary::before{content:"+ ";color:#6B6B6B}' +
    '.spine-tune details[open]>summary::before{content:"- "}' +
    '.spine-tune details[open]>summary{color:#D8D0BE}' +
    '.spine-tune details>label:last-child{margin-bottom:7px}' +
    '.spine-tune__foot{flex:0 0 auto;border-top:1px solid #2E2E2E;' +
      'margin-top:7px;padding-top:2px}' +
    /* THE TIP IS position:fixed AND A CHILD OF <body>, NOT OF THE ROW.
       .spine-tune__scroll is overflow-y:auto, and an overflow container clips
       its descendants whatever their position — absolute included, since the
       scroller is itself the containing block once it is positioned. A tip
       parented to the row would be cut off at the panel edge, which is exactly
       the direction it needs to open in. Fixed + body sidesteps the clip
       entirely, at the cost of having to place it by hand on hover.

       Left of the panel by preference, flipped to the right only if there is
       no room, and clamped into the viewport vertically so a row near the top
       or bottom does not push it off screen. */
    '.spine-tune__name{cursor:help;border-bottom:1px dotted #3A3A3A}' +
    '.spine-tune label:hover .spine-tune__name{color:#D8D0BE;border-bottom-color:#6B6B6B}' +
    '.spine-tune__tip{position:fixed;z-index:10000;display:none;max-width:270px;' +
      'background:rgba(5,5,5,.97);border:1px solid #2E2E2E;padding:7px 9px;' +
      'font:11px/1.45 "IBM Plex Mono",monospace;color:#B4B4B4;letter-spacing:.04em;' +
      'backdrop-filter:blur(8px);pointer-events:none;box-shadow:0 2px 14px rgba(5,5,5,.7)}' +
    '.spine-tune__tip i{display:block;font-style:normal;letter-spacing:.08em}' +
    '.spine-tune__tip i.v{color:#D8D0BE}' +
    '.spine-tune__tip i.f{color:#6B6B6B;margin-bottom:4px}' +
    /* MINIMIZE. The panel is a third of the viewport and sits exactly where
       the nebula does its work, so judging the page means getting it out of
       the way — and closing the tab loses every undialed slider, which is
       the wrong price. Minimized, the box keeps its identity (same element,
       same inline state, same listeners) and collapses to a corner chip:
       every child hides except the button, and the fixed box with no width
       shrink-to-fits the chip. Nothing is torn down, so restore is a class
       toggle, not a rebuild. */
    /* button.spine-tune__min, not bare .spine-tune__min: the shared
       `.spine-tune button` rule above is (0,1,1) and paints every button
       cream — a bare class at (0,1,0) loses to it and the chip renders as a
       big light block. The element name lifts these to (0,1,2)/(0,2,2). */
    '.spine-tune button.spine-tune__min{position:absolute;top:8px;right:10px;width:auto;margin:0;' +
      'padding:0 6px 1px;line-height:15px;background:#1F1F1F;color:#8F8F8F;cursor:pointer}' +
    '.spine-tune button.spine-tune__min:hover{color:#D8D0BE}' +
    '.spine-tune--min{min-width:0;padding:5px 6px}' +
    '.spine-tune--min>*{display:none}' +
    '.spine-tune--min>button.spine-tune__min{display:block;position:static;padding:2px 9px}';
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

  /* One tip element reused by every row, parented to <body> — see the CSS note
     on why it cannot live inside the scroller. Hiding is on a short timer so
     that sliding the mouse from one label to the next does not flicker. */
  var tipEl = document.createElement('div');
  tipEl.className = 'spine-tune__tip';
  tipEl.setAttribute('role', 'tooltip');
  document.body.appendChild(tipEl);
  var tipTimer;

  var showTip = function (anchor, f) {
    clearTimeout(tipTimer);
    var text = TIPS[f.v];
    if (!text) return;
    tipEl.innerHTML = '<i class="v">' + f.v + '</i>' +
      '<i class="f">' + (f.file || HOME) + '</i>' + text;
    /* Measure before placing: offsetWidth is 0 while display is none, so the
       first frame would otherwise be positioned against a zero-sized box. */
    tipEl.style.visibility = 'hidden';
    tipEl.style.display = 'block';
    var r = anchor.getBoundingClientRect();
    var w = tipEl.offsetWidth, h = tipEl.offsetHeight;
    var left = r.left - w - 10;
    if (left < 8) left = Math.min(r.right + 10, window.innerWidth - w - 8);
    var top = r.top + r.height / 2 - h / 2;
    top = Math.max(8, Math.min(top, window.innerHeight - h - 8));
    tipEl.style.left = left + 'px';
    tipEl.style.top = top + 'px';
    tipEl.style.visibility = 'visible';
  };
  var hideTip = function () {
    tipTimer = setTimeout(function () { tipEl.style.display = 'none'; }, 90);
  };

  FIELDS.forEach(function (f) {
    /* A `choices` field is a discrete palette pick riding the same range
       element: the slider's value is an INDEX into f.choices, and everything
       that consumes a value — the live write here, Copy CSS, Apply pasted —
       branches on f.choices to translate. Reading the start value goes through
       getComputedStyle raw rather than read(), because parseFloat on an RGB
       triplet returns its first channel, which is a number and therefore a
       silent wrong answer. */
    var start, startIdx = 0;
    if (f.choices) {
      var raw = getComputedStyle(document.documentElement).getPropertyValue(f.v)
        .replace(/\s+/g, '');
      for (var ci = 0; ci < f.choices.length; ci++) {
        if (f.choices[ci].val.replace(/\s+/g, '') === raw) startIdx = ci;
      }
      /* Dead means the variable does not exist on this page at all (its
         stylesheet is not loaded) — distinct from hidden, and read at build
         time so Copy CSS can refuse to emit a made-up value below. */
      f._dead = !raw;
      start = startIdx;
    } else {
      start = read(f.v);
      f._dead = isNaN(start);
    }
    var row = document.createElement('label');
    row.innerHTML = '<span class="spine-tune__name">' + f.label + '</span>';
    var name = row.firstChild;
    name.addEventListener('mouseenter', function () { showTip(name, f); });
    name.addEventListener('mouseleave', hideTip);
    var input = document.createElement('input');
    input.type = 'range';
    if (f.choices) {
      input.min = 0; input.max = f.choices.length - 1; input.step = 1;
      input.value = startIdx;
    } else {
      input.min = f.min; input.max = f.max; input.step = f.step; input.value = start;
    }
    var out = document.createElement('b');
    out.textContent = f.choices ? f.choices[startIdx].name : start + f.unit;
    input.addEventListener('input', function () {
      if (f.choices) {
        var c = f.choices[+input.value];
        document.documentElement.style.setProperty(f.v, c.val);
        out.textContent = c.name;
      } else {
        document.documentElement.style.setProperty(f.v, input.value + f.unit);
        out.textContent = input.value + f.unit;
      }
      /* Most variables are consumed by CSS and repaint on their own. --spine-from
         is not: it is read by measure(), which only runs on scroll, resize and
         the ResizeObserver, none of which a slider drag fires. Without this the
         slider would look dead until you happened to scroll. */
      if (f.v === '--spine-from') remeasure();
      /* Same shape of problem on the rail: --ksd-field is read by
         js/spine-doc.js in its scroll pass, so a synthetic scroll event shows
         the new field without the hand leaving the slider. The rail's handler
         is rAF-throttled, so this costs one frame of its work. */
      if (f.v === '--ksd-field') window.dispatchEvent(new Event('scroll'));
    });
    row.appendChild(input); row.appendChild(out);
    f._row = row;
    f._input = input;
    f._out = out;
  });

  /* ---- WHICH CONTROLS ARE LIVE ON THIS PAGE ------------------------------
     The kick detector only attaches where .track-experience exists, which is
     index.html and nowhere else — the IIFE far above is gated on exactly that,
     and it assigns kickMeter as its last statement. So kickMeter being null IS
     the gate condition, read back rather than restated here; restating it would
     be a second copy of a condition that has to stay in step with the first.
     Where it did not attach, the --kick-* sliders — and the --snare-* ones,
     which ride the same loop — move nothing at all, and a slider that does
     nothing reads as a slider that is broken. They are hidden below rather
     than shown dead. They stay in FIELDS: their tips are still checked, and
     Copy CSS still emits their current values, so nothing downstream can
     tell the difference. */
  var kickOK = !!kickMeter;
  /* The rail sliders ride the same idea on a different gate: the document rail
     exists only where a .ksd-rail is in the DOM (index.html), and
     spine-doc.css — where their values live — is loaded nowhere else. On any
     other page they would move nothing AND read dead values, so they hide
     exactly as the kick set does. */
  var railOK = !!document.querySelector('.ksd-rail');
  var hidden = FIELDS.filter(function (f) {
    /* The snare sliders ride the same gate as the kick: one loop runs both
       detectors, so where the kick cannot attach the snare cannot either. */
    if (!kickOK && (f.v.indexOf('--kick-') === 0 || f.v.indexOf('--snare-') === 0)) return true;
    if (!railOK && f.file === 'css/spine-doc.css') return true;
    return false;
  });
  var hiddenSet = {};
  hidden.forEach(function (f) { hiddenSet[f.v] = 1; });

  /* COVERAGE CHECK. A missing tip is invisible — the label just does not react
     — so it would survive any number of sessions unnoticed. Both directions
     matter: an orphan TIPS key means a control was renamed or removed and the
     copy was left behind, describing something that is no longer there.
     HIDDEN FIELDS STILL COUNT. The check is about TIPS covering FIELDS, which is
     a property of the source and identical on every page; counting only the
     visible rows would print a smaller number on about.html and read as eight
     tips having gone missing, which is the one thing this check exists to
     catch. The count stays FIELDS.length — 47 as of the rail group — everywhere,
     and the suffix says what is hidden. */
  (function () {
    var missing = FIELDS.filter(function (f) { return !TIPS[f.v]; })
                        .map(function (f) { return f.v; });
    var known = {};
    FIELDS.forEach(function (f) { known[f.v] = 1; });
    var orphan = Object.keys(TIPS).filter(function (k) { return !known[k]; });
    if (missing.length) console.warn('[tune] no hover tip for:', missing.join(', '));
    if (orphan.length) console.warn('[tune] tip with no slider:', orphan.join(', '));
    if (!missing.length && !orphan.length) {
      console.log('[tune] ' + FIELDS.length + ' sliders, all with hover tips' +
        (hidden.length ? ' — ' + hidden.length + ' sliders defined but HIDDEN on ' +
          'this page (each dropped group states its reason in the panel), tips still checked' : ''));
    }
  }());

  /* ---- GROUPING ----------------------------------------------------------
     Ordered by how often they get touched, not by which stylesheet they live
     in — `kick` and `sky` both write to star-bg.css and sit in different
     groups, because grouping is about the hand on the mouse and Copy CSS
     already sorts by destination file independently.
     Only `kick` opens by default: it is what is being tuned now, and the panel
     fits without scrolling when the rest are shut. Which sections are open is
     remembered across reloads, because the cache-busting workflow means a lot
     of reloads and reopening four sections each time is its own small tax. */
  var GROUPS = [
    { title: 'kick', open: true, vars: ['--kick-flash', '--kick-shake', '--kick-gain',
        '--kick-decay', '--kick-sens', '--kick-freq', '--kick-stars', '--kick-cloud'] },
    /* Its own group, not four more rows in `kick`: the two are separate
       instruments driving separate layers, and the grouping should say so.
       Open by default for the same reason kick is — it is what is being
       tuned now. Hidden with the kick group on pages without the detector
       (the filter below catches the --snare- prefix too). */
    { title: 'snare', open: true, vars: ['--snare-bolt', '--snare-decay',
        '--snare-sens', '--snare-freq'] },
    /* Open for the same reason kick and snare are: it is what is being tuned
       now (added Aug 14 2026 with the field + ripple work). Hidden whole on
       pages without the rail — `why` is the drop message for that case. */
    { title: 'rail', open: true,
      why: 'the document rail lives on index.html only',
      vars: ['--ksd-field', '--node-ring', '--node-ring-active', '--ring-scale',
        '--ring-peak-a', '--node-pulse-ms', '--ring-color'] },
    { title: 'column', vars: ['--spine-on', '--spine-w', '--spine-dim', '--spine-lit',
        '--spine-glow', '--spine-feather', '--spine-from', '--spine-offset',
        '--spine-bias'] },
    { title: 'band', vars: ['--spine-band', '--spine-band-feather'] },
    { title: 'flare + scrim', vars: ['--spine-bloom', '--spine-beam', '--spine-scrim'] },
    { title: 'breathing pulse', vars: ['--spine-pulse-lo', '--spine-pulse-hi',
        '--spine-pulse-ms'] },
    { title: 'sky', vars: ['--star-dim', '--star-sat', '--star-black', '--star-twinkle',
        '--star-twinkle-hi', '--star-twinkle-ms', '--star-desync', '--star-cloud',
        '--star-cloud-bright', '--star-bolt-bright'] },
    { title: 'page feel', vars: ['--scroll-weight'] }
  ];

  var scroll = document.createElement('div');
  scroll.className = 'spine-tune__scroll';

  var remember = function (title, open) {
    try { localStorage.setItem('ks-tune-' + title, open ? '1' : '0'); } catch (e) {}
  };
  var recall = function (title, dflt) {
    try {
      var v = localStorage.getItem('ks-tune-' + title);
      return v === null ? dflt : v === '1';
    } catch (e) { return dflt; }
  };

  var placed = {};
  GROUPS.forEach(function (g) {
    /* A GROUP WHOSE EVERY CONTROL IS INERT HERE IS DROPPED WHOLE, and says so
       in its place — a section that simply vanished would read as the panel
       having lost it. Driven off hiddenSet rather than off the title, so this
       stays correct if the kick vars are ever regrouped, and marks them placed
       so the ungrouped safety net below does not resurrect them in red. */
    if (g.vars.length && g.vars.every(function (v) { return hiddenSet[v]; })) {
      g.vars.forEach(function (v) { placed[v] = 1; });
      var why = document.createElement('p');
      why.style.cssText = 'margin:6px 0;color:#D8534F';
      /* Each group knows its own reason; the kick text stays the default so the
         two audio groups read exactly as they always have. Whether Copy CSS
         emits the hidden values depends on whether their stylesheet is even
         loaded here — the rail set is dead off index.html, not just idle, and
         a dead field is skipped rather than emitted (see Copy CSS). */
      why.textContent = g.title.toUpperCase() + ': unavailable (' +
        (g.why || 'no Web Audio, or no .track-experience on this page') +
        '). Its ' + g.vars.length + ' sliders are hidden because they would ' +
        'move nothing here.';
      scroll.appendChild(why);
      return;
    }
    var d = document.createElement('details');
    if (recall(g.title, !!g.open)) d.open = true;
    d.addEventListener('toggle', function () { remember(g.title, d.open); });
    var sum = document.createElement('summary');
    sum.textContent = g.title;
    d.appendChild(sum);
    g.vars.forEach(function (v) {
      for (var i = 0; i < FIELDS.length; i++) {
        if (FIELDS[i].v === v) { d.appendChild(FIELDS[i]._row); placed[v] = 1; }
      }
    });
    scroll.appendChild(d);
  });

  /* SAFETY NET, and the reason this cannot rot. Anything added to FIELDS and
     not listed in GROUPS lands here rather than vanishing from the panel — a
     new control that is invisible reads as a control that does not work, and
     that is a bug nobody would think to look for in a layout change. */
  var orphans = FIELDS.filter(function (f) { return !placed[f.v]; });
  if (orphans.length) {
    var d2 = document.createElement('details');
    d2.open = true;
    var s2 = document.createElement('summary');
    s2.textContent = 'ungrouped';
    s2.style.color = '#D8534F';
    d2.appendChild(s2);
    orphans.forEach(function (f) { d2.appendChild(f._row); });
    scroll.appendChild(d2);
  }
  box.appendChild(scroll);

  var foot = document.createElement('div');
  foot.className = 'spine-tune__foot';

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
  /* The seven full-screen layers css/star-bg.css owns: base sky, four twinkle
     bands, clouds, and the .star-bolt lightning div this file injects. Kept as
     one string so a mode cannot hide six of seven by accident, which is how
     the old 'stars off' entry drifted — and which the bolt would repeat as
     "one layer left lit" if it were ever dropped from this list. */
  var STAR_LAYERS = 'body::before,body::after,html::before,html::after,main::before,main::after,.star-bolt';
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
      /* .star-bolt is hidden here too: it is not a band, and with a sample
         playing its kick flash would otherwise be the brightest thing in a
         view that exists to isolate the four band clocks. */
      'body::before,html::after,.star-bolt{display:none!important}' +
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
  foot.appendChild(isoRow);

  /* ---- KICK METER --------------------------------------------------------
     The detector is the one thing on this panel that cannot be judged by
     looking at the page: if the column is not moving, that could be the
     threshold, the band, the gain, a suspended AudioContext, or a browser that
     refused the graph entirely, and those five want completely different
     fixes. So say which.

     `state` is the AudioContext's own — "running" is the only one that does
     anything. "suspended" means the resume was refused and NOTHING was routed,
     which is the safe failure: playback is normal, there is just no analysis.
     "failed" means something threw and the feature switched itself off.

     The bar is the live envelope. Watch it against the record rather than the
     numbers: it should punch to full and fall back to nothing between hits. A
     bar that never drops means --kick-decay is longer than the gap between
     beats; a bar that twitches constantly means --kick-sens is too low. */
  var meterRow = document.createElement('p');
  meterRow.style.cssText = 'margin:6px 0 0;font-variant-numeric:tabular-nums';
  foot.appendChild(meterRow);
  setInterval(function () {
    /* Minimized, the meter row is display:none — skip building four bars of
       innerHTML 10x a second for an element nobody can see. */
    if (box.classList.contains('spine-tune--min')) return;
    if (!kickMeter) {
      meterRow.innerHTML = '<span style="color:#D8534F">kick: unavailable</span> ' +
        '(no Web Audio, or no .track-experience on this page)';
      return;
    }
    var m = kickMeter();
    var n = Math.round(m.env * 20);
    var bar = new Array(n + 1).join('|') + new Array(21 - n).join('·');
    /* Second bar: live low-band level against the live threshold. The caret is
       where the threshold sits, so a hit is the level crossing it. If the level
       never reaches the caret, k sns is too high; if it sits past it, too low. */
    var scale = Math.max(m.thr * 2, 1e-6);
    var lv = Math.min(20, Math.round(m.level / scale * 20));
    var tk = Math.min(20, Math.round(m.thr / scale * 20));
    var lvl = '';
    for (var i2 = 0; i2 < 20; i2++) lvl += (i2 === tk ? '^' : (i2 < lv ? '=' : '·'));
    /* The snare's pair of bars, same encodings: its envelope (the lightning),
       then its 2.5kHz level against its own threshold. Tune s sns against the
       caret exactly as k sns is tuned against the one above. */
    var nS = Math.round(m.envS * 20);
    var barS = new Array(nS + 1).join('|') + new Array(21 - nS).join('·');
    var scaleS = Math.max(m.thrS * 2, 1e-6);
    var lvS = Math.min(20, Math.round(m.levelS / scaleS * 20));
    var tkS = Math.min(20, Math.round(m.thrS / scaleS * 20));
    var lvlS = '';
    for (var i3 = 0; i3 < 20; i3++) lvlS += (i3 === tkS ? '^' : (i3 < lvS ? '=' : '·'));
    var colour = m.state === 'running' ? '#7FB37F'
               : m.state === 'failed'  ? '#D8534F' : '#8F8F8F';
    meterRow.innerHTML =
      '<span style="color:' + colour + '">' + m.state + '</span> · ' +
      m.band + ' ' + m.kicks + ' kicks · ' +
      m.bandS + ' ' + m.snares + ' snares · bolt ' + (m.bolt || '—') +
      (m.running ? '' : ' · idle') +
      '<br><span style="color:#D8D0BE;letter-spacing:0">' + bar + '</span> ' +
      m.env.toFixed(2) + ' k' +
      '<br><span style="color:#6B8FB3;letter-spacing:0">' + lvl + '</span> lvl/thr' +
      '<br><span style="color:#D8D0BE;letter-spacing:0">' + barS + '</span> ' +
      m.envS.toFixed(2) + ' s' +
      '<br><span style="color:#B38F6B;letter-spacing:0">' + lvlS + '</span> lvl/thr';
  }, 100);

  /* ---- Paste a saved block back in ---------------------------------------
     Copy CSS is only half a round trip. Without this, restoring an earlier
     setting means typing seven numbers back into seven sliders by hand and
     getting one of them wrong. Accepts anything containing --spine-* or
     --scroll-* / --star-* lines, so a whole :root block pasted straight out of
     any of the three stylesheets works — comments, braces and unrelated properties are ignored,
     including the "css/base.css" headings Copy CSS writes. The page-scoped
     blocks Copy CSS now emits — html.page-home { … } / html.page-about { … } —
     go through the same path for the same reason: the selector and the braces
     are simply text the scan never matches. Paste ONE block at a time; two
     blocks pasted together apply in order and the later one wins. */
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
    /* DIGITS ARE PART OF A CUSTOM PROPERTY NAME. The old class was [a-z-]+,
       which silently skipped every variable with a number in it while Copy CSS
       emitted them happily — a numbered variant like --spine-lightning-2 would
       have round-tripped one way only, and the failure is a value that quietly
       does not come back rather than an error. The trailing [a-z0-9] is what
       keeps the widened class from taking a stray hyphen with it: the name has
       to end on a letter or a digit, never on punctuation. */
    var re = /(--(?:spine|scroll|star|kick|snare|ksd|node|ring)-[a-z0-9-]*[a-z0-9])\s*:\s*([^;\n}]+)/g, m;
    while ((m = re.exec(paste.value))) {
      var name = m[1], val = m[2].trim();
      var f = null;
      for (var i = 0; i < FIELDS.length; i++) if (FIELDS[i].v === name) f = FIELDS[i];
      if (!f) {
        /* Derived values, not controls — they are computed from the sliders and
           would be overwritten by them anyway. Ignore silently rather than
           reporting a paste of the real :root block as half-unrecognised.
           The node and ring names below are the rail tokens that are real
           but deliberately not sliders (geometry and idle-read values the
           handoffs own); same reasoning — a paste of spine-doc.css's whole
           :root block should not read as half-failed. */
        if (name !== '--spine-build' && name !== '--spine-contrast' &&
            name !== '--star-build' && name !== '--star-twinkle-amp' && name !== '--star-cloud-amp' &&
            name !== '--band-t0' && name !== '--band-t1' &&
            /* Written every frame by the detector loop, never by a slider. */
            name !== '--kick-sign' &&
            name !== '--node-color' && name !== '--node-size' &&
            name !== '--node-idle-opacity' && name !== '--node-glow' &&
            name !== '--node-glow-a' && name !== '--node-mark-size' &&
            name !== '--node-mark-a') unknown.push(name);
        continue;
      }
      if (f.choices) {
        /* A choices value round-trips as its literal (an RGB triplet), never a
           number — parseFloat would happily take the red channel and clamp it
           into some slider range, which is a silently wrong colour. Match by
           normalised text against the palette; a triplet from outside the
           palette is reported, not applied, because the panel cannot represent
           a state its own control cannot reach. */
        var norm = val.replace(/\s+/g, ''), idx = -1;
        for (var j = 0; j < f.choices.length; j++) {
          if (f.choices[j].val.replace(/\s+/g, '') === norm) idx = j;
        }
        if (idx < 0) { unknown.push(name + ' (not a palette stop)'); continue; }
        document.documentElement.style.setProperty(f.v, f.choices[idx].val);
        f._input.value = idx;
        f._out.textContent = f.choices[idx].name;
        found++;
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
    /* Same reason as the slider handler: --spine-from is read by measure(), not
       by CSS, so a paste that changes it needs the region recomputed. Called
       unconditionally because it is cheap and idempotent, and because working
       out whether the paste contained that one name is not worth the branch. */
    remeasure();
    /* The rail's counterpart to remeasure(): --ksd-field is read in the rail's
       scroll pass, and a paste may have just changed it. Same reasoning — cheap,
       idempotent, not worth detecting whether the paste contained that name. */
    window.dispatchEvent(new Event('scroll'));
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
       spine-bg.css, under the page-scoped selector chosen below; anything with
       a `file` goes to that stylesheet and gets its own heading,
       because a value pasted into the wrong stylesheet here fails in a way that
       looks like the slider not working: spine-bg.css is loaded by index.html
       only, so a site-wide variable pasted into it silently applies to the front
       page and to nothing else. */
    var groups = {}, order = [];
    FIELDS.forEach(function (f) {
      /* DEAD is stronger than hidden and is the one case Copy CSS skips. A
         hidden-but-live field (kick on a page without the detector) still has
         real values to emit; a dead one (the rail set anywhere spine-doc.css
         is not loaded) has no source value at all, and emitting the slider's
         browser-default midpoint would paste a number nobody chose into the
         stylesheet. */
      if (f._dead) return;
      var dest = f.file || HOME;
      if (!groups[dest]) { groups[dest] = []; order.push(dest); }
      groups[dest].push('  ' + f.v + ': ' +
        (f.choices ? f.choices[+f._input.value].val : f._input.value + f.unit) + ';');
    });
    /* PAGE SCOPE. index.html carries html.page-home and about.html carries
       html.page-about, with a block for each in the stylesheets beneath the
       unchanged :root baseline — so a number dialled on one page lands in that
       page's block instead of retuning the other page behind your back.

       THE CLASS IS ON <html>, NOT <body>, AND THAT IS NOT A PREFERENCE.
       Custom properties inherit DOWNWARD only, and two of the sky layers are
       pseudo-elements of <html> itself: html::after is the nebula/cloud layer,
       html::before is one of the four star bands. Neither can ever see a
       variable set on <body>. MEASURED in the browser:

         body.style.setProperty(--star-cloud-bright, 9)
           -> getComputedStyle(body) reads 9      — body sees it
           -> html::after stays brightness(2.2)   — the cloud does NOT
         html.page-home { --star-cloud-bright: 9 }
           -> html::after becomes brightness(9)   — correct

       A body-scoped block would therefore have moved three of the four star
       bands and left the cloud layer inert: a half-responding sky, which is far
       harder to diagnose than one that plainly does not work at all. This only
       surfaced because star-bg.css and base.css are scoped here too.

       THE TUNER ITSELF NEEDS NO CHANGE for this. It writes inline styles on
       documentElement, and an inline style outranks any class selector, so the
       sliders still win over whichever block is on the page. Do not move those
       writes to body — that would break them in exactly the way described
       above.

       Read the class off the live <html> rather than off the URL, which is what
       a file:// path, a query string and a rewritten route all disagree about.
       A page with neither class — a new page, or one not yet updated — falls
       back to :root. That is the same element, so it still reaches the
       pseudo-elements; it just applies to every page at once. The header says
       so in the copied text itself, because a :root block and a scoped one look
       identical once they are on the clipboard. */
    var cls = document.documentElement.classList;
    var scope = cls.contains('page-about') ? 'html.page-about'
              : cls.contains('page-home')  ? 'html.page-home'
              : ':root';
    var header = scope === ':root'
      ? '/* NO page-home or page-about class on <html> here, so this is NOT\n' +
        '   page-scoped: :root applies SITE-WIDE. Paste it into a page block\n' +
        '   instead if you only meant to change this page. */\n'
      : '/* scoped to ' + scope + ' — paste over that block, not into :root */\n';
    var text = header + order.map(function (dest) {
      return (order.length > 1 ? '/* ' + dest + ' */\n' : '') +
        scope + ' {\n' + groups[dest].join('\n') + '\n}';
    }).join('\n\n');
    (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject())
      .then(function () { note.textContent = 'copied — paste into ' + scope; })
      .catch(function () { note.textContent = text; });
  });
  foot.appendChild(copy);
  foot.appendChild(pasteWrap);
  foot.appendChild(note);
  box.appendChild(foot);

  /* ---- MINIMIZE ----------------------------------------------------------
     See the CSS note above. Remembered across reloads through the same
     localStorage helper the group sections use, because the cache-busting
     workflow reloads constantly and a panel that reopens over the sky on
     every one of them defeats its own button. Stored as an OPEN flag so the
     default (nothing stored) is open, matching every session before this. */
  var minBtn = document.createElement('button');
  minBtn.className = 'spine-tune__min';
  var setMin = function (min) {
    box.classList.toggle('spine-tune--min', min);
    minBtn.textContent = min ? '+ tune' : '−';
    minBtn.title = min ? 'restore the tuning panel' : 'minimize to a corner chip';
    minBtn.setAttribute('aria-label', minBtn.title);
    remember('panel', !min);
  };
  minBtn.addEventListener('click', function () {
    setMin(!box.classList.contains('spine-tune--min'));
  });
  box.appendChild(minBtn);
  setMin(!recall('panel', true));

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
