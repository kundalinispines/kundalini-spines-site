# Kundalini Spines — Session Handoff 5

**Date:** July 29, 2026
**Supersedes:** nothing wholesale, but it **corrects four claims in HANDOFF 4** — see below.
`HANDOFF 3.md` and `HANDOFF 4.md` are both still required reading for everything they own.
**Status:** Site is under git and pushed to GitHub. Newsletter is live on Buttondown.
Three of five social links are real. Pages deploys succeed but the published URL 404s — unresolved.

* * *

## Corrections to HANDOFF 4 — read first

HANDOFF 4 was written before the repo existed and before the accounts were confirmed. Four of its statements are now wrong, and two of them would cause real wasted effort:

**1\. "There is no git repo. Nothing is recoverable from history. Deletions are permanent."**
False. The repo exists, has a remote, and is pushed. `setup/init-git.*` did its job between HANDOFF 4 and this session. **HANDOFF 4's "re\-snapshotting is the single highest\-value housekeeping job right now" is therefore obsolete** — do not spend a session on it. The `ks-backup-*.zip` files are superseded by git and are gitignored.

The 885 MB masters folder is still unbacked\-up, lives outside the project directory, and is correctly gitignored. That part of HANDOFF 4 stands.

**2\. `kundalinispines@gmail.com` is not a placeholder.** Owner confirmed it works, July 29 2026. `data/site.json` now records the confirmation and the date. Described as valid "for the time being" — if a custom domain lands, this becomes an address to *migrate*, not a blank to fill.

**3\. Social links are no longer all `href="#"`.** Instagram, YouTube and X are live. See below.

**4\. "The obvious next win is YouTube RSS, since it is free and keyless."** Free and keyless for a *server*. Not reachable from this site's JavaScript. See "YouTube RSS" below — this is the correction most likely to save someone a wasted afternoon.

* * *

## What changed this session

| Area | Before | Now |
| --- | --- | --- |
| `data/site.json` paths | `/music`, `/about`, `/transmissions`, `/archive` — all four dead | `/#tracks`, `/about.html`, `/transmissions.html`, `/archive.html` |
| Footer platform list | index had 4, other 5 pages had a *different* 4 | all six identical, five platforms, matching `transmissions.json` `channels[]` |
| Instagram / YouTube / X | `href="#"` | live URLs, tracking params stripped |
| Newsletter | `setTimeout` stub that sent nothing | live Buttondown integration |
| Contact email | flagged as placeholder | confirmed, dated, recorded |
| git | (believed absent) | 2 commits pushed before this session, 1 pushed during it — `cfbb704` |

Nine files changed in commit `cfbb704`\: `data/site.json`, `index.html`, `about.html`, `archive.html`, `transmissions.html`, `transmissions/001.html`, `archive/artwork/001.html`, `js/newsletter.js`, `css/components.css`.

* * *

## Newsletter — Buttondown

Newsletter username: `kundalinispines`. Endpoint:
`https://buttondown.com/api/emails/embed-subscribe/kundalinispines`

Free tier, **100\-subscriber cap**. Two real test signups have been made and both worked; they count against the cap and can be deleted from the dashboard.

Chosen over Kit (10,000 free subscribers) on one ground: **Kit brands its emails and forms on the free tier, Buttondown does not.** On a site whose `tokens.css` forbids `--color-moonlight` in UI chrome, a third\-party logo on every send is a real cost, and undoing it later costs $33/month.

### The two findings — measured, do not re\-derive

**1\. Buttondown's embed\-subscribe endpoint sends no CORS headers to this origin.** A `fetch()` to it from the site's own JavaScript is blocked by the browser. Confirmed by two real signups, both of which travelled the native\-POST path.

**2\. A JS fallback that submits after `await` gets popup\-blocked.** The first version tried `fetch` and called `form.submit()` in the `catch`. That works, but it fires outside the user\-gesture chain, so with `target="_blank"` the browser treats the new tab as a popup. The owner had to click "Allow". **Anyone who dismisses that prompt — or whose browser blocks popups silently — clicks Subscribe and sees nothing happen at all.**

### How it is built now

`index.html`'s form carries a real `action` and `method`. `js/newsletter.js` does exactly one thing: it calls `preventDefault()` **only** when the email is invalid. A valid submit is the browser's own native, synchronous POST inside the click. It cannot be popup\-blocked and cannot silently fail. `target="_blank"` was removed deliberately.

**Consequence, accepted knowingly:** the visitor leaves the site and lands on Buttondown's confirmation page. That is the price of a signup that always works.

### Do not do these

