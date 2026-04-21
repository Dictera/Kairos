import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'

const MODAL_PATH = 'components/ayarlar/variable-catalog-modal.tsx'
const SECTION_PATH = 'components/ayarlar/sablon-yonetimi-section.tsx'

describe('VariableCatalogModal (BUI-07, BUI-09)', () => {
  const src = readFileSync(MODAL_PATH, 'utf-8')
  it('uses client directive', () => expect(src.startsWith("'use client'")).toBe(true))
  it('imports VARIABLE_REGISTRY from lib/docx/variable-registry', () => {
    expect(src).toMatch(/import\s*\{[^}]*VARIABLE_REGISTRY[^}]*\}\s*from\s*['"]@\/lib\/docx\/variable-registry['"]/)
  })
  it('renders known/unknown badges with Turkish copy', () => {
    expect(src).toContain('✓ Bilinen')
    expect(src).toContain('⚠ Bilinmeyen')
  })
  it('sorts variables with Turkish locale', () => {
    expect(src).toMatch(/localeCompare\([^)]*['"]tr['"]/)
  })
  it('renders {{ path }} syntax in monospace', () => {
    expect(src).toMatch(/\{\{[\s\S]*?\}\}/)
  })
  it('known badge uses green palette', () => {
    expect(src).toContain('bg-green-100 text-green-800 border-green-300')
  })
  it('unknown badge uses amber palette', () => {
    expect(src).toContain('text-amber-600 border-amber-600')
  })
  it('uses shadcn Dialog primitives', () => {
    expect(src).toMatch(/from\s*['"]@\/components\/ui\/dialog['"]/)
  })
  it('uses VARIABLE_REGISTRY.find for path lookup', () => {
    expect(src).toMatch(/VARIABLE_REGISTRY\.find/)
  })
})

describe('SablonYonetimiSection row-click catalog (BUI-06)', () => {
  const src = readFileSync(SECTION_PATH, 'utf-8')
  it('declares catalogTarget state', () => {
    expect(src).toMatch(/catalogTarget/)
    expect(src).toMatch(/setCatalogTarget/)
  })
  it('imports VariableCatalogModal', () => {
    expect(src).toMatch(/import\s*\{[^}]*VariableCatalogModal[^}]*\}\s*from\s*['"]\.\/variable-catalog-modal['"]/)
  })
  it('row has cursor-pointer and setCatalogTarget onClick', () => {
    expect(src).toMatch(/TableRow[^>]*className\s*=\s*['"][^'"]*cursor-pointer/)
    expect(src).toMatch(/onClick=\{\(\)\s*=>\s*setCatalogTarget\(t\)\}/)
  })
  it('action cell stops propagation', () => {
    expect(src).toMatch(/onClick=\{\(e\)\s*=>\s*e\.stopPropagation\(\)\}/)
  })
  it('VariableCatalogModal rendered in JSX', () => {
    expect(src).toMatch(/<VariableCatalogModal/)
  })
  it('does not regress existing template-management copy', () => {
    expect(src).toContain('Şablon Yönetimi')
    expect(src).toContain('Şablon Yükle')
    expect(src).toContain('Henüz şablon eklenmedi')
  })
})