import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error"] } : false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'bucket.hoshizora.online',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'pub-25e24e7a8a8147cdbf9f91b65447583f.r2.dev',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
