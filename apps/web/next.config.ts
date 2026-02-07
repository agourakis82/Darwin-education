import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@darwin-education/shared'],
  experimental: {
    // Enable React 19 features
    reactCompiler: false,
  },
  eslint: {
    // Pre-existing lint warnings — do not block production builds
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'jpzkjkwcoudaxscrukye.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
        pathname: '/**',
      },
    ],
  },
  // Enable standalone output for Docker production builds
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
};

export default nextConfig;
