import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["midtrans-client"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
};

export default nextConfig;
