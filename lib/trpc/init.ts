import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, type SessionData } from '@/lib/session'

export const createTRPCContext = async (opts: { headers: Headers }) => {
  // IMPORTANT: cookies() is async in Next.js 15 — must await
  const cookieStore = await cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)
  return {
    session,
    headers: opts.headers,
  }
}

const t = initTRPC
  .context<Awaited<ReturnType<typeof createTRPCContext>>>()
  .create({
    transformer: superjson,
  })

export const createTRPCRouter = t.router
export const publicProcedure = t.procedure
export const createCallerFactory = t.createCallerFactory

// protectedProcedure: throws UNAUTHORIZED if session.isLoggedIn is false
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session.isLoggedIn) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({ ctx: { session: ctx.session } })
})
