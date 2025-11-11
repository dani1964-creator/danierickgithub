/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  // Configuração de imagens para domínios externos (Supabase, etc)
  images: {
    // IMPORTANTE: Desabilitar otimização de imagens para Digital Ocean App Platform
    // O App Platform não suporta o Image Optimization do Next.js
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.com',
      },
      {
        protocol: 'https',
        hostname: 'img.freepik.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
      },
      {
        protocol: 'https',
        hostname: 'encrypted-tbn0.gstatic.com',
      }
    ],
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
  
  // Experimental features
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js']
  },
  
  // Transpile shared package
  transpilePackages: ['@shared'],
  
  // Webpack config para processar arquivos da pasta shared
  webpack: (config) => {
    config.module.rules.unshift({
      test: /\.[jt]sx?$/,
      include: [path.resolve(__dirname, '../shared'), path.resolve(__dirname, 'shared')],
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