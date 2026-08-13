import React from 'react';
import { Label } from '../core/Label.jsx';

export function MessengerCard({ portrait, archetype, bio, alt = '', style }) {
  return (
    <article style={{ display: 'grid', gap: 'var(--space-4)', ...style }}>
      <div style={{ aspectRatio: '4 / 5', overflow: 'hidden', background: 'var(--bg-surface)' }}>
        <img src={portrait} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <div>
        <Label block style={{ marginBottom: 'var(--space-1)' }}>{archetype}</Label>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-body)', margin: 0 }}>{bio}</p>
      </div>
    </article>
  );
}
