import React from 'react';

export function FeatureHead({ num, children, style }) {
  return (
    <div style={{ display:'flex', alignItems:'baseline', gap:'18px', borderBottom:'1px solid var(--border-subtle)', paddingBottom:'var(--space-3)', marginBottom:'clamp(24px, 4vh, 40px)', ...style }}>
      {num ? <span style={{ fontFamily:'var(--font-mono)', fontSize:'var(--fs-mono)', letterSpacing:'0.14em', color:'var(--color-crimson-lit)', textShadow:'0 0 3px rgba(3,4,15,0.98), 0 1px 2px rgba(3,4,15,0.92)' }}>{num}</span> : null}
      <h2 style={{ margin:0, fontFamily:'var(--font-mag)', fontWeight:400, textTransform:'uppercase', letterSpacing:0, fontSize:'clamp(1.9rem, 4.6vw, 3.6rem)', lineHeight:1, color:'var(--text-primary)', textShadow:'0 0 3px rgba(3,4,15,0.98), 0 1px 2px rgba(3,4,15,0.92)' }}>{children}</h2>
    </div>
  );
}
