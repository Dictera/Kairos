import { describe, it, expect, vi, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('next/headers', () => ({ cookies: vi.fn().mockResolvedValue({}) }))
vi.mock('iron-session', () => ({
  getIronSession: vi.fn(async () => ({ isLoggedIn: false })),
}))

import { proxy } from '@/proxy'

async function send(
  pathname: string,
  {
    method = 'GET',
    host = '127.0.0.1:3000',
    origin,
  }: { method?: string; host?: string; origin?: string } = {},
) {
  const headers = new Headers({ host })
  if (origin !== undefined) headers.set('origin', origin)
  const res = await proxy(new NextRequest(`http://127.0.0.1:3000${pathname}`, { method, headers }))
  return { status: res.status, location: res.headers.get('location') }
}

describe('proxy: logged-out access', () => {
  it('lets launchers probe /api/health without a session', async () => {
    expect((await send('/api/health')).status).toBe(200)
  })

  it.each(['/login', '/api/auth/login', '/api/trpc/health'])('allows public path %s', async (p) => {
    expect((await send(p)).status).toBe(200)
  })

  it.each([
    '/',
    '/dosyalar',
    '/api/upload',
    '/api/files/1/a.pdf',
    '/api/healthz',
    '/uploads/sablon-pdf/x.pdf',
  ])('redirects %s to /login', async (p) => {
    const { status, location } = await send(p)
    expect(status).toBe(307)
    expect(new URL(location!).pathname).toBe('/login')
  })
})

describe('proxy: DNS rebinding (Host allowlist)', () => {
  afterEach(() => {
    delete process.env.KAIROS_ALLOWED_HOSTS
  })

  it.each(['127.0.0.1:3000', 'localhost:3000', 'LOCALHOST', '[::1]:3000'])(
    'accepts loopback host %s',
    async (host) => {
      expect((await send('/api/health', { host })).status).toBe(200)
    },
  )

  it.each([
    'attacker.example:3000',
    'attacker.example',
    '127.0.0.1.attacker.example',
    'localhost.evil',
  ])('rejects foreign host %s, even on public paths', async (host) => {
    expect((await send('/api/auth/login', { method: 'POST', host })).status).toBe(403)
    expect((await send('/api/health', { host })).status).toBe(403)
  })

  it('honours KAIROS_ALLOWED_HOSTS', async () => {
    process.env.KAIROS_ALLOWED_HOSTS = 'kairos.lan, other.lan'
    expect((await send('/api/health', { host: 'kairos.lan:8443' })).status).toBe(200)
    expect((await send('/api/health', { host: 'evil.lan' })).status).toBe(403)
  })
})

describe('proxy: CSRF (Origin must match Host on state-changing requests)', () => {
  it('allows same-origin POST', async () => {
    const r = await send('/api/auth/login', { method: 'POST', origin: 'http://127.0.0.1:3000' })
    expect(r.status).toBe(200)
  })

  it('allows POST without Origin (non-browser clients)', async () => {
    expect((await send('/api/auth/login', { method: 'POST' })).status).toBe(200)
  })

  it.each([
    'http://127.0.0.1:8080', // another local app: same-site, so Lax cookies would flow
    'http://localhost:3000', // different host spelling = different origin
    'https://evil.example',
    'null',
  ])('rejects POST from origin %s', async (origin) => {
    expect((await send('/api/upload', { method: 'POST', origin })).status).toBe(403)
    expect((await send('/api/auth/logout', { method: 'POST', origin })).status).toBe(403)
  })

  it('does not check Origin on GET', async () => {
    expect((await send('/api/health', { origin: 'https://evil.example' })).status).toBe(200)
  })
})
