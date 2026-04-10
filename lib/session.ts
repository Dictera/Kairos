import type { SessionOptions } from 'iron-session'

export interface SessionData {
  isLoggedIn: boolean
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
