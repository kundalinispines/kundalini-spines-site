import React from 'react';

// The About page's scroll-revealed opener: parallax photograph, halftone, scrim,
// and a headline whose words wipe up out of their own crops.
export function Masthead({ eyebrow, words = [], standfirst, media, alt = '', cue = 'Scroll', style }) {
  return (
    <div style={{ position:'relative', height:'100vh', overflow:'hidden', display:'flex', flexDirection:'column', justifyContent:'flex-end', ...style }}>
      <div style={{ position:'absolute', left:0, right:0, top:'-4%', bottom:'-24%' }}>
        <img src={media} alt={alt} style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center 46%', filter:'grayscale(0.42) contrast(1.16) brightness(0.58)' }} />
      </div>
      <div aria-hidden="true" style={{ position:'absolute', inset:0, pointerEvents:'none', mixBlendMode:'multiply', opacity:0.45, backgroundImage:'radial-gradient(circle, rgba(0,0,0,0.9) 0.9px, transparent 1.1px)', backgroundSize:'4px 4px' }} />
      <div aria-hidden="true" style={{ position:'absolute', inset:0, background:'linear-gradient(180deg, rgba(3,4,15,0.90) 0%, rgba(3,4,15,0.12) 30%, rgba(3,4,15,0.50) 62%, rgba(3,4,15,0.93) 90%, #03040F 100%)' }} />
      <div style={{ position:'relative', zIndex:2, width:'100%', maxWidth:'var(--container-max)', marginInline:'auto', padding:'0 var(--container-pad) clamp(44px, 8vh, 96px)', display:'flex', flexDirection:'column', gap:'clamp(14px, 2.2vh, 26px)' }}>
        {eyebrow ? (
          <div style={{ display:'flex', alignItems:'center', gap:'var(--space-4)' }}>
            <span style={{ display:'block', width:'clamp(28px, 6vw, 72px)', height:'1px', background:'var(--color-crimson-lit)' }} />
            <span className="label" style={{ textShadow:'0 0 3px rgba(3,4,15,0.98), 0 1px 2px rgba(3,4,15,0.92)' }}>{eyebrow}</span>
          </div>
        ) : null}
        <h1 style={{ margin:0, display:'flex', flexDirection:'column' }}>
          {words.map(w => (
            <span key={w} style={{ display:'block', overflow:'hidden' }}>
              <span style={{ display:'block', fontFamily:'var(--font-mag)', fontWeight:400, textTransform:'uppercase', fontSize:'clamp(3.4rem, 13.5vw, 11.5rem)', lineHeight:0.92, letterSpacing:'-0.005em', color:'var(--text-primary)', textShadow:'0 0 3px rgba(3,4,15,0.98), 0 1px 2px rgba(3,4,15,0.92)' }}>{w}</span>
            </span>
          ))}
        </h1>
        {standfirst ? (
          <div style={{ borderTop:'1px solid var(--border-subtle)', paddingTop:'clamp(14px, 2.2vh, 24px)', maxWidth:'1000px' }}>
            <p style={{ margin:0, maxWidth:'62ch', fontFamily:'var(--font-display)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.02em', fontSize:'clamp(1.05rem, 1.8vw, 1.6rem)', lineHeight:1.25, color:'var(--text-secondary)', textShadow:'0 0 3px rgba(3,4,15,0.98), 0 1px 2px rgba(3,4,15,0.92)' }}>{standfirst}</p>
          </div>
        ) : null}
      </div>
      {cue ? <span className="label" style={{ position:'absolute', left:'50%', bottom:'clamp(14px, 2.4vh, 26px)', transform:'translateX(-50%)', zIndex:2, letterSpacing:'0.2em', color:'var(--text-secondary)' }}>{cue}</span> : null}
    </div>
  );
}
