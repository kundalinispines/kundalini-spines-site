# Content Model

All editable content lives in flat JSON files under `/data`, separate from presentation. A non-developer can open any of these and edit text/paths without touching HTML, CSS, or JS.

| File | Powers | Key fields |
|---|---|---|
| `data/site.json` | Homepage copy, nav/footer, social links, CTAs | `homepage`, `social`, `footer` |
| `data/messengers.json` | About page + hero imagery | `messengers[]`, `heroDuo` — includes the Higgsfield source element/job IDs so any Messenger asset can be regenerated later without losing the paper trail |
| `data/releases.json` | Music section | `releases[].tracks[]` — cover art, streaming links, optional lyrics/notes per track |
| `data/transmissions.json` | Transmissions section | `transmissions[]` — number, media, description, optional expanded view |
| `data/archive.json` | Archive section | `categories[]` (filter chips) + `entries[]` |

Conventions:
- Every placeholder value still needing real content or approval is written as `[DRAFT ...]` or `PLACEHOLDER...` — grep for these before publishing.
- Media fields are relative paths under `/assets`, never absolute URLs, so the whole site is portable.
- Transmission numbers are zero-padded three-digit strings (`"001"`), matching brand convention, but there's no register/approval workflow attached — just the number and the content.
- Lyrics/track notes are optional per-track — omit the field entirely rather than leaving it empty if not approved for display.

This structure adapts the original "Books/Divisions/Records" institutional model down to five flat files with no ceremonial numbering layer.
