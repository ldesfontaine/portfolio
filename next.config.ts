import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

// GoatCounter runs in-container on the loopback under /stats (-base-path=/stats),
// so we just preserve the prefix when proxying.
const goatcounterUpstream =
  process.env.GOATCOUNTER_INTERNAL_URL || "http://127.0.0.1:8080";

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx"],
  async rewrites() {
    return [
      {
        source: "/stats",
        destination: `${goatcounterUpstream}/stats/`,
      },
      {
        source: "/stats/:path*",
        destination: `${goatcounterUpstream}/stats/:path*`,
      },
    ];
  },
};

export default withPayload(nextConfig);
