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

describe('proxy: cross-origin writes', () => {
  function post(headers: Record<string, string>) {
    return proxy(
      new NextRequest('http://127.0.0.1:3000/api/auth/login', {
        method: 'POST',
        headers: { host: '127.0.0.1:3000', ...headers },
      }),
    )
  }

  it('rejects a POST whose Origin is another local app', async () => {
    expect((await post({ origin: 'http://127.0.0.1:8080' })).status).toBe(403)
  })

  it('rejects an opaque "null" Origin', async () => {
    expect((await post({ origin: 'null' })).status).toBe(403)
  })

  it('allows same-origin and Origin-less POSTs', async () => {
    expect((await post({ origin: 'http://127.0.0.1:3000' })).status).toBe(200)
    expect((await post({})).status).toBe(200)
  })

  it('does not check GET requests', async () => {
    const res = await proxy(
      new NextRequest('http://127.0.0.1:3000/api/health', {
        headers: { host: '127.0.0.1:3000', origin: 'http://evil.test' },
      }),
    )
    expect(res.status).toBe(200)
  })
})
