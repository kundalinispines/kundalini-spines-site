/* REFERENCE ONLY — not part of the design system, and not code to ship.
   A React recreation used to judge the motion changes; the card copy is
   placeholder and the markup is not the site's. The deliverable in this folder
   is spine-ui.motion.patch.css. Renamed from NavigatorScreen so it cannot
   collide with the live screen of that name. */
const { SpineCard } = window.KundaliniSpinesDesignSystem_22e3e6;

// THE NAVIGATOR, ANIMATED — the five states in design/spine-ui-v2/INTERACTION_STATES.md.
// Tempo comes entirely from tokens on the host page; the machine below is identical
// in every variant.
const KS_NODES = [
  { id:'story',        label:'Our Story',      y:12, side:'right', kind:'card',
    eyebrow:'01 / Origin', title:'Knowledge Hidden in Plain Sight', cta:'Read the full account',
    body:'Kundalini Spines is a two-member creative and musical project moving between underground hip-hop, mysticism, symbolism, street experience, ancient knowledge, and speculative thought.' },
  { id:'members',      label:'The Messengers', y:27, side:'left', kind:'card',
    eyebrow:'02 / Members', title:'Two Messengers. One Signal.', cta:'Meet them',
    body:'They don\u2019t claim mastery over the Signal. They receive it, preserve it, and carry it forward without weakening its meaning \u2014 witnesses first, performers second.' },
  { id:'music',        label:'Music',          y:42, side:'right', kind:'immersive',
    eyebrow:'03 / Immersive', title:'Enter the Tracks', cta:'Open the carousel',
    body:'Twenty-eight tracks from Rise Up, with twenty-second samples for every one. Opening this node hands the whole viewport to the carousel.' },
  { id:'transmissions',label:'Transmissions',  y:57, side:'left', kind:'card',
    eyebrow:'04 / Channel', title:'Tune to a frequency', cta:'Open the terminal',
    body:'Every signal the Messengers put out \u2014 posts, clips, releases and filed pieces \u2014 arrives here, timestamped and numbered.' },
  { id:'archive',      label:'Archive',        y:72, side:'right', kind:'immersive',
    eyebrow:'05 / Immersive', title:'The recovered collection', cta:'Open the archive',
    body:'Artwork, artifacts, lyrics, video and records. As a major destination the feed fills a large panel and the smaller node cards recede.' },
  { id:'ethos',        label:'Ethos',          y:87, side:'left', kind:'card',
    eyebrow:'06 / Ethos', title:'Sacred and Street', cta:'Read the philosophy',
    body:'Metatron\u2019s Cube next to a blueprint, an X-ray beside a manuscript. The spine sits at the centre of all of it: thirty-three vertebrae, seven nodes, one signal.' }
];

const KS_POINTS = [19, 34, 49, 64, 79, 94];

function msOf(el, name, fallback) {
  const v = getComputedStyle(el).getPropertyValue(name).trim();
  if (!v) return fallback;
  return v.endsWith('ms') ? parseFloat(v) : parseFloat(v) * 1000;
}

