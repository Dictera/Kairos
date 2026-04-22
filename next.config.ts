import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['better-sqlite3'],
  redirects: async () => [
    {
      source: '/dilekce',
      destination: '/ayarlar',
      permanent: false,
    },
    {
      source: '/dilekce/:path*',
      destination: '/ayarlar',
      permanent: false,
    },
  ],
}

export default nextConfig
