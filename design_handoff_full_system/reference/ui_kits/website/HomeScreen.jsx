const { Hero, Button, Label, SectionHeader, TrackCard, SamplePlayer, NewsletterForm, FeaturedBlock } = window.KundaliniSpinesDesignSystem_22e3e6;

// The arch carousel. Geometry mirrors css/track-experience.css: --card-w is the
// LAYOUT STEP (250px desktop) and the card box is 1.85x that; the hero renders at
// scale 1 rather than being scaled up from a small box.
function TrackArch({ tracks, index, onSelect }) {
  const STEP = 250, BOX = Math.round(STEP * 1.85);
  return (
    <div style={{ position:'relative', height:'560px', overflow:'hidden' }}>
      <ul style={{
        position:'absolute', left:'50%', top:0, display:'flex', alignItems:'center',
        listStyle:'none', margin:0, padding:0, gap:'0.75px',
        transform:'translateX(' + (-(index * STEP) - BOX / 2) + 'px)',
        transition:'transform var(--motion-base) var(--ease-standard)'
      }}>
        {tracks.map((t, i) => {
          const d = Math.abs(i - index);
          return (
            <li key={t.id} style={{ flex:'0 0 auto', width: BOX + 'px', marginRight: (STEP - BOX) + 'px', transform:'translateY(' + Math.min(d, 4) * 26 + 'px)' }}>
              <TrackCard artwork={t.artwork} title={t.title} depth={d} active={d === 0} size={STEP}
                onClick={() => onSelect(i)}
                style={{ position:'relative', width:'100%', height: BOX + 'px', marginRight:0, zIndex: 20 - d }} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function HomeScreen({ onNavigate }) {
  const tracks = window.KS_TRACKS;
  const [index, setIndex] = React.useState(2);
  const [playing, setPlaying] = React.useState(false);
  const t = tracks[index];
  return (
    <div style={{ '--track-accent': t.accent }}>
      <Hero
        eyebrow="Kundalini Spines"
        title={<>Knowledge Hidden<br/>in Plain Sight</>}
        statement="Two Messengers. One Signal. An underground transmission built from sacred geometry, coded lyricism, and the architecture of the spine itself."
        media="../../assets/hero/messengers-hero-video-poster.jpg"
        soundToggle
        actions={<>
          <Button variant="primary" onClick={() => onNavigate('about')}>Enter the World</Button>
          <Button variant="ghost" onClick={() => onNavigate('music')}>Listen Now</Button>
        </>}
      />

      <section id="tracks" style={{ background:'var(--color-black)', paddingBlock:'var(--space-8)', overflow:'hidden' }}>
        <div className="container" style={{ textAlign:'center', marginBottom:'var(--space-8)' }}>
          <Label block style={{ marginBottom:'var(--space-2)' }}>Music</Label>
          <h2 className="text-showcase" style={{ fontFamily:'var(--font-showcase)', fontWeight:'var(--showcase-wght)', fontStretch:'var(--showcase-stretch)', fontVariationSettings:'"wdth" 110, "wght" 800', letterSpacing:0, margin:0, fontSize:'clamp(1.9rem, 4vw, 2.6rem)', lineHeight:1 }}>Enter the Tracks</h2>
          <p style={{ maxWidth:'60ch', margin:'var(--space-3) auto 0', fontSize:'0.9rem', lineHeight:1.5, color:'var(--text-secondary)' }}>
            <strong>Rise Up</strong> isn&rsquo;t on streaming platforms yet &mdash; 20-second samples are available here for every track now. Full streaming and download links go live once each platform is connected.
          </p>
        </div>

        <TrackArch tracks={tracks} index={index} onSelect={setIndex} />

        <div style={{ maxWidth:'760px', margin:'0 auto', textAlign:'center' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'420px', maxWidth:'100%', margin:'0 auto var(--space-3)' }}>
            <button type="button" aria-label="Previous track" disabled={index === 0} onClick={() => setIndex(Math.max(0, index - 1))}
              style={{ background:'transparent', border:'none', color:'var(--text-primary)', width:'38px', height:'38px', cursor:'pointer', fontFamily:'var(--font-display)', fontSize:'1.05rem', opacity: index === 0 ? 0.25 : 1 }}>&#10094;</button>
            <p style={{ margin:0, fontFamily:'var(--font-mono)', fontSize:'var(--fs-caption)', letterSpacing:'var(--tracking-label)', color:'var(--text-muted)', display:'flex', alignItems:'baseline', gap:'0.45em' }}>
              <span style={{ color:t.accent }}>{index + 1}</span><span style={{ opacity:0.5 }}>/</span><span>{tracks.length}</span>
            </p>
            <button type="button" aria-label="Next track" disabled={index === tracks.length - 1} onClick={() => setIndex(Math.min(tracks.length - 1, index + 1))}
              style={{ background:'transparent', border:'none', color:'var(--text-primary)', width:'38px', height:'38px', cursor:'pointer', fontFamily:'var(--font-display)', fontSize:'1.05rem', opacity: index === tracks.length - 1 ? 0.25 : 1 }}>&#10095;</button>
          </div>
          <Label block tone="accent" style={{ marginBottom:'4px', color:t.accent }}>{t.title} &nbsp;&middot;&nbsp; {t.duration}</Label>
          <p style={{ color:'var(--text-secondary)', fontSize:'0.95rem', lineHeight:1.5, margin:'0 auto var(--space-2)', maxWidth:'60ch' }}>{t.description}</p>
          <SamplePlayer playing={playing} progress={playing ? 38 : 0} accent={t.accent} onToggle={() => setPlaying(!playing)} />
          <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:'var(--space-2)', marginBottom:'var(--space-2)' }}>
            {['Spotify','Apple Music','YouTube Music','Download'].map(l => <Button key={l} variant="ghost" size="sm" disabled>{l}</Button>)}
          </div>
          <p style={{ fontSize:'0.72rem', lineHeight:1.4, color:'var(--text-muted)', maxWidth:'none', margin:'var(--space-2) auto 0' }}>Streaming links go live as each platform is connected. Nothing here links anywhere it shouldn&rsquo;t.</p>
        </div>
      </section>

      <section className="section" style={{ borderTop:'var(--border-hairline)', borderBottom:'var(--border-hairline)', textAlign:'center' }}>
        <div className="container">
          <Label block>Stay Connected</Label>
          <h2 style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:'var(--fs-h1)', margin:'var(--space-2) 0 var(--space-4)' }}>Stay Connected to the Signal</h2>
          <p style={{ color:'var(--text-secondary)', maxWidth:'56ch', marginInline:'auto' }}>Receive new music, transmissions, visual releases, and limited announcements directly from Kundalini Spines. No constant noise. Only meaningful signals.</p>
          <NewsletterForm />
        </div>
      </section>

      <section className="section container">
        <FeaturedBlock media="../../assets/hero/messengers-hero-duo.jpg" ratio="16 / 9" label="About" title="Two Messengers. One Signal."
          alt="Two hooded Messengers of Kundalini Spines standing either side of a glowing sacred-geometry spine motif.">
          <p>Kundalini Spines is a two-member creative and musical project moving between underground hip-hop, mysticism, symbolism, street experience, ancient knowledge, and speculative thought. The Messengers don&rsquo;t claim mastery over the Signal &mdash; they receive it, interpret it, and carry it forward. You&rsquo;re invited to decode it for yourself.</p>
          <p style={{ marginTop:'var(--space-4)' }}><Button variant="ghost" onClick={() => onNavigate('about')}>More About Kundalini Spines</Button></p>
        </FeaturedBlock>
      </section>
    </div>
  );
}

Object.assign(window, { HomeScreen, TrackArch });
