import { describe, it, expect } from 'vitest'
import * as schema from '@/lib/schema'

describe('Phase 3 schema additions', () => {
  it('dosya table has surec_detay column', () => {
    expect(schema.dosya.surec_detay).toBeDefined()
  })
  it('durusma table is exported', () => {
    expect(schema.durusma).toBeDefined()
  })
  it('durusma table has dosya_id column', () => {
    expect(schema.durusma.dosya_id).toBeDefined()
  })
  it('durusma table has tarih column', () => {
    expect(schema.durusma.tarih).toBeDefined()
  })
  it('durusma table has saat column', () => {
    expect(schema.durusma.saat).toBeDefined()
  })
  it('durusma table has mahkeme_kurum column', () => {
    expect(schema.durusma.mahkeme_kurum).toBeDefined()
  })
  it('durusma table has tur column', () => {
    expect(schema.durusma.tur).toBeDefined()
  })
  it('durusma table has notlar column', () => {
    expect(schema.durusma.notlar).toBeDefined()
  })
})
