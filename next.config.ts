import type { NextConfig } from "next";
import withPWA from 'next-pwa'; 

const isDev = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Add other Next.js config options here
  ...(withPWA && !isDev
    ? withPWA({
        dest: 'public',
        register: true,
        skipWaiting: true,
        disable: isDev,
      })
    : {}),
};

export default nextConfig;
