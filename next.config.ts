import type { NextConfig } from 'next'

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'self'" },
  { key: 'Referrer-Policy', value: 'same-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

const nextConfig: NextConfig = {
  serverExternalPackages: ['better-sqlite3'],
  poweredByHeader: false,
  experimental: {
    // proxy.ts runs on every request, and Next.js only hands the first 10 MB of
    // a body through a proxy by default — which silently truncated 10–20 MB
    // document uploads. Keep this above the largest upload cap (20 MB in
    // app/api/upload) plus multipart overhead.
    proxyClientMaxBodySize: '21mb',
  },
  headers: async () => [{ source: '/:path*', headers: securityHeaders }],
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
