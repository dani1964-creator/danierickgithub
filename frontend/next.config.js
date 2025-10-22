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
  
  // Experimental features
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js']
  },
  
  // Environment variables que podem ser expostas ao cliente
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  }
};

module.exports = nextConfig;