import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep native / server-only DB packages out of the client bundle.
  serverExternalPackages: ["mongoose", "mongodb-memory-server"],
};

export default nextConfig;
