import { describe, it, expect } from 'vitest'
import { sure, sureRelations, SURE_TUR, type SureTur } from '@/lib/schema'

describe('sure table schema (Task 1)', () => {
  it('sure table is defined with correct columns', () => {
    expect(sure).toBeDefined()
    expect(sure.id).toBeDefined()
    expect(sure.dosya_id).toBeDefined()
    expect(sure.ad).toBeDefined()
    expect(sure.son_tarih).toBeDefined()
    expect(sure.tur).toBeDefined()
    expect(sure.notlar).toBeDefined()
    expect(sure.created_at).toBeDefined()
  })

  it('sureRelations is defined', () => {
    expect(sureRelations).toBeDefined()
  })

  it('SURE_TUR constant has correct values', () => {
    expect(SURE_TUR).toContain('stk_itiraz')
    expect(SURE_TUR).toContain('istinaf')
    expect(SURE_TUR).toContain('cevap_dilekce')
    expect(SURE_TUR).toContain('manuel')
  })

  it('SureTur type can be extracted', () => {
    const test: SureTur = 'stk_itiraz'
    expect(test).toBe('stk_itiraz')
  })
})
