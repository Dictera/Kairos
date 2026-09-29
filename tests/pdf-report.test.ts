import { describe, it, expect } from 'vitest'
import { generatePdfBuffer } from '@/lib/pdf-report'

describe('generatePdfBuffer', () => {
  it('renders a PDF with an embedded font that covers Turkish letters', async () => {
    const buf = await generatePdfBuffer({
      content: [{ text: 'FİNANSAL RAPOR — şğıİŞĞ', bold: true }],
      compress: false,
    })
    const pdf = buf.toString('latin1')
    expect(pdf.startsWith('%PDF-')).toBe(true)
    // An embedded TrueType font, not a WinAnsi-only standard font.
    expect(pdf).toContain('/FontFile2')
    expect(pdf).not.toContain('/BaseFont /Helvetica')
  })
})
