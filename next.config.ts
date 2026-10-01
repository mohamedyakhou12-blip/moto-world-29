import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // CRITICAL: Tell Next.js to NOT bundle Prisma — resolve it at runtime from node_modules
  // Without this, Turbopack renames @prisma/client to @prisma/client-HASH and the
  // standalone build can't find it (Cannot find module error at runtime)
  serverExternalPackages: ["@prisma/client", "@prisma/engines", ".prisma/client"],
  // Also configure output file tracing to include prisma
  outputFileTracingIncludes: {
    "/": ["./node_modules/.prisma/**/*", "./node_modules/@prisma/**/*"],
  },
};

export default nextConfig;
