import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '1gb',
    },
  },
  output: 'standalone',
  serverExternalPackages: ['pg', '@prisma/adapter-pg', '@prisma/client', '@supabase/storage-js'],
  compress: false,
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : undefined,
   images: {
     formats: ['image/avif', 'image/webp'],
     deviceSizes: [640, 750, 828, 1080, 1920],
     imageSizes: [16, 32, 48, 64, 96, 128, 256],
     minimumCacheTTL: 31536000,
   },
  headers: async () => {
    return [
      {
        source: '/',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|webp|avif|ico|woff|woff2|ttf|eot)',
        locale: false,
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
        ],
      },
    ]
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), '@supabase/storage-js'];
    }
    return config;
  },
};

const config = nextConfig;

const withBundleAnalyzer = process.env.ANALYZE === 'true'
  ? (() => {
      try {
        const withBundleAnalyzerFn = require('@next/bundle-analyzer')?.withBundleAnalyzer;
        if (withBundleAnalyzerFn) {
          return withBundleAnalyzerFn({ enabled: process.env.ANALYZE === 'true' });
        }
      } catch (error) {
        console.warn('Bundle analyzer not available, skipping...');
      }
      return (config: NextConfig) => config;
    })()
  : (config: NextConfig) => config;

export default withBundleAnalyzer(config);