/* Hero video: gapless loop, reduced-motion poster, off-by-default sound toggle,
   and the one signal the rest of the page's video budget waits on.

   THE LOOP IS NOT THE `loop` ATTRIBUTE ANY MORE (Sept 1 2026). The owner and a
   visitor both reported the hero "chugging". MEASURED live with
   requestVideoFrameCallback, Chrome and Brave, sky on and off: every single
   presentation gap sat at the wrap. The seek from 8.71s back to 0 cost 58-96ms
   and the first frame after it another 58-83ms — a three-to-four-frame hold
   every 8.8 seconds, identical in the webm and the mp4, with ZERO dropped
   frames, no long tasks and rAF flat at 4.2ms. Not JavaScript, not the sky,
   not the decoder: the wrap itself. And the clip is a hard cut at the wrap
   (frame 209 vs frame 0 scores 0.17 SSIM where neighbours score 0.82), so the
   hold lands on a cut and reads as a stutter.

   WHAT FIXES IT. A MediaSource fed the same fragmented mp4 end to end, so the
   timeline never ends and nothing ever seeks. MEASURED locally, 30s: every
   wrap exactly one frame period (42ms), no gaps, no drops. The obvious
   alternative — two <video> elements swapped at the end — was measured too
   and does NOT close it: swapping on `ended` left 80-140ms, swapping on the
   incoming element's frame callback left 23-88ms. Do not go back to it.

   THE STREAM HAS NO AUDIO IN IT, AND THAT IS THE WHOLE TRICK. The first cut
   of this kept the AAC track in the fragmented file and measured WORSE than
   the loop attribute: 556 of 708 frames dropped on a fast local load and a
   208ms hold at every seam. MEASURED as a matrix, six trial files, 20s each:
   every audio-free variant was gapless — keyframe or 1s fragments, sequence
   mode or explicit offsets, whole-file or chunked appends, all 42ms at the
   wrap. Every variant WITH audio reopened a 67-212ms seam, trimmed to the
   video length or not, in either append mode. Chrome clocks playback off the
   audio renderer, and the splice MSE has to make where one copy's AAC frames
   meet the next stalls that clock for a few frames every 8.75s. So the loop
   file is `-an`, and sequence mode is correct again: with one track the next
   copy starts exactly where the video ended.

   THE SOUND, WHEN ASKED FOR, IS A SEPARATE <audio> ELEMENT playing the AAC
   from the shipped mp4 with the loop attribute, started in phase with the
   picture and nudged back into phase on every timeupdate that finds it more
   than a quarter second out. Its own wrap has the seek hold this file exists
   to remove from the picture, and it drifts a little against the picture
   across each loop — both are inside the nudge, and both are only audible
   with the sound on, which nobody has by default. On the fallback path the
   sound stays inside the <video> and the toggle just unmutes it, as before.

   THE FILE. assets/hero/messengers-hero-loop.mp4 is the shipped mp4's video
   track remuxed with `-an -c:v copy -movflags
   frag_keyframe+empty_moov+default_base_moof` — same pixels, two fragments
   (the clip has two keyframes). 1s fragments measured just as gapless in
   Chrome and would paint the first frame sooner on a slow line, but every
   fragment but the first would start on a non-keyframe and not every MSE
   implementation is documented to accept that; the poster IS frame 0, so the
   later first paint is invisible. The webm/mp4 <source> pair stays as the
   fallback and is what iPhone Safari (no window.MediaSource) still plays,
   seam and all.

   THE SIGNAL. js/deep-field-bg.js holds every below-the-fold clip — the film
   rows AND the deep-field background — until this file says the hero has what
   it needs, so the first screen is never queued behind 14MB it cannot see yet.
   MEASURED at 8Mbps before this: the hero took 14s to arrive and stalled three
   times on its first pass while deep-field-2.webm (4.75MB) downloaded beside
   it from t=0. `ks:hero-ready` fires on the hero element (bubbling) exactly
   once, on EVERY terminal path — reduced motion, fetch complete, fetch failed,
   fallback canplaythrough, fallback error — because a page that never releases
   its clips is a worse failure than a slow hero. data-hero-ready="1" is set
   first, for a listener that attaches after the event has gone. */
