import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx"],
};

export default withPayload(nextConfig);
