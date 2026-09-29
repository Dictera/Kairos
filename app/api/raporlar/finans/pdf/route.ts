import { getFinansOzet } from '@/lib/finans-ozet'
import { requireAuth } from '@/lib/auth-guard'
import { connection } from 'next/server'
import type { TDocumentDefinitions } from 'pdfmake/interfaces'
import { generatePdfBuffer, pdfResponse } from '@/lib/pdf-report'

export const dynamic = 'force-dynamic'

export async function GET() {
  await connection()
  const authError = await requireAuth()
  if (authError) return authError

  const { gelen, giden, masraf, son30Gun } = await getFinansOzet()

  const docDefinition: TDocumentDefinitions = {
    content: [
      { text: 'FİNANSAL RAPOR', font: 'Roboto', bold: true, fontSize: 18, margin: [0, 0, 0, 20] },
      {
        text: `Toplam Gelen: ${gelen.toLocaleString('tr-TR')} TL`,
        font: 'Roboto',
        margin: [0, 0, 0, 5],
      },
      {
        text: `Toplam Giden: ${giden.toLocaleString('tr-TR')} TL`,
        font: 'Roboto',
        margin: [0, 0, 0, 5],
      },
      {
        text: `Toplam Masraf: ${masraf.toLocaleString('tr-TR')} TL`,
        font: 'Roboto',
        margin: [0, 0, 0, 5],
      },
      {
        text: `Net: ${(gelen - giden - masraf).toLocaleString('tr-TR')} TL`,
        font: 'Roboto',
        margin: [0, 0, 0, 20],
      },
      { text: `Son 30 Gün İşlem Sayısı: ${son30Gun}`, font: 'Roboto' },
    ],
    defaultStyle: {
      font: 'Roboto',
    },
  }

  const pdfBuffer = await generatePdfBuffer(docDefinition)

  return pdfResponse(pdfBuffer, 'finansal-rapor.pdf')
}