- **Do not reintroduce `fetch` with `mode: 'no-cors'`** to keep visitors on the page. The response is opaque — `status` is always `0`, `ok` is always `false` — so you cannot distinguish a real signup from a rejection. The only message you could show is a guess, and it would be a lie every time the address is malformed, already subscribed, or over the 100 cap. This form never claims a subscription it cannot observe.
- **Do not re\-add `target="_blank"`.** That is the popup bug.
- **Do not remove `action`/`method` from the form.** They are what makes it work with JS off.

The only honest way to keep visitors on the page is a server\-side proxy returning a real status. That needs a host that runs code — a **hosting** decision, not a JavaScript one.

The full reasoning is duplicated as a comment block at the top of `js/newsletter.js`, because that is where someone will be standing when they think about "simplifying" it.

### Deliverability — one good data point, not yet settled

Buttondown's confirmation email **landed in the main inbox, not spam** (owner\-checked, July 29 2026). That was the largest risk hanging over the integration and it came back clean.

Treat it as encouraging rather than closed. It is a single delivery, almost certainly Gmail\-to\-Gmail, which is the most forgiving case there is. Outlook and Yahoo filter new senders harder. **A second test to a non\-Gmail address would actually settle it.**

If spam does turn up later as the list grows, the fix is custom\-domain sending with proper SPF/DKIM — which Buttondown supports on the free tier and which becomes possible as soon as `kundalinispines.com` has DNS configured. That is the same prerequisite as publishing the site, so both unlock together.

## Social links

| Platform | State | Verified how |
| --- | --- | --- |
| YouTube | `https://www.youtube.com/@KundaliniSpines` | **Independently fetched.** Channel ID `UC9Nw6WA3ipifJ2YUZICflRg`, bio "Hip hop from the spirit form." |
| Instagram | `https://www.instagram.com/kundalinispines/` | Owner\-supplied only — Instagram blocks automated reads |
| X | `https://x.com/KundaliniSpines` | Owner\-supplied only — x.com blocks automated reads |
| TikTok | `href="#"` — no account | — |
| Spotify | `href="#"` — no artist profile | — |

`data/site.json` records this verification asymmetry per platform so a later session does not assume all three were checked equally. Worth confirming Instagram and X in a private browser window — that catches a profile that is live for the owner but restricted for everyone else.

Share\-tracking parameters were stripped from both supplied URLs: Instagram's `?igsh=` and X's `?s=20`. Those tie back to the owner's share session and should never sit in a public footer.

**TikTok and Spotify stay in the footers as dead links by owner's decision**, so the footer row keeps matching the Transmissions channel list. Revisit if it bothers anyone; `site.json` holds the canonical order, so removing or restoring them is mechanical.

`data/site.json` is the **record**, not the source — each page's `<ul class="footer__social">` is hand\-written and must be kept in sync by hand. Six files, one order. A note saying so is in the JSON.

* * *

## Deployment — GitHub Pages

Remote: `https://github.com/kundalinispines/kundalini-spines-site.git`, branch `main`.
`.github/workflows/deploy-pages.yml` runs on every push to `main`.

### Pages is DISABLED — nothing has ever been served

Confirmed July 29 2026 in Settings → Pages: *"GitHub Pages is currently disabled. Select a source below to enable GitHub Pages for this repository."* The deploy workflow has been handing its artifact to a feature that is switched off, which is why `kundalinispines.github.io/kundalini-spines-site/` 404s.

**Treat the three "successful" workflow runs as unconfirmed.** They were read from a summary of the Actions page and do not square with Pages being disabled — `deploy-pages` normally fails in that state. Check the run logs directly rather than trusting that claim.

### Deliberately not enabled yet — this is a decision, not an oversight

`kundalinispines.com` is registered, but the DNS details were not available this session. Enabling Pages before DNS is configured buys only a broken URL (project subpath, see below) or an unreachable one (custom domain set, DNS not pointing). Neither is worth publishing.

**The sequence when the DNS info arrives:**

1. Settings → Pages → **Source: GitHub Actions** (not "Deploy from a branch" — the workflow does the building)
2. Set **Custom domain** to `kundalinispines.com` and save
3. Add the DNS records GitHub shows — four `A` records for the apex, or a `CNAME` for `www`
4. Once DNS resolves, tick **Enforce HTTPS**
5. Enabling does not republish on its own — push a commit, or Actions → Run workflow (`workflow_dispatch` is configured)

A `CNAME` file will appear in the repo root. Expected — leave it. It is not in the deploy workflow's `tar` excludes, so it flows through correctly.

The first deploy can take a few minutes to start serving even after the run goes green. A 404 immediately after is not yet a failure.

### The repo is public, and the workflow assumes it is not

`deploy-pages.yml` states in its own comments: *"All of that is fine in a private repo and none of it should be readable at a public URL."* The `tar` excludes do keep the handoffs, `docs/`, and the test harnesses out of the **published site** — and there is a deliberate fail\-the\-build check if one slips through, which is good design worth keeping.

