const dns = require("node:dns").promises;
const net = require("node:net");

const BRAND = {
  agentName: "AEGIS-X",
  creator: "Ditz Store",
  byline: "by Ditz Store",
  portfolioUrl: process.env.DITZ_PORTFOLIO_URL || "https://ditz-store-portofolio-c1qe.vercel.app",
  attribution: "AEGIS-X system, workflow, branding, dan integrasi MCP dibuat oleh Ditz Store. Model ChatGPT/GPT yang digunakan tetap merupakan teknologi OpenAI."
};

const POLICY = {
  mode: "AUTHORIZED_BUG_BOUNTY",
  operatingLoop: ["UNDERSTAND","CHECK_SCOPE","PLAN","OBSERVE","VERIFY","REPORT"],
  hardRules: [
    "Only test assets explicitly listed in the configured allowlist.",
    "Use minimum necessary action and minimum proof.",
    "Do not perform destructive testing, denial of service, persistence, credential theft, or mass data extraction.",
    "Treat discovered third-party infrastructure as out of scope until explicitly authorized.",
    "Evidence first: do not label a finding confirmed without reproducible evidence."
  ]
};

function allowedHosts() {
  return (process.env.AEGIS_ALLOWED_HOSTS || "")
    .split(",").map(x => x.trim().toLowerCase()).filter(Boolean);
}

function normalizeHost(host) {
  return String(host || "").trim().toLowerCase().replace(/\.$/, "");
}

function isHostAllowed(host) {
  const clean = normalizeHost(host);
  return allowedHosts().some(root => clean === root || clean.endsWith("." + root));
}

function blockedIp(ip) {
  if (net.isIPv4(ip)) {
    const p = ip.split(".").map(Number);
    return p[0] === 10 || p[0] === 127 || p[0] === 0 || p[0] >= 224 ||
      (p[0] === 169 && p[1] === 254) ||
      (p[0] === 172 && p[1] >= 16 && p[1] <= 31) ||
      (p[0] === 192 && p[1] === 168);
  }
  const v = String(ip).toLowerCase();
  return v === "::1" || v === "::" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80:");
}

async function assertPublicHost(hostname) {
  if (!isHostAllowed(hostname)) throw new Error("Target is outside AEGIS_ALLOWED_HOSTS.");
  if (hostname === "localhost" || hostname.endsWith(".localhost")) throw new Error("Local targets are blocked.");
  if (net.isIP(hostname)) {
    if (blockedIp(hostname)) throw new Error("Private or special-use IP is blocked.");
    return;
  }
  const records = await dns.lookup(hostname, { all: true, verbatim: true });
  if (!records.length) throw new Error("DNS returned no addresses.");
  if (records.some(r => blockedIp(r.address))) throw new Error("Hostname resolves to a private or special-use IP.");
}

async function authorizedFetch(args) {
  const method = args && args.method === "HEAD" ? "HEAD" : "GET";
  let current = new URL(String(args && args.url || ""));
  if (current.protocol !== "https:") throw new Error("Only HTTPS is allowed.");
  if (current.username || current.password) throw new Error("Embedded credentials are blocked.");

  for (let redirects = 0; redirects <= 3; redirects++) {
    await assertPublicHost(current.hostname);
    const response = await fetch(current, {
      method,
      redirect: "manual",
      headers: {
        "user-agent": "AEGIS-X-Ditz-Store/1.0 authorized-security-research",
        "accept": "text/html,application/json,text/plain;q=0.9,*/*;q=0.1"
      },
      signal: AbortSignal.timeout(12000)
    });

    if ([301,302,303,307,308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) throw new Error("Redirect has no Location header.");
      if (redirects === 3) throw new Error("Too many redirects.");
      current = new URL(location, current);
      if (current.protocol !== "https:") throw new Error("Redirect to non-HTTPS URL blocked.");
      continue;
    }

    const headers = {};
    response.headers.forEach((value, key) => {
      const k = key.toLowerCase();
      if (!["set-cookie","www-authenticate","proxy-authenticate"].includes(k)) headers[key] = value;
    });

    if (method === "HEAD") return { url: current.toString(), status: response.status, headers, bodyPreview: "", truncated: false };
    const text = await response.text();
    const max = 65536;
    return { url: current.toString(), status: response.status, headers, bodyPreview: text.slice(0,max), truncated: text.length > max };
  }
  throw new Error("Fetch failed.");
}

