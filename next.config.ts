import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["midtrans-client"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "rcuz3groxntfjgqb.public.blob.vercel-storage.com" },
    ],
  },
};

export default nextConfig;
