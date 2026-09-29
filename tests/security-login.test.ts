import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const save = vi.fn()
vi.mock('next/headers', () => ({ cookies: vi.fn().mockResolvedValue({}) }))
vi.mock('iron-session', () => ({
  getIronSession: vi.fn(async () => ({ isLoggedIn: false, save })),
}))

import { POST } from '@/app/api/auth/login/route'
import { passwordMatches, resetLoginRateLimit } from '@/lib/login-rate-limit'

function login(body: unknown) {
  return POST(
    new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  )
}

describe('POST /api/auth/login', () => {
  const originalPassword = process.env.APP_PASSWORD

  beforeEach(() => {
    process.env.APP_PASSWORD = 'dogru-sifre'
    resetLoginRateLimit()
    save.mockClear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    process.env.APP_PASSWORD = originalPassword
  })

  it('logs in with the right password', async () => {
    const res = await login({ password: 'dogru-sifre' })
    expect(res.status).toBe(200)
    expect(save).toHaveBeenCalledOnce()
  })

  it('rejects a wrong or missing password', async () => {
    expect((await login({ password: 'yanlis' })).status).toBe(401)
    expect((await login({})).status).toBe(401)
    expect((await login({ password: 123 })).status).toBe(401)
    expect(save).not.toHaveBeenCalled()
  })

  it('returns 400 for malformed JSON instead of crashing', async () => {
    expect((await login('not-json')).status).toBe(400)
  })

  it('rejects every password when APP_PASSWORD is unset', async () => {
    delete process.env.APP_PASSWORD
    expect((await login({ password: '' })).status).toBe(401)
    expect((await login({ password: 'undefined' })).status).toBe(401)
  })

  it('locks the login after 5 failures, even for the right password', async () => {
    for (let i = 0; i < 5; i++) {
      expect((await login({ password: `yanlis-${i}` })).status).toBe(401)
    }
    const locked = await login({ password: 'dogru-sifre' })
    expect(locked.status).toBe(429)
    expect(Number(locked.headers.get('Retry-After'))).toBe(60)
    expect(save).not.toHaveBeenCalled()

    vi.advanceTimersByTime(60_000)
    expect((await login({ password: 'dogru-sifre' })).status).toBe(200)
  })

  it('doubles the lock on repeated lockouts, capped at 15 minutes', async () => {
    const expected = [60, 120, 240, 480, 900, 900]
    for (const seconds of expected) {
      for (let i = 0; i < 5; i++) await login({ password: 'yanlis' })
      const res = await login({ password: 'yanlis' })
      expect(res.status).toBe(429)
      expect(Number(res.headers.get('Retry-After'))).toBe(seconds)
      vi.advanceTimersByTime(seconds * 1000)
    }
  })

  it('resets the failure count after a successful login', async () => {
    for (let i = 0; i < 4; i++) await login({ password: 'yanlis' })
    expect((await login({ password: 'dogru-sifre' })).status).toBe(200)
    for (let i = 0; i < 4; i++) await login({ password: 'yanlis' })
    expect((await login({ password: 'dogru-sifre' })).status).toBe(200)
  })
})

describe('passwordMatches', () => {
  it('compares exactly, including different lengths', () => {
    expect(passwordMatches('abc', 'abc')).toBe(true)
    expect(passwordMatches('abc', 'abcd')).toBe(false)
    expect(passwordMatches('', 'abc')).toBe(false)
  })
})
