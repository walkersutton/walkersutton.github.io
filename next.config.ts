import type { NextConfig } from "next";

const config: NextConfig = {
  // output: process.env.VERCEL ? undefined : "export",
  output: undefined,
  images: { unoptimized: true },
  // The photo backfill on /admin/report runs sharp server-side. Tracing finds
  // sharp's native addon and follows the symlink to its libvips package, but
  // stops at that package's JS — the .so the addon dlopen()s is not a require,
  // so nothing in the module graph points at it and it is left out of the
  // deployed function. sharp then loads and dies with
  // "libvips-cpp.so.8.x: cannot open shared object file". Name the file.
  //
  // Both globs are deliberate: pnpm's isolated layout keeps the real files
  // under .pnpm/, and the second covers a hoisted node_modules if the install
  // ever changes shape. Only the linux-x64 build is included — that is what
  // Vercel's functions run on, and the other platforms are ~14MB each.
  outputFileTracingIncludes: {
    "/admin/**": [
      "./node_modules/.pnpm/@img+sharp-libvips-linux-x64@*/node_modules/@img/sharp-libvips-linux-x64/lib/**",
      "./node_modules/@img/sharp-libvips-linux-x64/lib/**",
    ],
  },
};

export default config;
