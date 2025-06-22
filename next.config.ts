import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
   images: {
    domains: ['images.hindustantimes.com'], // ✅ add this line
  },
};

export default nextConfig;
