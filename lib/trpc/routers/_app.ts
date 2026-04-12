import { createTRPCRouter, publicProcedure } from '@/lib/trpc/init'
import { muvekkillRouter } from './muvekkil'
import { ayarlarRouter } from './ayarlar'
import { dosyaRouter } from './dosya'
import { surecRouter } from './surec'

export const appRouter = createTRPCRouter({
  health: publicProcedure.query(() => ({
    ok: true,
    timestamp: new Date(), // Date survives wire as Date object via superjson
  })),
  muvekkil: muvekkillRouter,
  ayarlar: ayarlarRouter,
  dosya: dosyaRouter,
  surec: surecRouter,
})

export type AppRouter = typeof appRouter
