import React from 'react';
import { Label } from '../core/Label.jsx';

export function FeaturedBlock({ media, label, title, children, alt = '', ratio = '4 / 5', reverse = false, style }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: reverse ? '1fr minmax(240px, 380px)' : 'minmax(240px, 380px) 1fr', gap: 'var(--space-12)', alignItems: 'center', ...style }}>
      <div style={{ aspectRatio: ratio, background: 'var(--bg-surface)', overflow: 'hidden', border: 'var(--border-hairline)', order: reverse ? 2 : 1 }}>
        <img src={media} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <div style={{ order: reverse ? 1 : 2 }}>
        {label ? <Label block style={{ marginBottom: 'var(--space-3)' }}>{label}</Label> : null}
        {title ? <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--fs-h1)', letterSpacing: 'var(--tracking-display)', margin: '0 0 var(--space-4)' }}>{title}</h2> : null}
        <div style={{ color: 'var(--text-secondary)' }}>{children}</div>
      </div>
    </div>
  );
}
