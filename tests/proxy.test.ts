import { describe, it, expect, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('next/headers', () => ({ cookies: vi.fn().mockResolvedValue({}) }))
vi.mock('iron-session', () => ({
  getIronSession: vi.fn(async () => ({ isLoggedIn: false })),
}))

import { proxy } from '@/proxy'

async function statusFor(pathname: string) {
  const res = await proxy(new NextRequest(`http://127.0.0.1:3000${pathname}`))
  return { status: res.status, location: res.headers.get('location') }
}

describe('proxy: logged-out access', () => {
  it('lets launchers probe /api/health without a session', async () => {
    expect((await statusFor('/api/health')).status).toBe(200)
  })

  it.each(['/login', '/api/auth/login', '/api/trpc/health'])('allows public path %s', async (p) => {
    expect((await statusFor(p)).status).toBe(200)
  })

  it.each([
    '/',
    '/dosyalar',
    '/api/upload',
    '/api/files/1/a.pdf',
    '/api/healthz',
    '/uploads/sablon-pdf/x.pdf',
  ])('redirects %s to /login', async (p) => {
    const { status, location } = await statusFor(p)
    expect(status).toBe(307)
    expect(new URL(location!).pathname).toBe('/login')
  })
})
