import React from 'react';

export function Terminal({ id = 'KS-Transmissions', status = 'Receiving', readout = '> Acquiring signal', channels, children, style }) {
  return (
    <div style={{ border: 'var(--border-hairline)', background: 'linear-gradient(180deg, #05070E, var(--color-black))', ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--color-gray-700)', flexWrap: 'wrap' }}>
        <span aria-hidden="true" style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-crimson-lit)', boxShadow: '0 0 8px var(--color-crimson-lit)', flex: 'none' }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-mono)', letterSpacing: 'var(--tracking-label)', textTransform: 'uppercase', color: 'var(--color-bone)' }}>{id}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', letterSpacing: '0.1em', color: 'var(--color-gray-400)' }}>{status}</span>
        <div role="tablist" aria-label="Channel" style={{ display: 'flex', marginLeft: 'auto', flexWrap: 'wrap' }}>{channels}</div>
      </div>
      <div style={{ position: 'relative', padding: 'var(--space-8) var(--space-6)', minHeight: '340px' }}>
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.5, background: 'repeating-linear-gradient(to bottom, rgba(255,255,255,.022) 0 1px, transparent 1px 3px)' }} />
        <p style={{ position: 'relative', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.08em', color: 'var(--color-gray-400)', margin: '0 0 var(--space-6)', maxWidth: 'none' }}>
          {readout}<span aria-hidden="true" style={{ display: 'inline-block', width: '8px', height: '1em', background: 'var(--color-bone)', verticalAlign: '-2px', marginLeft: '4px' }} />
        </p>
        <ul style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', listStyle: 'none', margin: 0, padding: 0 }}>{children}</ul>
      </div>
    </div>
  );
}
