import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { allowedHosts, brand, policy, programName } from "@/lib/config";
import { isHostAllowed } from "@/lib/scope";
import { safeAuthorizedFetch } from "@/lib/safe-fetch";

export const runtime = "nodejs";
export const maxDuration = 60;

const jsonText = (value: unknown) => JSON.stringify(value, null, 2);

const handler = createMcpHandler((server) => {
  server.registerTool(
    "get_agent_context",
    {
      title: "Load AEGIS-X Agent Context",
      description: "Load authoritative AEGIS-X identity, workflow, bug-bounty policy, Ditz Store attribution, and current allowlist.",
      inputSchema: z.object({}).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
    },
    async () => {
      const result = { brand, policy, program: programName(), allowedHosts: allowedHosts() };
      return { content: [{ type: "text", text: jsonText(result) }] };
    }
  );

  server.registerTool(
    "get_creator_info",
    {
      title: "Get Ditz Store Attribution",
      description: "Return truthful creator attribution for the AEGIS-X system and the Ditz Store portfolio.",
      inputSchema: z.object({}).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
    },
    async () => {
      const result = {
        creator: brand.creator,
        system: brand.agentName + " " + brand.byline,
        attribution: brand.attribution,
        portfolioUrl: brand.portfolioUrl
      };
      return { content: [{ type: "text", text: jsonText(result) }] };
    }
  );

  server.registerTool(
    "check_scope",
    {
      title: "Check Bug Bounty Scope",
      description: "Check whether a hostname is explicitly permitted by the configured allowlist.",
      inputSchema: z.object({ hostname: z.string().min(1).max(253) }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
    },
    async ({ hostname }) => {
      const clean = hostname.trim().toLowerCase();
      const result = { hostname: clean, allowed: isHostAllowed(clean), configuredHosts: allowedHosts() };
      return { content: [{ type: "text", text: jsonText(result) }] };
    }
  );

  server.registerTool(
    "authorized_fetch",
    {
      title: "Fetch Authorized Bug Bounty URL",
      description: "Perform one read-only HTTPS GET or HEAD against a target already present in AEGIS_ALLOWED_HOSTS.",
      inputSchema: z.object({
        url: z.string().url(),
        method: z.enum(["GET", "HEAD"]).default("GET")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
    },
    async ({ url, method }) => {
      const result = await safeAuthorizedFetch(url, method);
      return { content: [{ type: "text", text: jsonText(result) }] };
    }
  );

  server.registerTool(
    "bug_bounty_report_template",
    {
      title: "Generate Bug Bounty Report Template",
      description: "Generate an evidence-first report skeleton for an already observed issue.",
      inputSchema: z.object({
        title: z.string().min(1).max(160),
        asset: z.string().min(1).max(500),
        observedBehavior: z.string().min(1).max(4000)
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
    },
    async ({ title, asset, observedBehavior }) => {
      const report =
        "# " + title + "\n\n" +
        "**Asset:** " + asset + "\n" +
        "**Status:** Needs validation\n" +
        "**Confidence:** Unconfirmed until reproducible evidence is attached\n\n" +
        "## Summary\nDescribe the affected security boundary.\n\n" +
        "## Observed Behavior\n" + observedBehavior + "\n\n" +
        "## Expected Secure Behavior\nDescribe intended behavior.\n\n" +
        "## Steps to Reproduce\n1. Use only authorized test accounts/data.\n2. Record minimum necessary requests.\n3. Compare expected vs observed behavior.\n\n" +
        "## Evidence\nAttach sanitized request/response snippets.\n\n" +
        "## Impact\nState only demonstrated impact.\n\n" +
        "## Remediation\nProvide server-side validation / authorization guidance.\n";
      return { content: [{ type: "text", text: report }] };
    }
  );
});

export { handler as GET, handler as POST };
