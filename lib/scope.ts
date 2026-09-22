import { allowedHosts } from "@/lib/config";

export function normalizeHost(host: string) {
  return host.trim().toLowerCase().replace(/\.$/, "");
}

export function isHostAllowed(host: string) {
  const clean = normalizeHost(host);
  return allowedHosts().some((root) => clean === root || clean.endsWith("." + root));
}
