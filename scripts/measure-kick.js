/* ==========================================================================
   FRAME-TIME MEASUREMENT FOR THE KICK-REACTIVE SPINE

   HANDOFF 9 says to take a baseline before trusting the shake, because the
   cloud layer's transform cost 28-40% of the frame rate on an object of
   exactly the same shape. This is that measurement.

   RUN IT YOURSELF, NOT THROUGH THE EXTENSION. An attempt to take this
   remotely on 2026-08-05 produced a median of exactly 66.7ms in every
   condition — four dropped intervals on a 60Hz display — with the page
   already saturated before the kick was switched on, so the thing being
   measured was invisible underneath it. The instrument has to be out of the
   way, which means DevTools on a frontmost window with nothing else running.

   HOW
     1. Close Premiere, OBS, any game, any other Chrome window. This is not
        superstition — the same session measured a ceiling of 38.7fps with the
        star field AND the spine both hidden, which a near-blank page should
        never do.
     2. Open http://localhost:8000/ (NOT /?tune — the tuner's meter rewrites
        its readout ten times a second and has no business being in a frame
        time).
     3. F12, Console, paste this whole file, Enter.
     4. Leave the window alone and frontmost for about 20 seconds.

   WHAT IT PRINTS
     idle              nothing playing, no kick
     kick full         the shake and the flash both running
     kick, no visuals  the same rAF loop and the same per-frame custom-property
                       writes, with --kick-shake / --kick-flash / --kick-stars
                       forced to 0

   Read the RATIOS, not the absolutes — HANDOFF 9 is explicit that this
   machine's ceiling moved 88 -> 60 between two sessions with no code change.

     kick full / idle              total cost of the feature
     kick, no visuals / idle       cost of the loop alone (should be ~1.00)
     kick full / kick, no visuals  cost of the PAINT, which is the number the
                                   cloud-layer finding was about

   A ratio at or under about 1.05 on the paint line means the shake is on the
   cheap path and there is nothing to do. Above ~1.2, set --kick-shake to 0
   and re-run: if the ratio collapses, it is the background-position move and
   the flash alone is a complete look. If it does not, it is the flash, and
   the lever is --kick-flash.
   ========================================================================== */
(async () => {
  const root = document.documentElement;

  const sample = async (ms = 3000) => {
    const t = [];
    let last = await new Promise(r => requestAnimationFrame(r));
    const t0 = last;
    let warm = 0;
    for (;;) {
      const now = await new Promise(r => requestAnimationFrame(r));
      if (++warm > 10) t.push(now - last);
      last = now;
      if (now - t0 > ms) break;
    }
    t.sort((a, b) => a - b);
    return {
      med: t[t.length >> 1],
      p95: t[Math.floor(t.length * 0.95)],
      fps: 1000 / t[t.length >> 1],
      n: t.length,
    };
  };

  /* Refuse to report a number the environment cannot support. */
  const probe = await sample(1000);
  if (probe.fps < 45) {
    console.warn(
      `%crAF is only running at ${probe.fps.toFixed(1)}fps before anything is measured.`,
      'color:#D8534F;font-weight:bold');
    console.warn('Something is capping this — another window on top, a background ' +
      'render, or a tab that is not frontmost. Fix that first; any ratio taken now ' +
      'is measuring the cap, not the spine.');
  }

  /* Put the spine on screen. Measuring it scrolled out of view measures nothing. */
  document.getElementById('tracks').scrollIntoView();
  await new Promise(r => setTimeout(r, 1500));

  /* A synthetic driver rather than real playback: same write pattern (a hit
     every ~500ms, 260ms decay, alternating sign — the rate measured across all
     28 samples), but deterministic and repeatable, and with no audio decoding
     in the frame budget to confound it. */
  let stopDrive = null;
  const startDrive = () => {
    root.classList.add('is-spine-kicking');
    let env = 0, sign = 1, lastHit = 0, lastF = performance.now(), stop = false;
    const step = (now) => {
      if (stop) return;
      const dt = Math.min(100, now - lastF);
      lastF = now;
      if (now - lastHit > 500) { lastHit = now; sign = -sign; env = 0.9; }
      env *= Math.exp(-dt / 260);
      if (env < 0.002) env = 0;
      root.style.setProperty('--kick', env.toFixed(4));
      root.style.setProperty('--kick-sign', sign < 0 ? '-1' : '1');
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    stopDrive = () => {
      stop = true;
      root.classList.remove('is-spine-kicking');
      root.style.removeProperty('--kick');
      root.style.removeProperty('--kick-sign');
    };
  };
  const muteVisuals = (on) => {
    ['--kick-shake', '--kick-flash', '--kick-stars'].forEach(k =>
      on ? root.style.setProperty(k, '0') : root.style.removeProperty(k));
  };

  /* Paired and alternated, because the machine drifts. Two rounds. */
  const r = { idle: [], full: [], loop: [] };
  for (let round = 0; round < 2; round++) {
    r.idle.push(await sample());
    startDrive();
    r.full.push(await sample());
    muteVisuals(true);
    r.loop.push(await sample());
    muteVisuals(false);
    stopDrive();
  }

  const avg = (k) => (r[k][0].med + r[k][1].med) / 2;
  const p95 = (k) => (r[k][0].p95 + r[k][1].p95) / 2;

  console.table({
    'idle': { 'median ms': +avg('idle').toFixed(2), 'p95 ms': +p95('idle').toFixed(2),
              fps: +(1000 / avg('idle')).toFixed(1) },
    'kick full': { 'median ms': +avg('full').toFixed(2), 'p95 ms': +p95('full').toFixed(2),
              fps: +(1000 / avg('full')).toFixed(1) },
    'kick, no visuals': { 'median ms': +avg('loop').toFixed(2), 'p95 ms': +p95('loop').toFixed(2),
              fps: +(1000 / avg('loop')).toFixed(1) },
  });

  const paint = avg('full') / avg('loop');
  console.table({
    'kick full / idle': +(avg('full') / avg('idle')).toFixed(3),
    'loop only / idle': +(avg('loop') / avg('idle')).toFixed(3),
    'PAINT COST  (full / loop)': +paint.toFixed(3),
  });
  console.log(paint <= 1.05
    ? '%cPAINT COST IS NEGLIGIBLE — the shake is on the cheap path.'
    : paint <= 1.2
      ? '%cPAINT COST IS MODEST — judge it by eye, it is a real but small cost.'
      : '%cPAINT COST IS REAL — set --kick-shake to 0 and re-run to see if it is the move or the flash.',
    paint <= 1.05 ? 'color:#7FB37F;font-weight:bold'
                  : paint <= 1.2 ? 'color:#D8D0BE;font-weight:bold'
                                 : 'color:#D8534F;font-weight:bold');
})();
