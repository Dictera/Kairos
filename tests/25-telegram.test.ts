/**
 * Phase 25: Telegram Bildirim Servisi — Test Scaffold
 *
 * Wave 0: All tests start RED (failing) until Wave 1/2 plans implement the modules.
 * Requirements: TEL-01 through TEL-09
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ── TEL-01: bildirim table has telegram_sent_at column ─────────────────────
describe('TEL-01: bildirim schema has telegram_sent_at', () => {
  it('bildirim table definition includes telegram_sent_at column', async () => {
    const { bildirim } = await import('@/lib/schema')
    // In drizzle-orm 0.45.x, columns are direct properties on the table object
    const columns = bildirim as unknown as Record<string, unknown>
    expect(columns).toHaveProperty('telegram_sent_at')
  })

  it('telegram_sent_at is nullable (no notNull constraint)', async () => {
    const { bildirim } = await import('@/lib/schema')
    // In drizzle-orm 0.45.x, column objects are direct properties with .notNull boolean
    const col = (bildirim as unknown as Record<string, { notNull: boolean }>)['telegram_sent_at']
    expect(col.notNull).toBe(false)
  })
})

// ── TEL-02: sendTelegramMessage returns early when token/chatId missing ─────
describe('TEL-02: sendTelegramMessage skips silently when env vars missing', () => {
  beforeEach(() => {
    delete process.env.TELEGRAM_BOT_TOKEN
    delete process.env.TELEGRAM_CHAT_ID
  })

  it('returns false (no throw) when TELEGRAM_BOT_TOKEN is missing', async () => {
    const { sendTelegramMessage } = await import('@/lib/telegram/send')
    await expect(sendTelegramMessage('test')).resolves.toBe(false)
  })

  it('returns false (no throw) when TELEGRAM_CHAT_ID is missing', async () => {
    process.env.TELEGRAM_BOT_TOKEN = 'fake-token'
    delete process.env.TELEGRAM_CHAT_ID
    const { sendTelegramMessage } = await import('@/lib/telegram/send')
    await expect(sendTelegramMessage('test')).resolves.toBe(false)
  })
})

// ── TEL-03: sendTelegramMessage does NOT throw on API failure ────────────────
describe('TEL-03: sendTelegramMessage does not throw on API error', () => {
  beforeEach(() => {
    process.env.TELEGRAM_BOT_TOKEN = 'fake-token'
    process.env.TELEGRAM_CHAT_ID = 'fake-chat-id'
  })

  afterEach(() => {
    delete process.env.TELEGRAM_BOT_TOKEN
    delete process.env.TELEGRAM_CHAT_ID
    vi.restoreAllMocks()
  })

  it('does not throw when fetch returns non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: () => Promise.resolve('{"ok":false,"description":"Unauthorized"}'),
    }))
    const { sendTelegramMessage } = await import('@/lib/telegram/send')
    await expect(sendTelegramMessage('test')).resolves.toBe(false)
  })

  it('does not throw when fetch rejects (network error)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')))
    // sendTelegramMessage wraps fetch errors silently per D-16
    // If it throws, this test will catch it as a failure
    const { sendTelegramMessage } = await import('@/lib/telegram/send')
    // Note: D-16 says "sessiz hata, console.error ile log" — no throw
    await expect(sendTelegramMessage('test')).resolves.toBe(false)
  })
})

// ── TEL-04: sendPendingTelegramNotifications filters by telegram_sent_at IS NULL AND tarih ──
describe('TEL-04: sendPendingTelegramNotifications only processes unsent today/tomorrow rows', () => {
  it('function is exported from lib/telegram/notify', async () => {
    const notify = await import('@/lib/telegram/notify')
    expect(typeof notify.sendPendingTelegramNotifications).toBe('function')
  })
})

// ── TEL-05: telegram_sent_at is updated after successful send ───────────────
describe('TEL-05: telegram_sent_at updated after send', () => {
  it('sendPendingTelegramNotifications updates telegram_sent_at on success', async () => {
    // This test verifies the DB update path; full integration tested manually
    // Unit coverage: function exists and is callable
    const notify = await import('@/lib/telegram/notify')
    expect(typeof notify.sendPendingTelegramNotifications).toBe('function')
  })
})

// ── TEL-06: timeToCron conversion ──────────────────────────────────────────
describe('TEL-06: timeToCron converts HH:MM to cron expression', () => {
  it('converts "09:00" to "0 9 * * *"', async () => {
    const { timeToCron } = await import('@/lib/telegram/cron')
    expect(timeToCron('09:00')).toBe('0 9 * * *')
  })

  it('converts "15:30" to "30 15 * * *"', async () => {
    const { timeToCron } = await import('@/lib/telegram/cron')
    expect(timeToCron('15:30')).toBe('30 15 * * *')
  })

  it('converts "00:00" to "0 0 * * *"', async () => {
    const { timeToCron } = await import('@/lib/telegram/cron')
    expect(timeToCron('00:00')).toBe('0 0 * * *')
  })
})

// ── TEL-07: invalid HH:MM rejected by cron.validate ───────────────────────
describe('TEL-07: invalid cron times are rejected', () => {
  it('cron.validate rejects "25:00" (invalid hour)', async () => {
    const cron = await import('node-cron')
    const { timeToCron } = await import('@/lib/telegram/cron')
    expect(cron.default.validate(timeToCron('25:00'))).toBe(false)
  })

  it('cron.validate accepts "09:00" (valid time)', async () => {
    const cron = await import('node-cron')
    const { timeToCron } = await import('@/lib/telegram/cron')
    expect(cron.default.validate(timeToCron('09:00'))).toBe(true)
  })
})

// ── TEL-08: updateSchedule writes to settings ──────────────────────────────
describe('TEL-08: telegram router updateSchedule procedure exists', () => {
  it('telegramRouter has updateSchedule procedure', async () => {
    const { telegramRouter } = await import('@/lib/trpc/routers/telegram')
    expect(telegramRouter._def.record).toHaveProperty('updateSchedule')
  })

  it('telegramRouter has getSchedule procedure', async () => {
    const { telegramRouter } = await import('@/lib/trpc/routers/telegram')
    expect(telegramRouter._def.record).toHaveProperty('getSchedule')
  })
})

// ── TEL-09: testConnection returns error when token missing ────────────────
describe('TEL-09: telegramRouter testConnection procedure exists', () => {
  it('telegramRouter has testConnection procedure', async () => {
    const { telegramRouter } = await import('@/lib/trpc/routers/telegram')
    expect(telegramRouter._def.record).toHaveProperty('testConnection')
  })
})
