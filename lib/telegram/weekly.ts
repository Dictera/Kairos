/**
 * Telegram Weekly Summary Service — süreler + duruşmalar (D-01 through D-03, D-16 through D-18)
 *
 * Sends a single grouped HTML message every Monday summarizing the week's
 * upcoming süreler and duruşmalar merged and sorted by date.
 *
 * Toggle: telegram_haftalik_ozet_aktif (default: true) — D-03
 * No emoji in message — D-18
 * No duruşma saati in weekly format — D-16
 * Dedup key: weekly_sure_summary_last_sent — covers both sure and durusma since Phase 26
 */
import { db } from '@/lib/db'
import { sure, dosya, durusma } from '@/lib/schema'
import { eq, gte, lte, and, sql } from 'drizzle-orm'
import { format, startOfWeek, endOfWeek } from 'date-fns'
import { sendTelegramMessage } from './send'
import { readSettings, writeSettings } from './settings-helper'

const TR_MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getDate()} ${TR_MONTHS[d.getMonth()]}`
}

export async function sendWeeklySureSummary(): Promise<void> {
  const today = new Date()
  if (today.getDay() !== 1) return  // only Mondays (1 = Monday)

  const todayStr = format(today, 'yyyy-MM-dd')
  const settings = readSettings()
  if (settings.weekly_sure_summary_last_sent === todayStr) return  // already sent this Monday

  // Toggle check — use ?? true (NOT || true) to respect explicit false values
  const haftalikAktif = (settings.telegram_haftalik_ozet_aktif as boolean | undefined) ?? true
  if (!haftalikAktif) return  // user disabled weekly summary

  const monday = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const sunday = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd')

  let sureQueryRows: Array<{ ad: string; son_tarih: string; dosya_no: string | null }>
  let durusmaQueryRows: Array<{ tarih: string; label: string | null; dosya_no: string | null }>

  try {
    sureQueryRows = await db
      .select({
        ad: sure.ad,
        son_tarih: sure.son_tarih,
        dosya_no: dosya.dosya_no,
      })
      .from(sure)
      .leftJoin(dosya, eq(sure.dosya_id, dosya.id))
      .where(and(gte(sure.son_tarih, monday), lte(sure.son_tarih, sunday)))
      .orderBy(sure.son_tarih)

    durusmaQueryRows = await db
      .select({
        tarih: durusma.tarih,
        label: durusma.mahkeme_kurum,   // D-16: no saat in weekly format
        dosya_no: dosya.dosya_no,
      })
      .from(durusma)
      .leftJoin(dosya, eq(durusma.dosya_id, dosya.id))
      .where(and(gte(durusma.tarih, monday), lte(durusma.tarih, sunday)))
  } catch (err) {
    console.error('[telegram] weekly summary DB query failed:', String(err))
    return
  }

  // Normalize both result sets to a common shape
  const sureNormalized = sureQueryRows.map((r) => ({
    tarih: r.son_tarih,
    label: r.ad,
    dosya_no: r.dosya_no,
    type: 'sure' as const,
  }))
  const durusmaNormalized = durusmaQueryRows.map((r) => ({
    tarih: r.tarih,
    label: r.label ?? 'Mahkeme',
    dosya_no: r.dosya_no,
    type: 'durusma' as const,
  }))

  // Merge and sort by tarih (D-17: süreler and duruşmalar in the same message, date order)
  const merged = [...sureNormalized, ...durusmaNormalized].sort((a, b) =>
    a.tarih.localeCompare(b.tarih)
  )

  // Mark as sent even when empty so we don't query again until next Monday
  if (merged.length === 0) {
    writeSettings({ ...settings, weekly_sure_summary_last_sent: todayStr })
    return
  }

  const message =
    `<b>Bu Hafta Yaklaşan Süreler ve Duruşmalar</b>\n` +
    `(${formatShortDate(monday)} – ${formatShortDate(sunday)})\n\n` +
    merged
      .map((r) => {
        const dosyaPart = r.dosya_no ? ` — Dosya: ${r.dosya_no}` : ''
        return `• <b>${formatShortDate(r.tarih)}</b>${dosyaPart}\n  ${r.label}`
      })
      .join('\n\n')

  const sent = await sendTelegramMessage(message)
  if (sent) {
    // dedup key covers both sure and durusma since Phase 26 (key name kept for backwards compat)
    writeSettings({ ...settings, weekly_sure_summary_last_sent: todayStr })
  }
}
