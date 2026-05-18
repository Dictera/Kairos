/**
 * tRPC Telegram Router
 *
 * Procedures:
 * - getSchedule: read current cron times from settings.json
 * - updateSchedule: validate times, write to settings.json, hot-reload cron tasks (D-04)
 * - testConnection: send a test message to verify BOT_TOKEN + CHAT_ID work
 *
 * Security:
 * - All procedures: protectedProcedure (session required)
 * - updateSchedule input: Zod regex /^\d{2}:\d{2}$/ — prevents cron expression injection
 * - testConnection: returns structured result, never throws to client
 */
import { createTRPCRouter, protectedProcedure } from '@/lib/trpc/init'
import { z } from 'zod'
import fs from 'fs'
import path from 'path'
import { sendTelegramMessage } from '@/lib/telegram/send'

// ── Settings helpers — copied from ayarlar.ts (not exported there, project pattern) ──
const SETTINGS_PATH = path.join(process.cwd(), 'data', 'settings.json')

function readSettings(): Record<string, unknown> {
  try {
    const raw = fs.readFileSync(SETTINGS_PATH, 'utf-8')
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    return {}
  }
}

function writeSettings(data: Record<string, unknown>): void {
  const dir = path.dirname(SETTINGS_PATH)
  fs.mkdirSync(dir, { recursive: true })
  const tmp = SETTINGS_PATH + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8')
  fs.renameSync(tmp, SETTINGS_PATH)
}

// ── Zod schema for HH:MM time validation (D-03, security: cron injection prevention) ──
const timeSchema = z
  .string()
  .regex(/^\d{2}:\d{2}$/, 'HH:MM formatı gerekli (örn. 09:00)')
  .refine((t) => {
    const [h, m] = t.split(':').map(Number)
    return h >= 0 && h <= 23 && m >= 0 && m <= 59
  }, 'Geçersiz saat (saat 00-23, dakika 00-59 arasında olmalı)')

export const telegramRouter = createTRPCRouter({
  /**
   * getSchedule — read configured cron times from settings.json
   * Returns default ["09:00", "15:00"] if not yet configured (D-03)
   */
  getSchedule: protectedProcedure.query(() => {
    const settings = readSettings()
    const times =
      (settings.telegram_bildirim_saatleri as string[] | undefined) ?? ['09:00', '15:00']
    return { times }
  }),

  /**
   * updateSchedule — validate times, persist to settings.json, hot-reload cron tasks
   * D-04: existing tasks are destroyed, new tasks are scheduled immediately
   */
  updateSchedule: protectedProcedure
    .input(
      z.object({
        times: z
          .array(timeSchema)
          .min(0)
          .max(24, 'En fazla 24 bildirim saati eklenebilir'),
      })
    )
    .mutation(async ({ input }) => {
      const settings = readSettings()
      settings.telegram_bildirim_saatleri = input.times
      writeSettings(settings)

      // Hot-reload: destroy current cron tasks, schedule new ones (D-04)
      // Dynamic import to avoid loading node-cron in edge runtime
      const { hotReloadCronJobs } = await import('@/lib/telegram/cron')
      hotReloadCronJobs(input.times)

      return { ok: true }
    }),

  /**
   * testConnection — send a test Telegram message
   * Returns structured result — never throws to client
   */
  testConnection: protectedProcedure.mutation(async () => {
    const token = process.env.TELEGRAM_BOT_TOKEN
    const chatId = process.env.TELEGRAM_CHAT_ID

    if (!token || !chatId) {
      return {
        ok: false as const,
        error: 'BOT_TOKEN veya CHAT_ID yapılandırılmamış. .env.local dosyasını kontrol edin.',
      }
    }

    try {
      await sendTelegramMessage(
        '<b>Sigorta Takip</b>\nTelegram bağlantısı başarıyla test edildi.'
      )
      return { ok: true as const }
    } catch (err) {
      return {
        ok: false as const,
        error: `Telegram API hatası: ${String(err)}`,
      }
    }
  }),
})
