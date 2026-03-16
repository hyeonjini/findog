import path from "node:path";

import type { NextConfig } from "next";

const publicApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
const serverApiBaseUrl = process.env.API_BASE_URL;

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "@": path.join(__dirname, "src"),
      "@findog/design-system": path.join(__dirname, "design-system"),
      "@findog/api-client": path.join(__dirname, "../api-client/src"),
    };

    config.resolve.modules = [
      ...(config.resolve.modules ?? []),
      path.join(__dirname, "node_modules"),
    ];

    return config;
  },
  env: {
    NEXT_PUBLIC_API_BASE_URL: publicApiBaseUrl,
    API_BASE_URL: serverApiBaseUrl,
  },
};

export default nextConfig;
