/**
 * tRPC Telegram Router
 *
 * Procedures:
 * - getSchedule: read current cron times from settings.json
 * - updateSchedule: validate times, write to settings.json, hot-reload cron tasks (D-04)
 * - testConnection: send a test message to verify BOT_TOKEN + CHAT_ID work
 * - getToggles: read notification category toggle states from settings.json
 * - updateToggles: validate 3 boolean toggles via Zod and persist to settings.json
 *
 * Security:
 * - All procedures: protectedProcedure (session required)
 * - updateSchedule input: Zod regex /^\d{2}:\d{2}$/ — prevents cron expression injection
 * - updateToggles input: Zod z.boolean() on all 3 fields — rejects non-boolean values
 * - testConnection: returns structured result, never throws to client
 */
import { createTRPCRouter, protectedProcedure } from '@/lib/trpc/init'
import { z } from 'zod'
import { sendTelegramMessage } from '@/lib/telegram/send'
import { readSettings, writeSettings } from '@/lib/telegram/settings-helper'

// ── Zod schema for HH:MM time validation (D-03, security: cron injection prevention) ──
const timeSchema = z
  .string()
  .regex(/^\d{2}:\d{2}$/, 'HH:MM formatı gerekli (örn. 09:00)')
  .refine((t) => {
    const [h, m] = t.split(':').map(Number)
    return h >= 0 && h <= 23 && m >= 0 && m <= 59
  }, 'Geçersiz saat (saat 00-23, dakika 00-59 arasında olmalı)')

// ── Zod schema for notification category toggles (T-26-02-01: boolean validation) ──
const togglesSchema = z.object({
  telegram_gunluk_durusma_aktif: z.boolean(),
  telegram_gunluk_sure_aktif: z.boolean(),
  telegram_haftalik_ozet_aktif: z.boolean(),
})

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
        '<b>Kairos</b>\nTelegram bağlantısı başarıyla test edildi.'
      )
      return { ok: true as const }
    } catch (err) {
      return {
        ok: false as const,
        error: `Telegram API hatası: ${String(err)}`,
      }
    }
  }),

  /**
   * getToggles — read notification category toggle states from settings.json
   * Returns true defaults for all 3 keys when not yet configured (T-26-02-02: protectedProcedure)
   */
  getToggles: protectedProcedure.query(() => {
    const settings = readSettings()
    return {
      telegram_gunluk_durusma_aktif:
        (settings.telegram_gunluk_durusma_aktif as boolean | undefined) ?? true,
      telegram_gunluk_sure_aktif:
        (settings.telegram_gunluk_sure_aktif as boolean | undefined) ?? true,
      telegram_haftalik_ozet_aktif:
        (settings.telegram_haftalik_ozet_aktif as boolean | undefined) ?? true,
    }
  }),

  /**
   * updateToggles — validate 3 boolean toggles via Zod, merge into settings.json
   * T-26-02-01: Zod z.boolean() rejects non-boolean values before writeSettings
   * T-26-02-03: Object.assign preserves unrelated settings.json keys (belgelerPath, saatler, etc.)
   */
  updateToggles: protectedProcedure.input(togglesSchema).mutation(({ input }) => {
    const settings = readSettings()
    Object.assign(settings, input)
    writeSettings(settings)
    return { ok: true }
  }),
})
