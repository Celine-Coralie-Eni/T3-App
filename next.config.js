/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";
import path from 'path';

/** @type {import("next").NextConfig} */
const config = {
  // Enable standalone output for Docker deployment
  output: 'standalone',
  
  // External packages for server components
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
  
  // Image optimization for production
  images: {
    unoptimized: true, // Disable Next.js image optimization for containerized deployment
  },
  
  // ESLint configuration for production builds
  eslint: {
    // Allow production builds to complete even with ESLint errors
    ignoreDuringBuilds: true,
  },
  
  // TypeScript configuration for production builds
  typescript: {
    // Allow production builds to complete even with TypeScript errors
    ignoreBuildErrors: true,
  },
  
  // Webpack configuration to handle ZenStack imports
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '.zenstack': path.resolve('./node_modules/.zenstack'),
      };
    }
    return config;
  },
};

export default config;
