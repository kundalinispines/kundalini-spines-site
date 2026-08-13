import React from 'react';
import { Button } from '../core/Button.jsx';
import { FormField } from './FormField.jsx';

export function NewsletterForm({ action = 'https://buttondown.com/api/emails/embed-subscribe/kundalinispines', status, statusState = 'info', privacy = 'No spam. Unsubscribe anytime. Your email is never sold or shared.', onSubmit, style }) {
  const statusColors = { error: 'var(--color-crimson-lit)', info: 'var(--text-secondary)', success: 'var(--text-secondary)' };
  return (
    <div style={{ maxWidth: '56ch', marginInline: 'auto', textAlign: 'center', ...style }}>
      <form action={action} method="post" noValidate onSubmit={onSubmit}
        style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)', flexWrap: 'wrap', justifyContent: 'center' }}>
        <FormField id="newsletter-email" label="Email address" hideLabel type="email" placeholder="you@email.com" style={{ flex: '1 1 260px' }} />
        <Button variant="primary">Join the Signal</Button>
      </form>
      <p style={{ marginTop: 'var(--space-3)', marginBottom: 0, fontSize: 'var(--fs-caption)', color: 'var(--text-muted)' }}>{privacy}</p>
      <p style={{ marginTop: 'var(--space-4)', marginBottom: 0, fontSize: 'var(--fs-caption)', minHeight: '1.2em', color: statusColors[statusState] }}>{status}</p>
    </div>
  );
}
