import { db } from '@/lib/db'
import { dosya } from '@/lib/schema'
import { count, sql } from 'drizzle-orm'

// Display order and labels for dosya.tur ('STK' | 'AT' | 'AH').
const TUR_SIRASI = [
  { tur: 'STK', label: 'STK' },
  { tur: 'AT', label: 'Asliye Ticaret' },
  { tur: 'AH', label: 'Asliye Hukuk' },
]

/** Case counts by durum ('aktif' | 'arsiv') and by tur, aggregated in SQLite. */
export async function getPortfoyOzet() {
  const [durum] = await db
    .select({
      toplam: count(),
      aktif: sql<number>`count(case when ${dosya.durum} = 'aktif' then 1 end)`,
      arsiv: sql<number>`count(case when ${dosya.durum} = 'arsiv' then 1 end)`,
    })
    .from(dosya)

  const turRows = await db.select({ tur: dosya.tur, adet: count() }).from(dosya).groupBy(dosya.tur)
  const adetByTur = new Map(turRows.map((r) => [r.tur, r.adet]))

  // Every known type is listed (0 when empty); unexpected values are kept too.
  const turler = [
    ...TUR_SIRASI.map(({ tur, label }) => ({ label, adet: adetByTur.get(tur) ?? 0 })),
    ...turRows
      .filter((r) => !TUR_SIRASI.some((t) => t.tur === r.tur))
      .map((r) => ({ label: r.tur, adet: r.adet })),
  ]

  return { ...durum, turler }
}
