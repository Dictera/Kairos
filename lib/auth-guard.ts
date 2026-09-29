import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { NextResponse } from 'next/server'
import { isAuthenticated, sessionOptions, type SessionData } from '@/lib/session'

export async function requireAuth(): Promise<NextResponse | null> {
  const cookieStore = await cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)
  if (!isAuthenticated(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}
