import { describe, it, expect, afterEach, vi } from 'vitest'
import { TRPCError } from '@trpc/server'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { NextRequest } from 'next/server'

vi.mock('next/headers', () => ({ cookies: vi.fn().mockResolvedValue({}) }))
vi.mock('iron-session', () => ({ getIronSession: vi.fn(async () => ({ isLoggedIn: false })) }))
vi.mock('next/server', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/server')>()),
  connection: vi.fn().mockResolvedValue(undefined),
}))

import { createTRPCRouter, publicProcedure } from '@/lib/trpc/init'
import * as openFolder from '@/app/api/open-folder/route'
import { GET as sablonPdf } from '@/app/uploads/sablon-pdf/[...slug]/route'

describe('tRPC errorFormatter', () => {
  const router = createTRPCRouter({
    crash: publicProcedure.query(() => {
      throw new Error('SQLITE_ERROR: no such table: dosya (/home/user/Kairos/data/db.sqlite)')
    }),
    intended: publicProcedure.query(() => {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'LibreOffice bulunamadı.' })
    }),
    bad: publicProcedure.query(() => {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Geçersiz yol.' })
    }),
  })

  async function messageOf(path: string) {
    const res = await fetchRequestHandler({
      endpoint: '/api/trpc',
      req: new Request(`http://127.0.0.1/api/trpc/${path}`),
      router,
      createContext: () => ({ session: { isLoggedIn: false }, headers: new Headers() }) as never,
      onError: () => {},
    })
    // superjson transformer wraps the payload in { json }
    const body = (await res.json()) as { error: { json: { message: string } } }
    return body.error.json.message
  }

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('hides unexpected error details in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const msg = await messageOf('crash')
    expect(msg).toBe('Sunucu hatası. Lütfen tekrar deneyin.')
    expect(msg).not.toContain('SQLITE')
  })

  it('keeps intentional Turkish messages in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    expect(await messageOf('intended')).toBe('LibreOffice bulunamadı.')
    expect(await messageOf('bad')).toBe('Geçersiz yol.')
  })

  it('shows details outside production for debugging', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    expect(await messageOf('crash')).toContain('no such table')
  })
})

describe('side-effect and file routes', () => {
  it('open-folder only accepts POST', () => {
    expect('POST' in openFolder).toBe(true)
    expect('GET' in openFolder).toBe(false)
  })

  it('open-folder rejects anonymous POST', async () => {
    const res = await openFolder.POST(
      new NextRequest('http://127.0.0.1/api/open-folder?dosyaId=1', { method: 'POST' }),
    )
    expect(res.status).toBe(401)
  })

  it('sablon-pdf requires auth on its own, not only via proxy', async () => {
    const res = await sablonPdf(new NextRequest('http://127.0.0.1/uploads/sablon-pdf/a.pdf'), {
      params: Promise.resolve({ slug: ['a.pdf'] }),
    })
    expect(res.status).toBe(401)
  })
})
