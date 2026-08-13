import React from 'react';

// The reading surface. Frosted glass, lit on the edge nearest the spine, with
// two ghost frames behind it building the "emergence from the spine" depth.
export function SpineCard({ index, total, flag = 'ACTIVE', eyebrow, title, cta, onCta, side = 'right', open = true, onClose, children, style }) {
  const litSx = side === 'left' ? -1 : 1;   // inset shadow sign is the OPPOSITE of the position sign
  const litX = side === 'left' ? 1 : -1;
  const px = (n) => (litSx * n) + 'px';
  return (
    <div style={{
      position:'relative', zIndex:25, width:'var(--card-w)', maxWidth:'calc(100vw - 2 * var(--space-6))',
      background:'linear-gradient(155deg, rgba(228,232,235,0.06), rgba(228,232,235,0) 42%), var(--card-bg-solid)',
      WebkitBackdropFilter:'blur(var(--card-blur)) saturate(1.1)', backdropFilter:'blur(var(--card-blur)) saturate(1.1)',
      border:'1px solid var(--card-border-lit)',
      [side === 'left' ? 'borderLeftColor' : 'borderRightColor']:'var(--card-border)',
      boxShadow:'inset 0 1px 0 rgba(228,232,235,0.10), 0 24px 60px rgba(0,0,0,0.5)',
      padding:'var(--space-6)', display:'flex', flexDirection:'column',
      // NEVER TALLER THAN THE WINDOW. The 114px budget is what the source's
      // positionCard clamp assumes (90px top floor + 24px above the stage edge).
      // THE SCROLL LIVES ON THE BODY, NOT ON THE CARD: the ghost frames are
      // transformed absolute descendants and count as scrollable overflow, so a
      // card that scrolls itself grows a phantom 13px scrollbar.
      maxHeight:'calc(100vh - 114px)',
      opacity: open ? 1 : 0, transform: open ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.965)',
      transition:'opacity var(--card-enter-ms) var(--ease-standard), transform var(--card-enter-ms) var(--ease-standard)',
      ...style
    }}>
      <span aria-hidden="true" style={{
        position:'absolute', inset:0, zIndex:0, pointerEvents:'none',
        backgroundImage:
          'linear-gradient(to ' + (side === 'left' ? 'left' : 'right') + ', rgba(var(--node-color), calc(var(--glass-chroma) * 0.22)) 0px, transparent 4px),' +
          'radial-gradient(130% 100% at calc(50% + ' + litX + ' * 50%) var(--glass-sheen-y), rgba(255,255,255,var(--glass-sheen)) 0%, transparent 62%)',
        boxShadow:
          'inset ' + px(2) + ' 0 0 0 rgba(255,255,255,var(--glass-rim)),' +
          'inset ' + px(24) + ' 0 36px -16px rgba(255,255,255,calc(var(--glass-rim) * 0.5)),' +
          'inset ' + px(-20) + ' 0 26px -20px rgba(0,0,0,var(--glass-dark)),' +
          'inset 0 2px 0 0 rgba(255,255,255,calc(var(--glass-rim) * 0.35))'
      }} />
      {onClose ? (
        <button type="button" onClick={onClose} aria-label="Close" style={{ position:'absolute', top:'10px', right:'10px', width:'30px', height:'30px', lineHeight:1, zIndex:1, background:'rgba(3,4,15,0.55)', border:'1px solid rgba(214,213,208,0.38)', color:'var(--color-bone)', cursor:'pointer', fontSize:'16px' }}>&times;</button>
      ) : null}
      <div style={{ position:'relative', zIndex:1, display:'flex', alignItems:'baseline', justifyContent:'space-between', gap:'var(--space-4)', marginBottom:'var(--space-3)', paddingRight:'34px' }}>
        <span style={{ fontFamily:'var(--font-mono)', fontSize:'var(--fs-mono)', letterSpacing:'var(--tracking-label)', color:'var(--color-gray-400)' }}>{String(index).padStart(2,'0')} / {String(total).padStart(2,'0')}</span>
        <span style={{ fontFamily:'var(--font-mono)', fontSize:'10px', letterSpacing:'0.18em', textTransform:'uppercase', color:'var(--color-bone)', border:'1px solid var(--border-subtle)', padding:'2px 7px' }}>{flag}</span>
      </div>
      <div style={{ position:'relative', zIndex:1 }}>
        {eyebrow ? <span className="label" style={{ display:'block', marginBottom:'var(--space-2)' }}>{eyebrow}</span> : null}
        <h3 style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:'var(--fs-h2)', lineHeight:'var(--lh-heading)', letterSpacing:'var(--tracking-display)', margin:'0 0 var(--space-3)', color:'var(--text-primary)' }}>{title}</h3>
        <div style={{ width:'34px', height:'2px', background:'var(--color-bone)', margin:'0 0 var(--space-4)', opacity:0.7 }} />
      </div>
      <div style={{ position:'relative', zIndex:1, overflowY:'auto', minHeight:0, fontFamily:'var(--font-body)', fontSize:'var(--fs-body)', lineHeight:'var(--lh-body)', color:'var(--text-secondary)' }}>{children}</div>
      {cta ? (
        <a href="#" onClick={e => { e.preventDefault(); if (onCta) onCta(); }} style={{ position:'relative', zIndex:1, display:'inline-flex', alignItems:'center', gap:'8px', marginTop:'var(--space-4)', fontFamily:'var(--font-mono)', fontSize:'var(--fs-mono)', letterSpacing:'var(--tracking-label)', textTransform:'uppercase', color:'var(--text-primary)', textDecoration:'none' }}>{cta} <span>&rarr;</span></a>
      ) : null}
    </div>
  );
}
