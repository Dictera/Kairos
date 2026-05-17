import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'

const PAGE_PATH = 'components/degiskenler/cheat-sheet-page.tsx'
const CARD_PATH = 'components/ayarlar/cheat-sheet-summary-card.tsx'
const ROUTE_PATH = 'app/(dashboard)/ayarlar/degiskenler/page.tsx'
const AYARLAR_PATH = 'components/ayarlar/ayarlar-page.tsx'

describe('CheatSheetPage (BUI-08, BUI-09, D-09)', () => {
  const src = readFileSync(PAGE_PATH, 'utf-8')
  it('is a Server Component (no use client)', () => {
    expect(src.startsWith("'use client'")).toBe(false)
  })
  it('imports VARIABLE_REGISTRY', () => {
    expect(src).toMatch(/import\s*\{[^}]*VARIABLE_REGISTRY[^}]*\}\s*from\s*['"]@\/lib\/docx\/variable-registry['"]/)
  })
  it('renders page heading and subtitle', () => {
    expect(src).toContain('Değişken Listesi')
    expect(src).toContain('Şablonlarda kullanılabilen tüm değişkenler ve açıklamaları.')
  })
  it('renders all Turkish tab group headings', () => {
    expect(src).toContain('Genel')
    expect(src).toContain('Taraflar')
    expect(src).toContain('Süreç')
    expect(src).toContain('Duruşmalar')
    expect(src).toContain('Finans')
    expect(src).toContain('Notlar')
  })
  it('renders Jinja2 filter section (D-13)', () => {
    expect(src).toContain('Jinja2 Filtreler')
    expect(src).toContain('tr_currency')
    expect(src).toContain('tarih')
    expect(src).toContain('upper_tr')
    expect(src).toContain('lower_tr')
  })
  it('includes filter description examples', () => {
    expect(src).toContain('150.000,00 TL')
    expect(src).toContain('14.02.2026')
    expect(src).toContain('ı→I')
    expect(src).toContain('İ→i')
  })
})

describe('CheatSheetSummaryCard (BUI-08 entry, D-10)', () => {
  const src = readFileSync(CARD_PATH, 'utf-8')
  it('contains card title and link copy', () => {
    expect(src).toContain('Değişken Listesi')
    expect(src).toContain('Tüm değişkenleri gör')
    expect(src).toContain('Şablonlarınızda kullanabileceğiniz tüm değişkenlerin listesi ve açıklamaları.')
  })
  it('imports Link from next/link', () => {
    expect(src).toMatch(/import\s+Link\s+from\s+['"]next\/link['"]/)
  })
  it('links to cheat-sheet route', () => {
    expect(src).toMatch(/href=['"]\/ayarlar\/degiskenler['"]/)
  })
  it('uses shadcn Card primitives', () => {
    expect(src).toMatch(/from\s*['"]@\/components\/ui\/card['"]/)
  })
  it('does NOT inline the variable list (D-10 link-only)', () => {
    // No VARIABLE_REGISTRY import or usage in summary card
    expect(src).not.toMatch(/VARIABLE_REGISTRY/)
  })
})

describe('Cheat-sheet route', () => {
  const src = readFileSync(ROUTE_PATH, 'utf-8')
  it('imports CheatSheetPage', () => {
    expect(src).toMatch(/import\s*\{\s*CheatSheetPage\s*\}\s*from\s*['"]@\/components\/degiskenler\/cheat-sheet-page['"]/)
  })
  it('has default export', () => {
    expect(src).toMatch(/export\s+default\s+function/)
  })
})

describe('AyarlarPage section presence', () => {
  const src = readFileSync(AYARLAR_PATH, 'utf-8')
  it('does not contain SablonYonetimiSection (moved to dedicated page)', () => {
    expect(src).not.toContain('SablonYonetimiSection')
  })
  it('does not contain CheatSheetSummaryCard (moved to dedicated page)', () => {
    expect(src).not.toContain('CheatSheetSummaryCard')
  })
  it('retains core sections', () => {
    expect(src).toContain('SigortaSirketiSection')
    expect(src).toContain('PipelineStatus')
  })
})
