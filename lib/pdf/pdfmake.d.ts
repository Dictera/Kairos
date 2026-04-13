declare module 'pdfmake/build/pdfmake' {
  interface PdfmakeExtended {
    virtualfs: {
      storage: Record<string, Buffer | Uint8Array>
    }
    fonts: Record<string, any>
    setFonts(fonts: Record<string, any>): void
    createPdf(docDefinition: any): any
  }
  const pdfmake: PdfmakeExtended
  export = pdfmake
}

declare module 'pdfmake/build/vfs_fonts' {
  const vfsFonts: Record<string, string>
  export = vfsFonts
}
