import { describe, it, expect } from 'vitest'
import { taraf } from '@/lib/schema'

describe('taraf table schema', () => {
  it('has surucu_ad column', () => {
    expect(taraf).toHaveProperty('surucu_ad')
  })

  it('has surucu_soyad column', () => {
    expect(taraf).toHaveProperty('surucu_soyad')
  })

  it('has surucu_plaka column', () => {
    expect(taraf).toHaveProperty('surucu_plaka')
  })

  it('has surucu_telefon column', () => {
    expect(taraf).toHaveProperty('surucu_telefon')
  })

  it('has surucu_police_no column', () => {
    expect(taraf).toHaveProperty('surucu_police_no')
  })
})
