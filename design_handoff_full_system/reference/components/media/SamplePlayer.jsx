import React from 'react';

export function SamplePlayer({ playing = false, progress = 0, disabled = false, accent, onToggle, style }) {
  const a = accent || 'var(--track-accent, var(--color-white))';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', maxWidth: '360px', margin: '0 auto var(--space-2)', ...style }}>
      <button type="button" onClick={onToggle} disabled={disabled} aria-label={playing ? 'Pause sample' : 'Play sample'}
        style={{ width: '36px', height: '36px', flexShrink: 0, border: '1px solid ' + a, background: 'transparent', color: a, cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.4 : 1, borderRadius: 'var(--radius-sharp)' }}>
        <span aria-hidden="true">{playing ? '\u23F8' : '\u25B6'}</span>
      </button>
      <div style={{ flex: 1, height: '3px', background: 'var(--color-gray-600)', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, width: Math.max(0, Math.min(100, progress)) + '%', background: a, transition: 'width .15s linear' }} />
      </div>
    </div>
  );
}
