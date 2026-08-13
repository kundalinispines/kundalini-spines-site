const { FilterChip, ArchiveCard, SectionHeader, EmptyState } = window.KundaliniSpinesDesignSystem_22e3e6;

function ArchiveScreen() {
  const [cat, setCat] = React.useState('All');
  const entries = window.KS_ARCHIVE.filter(e => cat === 'All' || e.category === cat);
  return (
    <section className="section container" style={{ paddingTop:'calc(var(--space-24) + 3rem)' }}>
      <SectionHeader level={1} eyebrow="Archive" title="Archive" description="The recovered collection &mdash; artwork, artifacts, lyrics, video, and records. Filter by category below." />
      <div style={{ display:'flex', flexWrap:'wrap', gap:'var(--space-3)', marginBottom:'var(--space-8)' }}>
        {window.KS_ARCHIVE_CATEGORIES.map(c => <FilterChip key={c} active={cat === c} onClick={() => setCat(c)}>{c}</FilterChip>)}
      </div>
      {entries.length ? (
        <div className="grid grid--3">
          {entries.map(e => <ArchiveCard key={e.id} media={e.media} category={e.category} title={e.title} description={e.description} alt={e.title} />)}
        </div>
      ) : (
        <EmptyState label="Archive" message={'No archive entries in ' + cat + ' yet.'} />
      )}
    </section>
  );
}

Object.assign(window, { ArchiveScreen });
