import type { NextConfig } from "next";

const nextConfig = {
  /* config options here */
  allowedDevOrigins: ['192.168.0.81', 'till-unpledged-half.ngrok-free.dev'],
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
} as any;


export default nextConfig;