function NavigatorReference({ onNavigate }) {
  const stage = React.useRef(null);
  const [active, setActive] = React.useState(null);
  const [hover, setHover] = React.useState(null);
  // phase: idle | retract | travel | fire | open
  const [phase, setPhase] = React.useState('idle');
  // The connector currently drawn, and how much of it is filled (0..1).
  const [line, setLine] = React.useState({ node: null, fill: 0 });
  const [energyY, setEnergyY] = React.useState(null);
  const timers = React.useRef([]);

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  React.useEffect(() => clearTimers, []);

  // ---- THE REROUTE. Retract fully, then the energy travels the column, then it
  // fires out to the new node. Never disconnects from the system — the line goes
  // back INTO the spine rather than vanishing, and the pulse carries the focus.
  const select = (id) => {
    if (id === active) return;
    clearTimers();
    const draw = msOf(stage.current, '--connector-draw-ms', 520);
    const from = KS_NODES.find(n => n.id === active);
    const to = KS_NODES.find(n => n.id === id);

    const fire = () => {
      setLine({ node: id, fill: 0 });
      setPhase('fire');
      timers.current.push(setTimeout(() => setLine({ node: id, fill: 1 }), 20));
      timers.current.push(setTimeout(() => { setActive(id); setPhase('open'); setEnergyY(null); }, draw));
    };

    if (!from) { setEnergyY(null); fire(); return; }

    setPhase('retract');
    setLine({ node: active, fill: 0 });          // pull the fill back to the spine
    timers.current.push(setTimeout(() => {
      setPhase('travel');
      setActive(null);
      setLine({ node: null, fill: 0 });
      setEnergyY(from.y);                        // the pulse starts at the old node
      timers.current.push(setTimeout(() => setEnergyY(to.y), 30));
      timers.current.push(setTimeout(fire, draw * 0.75));
    }, draw));
  };

  const close = () => { clearTimers(); setActive(null); setPhase('idle'); setLine({ node:null, fill:0 }); };

  // ArrowUp/Down step the column, Home/End jump to its ends, Escape closes —
  // the inputs the axis end marker names.
  React.useEffect(() => {
    const onKey = (e) => {
      const i = KS_NODES.findIndex(n => n.id === active);
      if (e.key === 'Escape') return close();
      if (e.key === 'Home') { e.preventDefault(); return select(KS_NODES[0].id); }
      if (e.key === 'End') { e.preventDefault(); return select(KS_NODES[KS_NODES.length - 1].id); }
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); return select(KS_NODES[Math.min(KS_NODES.length - 1, i + 1)].id); }
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); return select(KS_NODES[Math.max(0, i < 0 ? 0 : i - 1)].id); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // ---- Geometry. The connector is drawn from measured rects, never guessed:
  // spine x, node y, and the card's own near edge.
  const [box, setBox] = React.useState({ w: 1280, h: 760 });
  React.useEffect(() => {
    const measure = () => { if (stage.current) { const r = stage.current.getBoundingClientRect(); setBox({ w: r.width, h: r.height }); } };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // THE LINE ENDS ON THE CARD'S NEAR EDGE, MEASURED. Written against a guessed
  // percentage it terminated INSIDE the card box — the card paints at z-index 25
  // and the overlay at 15, so the whole connector was drawn and then covered, which
  // looks exactly like a connector that never drew.
  const cardRef = React.useRef(null);

  // ONE GEOMETRY FUNCTION, USED BY THE PREVIEW AND BY THE ESTABLISHED LINE ALIKE.
  // They used to be computed differently — the preview from a fallback inset, the
  // real line from the card's measured rect — so the dotted route drew one path and
  // then snapped to another the moment it lit. Whatever the preview promises has to
  // stay true when it deploys, so the card is now positioned FROM this geometry
  // rather than the geometry being derived from the card.
  //
  // It is a pure function of the node and the stage: no measured card, nothing that
  // can only be known after a render. The card's height never enters it — the card
  // takes a max-height instead and scrolls its body, which is what the source does.
  const geoFor = React.useCallback((node) => {
    const w = box.w, h = box.h;
    const cardW = Math.min(400, Math.max(280, w * 0.30));
    const x0 = w / 2;
    const y0 = (node.y / 100) * h;
    const near = node.side === 'left' ? w * 0.08 + cardW : w - (w * 0.08) - cardW;
    // The head row sits level with the node, clamped off both edges of the stage.
    // The clamp reserves a NOMINAL card height rather than the measured one: a
    // measured clamp squeezed a node at 87% into a 140px sliver, and a height that
    // can only be known after a render would put the preview and the deployed line
    // on different routes again.
    const want = Math.min(320, Math.max(180, h - 114));
    const top = Math.round(Math.min(Math.max(y0 - 46, 90), Math.max(90, h - 24 - want)));
    const yEnd = top + 46;
    const elbow = x0 + (near - x0) * 0.55;
    return { x0, y0, near, top, yEnd, elbow, maxH: Math.max(180, h - top - 24) };
  }, [box.w, box.h]);

  const pathFor = (node) => {
    const g = geoFor(node);
    return 'M' + g.x0 + ' ' + g.y0 + ' H' + g.elbow + ' V' + g.yEnd + ' H' + g.near;
  };

  // The pass runs top 92% -> 8%. Entering it at the open node's height means
  // skipping the fraction already travelled, expressed as a negative delay.
  const [energyMs, setEnergyMs] = React.useState(7000);
  React.useEffect(() => { if (stage.current) setEnergyMs(msOf(stage.current, '--spine-ui-energy-ms', 7000)); }, [box.w]);
  const phaseDelay = React.useMemo(() => {
    if (phase !== 'open') return 0;
    const node = KS_NODES.find(n => n.id === active);
    if (!node) return 0;
    return -Math.round(((92 - node.y) / 84) * energyMs);
  }, [phase, active, energyMs]);
  const phaseKey = phase === 'open' ? 'from-' + active : 'idle';
  const [hasChosen, setHasChosen] = React.useState(false);
  React.useEffect(() => { if (active) setHasChosen(true); }, [active]);
  const passOn = !hasChosen || phase === 'open';

  const previewNode = hover && hover !== active ? KS_NODES.find(n => n.id === hover) : null;
  const lineNode = line.node ? KS_NODES.find(n => n.id === line.node) : null;
  const activeNode = KS_NODES.find(n => n.id === active);
  const activeIdx = KS_NODES.findIndex(n => n.id === active) + 1;

  return (
    <div ref={stage} className={active ? 'is-card' : ''}
      style={{ position:'relative', minHeight:'100svh', overflow:'hidden', background:'radial-gradient(120% 80% at 50% 30%, #0c1018 0%, #050505 68%)', '--ks-phase-delay': phaseDelay + 'ms' }}>
      <img src="../../assets/hero/nebula-lightning-4k.webp" alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity:.5, pointerEvents:'none' }} />

      {/* ---- The spine ---- */}
      <div style={{ position:'absolute', top:0, bottom:0, left:'calc(50% + var(--axis-shift))', width:'2px', transform:'translateX(-50%)', zIndex:10 }}>
        <div className="ks-anat" style={{
          position:'absolute', top:'5%', bottom:'5%', left:'50%', width:'var(--spine-anat-w)', transform:'translateX(-50%)', overflow:'hidden',
          backgroundImage:'url("../../assets/hero/spine-ui-wire.webp")', backgroundRepeat:'no-repeat', backgroundPosition:'center', backgroundSize:'auto 100%',
          opacity:'var(--spine-anat-opacity)',
          filter:'saturate(var(--spine-anat-sat)) brightness(var(--spine-anat-bright)) contrast(var(--spine-anat-contrast))',
          WebkitMaskImage:'linear-gradient(180deg, transparent, #000 9%, #000 91%, transparent)',
          maskImage:'linear-gradient(180deg, transparent, #000 9%, #000 91%, transparent)'
        }} />
        <div style={{ position:'absolute', top:'6%', bottom:'6%', left:'50%', width:'1px', transform:'translateX(-50%)',
          background:'linear-gradient(180deg, transparent, rgba(242,242,238,.5) 12%, rgba(242,242,238,.5) 88%, transparent)',
          filter:'drop-shadow(0 0 4px rgba(242,242,238,.45))', opacity:'var(--cord-opacity)' }} />

        {passOn ? <div className="ks-comet" key={phaseKey} /> : null}

        {/* The reroute pulse — a discrete lamp that travels the column between nodes. */}
        {energyY !== null ? (
          <span style={{ position:'absolute', left:'50%', top: energyY + '%', width:'14px', height:'14px', transform:'translate(-50%,-50%)', borderRadius:'50%',
            background:'radial-gradient(circle, #fff 0%, rgba(var(--node-color),.9) 50%, transparent 74%)',
            boxShadow:'0 0 18px rgba(var(--node-color),.9)',
            transition:'top calc(var(--connector-draw-ms) * .75) var(--ease-standard)', zIndex:21 }} />
        ) : null}

        {passOn ? KS_POINTS.map(y => <span key={phaseKey + y} className="ks-point" style={{ top: y + '%' }} />) : null}

        {/* ---- Nodes ---- */}
        <div style={{ position:'absolute', inset:0, width:0, zIndex:20 }}>
          {KS_NODES.map(n => {
            const isActive = active === n.id;
            const isHover = hover === n.id;
            const focused = isActive || isHover;
            const ring = isActive ? 'var(--node-ring-active)' : 'var(--node-ring)';
            return (
              <button key={n.id} type="button" className={'ks-node' + (isActive ? ' is-active' : '')}
                onMouseEnter={() => setHover(n.id)} onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(n.id)} onBlur={() => setHover(null)}
                onClick={() => select(n.id)} aria-label={n.label}
                style={{ position:'absolute', left:0, top:n.y + '%', transform:'translate(-50%,-50%)',
                  width:'var(--node-size)', height:'var(--node-size)', padding:0, background:'transparent', border:0, cursor:'pointer',
                  opacity: active && !isActive ? 'var(--node-dim-when-active)' : 1,
                  transition:'opacity var(--motion-base) var(--ease-standard)' }}>
                <span style={{ position:'absolute', inset:'-16px', borderRadius:'50%' }} />
                {passOn ? <span className="ks-ping" key={phaseKey} /> : null}
                {[1,2].map(i => (
                  <span key={i} className={'ks-ring' + (i === 2 ? ' ks-ring--2' : '')}
                    style={{ position:'absolute', top:'50%', left:'50%', width:ring, height:ring,
                      transform:'translate(-50%,-50%) scale(.4)', borderRadius:'50%',
                      border:'1px solid rgba(var(--node-color),' + (isActive ? '.7' : '.55') + ')',
                      background:'radial-gradient(circle, transparent 58%, rgba(var(--node-color),.14) 100%)',
                      boxShadow: isActive ? '0 0 22px rgba(var(--node-color),.45)' : '0 0 14px rgba(var(--node-color),.35)',
                      opacity: focused ? 1 : 0, pointerEvents:'none',
                      transition:'width var(--motion-base) var(--ease-standard), height var(--motion-base) var(--ease-standard), opacity var(--motion-base) var(--ease-standard)' }} />
                ))}
                <span style={{ position:'absolute', inset:0, borderRadius:'50%',
                  background:'radial-gradient(circle, #fff 0%, #fff 30%, rgba(var(--node-color),.6) 60%, transparent 74%)',
                  opacity: focused ? 1 : 'var(--node-idle-opacity)',
                  transform: isActive ? 'scale(1.3)' : (isHover ? 'scale(1.15)' : 'scale(1)'),
                  boxShadow: focused ? '0 0 18px rgba(var(--node-color),.85), 0 0 6px rgba(255,255,255,.95)'
                                     : '0 0 var(--node-glow) rgba(var(--node-color), var(--node-glow-a)), 0 0 2px rgba(255,255,255, var(--node-core-a))',
                  transition:'opacity var(--motion-base) var(--ease-standard), box-shadow var(--motion-base) var(--ease-standard), transform var(--motion-base) var(--ease-standard)' }}>
                  <span style={{ position:'absolute', top:'50%', left:'50%', width:'var(--node-mark-size)', height:'var(--node-mark-size)',
                    transform:'translate(-50%,-50%)', borderRadius:'50%',
                    border:(n.kind === 'immersive' ? '2px double' : '1px solid') + ' rgba(242,242,238, var(--node-mark-a))' }} />
                </span>
                {/* THE CROSSHAIR IS ONE-SIDED, and it points at the card.
                    Drawn symmetrically it put a 150px leg out of the side the card
                    is NOT on — a line leaving the spine with nothing at the end of
                    it, competing with the connector that does mean something. It
                    now grows from the node toward the node's own side only, so
                    every mark on that row reads as one gesture. */}
                <span style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', pointerEvents:'none',
                  opacity: focused ? 1 : 0, transition:'opacity var(--motion-base) var(--ease-standard)' }}>
                  <span style={{ position:'absolute', top:'50%', width:'calc(var(--reticle-w) / 2)', height:'1px',
                    ...(n.side === 'left'
                      ? { right:0, transformOrigin:'100% 50%', background:'linear-gradient(270deg, rgba(var(--node-color),.92) 0%, rgba(var(--node-color),.86) 68%, rgba(var(--node-color),.62) 100%)' }
                      : { left:0,  transformOrigin:'0% 50%',   background:'linear-gradient(90deg, rgba(var(--node-color),.92) 0%, rgba(var(--node-color),.86) 68%, rgba(var(--node-color),.62) 100%)' }),
                    transform:'translateY(-50%) scaleX(' + (isActive ? 1 : 0.62) + ') scaleY(0.6)',
                    filter:'drop-shadow(0 0 3px rgba(var(--node-color),.9)) drop-shadow(0 0 9px rgba(var(--node-color),.6)) drop-shadow(0 0 20px rgba(var(--node-color),.34))',
                    transition:'transform var(--motion-base) var(--ease-standard)' }} />
                  <span style={{ position:'absolute', top:'50%', width:'5px', height:'5px', marginTop:'-2.5px',
                    border:'1px solid rgba(var(--node-color),.65)', background:'rgba(5,5,5,.4)',
                    opacity: isActive ? 0 : 0.62,
                    transition:'opacity var(--motion-base) var(--ease-standard)',
                    ...(n.side === 'left'
                      ? { right: 'calc(var(--reticle-w) / 2 * ' + (isActive ? 1 : 0.62) + ' - 2.5px)' }
                      : { left:  'calc(var(--reticle-w) / 2 * ' + (isActive ? 1 : 0.62) + ' - 2.5px)' }) }} />
                </span>
                <span style={{ position:'absolute', top:'50%', transform:'translateY(-50%)', whiteSpace:'nowrap', pointerEvents:'none',
                  fontFamily:'var(--font-mono)', fontSize:'var(--fs-mono)', letterSpacing:'var(--tracking-label)', textTransform:'uppercase',
                  color:'var(--text-primary)', textShadow:'0 0 6px rgba(5,5,5,.95), 0 0 12px rgba(5,5,5,.9), 0 1px 2px rgba(5,5,5,1)',
                  opacity: isHover && !isActive ? 1 : 0, transition:'opacity var(--motion-base) var(--ease-standard)',
                  ...(n.side === 'left' ? { right:'var(--node-label-offset)', textAlign:'right' } : { left:'var(--node-label-offset)', textAlign:'left' }) }}>
                  {n.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ---- Connectors. Drawn from measured coordinates; the fill is a dashoffset. ---- */}
      <svg className="ks-conn" viewBox={'0 0 ' + box.w + ' ' + box.h} preserveAspectRatio="none">
        {previewNode ? (
          <path className="ks-line is-preview" d={pathFor(previewNode)} strokeDasharray="4 6" />
        ) : null}
        {lineNode ? (
          <>
            <path className={'ks-line' + (lineNode.id === active ? ' is-established' : '')} d={pathFor(lineNode)} pathLength="1"
              strokeDasharray="1" strokeDashoffset={1 - line.fill} />
            <path className="ks-head" d={pathFor(lineNode)} pathLength="1"
              strokeDasharray="0.08 1" strokeDashoffset={1 - line.fill}
              opacity={line.fill > 0 && line.fill < 1 ? 1 : (phase === 'fire' ? 1 : 0)} />
          </>
        ) : null}
      </svg>

      {/* ---- The card, after the line lands ---- */}
      {activeNode ? (
        <div ref={cardRef} className={'ks-card-wrap is-open' + (activeNode.side === 'left' ? ' side-left' : '')}
          style={{ position:'absolute', top: geoFor(activeNode).top + 'px', zIndex:25,
            ...(activeNode.side === 'left' ? { left:'8%' } : { right:'8%' }) }}>
          <SpineCard index={activeIdx} total={KS_NODES.length} side={activeNode.side}
            eyebrow={activeNode.eyebrow} title={activeNode.title} cta={activeNode.cta} onClose={close}
            style={{ maxHeight: geoFor(activeNode).maxH + 'px' }}>
            <p style={{ margin:0 }}>{activeNode.body}</p>
          </SpineCard>
        </div>
      ) : null}

      <p className="label" style={{ position:'absolute', left:'var(--space-6)', bottom:'var(--space-6)', zIndex:30, margin:0,
        color:'var(--color-gray-400)', opacity: active || hover ? 0 : 1,
        transition:'opacity var(--motion-slow) var(--ease-standard)', pointerEvents:'none' }}>Click a node, or use the arrow keys</p>

    </div>
  );
}

Object.assign(window, { NavigatorReference, KS_NODES });
