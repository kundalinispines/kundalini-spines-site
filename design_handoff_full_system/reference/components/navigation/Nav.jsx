import React from 'react';

const KS_NAV_LINK = {
  textDecoration: 'none', fontFamily: 'var(--font-label)', fontWeight: 600,
  fontSize: 'var(--fs-label)', letterSpacing: 'var(--tracking-label)',
  textTransform: 'uppercase'
};

// THE NAV SITS ON FOOTAGE, SO IT CANNOT USE --text-secondary.
// The cold palette's secondary (#9DB2C0) is materially darker than the warm bone
// it replaced; over the hero poster's bright sky it measures ~1.3:1 and the
// inactive labels disappear. The transparent header was only ever viable because
// the old secondary was nearly white. Two corrections, both from the system's own
// vocabulary: links over imagery read from --spine-glow at reduced alpha rather
// than from a darker token, and the unscrolled header carries the same top
// protection gradient the hero uses, so the labels always have ground under them.
const KS_NAV_INK        = 'rgba(228, 232, 235, 0.82)';
const KS_NAV_INK_ACTIVE = 'var(--color-white)';
const KS_NAV_SHADOW     = '0 0 3px rgba(3,4,15,.98), 0 1px 2px rgba(3,4,15,.92)';

// THE COLLAPSE IS DRIVEN BY SCROLL POSITION, NOT BY A BREAKPOINT IN TIME.
// Every value below is interpolated across the same 0→1 travel, so the header is
// a continuous mechanism rather than two states with a fade between them: there is
// no moment where it "snaps". The distance is deliberately short — 150px, about a
// flick of the wheel — because a long ramp reads as lag rather than as machinery.
const KS_COLLAPSE_PX = 150;
const ksLerp = (a, b, p) => a + (b - a) * p;

export function Nav({ items = [], current, scrolled = false, mark = 'KUNDALINI SPINES', markSrc = 'assets/marks/spine-mark.svg', onNavigate, collapse = true, style }) {
  const [open, setOpen] = React.useState(false);
  const [p, setP] = React.useState(0);
  const [compact, setCompact] = React.useState(false);
  const bar = React.useRef(null);

  // --nav-h IS LOAD-BEARING, NOT DIAGNOSTIC. css/track-experience.css computes
  // scroll-margin-top from it, the hero takes its top clearance from it, and the kit
  // spaces the document with it. A collapsing bar that does not publish its height
  // leaves every one of those reading a stale 72px default.
  React.useLayoutEffect(() => {
    if (!bar.current) return;
    const h = Math.round(bar.current.getBoundingClientRect().height);
    document.documentElement.style.setProperty('--nav-h', h + 'px');
  });

  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 760px)');
    const still = window.matchMedia('(prefers-reduced-motion: reduce)');
    const read = () => setCompact(mq.matches);
    read();
    if (!collapse) { setP(0); return; }
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const y = window.pageYOffset || document.documentElement.scrollTop || 0;
        // Reduced motion still collapses — it just does it in one step, because the
        // pinned compact bar is a layout affordance, not decoration.
        setP(still.matches ? (y > 8 ? 1 : 0) : Math.min(1, Math.max(0, y / KS_COLLAPSE_PX)));
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', read);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', read); if (frame) cancelAnimationFrame(frame); };
  }, [collapse]);

  // Mobile travels less: the expanded state is already tight there, so a full-depth
  // collapse would be movement for its own sake.
  const q = compact ? p * 0.55 : p;
  const padY   = ksLerp(compact ? 18 : 30, compact ? 10 : 9, q);
  const markPx = ksLerp(compact ? 17 : 19, compact ? 14 : 14.5, q);
  const glyphPx = Math.round(ksLerp(compact ? 17 : 20, compact ? 14 : 15, q));
  const gapPx  = ksLerp(compact ? 20 : 34, compact ? 15 : 19, q);
  // THE COLLAPSED BAR IS FULLY OPAQUE, AND THAT IS NOT NEGOTIABLE.
  // css/components.css on feature/spine-ui-v2 carries a measured note about this:
  // the scrolled nav used to be rgba(5,5,5,0.92) + 6px blur, and at the #tracks
  // landing position the hero's solid WHITE "Enter the World" button parks directly
  // behind the bar. Eight percent of white is not nothing — it read as a lit
  // rectangle inside the bar with the video moving behind it. A translucent
  // collapsed bar reintroduces that bug.
  // "Visually connected underneath" is delivered by a short gradient TAIL below the
  // bar instead, so the join is soft without the bar itself leaking.
  const veil   = ksLerp(0, 1, p);
  const rule   = ksLerp(0, 0.85, p);
  const tail   = ksLerp(0, 0.9, p);

  return (
    <header ref={bar} style={{
      position: 'fixed', insetInline: 0, top: 0, zIndex: 100,
      paddingBlock: padY + 'px',
      // The ground fades in as the bar thins, so content stays visually connected
      // underneath it instead of being cut off by a hard band. No blur: the system's
      // glass belongs to the spine cards, and borrowing it here would soften an
      // element whose whole job is to be a hard edge.
      background: 'linear-gradient(180deg, rgba(3,4,15,' + (0.78 + veil * 0.22).toFixed(3) + ') 0%, rgba(3,4,15,' + (0.42 + veil * 0.58).toFixed(3) + ') 55%, rgba(3,4,15,' + veil.toFixed(3) + ') 100%)',
      borderBottom: '1px solid rgba(57,71,80,' + rule.toFixed(3) + ')',
      willChange: 'padding-block',
      ...style
    }}>
      {/* The tail: a 22px fade below the bar's own edge. It is what makes the
          collapsed header sit ON the content rather than cut it off, without the bar
          passing anything through. */}
      <span aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, top: '100%', height: '22px', pointerEvents: 'none', background: 'linear-gradient(180deg, rgba(3,4,15,' + tail.toFixed(3) + ') 0%, rgba(3,4,15,0) 100%)' }} />
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-6)' }}>
        <a href="#" onClick={(e) => { e.preventDefault(); onNavigate && onNavigate(items[0] && items[0].href); }} style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--display-wght)', fontStretch: 'var(--display-stretch)', fontVariationSettings: '"wdth" 72, "wght" 750', textTransform: 'uppercase', fontSize: markPx + 'px', letterSpacing: 'var(--tracking-heading)', textDecoration: 'none', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: ksLerp(9, 7, q).toFixed(1) + 'px', color: KS_NAV_INK_ACTIVE, textShadow: KS_NAV_SHADOW }}>
          {/* The mark scales rather than being swapped for an initial — the identity
              thins with the bar instead of being replaced by a different one. */}
          {markSrc ? <img src={markSrc} alt="" width={glyphPx} height={glyphPx} style={{ display: 'block' }} /> : null}{mark}
        </a>
        <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} style={{ display: 'none', background: 'none', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: 'var(--space-2) var(--space-3)', fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>Menu</button>
        <nav aria-label="Primary">
          <ul style={{ display: 'flex', gap: gapPx.toFixed(1) + 'px', listStyle: 'none', margin: 0, padding: 0 }}>
            {items.map((it) => (
              <li key={it.href}>
                <a href={it.href}
                   aria-current={current === it.href ? 'page' : undefined}
                   onClick={(e) => { if (onNavigate) { e.preventDefault(); onNavigate(it.href); } }}
                   style={{ ...KS_NAV_LINK, textShadow: KS_NAV_SHADOW, color: current === it.href ? KS_NAV_INK_ACTIVE : KS_NAV_INK }}>{it.label}</a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
