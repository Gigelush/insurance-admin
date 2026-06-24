import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  // Required for better-sqlite3 (native Node.js addon)
  serverExternalPackages: ['better-sqlite3'],
};

export default nextConfig;
