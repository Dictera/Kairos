import { describe, it, expect } from 'vitest'

describe('deadline-service: calcStkItirazSuresi (SURE-01)', () => {
  it.todo('returns tebligat + 10 calendar days')
  it.todo('handles month boundary correctly')
  it.todo('handles year boundary correctly')
})

describe('deadline-service: calcIstinafBasvurusu (SURE-02)', () => {
  it.todo('returns karar tebligat + 14 calendar days')
})

describe('deadline-service: calcCevapDilekce (SURE-03)', () => {
  it.todo('returns dava tebligat + 14 calendar days')
})

describe('deadline-service: isInAdliTatil (SURE-05)', () => {
  it.todo('returns true for date in July 20 – August 31 range')
  it.todo('returns false for date before July 20')
  it.todo('returns false for date after August 31')
  it.todo('returns true for July 20 boundary (inclusive)')
  it.todo('returns true for August 31 boundary (inclusive)')
})

describe('deadline-service: getDaysUntil (DASH-02)', () => {
  it.todo('returns negative number for past dates')
  it.todo('returns 0 for today')
  it.todo('returns positive number for future dates')
})
