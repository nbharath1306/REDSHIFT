import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ["puppeteer"],
  reactCompiler: true,
};

export default nextConfig;
