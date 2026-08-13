import React from 'react';

// The central axis: anatomical wireframe column, luminous cord, schematic end
// markers, and the rising comet. Everything positions against --axis-shift so
// there is one source of truth for where the axis is.
export function SpineRail({ wireSrc = 'assets/hero/spine-ui-wire.webp', markers = true, startLabel = 'START', startSub = 'ENTRY', endLabel = 'CONTINUE', endSub = 'ARROW KEYS', points = [], children, style }) {
  return (
    <div style={{ position:'absolute', top:0, bottom:0, left:'calc(50% + var(--axis-shift))', width:'2px', transform:'translateX(-50%)', zIndex:10, opacity:'var(--spine-ui-opacity)', ...style }}>
      <div style={{
        position:'absolute', top:'5%', bottom:'5%', left:'50%', width:'var(--spine-anat-w)',
        transform:'translateX(-50%)', overflow:'hidden',
        backgroundImage:'url("' + wireSrc + '")', backgroundRepeat:'no-repeat',
        backgroundPosition:'center center', backgroundSize:'auto 100%',
        opacity:'var(--spine-anat-opacity)',
        filter:'saturate(var(--spine-anat-sat)) brightness(var(--spine-anat-bright)) contrast(var(--spine-anat-contrast))',
        WebkitMaskImage:'linear-gradient(180deg, transparent, #000 9%, #000 91%, transparent)',
        maskImage:'linear-gradient(180deg, transparent, #000 9%, #000 91%, transparent)'
      }} />
      <div style={{
        position:'absolute', top:'6%', bottom:'6%', left:'50%', width:'1px', transform:'translateX(-50%)',
        background:'linear-gradient(180deg, transparent, rgba(228,232,235,0.5) 12%, rgba(228,232,235,0.5) 88%, transparent)',
        filter:'drop-shadow(0 0 4px rgba(228,232,235,0.45))', opacity:'var(--cord-opacity)'
      }} />
      {points.map((y, i) => (
        <span key={i} style={{ position:'absolute', left:0, top:y, width:'var(--point-size)', height:'var(--point-size)', transform:'translate(-50%,-50%)', borderRadius:'50%', background:'rgba(228,232,235,0.8)', boxShadow:'0 0 4px rgba(228,232,235,0.35)', opacity:'var(--point-idle)' }} />
      ))}
      {markers ? (
        <>
          <div style={{ position:'absolute', left:'50%', transform:'translateX(-50%)', top:'1.5%', textAlign:'center', whiteSpace:'nowrap', fontFamily:'var(--font-mono)', fontSize:'10px', letterSpacing:'0.18em', textTransform:'uppercase', color:'var(--color-gray-500)' }}>
            {startLabel}<span style={{ display:'block', color:'var(--color-gray-400)' }}>{startSub}</span>
            <i style={{ display:'block', margin:'6px auto 0', width:'1px', height:'22px', background:'linear-gradient(180deg, transparent, rgba(214,213,208,0.35))' }} />
          </div>
          <div style={{ position:'absolute', left:'50%', transform:'translateX(-50%)', bottom:'1.5%', textAlign:'center', whiteSpace:'nowrap', fontFamily:'var(--font-mono)', fontSize:'10px', letterSpacing:'0.18em', textTransform:'uppercase', color:'var(--color-gray-500)' }}>
            <i style={{ display:'block', margin:'0 auto 6px', width:'1px', height:'22px', background:'linear-gradient(180deg, rgba(214,213,208,0.35), transparent)' }} />
            {endLabel}<span style={{ display:'block', color:'var(--color-gray-400)' }}>{endSub}</span>
          </div>
        </>
      ) : null}
      <div style={{ position:'absolute', inset:0, left:0, width:0, zIndex:20 }}>{children}</div>
    </div>
  );
}
