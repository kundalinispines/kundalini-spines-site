import React from 'react';

export function TerminalRow({ time, channel, title, open = false, onToggle, children, style }) {
  const [hover, setHover] = React.useState(false);
  const lit = hover || open;
  return (
    <li style={{ borderLeft: '2px solid ' + (lit ? 'var(--color-bone)' : 'var(--color-gray-700)'), background: lit ? 'rgba(255,255,255,.045)' : 'rgba(255,255,255,.012)', transition: 'background var(--motion-fast) ease, border-color var(--motion-fast) ease', listStyle: 'none', ...style }}
        onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <button type="button" onClick={onToggle} aria-expanded={open}
        style={{ width: '100%', display: 'grid', gridTemplateColumns: '132px 96px minmax(0,1fr) auto', gap: 'var(--space-4)', alignItems: 'center', padding: 'var(--space-3)', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', color: 'inherit', font: 'inherit' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.06em', color: 'var(--color-gray-400)', whiteSpace: 'nowrap' }}>{time}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', letterSpacing: 'var(--tracking-label)', textTransform: 'uppercase', color: 'var(--color-bone)' }}>{channel}</span>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.95rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{title}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: lit ? 'var(--text-primary)' : 'var(--color-gray-500)', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform var(--motion-fast) ease, color var(--motion-fast) ease' }}>&gt;</span>
      </button>
      {open ? <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,320px) minmax(0,1fr)', gap: 'var(--space-6)', padding: '0 var(--space-3) var(--space-6) calc(132px + var(--space-4) + var(--space-3))' }}>{children}</div> : null}
    </li>
  );
}
