import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
   allowedDevOrigins: [
    "192.168.50.109",
    "192.168.50.*",
  ],

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",          // allows all host-names
        pathname: "/**",         // allows all path-names
      },
    ],
  },
};

export default nextConfig;
