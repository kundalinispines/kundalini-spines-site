import React from 'react';

const KS_BTN_BASE = {
  display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)',
  fontFamily: 'var(--font-label)', fontWeight: 600, fontSize: 'var(--fs-label)',
  letterSpacing: 'var(--tracking-label)', textTransform: 'uppercase',
  textDecoration: 'none', padding: 'var(--space-3) var(--space-6)',
  border: '1px solid var(--color-white)', borderRadius: 'var(--radius-sharp)',
  background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer',
  transition: 'background var(--motion-fast) var(--ease-standard), color var(--motion-fast) var(--ease-standard), border-color var(--motion-fast) var(--ease-standard)'
};

const ksBtnVariants = {
  primary: { background: 'var(--color-white)', color: 'var(--color-black)' },
  ghost: { background: 'transparent', color: 'var(--text-primary)' },
  text: { background: 'transparent', color: 'var(--text-primary)', border: '1px solid transparent', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-gray-600)' }
};

const ksBtnHover = {
  primary: { background: 'var(--color-bone)', borderColor: 'var(--color-bone)', color: 'var(--color-black)' },
  ghost: { background: 'var(--color-white)', color: 'var(--color-black)' },
  text: { borderBottomColor: 'var(--color-bone)' }
};

const ksBtnSizes = {
  sm: { fontSize: '0.78rem', padding: '0.55rem 0.9rem' },
  md: {},
  lg: { fontSize: '1.05rem', padding: 'var(--space-4) var(--space-8)' }
};

export function Button({ variant = 'primary', size = 'md', href, disabled = false, children, style, ...rest }) {
  const [hover, setHover] = React.useState(false);
  const composed = {
    ...KS_BTN_BASE,
    ...ksBtnVariants[variant],
    ...ksBtnSizes[size],
    ...(hover && !disabled ? ksBtnHover[variant] : null),
    ...(disabled ? { opacity: 0.4, cursor: 'not-allowed', pointerEvents: 'none' } : null),
    ...style
  };
  const Tag = href ? 'a' : 'button';
  const tagProps = href ? { href } : { type: 'button', disabled };
  return (
    <Tag {...tagProps} style={composed} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} {...rest}>{children}</Tag>
  );
}
