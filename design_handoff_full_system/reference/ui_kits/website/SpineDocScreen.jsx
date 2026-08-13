const { Button, Label, NewsletterForm, SamplePlayer, TrackCard } = window.KundaliniSpinesDesignSystem_22e3e6;

// THE SPINE DOCUMENT. One long scrolling page with the axis pinned to the hard
// left edge. Scrolling lights the node you are passing; clicking one jumps to it.
// Sections are bare type set straight on the black — no cards, no panels — with
// ONE exception: Music keeps the track carousel exactly as it is.
// No fixed positions. Every node's vertical placement is MEASURED from its own
// section's headline, so the throw always points at the words it belongs to.
function KsdTrackArch({ tracks, index, onSelect }) {
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

const KSD_SECTIONS = [
  { id:'home',          label:'Home' },
  { id:'about',         label:'About' },
  { id:'music',         label:'Music' },
  { id:'merch',         label:'Merch' },
  { id:'transmissions', label:'Transmissions' },
  { id:'archive',       label:'Archive' },
  { id:'connect',       label:'Stay Connected' }
];

// Headline and body share one left edge — the throw's landing point — so every
// section reads as hung off the same axis.
const KSD_HEAD = {
  fontFamily:'var(--font-display)', fontWeight:'var(--display-wght)',
  fontStretch:'var(--display-stretch)', fontVariationSettings:'"wdth" 72, "wght" 750',
  textTransform:'uppercase', letterSpacing:'var(--tracking-display)',
  lineHeight:'var(--lh-display)', color:'var(--color-white)',
  // --space-6, not an invented --space-5: the scale is 1,2,3,4,6,8,12,16,24,32 and a
  // missing token silently drops the whole declaration. With no card edge doing the
  // separating, this gap is the only thing holding the headline off the body.
  fontSize:'clamp(2.4rem, 6vw, 5rem)', margin:'0 0 var(--space-6)', maxWidth:'18ch'
};
const KSD_BODY = { color:'var(--text-secondary)', fontSize:'var(--fs-body-lg)', maxWidth:'62ch', margin:'0 0 var(--space-4)' };

// The step is ~30px with a ±5px sway. The sway is a sine, not noise: a repeating
// irregularity reads as anatomy, whereas true randomness reads as a mistake.
function ksVertebrae(height) {
  const out = [];
  let y = 26;
  let i = 0;
  while (y < height - 20) {
    out.push(Math.round(y));
    y += 30 + Math.sin(i * 1.7) * 5;
    i++;
  }
  return out;
}

function SpineSection({ id, title, children, innerRef, headRef, hero, media, alt }) {
  const H = hero ? 'h1' : 'h2';
  return (
    <section id={id} ref={innerRef}
      className={'ksd-section' + (hero ? ' ksd-hero' : '')}
      style={{ minHeight: hero ? undefined : '92vh', display:'flex', flexDirection:'column', justifyContent:'center', paddingBlock:'clamp(64px, 10vh, 140px)' }}>
      {hero ? (
        <div className="ksd-hero__media" aria-hidden={alt ? undefined : 'true'}>
          <img src={media} alt={alt || ''} />
          <span className="ksd-hero__scrim" />
        </div>
      ) : null}
      <H ref={headRef} className="ksd-reveal" style={hero ? { ...KSD_HEAD, maxWidth:'22ch' } : KSD_HEAD}>{title}</H>
      {children}
    </section>
  );
}

function SpineDocScreen({ onNavigate }) {
  const tracks = window.KS_TRACKS;
  const [index, setIndex] = React.useState(2);
  const [playing, setPlaying] = React.useState(false);
  const [active, setActive] = React.useState('home');
  const [tops, setTops] = React.useState(null);
  const [railH, setRailH] = React.useState(0);
  const refs = React.useRef({});
  const heads = React.useRef({});
  const wrap = React.useRef(null);
  const segs = React.useRef([]);
  const t = tracks[index];

  // Node placement is measured off each headline's first text line, then re-measured
  // whenever the layout can have moved (fonts swapping in, images landing, resize).
  React.useLayoutEffect(() => {
    const measure = () => {
      const next = {};
      for (const sec of KSD_SECTIONS) {
        if (sec.id === 'home') {
          // The Home node sits at the video's foot, not on its headline: the hero is a
          // destination in its own right, measured by where the footage ends.
          const media = refs.current.home && refs.current.home.querySelector('.ksd-hero__media');
          if (media) next[sec.id] = Math.round(media.offsetTop + media.offsetHeight);
          continue;
        }
        const h = heads.current[sec.id];
        if (!h) continue;
        // half a line down from the headline's top edge — the throw meets the type
        // at its optical centre rather than at the box edge.
        next[sec.id] = Math.round(h.offsetTop + h.getBoundingClientRect().height / (h.textContent.length > 24 ? 4 : 2));
      }
      setTops(next);
      if (wrap.current) setRailH(wrap.current.offsetHeight);
    };
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('load', measure);
    const t1 = setTimeout(measure, 400);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    return () => { window.removeEventListener('resize', measure); window.removeEventListener('load', measure); clearTimeout(t1); };
  }, []);

  // Scroll lights the node you are passing: whichever section owns the middle of
  // the viewport is the active one. No observer thresholds — the midpoint test is
  // stable at every section length, which matters when Music is twice as tall as
  // the rest.
  React.useEffect(() => {
    const onScroll = () => {
      const mid = window.innerHeight / 2;
      let found = KSD_SECTIONS[0].id;
      for (const s of KSD_SECTIONS) {
        const el = refs.current[s.id];
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (r.top <= mid && r.bottom >= mid) { found = s.id; break; }
        if (r.top > mid) break;
        found = s.id;
      }
      setActive(found);

      const docMid = window.pageYOffset + window.innerHeight / 2;
      const base = wrap.current ? wrap.current.getBoundingClientRect().top + window.pageYOffset : 0;
      for (const el of segs.current) {
        if (!el) continue;
        const d = base + Number(el.dataset.y) - docMid;
        el.classList.toggle('is-active', Math.abs(d) < 26);
        el.classList.toggle('is-passed', d < -26);
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive:true });
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); };
  }, []);

  const jump = (id) => {
    const el = refs.current[id];
    if (!el) return;
    // the LIVE bar height — this is an offset, not layout, so --nav-h is right here
    const navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 72;
    const y = el.getBoundingClientRect().top + window.pageYOffset - navH;
    window.scrollTo({ top: y, behavior:'smooth' });
  };

  // Published so the top nav can reach a section rather than only a screen.
  React.useEffect(() => { window.__ksdJump = jump; return () => { delete window.__ksdJump; }; });

  const setRef = (id) => (el) => { refs.current[id] = el; };
  const setHead = (id) => (el) => { heads.current[id] = el; };

  // Headlines reveal once, on the way past. A MutationObserver-free approach: the
  // Object.values ref map already holds every headline node once tops has resolved.
  React.useEffect(() => {
    if (!tops) return;
    const els = Object.values(heads.current).filter(Boolean);
    if (!els.length) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      els.forEach(el => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { threshold: 0.01, rootMargin: '0px 0px -12% 0px' });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [tops]);

  return (
    <div ref={wrap} style={{ '--ksd-axis':'6vw', '--ksd-throw':'32px', '--track-accent': t.accent, position:'relative' }}>
      <div className="ksd-rail" aria-hidden="true">
        <span className="ksd-cord" />
        {/* Vertebrae sit under the nodes in the stack: the node is the destination, the
            segment is the structure it is mounted on. */}
        {railH ? ksVertebrae(railH).map((y, i) => {
          const anchor = tops && KSD_SECTIONS.some(sec => Math.abs((tops[sec.id] || -999) - y) < 16);
          return (
            <span key={i} ref={el => { segs.current[i] = el; }} data-y={y}
              className={'ksd-vert' + (anchor ? ' is-anchor' : '')}
              style={{ top: y + 'px', '--ksd-arm': (anchor ? 9 : 6) + 'px' }}>
              <i className="l" /><i className="r" />{anchor ? <b /> : null}
            </span>
          );
        }) : null}
        {tops ? KSD_SECTIONS.map(s => (
          <span key={s.id} style={{ position:'absolute', left:0, top:(tops[s.id] || 0) + 'px', width:0 }}>
            <span className={'ksd-throw' + (active === s.id ? ' is-lit' : '')} />
            <button type="button" className={'ksd-node' + (active === s.id ? ' is-active' : '')}
              aria-label={s.label} onClick={() => jump(s.id)} style={{ top:0 }} />
            <span className="ksd-label">{s.label}</span>
          </span>
        )) : null}
      </div>

      <div style={{ marginLeft:'calc(6vw + 32px + 18px)', paddingRight:'clamp(24px, 6vw, 120px)',
        // --nav-h-max, not --nav-h: node positions are measured once per layout, so a
        // scroll-varying padding would slide every section out from under them — the
        // exact misalignment the measured-node placement exists to prevent.
        paddingTop:'var(--nav-h-max, 92px)' }}>
        <SpineSection id="home" hero title={<>Knowledge Hidden<br/>in Plain Sight</>}
          media="../../assets/hero/messengers-hero-video-poster.jpg"
          alt="Two hooded Messengers of Kundalini Spines before an industrial skyline."
          innerRef={setRef('home')} headRef={setHead('home')}>
          <p style={KSD_BODY}>Two Messengers. One Signal. An underground transmission built from sacred geometry, coded lyricism, and the architecture of the spine itself.</p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'var(--space-4)', marginTop:'var(--space-2)' }}>
            <Button variant="primary" onClick={() => jump('about')}>Enter the World</Button>
            <Button variant="ghost" onClick={() => jump('music')}>Listen Now</Button>
          </div>
        </SpineSection>

        <SpineSection id="about" title="Two Messengers. One Signal." innerRef={setRef('about')} headRef={setHead('about')}>
          <p style={KSD_BODY}>Kundalini Spines is a two-member creative and musical project moving between underground hip-hop, mysticism, symbolism, street experience, ancient knowledge, and speculative thought.</p>
          <p style={KSD_BODY}>The Messengers don&rsquo;t claim mastery over the Signal &mdash; they receive it, interpret it, and carry it forward. You&rsquo;re invited to decode it for yourself.</p>
          <p style={{ marginTop:'var(--space-2)' }}><Button variant="ghost" onClick={() => onNavigate && onNavigate('about')}>Read the Feature</Button></p>
        </SpineSection>

        {/* MUSIC IS THE EXCEPTION. The carousel is protected behavior — the cards,
            their arch geometry and their motion are untouched. Only the type around
            it was recomposed to hang off the axis instead of centring on the page. */}
        <SpineSection id="music" title="Enter the Tracks" innerRef={setRef('music')} headRef={setHead('music')}>
          <p style={KSD_BODY}><strong>Rise Up</strong> isn&rsquo;t on streaming platforms yet &mdash; 20-second samples are available here for every track now. Full streaming and download links go live once each platform is connected.</p>
          <div style={{ position:'relative', marginTop:'var(--space-4)', // Bleeds RIGHT only. Pulling it left as well ran the cards over the axis, and
            // the spine is the one thing nothing is allowed to cover.
            marginRight:'calc(-1 * clamp(24px, 6vw, 120px))', overflow:'hidden' }}>
            <KsdTrackArch tracks={tracks} index={index} onSelect={setIndex} />
          </div>
          {/* Centred on the ARCH'S OWN wrapper, not an independent maxWidth: the arch
              bleeds right past the text column, so its optical centre sits right of a
              block centred on 62ch prose. Matching the wrapper's width (same bleed)
              guarantees the same centre instead of approximating it. */}
          <div style={{ position:'relative', marginRight:'calc(-1 * clamp(24px, 6vw, 120px))', marginTop:'var(--space-4)', textAlign:'center' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'var(--space-4)', marginBottom:'var(--space-3)' }}>
              <button type="button" aria-label="Previous track" disabled={index === 0} onClick={() => setIndex(Math.max(0, index - 1))}
                style={{ background:'transparent', border:'none', color:'var(--text-primary)', width:'38px', height:'38px', cursor:'pointer', fontFamily:'var(--font-display)', fontSize:'1.05rem', opacity: index === 0 ? 0.25 : 1 }}>&#10094;</button>
              <p style={{ margin:0, fontFamily:'var(--font-mono)', fontWeight:500, fontSize:'var(--fs-mono)', letterSpacing:'var(--tracking-mono)', color:'var(--text-muted)', display:'flex', alignItems:'baseline', gap:'0.45em' }}>
                <span style={{ color:t.accent }}>{index + 1}</span><span style={{ opacity:0.5 }}>/</span><span>{tracks.length}</span>
              </p>
              <button type="button" aria-label="Next track" disabled={index === tracks.length - 1} onClick={() => setIndex(Math.min(tracks.length - 1, index + 1))}
                style={{ background:'transparent', border:'none', color:'var(--text-primary)', width:'38px', height:'38px', cursor:'pointer', fontFamily:'var(--font-display)', fontSize:'1.05rem', opacity: index === tracks.length - 1 ? 0.25 : 1 }}>&#10095;</button>
            </div>
            <Label block tone="accent" style={{ marginBottom:'6px', color:t.accent }}>{t.title} &nbsp;&middot;&nbsp; {t.duration}</Label>
            <p style={{ color:'var(--text-secondary)', fontSize:'0.95rem', lineHeight:1.55, margin:'0 auto var(--space-3)', maxWidth:'56ch' }}>{t.description}</p>
            <SamplePlayer playing={playing} progress={playing ? 38 : 0} accent={t.accent} onToggle={() => setPlaying(!playing)} />
            <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:'var(--space-2)', marginTop:'var(--space-3)' }}>
              {['Spotify','Apple Music','YouTube Music','Download'].map(l => <Button key={l} variant="ghost" size="sm" disabled>{l}</Button>)}
            </div>
          </div>
        </SpineSection>

        <SpineSection id="merch" title="Objects That Carry It" innerRef={setRef('merch')} headRef={setHead('merch')}>
          <p style={KSD_BODY}>The Signal doesn&rsquo;t only travel as sound. Some of it ends up in things you can hold &mdash; apparel and headwear, the record as a physical object, printed work, and pieces closer to talismans than products.</p>
          <p style={KSD_BODY}>The Messengers wear the same marks you&rsquo;ll find here. Nothing in the range is made to advertise. It&rsquo;s made to carry &mdash; the same way a transmission is received, preserved, and passed on without weakening.</p>
          <p style={KSD_BODY}>None of it is listed yet and there is no date. Objects go out as each one is made, in the quantity it can be made in, and they are filed like everything else.</p>
          <p style={{ marginTop:'var(--space-2)' }}><Button variant="ghost" onClick={() => jump('connect')}>Be Told First</Button></p>
        </SpineSection>

        <SpineSection id="transmissions" title="Tune to a Frequency" innerRef={setRef('transmissions')} headRef={setHead('transmissions')}>
          <p style={KSD_BODY}>Every signal the Messengers put out &mdash; posts, clips, releases and filed pieces &mdash; arrives here, timestamped and numbered. Select a channel to isolate it, or take the whole band.</p>
          <p style={{ marginTop:'var(--space-2)' }}><Button variant="ghost" onClick={() => onNavigate && onNavigate('transmissions')}>Open the Terminal</Button></p>
        </SpineSection>

        <SpineSection id="archive" title="The Filed Material" innerRef={setRef('archive')} headRef={setHead('archive')}>
          <p style={KSD_BODY}>Visual releases, documents and fragments, kept in the order they were received rather than the order they were made.</p>
          <p style={{ marginTop:'var(--space-2)' }}><Button variant="ghost" onClick={() => onNavigate && onNavigate('archive')}>Enter the Archive</Button></p>
        </SpineSection>

        <SpineSection id="connect" title="Stay Connected to the Signal" innerRef={setRef('connect')} headRef={setHead('connect')}>
          <p style={KSD_BODY}>Receive new music, transmissions, visual releases, and limited announcements directly from Kundalini Spines. No constant noise. Only meaningful signals.</p>
          <div style={{ maxWidth:'520px' }}><NewsletterForm /></div>
        </SpineSection>

      </div>
    </div>
  );
}

Object.assign(window, { SpineDocScreen });
