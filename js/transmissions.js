// Transmissions — the Channel Terminal.
//
// Reads data/transmissions.json. Each platform is a channel; selecting one
// filters the readout in place. Adding an update means adding an object to
// that file — there is no API, no key and no build step, which is deliberate:
// X's timeline API is paid-tier only, Instagram needs a reviewed Meta app and
// a refreshed token, and TikTok needs approval for a profile feed. Only
// YouTube (channel RSS) and Spotify are free and keyless, and neither is
// wired here yet. If you add one later, it should push into this same shape
// rather than render its own markup.
(function () {
  const root = document.getElementById('terminal');
  if (!root) return;

  const tabsEl    = document.getElementById('terminal-channels');
  const listEl    = document.getElementById('terminal-list');
  const readoutEl = document.getElementById('terminal-readout');
  const statusEl  = document.getElementById('terminal-status');
  const nojsEl    = document.getElementById('terminal-nojs');

  if (nojsEl) nojsEl.remove();   // JS is running, so the fallback is not needed

  let entries = [];
  let channels = [];
  let active = 'all';

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
  ));

  // 2026-07-28 -> 28 JUL 2026. Built from the parts rather than via Date() so a
  // date-only string can't be shifted a day by the reader's timezone.
  const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  function fmtDate(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
    if (!m) return String(iso || '');
    return `${m[3]} ${MONTHS[+m[2] - 1] || '???'} ${m[1]}`;
  }

  const labelFor = (id) => {
    const c = channels.find((x) => x.id === id);
    return c ? c.label : id;
  };

  const countFor = (id) =>
    id === 'all' ? entries.length : entries.filter((e) => e.channel === id).length;

  function message(main, sub) {
    return `<li><p class="terminal__msg">${esc(main)}${sub ? `<span>${esc(sub)}</span>` : ''}</p></li>`;
  }

  // ---------- render ----------
  function render() {
    const rows = active === 'all' ? entries : entries.filter((e) => e.channel === active);

    readoutEl.innerHTML =
      `&gt; CHANNEL: ${esc(labelFor(active).toUpperCase())} &middot; ` +
      `${String(rows.length).padStart(2, '0')} RECORD${rows.length === 1 ? '' : 'S'} DECODED` +
      `<span class="terminal__caret" aria-hidden="true"></span>`;

    if (!rows.length) {
      listEl.innerHTML = message(
        'No signal on this frequency',
        `Nothing filed under ${labelFor(active)} yet. Try another channel.`
      );
      return;
    }

    listEl.innerHTML = rows.map((e, i) => {
      const stamp = fmtDate(e.date) + (e.time ? ' ' + esc(e.time) : '');
      const target = e.internal || e.href || '';
      const external = !e.internal && !!e.href;
      const panelId = `trec-${esc(e.id)}-${i}`;
      const media = e.media
        ? `<div class="trow__media">
             <img src="${esc(e.media)}" alt="${esc(e.mediaAlt || '')}" loading="lazy">
             ${e.video ? '<span class="trow__play" aria-hidden="true">&#9654;</span>' : ''}
           </div>`
        : '';

      return `<li class="trow" data-channel="${esc(e.channel)}">
        <button class="trow__btn" type="button" aria-expanded="false" aria-controls="${panelId}">
          <span class="trow__time">${esc(e.id)} &middot; ${stamp}</span>
          <span class="trow__channel">${esc(labelFor(e.channel))}</span>
          <span class="trow__text"><b>${esc(e.title)}</b> &mdash; ${esc(e.body)}</span>
          <span class="trow__go" aria-hidden="true">&rsaquo;</span>
        </button>
        <div class="trow__detail" id="${panelId}" hidden>
          ${media}
          <div>
            <p class="trow__body">${esc(e.body)}</p>
            ${target ? `<a class="trow__link" href="${esc(target)}"${
              external ? ' target="_blank" rel="noopener"' : ''
            }>${external ? `Open on ${esc(labelFor(e.channel))}` : 'Open'} &nbsp;&rarr;</a>` : ''}
          </div>
        </div>
      </li>`;
    }).join('');
  }

  function renderTabs() {
    tabsEl.innerHTML = channels.map((c) => {
      const n = countFor(c.id);
      return `<button class="terminal__channel" type="button" role="tab"
        id="chan-${esc(c.id)}"
        aria-selected="${c.id === active}"
        tabindex="${c.id === active ? '0' : '-1'}"
        data-channel="${esc(c.id)}" data-count="${n}">${esc(c.label)}</button>`;
    }).join('');
  }

  function select(id, focusTab) {
    active = id;
    // Reflect the channel in the URL so a tuned frequency can be linked.
    // replaceState, not `location.hash = ...` — assigning the hash would jump
    // the page to the top on every channel change.
    history.replaceState(null, '', id === 'all' ? location.pathname : '#' + id);
    renderTabs();
    render();
    if (focusTab) {
      const t = tabsEl.querySelector(`[data-channel="${id}"]`);
      if (t) t.focus();
    }
  }

  // ---------- interaction ----------
  tabsEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.terminal__channel');
    if (btn) select(btn.dataset.channel, false);
  });

  // Arrow-key navigation, as a tablist is expected to have.
  tabsEl.addEventListener('keydown', (e) => {
    const keys = { ArrowRight: 1, ArrowLeft: -1, Home: 'first', End: 'last' };
    if (!(e.key in keys)) return;
    e.preventDefault();
    const ids = channels.map((c) => c.id);
    const at = ids.indexOf(active);
    let next;
    if (keys[e.key] === 'first') next = 0;
    else if (keys[e.key] === 'last') next = ids.length - 1;
    else next = (at + keys[e.key] + ids.length) % ids.length;
    select(ids[next], true);
  });

  // Open a row in place. One open at a time — the list is meant to stay scannable.
  listEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.trow__btn');
    if (!btn) return;
    const row = btn.closest('.trow');
    const panel = document.getElementById(btn.getAttribute('aria-controls'));
    const open = btn.getAttribute('aria-expanded') === 'true';

    listEl.querySelectorAll('.trow__btn[aria-expanded="true"]').forEach((other) => {
      if (other === btn) return;
      other.setAttribute('aria-expanded', 'false');
      other.closest('.trow').classList.remove('is-open');
      const p = document.getElementById(other.getAttribute('aria-controls'));
      if (p) p.hidden = true;
    });

    btn.setAttribute('aria-expanded', String(!open));
    row.classList.toggle('is-open', !open);
    if (panel) panel.hidden = open;
  });

  // ---------- load ----------
  fetch('data/transmissions.json')
    .then((r) => {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then((data) => {
      channels = Array.isArray(data.channels) && data.channels.length
        ? data.channels
        : [{ id: 'all', label: 'All' }];
      entries = Array.isArray(data.entries) ? data.entries : [];

      // Empty channels stay visible by default, and that is the point of this
      // design rather than an oversight: a frequency with nothing on it reads
      // as a true state of the world ("NO SIGNAL ON THIS FREQUENCY") and tells
      // a visitor which platforms exist at all. Hiding them would leave the
      // page saying "tune to a frequency" above a single button.
      // Set "hideEmptyChannels": true in the JSON to drop them instead.
      if (data.hideEmptyChannels) {
        channels = channels.filter((c) => c.id === 'all' || countFor(c.id) > 0);
      }

      const wanted = location.hash.replace('#', '');
      if (wanted && channels.some((c) => c.id === wanted)) active = wanted;

      if (statusEl) {
        statusEl.textContent = entries.length
          ? `RECEIVING · ${String(entries.length).padStart(2, '0')} RECORDS`
          : 'STANDING BY';
      }

      renderTabs();
      render();
    })
    .catch(() => {
      if (statusEl) statusEl.textContent = 'SIGNAL LOST';
      readoutEl.innerHTML = '&gt; CHANNEL: —';
      listEl.innerHTML = message(
        'Signal lost',
        'The feed could not be reached. This page must be served over http — opening the file directly blocks the fetch.'
      );
    });
})();
