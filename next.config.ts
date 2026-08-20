import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: process.env.GITHUB_ACTIONS ? "/news-website" : "",
  images: { unoptimized: true },
};

export default nextConfig;
