import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { isAuthenticated, sessionOptions, type SessionData } from '@/lib/session'

export const createTRPCContext = async (opts: { headers: Headers }) => {
  // IMPORTANT: cookies() is async in Next.js 15 — must await
  const cookieStore = await cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)
  return {
    session,
    headers: opts.headers,
  }
}

const t = initTRPC.context<Awaited<ReturnType<typeof createTRPCContext>>>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    // Unexpected errors can carry internals (SQL, file paths): tRPC wraps any non-TRPCError
    // throw as INTERNAL_SERVER_ERROR with the original as `cause`. Hide those in production.
    // TRPCErrors thrown on purpose (no cause) keep their user-facing Turkish message.
    if (
      process.env.NODE_ENV === 'production' &&
      error.code === 'INTERNAL_SERVER_ERROR' &&
      error.cause !== undefined
    ) {
      return {
        ...shape,
        message: 'Sunucu hatası. Lütfen tekrar deneyin.',
        data: { ...shape.data, stack: undefined },
      }
    }
    return shape
  },
})

export const createTRPCRouter = t.router
export const publicProcedure = t.procedure
export const createCallerFactory = t.createCallerFactory

// protectedProcedure: throws UNAUTHORIZED unless the session is logged in with the current password
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!isAuthenticated(ctx.session)) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({ ctx: { session: ctx.session } })
})
