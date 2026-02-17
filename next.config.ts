import type { NextConfig } from "next";
import withPWAInit from "next-pwa"

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV ==='development',
  register: true,
  skipWaiting: true
})

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
  turbopack: {}
};

export default withPWA(nextConfig as any);
