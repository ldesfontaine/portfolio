import { getPayload, type Payload } from "payload";

import config from "@payload-config";

declare global {
  // Reused across server modules and Next.js hot reloads. Without this guard,
  // concurrent first requests can initialize multiple Payload connections.
  var portfolioPayloadPromise: Promise<Payload> | undefined;
}

export function getPayloadClient(): Promise<Payload> {
  if (!globalThis.portfolioPayloadPromise) {
    globalThis.portfolioPayloadPromise = getPayload({ config }).catch((error) => {
      globalThis.portfolioPayloadPromise = undefined;
      throw error;
    });
  }
  return globalThis.portfolioPayloadPromise;
}
