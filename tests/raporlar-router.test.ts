import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { dosya, finans_kalemi, muvekkil, olayGunlugu, sigortaSirketi } from '@/lib/schema'
import { raporlarRouter } from '@/lib/trpc/routers/raporlar'
import { passwordVersion } from '@/lib/session'

const caller = raporlarRouter.createCaller({
  session: { isLoggedIn: true, pwv: passwordVersion() },
} as Parameters<typeof raporlarRouter.createCaller>[0])

// "Today" for every date-dependent calculation below.
const NOW = new Date('2026-09-29T12:00:00')

const surec = (s: object) => JSON.stringify(s)

let ids: Record<string, number> = {}

beforeAll(async () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)

  const db = globalThis.__testDb!
  const [m] = await db.insert(muvekkil).values({ ad: 'Rapor', soyad: 'Test' }).returning()
  // Ten companies: more than the eight yonetimOzeti lists.
  const sirketler = await db
    .insert(sigortaSirketi)
    .values(Array.from({ length: 10 }, (_, i) => ({ ad: `Şirket ${i + 1}` })))
    .returning()

  const rows = await db
    .insert(dosya)
    .values([
      // One file per company, 1 000 claimed each.
      ...sirketler.map((s, i) => ({
        muvekkil_id: m.id,
        dosya_no: `S-${i + 1}`,
        tur: 'STK',
        karsitaraf_sigorta_id: s.id,
        talep_tutari: 1000,
        // Recent, so they do not crowd the other files out of the top-10 list.
        created_at: '2026-08-01 09:00:00',
        updated_at: '2026-08-01 09:00:00',
      })),
      // No company at all.
      {
        muvekkil_id: m.id,
        dosya_no: 'NOCO',
        tur: 'AT',
        talep_tutari: 500,
        karar_tutari: 400,
        created_at: '2026-02-01 09:00:00',
        updated_at: '2026-02-01 09:00:00',
      },
      // Court case in a stage the old mapping did not know.
      {
        muvekkil_id: m.id,
        dosya_no: 'ISTINAF',
        tur: 'AT',
        surec_detay: surec({ mahkeme: { asama: 'İSTİNAF' } }),
        created_at: '2026-03-01 09:00:00',
        updated_at: '2026-03-01 09:00:00',
      },
      {
        muvekkil_id: m.id,
        dosya_no: 'REPLIK',
        tur: 'AH',
        surec_detay: surec({ mahkeme: { asama: 'REPLİK_DİLEKÇESİ_TEBLİĞ' } }),
        created_at: '2026-03-01 09:00:00',
        updated_at: '2026-03-01 09:00:00',
      },
      // Archived on 2026-06-30 (activity log) but edited later — updated_at must not count.
      {
        muvekkil_id: m.id,
        dosya_no: 'KAPALI',
        tur: 'STK',
        durum: 'arsiv',
        sonuc: 'kazanıldı',
        surec_detay: surec({ stk: { asama: 'KESİNLEŞME', karar_tarihi: '2026-05-15' } }),
        created_at: '2026-05-01 09:00:00',
        updated_at: '2026-09-20 09:00:00',
      },
      // Archived last year according to the log, edited this year.
      {
        muvekkil_id: m.id,
        dosya_no: 'ESKI',
        tur: 'STK',
        durum: 'arsiv',
        created_at: '2025-01-01 09:00:00',
        updated_at: '2026-04-01 09:00:00',
      },
      // Mediation: 10 days, closed by the final minutes.
      {
        muvekkil_id: m.id,
        dosya_no: 'ARA',
        tur: 'STK',
        surec_detay: surec({
          stk: {
            asama: 'ARABULUCULUK',
            ihtar_tarihi: '2026-04-01',
            arabuluculuk_son_tutanak_tarihi: '2026-04-11',
          },
        }),
        created_at: '2026-04-01 09:00:00',
        updated_at: '2026-04-01 09:00:00',
      },
    ])
    .returning()
  ids = Object.fromEntries(rows.map((r) => [r.dosya_no, r.id]))

  await db.insert(olayGunlugu).values([
    {
      dosya_id: ids.KAPALI,
      olay_turu: 'durum_degisikligi',
      aciklama: 'Dosya arşivlendi',
      created_at: '2026-06-30 10:00:00',
    },
    {
      dosya_id: ids.ESKI,
      olay_turu: 'durum_degisikligi',
      aciklama: 'Dosya arşivlendi',
      created_at: '2025-12-31 10:00:00',
    },
  ])

  await db.insert(finans_kalemi).values([
    { dosya_id: ids.NOCO, tur: 'Gelen', tutar: 300, tarih: '2026-02-10' },
    { dosya_id: ids['S-10'], tur: 'Gelen', tutar: 200, tarih: '2026-03-10' },
    { dosya_id: ids['S-1'], tur: 'Gelen', tutar: 999, tarih: '2025-12-10' },
  ])
})

