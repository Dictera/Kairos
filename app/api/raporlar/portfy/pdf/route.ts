import { db } from '@/lib/db'
import { dosya } from '@/lib/schema'
import { requireAuth } from '@/lib/auth-guard'
import { connection } from 'next/server'
import type { TDocumentDefinitions } from 'pdfmake/interfaces'
import { generatePdfBuffer, pdfResponse } from '@/lib/pdf-report'

export const dynamic = 'force-dynamic'

export async function GET() {
  await connection()
  const authError = await requireAuth()
  if (authError) return authError

  const allDosya = await db.select().from(dosya)

  const aktifCount = allDosya.filter((d) => d.durum === 'AKTIF').length
  const pasifCount = allDosya.filter((d) => d.durum === 'PASIF').length
  const stkCount = allDosya.filter((d) => d.tur === 'STK').length
  const mahkemeCount = allDosya.filter((d) => d.tur === 'Mahkeme').length

  const docDefinition: TDocumentDefinitions = {
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

  return pdfResponse(pdfBuffer, 'portfoy-raporu.pdf')
}
