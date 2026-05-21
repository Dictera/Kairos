/**
 * Telegram Notification Service — grouped daily bildirim sender (D-09 through D-15)
 *
 * Queries bildirim rows that:
 * - have telegram_sent_at IS NULL (not yet sent)
 * - have tarih in today or tomorrow
 *
 * Builds a single grouped HTML message per cron tick (D-09).
 * Category toggles: telegram_gunluk_durusma_aktif, telegram_gunluk_sure_aktif (D-07).
 * Rows excluded by toggle are NOT marked with telegram_sent_at (D-07, Pitfall 3).
 * Empty message guard: returns early when no blocks to send (D-15, Pitfall 2).
 */
import { db } from '@/lib/db'
import { bildirim } from '@/lib/schema'
import { and, isNull, inArray } from 'drizzle-orm'
import { format, addDays } from 'date-fns'
import { sendTelegramMessage } from './send'
import { readSettings } from './settings-helper'

// ── Date helpers ───────────────────────────────────────────────────────────────
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

// ── Row type for buildGroupedMessage ──────────────────────────────────────────
type BildirimRow = Pick<typeof bildirim.$inferSelect, 'id' | 'dosya_no' | 'mesaj' | 'tarih'>

// ── Row formatter (em dash —, not hyphen) ────────────────────────────────────
function formatDailyRow(row: Pick<typeof bildirim.$inferSelect, 'dosya_no' | 'mesaj'>): string {
  const parts: string[] = []
  if (row.dosya_no) parts.push(row.dosya_no)
  if (row.mesaj) parts.push(row.mesaj)
  return `- ${parts.join(' — ')}`
}

// ── Grouped message builder — exported for unit tests (BLD-02..BLD-05) ───────
/**
 * Builds a single grouped HTML Telegram message from durusma and sure rows.
 *
 * @param durusmaRows - All unsent durusma bildirim rows (today + tomorrow)
 * @param sureRows    - All unsent sure bildirim rows (today + tomorrow)
 * @param toggles     - Category toggles: { durusmaAktif, sureAktif }
 * @returns Formatted HTML string, or null if no blocks to send (D-15)
 */
export function buildGroupedMessage({
  durusmaRows,
  sureRows,
  toggles,
}: {
  durusmaRows: BildirimRow[]
  sureRows: BildirimRow[]
  toggles: { durusmaAktif: boolean; sureAktif: boolean }
}): string | null {
  const today = todayStr()
  const tomorrow = tomorrowStr()

  const blocks: string[] = []

  if (toggles.durusmaAktif) {
    const yarinDurusmalar = durusmaRows.filter((r) => r.tarih === tomorrow)
    const bugunDurusmalar = durusmaRows.filter((r) => r.tarih === today)
    if (yarinDurusmalar.length)
      blocks.push(`<b>Yarınki Duruşmalar</b>\n` + yarinDurusmalar.map(formatDailyRow).join('\n'))
    if (bugunDurusmalar.length)
      blocks.push(`<b>Bugünkü Duruşmalar</b>\n` + bugunDurusmalar.map(formatDailyRow).join('\n'))
  }

  if (toggles.sureAktif) {
    const yarinSureler = sureRows.filter((r) => r.tarih === tomorrow)
    const bugunSureler = sureRows.filter((r) => r.tarih === today)
    if (yarinSureler.length)
      blocks.push(`<b>Yarınki Süreler</b>\n` + yarinSureler.map(formatDailyRow).join('\n'))
    if (bugunSureler.length)
      blocks.push(`<b>Bugünkü Süreler</b>\n` + bugunSureler.map(formatDailyRow).join('\n'))
  }

  if (blocks.length === 0) return null  // D-15 + Pitfall 2: no empty message to Telegram

  return blocks.join('\n\n')
}

// ── Main exported function ────────────────────────────────────────────────────
export async function sendPendingTelegramNotifications(): Promise<void> {
  const settings = readSettings()

  // Read category toggles — use ?? true (NOT || true) to respect explicit false values (Pitfall 1)
  const durusmaAktif = (settings.telegram_gunluk_durusma_aktif as boolean | undefined) ?? true
  const sureAktif    = (settings.telegram_gunluk_sure_aktif    as boolean | undefined) ?? true

  // Early return if both categories disabled — no DB query needed
  if (!durusmaAktif && !sureAktif) return

  const today    = todayStr()
  const tomorrow = tomorrowStr()

  let pending: (typeof bildirim.$inferSelect)[]

  try {
    pending = await db
      .select()
      .from(bildirim)
      .where(
        and(
          isNull(bildirim.telegram_sent_at),          // only unsent rows
          inArray(bildirim.tarih, [today, tomorrow])  // today + tomorrow window only
        )
      )
  } catch (err) {
    console.error('[telegram] DB query failed:', String(err))
    return
  }

  // Split pending into durusma/sure arrays (toggle gates applied)
  const durusmaRows = durusmaAktif ? pending.filter((r) => r.tip === 'durusma') : []
  const sureRows    = sureAktif    ? pending.filter((r) => r.tip === 'sure')    : []

  // Build single grouped message — returns null if all blocks empty (D-15, Pitfall 2)
  const message = buildGroupedMessage({ durusmaRows, sureRows, toggles: { durusmaAktif, sureAktif } })
  if (message === null) return

  const sent = await sendTelegramMessage(message)

  // Mark ONLY the rows included in the sent message (Pitfall 3 — toggle-excluded rows stay NULL)
  if (sent) {
    const sentIds = [...durusmaRows, ...sureRows].map((r) => r.id)
    if (sentIds.length > 0) {
      await db
        .update(bildirim)
        .set({ telegram_sent_at: nowDateTimeStr() })
        .where(inArray(bildirim.id, sentIds))
    }
  }
}
