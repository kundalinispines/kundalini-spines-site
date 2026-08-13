import React from 'react';

// Rajdhani 600 / 13px / +0.18em. Labels are INTERFACE type — eyebrows, chips,
// section kickers. Data readouts (record numbers, timestamps) stay on Plex Mono.
const KS_LABEL = {
  fontFamily: 'var(--font-label)', fontWeight: 600, fontSize: 'var(--fs-label)',
  letterSpacing: 'var(--tracking-label)', textTransform: 'uppercase',
  color: 'var(--text-muted)'
};

// tone="over" is the OVER-IMAGERY tone, and it is the only correct way to put a
// label on footage. The dark tones are tuned for the black ground; on a bright
// frame --text-muted measures ~1.3:1 and the label disappears. Over imagery a
// label reads from --spine-glow at reduced alpha and carries the two-pass
// legibility shadow, exactly as nav links do.
const KS_LABEL_OVER_SHADOW = '0 0 3px rgba(3,4,15,.98), 0 1px 2px rgba(3,4,15,.92)';

export function Label({ tone = 'muted', block = false, children, style, ...rest }) {
  const tones = {
    muted: 'var(--text-muted)', bone: 'var(--color-bone)', signal: 'var(--text-primary)',
    accent: 'var(--track-accent, var(--text-primary))',
    over: 'rgba(228, 232, 235, 0.82)'
  };
  return <span style={{ ...KS_LABEL, color: tones[tone], ...(tone === 'over' ? { textShadow: KS_LABEL_OVER_SHADOW } : null), display: block ? 'block' : 'inline', ...style }} {...rest}>{children}</span>;
}
