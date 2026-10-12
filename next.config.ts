import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    // Start loading a page when a link is hovered, so it is usually ready by the click.
    dynamicOnHover: true,
    // Hover prefetches are full page loads; keep them 30s (minimum) instead of the 5 min default, because
    // many forms save via fetch() without router.refresh(). Visited pages (dynamic) stay always-fresh.
    staleTimes: { static: 30 },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
