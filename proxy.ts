import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { isAuthenticated, sessionOptions, type SessionData } from '@/lib/session'

// /api/health is public so launchers can probe readiness without a session
// (it only returns { ok: true }).
const PUBLIC_PATHS = ['/login', '/api/trpc', '/api/auth', '/api/health']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths through without auth check
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next()
  }

  // IMPORTANT: await cookies() — Next.js 15 async API
  const cookieStore = await cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

  if (!isAuthenticated(session)) {
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
