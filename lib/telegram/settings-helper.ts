/**
 * Shared settings helper for Telegram notification services.
 *
 * Extracted from lib/telegram/cron.ts, lib/telegram/weekly.ts, and lib/trpc/routers/telegram.ts
 * to eliminate duplicate readSettings/writeSettings implementations.
 *
 * Uses atomic rename pattern (write to .tmp, then renameSync) to prevent partial-write corruption.
 */
import path from 'path'
import fs from 'fs'

const SETTINGS_PATH = path.join(process.cwd(), 'data', 'settings.json')

export function readSettings(): Record<string, unknown> {
  try {
    return JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf-8')) as Record<string, unknown>
  } catch {
    return {}
  }
}

export function writeSettings(data: Record<string, unknown>): void {
  fs.mkdirSync(path.dirname(SETTINGS_PATH), { recursive: true })
  const tmp = SETTINGS_PATH + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8')
  fs.renameSync(tmp, SETTINGS_PATH)
}
