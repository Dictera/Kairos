import { db } from '@/lib/db'
import { dosya } from '@/lib/schema'

// pdfmake's @types/pdfmake only covers the browser API (createPdf).
// The PdfPrinter class lives in js/Printer.js — access it directly.
const PdfPrinterClass = require('pdfmake/js/Printer').default

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
  content: any[]
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
  const allDosya = await db.select().from(dosya)

  const aktifCount = allDosya.filter(d => d.durum === 'AKTIF').length
  const pasifCount = allDosya.filter(d => d.durum === 'PASIF').length
  const stkCount = allDosya.filter(d => d.tur === 'STK').length
  const mahkemeCount = allDosya.filter(d => d.tur === 'Mahkeme').length

  const docDefinition = {
    content: [
      { text: 'PORTFÖY RAPORU', font: 'Roboto', bold: true, fontSize: 18, margin: [0, 0, 0, 20] },
      { text: `Toplam Dosya: ${allDosya.length}`, font: 'Roboto', margin: [0, 0, 0, 5] },
      { text: `Aktif: ${aktifCount}`, font: 'Roboto', margin: [0, 0, 0, 5] },
      { text: `Pasif: ${pasifCount}`, font: 'Roboto', margin: [0, 0, 0, 20] },
      { text: 'Türe Göre Dağılım:', font: 'Roboto', bold: true, margin: [0, 0, 0, 5] },
      { text: `STK: ${stkCount}`, font: 'Roboto', margin: [0, 0, 0, 5] },
      { text: `Mahkeme: ${mahkemeCount}`, font: 'Roboto', margin: [0, 0, 0, 5] },
    ],
    defaultStyle: {
      font: 'Roboto',
    },
  }

  const pdfBuffer = await generatePdfBuffer(docDefinition)

  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="portfoy-raporu.pdf"',
    },
  })
}