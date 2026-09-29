import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, type SessionData } from '@/lib/session'

// /api/health is public so launchers can probe readiness without a session
// (it only returns { ok: true }).
const PUBLIC_PATHS = ['/login', '/api/trpc', '/api/auth', '/api/health']

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

/**
 * CSRF guard for state-changing requests. SameSite=Lax does not stop them from
 * other apps on the same machine (every localhost port is "same-site"), so a
 * browser-sent Origin must match the Host this server was reached on.
 * Requests without an Origin header (curl, launchers) are not browser CSRF.
 */
function isCrossOrigin(request: NextRequest): boolean {
  if (SAFE_METHODS.has(request.method)) return false
  const origin = request.headers.get('origin')
  if (!origin) return false
  try {
    return new URL(origin).host !== request.headers.get('host')
  } catch {
    return true // "null" or malformed origin
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isCrossOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Allow public paths through without auth check
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next()
  }

  // IMPORTANT: await cookies() — Next.js 15 async API
  const cookieStore = await cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

  if (!session.isLoggedIn) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all paths except Next.js internals and static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
