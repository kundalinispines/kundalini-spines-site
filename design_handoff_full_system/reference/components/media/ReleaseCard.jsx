import React from 'react';
import { Label } from '../core/Label.jsx';

export function ReleaseCard({ artwork, label, title, description, footer, style }) {
  return (
    <article style={{ border: 'var(--border-hairline)', overflow: 'hidden', ...style }}>
      <div style={{ aspectRatio: '1 / 1', overflow: 'hidden' }}>
        <img src={artwork} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <div style={{ padding: 'var(--space-4)' }}>
        {label ? <Label block style={{ marginBottom: 'var(--space-1)' }}>{label}</Label> : null}
        <h3 style={{ fontSize: 'var(--fs-h3)', margin: '0 0 var(--space-2)', fontFamily: 'var(--font-display)', fontWeight: 'var(--display-wght)', fontVariationSettings: '"wdth" 72, "wght" 750', textTransform: 'uppercase', letterSpacing: 'var(--tracking-heading)' }}>{title}</h3>
        {description ? <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-body)', margin: '0 0 var(--space-3)' }}>{description}</p> : null}
        {footer}
      </div>
    </article>
  );
}
