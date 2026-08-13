import React from 'react';

const KS_FOOT_LINK = {
  textDecoration: 'none', fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-mono)',
  letterSpacing: 'var(--tracking-label)', textTransform: 'uppercase', color: 'var(--text-secondary)'
};

export function Footer({ variant = 'full', links = [], social = [], tagline = 'Knowledge Hidden in Plain Sight', copyright = '(c) 2026 Kundalini Spines. All rights reserved.', markSrc = 'assets/marks/spine-mark.svg', style }) {
  return (
    <footer className="container" style={{ borderTop: 'var(--border-hairline)', paddingBlock: 'var(--space-12)', ...style }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 'var(--space-8)', alignItems: variant === 'simple' ? 'center' : 'flex-start' }}>
        {variant === 'simple' ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
              {markSrc ? <img src={markSrc} alt="" width="16" height="16" /> : null}KUNDALINI SPINES
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-caption)', marginTop: 'var(--space-1)', marginBottom: 0 }}>{tagline}</p>
          </div>
        ) : (
          <ul style={{ display: 'flex', gap: 'var(--space-6)', listStyle: 'none', margin: 0, padding: 0, flexWrap: 'wrap' }}>
            {links.map((l) => <li key={l.label}><a href={l.href} style={KS_FOOT_LINK}>{l.label}</a></li>)}
          </ul>
        )}
        <ul style={{ display: 'flex', gap: 'var(--space-6)', listStyle: 'none', margin: 0, padding: 0, flexWrap: 'wrap' }}>
          {social.map((s) => (
            <li key={s.label}>
              <a href={s.href || '#'} style={{ ...KS_FOOT_LINK, opacity: s.href ? 1 : 0.45 }} title={s.href ? undefined : 'No account yet'}>{s.label}</a>
            </li>
          ))}
        </ul>
        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-caption)', width: '100%', marginTop: 'var(--space-8)', marginBottom: 0 }}>{copyright}</p>
      </div>
    </footer>
  );
}
