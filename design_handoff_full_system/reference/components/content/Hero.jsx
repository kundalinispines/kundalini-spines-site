import React from 'react';
import { Label } from '../core/Label.jsx';

export function Hero({ eyebrow, title, statement, media, poster, actions, soundToggle = false, minHeight = '100svh', style }) {
  return (
    // Clearance reads --nav-h-max (static), never the live --nav-h: the bar thins as
    // you scroll, and padding driven by that would shorten the document under the
    // reader. THE CLEARANCE BELONGS TO THE SECTION, NOT THE CONTENT BOX. The hero is
    // bottom-aligned with overflow:hidden, so when the content is taller than the
    // viewport it overflows UPWARD and is clipped at the top — which silently ate a
    // padding-top on the inner container. As section padding it is part of the flex
    // container's content box, so bottom-aligned content cannot rise into the bar.
    <section style={{ position: 'relative', minHeight, display: 'flex', alignItems: 'flex-end', overflow: 'hidden', background: 'var(--color-black)', paddingTop: 'calc(var(--nav-h-max, 92px) + var(--space-4))', ...style }}>
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <img src={media || poster} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%' }} />
      </div>
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'linear-gradient(180deg, rgba(3,4,15,.15) 0%, rgba(3,4,15,.55) 55%, rgba(3,4,15,.95) 100%)' }} />
      {soundToggle ? (
        <button type="button" aria-pressed="false" style={{ position: 'absolute', right: 'var(--space-6)', bottom: 'var(--space-6)', zIndex: 3, display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-mono)', letterSpacing: 'var(--tracking-label)', textTransform: 'uppercase', color: 'var(--text-secondary)', background: 'rgba(3,4,15,.55)', border: '1px solid var(--border-subtle)', padding: 'var(--space-2) var(--space-3)', cursor: 'pointer' }}>Sound Off</button>
      ) : null}
      {/* Top padding is the LIVE bar height plus air, not a fixed number: the eyebrow
          shares its left edge and near-enough its wording with the nav wordmark, so at
          the wrong clearance the two stack a few pixels apart and read as a duplicate. */}
      <div className="container" style={{ position: 'relative', zIndex: 2, width: '100%', paddingBottom: 'var(--space-16)' }}>
        {/* The hero eyebrow always sits on footage — it takes the over-imagery tone. */}
        {eyebrow ? <Label block tone="over" style={{ marginBottom: 'var(--space-4)' }}>{eyebrow}</Label> : null}
        {/* The showcase cut: wdth 110 / wght 800 / letter-spacing 0. The inline values
            here must match .text-showcase — the display face's -0.03em is a lockup
            setting for the CONDENSED cut and closes up the expanded one. */}
        <h1 className="text-showcase" style={{ fontSize: 'var(--fs-hero)', lineHeight: 'var(--lh-tight)', margin: '0 0 var(--space-4)', fontFamily: 'var(--font-showcase)', fontWeight: 'var(--showcase-wght)', fontStretch: 'var(--showcase-stretch)', fontVariationSettings: '"wdth" 110, "wght" 800', letterSpacing: 0 }}>{title}</h1>
        {statement ? <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-body-lg)', maxWidth: '52ch', margin: '0 0 var(--space-8)' }}>{statement}</p> : null}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)' }}>{actions}</div>
      </div>
    </section>
  );
}
