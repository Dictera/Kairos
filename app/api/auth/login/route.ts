import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions, type SessionData } from '@/lib/session'

export async function POST(req: Request) {
  const body = await req.json()
  const { password } = body as { password: string }

  if (!password || password !== process.env.APP_PASSWORD) {
    return Response.json(
      { error: 'Şifre hatalı. Lütfen tekrar deneyin.' },
      { status: 401 }
    )
  }

  // IMPORTANT: await cookies() — Next.js 15 async cookies API
  const cookieStore = await cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)
  session.isLoggedIn = true
  await session.save()

  return Response.json({ ok: true })
}
