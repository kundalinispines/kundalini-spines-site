const { Masthead, FeatureHead, PullQuote, Cut, MessengerCard, Button } = window.KundaliniSpinesDesignSystem_22e3e6;

// The About page as a magazine feature: Anton masthead over a graded photograph,
// numbered sections, floated cuts the prose wraps around, two-column prose-only
// sections, and a full-bleed plate.
function AboutScreen() {
  return (
    <div style={{ position:'relative' }}>
      <div aria-hidden="true" style={{ position:'fixed', inset:0, zIndex:60, pointerEvents:'none', opacity:0.07, mixBlendMode:'overlay', backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />

      <Masthead eyebrow="The Feature" words={['TWO','MESSENGERS']}
        standfirst="They don't claim mastery over the Signal. They receive it, preserve it, and carry it forward without weakening its meaning."
        media="../../assets/about/hero-corridor-duo.webp"
        alt="Two hooded Messengers of Kundalini Spines in a corridor, lit from behind."
        cue="Scroll" />

      <div style={{ maxWidth:'var(--container-max)', marginInline:'auto', paddingInline:'var(--container-pad)' }}>
        <section style={{ marginTop:'clamp(60px, 9vh, 120px)' }}>
          <FeatureHead num="01">Source Unknown</FeatureHead>
          <p style={{ margin:0, maxWidth:'70ch', fontSize:'clamp(1.2rem, 1.9vw, 1.6rem)', lineHeight:1.45, color:'var(--text-primary)', textShadow:'0 0 3px rgba(3,4,15,.98), 0 1px 2px rgba(3,4,15,.92)' }}>
            Some signals arrive before the words that explain them. This one came first &mdash; masked, hooded, standing at the edge between fog and geometry.
          </p>
        </section>

        <section style={{ marginTop:'clamp(60px, 9vh, 120px)' }}>
          <FeatureHead num="02">Sacred and Street</FeatureHead>
          <div style={{ maxWidth:'92ch', fontSize:'1.0625rem', lineHeight:1.78, color:'var(--text-secondary)' }}>
            <Cut src="../../assets/messengers/messenger-wet-street-night.webp" alt="A Messenger on a wet street at night." side="right" />
            <p style={{ maxWidth:'none', margin:'0 0 1.35em', textShadow:'0 0 3px rgba(3,4,15,.98), 0 1px 2px rgba(3,4,15,.92)' }}>
              The project moves between the sacred and the street &mdash; Metatron&rsquo;s Cube next to a blueprint, an X-ray beside a manuscript. Ancient knowledge, modern static. The spine sits at the center of all of it: thirty-three vertebrae, seven nodes, one signal moving through the whole structure.
            </p>
            <PullQuote>None of it is decoration. Every symbol carries weight, or it doesn&rsquo;t appear at all.</PullQuote>
            <p style={{ maxWidth:'none', margin:'0 0 1.35em', textShadow:'0 0 3px rgba(3,4,15,.98), 0 1px 2px rgba(3,4,15,.92)' }}>
              Nothing here is meant to be fully explained &mdash; only received, and decoded at whatever pace each listener is ready for.
            </p>
            <div style={{ clear:'both' }} />
          </div>
        </section>

        <section style={{ marginTop:'clamp(60px, 9vh, 120px)' }}>
          <FeatureHead num="03">The Messengers</FeatureHead>
          <div className="grid grid--2">
            <MessengerCard portrait="../../assets/messengers/messenger-a-portrait.jpg" archetype="The Seeker" bio="Receives what others miss. Reads the pattern before the sentence." alt="Messenger of Kundalini Spines, masked and hooded." />
            <MessengerCard portrait="../../assets/messengers/messenger-b-portrait.jpg" archetype="The Alchemist" bio="Turns pressure into record. Carries what the Signal leaves behind." alt="Messenger of Kundalini Spines, masked and hooded, arms crossed." />
          </div>
        </section>
      </div>

      <div style={{ position:'relative', marginInline:'calc(50% - 50vw)', width:'100vw', maxWidth:'100vw', overflow:'hidden', marginTop:'clamp(60px, 9vh, 120px)', borderBlock:'1px solid rgba(214,213,208,.14)' }}>
        <img src="../../assets/messengers/messenger-duo-burning-city.webp" alt="The two Messengers before a burning skyline." style={{ width:'100%', height:'auto', display:'block' }} />
        <span aria-hidden="true" style={{ content:'', position:'absolute', inset:0, pointerEvents:'none', background:'linear-gradient(180deg, #03040F 0%, rgba(3,4,15,0) 22%, rgba(3,4,15,0) 78%, #03040F 100%)' }} />
      </div>

      <div style={{ maxWidth:'var(--container-max)', marginInline:'auto', paddingInline:'var(--container-pad)' }}>
        <section style={{ marginTop:'clamp(60px, 9vh, 120px)' }}>
          <FeatureHead num="04">What a Transmission Is</FeatureHead>
          <div style={{ columns:2, columnGap:'clamp(28px, 4vw, 56px)', columnRule:'1px solid var(--color-gray-700)', fontSize:'1.0625rem', lineHeight:1.78, color:'var(--text-secondary)' }}>
            <p style={{ breakInside:'avoid-column', maxWidth:'none', margin:'0 0 1.35em', textShadow:'0 0 3px rgba(3,4,15,.98), 0 1px 2px rgba(3,4,15,.92)' }}>Numbered pieces called Transmissions carry the Signal forward &mdash; visual, lyrical, sometimes both. Each one is filed once and never reused.</p>
            <p style={{ breakInside:'avoid-column', maxWidth:'none', margin:0, textShadow:'0 0 3px rgba(3,4,15,.98), 0 1px 2px rgba(3,4,15,.92)' }}>Every signal is timestamped and numbered, and every one keeps its own shareable URL rather than living inside a modal.</p>
          </div>
        </section>

        <section style={{ marginTop:'clamp(40px, 6vh, 72px)', borderTop:'1px solid var(--border-subtle)', paddingTop:'clamp(28px, 4vh, 44px)', paddingBottom:'clamp(40px, 6vh, 72px)' }}>
          <PullQuote variant="signoff">Decode the transmission.</PullQuote>
          <p style={{ margin:'var(--space-3) 0 var(--space-6)', maxWidth:'none', fontFamily:'var(--font-mono)', fontSize:'var(--fs-mono)', letterSpacing:'0.22em', textTransform:'uppercase', color:'var(--text-secondary)' }}>Collaboration &amp; press</p>
          <Button variant="ghost" href="mailto:kundalinispines@gmail.com">kundalinispines@gmail.com</Button>
        </section>
      </div>
    </div>
  );
}

Object.assign(window, { AboutScreen });
