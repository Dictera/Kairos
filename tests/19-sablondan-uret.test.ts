import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'

const URET_PATH = 'components/belge/sablondan-uret.tsx'
const LIST_PATH = 'components/belge/belge-list.tsx'
const TABS_PATH = 'components/dosya/dosya-detail-tabs.tsx'

describe('SablondanUret component (BUI-01, BUI-02, BUI-03, BUI-04)', () => {
  const src = readFileSync(URET_PATH, 'utf-8')
  it('uses client directive', () => expect(src.startsWith("'use client'")).toBe(true))
  it('renders required Turkish copy (UI-SPEC contract)', () => {
    expect(src).toContain('Şablondan Belge Üret')
    expect(src).toContain('Şablondan Üret')
    expect(src).toContain('Şablon seçin…')
    expect(src).toContain('Şablon ara…')
    expect(src).toContain('Şablon bulunamadı.')
    expect(src).toContain('Henüz şablon eklenmedi.')
    expect(src).toContain('Tümü')
    expect(src).toContain('STK')
    expect(src).toContain('Mahkeme')
    expect(src).toContain('Genel')
    expect(src).toContain('PDF Üretiliyor')
    expect(src).toContain('Şablon dolduruluyor…')
    expect(src).toContain('PDF oluşturuluyor…')
    expect(src).toContain('Arşivleniyor…')
    expect(src).toContain('PDF üretildi.')
    expect(src).toContain('Üretiliyor…')
  })
  it('wires tRPC mutations and invalidation', () => {
    expect(src).toMatch(/trpc\.pdf\.generate/)
    expect(src).toMatch(/trpc\.sablon\.list/)
    expect(src).toMatch(/trpc\.belge\.list\.queryKey/)
  })
  it('uses shadcn Command + Tabs primitives', () => {
    expect(src).toMatch(/CommandInput/)
    expect(src).toMatch(/CommandList/)
    expect(src).toMatch(/CommandItem/)
    expect(src).toMatch(/CommandEmpty/)
    expect(src).toMatch(/TabsTrigger/)
  })
  it('progress modal is non-dismissible', () => {
    expect(src).toMatch(/onInteractOutside=\{[^}]*preventDefault/)
    expect(src).toMatch(/onEscapeKeyDown=\{[^}]*preventDefault/)
  })
  it('primary CTA uses bg-primary (orange) per UI-SPEC §Color', () => {
    expect(src).toMatch(/bg-primary/)
  })
  it('forwards backend Turkish error message on BAD_REQUEST', () => {
    expect(src).toMatch(/toast\.error\(\s*err\.message\s*\)/)
  })
})

describe('BelgeList generated-PDF row (BUI-05, D-11, D-12)', () => {
  const src = readFileSync(LIST_PATH, 'utf-8')
  it('references sablon_id for generated-flag branch', () => {
    expect(src).toMatch(/sablon_id/)
  })
  it('applies accent left border to generated rows', () => {
    expect(src).toContain('border-l-4 border-l-[var(--accent)]')
  })
  it('uses FileText icon for generated PDFs', () => {
    expect(src).toMatch(/isGenerated\s*\?\s*FileText/)
  })
  it('renders Şablon:/seq subtitle', () => {
    expect(src).toContain('Şablon: ')
  })
  it('queries trpc.sablon.list for template name lookup', () => {
    expect(src).toMatch(/trpc\.sablon\.list/)
  })
  it('parses seq from dosya_adi', () => {
    expect(src).toMatch(/\.match\(\/-\(\\d\+\)\\\.pdf/) // matches /-(\d+)\.pdf/ literal in source
  })
})

describe('DosyaDetailTabs mount (D-01)', () => {
  const src = readFileSync(TABS_PATH, 'utf-8')
  it('imports SablondanUret from belge folder', () => {
    expect(src).toMatch(/import\s*\{\s*SablondanUret\s*\}\s*from\s*['"]@\/components\/belge\/sablondan-uret['"]/)
  })
  it('mounts SablondanUret BEFORE BelgeUpload in belgeler TabsContent', () => {
    const iUret = src.indexOf('<SablondanUret')
    const iUpload = src.indexOf('<BelgeUpload')
    expect(iUret).toBeGreaterThan(-1)
    expect(iUpload).toBeGreaterThan(-1)
    expect(iUret).toBeLessThan(iUpload)
  })
})