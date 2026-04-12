import { addDays, isWithinInterval, differenceInCalendarDays, format } from 'date-fns'

/**
 * Pure deadline calculation functions — NO database imports.
 * Importable from both server-side mutations and unit tests.
 */

/** D-08: STK karara itiraz süresi = tebligat tarihi + 10 takvim günü */
export function calcStkItirazSuresi(tebligatTarihi: string): string {
  const [y, m, d] = tebligatTarihi.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return format(addDays(date, 10), 'yyyy-MM-dd')
}

/** D-09: İstinaf başvurusu = mahkeme karar tebligatı + 14 takvim günü */
export function calcIstinafBasvurusu(kararTebligatTarihi: string): string {
  const [y, m, d] = kararTebligatTarihi.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return format(addDays(date, 14), 'yyyy-MM-dd')
}

/** D-10: Cevap dilekçesi = dava tebligatı + 14 takvim günü */
export function calcCevapDilekce(davaTebligatTarihi: string): string {
  const [y, m, d] = davaTebligatTarihi.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return format(addDays(date, 14), 'yyyy-MM-dd')
}

/**
 * SURE-05: Checks if a date falls within the adli tatil period.
 * Adli tatil: 20 Temmuz – 31 Ağustos of the date's year.
 * No automatic extension — caller displays a warning badge.
 */
export function isInAdliTatil(sonTarihStr: string): boolean {
  const [y, m, d] = sonTarihStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const start = new Date(y, 6, 20)   // July 20 (month is 0-indexed)
  const end = new Date(y, 7, 31)     // August 31
  return isWithinInterval(date, { start, end })
}

/**
 * DASH-02: Returns calendar days from today to deadline.
 * Negative = overdue, 0 = today, positive = future.
 */
export function getDaysUntil(sonTarihStr: string): number {
  const [y, m, d] = sonTarihStr.split('-').map(Number)
  // Use noon to avoid timezone off-by-one errors
  const date = new Date(y, m - 1, d, 12, 0, 0, 0)
  const today = new Date()
  const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0, 0)
  return differenceInCalendarDays(date, todayNormalized)
}
