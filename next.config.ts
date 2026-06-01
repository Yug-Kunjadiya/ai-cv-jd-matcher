import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ['pdf-parse', '@xenova/transformers'],
};

export default nextConfig;
