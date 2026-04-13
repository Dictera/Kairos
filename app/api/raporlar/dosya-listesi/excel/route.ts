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
  
  sheet.addRow(['Dosya No', 'Tür', 'Durum', 'Müşteri', 'Karşı Sigorta', 'Talep Tutarı', 'Oluşturulma'])
  
  for (const d of entries) {
    const [musteri] = await db.select().from(muvekkil).where(eq(muvekkil.id, d.muvekkil_id))
    const [sigorta] = d.karsitaraf_sigorta_id
      ? await db.select().from(sigortaSirketi).where(eq(sigortaSirketi.id, d.karsitaraf_sigorta_id))
      : [null]
    
    sheet.addRow([
      d.dosya_no,
      d.tur,
      d.durum,
      musteri?.ad || '',
      sigorta?.ad || '',
      d.talep_tutari || 0,
      d.created_at,
    ])
  }
  
  sheet.columns = [
    { width: 15 },
    { width: 10 },
    { width: 10 },
    { width: 25 },
    { width: 20 },
    { width: 15 },
    { width: 12 },
  ]
  
  const buffer = await workbook.xlsx.writeBuffer()
  
  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="dosya-listesi.xlsx"',
    },
  })
}