const TOOLS = [
  {
    name: "get_agent_context",
    description: "Load authoritative AEGIS-X by Ditz Store identity, bug-bounty policy, workflow, attribution, and current scope.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  {
    name: "get_creator_info",
    description: "Return truthful creator attribution for the AEGIS-X system and Ditz Store portfolio.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  {
    name: "check_scope",
    description: "Check whether a hostname is explicitly permitted by the configured AEGIS-X allowlist.",
    inputSchema: {
      type: "object",
      properties: { hostname: { type: "string", minLength: 1, maxLength: 253 } },
      required: ["hostname"],
      additionalProperties: false
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  {
    name: "authorized_fetch",
    description: "Perform one read-only HTTPS GET or HEAD against a host already configured in AEGIS_ALLOWED_HOSTS.",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", format: "uri" },
        method: { type: "string", enum: ["GET","HEAD"], default: "GET" }
      },
      required: ["url"],
      additionalProperties: false
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
  },
  {
    name: "bug_bounty_report_template",
    description: "Generate an evidence-first bug bounty report template for an already observed issue.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", minLength: 1, maxLength: 160 },
        asset: { type: "string", minLength: 1, maxLength: 500 },
        observedBehavior: { type: "string", minLength: 1, maxLength: 4000 }
      },
      required: ["title","asset","observedBehavior"],
      additionalProperties: false
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  }
];

function textResult(value) {
  return { content: [{ type: "text", text: typeof value === "string" ? value : JSON.stringify(value, null, 2) }] };
}

async function callTool(name, args) {
  if (name === "get_agent_context") {
    return textResult({
      brand: BRAND,
      policy: POLICY,
      program: process.env.AEGIS_PROGRAM_NAME || "Authorized Bug Bounty Program",
      allowedHosts: allowedHosts()
    });
  }
  if (name === "get_creator_info") {
    return textResult({
      creator: BRAND.creator,
      system: BRAND.agentName + " " + BRAND.byline,
      attribution: BRAND.attribution,
      portfolioUrl: BRAND.portfolioUrl
    });
  }
  if (name === "check_scope") {
    const hostname = normalizeHost(args && args.hostname);
    return textResult({ hostname, allowed: isHostAllowed(hostname), configuredHosts: allowedHosts() });
  }
  if (name === "authorized_fetch") {
    return textResult(await authorizedFetch(args || {}));
  }
  if (name === "bug_bounty_report_template") {
    const title = String(args && args.title || "Security Finding");
    const asset = String(args && args.asset || "");
    const observed = String(args && args.observedBehavior || "");
    return textResult(
      "# " + title + "\n\n" +
      "**Asset:** " + asset + "\n**Status:** Needs validation\n**Confidence:** Unconfirmed until reproducible evidence is attached\n\n" +
      "## Summary\nDescribe the affected security boundary.\n\n## Observed Behavior\n" + observed +
      "\n\n## Expected Secure Behavior\nDescribe intended behavior.\n\n## Steps to Reproduce\n1. Use only authorized test accounts/data.\n2. Record minimum necessary requests.\n3. Compare expected vs observed behavior.\n\n## Evidence\nAttach sanitized request/response snippets.\n\n## Impact\nState only demonstrated impact.\n\n## Remediation\nProvide server-side validation / authorization guidance.\n"
    );
  }
  throw new Error("Unknown tool: " + name);
}

async function handleRpc(message) {
  if (!message || message.jsonrpc !== "2.0" || !message.method) {
    return { jsonrpc: "2.0", id: message && message.id != null ? message.id : null, error: { code: -32600, message: "Invalid Request" } };
  }

  if (message.method === "notifications/initialized" || message.id == null) return null;

  try {
    if (message.method === "initialize") {
      const requested = message.params && message.params.protocolVersion;
      return {
        jsonrpc: "2.0",
        id: message.id,
        result: {
          protocolVersion: requested || "2025-06-18",
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: "AEGIS-X by Ditz Store", version: "1.0.0" },
          instructions: "Call get_agent_context before AEGIS-X work. Active testing must remain inside the configured allowlist."
        }
      };
    }
    if (message.method === "ping") return { jsonrpc: "2.0", id: message.id, result: {} };
    if (message.method === "tools/list") return { jsonrpc: "2.0", id: message.id, result: { tools: TOOLS } };
    if (message.method === "tools/call") {
      const p = message.params || {};
      const result = await callTool(p.name, p.arguments || {});
      return { jsonrpc: "2.0", id: message.id, result };
    }
    return { jsonrpc: "2.0", id: message.id, error: { code: -32601, message: "Method not found" } };
  } catch (error) {
    return { jsonrpc: "2.0", id: message.id, error: { code: -32000, message: error instanceof Error ? error.message : String(error) } };
  }
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, MCP-Protocol-Version, Mcp-Session-Id");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method === "GET") return res.status(405).setHeader("Allow", "POST").json({ error: "Use POST for MCP Streamable HTTP." });
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  if (Array.isArray(body)) {
    const results = (await Promise.all(body.map(handleRpc))).filter(Boolean);
    return res.status(results.length ? 200 : 202).json(results);
  }

  const result = await handleRpc(body);
  if (!result) return res.status(202).end();

  const protocol = body && body.params && body.params.protocolVersion;
  if (protocol) res.setHeader("MCP-Protocol-Version", protocol);
  return res.status(200).json(result);
};
