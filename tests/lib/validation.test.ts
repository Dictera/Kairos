import { describe, it, expect } from 'vitest'

const TURKISH_PHONE_REGEX = /^05[0-9]{9}$/

describe('Turkish phone validation', () => {
  it('accepts valid Turkish mobile 05321234567', () => {
    expect(TURKISH_PHONE_REGEX.test('05321234567')).toBe(true)
  })

  it('accepts valid Turkish mobile 05441234567', () => {
    expect(TURKISH_PHONE_REGEX.test('05441234567')).toBe(true)
  })

  it('accepts valid Turkish mobile 05351112233', () => {
    expect(TURKISH_PHONE_REGEX.test('05351112233')).toBe(true)
  })

  it('rejects wrong prefix 12345678901', () => {
    expect(TURKISH_PHONE_REGEX.test('12345678901')).toBe(false)
  })

  it('rejects too short 0532123456', () => {
    expect(TURKISH_PHONE_REGEX.test('0532123456')).toBe(false)
  })

  it('rejects too long 053212345678', () => {
    expect(TURKISH_PHONE_REGEX.test('053212345678')).toBe(false)
  })

  it('rejects non-digit characters', () => {
    expect(TURKISH_PHONE_REGEX.test('0532-123-45-67')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(TURKISH_PHONE_REGEX.test('')).toBe(false)
  })
})
