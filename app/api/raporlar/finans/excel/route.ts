import ExcelJS from 'exceljs'
import { db } from '@/lib/db'
import { finans_kalemi, dosya, muvekkil } from '@/lib/schema'
import { eq, inArray } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth-guard'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const authError = await requireAuth()
  if (authError) return authError

  const entries = await db.select().from(finans_kalemi)

  const dosyaIds = [...new Set(entries.map(e => e.dosya_id).filter(Boolean))]
  const dosyaRows = dosyaIds.length
    ? await db.select().from(dosya).where(inArray(dosya.id, dosyaIds))
    : []
  const muvekkilIds = [...new Set(dosyaRows.map(d => d.muvekkil_id).filter(Boolean))]
  const muvekkilRows = muvekkilIds.length
    ? await db.select().from(muvekkil).where(inArray(muvekkil.id, muvekkilIds))
    : []

  const dosyaMap = Object.fromEntries(dosyaRows.map(d => [d.id, d]))
  const muvekkilMap = Object.fromEntries(muvekkilRows.map(m => [m.id, m]))

  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Finansal Rapor')

  sheet.addRow(['Tarih', 'Tür', 'Tutar', 'Açıklama', 'Dosya No', 'Müşteri'])

  for (const entry of entries) {
    const d = dosyaMap[entry.dosya_id]
    const m = d ? muvekkilMap[d.muvekkil_id] : null
    sheet.addRow([
      entry.tarih,
      entry.tur,
      entry.tutar,
      entry.aciklama || '',
      d?.dosya_no || '',
      m?.ad || '',
    ])
  }

  sheet.addRow([])
  sheet.addRow(['Toplam', '', entries.reduce((s, e) => s + (e.tutar || 0), 0)])

  sheet.columns = [
    { width: 12 },
    { width: 10 },
    { width: 15 },
    { width: 30 },
    { width: 15 },
    { width: 25 },
  ]

  const buffer = await workbook.xlsx.writeBuffer()

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="finansal-rapor.xlsx"',
    },
  })
}
