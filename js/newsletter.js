// Newsletter signup — client-side validation + states only. No provider is
// connected yet (see docs/04-asset-plan.md for the integration point), so this
// intentionally never claims a successful live subscription.
(function () {
  const form = document.getElementById('newsletter-form');
  if (!form) return;
  const status = document.getElementById('newsletter-status');
  const input = form.querySelector('input[type="email"]');
  const button = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = (input.value || '').trim();
    if (!email || !email.includes('@')) {
      status.textContent = 'Enter a valid email address.';
      status.dataset.state = 'error';
      input.focus();
      return;
    }

    button.disabled = true;
    status.textContent = 'Sending…';
    status.dataset.state = 'info';

    // TODO(integration): replace this timeout with a real POST to your provider
    // (Buttondown / Mailchimp / ConvertKit / Resend) once one is connected.
    setTimeout(() => {
      button.disabled = false;
      status.textContent = 'Signups aren\u2019t connected to a provider yet \u2014 this form is ready to wire up, but nothing was sent.';
      status.dataset.state = 'info';
    }, 600);
  });
})();
