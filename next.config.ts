import dotenv from "dotenv";
import type { NextConfig } from "next";

// Carregar variáveis de ambiente explicitamente
dotenv.config();

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
  reactCompiler: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [new URL("https://lh3.googleusercontent.com/**")],
  },
  devIndicators: {
    position: "bottom-right",
  },
};

export default nextConfig;
