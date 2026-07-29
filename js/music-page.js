// Music page — simple real track listing (cover, description, 20s sample player).
// Same data source as the homepage track experience (data/tracks.json), lighter presentation.
(function () {
  const grid = document.getElementById('release-grid');
  if (!grid) return;

  fetch('data/tracks.json')
    .then((r) => r.json())
    .then((data) => renderTracks(data))
    .catch(() => {
      grid.innerHTML = '<p class="empty-state" role="status">Tracks could not be loaded right now.</p>';
    });

  let currentAudio = null;

  function renderTracks(data) {
    const tracks = data.tracks || [];
    grid.innerHTML = '';
    tracks.forEach((track) => {
      const card = document.createElement('article');
      card.className = 'release-card';
      card.innerHTML = `
        <div class="release-card__art"><img src="${track.artwork}" alt="${track.title} cover art" loading="lazy"></div>
        <div class="release-card__body">
          <span class="label">${track.release || ''}${track.duration ? ' · ' + track.duration : ''}</span>
          <h3>${track.title}</h3>
          <p>${track.oneLiner}</p>
          <div class="track-sample-player" data-sample="${track.sampleUrl || ''}" data-duration="${track.sampleDuration || 20}" style="border:${'var(--border-hairline)'};padding:var(--space-3);">
            <button type="button" class="track-sample-player__btn" aria-label="Play 20-second sample of ${track.title}" style="border-color:var(--color-white);">
              <span aria-hidden="true">&#9654;</span>
            </button>
            <div class="track-sample-player__bar"><div class="track-sample-player__bar-fill" style="background:var(--color-bone);"></div></div>
            <span class="track-sample-player__status" role="status" aria-live="polite">Play Sample</span>
          </div>
        </div>
      `;
      wireSample(card.querySelector('.track-sample-player'));
      grid.appendChild(card);
    });
  }

  function wireSample(root) {
    const src = root.dataset.sample;
    const cap = parseFloat(root.dataset.duration) || 20;
    const btn = root.querySelector('.track-sample-player__btn');
    const icon = btn.querySelector('span');
    const fill = root.querySelector('.track-sample-player__bar-fill');
    const status = root.querySelector('.track-sample-player__status');
    if (!src) { status.textContent = 'Sample coming soon'; btn.disabled = true; return; }

    const audio = new Audio(src);
    audio.preload = 'none';

    btn.addEventListener('click', () => {
      if (currentAudio && currentAudio !== audio) { currentAudio.pause(); currentAudio.currentTime = 0; }
      if (audio.paused) {
        audio.play().catch(() => { status.textContent = 'Sample unavailable'; btn.disabled = true; });
        currentAudio = audio;
      } else {
        audio.pause();
      }
    });
    audio.addEventListener('play', () => { icon.innerHTML = '&#10074;&#10074;'; status.textContent = 'Playing sample'; });
    audio.addEventListener('pause', () => { icon.innerHTML = '&#9654;'; status.textContent = 'Play Sample'; });
    audio.addEventListener('timeupdate', () => {
      fill.style.width = Math.min(100, (audio.currentTime / cap) * 100) + '%';
      if (audio.currentTime >= cap) { audio.pause(); audio.currentTime = 0; fill.style.width = '0%'; }
    });
    audio.addEventListener('ended', () => { fill.style.width = '0%'; status.textContent = 'Play Sample'; });
    audio.addEventListener('error', () => { status.textContent = 'Sample unavailable'; btn.disabled = true; });
  }
})();
