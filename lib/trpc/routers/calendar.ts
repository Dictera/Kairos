import { createTRPCRouter, protectedProcedure } from '@/lib/trpc/init'
import { db } from '@/lib/db'
import { dosya, muvekkil, sure, durusma } from '@/lib/schema'
import { eq, and, gte, lte, sql } from 'drizzle-orm'
import { z } from 'zod'
import { endOfMonth, format } from 'date-fns'

export type MonthEvent = {
  id: number
  type: 'süre' | 'duruşma'
  ad: string
  dosya_id: number
  dosya_no: string
  muvekkil_ad: string
  tarih: string // YYYY-MM-DD
  saat: string | null // HH:mm or null for süre
}

export const calendarRouter = createTRPCRouter({
  getMonthEvents: protectedProcedure
    .input(
      z.object({
        year: z.number(),
        month: z.number().int().min(1).max(12),
      })
    )
    .query(async ({ input }) => {
      const { year, month } = input

      // Calculate start and end dates for the month
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`
      const endDate = format(
        endOfMonth(new Date(year, month - 1)),
        'yyyy-MM-dd'
      )

      // Query süre (deadlines) for the month
      const sureRows = await db
        .select({
          id: sure.id,
          ad: sure.ad,
          son_tarih: sure.son_tarih,
          tur: sure.tur,
          dosya_id: sure.dosya_id,
          dosya_no: dosya.dosya_no,
          muvekkil_ad: sql<string>`${muvekkil.ad} || ' ' || ${muvekkil.soyad}`,
        })
        .from(sure)
        .innerJoin(dosya, eq(sure.dosya_id, dosya.id))
        .innerJoin(muvekkil, eq(dosya.muvekkil_id, muvekkil.id))
        .where(and(gte(sure.son_tarih, startDate), lte(sure.son_tarih, endDate)))
        .orderBy(sure.son_tarih)

      // Query duruşma (hearings) for the month
      const durusmaRows = await db
        .select({
          id: durusma.id,
          ad: durusma.tur, // Use tur as ad for durusma
          tarih: durusma.tarih,
          saat: durusma.saat,
          mahkeme_kurum: durusma.mahkeme_kurum,
          dosya_id: durusma.dosya_id,
          dosya_no: dosya.dosya_no,
          muvekkil_ad: sql<string>`${muvekkil.ad} || ' ' || ${muvekkil.soyad}`,
        })
        .from(durusma)
        .innerJoin(dosya, eq(durusma.dosya_id, dosya.id))
        .innerJoin(muvekkil, eq(dosya.muvekkil_id, muvekkil.id))
        .where(and(gte(durusma.tarih, startDate), lte(durusma.tarih, endDate)))
        .orderBy(durusma.tarih, durusma.saat)

      // Transform süre rows to MonthEvent format
      const sureEvents: MonthEvent[] = sureRows.map((row) => ({
        id: row.id,
        type: 'süre' as const,
        ad: row.ad,
        dosya_id: row.dosya_id,
        dosya_no: row.dosya_no,
        muvekkil_ad: row.muvekkil_ad,
        tarih: row.son_tarih,
        saat: null, // süre doesn't have time
      }))

      // Transform durusma rows to MonthEvent format
      const durusmaEvents: MonthEvent[] = durusmaRows.map((row) => ({
        id: row.id,
        type: 'duruşma' as const,
        ad: row.ad ?? row.mahkeme_kurum ?? 'Duruşma',
        dosya_id: row.dosya_id,
        dosya_no: row.dosya_no,
        muvekkil_ad: row.muvekkil_ad,
        tarih: row.tarih,
        saat: row.saat,
      }))

      // Combine events and sort by tarih, with süre before duruşma on same day
      const events = [...sureEvents, ...durusmaEvents].sort((a, b) => {
        const dateCompare = a.tarih.localeCompare(b.tarih)
        if (dateCompare !== 0) return dateCompare
        // süre comes before duruşma
        return a.type === 'süre' ? -1 : 1
      })

      return { events }
    }),
})
