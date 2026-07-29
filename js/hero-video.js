// Hero video: respects prefers-reduced-motion (falls back to the static poster
// frame, no autoplay at all) and provides an explicit, off-by-default sound toggle.
(function () {
  const video = document.getElementById('hero-video');
  const toggle = document.getElementById('hero-sound-toggle');
  if (!video) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reducedMotion) {
    // Leave the poster frame as a static image; don't autoplay, don't offer sound control.
    if (toggle) toggle.style.display = 'none';
    return;
  }

  video.muted = true;
  const playAttempt = video.play();
  if (playAttempt && typeof playAttempt.catch === 'function') {
    playAttempt.catch(() => {
      // Autoplay blocked by the browser — poster frame remains visible, which is fine.
    });
  }

  if (toggle) {
    toggle.addEventListener('click', () => {
      video.muted = !video.muted;
      const soundOn = !video.muted;
      toggle.setAttribute('aria-pressed', String(soundOn));
      toggle.innerHTML = soundOn
        ? '<span aria-hidden="true">&#128266;</span> Sound On'
        : '<span aria-hidden="true">&#128264;</span> Sound Off';
      if (soundOn && video.paused) video.play().catch(() => {});
    });
  }
})();
