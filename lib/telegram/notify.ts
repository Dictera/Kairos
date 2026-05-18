/**
 * Telegram Notification Service — pending bildirim sender
 *
 * Queries bildirim rows that:
 * - have telegram_sent_at IS NULL (not yet sent) — D-13
 * - have tarih in today or tomorrow — D-06
 *
 * For each row: sends Telegram message, then marks telegram_sent_at = now() — D-14
 * Error policy: per-row try/catch; failure logs and continues loop — D-16, D-17
 */
import { db } from '@/lib/db'
import { bildirim } from '@/lib/schema'
import { and, isNull, inArray, eq } from 'drizzle-orm'
import { format, addDays } from 'date-fns'
import { sendTelegramMessage } from './send'

// Copied verbatim from lib/trpc/routers/bildirim.ts (not exported from there)
function todayStr(): string {
  const now = new Date()
  return format(new Date(now.getFullYear(), now.getMonth(), now.getDate()), 'yyyy-MM-dd')
}

function tomorrowStr(): string {
  return format(addDays(new Date(todayStr() + 'T00:00:00'), 1), 'yyyy-MM-dd')
}

function nowDateTimeStr(): string {
  return format(new Date(), 'yyyy-MM-dd HH:mm:ss')
}

function formatMessage(row: typeof bildirim.$inferSelect): string {
  const tipLabel = row.tip === 'durusma' ? 'Duruşma' : 'Süre'
  const dosyaInfo = row.dosya_no ? ` — Dosya: ${row.dosya_no}` : ''
  return `<b>${tipLabel} Hatırlatması</b>${dosyaInfo}\n${row.baslik}\n${row.mesaj}\n<i>Tarih: ${row.tarih}</i>`
}

export async function sendPendingTelegramNotifications(): Promise<void> {
  const today = todayStr()
  const tomorrow = tomorrowStr()

  let pending: (typeof bildirim.$inferSelect)[]

  try {
    pending = await db
      .select()
      .from(bildirim)
      .where(
        and(
          isNull(bildirim.telegram_sent_at),          // D-13: only unsent rows
          inArray(bildirim.tarih, [today, tomorrow])  // D-06: today + tomorrow window only
        )
      )
  } catch (err) {
    console.error('[telegram] DB query failed:', String(err))
    return
  }

  for (const row of pending) {
    try {
      await sendTelegramMessage(formatMessage(row))
      // D-14: mark as sent immediately after successful send
      await db
        .update(bildirim)
        .set({ telegram_sent_at: nowDateTimeStr() })
        .where(eq(bildirim.id, row.id))
    } catch (err) {
      // D-16, D-17: per-row failure does not abort the loop
      console.error('[telegram] failed to send/update bildirim id:', row.id, String(err))
    }
  }
}
