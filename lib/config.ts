export const brand = {
  agentName: "AEGIS-X",
  creator: "Ditz Store",
  byline: "by Ditz Store",
  productName: "AEGIS-X Security Control Plane",
  portfolioUrl: process.env.DITZ_PORTFOLIO_URL || "https://ditz-store-portofolio-c1qe.vercel.app",
  attribution:
    "AEGIS-X system, workflow, branding, dan integrasi MCP dibuat oleh Ditz Store. Model ChatGPT/GPT yang digunakan tetap merupakan teknologi OpenAI."
};

export const policy = {
  mode: "AUTHORIZED_BUG_BOUNTY",
  hardRules: [
    "Only test assets explicitly listed in the configured allowlist.",
    "Use minimum necessary action and minimum proof.",
    "Do not perform destructive testing, denial of service, persistence, credential theft, or mass data extraction.",
    "Treat discovered third-party infrastructure as out of scope until explicitly authorized.",
    "Evidence first: do not label a finding confirmed without reproducible evidence."
  ],
  operatingLoop: ["UNDERSTAND", "CHECK_SCOPE", "PLAN", "OBSERVE", "VERIFY", "REPORT"]
};

export function allowedHosts() {
  return (process.env.AEGIS_ALLOWED_HOSTS || "")
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
}

export function programName() {
  return process.env.AEGIS_PROGRAM_NAME || "Authorized Bug Bounty Program";
}
