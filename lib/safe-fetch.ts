import dns from "node:dns/promises";
import net from "node:net";
import { isHostAllowed } from "@/lib/scope";

const MAX_REDIRECTS = 3;
const MAX_BYTES = 65536;

function blockedIp(ip: string) {
  if (net.isIPv4(ip)) {
    const p = ip.split(".").map(Number);
    return p[0] === 10 ||
      p[0] === 127 ||
      (p[0] === 169 && p[1] === 254) ||
      (p[0] === 172 && p[1] >= 16 && p[1] <= 31) ||
      (p[0] === 192 && p[1] === 168) ||
      p[0] === 0 ||
      p[0] >= 224;
  }
  const v = ip.toLowerCase();
  return v === "::1" || v === "::" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80:");
}

async function assertPublicHost(hostname: string) {
  if (!isHostAllowed(hostname)) throw new Error("Target is outside AEGIS_ALLOWED_HOSTS.");
  if (hostname === "localhost" || hostname.endsWith(".localhost")) throw new Error("Local targets are blocked.");

  if (net.isIP(hostname)) {
    if (blockedIp(hostname)) throw new Error("Private or special-use IP is blocked.");
    return;
  }

  const records = await dns.lookup(hostname, { all: true, verbatim: true });
  if (!records.length) throw new Error("DNS resolution returned no addresses.");
  if (records.some((r) => blockedIp(r.address))) throw new Error("Hostname resolves to a private or special-use IP.");
}

export async function safeAuthorizedFetch(rawUrl: string, method: "GET" | "HEAD") {
  let current = new URL(rawUrl);
  if (current.protocol !== "https:") throw new Error("Only HTTPS is allowed.");
  if (current.username || current.password) throw new Error("Embedded credentials are blocked.");

  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects++) {
    await assertPublicHost(current.hostname);

    const response = await fetch(current, {
      method,
      redirect: "manual",
      headers: {
        "user-agent": "AEGIS-X-Ditz-Store/1.0 authorized-security-research",
        accept: "text/html,application/json,text/plain;q=0.9,*/*;q=0.1"
      },
      signal: AbortSignal.timeout(12000)
    });

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) throw new Error("Redirect response has no Location header.");
      if (redirects === MAX_REDIRECTS) throw new Error("Too many redirects.");
      current = new URL(location, current);
      if (current.protocol !== "https:") throw new Error("Redirect to non-HTTPS URL blocked.");
      continue;
    }

    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      if (!["set-cookie", "www-authenticate", "proxy-authenticate"].includes(key.toLowerCase())) headers[key] = value;
    });

    if (method === "HEAD") {
      return { url: current.toString(), status: response.status, headers, bodyPreview: "", truncated: false };
    }

    const text = await response.text();
    return {
      url: current.toString(),
      status: response.status,
      headers,
      bodyPreview: text.slice(0, MAX_BYTES),
      truncated: text.length > MAX_BYTES
    };
  }

  throw new Error("Fetch failed.");
}
