import { createHash } from 'crypto'
import type { SessionOptions } from 'iron-session'

export interface SessionData {
  isLoggedIn: boolean
  /** Fingerprint of APP_PASSWORD at login — changing the password ends old sessions. */
  pwv?: string
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_PASSWORD!,
  cookieName: process.env.SESSION_COOKIE_NAME ?? 'sigorta-session',
  ttl: 60 * 60 * 24 * 7, // 7 days — per D-08
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // false for localhost http
    sameSite: 'lax',
    path: '/',
  },
}

/**
 * Short, non-reversible fingerprint of the current APP_PASSWORD. Stored in the
 * (encrypted) session at login and compared on every request, so rotating the
 * password invalidates every existing session. Null when no password is set.
 */
export function passwordVersion(): string | null {
  const password = process.env.APP_PASSWORD
  if (!password) return null
  return createHash('sha256').update(`kairos-session:${password}`).digest('hex').slice(0, 16)
}

export function isAuthenticated(session: Partial<SessionData>): boolean {
  const current = passwordVersion()
  return session.isLoggedIn === true && current !== null && session.pwv === current
}
