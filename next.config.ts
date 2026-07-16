import type { NextConfig } from "next";

const basePath = process.env.BASE_PATH?.trim();
const assetPrefix = process.env.ASSET_PREFIX?.trim();

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: false,
  ...(basePath ? { basePath } : {}),
  ...(assetPrefix ? { assetPrefix } : {}),
};

export default nextConfig;
