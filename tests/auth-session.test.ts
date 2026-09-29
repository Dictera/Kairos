import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { TRPCError } from '@trpc/server'

const session: Record<string, unknown> & { save: () => Promise<void>; destroy: () => void } = {
  save: vi.fn(async () => {}),
  destroy: vi.fn(),
}
vi.mock('next/headers', () => ({ cookies: vi.fn().mockResolvedValue({}) }))
vi.mock('iron-session', () => ({ getIronSession: vi.fn(async () => session) }))

import { isAuthenticated, passwordVersion, type SessionData } from '@/lib/session'
import { createTRPCRouter, protectedProcedure } from '@/lib/trpc/init'
import { POST as login } from '@/app/api/auth/login/route'
import { POST as logout } from '@/app/api/auth/logout/route'
import { resetLoginRateLimit } from '@/lib/login-rate-limit'

const original = process.env.APP_PASSWORD

beforeEach(() => {
  process.env.APP_PASSWORD = 'eski-sifre-123'
  for (const k of Object.keys(session)) if (k !== 'save' && k !== 'destroy') delete session[k]
  vi.mocked(session.save).mockClear()
  vi.mocked(session.destroy).mockClear()
  resetLoginRateLimit()
})
afterEach(() => {
  process.env.APP_PASSWORD = original
})

describe('isAuthenticated', () => {
  it('accepts a session created with the current password', () => {
    expect(isAuthenticated({ isLoggedIn: true, pwv: passwordVersion()! })).toBe(true)
  })

  it('rejects sessions after APP_PASSWORD changes', () => {
    const s = { isLoggedIn: true, pwv: passwordVersion()! }
    process.env.APP_PASSWORD = 'yeni-sifre-456'
    expect(isAuthenticated(s)).toBe(false)
  })

  it('rejects legacy sessions without a fingerprint', () => {
    expect(isAuthenticated({ isLoggedIn: true })).toBe(false)
  })

  it('rejects everything when APP_PASSWORD is unset', () => {
    const s = { isLoggedIn: true, pwv: passwordVersion()! }
    delete process.env.APP_PASSWORD
    expect(passwordVersion()).toBeNull()
    expect(isAuthenticated(s)).toBe(false)
  })

  it('does not expose the password itself', () => {
    expect(passwordVersion()).toMatch(/^[0-9a-f]{16}$/)
    expect(passwordVersion()).not.toContain('eski')
  })
})

describe('protectedProcedure', () => {
  const router = createTRPCRouter({ ping: protectedProcedure.query(() => 'pong') })
  const call = (s: object) =>
    router.createCaller({ session: s, headers: new Headers() } as never).ping()

  it('allows a current session', async () => {
    await expect(call({ isLoggedIn: true, pwv: passwordVersion() })).resolves.toBe('pong')
  })

  it('rejects a session from before a password change', async () => {
    const stale = { isLoggedIn: true, pwv: passwordVersion() }
    process.env.APP_PASSWORD = 'yeni-sifre-456'
    await expect(call(stale)).rejects.toBeInstanceOf(TRPCError)
  })
})

describe('login / logout routes', () => {
  function loginReq(password: string) {
    return login(
      new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password }),
      }),
    )
  }

  it('login stores the password fingerprint in the session', async () => {
    expect((await loginReq('eski-sifre-123')).status).toBe(200)
    expect(session.isLoggedIn).toBe(true)
    expect(session.pwv).toBe(passwordVersion())
    expect(isAuthenticated(session as Partial<SessionData>)).toBe(true)
  })

  it('logout destroys the session', async () => {
    const res = await logout()
    expect(res.status).toBe(200)
    expect(session.destroy).toHaveBeenCalledOnce()
  })
})
