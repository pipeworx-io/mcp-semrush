# mcp-semrush

Semrush MCP Pack — SEO analytics via the Semrush Analytics API.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1476+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `domain_overview` | Domain overview (Semrush type=domain_ranks): high-level SEO/PPC summary for a domain. Returns parsed rows with columns: Db (database), Dn (domain), Rk (Semrush rank), Or (organic keywords count), Ot (organic traffic), Oc (organic traffic cost), Ad (adwords/paid keywords count), At (paid traffic), Ac (paid traffic cost). Consumes your Semrush API units. |
| `domain_organic_keywords` | Top organic search keywords a domain ranks for (Semrush type=domain_organic). Returns parsed rows with columns: Ph (keyword phrase), Po (current position), Pp (previous position), Nq (search volume), Cp (CPC), Ur (ranking URL), Tr (traffic %), Co (competition), Nr (number of results). Consumes your Semrush API units. |
| `domain_paid_keywords` | Paid (AdWords/PPC) keywords a domain bids on (Semrush type=domain_adwords). Returns parsed rows with columns: Ph (keyword phrase), Po (ad position), Nq (search volume), Cp (CPC), Ur (landing page URL), Tg (traffic), Tc (traffic cost), Co (competition), Nr (number of results). Consumes your Semrush API units. |
| `keyword_overview` | Keyword overview (Semrush type=phrase_this): search metrics for a single keyword phrase. Returns parsed rows with columns: Ph (phrase), Nq (search volume), Cp (CPC), Co (competition 0-1), Nr (number of organic results), Td (trend, last 12 months as \|-separated values). Consumes your Semrush API units. |
| `backlinks_overview` | Backlinks summary for a domain or URL (Semrush type=backlinks_overview). Returns parsed rows with columns: target, target_type, total (total backlinks), domains_num (referring domains), urls_num (referring URLs), ips_num (referring IPs), follows_num (dofollow), nofollows_num, texts_num, images_num, score (authority score). Note: backlinks reports are not regional — there is no `database` param. Consumes your Semrush API units. |
| `organic_competitors` | Organic search competitors for a domain (Semrush type=domain_organic_organic). Returns parsed rows with columns: Dn (competitor domain), Cr (competition level), Np (common keywords), Or (competitor organic keywords), Ot (competitor organic traffic), Oc (organic cost). Consumes your Semrush API units. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "semrush": {
      "url": "https://gateway.pipeworx.io/semrush/mcp"
    }
  }
}
```

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/semrush/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1476+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Semrush data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT

## No MCP client? Call it over HTTP

This pack takes your own API key (`_apiKey`) — we don't front one for it, so there's no curl here that would run without it. Inspect any tool: `GET https://gateway.pipeworx.io/v1/tools/domain_overview`. Find one: `POST https://gateway.pipeworx.io/v1/tools/search_packs` with `{"query":"..."}`.
