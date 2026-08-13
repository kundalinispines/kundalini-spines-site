import React from 'react';
import { Label } from '../core/Label.jsx';

export function EntryCard({ label, title, description, href = '#', style }) {
  const [hover, setHover] = React.useState(false);
  return (
    <a href={href} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        border: '1px solid ' + (hover ? 'var(--text-primary)' : 'var(--border-subtle)'),
        background: hover ? 'var(--bg-surface)' : 'transparent',
        padding: 'var(--space-8)', textDecoration: 'none', color: 'var(--text-primary)', display: 'block',
        transition: 'border-color var(--motion-fast) var(--ease-standard), background var(--motion-fast) var(--ease-standard)',
        ...style
      }}>
      <Label block style={{ marginBottom: 'var(--space-2)' }}>{label}</Label>
      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--fs-h2)', margin: '0 0 var(--space-2)', letterSpacing: 'var(--tracking-display)' }}>{title}</h3>
      <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{description}</p>
    </a>
  );
}
