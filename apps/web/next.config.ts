import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@darwin-education/shared'],
  experimental: {
    // Enable React 19 features
    reactCompiler: false,
  },
};

export default nextConfig;
