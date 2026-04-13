import ExcelJS from 'exceljs'
import { db } from '@/lib/db'
import { dosya, muvekkil, sigortaSirketi } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const tur = searchParams.get('tur') as 'STK' | 'Mahkeme' | null
  const durum = searchParams.get('durum') as 'AKTIF' | 'PASIF' | null
  
  let entries = await db.select().from(dosya)
  
  if (tur) entries = entries.filter(e => e.tur === tur)
  if (durum) entries = entries.filter(e => e.durum === durum)
  
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Dosya Listesi')
  
  // Headers
  sheet.addRow(['Dosya No', 'Tür', 'Durum', 'Müşteri', 'Sigorta Şirketi', 'Talep Tutarı', 'Oluşturulma'])
  
  // Data rows
  for (const d of entries) {
    const [musteri] = await db.select().from(muvekkil).where(eq(muvekkil.id, d.muvekkil_id))
    const [sigorta] = d.sigorta_sirketi_id
      ? await db.select().from(sigortaSirketi).where(eq(sigortaSirketi.id, d.sigorta_sirketi_id))
      : [null]
    
    sheet.addRow([
      d.dosya_no,
      d.tur,
      d.durum,
      musteri?.ad || '',
      sigorta?.ad || '',
      d.basin_cumulative || 0,
      d.created_at,
    ])
  }
  
  // Column widths
  sheet.columns = [
    { width: 15 }, // Dosya No
    { width: 10 }, // Tür
    { width: 10 }, // Durum
    { width: 25 }, // Müşteri
    { width: 20 }, // Sigorta
    { width: 15 }, // Talep
    { width: 12 }, // Oluşturulma
  ]
  
  const buffer = await workbook.xlsx.writeBuffer()
  
  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="dosya-listesi.xlsx"',
    },
  })
}