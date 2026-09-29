import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions, type SessionData } from '@/lib/session'
import {
  loginLockRemainingMs,
  passwordMatches,
  recordLoginFailure,
  recordLoginSuccess,
} from '@/lib/login-rate-limit'

export async function POST(req: Request) {
  let password: unknown
  try {
    ;({ password } = (await req.json()) as { password?: unknown })
  } catch {
    return Response.json({ error: 'Geçersiz istek.' }, { status: 400 })
  }

  // No await between the lock check, the comparison and recording the result,
  // so concurrent requests cannot slip past the limit.
  const lockMs = loginLockRemainingMs()
  if (lockMs > 0) {
    const retryAfter = Math.ceil(lockMs / 1000)
    return Response.json(
      { error: `Çok fazla hatalı deneme. ${retryAfter} saniye sonra tekrar deneyin.` },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    )
  }

  const expected = process.env.APP_PASSWORD
  if (!expected || typeof password !== 'string' || !password || !passwordMatches(password, expected)) {
    recordLoginFailure()
    return Response.json(
      { error: 'Şifre hatalı. Lütfen tekrar deneyin.' },
      { status: 401 }
    )
  }
  recordLoginSuccess()

  // IMPORTANT: await cookies() — Next.js 15 async cookies API
  const cookieStore = await cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)
  session.isLoggedIn = true
  await session.save()

  return Response.json({ ok: true })
}
