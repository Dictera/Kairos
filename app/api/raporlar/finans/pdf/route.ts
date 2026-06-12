import { db } from '@/lib/db'
import { finans_kalemi } from '@/lib/schema'
import { requireAuth } from '@/lib/auth-guard'
import { connection } from 'next/server'

// pdfmake's @types/pdfmake only covers the browser API (createPdf).
// The PdfPrinter class lives in js/Printer.js — access it directly.
import PdfPrinterClass from 'pdfmake/js/Printer'

export const dynamic = 'force-dynamic'

const fonts = {
  Roboto: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
}
const printer = new PdfPrinterClass(fonts)

interface DocDefinition {
  content: Record<string, unknown>[]
  defaultStyle?: { font?: string; fontSize?: number }
}

async function generatePdfBuffer(docDefinition: DocDefinition): Promise<Buffer> {
  const pdfDoc = printer.createPdfKitDocument(docDefinition)
  const chunks: Buffer[] = []
  pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk))
  await new Promise<void>((resolve) => pdfDoc.on('end', resolve))
  pdfDoc.end()
  return Buffer.concat(chunks)
}

export async function GET() {
  await connection()
  const authError = await requireAuth()
  if (authError) return authError

  const entries = await db.select().from(finans_kalemi)

  const gelen = entries.filter(e => e.tur === 'Gelen').reduce((sum, e) => sum + (e.tutar || 0), 0)
  const giden = entries.filter(e => e.tur === 'Giden').reduce((sum, e) => sum + (e.tutar || 0), 0)
  const masraf = entries.filter(e => e.tur === 'Masraf').reduce((sum, e) => sum + (e.tutar || 0), 0)

  const docDefinition = {
    content: [
      { text: 'FİNANSAL RAPOR', font: 'Roboto', bold: true, fontSize: 18, margin: [0, 0, 0, 20] },
      { text: `Toplam Gelen: ${gelen.toLocaleString('tr-TR')} TL`, font: 'Roboto', margin: [0, 0, 0, 5] },
      { text: `Toplam Giden: ${giden.toLocaleString('tr-TR')} TL`, font: 'Roboto', margin: [0, 0, 0, 5] },
      { text: `Toplam Masraf: ${masraf.toLocaleString('tr-TR')} TL`, font: 'Roboto', margin: [0, 0, 0, 5] },
      { text: `Net: ${(gelen - giden - masraf).toLocaleString('tr-TR')} TL`, font: 'Roboto', margin: [0, 0, 0, 20] },
      { text: `Son 30 Gün İşlem Sayısı: ${entries.length}`, font: 'Roboto' },
    ],
    defaultStyle: {
      font: 'Roboto',
    },
  }

  const pdfBuffer = await generatePdfBuffer(docDefinition)

  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="finansal-rapor.pdf"',
    },
  })
}
