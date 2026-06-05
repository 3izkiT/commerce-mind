import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.moneyspace.net",
      },
      {
        protocol: "https",
        hostname: "**.moneyspace.net",
      },
    ],
  },
};

export default nextConfig;
