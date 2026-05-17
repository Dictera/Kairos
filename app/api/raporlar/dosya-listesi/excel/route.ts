import ExcelJS from 'exceljs'
import { db } from '@/lib/db'
import { dosya, muvekkil, sigortaSirketi } from '@/lib/schema'
import { inArray } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth-guard'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const authError = await requireAuth()
  if (authError) return authError

  const { searchParams } = new URL(req.url)
  const tur = searchParams.get('tur') as 'STK' | 'Mahkeme' | null
  const durum = searchParams.get('durum') as 'AKTIF' | 'PASIF' | null

  let entries = await db.select().from(dosya)
  if (tur) entries = entries.filter(e => e.tur === tur)
  if (durum) entries = entries.filter(e => e.durum === durum)

  const muvekkilIds = [...new Set(entries.map(e => e.muvekkil_id).filter(Boolean))]
  const sigortaIds = [...new Set(entries.map(e => e.karsitaraf_sigorta_id).filter((id): id is number => id != null))]

  const [muvekkilRows, sigortaRows] = await Promise.all([
    muvekkilIds.length ? db.select().from(muvekkil).where(inArray(muvekkil.id, muvekkilIds)) : [],
    sigortaIds.length ? db.select().from(sigortaSirketi).where(inArray(sigortaSirketi.id, sigortaIds)) : [],
  ])

  const muvekkilMap = Object.fromEntries(muvekkilRows.map(m => [m.id, m]))
  const sigortaMap = Object.fromEntries(sigortaRows.map(s => [s.id, s]))

  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Dosya Listesi')

  sheet.addRow(['Dosya No', 'Tür', 'Durum', 'Müşteri', 'Karşı Sigorta', 'Talep Tutarı', 'Oluşturulma'])

  for (const d of entries) {
    sheet.addRow([
      d.dosya_no,
      d.tur,
      d.durum,
      muvekkilMap[d.muvekkil_id]?.ad || '',
      d.karsitaraf_sigorta_id ? (sigortaMap[d.karsitaraf_sigorta_id]?.ad || '') : '',
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
