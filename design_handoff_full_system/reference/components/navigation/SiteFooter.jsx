import React from 'react';
import { ChakraReadout, KS_CHAKRAS } from '../brand/ChakraReadout.jsx';

// The instrument footer. Four link columns, an instrument band beside them (never
// around them), the cropped outline wordmark, and a seal line.
export function SiteFooter({ columns = [], instrument = [], blurb, wordmark = 'KUNDALINI SPINES', copyright = '(c) 2026 Kundalini Spines. All rights reserved.', seal = 'KS \u2014 SIGNAL ARCHIVE', style }) {
  return (
    <footer style={{ borderTop:'var(--border-hairline)', position:'relative', overflow:'hidden', paddingBlock:0, ...style }}>
      <div style={{ position:'relative', minHeight:'480px', display:'flex', flexDirection:'column', padding:'48px 0 0' }}>
        <div style={{ position:'relative', zIndex:2, display:'grid', gridTemplateColumns:'1.4fr 1fr 1fr 1fr', gap:'32px', paddingInline:'var(--space-6)' }}>
          {columns.map((col, i) => (
            <div key={col.head}>
              <p style={ i === 0
                ? { fontFamily:'var(--font-display)', fontSize:'22px', fontWeight:800, letterSpacing:'0.02em', color:'var(--text-primary)', margin:'0 0 16px' }
                : { fontFamily:'var(--font-mono)', fontSize:'10px', fontWeight:500, letterSpacing:'0.22em', textTransform:'uppercase', color:'var(--color-bone)', margin:'0 0 16px' }
              }>{col.head}</p>
              {i === 0 && blurb ? <p style={{ fontFamily:'var(--font-body)', fontSize:'var(--fs-caption)', color:'var(--text-muted)', maxWidth:'30ch', margin:0 }}>{blurb}</p> : null}
              <ul style={{ listStyle:'none', margin:0, padding:0 }}>
                {(col.rows || []).map(r => (
                  <li key={r.label} style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', gap:'16px', padding:'5px 0', borderBottom:'1px solid rgba(214,213,208,0.07)' }}>
                    {r.href ? (
                      <a href={r.href} style={{ fontFamily:'var(--font-mono)', fontSize:'var(--fs-mono)', letterSpacing:'var(--tracking-label)', textTransform:'uppercase', textDecoration:'none', color:'var(--text-secondary)' }}>{r.label}</a>
                    ) : (
                      <span style={{ fontFamily:'var(--font-mono)', fontSize:'var(--fs-mono)', letterSpacing:'var(--tracking-label)', textTransform:'uppercase', color:'var(--text-muted)' }}>{r.label}</span>
                    )}
                    <span style={ r.href
                      ? { fontFamily:'var(--font-mono)', fontSize:'9px', letterSpacing:'0.18em', padding:'2px 6px', whiteSpace:'nowrap', color:'rgba(var(--node-color),0.75)', border:'1px solid rgba(var(--node-color),0.28)' }
                      : { fontFamily:'var(--font-mono)', fontSize:'9px', letterSpacing:'0.18em', padding:'2px 6px', whiteSpace:'nowrap', color:'var(--color-bone)', border:'1px solid rgba(214,213,208,0.16)', textShadow:'0 0 3px rgba(3,4,15,0.98), 0 1px 2px rgba(3,4,15,0.92)' }
                    }>{r.href ? 'OPEN' : 'STANDBY'}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{ position:'relative', zIndex:2, display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'32px', marginTop:'32px', padding:'20px var(--space-6) 0', borderTop:'1px solid rgba(214,213,208,0.07)', opacity:1 }}>
          {(instrument.length ? instrument : [
            { head:'RECORD', rows:[['TITLE','RISE UP'],['YEAR','2026'],['TRACKS','28'],['RUNTIME','1:50:55']] },
            { head:'GEOMETRY', rows:[['METATRON','10'],['VIGNETTE','9'],['VESICA','9']] },
            { head:'CALIBRATION', rows: KS_CHAKRAS.slice(0,4).map(c => [c.name, c.hz + ' Hz']) },
            { head:'', rows: KS_CHAKRAS.slice(4).map(c => [c.name, c.hz + ' Hz']) }
          ]).map((b, i) => <ChakraReadout key={i} head={b.head} rows={b.rows} />)}
        </div>

        <div style={{ position:'relative', zIndex:1, marginTop:'auto', width:'100%', overflow:'hidden' }}>
          <svg viewBox="0 0 1000 150" style={{ display:'block', width:'100%', height:'auto' }} aria-hidden="true">
            <text x="500" y="128" textAnchor="middle" style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:'132px', letterSpacing:'0.01em', fill:'none', stroke:'rgba(214,213,208,0.5)', strokeWidth:1.35, paintOrder:'stroke', vectorEffect:'non-scaling-stroke' }}>{wordmark}</text>
          </svg>
        </div>

        <div style={{ position:'relative', zIndex:2, display:'flex', alignItems:'baseline', justifyContent:'space-between', gap:'var(--space-6)', padding:'16px var(--space-6) var(--space-6)', borderTop:'1px solid rgba(214,213,208,0.07)' }}>
          <p style={{ margin:0, width:'auto', color:'var(--text-muted)', fontSize:'var(--fs-caption)' }}>{copyright}</p>
          <span style={{ fontFamily:'var(--font-mono)', fontSize:'8px', letterSpacing:'0.24em', color:'rgba(214,213,208,0.22)' }}>{seal}</span>
        </div>
      </div>
    </footer>
  );
}
