import { describe, it, expect } from 'vitest'
import { docxSablon, SABLON_KATEGORILER, belge } from '@/lib/schema'

describe('Schema: docx_sablon table (SABLON-07)', () => {
  it('docxSablon table is exported', () => { expect(docxSablon).toBeDefined() })
  it('SABLON_KATEGORILER has exactly 3 categories', () => {
    expect(SABLON_KATEGORILER).toHaveLength(3)
    expect(SABLON_KATEGORILER).toEqual(['STK', 'Mahkeme', 'Genel'])
  })
})

describe('Schema: belge.sablon_id FK (SABLON-08)', () => {
  it('belge has sablon_id column', () => {
    expect(belge.sablon_id).toBeDefined()
  })
})
