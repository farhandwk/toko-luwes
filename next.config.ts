import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com', // Domain Cloudinary
      },
    ],
  },
  typescript: { ignoreBuildErrors: true },
  // @ts-ignore
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
