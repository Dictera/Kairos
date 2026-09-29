import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { isAuthenticated, sessionOptions, type SessionData } from '@/lib/session'

// /api/health is public so launchers can probe readiness without a session
// (it only returns { ok: true }).
const PUBLIC_PATHS = ['/login', '/api/trpc', '/api/auth', '/api/health']

// The server listens on 127.0.0.1 only, so every legitimate request names a
// loopback host. Anything else is a DNS-rebinding attempt: an attacker's domain
// re-resolved to 127.0.0.1 so their page becomes "same-origin" with Kairos.
// KAIROS_ALLOWED_HOSTS (comma-separated hostnames) extends the list for setups
// behind a local reverse proxy.
const LOOPBACK_HOSTS = ['localhost', '127.0.0.1', '[::1]']

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

function allowedHosts(): Set<string> {
  const extra = (process.env.KAIROS_ALLOWED_HOSTS ?? '')
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean)
  return new Set([...LOOPBACK_HOSTS, ...extra])
}

/** Parses a Host header value ("127.0.0.1:3000", "[::1]:3000") into { hostname, host }. */
function parseHost(value: string | null): { hostname: string; host: string } | null {
  if (!value) return null
  try {
    const url = new URL(`http://${value}`)
    return { hostname: url.hostname.toLowerCase(), host: url.host.toLowerCase() }
  } catch {
    return null
  }
}

function forbidden(message: string) {
  return NextResponse.json({ error: message }, { status: 403 })
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Use the raw header: nextUrl normalises 127.0.0.1 to localhost.
  const host = parseHost(request.headers.get('host'))
  if (!host || !allowedHosts().has(host.hostname)) {
    return forbidden('Geçersiz host.')
  }

  // CSRF: state-changing requests must come from this same origin. Browsers
  // always send Origin on cross-origin POSTs — including from other ports on
  // localhost, which SameSite=Lax treats as same-site and would send cookies to.
  if (!SAFE_METHODS.has(request.method)) {
    const origin = request.headers.get('origin')
    if (origin !== null) {
      let originHost: string | null = null
      try {
        originHost = new URL(origin).host.toLowerCase()
      } catch {
        // "null" or malformed origin — reject below
      }
      if (originHost !== host.host) {
        return forbidden('Geçersiz istek kaynağı.')
      }
    }
  }

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
