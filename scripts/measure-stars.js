/* ==========================================================================
   measure-stars.js — WHY IS THE STAR FIELD EATING THE FRAME BUDGET?

   Paste into DevTools on http://localhost:8000/ (NOT /?tune — the tuner panel's
   backdrop-filter caps the page before anything else gets a chance to cost
   something). Window frontmost, nothing else running.

   Same discipline as scripts/measure-kick.js:
     - refuses to report if rAF is already capped before it starts
     - paired and ALTERNATED (forward pass then reverse pass) so machine drift
       cancels instead of accumulating
     - re-measures the all-off control at the top and bottom of every round and
       ABORTS the round if the control moved, because HANDOFF 10 records the
       identical all-hidden condition reading 4.2ms and 20.8ms minutes apart
     - reports the refresh interval it detected and quantises everything to it,
       because on a 240Hz display every frame time is a multiple of 4.17ms and a
       "median of 8.3ms" is two intervals, not a workload

   WHAT IT IS TESTING, and why these conditions and not others.

   Chromium 141 traced structurally (headless, software raster — timings from
   there are worthless, the STRUCTURE is not):

       mix-blend-mode: screen creates a RENDER SURFACE per element.
       cc's RenderSurfaceReasonCount on this page reads {"blend mode": 6}.
       render_surface_list_size() is 8 with the star field and 2 without.
       Every drawn frame re-executes all 8 passes — including body::before,
       the STATIC base sky, whose content never changes.

   So the shipped page composites four times as many full-viewport passes as a
   page without the star field, every frame, forever. That is the one structural
   4x nobody has measured on real hardware. noBlend is the condition that tests
   it. It will look WRONG on screen — screen blending is load-bearing for the
   whole page's black point — that is fine, it is a measurement, not a proposal.

   Also traced and RULED OUT, so do not spend a session on them:
     - the animations are all COMPOSITED (compositeFailed: 0, five of five).
     - var()/calc(var()) in the keyframes does not prevent that and costs
       nothing extra. Chromium 141, verified against a deliberate-failure
       control that did report compositeFailed: 8224.
     - nothing re-rasters per frame. Paint events are 31 with the star field and
       31 without; raster is a single burst at load in both conditions.
   ========================================================================== */
