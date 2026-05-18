import { createTRPCRouter, protectedProcedure } from '@/lib/trpc/init'
import { db } from '@/lib/db'
import { bildirim, dosya, durusma, sure } from '@/lib/schema'
import { eq, and, gte, lte, sql } from 'drizzle-orm'
import { format, subDays, addDays } from 'date-fns'
import { z } from 'zod'

function todayStr() {
  const now = new Date()
  return format(new Date(now.getFullYear(), now.getMonth(), now.getDate()), 'yyyy-MM-dd')
}

export const bildirimRouter = createTRPCRouter({
  sync: protectedProcedure.mutation(async () => {
    const today = todayStr()
    const yesterday = format(subDays(new Date(today + 'T00:00:00'), 1), 'yyyy-MM-dd')
    const tomorrow = format(addDays(new Date(today + 'T00:00:00'), 1), 'yyyy-MM-dd')

    // 1. Delete notifications older than yesterday (n-1)
    await db.delete(bildirim).where(lte(bildirim.tarih, yesterday))

    // 2. Sync hearings for yesterday, today, tomorrow
    const hearingRows = await db.select({
      id: durusma.id,
      tarih: durusma.tarih,
      saat: durusma.saat,
      mahkeme_kurum: durusma.mahkeme_kurum,
      dosya_id: durusma.dosya_id,
      dosya_no: dosya.dosya_no,
    })
      .from(durusma)
      .innerJoin(dosya, eq(durusma.dosya_id, dosya.id))
      .where(and(gte(durusma.tarih, yesterday), lte(durusma.tarih, tomorrow)))
      .orderBy(durusma.tarih, durusma.saat)

    for (const h of hearingRows) {
      const label = h.tarih === today ? 'Bugün' : h.tarih === yesterday ? 'Dün' : 'Yarın'
      const title = `${label} Duruşma`
      const message = `${h.mahkeme_kurum ?? 'Mahkeme'}${h.saat ? ` (${h.saat})` : ''}`
      await db.insert(bildirim).values({
        tip: 'durusma',
        baslik: title,
        mesaj: message,
        dosya_id: h.dosya_id,
        dosya_no: h.dosya_no,
        tarih: h.tarih,
      }).onConflictDoNothing({ target: [bildirim.tip, bildirim.dosya_id, bildirim.tarih] })
    }

    // 3. Sync deadlines for yesterday, today, tomorrow
    const deadlineRows = await db.select({
      id: sure.id,
      ad: sure.ad,
      son_tarih: sure.son_tarih,
      tur: sure.tur,
      dosya_id: sure.dosya_id,
      dosya_no: dosya.dosya_no,
    })
      .from(sure)
      .innerJoin(dosya, eq(sure.dosya_id, dosya.id))
      .where(and(gte(sure.son_tarih, yesterday), lte(sure.son_tarih, tomorrow)))
      .orderBy(sure.son_tarih)

    for (const s of deadlineRows) {
      const label = s.son_tarih === today ? 'Bugün' : s.son_tarih === yesterday ? 'Dün' : 'Yarın'
      const title = `${label} Süre Sonu`
      const message = s.ad
      await db.insert(bildirim).values({
        tip: 'sure',
        baslik: title,
        mesaj: message,
        dosya_id: s.dosya_id,
        dosya_no: s.dosya_no,
        tarih: s.son_tarih,
      }).onConflictDoNothing({ target: [bildirim.tip, bildirim.dosya_id, bildirim.tarih] })
    }

    return { ok: true }
  }),

  list: protectedProcedure.query(async () => {
    const rows = await db.select()
      .from(bildirim)
      .orderBy(sql`${bildirim.tarih} ASC, ${bildirim.created_at} DESC`)
    return rows
  }),

  markAsRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.delete(bildirim).where(eq(bildirim.id, input.id))
      return { ok: true }
    }),

  markAllAsRead: protectedProcedure.mutation(async () => {
    await db.delete(bildirim)
    return { ok: true }
  }),

  unreadCount: protectedProcedure.query(async () => {
    const rows = await db.select({ count: sql<number>`count(*)` }).from(bildirim)
    return rows[0]?.count ?? 0
  }),
})