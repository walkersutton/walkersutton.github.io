import type { NextConfig } from "next";

const config: NextConfig = {
  // output: process.env.VERCEL ? undefined : "export",
  output: undefined,
  images: { unoptimized: true },
};

export default config;