(async () => {
  const SIX  = 'body::before, body::after, html::before, html::after, main::before, main::after';
  const BAND = 'body::after, html::before, main::before, main::after';

  // Order matters only in that `off` runs first: its minimum interval is what
  // calibrates the refresh rate.
  const CONDITIONS = [
    ['off',        `${SIX} { display: none !important; }`],
    ['shipped',    ``],
    ['noBlend',    `${SIX} { mix-blend-mode: normal !important; }`],
    ['noFilter',   `${SIX} { filter: none !important; }`],
    ['noAnim',     `${SIX} { animation: none !important; }`],
    ['cloudHidden',`html::after { display: none !important; }`],
    ['cloud002',   `:root { --star-cloud: 0.02 !important; }`],
    ['noBlur',     `html::after { filter: contrast(1.108) brightness(0.906) saturate(1) brightness(0.85) !important; }`],
    ['bandsOff',   `${BAND} { display: none !important; }`],
    ['skyOff',     `body::before { display: none !important; }`],
    ['skyOnly',    `${BAND}, html::after { display: none !important; }`],
  ];

  const ROUNDS      = 2;     // each round is a forward pass + a reverse pass
  let   FRAMES      = 200;   // measured frames per cell, after warmup — raised
                             // automatically if the page turns out to be running
                             // uncapped (see pre-flight below)
  const WARMUP      = 15;    // discarded
  const DRIFT_LIMIT = 0.25;  // control may move this much before the round is void

  // ---- guards ------------------------------------------------------------
  if (location.search.includes('tune')) {
    console.error('ABORT: measured on /?tune. The tuner panel caps the page at 40fps. Reload without it.');
    return;
  }
  if (!document.hasFocus()) {
    console.warn('WARNING: document.hasFocus() is false. HANDOFF 10 records focus:true being insufficient, ' +
                 'so this is necessary but not sufficient — bring the window frontmost anyway.');
  }
  const styleEl = document.createElement('style');
  styleEl.id = '__measure_stars__';
  document.head.appendChild(styleEl);

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  function run(frames) {
    return new Promise(resolve => {
      const t = [];
      let n = 0;
      const tick = now => {
        t.push(now);
        if (++n < frames + WARMUP + 1) requestAnimationFrame(tick);
        else {
          const d = [];
          for (let i = WARMUP + 1; i < t.length; i++) d.push(t[i] - t[i - 1]);
          resolve(d.sort((a, b) => a - b));
        }
      };
      requestAnimationFrame(tick);
    });
  }

  const med = a => a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2;
  const p95 = a => a[Math.min(a.length - 1, Math.floor(a.length * 0.95))];

  // ---- pre-flight 0: IS THERE A GPU? -------------------------------------
  // Added 2026-08-05 after chrome://gpu came back "Software Rendering: Yes" and
  // GL_RENDERER "Microsoft Basic Render Driver" — Chrome was compositing the
  // entire page on the CPU through WARP. The fps guard below did NOT catch it:
  // a blank page runs at 238fps on WARP quite happily. Only the star field's
  // eight render passes made it visible. So this check goes FIRST.
  try {
    const c  = document.createElement('canvas');
    const gl = c.getContext('webgl') || c.getContext('experimental-webgl');
    const dbg = gl && gl.getExtension('WEBGL_debug_renderer_info');
    const r  = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : '(unavailable)';
    if (/SwiftShader|Basic Render|WARP|llvmpipe|Software/i.test(r)) {
      styleEl.remove();
      console.error(
        `ABORT: Chrome is rendering in SOFTWARE.\n  GL_RENDERER: ${r}\n\n` +
        `Every compositing number taken in this state measures the CPU, not the page. ` +
        `Open chrome://settings/system, turn ON "Use graphics acceleration when available", relaunch, ` +
        `confirm chrome://gpu reports Compositing: Hardware accelerated, and start again.`);
      return;
    }
    console.log(`%cGPU: ${r}`, 'color:#6c6');
  } catch (e) { console.warn('GPU probe failed, continuing:', e.message); }

  // ---- pre-flight 0b: WHICH MONITOR? -------------------------------------
  // Mixed-refresh multi-monitor setups change the vsync timebase depending on
  // which panel the window is on, and every frame time quantises to it. Record
  // it with the numbers or they cannot be compared across sessions.
  console.log(`window at screen ${window.screenX},${window.screenY} — ` +
              `record which physical monitor that is and keep it the same for every run.`);

  // ---- pre-flight: is the machine capable of reporting anything? ----------
  styleEl.textContent = CONDITIONS[0][1];
  await sleep(400);
  const probe   = await run(120);
  const probeMs = med(probe);
  // The vsync interval is the MEDIAN of the empty-page control, not its minimum.
  // First version of this file used probe[0] and reported "303Hz" on a 240Hz
  // panel — rAF jitter produces occasional sub-vsync gaps and the minimum picks
  // them up. The median of a capped page is the cap.
  const refresh = probeMs;
  if (probeMs > 22) {
    styleEl.remove();
    console.error(
      `ABORT: with the entire star field hidden the page is already at ${(1000 / probeMs).toFixed(1)}fps ` +
      `(${probeMs.toFixed(1)}ms). A near-blank page cannot do that. Something outside this page owns the GPU — ` +
      `close everything else, check chrome://gpu for a software-compositing fallback, and start again. ` +
      `Any ratio taken now measures the cap, not the star field.`);
    return;
  }
  // Uncapped (--disable-gpu-vsync --disable-frame-rate-limit) the frame time is
  // GPU work rather than the refresh interval, so 200 frames can be a fraction
  // of a second and the median rides on whatever the machine was doing. Take
  // more of them. 3ms is comfortably below any real panel's interval.
  const UNCAPPED = probeMs < 3;
  if (UNCAPPED) {
    FRAMES = 800;
    console.log(`%cUNCAPPED — control is ${probeMs.toFixed(2)}ms, faster than any refresh interval. ` +
                `Raising to ${FRAMES} frames per cell. These numbers are GPU work per frame, ` +
                `NOT what the page runs at in normal use — read them against each other only.`, 'color:#c96');
  }
  console.log(`%cpre-flight OK — control ${(1000 / probeMs).toFixed(0)}fps, interval ${refresh.toFixed(2)}ms ` +
              `(${(1000 / refresh).toFixed(0)}Hz)`, 'color:#6c6');

  // ---- the sweep ---------------------------------------------------------
  const cells = new Map(CONDITIONS.map(([k]) => [k, []]));
  let voided = 0;

  for (let r = 0; r < ROUNDS; r++) {
    for (const dir of ['fwd', 'rev']) {
      const order = dir === 'fwd' ? CONDITIONS : [...CONDITIONS].reverse();

      styleEl.textContent = CONDITIONS[0][1];
      await sleep(300);
      const ctlA = med(await run(80));

      const pass = [];
      for (const [name, css] of order) {
        styleEl.textContent = css;
        await sleep(300);                                  // let the compositor settle
        pass.push([name, await run(FRAMES)]);
      }

      styleEl.textContent = CONDITIONS[0][1];
      await sleep(300);
      const ctlB = med(await run(80));

      const drift = Math.abs(ctlB - ctlA) / Math.min(ctlA, ctlB);
      if (drift > DRIFT_LIMIT) {
        voided++;
        console.warn(`round ${r + 1} ${dir}: VOID — control moved ${ctlA.toFixed(1)}ms -> ${ctlB.toFixed(1)}ms ` +
                     `(${(drift * 100).toFixed(0)}%). Discarded.`);
        continue;
      }
      for (const [name, d] of pass) cells.get(name).push(d);
      console.log(`round ${r + 1} ${dir}: kept (control ${ctlA.toFixed(1)} / ${ctlB.toFixed(1)}ms)`);
    }
  }

  styleEl.remove();

  // ---- report ------------------------------------------------------------
  const rows = [];
  const base = cells.get('off').flat().sort((a, b) => a - b);
  const baseMed = base.length ? med(base) : NaN;

  for (const [name] of CONDITIONS) {
    const all = cells.get(name).flat().sort((a, b) => a - b);
    if (!all.length) { rows.push({ condition: name, note: 'no kept runs' }); continue; }
    const m = med(all);
    rows.push({
      condition   : name,
      fps         : +(1000 / m).toFixed(1),
      median_ms   : +m.toFixed(2),
      p95_ms      : +p95(all).toFixed(2),
      vsyncs      : +(m / refresh).toFixed(2),          // frame time in refresh intervals
      cost_vs_off : +(m - baseMed).toFixed(2),          // ms this condition adds over an empty sky
      runs        : cells.get(name).length,
    });
  }

  console.table(rows);

  const get = n => rows.find(r => r.condition === n) || {};
  const shipped = get('shipped'), off = get('off'), noBlend = get('noBlend');
  const share = (c) => (c.cost_vs_off != null && shipped.cost_vs_off)
    ? `${(100 * (1 - c.cost_vs_off / shipped.cost_vs_off)).toFixed(0)}% of the star field's cost removed`
    : 'n/a';

  // ---- INVERSION CHECK — read this before the saturation check ------------
  // MEASURED 2026-08-05, uncapped, RTX 3090 Ti. The table came back:
  //
  //     off          58.1 fps   17.2 ms      <- EMPTY sky, slowest on the page
  //     shipped     555.6 fps    1.8 ms      <- FULL star field, 10x faster
  //     noAnim       57.8 fps   17.3 ms
  //     skyOnly      57.8 fps   17.3 ms
  //     everything else         1.8 ms
  //
  // The three slow rows are exactly the three with NOTHING ANIMATING: all six
  // hidden, animation:none, and base-sky-only (the base sky is static). The
  // fast rows are every row where at least one layer's opacity is moving.
  //
  // That is not a cost measurement. Uncapped, the compositor only produces a
  // frame when there is DAMAGE — the trace shows DidNotProduceFrame with
  // FrameSkippedReason "kNoDamage" — so a static page falls back to the
  // display's own cadence (17ms here, a 59Hz panel) while an animating page
  // free-runs. rAF interval measures FRAME PRODUCTION RATE. With vsync on,
  // production rate is the refresh interval; with vsync off, it is "is anything
  // moving". Neither is the cost of drawing a layer.
  //
  // This is the same trap as build 23's kick detector, one level up: a rate is
  // not an accuracy, and a frame rate is not a frame cost.
  const shippedRow = rows.find(r => r.condition === 'shipped');
  const offRow     = rows.find(r => r.condition === 'off');
  if (shippedRow?.median_ms && offRow?.median_ms && offRow.median_ms > shippedRow.median_ms * 1.5) {
    console.error(
      `\nINVERTED — "off" (${offRow.median_ms}ms) is SLOWER than "shipped" (${shippedRow.median_ms}ms).\n` +
      `An empty sky cannot cost more than a full one. What is being measured is frame PRODUCTION, ` +
      `not frame cost: with vsync disabled the compositor skips frames when there is no damage, so the ` +
      `static conditions fall back to the display cadence and the animating ones free-run.\n` +
      `Every "cost_vs_off" below is meaningless. Rank only the rows that are animating, against each other.`);
  }

  // ---- SATURATION CHECK --------------------------------------------------
  // Added 2026-08-05 after the first GPU run came back with all eleven
  // conditions at 238.1fps / 4.2ms, identical to 0.1ms. That is not eleven
  // measurements of zero, it is ONE measurement of the vsync cap, repeated
  // eleven times. HANDOFF 8: "a number that does not move is not measuring what
  // you think it is." Say so loudly rather than letting a table of zeroes read
  // as a result.
  const spread = Math.max(...rows.filter(r => r.median_ms).map(r => r.median_ms))
               - Math.min(...rows.filter(r => r.median_ms).map(r => r.median_ms));
  if (spread < refresh * 0.5) {
    console.warn(
      `\nSATURATED — every condition is pinned to the ${refresh.toFixed(2)}ms vsync cap ` +
      `(total spread ${spread.toFixed(2)}ms).\n` +
      `This does NOT mean the star field is free. It means its cost is somewhere below the ` +
      `headroom this instrument can see, and the conditions cannot be ranked against each other.\n` +
      `To get a real number, relaunch Chrome UNCAPPED:\n` +
      `    chrome.exe --disable-gpu-vsync --disable-frame-rate-limit --user-data-dir="%TEMP%\\ks-gpu-test"\n` +
      `(scripts/gpu-test-chrome.bat --uncapped does this) and run this file again. ` +
      `Uncapped, the frame time becomes the actual GPU work per frame instead of the refresh interval.`);
  }

  console.log('\n%cREAD IT LIKE THIS', 'font-weight:bold');
  console.log(`  refresh interval ${refresh.toFixed(2)}ms — every median above should be near a multiple of it.`);
  console.log(`  "cost_vs_off" is the ms the condition ADDS over a page with no star field at all.`);
  console.log(`  shipped costs ${shipped.cost_vs_off}ms over an empty sky.`);
  console.log(`  noBlend:     ${share(noBlend)}   <- the 6-render-surface hypothesis`);
  console.log(`  noFilter:    ${share(get('noFilter'))}`);
  console.log(`  cloudHidden: ${share(get('cloudHidden'))}`);
  console.log(`  cloud002:    ${share(get('cloud002'))}   <- HANDOFF 10's stated first thing to try`);
  console.log(`  bandsOff:    ${share(get('bandsOff'))}`);
  console.log(`  skyOnly:     ${100 - Number(share(get('skyOnly')).split('%')[0] || 0)}% is ONE static blended layer`);
  if (voided) console.warn(`  ${voided} pass(es) voided for control drift — if that is most of them, the machine is not quiet.`);
  console.log('\nCopy the table and hand it back.');

  window.__starSweep = { rows, refresh, raw: Object.fromEntries(cells) };
  console.log('Raw intervals kept in window.__starSweep');
})();
