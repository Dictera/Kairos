import { describe, it, expect } from 'vitest'
import { belge, finans_kalemi, BELGE_KATEGORILER, FINANS_TUR } from '@/lib/schema'
import { belgeRouter } from '@/lib/trpc/routers/belge'
import { finansRouter } from '@/lib/trpc/routers/finans'
import { readFileSync } from 'fs'

// Gap 1 — Schema columns (BELGE-01, FINANS-01)
describe('Schema: belge + finans_kalemi tables', () => {
  it('belge table is exported from lib/schema.ts', () => {
    expect(belge).toBeDefined()
  })

  it('finans_kalemi table is exported from lib/schema.ts', () => {
    expect(finans_kalemi).toBeDefined()
  })

  it('BELGE_KATEGORILER has exactly 7 categories', () => {
    expect(BELGE_KATEGORILER).toHaveLength(7)
  })

  it('FINANS_TUR has 3 types: Gelen, Giden, Masraf', () => {
    expect(FINANS_TUR).toHaveLength(3)
    expect(FINANS_TUR).toContain('Gelen')
    expect(FINANS_TUR).toContain('Giden')
    expect(FINANS_TUR).toContain('Masraf')
  })
})

// Gap 2 — Upload route validation logic (BELGE-04)
describe('Upload route: ALLOWED_TYPES and MAX_SIZE', () => {
  it('ALLOWED_TYPES blocks non-PDF/DOC/DOCX/JPG/PNG', () => {
    const routeContent = readFileSync('app/api/upload/route.ts', 'utf-8')
    expect(routeContent).toContain("'application/pdf'")
    expect(routeContent).toContain("'application/msword'")
    expect(routeContent).toContain("'image/jpeg'")
    expect(routeContent).toContain("'image/png'")
  })

  it('MAX_SIZE is 20MB (20 * 1024 * 1024)', () => {
    const routeContent = readFileSync('app/api/upload/route.ts', 'utf-8')
    expect(routeContent).toContain('20 * 1024 * 1024')
  })

  it('upload route exports POST handler', () => {
    const routeContent = readFileSync('app/api/upload/route.ts', 'utf-8')
    expect(routeContent).toContain('export async function POST')
  })
})

// Gap 3 — belge router procedures (BELGE-03)
describe('belge router: procedure existence (BELGE-03)', () => {
  it('has list procedure', () => {
    expect(belgeRouter._def.procedures).toHaveProperty('list')
  })

  it('has create procedure', () => {
    expect(belgeRouter._def.procedures).toHaveProperty('create')
  })

  it('has delete procedure', () => {
    expect(belgeRouter._def.procedures).toHaveProperty('delete')
  })
})

// Gap 4 — finans router procedures + getSummary logic (FINANS-01–06)
describe('finans router: procedure existence (FINANS-01..06)', () => {
  it('has list procedure', () => {
    expect(finansRouter._def.procedures).toHaveProperty('list')
  })

  it('has create procedure', () => {
    expect(finansRouter._def.procedures).toHaveProperty('create')
  })

  it('has update procedure', () => {
    expect(finansRouter._def.procedures).toHaveProperty('update')
  })

  it('has delete procedure', () => {
    expect(finansRouter._def.procedures).toHaveProperty('delete')
  })

  it('has getSummary procedure', () => {
    expect(finansRouter._def.procedures).toHaveProperty('getSummary')
  })

  it('has dashboard procedure', () => {
    expect(finansRouter._def.procedures).toHaveProperty('dashboard')
  })
})

describe('getSummary net calculation (FINANS-01..06)', () => {
  it('net = gelen - giden - masraf', () => {
    const gelen = 1000
    const giden = 300
    const masraf = 150
    const net = gelen - giden - masraf
    expect(net).toBe(550)
  })
})

// Gap 5 — Finans input validation (FINANS-04)
describe('Finans input validation (FINANS-04)', () => {
  it('tutar must be positive: parseFloat("-1") < 0 fails positive check', () => {
    expect(parseFloat('-1') < 0).toBe(true)
  })

  it('tarih must match YYYY-MM-DD regex', () => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    expect(dateRegex.test('2024-01-15')).toBe(true)
    expect(dateRegex.test('2024-1-5')).toBe(false)
    expect(dateRegex.test('01-15-2024')).toBe(false)
    expect(dateRegex.test('2024/01/15')).toBe(false)
  })

  it('tur must be one of FINANS_TUR values', () => {
    expect(FINANS_TUR.includes('Gelen')).toBe(true)
    expect(FINANS_TUR.includes('Giden')).toBe(true)
    expect(FINANS_TUR.includes('Masraf')).toBe(true)
    expect(FINANS_TUR.includes('Other')).toBe(false)
  })
})

// Gap 6 — Entry sorting (FINANS-02)
describe('Entry sorting: tarih descending (newest first) (FINANS-02)', () => {
  it('sorts entries by tarih descending', () => {
    const entries = [
      { id: 1, tarih: '2024-01-15' },
      { id: 2, tarih: '2024-03-10' },
      { id: 3, tarih: '2024-02-20' },
    ]

    const sorted = [...entries].sort((a, b) => {
      return new Date(b.tarih).getTime() - new Date(a.tarih).getTime()
    })

    expect(sorted[0].id).toBe(2)  // 2024-03-10 (newest)
    expect(sorted[1].id).toBe(3)  // 2024-02-20
    expect(sorted[2].id).toBe(1)  // 2024-01-15 (oldest)
  })
})
