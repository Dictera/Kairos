import { db } from '@/lib/db'
import { finanstablosu } from '@/lib/schema'
import { generatePdfBuffer } from '@/lib/pdf/pdf-generator'

export async function GET() {
  const entries = await db.select().from(finanstablosu)
  
  const gelen = entries.filter(e => e.tur === 'Gelen').reduce((sum, e) => sum + (e.tutar || 0), 0)
  const giden = entries.filter(e => e.tur === 'Giden').reduce((sum, e) => sum + (e.tutar || 0), 0)
  const masraf = entries.filter(e => e.tur === 'Masraf').reduce((sum, e) => sum + (e.tutar || 0), 0)
  
  const docDefinition = {
    content: [
      { text: 'FİNANSAL RAPOR', font: 'Arial', bold: true, fontSize: 18, margin: [0, 0, 0, 20] },
      { text: `Toplam Gelen: ${gelen.toLocaleString('tr-TR')} TL`, font: 'Arial', margin: [0, 0, 0, 5] },
      { text: `Toplam Giden: ${giden.toLocaleString('tr-TR')} TL`, font: 'Arial', margin: [0, 0, 0, 5] },
      { text: `Toplam Masraf: ${masraf.toLocaleString('tr-TR')} TL`, font: 'Arial', margin: [0, 0, 0, 5] },
      { text: `Net: ${(gelen - giden - masraf).toLocaleString('tr-TR')} TL`, font: 'Arial', margin: [0, 0, 0, 20] },
      { text: `Son 30 Gün İşlem Sayısı: ${entries.length}`, font: 'Arial' },
    ],
    defaultStyle: {
      font: 'Arial',
    },
  }
  
  const pdfBuffer = await generatePdfBuffer(docDefinition)
  
  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="finansal-rapor.pdf"',
    },
  })
}