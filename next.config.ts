import type { NextConfig } from "next";

const config: NextConfig = {
  // output: process.env.VERCEL ? undefined : "export",
  output: undefined,
  images: { unoptimized: true },
  // The stats script, served from this domain so ad blockers don't drop it.
  // Events take the same route through app/api/e.
  async rewrites() {
    return [{ source: "/api/s.js", destination: "https://stats.walkersutton.com/stats.js" }];
  },
};

export default config;
