import React from 'react';

// A destination on the column. Idle: an amber-cored light point with a thin
// static ring that says "real destination" rather than "ambience dot". Hover
// and active add the crosshair reticle and the two ripple rings.
export function SpineNode({ label, kind = 'card', side = 'right', y, state = 'idle', onClick, style }) {
  const focused = state === 'hover' || state === 'active';
  const active = state === 'active';
  const ringSize = active ? 'var(--node-ring-active)' : 'var(--node-ring)';
  return (
    <button type="button" onClick={onClick} aria-label={label}
      style={{
        position:'absolute', left:0, top: y, transform:'translate(-50%,-50%)',
        width:'var(--node-size)', height:'var(--node-size)', padding:0, margin:0,
        background:'transparent', border:0, cursor:'pointer', color:'var(--text-primary)',
        transition:'opacity var(--motion-base) var(--ease-standard)', ...style
      }}>
      <span style={{
        position:'absolute', inset:0, borderRadius:'50%',
        background:'radial-gradient(circle, #fff 0%, #fff 30%, rgba(var(--node-color),0.6) 60%, transparent 74%)',
        opacity: focused ? 1 : 'var(--node-idle-opacity)',
        transform: active ? 'scale(1.3)' : (focused ? 'scale(1.15)' : 'scale(1)'),
        boxShadow: focused
          ? '0 0 18px rgba(var(--node-color),0.85), 0 0 6px rgba(255,255,255,0.95)'
          : '0 0 var(--node-glow) rgba(var(--node-color), var(--node-glow-a)), 0 0 2px rgba(255,255,255, var(--node-core-a))',
        transition:'opacity var(--motion-base) var(--ease-standard), box-shadow var(--motion-base) var(--ease-standard), transform var(--motion-base) var(--ease-standard)'
      }}>
        <span style={{
          position:'absolute', top:'50%', left:'50%', width:'var(--node-mark-size)', height:'var(--node-mark-size)',
          transform:'translate(-50%,-50%)', borderRadius:'50%',
          border: (kind === 'immersive' ? '2px double' : '1px solid') + ' rgba(228,232,235, var(--node-mark-a))'
        }} />
      </span>
      {[0, 1].map(i => (
        <span key={i} style={{
          position:'absolute', top:'50%', left:'50%', width: ringSize, height: ringSize,
          transform:'translate(-50%,-50%) scale(0.4)', borderRadius:'50%',
          border:'1px solid rgba(var(--node-color), ' + (active ? '0.7' : '0.55') + ')',
          background:'radial-gradient(circle, transparent 58%, rgba(var(--node-color),0.14) 100%)',
          boxShadow: active ? '0 0 22px rgba(var(--node-color),0.45)' : '0 0 14px rgba(var(--node-color),0.35)',
          opacity: focused ? 1 : 0, pointerEvents:'none'
        }} />
      ))}
      <span style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', opacity: focused ? 1 : 0, pointerEvents:'none', transition:'opacity var(--motion-base) var(--ease-standard)' }}>
        <span style={{
          position:'absolute', top:'50%', left:'50%', width:'var(--reticle-w)', height:'1px',
          transform:'translate(-50%,-50%) scaleX(' + (active ? 1 : 0.62) + ')',
          background:'linear-gradient(90deg, transparent, rgba(228,232,235,0.85) 12%, rgba(228,232,235,0.85) 88%, transparent)',
          filter:'drop-shadow(0 0 3px rgba(228,232,235,0.6))',
          transition:'transform var(--motion-base) var(--ease-standard)'
        }} />
        {['l','r'].map(sq => (
          <span key={sq} style={{
            position:'absolute', top:'50%', width:'5px', height:'5px', marginTop:'-2.5px',
            border:'1px solid rgba(228,232,235,0.7)', background:'rgba(3,4,15,0.4)',
            left: sq === 'l' ? 'calc(50% - var(--reticle-w) / 2 - 2.5px)' : 'calc(50% + var(--reticle-w) / 2 - 2.5px)'
          }} />
        ))}
      </span>
      <span style={{
        position:'absolute', top:'50%', transform:'translateY(-50%)', whiteSpace:'nowrap', pointerEvents:'none',
        fontFamily:'var(--font-mono)', fontSize:'var(--fs-mono)', letterSpacing:'var(--tracking-label)',
        textTransform:'uppercase', color:'var(--text-primary)',
        textShadow:'0 0 6px rgba(3,4,15,0.95), 0 0 12px rgba(3,4,15,0.9), 0 1px 2px rgba(3,4,15,1)',
        opacity: state === 'hover' ? 1 : 0,
        transition:'opacity var(--motion-base) var(--ease-standard)',
        ...(side === 'left'
          ? { right:'var(--node-label-offset)', textAlign:'right' }
          : { left:'var(--node-label-offset)', textAlign:'left' })
      }}>
        {label}
        <span style={{ display:'block', fontSize:'10px', letterSpacing:'0.16em', color:'var(--color-gray-300)', marginTop:'3px' }}>{kind === 'immersive' ? 'IMMERSIVE' : 'CARD'}</span>
      </span>
    </button>
  );
}
