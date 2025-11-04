/** @type {import('next').NextConfig} */
const nextConfig = {
  // Suporte para domínios personalizados
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:8080'}/api/:path*`
      }
    ];
  },
  
  // Headers de segurança
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      }
    ];
  },
  
  // Configuração de imagens para domínios externos (Supabase, etc)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.com',
      }
    ],
  },
  
  // Tell Next to transpile our local shared package by package name.
  transpilePackages: ['@myorg/shared'],

  // Experimental features
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js']
  },
  
  // Environment variables que podem ser expostas ao cliente
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  }
};

const path = require('path');

// Ensure Next transpiles the monorepo `shared` folder which contains TypeScript
// modules that must be compiled for the frontend build.
module.exports = {
  ...nextConfig,
  transpilePackages: ['@shared'],
  webpack: (config, { defaultLoaders }) => {
    // Add rule to run Next's babel loader over the shared package files.
    // Put the rule at the beginning so it runs before other loaders that may try
    // to parse the same files.
    config.module.rules.unshift({
      test: /\.[jt]sx?$/,
      include: [path.resolve(__dirname, '../shared')],
      use: [
        {
          loader: require.resolve('babel-loader'),
          options: {
            presets: [require.resolve('next/babel')],
          },
        },
      ],
    });
    return config;
  },
};

module.exports = nextConfig;