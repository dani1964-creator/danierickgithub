/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
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
    // Durante o diagnóstico/compatibilidade com hosts externos, desabilitamos
    // a otimização de imagens do Next.js para evitar bloqueio por whitelist.
    // Isso faz o next/image renderizar as URLs externas sem passar pelo loader
    // do Next (tradeoff: sem otimização). Remover/ajustar quando definirmos
    // uma lista exata de domínios remotos.
    unoptimized: true,
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