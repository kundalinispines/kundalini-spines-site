import React from 'react';

export function SpineHint({ children = 'Click to open', hidden = false, align = 'center', style }) {
  return (
    <p className="label" style={{
      position:'absolute', bottom:'var(--space-6)', zIndex:30, margin:0, pointerEvents:'none',
      color:'var(--color-gray-400)', opacity: hidden ? 0 : 1,
      transition:'opacity var(--motion-slow) var(--ease-standard)',
      ...(align === 'center'
        ? { left:'calc(50% + var(--axis-shift))', transform:'translateX(-50%)', textAlign:'center' }
        : { left:'var(--space-6)', textAlign:'left', maxWidth:'calc(100vw - 2 * var(--space-6))' }),
      ...style
    }}>{children}</p>
  );
}
