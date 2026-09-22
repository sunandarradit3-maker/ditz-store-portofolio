module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({
    ok: true,
    service: "AEGIS-X Security Control Plane",
    agent: "AEGIS-X",
    by: "Ditz Store",
    mode: "AUTHORIZED_BUG_BOUNTY",
    portfolio: process.env.DITZ_PORTFOLIO_URL || "https://ditz-store-portofolio-c1qe.vercel.app",
    scopeConfigured: Boolean((process.env.AEGIS_ALLOWED_HOSTS || "").trim())
  });
};
