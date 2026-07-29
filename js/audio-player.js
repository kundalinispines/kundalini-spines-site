// Audio Player — reusable, dependency-free, built on the native <audio> element.
//
// Usage: drop a container with class="audio-player" and data attributes, e.g.
// <div class="audio-player" data-title="Track Title" data-src="assets/audio/track.mp3" data-cover="assets/cover.jpg"></div>
// This script finds every .audio-player on the page and builds its controls.
// Never autoplays. Only one player on the page plays at a time.

(function () {
  const fmtTime = (s) => {
    if (!isFinite(s) || s < 0) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const allPlayers = [];

  function buildPlayer(container) {
    const title = container.dataset.title || 'Untitled';
    const artist = container.dataset.artist || 'Kundalini Spines';
    const src = container.dataset.src;
    const cover = container.dataset.cover;

    container.innerHTML = `
      ${cover ? `<img class="audio-player__cover" src="${cover}" alt="" width="56" height="56" loading="lazy">` : ''}
      <div class="audio-player__body">
        <div class="audio-player__meta">
          <span class="audio-player__title">${title}</span>
          <span class="audio-player__artist">${artist}</span>
        </div>
        <div class="audio-player__controls">
          <button type="button" class="audio-player__play" aria-label="Play ${title}">
            <span class="audio-player__play-icon" aria-hidden="true">&#9654;</span>
          </button>
          <span class="audio-player__time audio-player__time--current">0:00</span>
          <input type="range" class="audio-player__scrub" min="0" max="100" value="0" step="0.1"
                 aria-label="Seek ${title}">
          <span class="audio-player__time audio-player__time--duration">0:00</span>
          <label class="audio-player__volume-label sr-only" for="vol-${title.replace(/\s+/g, '-')}">Volume</label>
          <input type="range" class="audio-player__volume" id="vol-${title.replace(/\s+/g, '-')}"
                 min="0" max="1" step="0.01" value="0.8" aria-label="Volume">
        </div>
        <p class="audio-player__status" role="status" aria-live="polite"></p>
      </div>
    `;

    const audio = new Audio();
    audio.preload = 'none';
    audio.src = src;

    const playBtn = container.querySelector('.audio-player__play');
    const playIcon = container.querySelector('.audio-player__play-icon');
    const scrub = container.querySelector('.audio-player__scrub');
    const volume = container.querySelector('.audio-player__volume');
    const curEl = container.querySelector('.audio-player__time--current');
    const durEl = container.querySelector('.audio-player__time--duration');
    const status = container.querySelector('.audio-player__status');

    audio.volume = 0.8;
    let seeking = false;

    const setStatus = (msg) => { status.textContent = msg; };

    playBtn.addEventListener('click', () => {
      if (audio.paused) {
        // Pause every other player before starting this one.
        allPlayers.forEach((p) => { if (p !== audio && !p.paused) p.pause(); });
        setStatus('Loading…');
        audio.play().then(() => setStatus('')).catch(() => {
          setStatus('Audio unavailable.');
        });
      } else {
        audio.pause();
      }
    });

    audio.addEventListener('play', () => {
      playIcon.innerHTML = '&#10074;&#10074;';
      playBtn.setAttribute('aria-label', `Pause ${title}`);
    });
    audio.addEventListener('pause', () => {
      playIcon.innerHTML = '&#9654;';
      playBtn.setAttribute('aria-label', `Play ${title}`);
    });
    audio.addEventListener('loadedmetadata', () => {
      scrub.max = audio.duration;
      durEl.textContent = fmtTime(audio.duration);
    });
    audio.addEventListener('timeupdate', () => {
      if (!seeking) scrub.value = audio.currentTime;
      curEl.textContent = fmtTime(audio.currentTime);
    });
    audio.addEventListener('ended', () => setStatus('Ended.'));
    audio.addEventListener('error', () => {
      setStatus('Audio unavailable — file could not be loaded.');
      playBtn.disabled = true;
      scrub.disabled = true;
    });

    scrub.addEventListener('input', () => { seeking = true; curEl.textContent = fmtTime(Number(scrub.value)); });
    scrub.addEventListener('change', () => { audio.currentTime = Number(scrub.value); seeking = false; });
    volume.addEventListener('input', () => { audio.volume = Number(volume.value); });

    allPlayers.push(audio);
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.audio-player').forEach(buildPlayer);
  });
})();
