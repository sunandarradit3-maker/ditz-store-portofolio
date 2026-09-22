import { allowedHosts, brand, programName } from "@/lib/config";

const tools = [
  ["get_agent_context", "Load identity, workflow, policy, dan scope."],
  ["get_creator_info", "Attribution Ditz Store + portfolio."],
  ["check_scope", "Validasi target terhadap allowlist."],
  ["authorized_fetch", "HTTPS GET/HEAD read-only untuk target in-scope."],
  ["bug_bounty_report_template", "Template laporan evidence-first."]
];

export default function Home() {
  const hosts = allowedHosts();

  return (
    <main className="shell">
      <section className="hero">
        <div className="topline">
          <span className="status">● MCP CONTROL PLANE</span>
          <span>V1 / DITZ STORE</span>
        </div>
        <p className="eyebrow">AUTONOMOUS SECURITY CONTROL SYSTEM</p>
        <h1>{brand.agentName}</h1>
        <p className="byline">{brand.byline}</p>
        <p className="lead">
          ChatGPT tetap menjadi model percakapan. AEGIS-X menyediakan identity, scope guard,
          policy, dan tool MCP untuk workflow bug bounty yang terotorisasi.
        </p>
        <div className="actions">
          <a className="primary" href="/mcp">MCP Endpoint</a>
          <a href="/api/health">Health</a>
          <a href={brand.portfolioUrl} target="_blank" rel="noreferrer">Ditz Store Portfolio</a>
        </div>
      </section>

      <section className="grid">
        <article className="panel">
          <h2>IDENTITY</h2>
          <dl>
            <div><dt>Agent</dt><dd>{brand.agentName}</dd></div>
            <div><dt>Creator</dt><dd>{brand.creator}</dd></div>
            <div><dt>Program</dt><dd>{programName()}</dd></div>
          </dl>
          <p>{brand.attribution}</p>
        </article>

        <article className="panel">
          <h2>SCOPE GUARD</h2>
          {hosts.length ? (
            <div className="chips">{hosts.map((h) => <span key={h}>{h}</span>)}</div>
          ) : (
            <p className="muted">AEGIS_ALLOWED_HOSTS belum diset. authorized_fetch otomatis ditolak.</p>
          )}
        </article>

        <article className="panel wide">
          <h2>MCP TOOLS</h2>
          <div className="tools">
            {tools.map(([name, desc]) => (
              <div className="tool" key={name}>
                <code>{name}</code>
                <span>{desc}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <footer>AEGIS-X — SYSTEM & WORKFLOW BY DITZ STORE</footer>
    </main>
  );
}
