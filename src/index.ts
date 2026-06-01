interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * Semrush MCP Pack — SEO analytics via the Semrush Analytics API.
 *
 * BYO key: every tool requires `_apiKey` (the user's own Semrush API key).
 * Auth: the key is passed as a `key` query param (NOT a header).
 * Base: https://api.semrush.com/  — reports selected via ?type={report}.
 *
 * The Semrush API responds with CSV (semicolon-separated; first row = headers).
 * This pack parses that CSV into clean JSON rows. Errors come back as a plain
 * text body of the form `ERROR <code> :: <message>` (e.g. "ERROR 120 :: WRONG
 * KEY - ID PAIR" for a bad key) — confirmed via curl with key=test (HTTP 403).
 * We treat both non-2xx responses and bodies starting with "ERROR" as failures.
 *
 * Every call consumes the user's own Semrush API units.
 */


const BASE = 'https://api.semrush.com/';
const UA = 'pipeworx-mcp-semrush/1.0 (+https://pipeworx.io)';

/** Parse Semrush semicolon-separated CSV into an array of JSON objects. */
function parseSemrushCsv(text: string): Array<Record<string, string>> {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter((l) => l.length > 0);
  if (lines.length === 0) return [];
  const headers = lines[0].split(';');
  const rows: Array<Record<string, string>> = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(';');
    const row: Record<string, string> = {};
    for (let c = 0; c < headers.length; c++) {
      row[headers[c]] = cells[c] ?? '';
    }
    rows.push(row);
  }
  return rows;
}

async function semrushGet(
  apiKey: string,
  type: string,
  params: Record<string, string | undefined>,
): Promise<Array<Record<string, string>>> {
  const qs = new URLSearchParams();
  qs.set('type', type);
  qs.set('key', apiKey);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') qs.set(k, v);
  }
  const res = await fetch(`${BASE}?${qs.toString()}`, {
    headers: { 'User-Agent': UA, Accept: 'text/csv' },
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`Semrush: ${res.status} ${body.slice(0, 200)}`);
  // Semrush sometimes returns errors with a 200 status and an "ERROR ..." body.
  if (body.startsWith('ERROR')) throw new Error(`Semrush: ${res.status} ${body.slice(0, 200)}`);
  return parseSemrushCsv(body.trim());
}

function reqStr(args: Record<string, unknown>, key: string): string {
  const v = args[key];
  if (typeof v !== 'string' || !v.trim()) throw new Error(`Required argument "${key}" is missing.`);
  return v.trim();
}

function optStr(args: Record<string, unknown>, key: string): string | undefined {
  const v = args[key];
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

function optNum(args: Record<string, unknown>, key: string): string | undefined {
  const v = args[key];
  if (typeof v === 'number' && Number.isFinite(v)) return String(Math.trunc(v));
  if (typeof v === 'string' && v.trim() && Number.isFinite(Number(v))) return String(Math.trunc(Number(v)));
  return undefined;
}

const API_KEY_PROP = {
  _apiKey: { type: 'string', description: 'Your own Semrush API key (BYO). Passed to Semrush as the `key` query param. Consumes your Semrush API units.' },
} as const;

const DB_DESC =
  '2-letter Semrush regional database (e.g. us, uk, de, fr, es, ca, au). Default us.';

const tools: McpToolExport['tools'] = [
  {
    name: 'domain_overview',
    description:
      'Domain overview (Semrush type=domain_ranks): high-level SEO/PPC summary for a domain. ' +
      'Returns parsed rows with columns: Db (database), Dn (domain), Rk (Semrush rank), ' +
      'Or (organic keywords count), Ot (organic traffic), Oc (organic traffic cost), ' +
      'Ad (adwords/paid keywords count), At (paid traffic), Ac (paid traffic cost). ' +
      'Consumes your Semrush API units.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        ...API_KEY_PROP,
        domain: { type: 'string', description: 'Domain to analyze, e.g. "apple.com" (no scheme).' },
        database: { type: 'string', description: DB_DESC },
        display_limit: { type: 'number', description: 'Max rows to return.' },
      },
      required: ['_apiKey', 'domain'],
    },
  },
  {
    name: 'domain_organic_keywords',
    description:
      'Top organic search keywords a domain ranks for (Semrush type=domain_organic). ' +
      'Returns parsed rows with columns: Ph (keyword phrase), Po (current position), Pp (previous position), ' +
      'Nq (search volume), Cp (CPC), Ur (ranking URL), Tr (traffic %), Co (competition), Nr (number of results). ' +
      'Consumes your Semrush API units.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        ...API_KEY_PROP,
        domain: { type: 'string', description: 'Domain to analyze, e.g. "apple.com".' },
        database: { type: 'string', description: DB_DESC },
        display_limit: { type: 'number', description: 'Max keywords to return (default Semrush 10000; pass a small value like 50).' },
        display_sort: {
          type: 'string',
          description: 'Sort order, e.g. "tr_desc" (traffic), "nq_desc" (volume), "po_asc" (position). Optional.',
        },
      },
      required: ['_apiKey', 'domain'],
    },
  },
  {
    name: 'domain_paid_keywords',
    description:
      'Paid (AdWords/PPC) keywords a domain bids on (Semrush type=domain_adwords). ' +
      'Returns parsed rows with columns: Ph (keyword phrase), Po (ad position), Nq (search volume), ' +
      'Cp (CPC), Ur (landing page URL), Tg (traffic), Tc (traffic cost), Co (competition), Nr (number of results). ' +
      'Consumes your Semrush API units.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        ...API_KEY_PROP,
        domain: { type: 'string', description: 'Domain to analyze, e.g. "apple.com".' },
        database: { type: 'string', description: DB_DESC },
        display_limit: { type: 'number', description: 'Max keywords to return (pass a small value like 50).' },
      },
      required: ['_apiKey', 'domain'],
    },
  },
  {
    name: 'keyword_overview',
    description:
      'Keyword overview (Semrush type=phrase_this): search metrics for a single keyword phrase. ' +
      'Returns parsed rows with columns: Ph (phrase), Nq (search volume), Cp (CPC), ' +
      'Co (competition 0-1), Nr (number of organic results), Td (trend, last 12 months as |-separated values). ' +
      'Consumes your Semrush API units.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        ...API_KEY_PROP,
        phrase: { type: 'string', description: 'Keyword phrase to look up, e.g. "running shoes".' },
        database: { type: 'string', description: DB_DESC },
      },
      required: ['_apiKey', 'phrase'],
    },
  },
  {
    name: 'backlinks_overview',
    description:
      'Backlinks summary for a domain or URL (Semrush type=backlinks_overview). ' +
      'Returns parsed rows with columns: target, target_type, total (total backlinks), ' +
      'domains_num (referring domains), urls_num (referring URLs), ips_num (referring IPs), ' +
      'follows_num (dofollow), nofollows_num, texts_num, images_num, score (authority score). ' +
      'Note: backlinks reports are not regional — there is no `database` param. Consumes your Semrush API units.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        ...API_KEY_PROP,
        target: { type: 'string', description: 'Domain or URL to analyze, e.g. "apple.com".' },
        target_type: {
          type: 'string',
          description: 'One of "root_domain", "domain" (subdomain), or "url". Default root_domain.',
        },
      },
      required: ['_apiKey', 'target'],
    },
  },
  {
    name: 'organic_competitors',
    description:
      'Organic search competitors for a domain (Semrush type=domain_organic_organic). ' +
      'Returns parsed rows with columns: Dn (competitor domain), Cr (competition level), ' +
      'Np (common keywords), Or (competitor organic keywords), Ot (competitor organic traffic), Oc (organic cost). ' +
      'Consumes your Semrush API units.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        ...API_KEY_PROP,
        domain: { type: 'string', description: 'Domain to find competitors for, e.g. "apple.com".' },
        database: { type: 'string', description: DB_DESC },
        display_limit: { type: 'number', description: 'Max competitors to return (pass a small value like 25).' },
      },
      required: ['_apiKey', 'domain'],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const apiKey = args._apiKey as string | undefined;
  delete args._context;
  delete args._apiKey;

  if (!apiKey) {
    throw new Error('_apiKey is required: pass your own Semrush API key as args._apiKey (BYO).');
  }

  switch (name) {
    case 'domain_overview':
      return semrushGet(apiKey, 'domain_ranks', {
        domain: reqStr(args, 'domain'),
        database: optStr(args, 'database') ?? 'us',
        display_limit: optNum(args, 'display_limit'),
      });
    case 'domain_organic_keywords':
      return semrushGet(apiKey, 'domain_organic', {
        domain: reqStr(args, 'domain'),
        database: optStr(args, 'database') ?? 'us',
        display_limit: optNum(args, 'display_limit'),
        display_sort: optStr(args, 'display_sort'),
      });
    case 'domain_paid_keywords':
      return semrushGet(apiKey, 'domain_adwords', {
        domain: reqStr(args, 'domain'),
        database: optStr(args, 'database') ?? 'us',
        display_limit: optNum(args, 'display_limit'),
      });
    case 'keyword_overview':
      return semrushGet(apiKey, 'phrase_this', {
        phrase: reqStr(args, 'phrase'),
        database: optStr(args, 'database') ?? 'us',
      });
    case 'backlinks_overview':
      return semrushGet(apiKey, 'backlinks_overview', {
        target: reqStr(args, 'target'),
        target_type: optStr(args, 'target_type') ?? 'root_domain',
      });
    case 'organic_competitors':
      return semrushGet(apiKey, 'domain_organic_organic', {
        domain: reqStr(args, 'domain'),
        database: optStr(args, 'database') ?? 'us',
        display_limit: optNum(args, 'display_limit'),
      });
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
