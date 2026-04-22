import { createTRPCRouter, publicProcedure } from '@/lib/trpc/init'
import { muvekkillRouter } from './muvekkil'
import { ayarlarRouter } from './ayarlar'
import { dosyaRouter } from './dosya'
import { surecRouter } from './surec'
import { sureRouter } from './sure'
import { dashboardRouter } from './dashboard'
import { calendarRouter } from './calendar'
import { belgeRouter } from './belge'
import { finansRouter } from './finans'
import { raporRouter } from './rapor'
import { notlarRouter } from './notlar'
import { olayRouter } from './olay'
import { pipelineRouter } from './pipeline'
import { sablonRouter } from './sablon'
import { pdfRouter } from './pdf'

export const appRouter = createTRPCRouter({
  health: publicProcedure.query(() => ({
    ok: true,
    timestamp: new Date(), // Date survives wire as Date object via superjson
  })),
  muvekkil: muvekkillRouter,
  ayarlar: ayarlarRouter,
  dosya: dosyaRouter,
  surec: surecRouter,
  sure: sureRouter,
  dashboard: dashboardRouter,
  calendar: calendarRouter,
  belge: belgeRouter,
  finans: finansRouter,
  rapor: raporRouter,
  notlar: notlarRouter,
  olay: olayRouter,
  pipeline: pipelineRouter,
  sablon: sablonRouter,
  pdf: pdfRouter,
})

export type AppRouter = typeof appRouter
