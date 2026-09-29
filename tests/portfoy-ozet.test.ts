import { describe, it, expect, beforeAll } from 'vitest'
import { muvekkil, dosya } from '@/lib/schema'
import { getPortfoyOzet } from '@/lib/portfoy-ozet'

beforeAll(async () => {
  const db = globalThis.__testDb!
  const [m] = await db.insert(muvekkil).values({ ad: 'Portfoy', soyad: 'Ozet' }).returning()
  await db.insert(dosya).values([
    { muvekkil_id: m.id, dosya_no: 'P-1', tur: 'STK', durum: 'aktif' },
    { muvekkil_id: m.id, dosya_no: 'P-2', tur: 'STK', durum: 'arsiv' },
    { muvekkil_id: m.id, dosya_no: 'P-3', tur: 'AT', durum: 'aktif' },
    { muvekkil_id: m.id, dosya_no: 'P-4', tur: 'AT', durum: 'aktif' },
  ])
})

describe('getPortfoyOzet', () => {
  it('counts cases by the durum values the app stores', async () => {
    const ozet = await getPortfoyOzet()
    expect(ozet).toMatchObject({ toplam: 4, aktif: 3, arsiv: 1 })
  })

  it('lists every case type with its label, including empty ones', async () => {
    const { turler } = await getPortfoyOzet()
    expect(turler).toEqual([
      { label: 'STK', adet: 2 },
      { label: 'Asliye Ticaret', adet: 2 },
      { label: 'Asliye Hukuk', adet: 0 },
    ])
  })
})
