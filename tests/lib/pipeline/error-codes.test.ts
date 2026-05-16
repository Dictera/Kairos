import { describe, it, expect } from 'vitest'
import { PIPELINE_EXIT_CODES, getTurkishErrorMessage } from '@/lib/pipeline/error-codes'

describe('lib/pipeline/error-codes', () => {
  it('PIPELINE_EXIT_CODES has all 5 codes (0-4)', () => {
    expect(PIPELINE_EXIT_CODES).toHaveProperty('0')
    expect(PIPELINE_EXIT_CODES).toHaveProperty('1')
    expect(PIPELINE_EXIT_CODES).toHaveProperty('2')
    expect(PIPELINE_EXIT_CODES).toHaveProperty('3')
    expect(PIPELINE_EXIT_CODES).toHaveProperty('4')
  })

  it('getTurkishErrorMessage(0) returns Başarılı', () => {
    expect(getTurkishErrorMessage(0)).toBe('Başarılı')
  })

  it('getTurkishErrorMessage(2) returns Şablon doldurma hatası', () => {
    expect(getTurkishErrorMessage(2)).toBe('Şablon doldurma hatası')
  })

  it('getTurkishErrorMessage(99) returns bilinmeyen hata message', () => {
    const result = getTurkishErrorMessage(99)
    expect(result).toContain('99')
  })

  it('getTurkishErrorMessage(1) returns Doğrulama hatası', () => {
    expect(getTurkishErrorMessage(1)).toBe('Doğrulama hatası')
  })

  it('getTurkishErrorMessage(3) returns PDF dönüştürme hatası', () => {
    expect(getTurkishErrorMessage(3)).toBe('PDF dönüştürme hatası')
  })

  it('getTurkishErrorMessage(4) returns Arşivleme hatası', () => {
    expect(getTurkishErrorMessage(4)).toBe('Arşivleme hatası')
  })
})