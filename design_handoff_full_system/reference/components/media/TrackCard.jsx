import React from 'react';

export function TrackCard({ artwork, title, depth = 0, active = false, size = 250, onClick, style }) {
  // depth 0 = centred hero, 1..n = distance from centre. Geometry mirrors the
  // arch carousel: scale and brightness fall off continuously with distance.
  const scale = active ? 1 : Math.max(0.52, 1 - depth * 0.18);
  const brightness = active ? 1 : Math.max(0.35, 1 - depth * 0.22);
  const box = size * (active ? 1.85 : 1.85);
  return (
    <button type="button" onClick={onClick} aria-label={title} title={title}
      style={{
        position: 'relative', flex: '0 0 auto', width: box + 'px', height: box + 'px',
        marginRight: (size - box) + 'px',
        border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)',
        padding: 0, cursor: 'pointer', overflow: 'hidden',
        transform: 'scale(' + scale + ')', filter: 'brightness(' + brightness + ')',
        transition: 'transform var(--motion-base) var(--ease-standard), filter .4s ease',
        ...style
      }}>
      <img src={artwork} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }} />
    </button>
  );
}
