import { createTRPCRouter, protectedProcedure } from '@/lib/trpc/init'
import { db } from '@/lib/db'
import { finans_kalemi } from '@/lib/schema'
import { eq, desc, sql, and } from 'drizzle-orm'
import { z } from 'zod'

const finansTurEnum = z.enum(['Gelen', 'Giden', 'Masraf'])

export const finansRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ dosya_id: z.number().int() }))
    .query(async ({ input }) => {
      return db.select().from(finans_kalemi)
        .where(eq(finans_kalemi.dosya_id, input.dosya_id))
        .orderBy(desc(finans_kalemi.tarih))
    }),

  create: protectedProcedure
    .input(z.object({
      dosya_id: z.number().int(),
      tur: finansTurEnum,
      tutar: z.number().positive('Tutar pozitif olmalıdır'),
      tarih: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD formatı gerekli'),
      aciklama: z.string().max(500).optional().or(z.literal('')),
    }))
    .mutation(async ({ input }) => {
      const [row] = await db.insert(finans_kalemi).values(input).returning()
      return row
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number().int(),
      tur: finansTurEnum.optional(),
      tutar: z.number().positive().optional(),
      tarih: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      aciklama: z.string().max(500).optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...values } = input
      const [row] = await db.update(finans_kalemi)
        .set(values)
        .where(eq(finans_kalemi.id, id))
        .returning()
      return row
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      await db.delete(finans_kalemi).where(eq(finans_kalemi.id, input.id))
      return { success: true }
    }),

  getSummary: protectedProcedure
    .input(z.object({ dosya_id: z.number().int() }))
    .query(async ({ input }) => {
      const rows = await db.select({
        tur: finans_kalemi.tur,
        toplam: sql<number>`SUM(${finans_kalemi.tutar})`,
      }).from(finans_kalemi)
        .where(eq(finans_kalemi.dosya_id, input.dosya_id))
        .groupBy(finans_kalemi.tur)

      const gelen = rows.find(r => r.tur === 'Gelen')?.toplam ?? 0
      const giden = rows.find(r => r.tur === 'Giden')?.toplam ?? 0
      const masraf = rows.find(r => r.tur === 'Masraf')?.toplam ?? 0

      return {
        gelen,
        giden,
        masraf,
        net: gelen - giden - masraf,
      }
    }),

  dashboard: protectedProcedure
    .input(z.object({
      yil: z.number().int().optional(),
    }))
    .query(async ({ input }) => {
      const yearFilter = input.yil 
        ? sql`strftime('%Y', ${finans_kalemi.tarih}) = ${String(input.yil)}`
        : undefined

      // Monthly aggregation
      const monthly = await db.select({
        ay: sql<string>`strftime('%Y-%m', ${finans_kalemi.tarih})`,
        gelen: sql<number>`SUM(CASE WHEN ${finans_kalemi.tur} = 'Gelen' THEN ${finans_kalemi.tutar} ELSE 0 END)`,
        giden: sql<number>`SUM(CASE WHEN ${finans_kalemi.tur} = 'Giden' THEN ${finans_kalemi.tutar} ELSE 0 END)`,
        masraf: sql<number>`SUM(CASE WHEN ${finans_kalemi.tur} = 'Masraf' THEN ${finans_kalemi.tutar} ELSE 0 END)`,
      }).from(finans_kalemi)
        .where(yearFilter ? and(yearFilter) : undefined)
        .groupBy(sql`strftime('%Y-%m', ${finans_kalemi.tarih})`)
        .orderBy(sql`strftime('%Y-%m', ${finans_kalemi.tarih})`)

      // Yearly aggregation
      const yearly = await db.select({
        yil: sql<string>`strftime('%Y', ${finans_kalemi.tarih})`,
        gelen: sql<number>`SUM(CASE WHEN ${finans_kalemi.tur} = 'Gelen' THEN ${finans_kalemi.tutar} ELSE 0 END)`,
        giden: sql<number>`SUM(CASE WHEN ${finans_kalemi.tur} = 'Giden' THEN ${finans_kalemi.tutar} ELSE 0 END)`,
        masraf: sql<number>`SUM(CASE WHEN ${finans_kalemi.tur} = 'Masraf' THEN ${finans_kalemi.tutar} ELSE 0 END)`,
      }).from(finans_kalemi)
        .groupBy(sql`strftime('%Y', ${finans_kalemi.tarih})`)
        .orderBy(sql`strftime('%Y', ${finans_kalemi.tarih})`)

      return { monthly, yearly }
    }),
})
