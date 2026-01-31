import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@darwin-education/shared'],
  experimental: {
    // Enable React 19 features
    reactCompiler: false,
  },
  // Enable standalone output for Docker production builds
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
};

export default nextConfig;
