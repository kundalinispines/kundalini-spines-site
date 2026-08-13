import React from 'react';
import { Label } from './Label.jsx';

export function SectionHeader({ eyebrow, title, description, stencil = false, align = 'left', level = 2, style }) {
  const H = 'h' + level;
  return (
    <div style={{ marginBottom: 'var(--space-8)', maxWidth: align === 'center' ? 'none' : '60ch', textAlign: align, ...style }}>
      {eyebrow ? <Label block style={{ marginBottom: 'var(--space-2)' }}>{eyebrow}</Label> : null}
      <H style={{
        fontFamily: stencil ? 'var(--font-showcase)' : 'var(--font-display)',
        fontWeight: 700, letterSpacing: 'var(--tracking-display)',
        lineHeight: 'var(--lh-heading)', margin: '0 0 var(--space-2)',
        fontSize: level === 1 ? 'var(--fs-h1)' : 'var(--fs-h1)',
        textShadow: stencil ? '1px 1px 0 rgba(0,0,0,.5), -.5px -.5px 0 rgba(228,232,235,.06)' : 'none'
      }}>{title}</H>
      {description ? <p style={{ color: 'var(--text-secondary)', margin: 0, marginInline: align === 'center' ? 'auto' : 0 }}>{description}</p> : null}
    </div>
  );
}
