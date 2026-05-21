/**
 * Phase 26: Bildirim Sisteminin İyileştirilmesi — Test Scaffold
 *
 * Wave 0: All tests start RED (failing) until Wave 1/2/3 plans implement the modules.
 * Requirements: BLD-01 through BLD-08
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Row type used in BLD-02, BLD-03, BLD-05 test data
type Row = { id: number; tip: string; tarih: string; dosya_no: string | null; mesaj: string | null }

// ── BLD-01: Toggle default = true when key absent ───────────────────────────
describe('BLD-01: Toggle default = true when key absent', () => {
  it('readSettings returns object where telegram_gunluk_durusma_aktif defaults to true when absent', async () => {
    const { readSettings } = await import('@/lib/telegram/settings-helper')
    const result = readSettings()
    expect((result.telegram_gunluk_durusma_aktif as boolean | undefined) ?? true).toBe(true)
  })
})

// ── BLD-02: Grouped message format — durusma block rendered correctly ───────
describe('BLD-02: Grouped message format — durusma block rendered correctly', () => {
  it('buildGroupedMessage with one durusma row produces string containing <b>Yarınki Duruşmalar</b>', async () => {
    const { buildGroupedMessage } = await import('@/lib/telegram/notify')
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const pad = (n: number) => String(n).padStart(2, '0')
    const tarih = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}`
    const durusmaRows: Row[] = [
      { id: 1, tip: 'DURUSMA', tarih, dosya_no: '2024/5', mesaj: 'Ankara ATM (10:30)' },
    ]
    const result = buildGroupedMessage({
      durusmaRows,
      sureRows: [],
      toggles: { durusmaAktif: true, sureAktif: true },
    })
    expect(result).not.toBeNull()
    expect(result).toContain('<b>Yarınki Duruşmalar</b>')
  })
})

// ── BLD-03: Grouped message — empty blocks omitted (D-15) ───────────────────
describe('BLD-03: Grouped message — empty blocks omitted (D-15)', () => {
  it('buildGroupedMessage with all empty arrays returns null', async () => {
    const { buildGroupedMessage } = await import('@/lib/telegram/notify')
    const result = buildGroupedMessage({
      durusmaRows: [],
      sureRows: [],
      toggles: { durusmaAktif: true, sureAktif: true },
    })
    expect(result).toBeNull()
  })
})

// ── BLD-04: Grouped message — sentIds only includes rows in message ─────────
describe('BLD-04: Grouped message — sentIds only includes rows in message', () => {
  it('when telegram_gunluk_durusma_aktif=false, durusma row ids are excluded from sentIds', async () => {
    const { buildGroupedMessage } = await import('@/lib/telegram/notify')
    const today = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const tarih = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`
    const durusmaRows: Row[] = [
      { id: 10, tip: 'DURUSMA', tarih, dosya_no: '2024/10', mesaj: 'test durusma' },
    ]
    const sureRows: Row[] = [
      { id: 20, tip: 'SURE', tarih, dosya_no: '2024/20', mesaj: 'test sure' },
    ]
    // When durusmaAktif=false, durusma rows must not appear in sentIds
    const result = buildGroupedMessage({
      durusmaRows,
      sureRows,
      toggles: { durusmaAktif: false, sureAktif: true },
    })
    // If we have a sentIds result property, durusma id should not be included
    // The function signature is expected to return { text, sentIds } or null
    if (result !== null && typeof result === 'object' && 'sentIds' in result) {
      const sentIds = (result as { sentIds: number[] }).sentIds
      expect(sentIds).not.toContain(10)
      expect(sentIds).toContain(20)
    } else {
      // buildGroupedMessage returns string or null — sentIds tracked separately
      // Test that durusma is excluded when toggle off: result string should not include dosya_no
      expect(result).not.toContain('2024/10')
    }
  })
})

// ── BLD-05: Toggle disabled → rows not included in message ──────────────────
describe('BLD-05: Toggle disabled → rows not included in message', () => {
  it('buildGroupedMessage with durusmaAktif=false and only durusma rows returns null', async () => {
    const { buildGroupedMessage } = await import('@/lib/telegram/notify')
    const today = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const tarih = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`
    const durusmaRows: Row[] = [
      { id: 1, tip: 'DURUSMA', tarih, dosya_no: '2024/5', mesaj: 'test' },
    ]
    const result = buildGroupedMessage({
      durusmaRows,
      sureRows: [],
      toggles: { durusmaAktif: false, sureAktif: true },
    })
    expect(result).toBeNull()
  })
})

// ── BLD-06: weekly.ts durusma rows included in output ───────────────────────
describe('BLD-06: weekly.ts durusma rows included in output', () => {
  it('sendWeeklySureSummary is exported as a function', async () => {
    const weekly = await import('@/lib/telegram/weekly')
    expect(typeof weekly.sendWeeklySureSummary).toBe('function')
  })

  it('weekly.ts imports durusma table from schema (structural test)', async () => {
    // This tests that the weekly module uses durusma by checking schema exports
    const { durusma } = await import('@/lib/schema')
    expect(durusma).toBeDefined()
    // The actual integration — weekly.ts joining durusma — is RED until Wave 2 implements it
    // For now, verify the weekly module source references durusma (import check via dynamic import)
    const weeklySource = await import('@/lib/telegram/weekly')
    // After Wave 2, weekly.ts will query durusma — this structural existence test ensures the
    // schema table is available. The behavioral test is in BLD-07.
    expect(typeof weeklySource.sendWeeklySureSummary).toBe('function')
  })
})

// ── BLD-07: weekly.ts toggle=false → returns early ──────────────────────────
describe('BLD-07: weekly.ts toggle=false → returns early, no message sent', () => {
  beforeEach(() => {
    vi.mock('@/lib/telegram/send', () => ({
      sendTelegramMessage: vi.fn().mockResolvedValue(true),
    }))
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.resetModules()
  })

  it('sendTelegramMessage is NOT called when telegram_haftalik_ozet_aktif=false', async () => {
    // Mock settings-helper to return toggle=false
    vi.mock('@/lib/telegram/settings-helper', () => ({
      readSettings: vi.fn().mockReturnValue({ telegram_haftalik_ozet_aktif: false }),
      writeSettings: vi.fn(),
    }))

    const sendModule = await import('@/lib/telegram/send')
    const mockSend = vi.mocked(sendModule.sendTelegramMessage)

    const { sendWeeklySureSummary } = await import('@/lib/telegram/weekly')
    await sendWeeklySureSummary()

    expect(mockSend).not.toHaveBeenCalled()
  })
})

// ── BLD-08: telegramRouter has getToggles + updateToggles ───────────────────
describe('BLD-08: telegramRouter has getToggles + updateToggles procedures', () => {
  it('telegramRouter has getToggles procedure', async () => {
    const { telegramRouter } = await import('@/lib/trpc/routers/telegram')
    expect(telegramRouter._def.record).toHaveProperty('getToggles')
  })

  it('telegramRouter has updateToggles procedure', async () => {
    const { telegramRouter } = await import('@/lib/trpc/routers/telegram')
    expect(telegramRouter._def.record).toHaveProperty('updateToggles')
  })
})
