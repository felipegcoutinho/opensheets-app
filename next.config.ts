import type { NextConfig } from "next";
import dotenv from "dotenv";

// Carregar variáveis de ambiente explicitamente
dotenv.config();

const nextConfig: NextConfig = {
  // Output standalone para Docker (gera build otimizado com apenas deps necessárias)
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
