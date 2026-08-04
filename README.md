# mcp-semrush

Semrush MCP Pack — SEO analytics via the Semrush Analytics API.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

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

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Semrush data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
