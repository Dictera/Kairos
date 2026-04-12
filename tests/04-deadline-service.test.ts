import { describe, it, expect } from 'vitest'
import { calcStkItirazSuresi, calcIstinafBasvurusu, calcCevapDilekce, isInAdliTatil, getDaysUntil } from '@/lib/deadline-service'

describe('deadline-service: calcStkItirazSuresi (SURE-01)', () => {
  it('returns tebligat + 10 calendar days', () => {
    expect(calcStkItirazSuresi('2025-01-01')).toBe('2025-01-11')
  })
  it('handles month boundary correctly', () => {
    expect(calcStkItirazSuresi('2025-01-25')).toBe('2025-02-04')
  })
  it('handles year boundary correctly', () => {
    expect(calcStkItirazSuresi('2024-12-28')).toBe('2025-01-07')
  })
})

describe('deadline-service: calcIstinafBasvurusu (SURE-02)', () => {
  it('returns karar tebligat + 14 calendar days', () => {
    expect(calcIstinafBasvurusu('2025-01-01')).toBe('2025-01-15')
  })
})

describe('deadline-service: calcCevapDilekce (SURE-03)', () => {
  it('returns dava tebligat + 14 calendar days', () => {
    expect(calcCevapDilekce('2025-01-01')).toBe('2025-01-15')
  })
})

describe('deadline-service: isInAdliTatil (SURE-05)', () => {
  it('returns true for date in July 20 – August 31 range', () => {
    expect(isInAdliTatil('2025-07-25')).toBe(true)
  })
  it('returns false for date before July 20', () => {
    expect(isInAdliTatil('2025-07-19')).toBe(false)
  })
  it('returns false for date after August 31', () => {
    expect(isInAdliTatil('2025-09-01')).toBe(false)
  })
  it('returns true for July 20 boundary (inclusive)', () => {
    expect(isInAdliTatil('2025-07-20')).toBe(true)
  })
  it('returns true for August 31 boundary (inclusive)', () => {
    expect(isInAdliTatil('2025-08-31')).toBe(true)
  })
})

describe('deadline-service: getDaysUntil (DASH-02)', () => {
  it('returns negative number for past dates', () => {
    expect(getDaysUntil('2020-01-01')).toBeLessThan(0)
  })
  it('returns 0 for today', () => {
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    expect(getDaysUntil(todayStr)).toBe(0)
  })
  it('returns positive number for future dates', () => {
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    expect(getDaysUntil(future)).toBeGreaterThan(0)
  })
})
