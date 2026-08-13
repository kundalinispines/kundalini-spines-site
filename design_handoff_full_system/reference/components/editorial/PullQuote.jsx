import React from 'react';

export function PullQuote({ variant = 'pull', children, style }) {
  const base = { margin:0, maxWidth:'none', fontFamily:'var(--font-mag)', fontWeight:400, textTransform:'uppercase', color:'var(--text-primary)', lineHeight:1.08, textShadow:'0 0 3px rgba(3,4,15,0.98), 0 1px 2px rgba(3,4,15,0.92)' };
  const variants = {
    pull:  { ...base, marginBottom:'1.35em', paddingLeft:'var(--space-6)', borderLeft:'2px solid rgba(214,213,208,0.34)', fontSize:'clamp(1.6rem, 3.4vw, 2.5rem)' },
    shout: { ...base, fontSize:'clamp(1.5rem, 2.8vw, 2.2rem)' },
    signoff: { ...base, fontSize:'clamp(2.2rem, 7vw, 5.5rem)', lineHeight:0.94 }
  };
  return <p style={{ ...variants[variant], ...style }}>{children}</p>;
}
