const { Terminal, ChannelTab, TerminalRow, Label } = window.KundaliniSpinesDesignSystem_22e3e6;

function TransmissionsScreen() {
  const [channel, setChannel] = React.useState('all');
  const [open, setOpen] = React.useState('004');
  const all = window.KS_TRANSMISSIONS;
  const rows = channel === 'all' ? all : all.filter(e => e.channel.toLowerCase() === channel);
  const count = (id) => id === 'all' ? all.length : all.filter(e => e.channel.toLowerCase() === id).length;
  return (
    <section className="section container" style={{ paddingTop:'calc(var(--space-24) + 3rem)' }}>
      <div style={{ marginBottom:'var(--space-8)' }}>
        <Label block>Transmissions</Label>
        <h1 className="text-showcase" style={{ fontFamily:'var(--font-showcase)', fontWeight:'var(--showcase-wght)', fontStretch:'var(--showcase-stretch)', fontVariationSettings:'"wdth" 110, "wght" 800', letterSpacing:0, fontSize:'var(--fs-h1)', lineHeight:'var(--lh-tight)', margin:'var(--space-2) 0 var(--space-3)', textTransform:'uppercase' }}>Tune to a frequency</h1>
        <p style={{ color:'var(--text-secondary)', maxWidth:'64ch', margin:0 }}>Every signal the Messengers put out &mdash; posts, clips, releases and filed pieces &mdash; arrives here, timestamped and numbered. Select a channel to isolate it, or leave it on <em>All</em> and take the whole band.</p>
      </div>

      <Terminal
        status={rows.length + ' filed'}
        readout={'> ' + (rows.length ? rows.length + ' signals on this frequency' : 'no signal on this frequency')}
        channels={window.KS_CHANNELS.map(c => (
          <ChannelTab key={c.id} selected={channel === c.id} count={count(c.id)} onClick={() => setChannel(c.id)}>{c.label}</ChannelTab>
        ))}>
        {rows.length === 0 ? (
          <p style={{ fontFamily:'var(--font-mono)', fontSize:'0.72rem', letterSpacing:'0.2em', textTransform:'uppercase', color:'var(--color-gray-400)', textAlign:'center', padding:'var(--space-16) var(--space-4)', maxWidth:'none', margin:'0 auto' }}>
            No signal on this frequency<span style={{ display:'block', letterSpacing:'0.08em', marginTop:'var(--space-3)', color:'var(--color-gray-500)' }}>Nothing has been filed here yet.</span>
          </p>
        ) : rows.map(e => (
          <TerminalRow key={e.id} time={e.date + ' / ' + e.id} channel={e.channel} title={e.title}
            open={open === e.id} onToggle={() => setOpen(open === e.id ? null : e.id)}>
            <div style={{ border:'1px solid var(--color-gray-700)', alignSelf:'start' }}>
              <img src={e.media} alt={e.mediaAlt} style={{ width:'100%', display:'block' }} />
            </div>
            <div>
              <p style={{ margin:'0 0 var(--space-4)', color:'var(--text-secondary)' }}>{e.body}</p>
              <a href="#" onClick={ev => ev.preventDefault()} style={{ fontFamily:'var(--font-mono)', fontSize:'0.7rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-primary)', textDecoration:'none', borderBottom:'1px solid var(--color-gray-600)', paddingBottom:'2px' }}>Open transmission</a>
            </div>
          </TerminalRow>
        ))}
      </Terminal>
    </section>
  );
}

Object.assign(window, { TransmissionsScreen });
