import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Only enable static export when building for static deployment
  ...(process.env.STATIC_EXPORT === 'true' && {
    output: 'export',
    trailingSlash: true,
    images: {
      unoptimized: true
    }
  })
};

export default nextConfig;
