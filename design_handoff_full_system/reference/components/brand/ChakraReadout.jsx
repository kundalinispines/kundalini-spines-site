import React from 'react';

// THE SEVEN, crown to root. One definition; the footer band and the navigator's
// field state the same numbers so the system is not two things that share a palette.
export const KS_CHAKRAS = [
  { n: 7, name: 'SAHASRARA',    en: 'Crown',        hz: 963, y: 12 },
  { n: 6, name: 'AJNA',         en: 'Third Eye',    hz: 852, y: 27 },
  { n: 5, name: 'VISHUDDHA',    en: 'Throat',       hz: 741, y: 40 },
  { n: 4, name: 'ANAHATA',      en: 'Heart',        hz: 639, y: 53 },
  { n: 3, name: 'MANIPURA',     en: 'Solar Plexus', hz: 528, y: 66 },
  { n: 2, name: 'SVADHISTHANA', en: 'Sacral',       hz: 417, y: 79 },
  { n: 1, name: 'MULADHARA',    en: 'Root',         hz: 396, y: 92 }
];

export function ChakraReadout({ head = 'CALIBRATION', rows, style }) {
  const data = rows || KS_CHAKRAS.map(c => [c.name, c.hz + ' Hz']);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'3px', ...style }}>
      {head ? <span style={{ fontFamily:'var(--font-mono)', fontSize:'9px', letterSpacing:'0.22em', textTransform:'uppercase', color:'var(--color-gray-300)', marginBottom:'4px', minHeight:'12px', textShadow:'0 0 3px rgba(3,4,15,0.98), 0 1px 2px rgba(3,4,15,0.92)' }}>{head}</span> : null}
      {data.map(([k, v]) => (
        <span key={k} style={{ display:'flex', justifyContent:'space-between', gap:'var(--space-4)', fontFamily:'var(--font-mono)', fontSize:'9px', letterSpacing:'0.08em', color:'var(--color-gray-300)', textShadow:'0 0 3px rgba(3,4,15,0.98), 0 1px 2px rgba(3,4,15,0.92)' }}>
          {k}<i style={{ fontStyle:'normal', color:'var(--color-bone)' }}>{v}</i>
        </span>
      ))}
    </div>
  );
}
