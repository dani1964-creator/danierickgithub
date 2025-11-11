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
  
  // Headers de segurança e CORS
  async headers() {
    return [
      {
        // Headers CORS para rotas de API
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
          },
        ]
      },
      {
        // Headers de segurança para todas as rotas
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