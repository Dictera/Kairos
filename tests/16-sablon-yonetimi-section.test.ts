import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'

const SECTION_PATH = 'components/ayarlar/sablon-yonetimi-section.tsx'
const PAGE_PATH = 'components/ayarlar/ayarlar-page.tsx'

describe('Şablon Yönetimi section: copy + structure (SABLON-02, SABLON-04)', () => {
  const src = readFileSync(SECTION_PATH, 'utf-8')

  it('uses client directive', () => { expect(src.startsWith("'use client'")).toBe(true) })
  it('renders required Turkish copy strings (UI-SPEC contract)', () => {
    expect(src).toContain('Şablon Yönetimi')
    expect(src).toContain('Şablon Yükle')
    expect(src).toContain('Şablonu Değiştir')
    expect(src).toContain('Henüz şablon eklenmedi')
    expect(src).toContain('Bu şablonu silmek istediğinize emin misiniz')
    expect(src).toContain('Evet, Sil')
    expect(src).toContain('Tüm Kategoriler')
  })
  it('wires all four tRPC procedures', () => {
    expect(src).toMatch(/trpc\.sablon\.list/)
    expect(src).toMatch(/trpc\.sablon\.create/)
    expect(src).toMatch(/trpc\.sablon\.update/)
    expect(src).toMatch(/trpc\.sablon\.delete/)
  })
  it('posts to /api/templates/upload before mutating', () => {
    expect(src).toMatch(/fetch\(['"]\/api\/templates\/upload['"]/)
  })
  it('restricts file input to .docx', () => {
    expect(src).toContain('accept=".docx"')
  })
})

describe('Şablon Yönetimi page mount (SABLON-04)', () => {
  const sablonPage = readFileSync('app/(dashboard)/sablon-yonetimi/page.tsx', 'utf-8')
  it('imports SablonYonetimiSection', () => {
    expect(sablonPage).toMatch(/import\s+SablonYonetimiSection\s+from\s+['"]@\/components\/ayarlar\/sablon-yonetimi-section['"]/)
  })
  it('renders SablonYonetimiSection in JSX', () => {
    expect(sablonPage).toMatch(/<SablonYonetimiSection\s*\/>/)
  })
})