(function () {
  var video = document.getElementById('hero-video');
  var toggle = document.getElementById('hero-sound-toggle');
  if (!video) return;

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function signalReady() {
    if (video.dataset.heroReady) return;
    video.dataset.heroReady = '1';
    var ev;
    try { ev = new CustomEvent('ks:hero-ready', { bubbles: true }); }
    catch (e) { ev = document.createEvent('Event'); ev.initEvent('ks:hero-ready', true, false); }
    video.dispatchEvent(ev);
  }

  if (reducedMotion) {
    // Leave the poster frame as a static image; don't autoplay, don't offer sound control.
    if (toggle) toggle.style.display = 'none';
    signalReady();
    return;
  }

  video.muted = true;

  function play() {
    var p = video.play();
    if (p && typeof p.catch === 'function') {
      p.catch(function () {
        // Autoplay blocked by the browser — poster frame remains visible, which is fine.
      });
    }
  }

  var loopSrc = video.getAttribute('data-loop-src');
  var loopDur = parseFloat(video.getAttribute('data-loop-dur'));
  var MIME = 'video/mp4; codecs="avc1.640032"';   /* video only — see the head note */
  var canStream = !!(loopSrc && loopDur > 0 && window.MediaSource && window.fetch &&
    window.ReadableStream && MediaSource.isTypeSupported(MIME));

  /* ------------------------------------------------ fallback: progressive */
  function progressiveLoop() {
    video.dataset.loopMode = 'progressive';
    if (video.hasAttribute('src')) video.removeAttribute('src');
    video.loop = true;
    video.preload = 'auto';
    video.load();
    video.addEventListener('canplaythrough', signalReady, { once: true });
    video.addEventListener('error', signalReady, { once: true });
    /* A <source> that 404s errors the <source>, not the <video>, so neither
       listener above would fire. Eight seconds is the same backstop the
       deep-field module gives its own clip. */
    setTimeout(signalReady, 8000);
    play();
  }

  /* ------------------------------------------------- gapless: MediaSource */
  function streamLoop() {
    var ms = new MediaSource();
    var sb = null;
    var url = URL.createObjectURL(ms);
    var chunks = [];      /* the first copy, as it arrives                   */
    var whole = null;     /* the first copy reassembled, for every later copy */
    var queue = [];       /* ArrayBuffers waiting for the SourceBuffer to idle */
    var copies = 0;       /* copies whose first byte has been appended        */
    var failed = false;
    var started = false;
    var AHEAD = loopDur * 2;   /* keep two clips of runway in front of the playhead */
    var KEEP = loopDur * 3;    /* and three behind, then prune                     */
    /* DO NOT PLAY ON THE FIRST FRAME. Chrome buffers samples as the mdat
       arrives and will start on a handful of them; MEASURED at 8Mbps the
       picture then outran the download eight times in its first second
       (20-130ms stalls, 9 dropped frames) before settling. Four seconds of
       runway is under half the clip and, at this clip's 4.1Mbps, lands at
       ~2.9s on that line — after which 8Mbps in against 4.1Mbps out never
       stalls again. Nobody sees the wait: the poster IS frame 0. */
    var MIN_START = Math.min(4, loopDur / 2);

    video.dataset.loopMode = 'mse';
    video.removeAttribute('loop');
    video.loop = false;

    function bail() {
      if (failed) return;
      failed = true;
      try { URL.revokeObjectURL(url); } catch (e) {}
      progressiveLoop();
    }

    function drain() {
      if (failed || !sb || sb.updating || ms.readyState !== 'open') return;
      if (!queue.length) { prune(); return; }
      var buf = queue.shift();
      try {
        sb.appendBuffer(buf);
      } catch (e) {
        /* QuotaExceededError: the buffer is full behind us. Prune and let the
           next updateend retry; anything else is a real failure. */
        if (e && e.name === 'QuotaExceededError') { queue.unshift(buf); prune(true); return; }
        bail();
      }
    }

    function prune(force) {
      if (failed || !sb || sb.updating || !sb.buffered.length) return;
      var start = sb.buffered.start(0);
      var cut = video.currentTime - KEEP;
      if (force) cut = video.currentTime - loopDur;
      if (cut - start > loopDur) {
        try { sb.remove(start, cut); } catch (e) {}
      }
    }

    function maybePlay() {
      if (started || failed || !sb) return;
      var end = sb.buffered.length ? sb.buffered.end(sb.buffered.length - 1) : 0;
      /* "The fetch finished" is not "the frames are parsed": on a fast line the
         whole file lands while the SourceBuffer is still a second into it, and
         starting on that (the first cut did) put a 60-80ms gap in the first
         frames of every local load. Wait for the runway, or for the last of
         the first copy to have actually been consumed. */
      var drained = !!whole && !queue.length && !sb.updating;
      if (end >= MIN_START || drained) { started = true; play(); }
    }

    function topUp() {
      if (failed || !whole || !sb || ms.readyState !== 'open') return;
      var end = sb.buffered.length ? sb.buffered.end(sb.buffered.length - 1) : 0;
      /* Count what is queued as already there, or a burst of timeupdates
         queues the same copy several times over. */
      var pending = queue.length;
      if (end + pending * loopDur - video.currentTime < AHEAD) {
        queue.push(whole);
        copies++;
        drain();
      }
    }

    ms.addEventListener('sourceopen', function () {
      if (failed) return;
      try {
        sb = ms.addSourceBuffer(MIME);
        /* sequence: each copy lands where the last frame of the previous one
           ended. Exact, because there is one track — see the head note. */
        sb.mode = 'sequence';
      } catch (e) { bail(); return; }
      sb.addEventListener('updateend', function () { maybePlay(); drain(); topUp(); });
      sb.addEventListener('error', bail);

      fetch(loopSrc, { credentials: 'same-origin' }).then(function (res) {
        if (!res.ok || !res.body) throw new Error('hero loop ' + res.status);
        var reader = res.body.getReader();
        copies = 1;
        return (function pump() {
          return reader.read().then(function (r) {
            if (failed) return;
            if (r.done) {
              /* Reassemble once; every later copy is this buffer again. */
              var n = 0, i;
              for (i = 0; i < chunks.length; i++) n += chunks[i].byteLength;
              var out = new Uint8Array(n), o = 0;
              for (i = 0; i < chunks.length; i++) { out.set(chunks[i], o); o += chunks[i].byteLength; }
              whole = out.buffer;
              chunks = null;
              signalReady();
              maybePlay();
              topUp();
              return;
            }
            chunks.push(r.value);
            /* Chunk boundaries fall anywhere; MSE parses across appends, and
               the chunked path measured as gapless as the whole-file one. */
            queue.push(r.value);
            drain();
            return pump();
          });
        })();
      }).catch(function () { signalReady(); bail(); });
    }, { once: true });

    video.addEventListener('error', function () { if (video.dataset.loopMode === 'mse') bail(); });
    video.addEventListener('timeupdate', topUp);

    video.src = url;
    /* play() waits for MIN_START — see maybePlay(). */
  }

  if (canStream) streamLoop();
  else progressiveLoop();

  /* ------------------------------------------------------------ the sound */
  /* On the MSE path the picture has no audio track (head note), so the sound
     is the shipped mp4's AAC in its own element, created on the first click
     and never fetched before then. `phase` is the picture's position inside
     one copy; the audio is started there and pulled back to it whenever the
     two are more than 250ms apart — its own loop wrap, and any drift, both
     land inside that. On the fallback path the audio is the <video>'s own
     track and the toggle is the mute switch it always was. */
  var sound = null;
  function phase() { return loopDur > 0 ? video.currentTime % loopDur : 0; }
  function soundOn() {
    if (video.dataset.loopMode !== 'mse') { video.muted = false; if (video.paused) play(); return; }
    if (!sound) {
      sound = document.createElement('audio');
      sound.preload = 'auto';
      sound.loop = true;
      sound.src = video.querySelector('source[type="video/mp4"]').getAttribute('src');
      sound.setAttribute('aria-hidden', 'true');
      /* In the document, not detached: a detached element plays, but nothing
         can find it — not the verification pass, not a screen reader, not the
         next session's console. No controls, so it has no box. */
      video.parentNode.insertBefore(sound, video.nextSibling);
      video.addEventListener('timeupdate', function () {
        if (!sound || sound.paused || !sound.duration) return;
        var want = phase();
        var d = Math.abs(sound.currentTime - want);
        if (d > 0.25 && d < loopDur - 0.25) sound.currentTime = want;
      });
    }
    sound.currentTime = phase();
    var p = sound.play();
    if (p && typeof p.catch === 'function') p.catch(function () {});
  }
  function soundOff() {
    if (video.dataset.loopMode !== 'mse') { video.muted = true; return; }
    if (sound) sound.pause();
  }

  if (toggle) {
    toggle.addEventListener('click', function () {
      var on = toggle.getAttribute('aria-pressed') !== 'true';
      if (on) soundOn(); else soundOff();
      toggle.setAttribute('aria-pressed', String(on));
      toggle.innerHTML = on
        ? '<span aria-hidden="true">&#128266;</span> Sound On'
        : '<span aria-hidden="true">&#128264;</span> Sound Off';
    });
  }
})();
