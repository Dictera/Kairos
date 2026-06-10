/**
 * Telegram Cron Service
 *
 * Manages node-cron scheduling for daily Telegram notifications.
 * Entry point: loaded by instrumentation.ts on Next.js server start.
 *
 * Singleton pattern: globalThis guard prevents duplicate tasks on dev HMR (Pitfall 2).
 * Hot-reload: hotReloadCronJobs() exported for use by tRPC telegram.updateSchedule.
 */
import cron, { type ScheduledTask } from 'node-cron'
import { sendPendingTelegramNotifications } from './notify'
import { sendWeeklySureSummary } from './weekly'
import { readSettings } from './settings-helper'

// ── globalThis type declarations for singleton guard ──────────────────────────
declare global {
  // eslint-disable-next-line no-var
  var __telegramCronInitialized: boolean | undefined
  // eslint-disable-next-line no-var
  var __telegramCronTasks: ScheduledTask[] | undefined
}

// ── HH:MM → cron expression ────────────────────────────────────────────────
export function timeToCron(time: string): string {
  const [h, m] = time.split(':')
  // Cron format: "minute hour * * *" — e.g. "09:00" → "0 9 * * *"
  return `${Number(m)} ${Number(h)} * * *`
}

// ── Schedule cron tasks from settings ─────────────────────────────────────
export function scheduleFromSettings(times?: string[]): void {
  const settings = readSettings()
  const configuredTimes =
    times ??
    ((settings.telegram_bildirim_saatleri as string[] | undefined) ?? ['09:00', '15:00'])

  const tasks = configuredTimes.flatMap((t) =>
    // TEL-07: reject invalid HH:MM
    cron.validate(timeToCron(t))
      ? [cron.schedule(
          timeToCron(t),
          async () => {
            await sendPendingTelegramNotifications()
            await sendWeeklySureSummary()
          },
          {
            timezone: 'Europe/Istanbul',  // A1: Turkey timezone (see RESEARCH.md Assumptions)
            noOverlap: true,              // Skip run if previous is still in progress
          }
        )]
      : []
  )

  globalThis.__telegramCronTasks = tasks
}

// ── Startup one-shot ────────────────────────────────────────────────────────
export async function runStartupSync(): Promise<void> {
  try {
    await sendPendingTelegramNotifications()
    await sendWeeklySureSummary()
  } catch (err) {
    // D-16: startup sync failure must not crash the server
    console.error('[telegram] startup sync failed:', String(err))
  }
}

// ── Hot-reload (called by tRPC telegram.updateSchedule) ────────────────────
export function hotReloadCronJobs(newTimes: string[]): void {
  // Destroy all existing tasks
  globalThis.__telegramCronTasks?.forEach((t) => t.destroy())
  // Schedule fresh tasks
  scheduleFromSettings(newTimes)
}

// ── Singleton initialization (runs on module load — guarded by globalThis) ─
if (!globalThis.__telegramCronInitialized) {
  globalThis.__telegramCronInitialized = true
  globalThis.__telegramCronTasks = []
  void runStartupSync()
  scheduleFromSettings()
}
