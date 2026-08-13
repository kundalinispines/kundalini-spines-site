import React from 'react';

export function ChannelTab({ selected = false, count, children, onClick, style }) {
  const [hover, setHover] = React.useState(false);
  const empty = count === 0;
  return (
    <button type="button" role="tab" aria-selected={selected} onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        // A channel tab is interface, not data — label face, not the readout mono.
        fontFamily: 'var(--font-label)', fontWeight: 600, fontSize: 'var(--fs-label)', letterSpacing: 'var(--tracking-label)', textTransform: 'uppercase',
        background: 'none', border: 'none', borderBottom: '2px solid ' + (selected ? 'var(--color-crimson-lit)' : 'transparent'),
        color: selected || hover ? 'var(--text-primary)' : (empty ? 'var(--color-gray-500)' : 'var(--color-gray-400)'),
        padding: '8px 14px', cursor: 'pointer',
        transition: 'color var(--motion-fast) ease, border-color var(--motion-fast) ease',
        ...style
      }}>{children}</button>
  );
}
