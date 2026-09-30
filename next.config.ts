import type { NextConfig } from "next";

const nextConfig: any = {
  agentRules: false,
  serverExternalPackages: ["midtrans-client"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
};

export default nextConfig;
