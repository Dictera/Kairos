import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions, type SessionData } from '@/lib/session'

// POST only: a GET logout could be triggered cross-site by a link or <img>.
export async function POST() {
  const cookieStore = await cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)
  session.destroy()
  return Response.json({ ok: true })
}
