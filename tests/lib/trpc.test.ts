import { describe, it, expect } from 'vitest'
import { tarafSchema } from '@/lib/trpc/routers/dosya'

describe('tarafSchema', () => {
  it('accepts minimal valid input with only dosya_id', () => {
    const result = tarafSchema.safeParse({ dosya_id: 1 })
    expect(result.success).toBe(true)
  })

  it('accepts surucu_ad field', () => {
    const result = tarafSchema.safeParse({ dosya_id: 1, surucu_ad: 'Ahmet' })
    expect(result.success).toBe(true)
  })

  it('accepts surucu_soyad field', () => {
    const result = tarafSchema.safeParse({ dosya_id: 1, surucu_soyad: 'Yılmaz' })
    expect(result.success).toBe(true)
  })

  it('accepts surucu_plaka field without format validation', () => {
    const result = tarafSchema.safeParse({ dosya_id: 1, surucu_plaka: '34 ABC 12' })
    expect(result.success).toBe(true)
  })

  it('accepts valid surucu_telefon', () => {
    const result = tarafSchema.safeParse({ dosya_id: 1, surucu_telefon: '05321234567' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid surucu_telefon', () => {
    const result = tarafSchema.safeParse({ dosya_id: 1, surucu_telefon: '12345678901' })
    expect(result.success).toBe(false)
  })

  it('accepts surucu_police_no field', () => {
    const result = tarafSchema.safeParse({ dosya_id: 1, surucu_police_no: 'ABC123456' })
    expect(result.success).toBe(true)
  })

  it('accepts all 5 new driver fields together', () => {
    const result = tarafSchema.safeParse({
      dosya_id: 1,
      surucu_ad: 'Ahmet',
      surucu_soyad: 'Yılmaz',
      surucu_plaka: '34 ABC 12',
      surucu_telefon: '05321234567',
      surucu_police_no: 'ABC123456',
    })
    expect(result.success).toBe(true)
  })
})
