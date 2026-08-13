import React from 'react';

export function FilterChip({ active = false, children, onClick, style, ...rest }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button type="button" aria-pressed={active} onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-mono)',
        letterSpacing: 'var(--tracking-label)', textTransform: 'uppercase',
        background: active ? 'var(--color-white)' : 'transparent',
        color: active ? 'var(--color-black)' : (hover ? 'var(--text-primary)' : 'var(--text-secondary)'),
        border: '1px solid ' + (active ? 'var(--color-white)' : (hover ? 'var(--text-primary)' : 'var(--border-subtle)')),
        padding: 'var(--space-2) var(--space-4)', cursor: 'pointer',
        transition: 'border-color var(--motion-fast) var(--ease-standard), color var(--motion-fast) var(--ease-standard), background var(--motion-fast) var(--ease-standard)',
        ...style
      }} {...rest}>{children}</button>
  );
}
