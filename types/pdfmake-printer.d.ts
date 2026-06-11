// @types/pdfmake only covers the browser API (createPdf). The server-side
// PdfPrinter class lives at pdfmake/js/Printer — declare its minimal shape here.
declare module 'pdfmake/js/Printer' {
  interface PdfPrinterFontDescriptor {
    normal?: string
    bold?: string
    italics?: string
    bolditalics?: string
  }

  interface PdfKitDocument {
    on(event: 'data', cb: (chunk: Buffer) => void): void
    on(event: 'end', cb: () => void): void
    end(): void
  }

  export default class PdfPrinter {
    constructor(fonts: Record<string, PdfPrinterFontDescriptor>)
    createPdfKitDocument(docDefinition: unknown): PdfKitDocument
  }
}
