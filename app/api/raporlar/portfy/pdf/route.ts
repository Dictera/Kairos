import { getPortfoyOzet } from '@/lib/portfoy-ozet'
import { requireAuth } from '@/lib/auth-guard'
import { connection } from 'next/server'
import type { TDocumentDefinitions } from 'pdfmake/interfaces'
import { generatePdfBuffer, pdfResponse } from '@/lib/pdf-report'

export const dynamic = 'force-dynamic'

export async function GET() {
  await connection()
  const authError = await requireAuth()
  if (authError) return authError

  const { toplam, aktif, arsiv, turler } = await getPortfoyOzet()

  const docDefinition: TDocumentDefinitions = {
    content: [
      { text: 'PORTFÖY RAPORU', font: 'Roboto', bold: true, fontSize: 18, margin: [0, 0, 0, 20] },
      { text: `Toplam Dosya: ${toplam}`, font: 'Roboto', margin: [0, 0, 0, 5] },
      { text: `Aktif: ${aktif}`, font: 'Roboto', margin: [0, 0, 0, 5] },
      { text: `Arşiv: ${arsiv}`, font: 'Roboto', margin: [0, 0, 0, 20] },
      { text: 'Türe Göre Dağılım:', font: 'Roboto', bold: true, margin: [0, 0, 0, 5] },
      ...turler.map(({ label, adet }) => ({
        text: `${label}: ${adet}`,
        font: 'Roboto',
        margin: [0, 0, 0, 5] as [number, number, number, number],
      })),
    ],
    defaultStyle: {
      font: 'Roboto',
    },
  }

  const pdfBuffer = await generatePdfBuffer(docDefinition)

  return pdfResponse(pdfBuffer, 'portfoy-raporu.pdf')
}
