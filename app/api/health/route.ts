import { NextResponse } from "next/server";
import { allowedHosts, brand, programName } from "@/lib/config";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: brand.productName,
    agent: brand.agentName,
    by: brand.creator,
    program: programName(),
    scopeConfigured: allowedHosts().length > 0,
    portfolio: brand.portfolioUrl
  });
}
