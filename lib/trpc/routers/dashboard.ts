import { createTRPCRouter, protectedProcedure } from '@/lib/trpc/init'
import { db } from '@/lib/db'
import { dosya, muvekkil, sure, durusma } from '@/lib/schema'
import { eq, and, gte, lte, sql, count } from 'drizzle-orm'
import { addDays, format } from 'date-fns'

// ── Prepared statements (module scope) ──────────────────────────────────────
// Compiled once and reused across requests. better-sqlite3 evaluates strftime
// ('now') at run time, so the date-derived counts stay correct day to day.

// Combined dosya counts — replaces 3 separate COUNT round-trips.
const dosyaCountsPrep = db.select({
  total: count(),
  aktif: sql<number>`SUM(CASE WHEN ${dosya.durum} = 'aktif' THEN 1 ELSE 0 END)`,
  buAy: sql<number>`SUM(CASE WHEN strftime('%Y-%m', ${dosya.created_at}) = strftime('%Y-%m', 'now') THEN 1 ELSE 0 END)`,
}).from(dosya).prepare()

// stats endpoint also needs last month — one query instead of 4.
const dosyaCountsWithPrevPrep = db.select({
  total: count(),
  aktif: sql<number>`SUM(CASE WHEN ${dosya.durum} = 'aktif' THEN 1 ELSE 0 END)`,
  buAy: sql<number>`SUM(CASE WHEN strftime('%Y-%m', ${dosya.created_at}) = strftime('%Y-%m', 'now') THEN 1 ELSE 0 END)`,
  gecenAy: sql<number>`SUM(CASE WHEN strftime('%Y-%m', ${dosya.created_at}) = strftime('%Y-%m', 'now', '-1 month') THEN 1 ELSE 0 END)`,
}).from(dosya).prepare()

// Upcoming deadlines in a [today, today+14d] window — date bounds bound at run time.
const deadlinesPrep = db.select({
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
  .where(and(gte(sure.son_tarih, sql.placeholder('today')), lte(sure.son_tarih, sql.placeholder('in14'))))
  .orderBy(sure.son_tarih)
  .prepare()

// Hearings scheduled for a given day.
const hearingsPrep = db.select({
  id: durusma.id,
  tarih: durusma.tarih,
  saat: durusma.saat,
  mahkeme_kurum: durusma.mahkeme_kurum,
  dosya_id: durusma.dosya_id,
  dosya_no: dosya.dosya_no,
})
  .from(durusma)
  .innerJoin(dosya, eq(durusma.dosya_id, dosya.id))
  .where(eq(durusma.tarih, sql.placeholder('today')))
  .orderBy(durusma.saat)
  .prepare()

function todayStr(): string {
  const now = new Date()
  return format(new Date(now.getFullYear(), now.getMonth(), now.getDate()), 'yyyy-MM-dd')
}

function in14Str(): string {
  const now = new Date()
  return format(addDays(new Date(now.getFullYear(), now.getMonth(), now.getDate()), 14), 'yyyy-MM-dd')
}

export const dashboardRouter = createTRPCRouter({
  dashboardStats: protectedProcedure.query(async () => {
    const today = todayStr()
    const in14 = in14Str()

    const [counts, deadlineRows, hearingRows] = await Promise.all([
      dosyaCountsPrep.get(),
      deadlinesPrep.all({ today, in14 }),
      hearingsPrep.all({ today }),
    ])

    return {
      totalDosya: counts?.total ?? 0,
      aktivDosya: Number(counts?.aktif ?? 0),
      buAyAcilan: Number(counts?.buAy ?? 0),
      upcomingDeadlines: deadlineRows,
      todaysHearings: hearingRows,
    }
  }),

  stats: protectedProcedure.query(async () => {
    const counts = await dosyaCountsWithPrevPrep.get()

    const totalDosya = counts?.total ?? 0
    const aktivDosya = Number(counts?.aktif ?? 0)
    const buAyAcilan = Number(counts?.buAy ?? 0)
    const gecenAyAcilan = Number(counts?.gecenAy ?? 0)

    return {
      totalDosya,
      aktivDosya,
      buAyAcilan,
      totalDelta: buAyAcilan,
      aktivDelta: buAyAcilan,
      buAyDelta: buAyAcilan - gecenAyAcilan,
    }
  }),

  todaysHearings: protectedProcedure.query(async () => {
    return hearingsPrep.all({ today: todayStr() })
  }),

  upcomingDeadlines: protectedProcedure.query(async () => {
    return deadlinesPrep.all({ today: todayStr(), in14: in14Str() })
  }),
})