afterAll(() => {
  vi.useRealTimers()
})

describe('raporlar.yonetimOzeti', () => {
  it('totals every file and every collection, not just the top 8 companies', async () => {
    const r = await caller.yonetimOzeti()
    expect(r.sirketler).toHaveLength(8)
    expect(r.toplam).toEqual({ talep: 10 * 1000 + 500, karar: 400, tahsilat: 300 + 200 + 999 })
  })

  it('trends the current year', async () => {
    const r = await caller.yonetimOzeti()
    expect(r.yil).toBe('2026')
    expect(r.ayBuYil.every((a) => a.ay.startsWith('2026-'))).toBe(true)
  })
})

describe('raporlar.genelBakis', () => {
  it('accepts any four-digit year and rejects anything else', async () => {
    const r = await caller.genelBakis({ yil: '2025' })
    expect(r.rows.map((x) => x.ay)).toEqual(['2025-01', '2025-12'])
    await expect(caller.genelBakis({ yil: 'x' as '2025' })).rejects.toThrow()
  })
})

describe('raporlar.davaSureci', () => {
  it('groups every court stage, including appeals', async () => {
    const r = await caller.davaSureci()
    const byNo = Object.fromEntries(r.uzunDosyalar.map((d) => [d.no, d.asama]))
    expect(byNo.ISTINAF).toBe('Kanun Yolu')
    expect(byNo.REPLIK).toBe('Dava')
  })

  it('counts active files and closures by the archive date in the activity log', async () => {
    const r = await caller.davaSureci()
    expect(r.aktifDosya).toBe(10 + 1 + 2 + 1)
    expect(r.yil).toBe('2026')
    // KAPALI was archived in 2026, ESKI in 2025 — both were edited in 2026.
    expect(r.kapananYil).toBe(1)
  })

  it('measures closed files from opening to closing, not to today', async () => {
    const r = await caller.davaSureci()
    // KAPALI: 2026-05-01 → 2026-06-30 = 61 days; ESKI: 2025-01-01 → 2025-12-31 = 365 days.
    expect(r.ortKapanisGun).toBe(Math.round((61 + 365) / 2))
    expect(r.uzunDosyalar.map((d) => d.no)).not.toContain('KAPALI')
  })

  it('shows the decided amount (else the claim), not their sum', async () => {
    const r = await caller.davaSureci()
    const noco = r.uzunDosyalar.find((d) => d.no === 'NOCO')
    expect(noco?.tutar).toBe(400)
  })
})

describe('raporlar.arabuluculuk', () => {
  it('weights the averages by case and stops at the final minutes', async () => {
    const r = await caller.arabuluculuk()
    // Only ARA is in mediation: 2026-04-01 → 2026-04-11. Months without a
    // mediation case (Jan 2025, May and Aug 2026) must not pull it towards 0.
    expect(r.ozet.araSure).toBe(10)
    expect(r.aylik.find((a) => a.ay === "Oca'25")?.araSure).toBeNull()
    expect(r.aylik.map((a) => a.ay)).toEqual(["Oca'25", "Nis'26", "May'26", "Ağu'26"])
  })
})

describe('raporlar.sonucBasari', () => {
  it('places an outcome in the month of its decision, labelled with the year', async () => {
    const r = await caller.sonucBasari()
    // KAPALI: decided 2026-05-15, last edited 2026-09-20.
    expect(r.aylik).toEqual([{ ay: "May'26", kazan: 1, uzlasma: 0, kaybet: 0 }])
  })
})
