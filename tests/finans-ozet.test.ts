import { describe, it, expect, beforeAll } from 'vitest'
import { muvekkil, dosya, finans_kalemi } from '@/lib/schema'
import { getFinansOzet } from '@/lib/finans-ozet'

// Fixed "today" so the 30-day window is deterministic.
const NOW = new Date(2026, 8, 29, 15, 0) // 29 Sep 2026, local time

beforeAll(async () => {
  const db = globalThis.__testDb!
  const [m] = await db.insert(muvekkil).values({ ad: 'Finans', soyad: 'Ozet' }).returning()
  const [d] = await db
    .insert(dosya)
    .values({ muvekkil_id: m.id, dosya_no: 'FIN-1', tur: 'STK' })
    .returning()
  await db.insert(finans_kalemi).values([
    { dosya_id: d.id, tur: 'Gelen', tutar: 1000, tarih: '2026-09-29' }, // today
    { dosya_id: d.id, tur: 'Giden', tutar: 200, tarih: '2026-08-30' }, // 30 days ago
    { dosya_id: d.id, tur: 'Masraf', tutar: 50, tarih: '2026-08-29' }, // 31 days ago
    { dosya_id: d.id, tur: 'Gelen', tutar: 500, tarih: '2025-01-15' }, // long ago
    { dosya_id: d.id, tur: 'Masraf', tutar: 25, tarih: '2026-10-05' }, // future-dated
  ])
})

describe('getFinansOzet', () => {
  it('totals every entry by type', async () => {
    const ozet = await getFinansOzet(NOW)
    expect(ozet.gelen).toBe(1500)
    expect(ozet.giden).toBe(200)
    expect(ozet.masraf).toBe(75)
  })

  it('counts only entries dated within the last 30 days', async () => {
    const ozet = await getFinansOzet(NOW)
    expect(ozet.son30Gun).toBe(2)
  })
})
