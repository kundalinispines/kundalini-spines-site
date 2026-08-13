// Content lifted verbatim from data/tracks.json, data/transmissions.json,
// data/archive.json and data/site.json in kundalinispines/kundalini-spines-site.
const KS_TRACKS = [
  { id:'graveyard-shift', title:'Graveyard Shift', artwork:'../../assets/music/graveyard-shift-cover.webp', duration:'4:01', accent:'#34455B', oneLiner:'A midnight transmission from the place where the living and the lost clock in together.', description:"Graveyard Shift is a transmission from the hours nobody else is awake for — about showing up anyway, carrying a weight that doesn't clock out when the sun comes up." },
  { id:'dark-meta', title:'Dark Meta', artwork:'../../assets/music/dark-meta-cover.webp', duration:'3:47', accent:'#7E2630', oneLiner:'A meditation on the architecture behind the architecture — the pattern beneath the pattern.', description:'Dark Meta moves through the geometry most people walk past without seeing — the structure underneath the structure.' },
  { id:'blue-pills', title:'Blue Pills', artwork:'../../assets/music/blue-pills-cover.webp', duration:'4:24', accent:'#4B4E8F', oneLiner:'The comfortable version of the truth, and what it costs to keep taking it.', description:"Blue Pills sits inside the moment right before a choice — the pull toward the easier story. It never tells you which way to go." },
  { id:'skeleton-keys', title:'Skeleton Keys', artwork:'../../assets/music/skeleton-keys-cover.webp', duration:'5:01', accent:'#8A7148', oneLiner:'One shape that opens every door it was never meant to.', description:"Skeleton Keys is about the access nobody's supposed to have — and what you find once you're through the door." },
  { id:'the-33rd-floor', title:'33rd Floor', artwork:'../../assets/music/the-33rd-floor-cover.webp', duration:'4:13', accent:'#1F4A4A', oneLiner:"The floor the building doesn't officially have.", description:"The 33rd Floor sits exactly where the project's own architecture points — the vertebra at the very top, past where most elevators stop." },
  { id:'the-great-work', title:'The Great Work', artwork:'../../assets/music/the-great-work-cover.webp', duration:'3:13', accent:'#8A7148', oneLiner:'Alchemy was never really about gold.', description:'The Great Work borrows its title from the oldest transformation myth there is — turning pressure into something worth keeping.' },
  { id:'spine-glow', title:'Spine Glow', artwork:'../../assets/music/spine-glow-cover.webp', duration:'2:34', accent:'#1F4A4A', oneLiner:'The signal made visible, one vertebra at a time.', description:"Spine Glow is the clearest statement of the whole project's core idea — the spine isn't just structure, it's the receiver." },
  { id:'vision-quest', title:'Vision Quest', artwork:'../../assets/music/vision-quest-cover.webp', duration:'5:29', accent:'#34455B', oneLiner:"Some answers only show up after you've been lost long enough.", description:'Vision Quest treats confusion as the price of admission — the clarity only comes after you stop looking for a shortcut.' },
  { id:'x-files', title:'X-Files', artwork:'../../assets/music/x-files-cover.webp', duration:'4:09', accent:'#7E2630', oneLiner:'The truth was never really out there — it was already in the signal.', description:'X Files chases the same static everyone else ignores, convinced the interference itself is the message.' },
  { id:'scorpion-road', title:'Scorpion Road', artwork:'../../assets/music/scorpion-road-cover.webp', duration:'3:24', accent:'#34455B', oneLiner:'The path that bites back the further you walk it.', description:'Scorpion Road is a travel record for a route that gets more dangerous with each mile, not less.' }
];

const KS_NAV = [
  { label:'Home', href:'home' },
  { label:'Navigator', href:'navigator' },
  { label:'Transmissions', href:'transmissions' },
  { label:'Archive', href:'archive' },
  { label:'About', href:'about' }
];

const KS_SOCIAL = [
  { label:'Instagram', href:'https://www.instagram.com/kundalinispines/' },
  { label:'TikTok' },
  { label:'X', href:'https://x.com/KundaliniSpines' },
  { label:'YouTube', href:'https://www.youtube.com/@KundaliniSpines' },
  { label:'Spotify' }
];

const KS_TRANSMISSIONS = [
  { id:'004', channel:'Filed', date:'2026-07-28', title:'May 26th completes the library', body:'The last missing sample is in. Twenty-eight tracks, twenty-eight covers, twenty-eight pieces of moving artwork, twenty-eight samples — the Rise Up library is closed.', media:'../../assets/music/spine-glow-cover.webp', mediaAlt:'Spine Glow cover art — an illuminated spinal column rendered as a signal receiver.' },
  { id:'003', channel:'Filed', date:'2026-07-28', title:'Brutus, replaced', body:'New cover and new moving artwork for Brutus. The throne, the skull, the severed marble head at its feet. Some betrayals do not need a bridge or a hook — just the moment right before the knife.', media:'../../assets/music/x-files-cover.webp', mediaAlt:'Cover art placeholder for the Brutus transmission.' },
  { id:'002', channel:'Filed', date:'2026-07-21', title:'Thirty-three and seven', body:'Thirty-three vertebrae. Seven nodes. One signal moving through the whole structure. Everything here is built on that count — it is not decoration, it is the architecture.', media:'../../assets/music/the-33rd-floor-cover.webp', mediaAlt:'33rd Floor cover art.' },
  { id:'001', channel:'Filed', date:'2026-07-01', title:'Source Unknown', body:'Some signals arrive before the words that explain them. This one came first — masked, hooded, standing at the edge between fog and geometry.', media:'../../assets/messengers/messenger-b-portrait.jpg', mediaAlt:'A masked Messenger against a blueprint-and-spine backdrop.' }
];

const KS_CHANNELS = [
  { id:'all', label:'All' }, { id:'x', label:'X' }, { id:'instagram', label:'Instagram' },
  { id:'tiktok', label:'TikTok' }, { id:'youtube', label:'YouTube' },
  { id:'spotify', label:'Spotify' }, { id:'filed', label:'Filed' }
];

const KS_ARCHIVE_CATEGORIES = ['All','Artwork','Artifacts','Lyrics','Videos','Selected Records','Promotional Visuals','Concept Pieces'];

const KS_ARCHIVE = [
  { id:'archive-001', category:'Artwork', title:'The Spine Between Them', description:'Two Messengers, one signal, and the geometry that connects them.', media:'../../assets/hero/messengers-hero-duo.jpg' }
];

Object.assign(window, { KS_TRACKS, KS_NAV, KS_SOCIAL, KS_TRANSMISSIONS, KS_CHANNELS, KS_ARCHIVE, KS_ARCHIVE_CATEGORIES });
