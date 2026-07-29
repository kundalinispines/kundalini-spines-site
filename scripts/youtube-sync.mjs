// YouTube -> data/youtube-pending.json
//
// Staging job. It NEVER writes data/transmissions.json — that file stays
// hand-authored, so nothing this script does can clobber a body you wrote.
// It reads transmissions.json only to check whether a video has already been
// published, and it writes new finds into data/youtube-pending.json for you
// to move across by hand.
//
// Three properties of YouTube's feed this is built around, all verified
// against the real feed rather than assumed:
//
//   1. <updated> is NOT a publish signal. YouTube bumps it when view counts
//      or metadata change. Every one of the nine existing videos had an
//      <updated> ten months newer than its <published>. Keying on it would
//      make this job re-stage videos forever. Only <published> is used.
//   2. The feed returns at most the latest 15 entries. Anything older can
//      never be recovered here — it has to be hand-written.
//   3. Shorts carry a /shorts/ link, not /watch?v=. The <link rel="alternate">
//      href is used verbatim so the right URL form survives.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const PENDING_PATH = 'data/youtube-pending.json';
const LIVE_PATH    = 'data/transmissions.json';

const state = JSON.parse(readFileSync(PENDING_PATH, 'utf8'));
const channelId = state.channelId;
const cutoff    = state.cutoff;                 // YYYY-MM-DD, inclusive
if (!channelId) throw new Error(`${PENDING_PATH}: channelId is missing`);
if (!/^\d{4}-\d{2}-\d{2}$/.test(String(cutoff))) {
  throw new Error(`${PENDING_PATH}: cutoff must be YYYY-MM-DD, got ${cutoff}`);
}

const seen    = new Set(Array.isArray(state.seen) ? state.seen : []);
const pending = Array.isArray(state.pending) ? state.pending : [];

// Anything already published on the site is not a new find, even if someone
// cleared it out of `seen`.
if (existsSync(LIVE_PATH)) {
  const live = JSON.parse(readFileSync(LIVE_PATH, 'utf8'));
  for (const e of (live.entries || [])) {
    const m = /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([\w-]{11})/.exec(e.href || '');
    if (m) seen.add(m[1]);
  }
}
for (const p of pending) if (p._videoId) seen.add(p._videoId);

const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`;
const res = await fetch(feedUrl, { headers: { 'user-agent': 'kundalini-spines-site sync' } });
if (!res.ok) throw new Error(`feed fetch failed: HTTP ${res.status}`);
const xml = await res.text();

const unescapeXml = (s) => String(s)
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
  .replace(/&amp;/g, '&');

const pick = (block, tag) => {
  const m = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`).exec(block);
  return m ? unescapeXml(m[1].trim()) : '';
};

const blocks = xml.split('<entry>').slice(1).map((b) => b.split('</entry>')[0]);
if (!blocks.length) {
  console.log('Feed parsed but contained no <entry> elements. Nothing to do.');
}

const found = [];
for (const b of blocks) {
  const videoId = pick(b, 'yt:videoId');
  if (!videoId) continue;

  const published = pick(b, 'published');          // full ISO timestamp
  const date = published.slice(0, 10);             // YYYY-MM-DD
  if (!date) continue;

  if (date < cutoff) continue;                     // string compare is safe on ISO dates
  if (seen.has(videoId)) continue;

  const linkMatch = /<link[^>]*rel="alternate"[^>]*href="([^"]+)"/.exec(b);
  const href = linkMatch ? unescapeXml(linkMatch[1]) : `https://www.youtube.com/watch?v=${videoId}`;
  const thumbMatch = /<media:thumbnail[^>]*url="([^"]+)"/.exec(b);

  found.push({
    id: 'TBD',
    channel: 'youtube',
    date,
    title: pick(b, 'title') || pick(b, 'media:title') || '(untitled)',
    body: '',
    href,
    _videoId: videoId,
    _publishedUtc: published,
    _isShort: /\/shorts\//.test(href),
    _thumbnail: thumbMatch ? unescapeXml(thumbMatch[1]) : '',
    _todo: 'Write `body`, set `id` to the next log number, then move this object to the TOP of `entries` in data/transmissions.json and delete it from here. Keys starting with _ are notes for you and must not be copied across.',
  });
  seen.add(videoId);
}

if (!found.length) {
  console.log(`No new videos published on or after ${cutoff}. ${blocks.length} entries in feed, all already known.`);
  process.exit(0);
}

// Newest first, matching how transmissions.json is ordered by hand.
found.sort((a, b) => (a._publishedUtc < b._publishedUtc ? 1 : -1));

state.seen = [...seen].sort();
state.pending = [...found, ...pending];
writeFileSync(PENDING_PATH, JSON.stringify(state, null, 2) + '\n');

console.log(`Staged ${found.length} new video(s):`);
for (const f of found) console.log(`  ${f.date}  ${f.title}  ${f.href}`);
