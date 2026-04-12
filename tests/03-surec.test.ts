import { describe, it, expect } from 'vitest'
import { surecRouter } from '@/lib/trpc/routers/surec'
import { STK_ASAMALAR, MAHKEME_ASAMALAR, parseSurecDetay } from '@/lib/schema'

describe('surec router: procedure existence', () => {
  it('has updateStkData procedure', () => {
    expect(surecRouter._def.procedures).toHaveProperty('updateStkData')
  })
  it('has stkIleriAl procedure', () => {
    expect(surecRouter._def.procedures).toHaveProperty('stkIleriAl')
  })
  it('has updateMahkemeData procedure', () => {
    expect(surecRouter._def.procedures).toHaveProperty('updateMahkemeData')
  })
  it('has mahkemeIleriAl procedure', () => {
    expect(surecRouter._def.procedures).toHaveProperty('mahkemeIleriAl')
  })
  it('has initMahkemeSurec procedure', () => {
    expect(surecRouter._def.procedures).toHaveProperty('initMahkemeSurec')
  })
  it('has durusmaList procedure', () => {
    expect(surecRouter._def.procedures).toHaveProperty('durusmaList')
  })
  it('has durusmaCreate procedure', () => {
    expect(surecRouter._def.procedures).toHaveProperty('durusmaCreate')
  })
  it('has durusmaUpdate procedure', () => {
    expect(surecRouter._def.procedures).toHaveProperty('durusmaUpdate')
  })
  it('has durusmaDelete procedure', () => {
    expect(surecRouter._def.procedures).toHaveProperty('durusmaDelete')
  })
})

describe('stage enums', () => {
  it('STK_ASAMALAR has 9 stages in correct order', () => {
    expect(STK_ASAMALAR).toEqual([
      'BAŞVURU', 'KABUL', 'RAPORTÖR_ATANDI', 'RAPORTÖR_İNCELEME',
      'HAKEM_KURULU', 'HAKEM_KARARI', 'İTİRAZ_SÜRESİ', 'İTİRAZ_DAVASI', 'KARAR_KESİNLEŞTİ',
    ])
  })
  it('MAHKEME_ASAMALAR has 8 stages in correct order', () => {
    expect(MAHKEME_ASAMALAR).toEqual([
      'DAVA_AÇILDI', 'TEBLİGAT', 'CEVAP_DİLEKÇESİ', 'TAHKİKAT',
      'BİLİRKİŞİ', 'KARAR', 'İSTİNAF', 'KESİNLEŞTİ',
    ])
  })
})

describe('parseSurecDetay', () => {
  it('returns empty object for null input', () => {
    expect(parseSurecDetay(null)).toEqual({})
  })
  it('returns empty object for undefined input', () => {
    expect(parseSurecDetay(undefined as unknown as string | null)).toEqual({})
  })
  it('returns empty object for invalid JSON', () => {
    expect(parseSurecDetay('not-json')).toEqual({})
  })
  it('parses valid JSON correctly', () => {
    const input = JSON.stringify({ stk: { asama: 'BAŞVURU' } })
    expect(parseSurecDetay(input)).toEqual({ stk: { asama: 'BAŞVURU' } })
  })
})
