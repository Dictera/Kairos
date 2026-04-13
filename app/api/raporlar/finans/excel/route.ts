import ExcelJS from 'exceljs'
import { db } from '@/lib/db'
import { finanstablosu, dosya, muvekkil } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  const entries = await db.select().from(finanstablosu)
  
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Finansal Rapor')
  
  // Headers
  sheet.addRow(['Tarih', 'Tür', 'Tutar', 'Açıklama', 'Dosya No', 'Müşteri'])
  
  // Data rows with joins
  for (const entry of entries) {
    const [dosyaData] = await db.select().from(dosya).where(eq(dosya.id, entry.dosya_id))
    const [musteri] = dosyaData
      ? await db.select().from(muvekkil).where(eq(muvekkil.id, dosyaData.muvekkil_id))
      : [null]
    
    sheet.addRow([
      entry.tarih,
      entry.tur,
      entry.tutar,
      entry.aciklama || '',
      dosyaData?.dosya_no || '',
      musteri?.ad || '',
    ])
  }
  
  // Summary row
  sheet.addRow([])
  sheet.addRow(['Toplam', '', entries.reduce((s, e) => s + (e.tutar || 0), 0)])
  
  // Column widths
  sheet.columns = [
    { width: 12 }, // Tarih
    { width: 10 }, // Tür
    { width: 15 }, // Tutar
    { width: 30 }, // Açıklama
    { width: 15 }, // Dosya No
    { width: 25 }, // Müşteri
  ]
  
  const buffer = await workbook.xlsx.writeBuffer()
  
  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="finansal-rapor.xlsx"',
    },
  })
}