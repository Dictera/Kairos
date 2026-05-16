import { describe, it, expect } from 'vitest'
import {
  dosya, muvekkil, dosyaNot, olayGunlugu,
  STK_ASAMALAR, MAHKEME_ASAMALAR, BELGE_KATEGORILER,
  STK_ASAMA_LABELS, MAHKEME_ASAMA_LABELS,
} from '@/lib/schema'
import { dosyaSchema } from '@/lib/trpc/routers/dosya'

describe('TAB-01: Notes + Timeline', () => {
  it('dosyaNot table has required columns', () => {
    const cols = Object.keys(dosyaNot)
    expect(cols).toContain('id')
    expect(cols).toContain('dosya_id')
    expect(cols).toContain('icerik')
    expect(cols).toContain('created_at')
    expect(cols).toContain('updated_at')
  })

  it('olayGunlugu table has required columns', () => {
    const cols = Object.keys(olayGunlugu)
    expect(cols).toContain('id')
    expect(cols).toContain('dosya_id')
    expect(cols).toContain('olay_turu')
    expect(cols).toContain('aciklama')
    expect(cols).toContain('created_at')
  })
})

describe('TAB-02: Genel Bilgiler new fields', () => {
  it('dosyaSchema accepts hasar_dosya_no', () => {
    const result = dosyaSchema.safeParse({ muvekkil_id: 1, dosya_no: '2024/001', tur: 'STK', hasar_dosya_no: 'Sigorta - 111' })
    expect(result.success).toBe(true)
  })

  it('dosyaSchema accepts kaza_tarihi', () => {
    const result = dosyaSchema.safeParse({ muvekkil_id: 1, dosya_no: '2024/001', tur: 'STK', kaza_tarihi: '2024-01-15' })
    expect(result.success).toBe(true)
  })

  it('dosyaSchema accepts kusur_orani_karsi as integer 0-100', () => {
    const result = dosyaSchema.safeParse({ muvekkil_id: 1, dosya_no: '2024/001', tur: 'STK', kusur_orani_karsi: 75 })
    expect(result.success).toBe(true)
  })

  it('dosya table has new columns', () => {
    const cols = Object.keys(dosya)
    expect(cols).toContain('hasar_dosya_no')
    expect(cols).toContain('kaza_tarihi')
    expect(cols).toContain('muvekkil_sigorta_id')
    expect(cols).toContain('kusur_orani_karsi')
  })

  it('muvekkil table has iban column', () => {
    const cols = Object.keys(muvekkil)
    expect(cols).toContain('iban')
  })
})

describe('TAB-02: Stage restructure', () => {
  it('STK_ASAMALAR has 9 stages starting with İHTAR', () => {
    expect(STK_ASAMALAR).toHaveLength(9)
    expect(STK_ASAMALAR[0]).toBe('İHTAR')
  })

  it('MAHKEME_ASAMALAR has 12 stages starting with DAVA_DİLEKÇESİ_TEBLİĞ', () => {
    expect(MAHKEME_ASAMALAR).toHaveLength(12)
    expect(MAHKEME_ASAMALAR[0]).toBe('DAVA_DİLEKÇESİ_TEBLİĞ')
  })

  it('STK_ASAMA_LABELS has entry for each STK stage', () => {
    for (const asama of STK_ASAMALAR) {
      expect(STK_ASAMA_LABELS).toHaveProperty(asama)
    }
  })

  it('MAHKEME_ASAMA_LABELS has entry for each Mahkeme stage', () => {
    for (const asama of MAHKEME_ASAMALAR) {
      expect(MAHKEME_ASAMA_LABELS).toHaveProperty(asama)
    }
  })
})

describe('TAB-02: Belge categories', () => {
  it('BELGE_KATEGORILER includes new categories', () => {
    expect(BELGE_KATEGORILER).toContain('İhtarname')
    expect(BELGE_KATEGORILER).toContain('Bilirkişi Raporu')
    expect(BELGE_KATEGORILER).toContain('Tutanak')
    expect(BELGE_KATEGORILER).toContain('Tebliği')
  })
})

describe('UIUX-01: IBAN validation', () => {
  it('dosyaSchema rejects invalid IBAN format in muvekkil_sigorta_id field', () => {
    // muvekkil_sigorta_id is a number FK, not IBAN — IBAN is on muvekkil
    const result = dosyaSchema.safeParse({ muvekkil_id: 1, dosya_no: '2024/001', tur: 'STK', muvekkil_sigorta_id: 'not-a-number' })
    expect(result.success).toBe(false)
  })

  it('dosyaSchema accepts muvekkil_sigorta_id as valid integer', () => {
    const result = dosyaSchema.safeParse({ muvekkil_id: 1, dosya_no: '2024/001', tur: 'STK', muvekkil_sigorta_id: 5 })
    expect(result.success).toBe(true)
  })
})
