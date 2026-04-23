import { createTRPCRouter, protectedProcedure } from '@/lib/trpc/init'
import { db } from '@/lib/db'
import { finans_kalemi, dosya, sigortaSirketi, sigortaTuru } from '@/lib/schema'
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

      const monthly = await db.select({
        ay: sql<string>`strftime('%Y-%m', ${finans_kalemi.tarih})`,
        gelen: sql<number>`SUM(CASE WHEN ${finans_kalemi.tur} = 'Gelen' THEN ${finans_kalemi.tutar} ELSE 0 END)`,
        giden: sql<number>`SUM(CASE WHEN ${finans_kalemi.tur} = 'Giden' THEN ${finans_kalemi.tutar} ELSE 0 END)`,
        masraf: sql<number>`SUM(CASE WHEN ${finans_kalemi.tur} = 'Masraf' THEN ${finans_kalemi.tutar} ELSE 0 END)`,
      }).from(finans_kalemi)
        .where(yearFilter ? and(yearFilter) : undefined)
        .groupBy(sql`strftime('%Y-%m', ${finans_kalemi.tarih})`)
        .orderBy(sql`strftime('%Y-%m', ${finans_kalemi.tarih})`)

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

  // Sigorta şirketi bazlı talep/tahsilat/dosya analizi
  sirket: protectedProcedure
    .query(async () => {
      const rows = await db.select({
        ad: sigortaSirketi.ad,
        talep: sql<number>`COALESCE(SUM(${dosya.talep_tutari}), 0)`,
        tahsilat: sql<number>`COALESCE(SUM(CASE WHEN ${finans_kalemi.tur} = 'Gelen' THEN ${finans_kalemi.tutar} ELSE 0 END), 0)`,
        dosya_sayisi: sql<number>`COUNT(DISTINCT ${dosya.id})`,
      })
        .from(sigortaSirketi)
        .innerJoin(dosya, eq(dosya.karsitaraf_sigorta_id, sigortaSirketi.id))
        .leftJoin(finans_kalemi, eq(finans_kalemi.dosya_id, dosya.id))
        .groupBy(sigortaSirketi.id, sigortaSirketi.ad)
        .orderBy(sql`COALESCE(SUM(${dosya.talep_tutari}), 0) DESC`)

      return rows.map(r => ({
        ad: r.ad,
        talep: Number(r.talep),
        tahsilat: Number(r.tahsilat),
        dosya: Number(r.dosya_sayisi),
      }))
    }),

  // Sigorta türü bazlı gelen analizi (pasta grafik)
  tur: protectedProcedure
    .query(async () => {
      const COLORS = ['#1c768f', '#22c55e', '#f97316', '#746cac', '#ef4444', '#eab308', '#06b6d4']

      const rows = await db.select({
        tur: sigortaTuru.ad,
        gelen: sql<number>`COALESCE(SUM(CASE WHEN ${finans_kalemi.tur} = 'Gelen' THEN ${finans_kalemi.tutar} ELSE 0 END), 0)`,
      })
        .from(sigortaTuru)
        .innerJoin(dosya, eq(dosya.sigorta_turu_id, sigortaTuru.id))
        .leftJoin(finans_kalemi, eq(finans_kalemi.dosya_id, dosya.id))
        .groupBy(sigortaTuru.id, sigortaTuru.ad)
        .orderBy(sql`COALESCE(SUM(CASE WHEN ${finans_kalemi.tur} = 'Gelen' THEN ${finans_kalemi.tutar} ELSE 0 END), 0) DESC`)

      return rows.map((r, i) => ({
        tur: r.tur,
        gelen: Number(r.gelen),
        renk: COLORS[i % COLORS.length],
      }))
    }),

  // Dosya türü (STK/AT/AH) bazlı gelen/giden/masraf analizi
  dosyaTur: protectedProcedure
    .query(async () => {
      const rows = await db.select({
        tur: dosya.tur,
        gelen: sql<number>`COALESCE(SUM(CASE WHEN ${finans_kalemi.tur} = 'Gelen' THEN ${finans_kalemi.tutar} ELSE 0 END), 0)`,
        giden: sql<number>`COALESCE(SUM(CASE WHEN ${finans_kalemi.tur} = 'Giden' THEN ${finans_kalemi.tutar} ELSE 0 END), 0)`,
        masraf: sql<number>`COALESCE(SUM(CASE WHEN ${finans_kalemi.tur} = 'Masraf' THEN ${finans_kalemi.tutar} ELSE 0 END), 0)`,
      })
        .from(dosya)
        .leftJoin(finans_kalemi, eq(finans_kalemi.dosya_id, dosya.id))
        .groupBy(dosya.tur)
        .orderBy(dosya.tur)

      return rows.map(r => ({
        tur: r.tur,
        gelen: Number(r.gelen),
        giden: Number(r.giden),
        masraf: Number(r.masraf),
      }))
    }),
})
