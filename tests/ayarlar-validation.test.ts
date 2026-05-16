import { describe, it, expect } from 'vitest'
import { sigortaSirketiSchema, avukatSchema } from '@/lib/trpc/routers/ayarlar'

describe('sigortaSirketiSchema (D-01..D-04)', () => {
  it('accepts minimum valid input (VKN 10 digits)', () => {
    expect(sigortaSirketiSchema.safeParse({ ad: 'Allianz', vergi_no: '1234567890' }).success).toBe(true)
  })
  it('accepts all fields filled (TCKN 11 digits)', () => {
    expect(sigortaSirketiSchema.safeParse({
      ad: 'Axa', vergi_no: '12345678901', mersis_no: 'ABC',
      bagli_oldugu_vergi_dairesi: 'Kadıköy', ihtar_mail: 'a@b.com', kep_mail: 'c@d.com',
    }).success).toBe(true)
  })
  it('accepts empty strings for optional fields', () => {
    expect(sigortaSirketiSchema.safeParse({
      ad: 'X', vergi_no: '1234567890', mersis_no: '', bagli_oldugu_vergi_dairesi: '',
      ihtar_mail: '', kep_mail: '',
    }).success).toBe(true)
  })
  it('rejects vergi_no with wrong digit count', () => {
    expect(sigortaSirketiSchema.safeParse({ ad: 'X', vergi_no: '123' }).success).toBe(false)
    expect(sigortaSirketiSchema.safeParse({ ad: 'X', vergi_no: '123456789012' }).success).toBe(false)
    expect(sigortaSirketiSchema.safeParse({ ad: 'X', vergi_no: 'abc1234567' }).success).toBe(false)
  })
  it('rejects invalid ihtar_mail / kep_mail', () => {
    expect(sigortaSirketiSchema.safeParse({ ad: 'X', vergi_no: '1234567890', ihtar_mail: 'not-an-email' }).success).toBe(false)
    expect(sigortaSirketiSchema.safeParse({ ad: 'X', vergi_no: '1234567890', kep_mail: '@broken' }).success).toBe(false)
  })
  it('rejects empty ad', () => {
    expect(sigortaSirketiSchema.safeParse({ ad: '', vergi_no: '1234567890' }).success).toBe(false)
  })
})

describe('avukatSchema (D-07)', () => {
  it('accepts minimum valid input', () => {
    expect(avukatSchema.safeParse({ ad: 'Av. Ali Veli', tbb_sicil_no: '12345' }).success).toBe(true)
  })
  it('accepts all fields with valid values', () => {
    expect(avukatSchema.safeParse({
      ad: 'Av. Ali', tbb_sicil_no: '12345',
      iban: 'TR' + '0'.repeat(24), eposta: 'a@b.com', telefon: '05321234567',
    }).success).toBe(true)
  })
  it('rejects invalid telefon format', () => {
    expect(avukatSchema.safeParse({ ad: 'X', tbb_sicil_no: 'Y', telefon: '5321234567' }).success).toBe(false)
    expect(avukatSchema.safeParse({ ad: 'X', tbb_sicil_no: 'Y', telefon: '053212345' }).success).toBe(false)
  })
  it('rejects invalid IBAN format', () => {
    expect(avukatSchema.safeParse({ ad: 'X', tbb_sicil_no: 'Y', iban: 'TR123' }).success).toBe(false)
    expect(avukatSchema.safeParse({ ad: 'X', tbb_sicil_no: 'Y', iban: 'XX' + '0'.repeat(24) }).success).toBe(false)
  })
  it('rejects empty required fields', () => {
    expect(avukatSchema.safeParse({ ad: '', tbb_sicil_no: 'Y' }).success).toBe(false)
    expect(avukatSchema.safeParse({ ad: 'X', tbb_sicil_no: '' }).success).toBe(false)
  })
  it('accepts empty strings for optional fields', () => {
    expect(avukatSchema.safeParse({ ad: 'X', tbb_sicil_no: 'Y', iban: '', eposta: '', telefon: '' }).success).toBe(true)
  })
})