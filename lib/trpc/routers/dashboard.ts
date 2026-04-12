import { createTRPCRouter, protectedProcedure } from '@/lib/trpc/init'
import { db } from '@/lib/db'
import { dosya, muvekkil, sure, durusma } from '@/lib/schema'
import { eq, and, gte, lte, sql } from 'drizzle-orm'
import { count } from 'drizzle-orm'
import { addDays, format } from 'date-fns'

export const dashboardRouter = createTRPCRouter({
  dashboardStats: protectedProcedure.query(async () => {
    const now = new Date()
    const today = format(new Date(now.getFullYear(), now.getMonth(), now.getDate()), 'yyyy-MM-dd')
    const in14Days = format(addDays(new Date(now.getFullYear(), now.getMonth(), now.getDate()), 14), 'yyyy-MM-dd')

    const [totalRows, activeRows, thisMonthRows, deadlineRows, hearingRows] = await Promise.all([
      db.select({ count: count() }).from(dosya),
      db.select({ count: count() }).from(dosya).where(eq(dosya.durum, 'aktif')),
      db.select({ count: count() }).from(dosya).where(
        sql`strftime('%Y-%m', ${dosya.created_at}) = strftime('%Y-%m', 'now')`
      ),
      db.select({
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
        .where(and(gte(sure.son_tarih, today), lte(sure.son_tarih, in14Days)))
        .orderBy(sure.son_tarih),
      db.select({
        id: durusma.id,
        tarih: durusma.tarih,
        saat: durusma.saat,
        mahkeme_kurum: durusma.mahkeme_kurum,
        dosya_id: durusma.dosya_id,
        dosya_no: dosya.dosya_no,
      })
        .from(durusma)
        .innerJoin(dosya, eq(durusma.dosya_id, dosya.id))
        .where(eq(durusma.tarih, today))
        .orderBy(durusma.saat),
    ])

    return {
      totalDosya: totalRows[0]?.count ?? 0,
      aktivDosya: activeRows[0]?.count ?? 0,
      buAyAcilan: thisMonthRows[0]?.count ?? 0,
      upcomingDeadlines: deadlineRows,
      todaysHearings: hearingRows,
    }
  }),
})
