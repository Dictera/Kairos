import path from 'path'
import pdfmake from 'pdfmake'
import type { TDocumentDefinitions } from 'pdfmake/interfaces'

// Server-side PDF generation for the report routes (app/api/raporlar/*/pdf).
//
// The Roboto TTFs shipped with pdfmake are embedded: PDF standard fonts such
// as Helvetica only cover WinAnsi and garble İ, ı, Ş, ş, Ğ, ğ.
const FONT_DIR = path.join(process.cwd(), 'node_modules', 'pdfmake', 'fonts', 'Roboto')
const FONT_FILES = {
  normal: path.join(FONT_DIR, 'Roboto-Regular.ttf'),
  bold: path.join(FONT_DIR, 'Roboto-Medium.ttf'),
  italics: path.join(FONT_DIR, 'Roboto-Italic.ttf'),
  bolditalics: path.join(FONT_DIR, 'Roboto-MediumItalic.ttf'),
}
const ALLOWED_FILES = new Set(Object.values(FONT_FILES))

pdfmake.setFonts({ Roboto: FONT_FILES })
// Documents only hold our own text: never fetch URLs, and read no local
// files other than the fonts above.
pdfmake.setUrlAccessPolicy(() => false)
pdfmake.setLocalAccessPolicy((p) => ALLOWED_FILES.has(path.resolve(p)))

export function generatePdfBuffer(docDefinition: TDocumentDefinitions): Promise<Buffer> {
  return pdfmake
    .createPdf({
      ...docDefinition,
      defaultStyle: { font: 'Roboto', ...docDefinition.defaultStyle },
    })
    .getBuffer()
}

export function pdfResponse(buffer: Buffer, filename: string): Response {
  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
