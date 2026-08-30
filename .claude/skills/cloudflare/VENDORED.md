# Vendored from cloudflare/skills — pruned

Copied 2026-08-30 from https://github.com/cloudflare/skills at commit
`f96bff754e428838818017f75817f0f9428acd48` (2026-08-07), because the official
install path (`claude plugin install cloudflare@cloudflare`) needs the `claude`
CLI, which is not on this box, and the `npx` fallback needs Node, which is not
on this box either. Vendoring into `.claude/skills/` is this repo's existing
pattern (see `kundalini-session-start`) — version controlled, survives app
re-syncs.

**Pruned deliberately.** The upstream skill carries references for 63 Cloudflare
products (320 files, 1.4 MB). Only the 12 this site's migration and fulfilment
plan can touch were kept: api, bindings, kv, miniflare, observability, pages,
pages-functions, r2, secrets-store, static-assets, workers, wrangler.
`SKILL.md` is upstream-verbatim, so its decision trees mention reference dirs
that are not here (zaraz, spectrum, d1, …) — that is this pruning, not a broken
copy. For anything missing, use the `cloudflare-docs` MCP server (public, no
auth) or https://developers.cloudflare.com/ — the skill itself says to prefer
live docs over these files anyway.

To refresh or widen: shallow-clone the repo and copy more of
`skills/cloudflare/references/` in.
