import React from 'react';
import { Label } from '../core/Label.jsx';

export function ArchiveCard({ media, category, title, description, href = '#', alt = '', style }) {
  const [hover, setHover] = React.useState(false);
  return (
    <a href={href} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ textDecoration: 'none', color: 'var(--text-primary)', display: 'block', ...style }}>
      <div style={{ aspectRatio: '4 / 3', overflow: 'hidden', border: 'var(--border-hairline)', marginBottom: 'var(--space-3)' }}>
        <img src={media} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: hover ? 'scale(1.03)' : 'scale(1)', transition: 'transform var(--motion-slow) var(--ease-standard)' }} />
      </div>
      <Label block>{category}</Label>
      <h3 style={{ fontSize: 'var(--fs-h3)', margin: 'var(--space-1) 0', fontFamily: 'var(--font-display)', fontWeight: 'var(--display-wght)', fontVariationSettings: '"wdth" 72, "wght" 750', textTransform: 'uppercase', letterSpacing: 'var(--tracking-heading)' }}>{title}</h3>
      <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{description}</p>
    </a>
  );
}
