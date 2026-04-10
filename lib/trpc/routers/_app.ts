import { createTRPCRouter, publicProcedure } from '@/lib/trpc/init'

export const appRouter = createTRPCRouter({
  health: publicProcedure.query(() => ({
    ok: true,
    timestamp: new Date(), // Date survives wire as Date object via superjson
  })),
})

export type AppRouter = typeof appRouter
