import React from 'react';

export function AudioPlayer({ cover, title, artist, time = '0:00', duration = '0:00', playing = false, status, disabled = false, onToggle, style }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', border: 'var(--border-hairline)', padding: 'var(--space-4)', background: 'var(--bg-surface)', ...style }}>
      {cover ? <img src={cover} alt="" style={{ width: '56px', height: '56px', objectFit: 'cover', flexShrink: 0 }} /> : null}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 'var(--space-2)' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-body)' }}>{title}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-caption)', color: 'var(--text-muted)' }}>{artist}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <button type="button" onClick={onToggle} disabled={disabled} aria-label={playing ? 'Pause' : 'Play'}
            style={{ width: '40px', height: '40px', border: '1px solid var(--color-white)', background: 'transparent', color: 'var(--text-primary)', cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: disabled ? 0.4 : 1 }}>
            <span aria-hidden="true">{playing ? '\u23F8' : '\u25B6'}</span>
          </button>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-caption)', color: 'var(--text-muted)', minWidth: '3.2em' }}>{time}</span>
          <div style={{ flex: 1, minWidth: '80px', height: '3px', background: 'var(--color-gray-600)' }}><div style={{ height: '100%', width: '0%', background: 'var(--color-bone)' }} /></div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-caption)', color: 'var(--text-muted)', minWidth: '3.2em' }}>{duration}</span>
        </div>
        {status ? <p style={{ margin: 'var(--space-2) 0 0', fontSize: 'var(--fs-caption)', color: 'var(--text-muted)' }}>{status}</p> : null}
      </div>
    </div>
  );
}
