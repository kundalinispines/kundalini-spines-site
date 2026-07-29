// Newsletter signup — Buttondown (newsletter: kundalinispines).
//
// This file does ONE thing: it blocks submission of an obviously invalid address
// so the visitor is not sent to another site to be told off. Everything else is
// the browser's native form POST, declared on the <form> in index.html.
//
// MEASURED 2026-07-29 — do not re-litigate this without re-testing:
//
// Buttondown's embed-subscribe endpoint does NOT send CORS headers to this origin.
// Two real signups were tested and both went through the native POST. An earlier
// version of this file tried fetch() first and fell back to form.submit() in the
// catch block. That fallback worked, but it fired AFTER an await — which breaks the
// user-gesture chain, so the browser treated the resulting tab as a popup and
// blocked it until the user allowed it by hand. Visitors who dismiss that prompt,
// or whose browser blocks popups silently, click Subscribe and see NOTHING happen.
//
// So: no fetch, no async, no preventDefault on the success path. The submit is the
// browser's own, synchronous, inside the click. It cannot be popup-blocked and it
// cannot silently fail.
//
// Three consequences worth knowing before you "improve" this:
//
//   1. The visitor LEAVES the site and lands on Buttondown's confirmation page.
//      That is deliberate. It is the price of a signup that always works. The form
//      no longer opens a new tab (target="_blank" was removed) because a new tab is
//      exactly what gets popup-blocked.
//   2. Do NOT reintroduce fetch with mode:'no-cors' to keep people on the page. That
//      request returns an opaque response — status is always 0, ok is always false —
//      so you cannot tell a real signup from a rejection, and the only message you
//      could show would be a guess. This form never claims a subscription it cannot
//      observe.
//   3. The only way to keep visitors on the page honestly is a server-side proxy
//      that talks to Buttondown's API and returns a real status. That needs a host
//      which runs code. This site is static, so that is a hosting decision, not a
//      JavaScript one.
(function () {
  const form = document.getElementById('newsletter-form');
  if (!form) return;

  const status = document.getElementById('newsletter-status');
  const input = form.querySelector('input[type="email"]');

  form.addEventListener('submit', (e) => {
    const email = (input.value || '').trim();

    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      // The ONLY case where we interrupt the browser.
      e.preventDefault();
      status.textContent = 'Enter a valid email address.';
      status.dataset.state = 'error';
      input.focus();
      return;
    }

    // Valid: say where they are going, then get out of the way. No preventDefault,
    // so the native cross-origin POST proceeds inside the original click.
    status.textContent = 'Taking you to Buttondown to confirm…';
    status.dataset.state = 'info';
  });
})();
