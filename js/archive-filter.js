// Archive filter — single-select category filter over .archive-card elements.
// Each card carries data-category; filter chips carry data-filter (or "all").
(function () {
  const bar = document.querySelector('.filter-bar');
  const grid = document.querySelector('.archive-grid');
  const status = document.querySelector('.archive-status');
  if (!bar || !grid) return;

  const cards = Array.from(grid.querySelectorAll('.archive-card'));
  const chips = Array.from(bar.querySelectorAll('.filter-chip'));

  function applyFilter(filter) {
    let visible = 0;
    cards.forEach((card) => {
      const match = filter === 'all' || card.dataset.category === filter;
      card.style.display = match ? '' : 'none';
      if (match) visible += 1;
    });

    let empty = grid.querySelector('.empty-state');
    if (visible === 0) {
      if (!empty) {
        empty = document.createElement('div');
        empty.className = 'empty-state';
        empty.setAttribute('role', 'status');
        empty.innerHTML = '<span class="label">Nothing Filed Yet</span><p>No archive entries in this category yet &mdash; check back as more are recovered.</p>';
        grid.after(empty);
      }
    } else if (empty) {
      empty.remove();
    }

    if (status) {
      status.textContent = visible === 0
        ? 'No entries in this category yet.'
        : `Showing ${visible} ${visible === 1 ? 'entry' : 'entries'}.`;
    }
  }

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      chips.forEach((c) => c.setAttribute('aria-pressed', 'false'));
      chip.setAttribute('aria-pressed', 'true');
      applyFilter(chip.dataset.filter);
    });
  });
})();
