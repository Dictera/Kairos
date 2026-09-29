import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter } from '@/lib/trpc/routers/_app'
import { createTRPCContext } from '@/lib/trpc/init'

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createTRPCContext({ headers: req.headers }),
    onError({ error, path }) {
      // Clients only see a generic message for these (see errorFormatter) — keep details in the log.
      if (error.code === 'INTERNAL_SERVER_ERROR' && error.cause)
        console.error(`[trpc] ${path ?? '?'}:`, error)
    },
  })

export { handler as GET, handler as POST }
