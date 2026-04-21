import { describe, it, expect } from 'vitest'
import {
  VARIABLE_REGISTRY,
  getNestedValue,
  getMissingVariables,
} from '@/lib/docx/variable-registry'

describe('getNestedValue', () => {
  it('returns value for dot-notation path', () => {
    expect(getNestedValue({ a: { b: 'c' } }, 'a.b')).toBe('c')
  })

  it('returns value for array index path', () => {
    expect(getNestedValue({ arr: [{ x: 1 }] }, 'arr[0].x')).toBe(1)
  })

  it('returns undefined for missing path', () => {
    expect(getNestedValue({}, 'missing')).toBeUndefined()
  })
})

describe('getMissingVariables', () => {
  it('returns empty array when all variables are present', () => {
    const result = getMissingVariables(
      ['muvekkil.ad'],
      { muvekkil: { ad: 'Ali' } }
    )
    expect(result).toEqual([])
  })

  it('returns missing variable info when value is absent', () => {
    const result = getMissingVariables(
      ['muvekkil.ad'],
      { muvekkil: {} }
    )
    expect(result).toEqual([
      { var: 'muvekkil.ad', tab: 'genel', label: 'Müvekkil adı' },
    ])
  })

  it('falls back to genel tab and var name for unknown variables', () => {
    const result = getMissingVariables(
      ['bilinmeyen.x'],
      { bilinmeyen: {} }
    )
    expect(result).toEqual([
      { var: 'bilinmeyen.x', tab: 'genel', label: 'bilinmeyen.x' },
    ])
  })

  it('detects null as missing', () => {
    const result = getMissingVariables(
      ['muvekkil.ad'],
      { muvekkil: { ad: null } }
    )
    expect(result).toHaveLength(1)
    expect(result[0].var).toBe('muvekkil.ad')
  })

  it('detects empty string as missing', () => {
    const result = getMissingVariables(
      ['muvekkil.ad'],
      { muvekkil: { ad: '' } }
    )
    expect(result).toHaveLength(1)
    expect(result[0].var).toBe('muvekkil.ad')
  })
})

describe('VARIABLE_REGISTRY', () => {
  it('contains muvekkil.ad with correct metadata', () => {
    const info = VARIABLE_REGISTRY.find((v) => v.path === 'muvekkil.ad')
    expect(info).toBeDefined()
    expect(info!.tab).toBe('genel')
    expect(info!.label).toBe('Müvekkil adı')
  })

  it('contains dosya.dosya_no with correct metadata', () => {
    const info = VARIABLE_REGISTRY.find((v) => v.path === 'dosya.dosya_no')
    expect(info).toBeDefined()
    expect(info!.tab).toBe('genel')
    expect(info!.label).toBe('Dosya numarası')
  })

  it('contains taraf.karsitaraf_ad with correct metadata', () => {
    const info = VARIABLE_REGISTRY.find((v) => v.path === 'taraf.karsitaraf_ad')
    expect(info).toBeDefined()
    expect(info!.tab).toBe('taraflar')
  })

  it('contains stk.stk_esas_no with correct metadata', () => {
    const info = VARIABLE_REGISTRY.find((v) => v.path === 'stk.stk_esas_no')
    expect(info).toBeDefined()
    expect(info!.tab).toBe('surec')
  })

  it('contains durusmalar example with correct metadata', () => {
    const info = VARIABLE_REGISTRY.find((v) => v.path === 'durusmalar[0].tarih')
    expect(info).toBeDefined()
    expect(info!.tab).toBe('durusmalar')
  })
})
