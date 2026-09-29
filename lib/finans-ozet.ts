import { db } from '@/lib/db'
import { finans_kalemi } from '@/lib/schema'
import { sql } from 'drizzle-orm'
import { format, subDays } from 'date-fns'

/**
 * All-time Gelen/Giden/Masraf totals plus the number of entries dated within
 * the last 30 days (today and the 30 days before it; tarih is a local
 * YYYY-MM-DD string). Aggregated in SQLite instead of loading every row.
 */
export async function getFinansOzet(now = new Date()) {
  const bugun = format(now, 'yyyy-MM-dd')
  const otuzGunOnce = format(subDays(now, 30), 'yyyy-MM-dd')

  const [ozet] = await db
    .select({
      gelen: sql<number>`coalesce(sum(case when ${finans_kalemi.tur} = 'Gelen' then ${finans_kalemi.tutar} end), 0)`,
      giden: sql<number>`coalesce(sum(case when ${finans_kalemi.tur} = 'Giden' then ${finans_kalemi.tutar} end), 0)`,
      masraf: sql<number>`coalesce(sum(case when ${finans_kalemi.tur} = 'Masraf' then ${finans_kalemi.tutar} end), 0)`,
      son30Gun: sql<number>`count(case when ${finans_kalemi.tarih} between ${otuzGunOnce} and ${bugun} then 1 end)`,
    })
    .from(finans_kalemi)
  return ozet
}