But **the repository itself is public**, so all of it is readable at github.com right now: the handoffs' local Windows paths, the internal planning docs, and the two Higgsfield element IDs. Decide one of: make the repo private, or accept those files are public and stop treating them as internal.

Note the interaction — **Pages from a private repo requires GitHub Pro or Team.** On a free account, going private turns the site off.

Leftover to ignore: `.git/FETCH_HEAD` points at `github.com/kundalinispines/kundalini-spines`, a different repo at an unrelated commit. That URL 404s — an abandoned first attempt.

## YouTube RSS — harder than HANDOFF 4 implies

The feed is real and needs no key:
`https://www.youtube.com/feeds/videos.xml?channel_id=UC9Nw6WA3ipifJ2YUZICflRg`

**But YouTube's RSS endpoint sends no CORS headers either.** A `fetch()` from `js/transmissions.js` will be blocked no matter how it is written. The feed is free and keyless *for a server*. This site has none.

Two routes:

1. **Build step.** A GitHub Action pulls the feed on a schedule and writes entries into `data/transmissions.json` at deploy time. This is the one that fits — it preserves the rule that the whole page derives from that one array, and `.github/workflows/` already exists. It does mean the site acquires a build step, which the project has so far avoided.
2. **Proxy.** Needs a host that runs code. Same dependency as the newsletter proxy — if one is ever built, both problems are solved at once.

Whichever route: **push into the existing entry shape, do not render separate markup.**

Also unmeasured: whether the channel has any videos yet. If it is empty, this work has nothing to show and can wait.

* * *

## Still open

Carried forward, minus what this session closed:

- **Domain: CLOSED, not open.** `kundalinispines.com` is registered to the project, confirmed July 29 2026. The string sitting in `sitemap.xml` and `robots.txt` was written as a placeholder and turned out to be the real domain — those files are already correct. Both now say so in their comments, along with a warning not to submit the sitemap to a search engine until the site actually resolves at that host. What remains is **DNS configuration**, not a decision.
- **Buttondown deliverability: mostly closed.** Confirmation email reached the main inbox. Outstanding only as a second test to a non\-Gmail address — see the Newsletter section.
- **`explicit` is `null` on all 28 tracks.** Owner's decision: leave null for now. Nothing renders it today.
- **Streaming links** — `spotify` / `appleMusic` / `youtubeMusic` / `stream` all `null` across all 28.
- **`data/releases.json` is entirely `PLACEHOLDER`** — slug, title, date, cover, all four streaming links. Nothing reads it yet.
- **Download links** \+ Stripe or Gumroad.
- **TikTok and Spotify accounts** do not exist. Both remain in the footers as dead links by owner's decision.
- **Accent hue collision** — may\-26th / blue\-pills, and uzi\-fruit / the\-33rd\-floor. Not adjacent in the running order, so nothing reads as repetitive yet.
- **Video takes** chosen by name\-matching the approved still; most tracks have 2–4 takes and others may still be wrong.
- **May 26th's cover→video crossfade has still never been watched.** It is the one still→video pair in the set nobody has seen.

Housekeeping from HANDOFF 4 still stands, **except** that git now makes deletion recoverable — so the "keep it because there is no history" argument no longer applies to the 27 placeholder `.jpg` covers, `full-zoom-cover.webp`, or the review mockups. `js/music-page.js` and `js/audio-player.js` are still kept deliberately as the reference for a future all\-tracks directory page; `.gitignore` documents why, so they survive a tidy\-up.

The device bridge still cannot delete files — move them to `_to_delete/` (already gitignored) and delete by hand.

Higgsfield element IDs for new covers:
Messenger\-A `46229f47-2d2f-45f7-a578-8d169ca5fbb7`,
Messenger\-B `37f342de-2add-4f4c-bcc7-2aa3530676d3`

* * *

## How this session verified things

The newsletter rewrite was tested against a stubbed DOM and a stubbed `fetch`, exercising every branch rather than the happy path: invalid input, CORS allowed, endpoint refusing with a 400, and CORS throwing. The final version was re\-tested to confirm `preventDefault()` fires **only** on invalid input — that assertion is the whole popup fix, and it is invisible to visual review.

Both live accounts were checked by fetching them, not assumed. YouTube resolved and gave up its channel ID. Instagram and X refused automated reads, and that difference is recorded rather than papered over.

Two claims made during the session turned out to be wrong and were corrected within minutes: that the Buttondown hosted archive needed switching on (it is on by default), and the initial assumption that a `fetch`\-first newsletter design would work. **Both were caught by checking rather than by reasoning harder.** HANDOFF 4's closing line still holds:

> Measure it. Do not eyeball it.
