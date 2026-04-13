import pdfmake from 'pdfmake/build/pdfmake'
import vfsFonts from 'pdfmake/build/vfs_fonts'
import path from 'path'
import fs from 'fs'

// Initialize pdfmake with built-in Roboto fonts
Object.keys(vfsFonts).forEach(key => {
  pdfmake.virtualfs.storage[key] = Buffer.from(vfsFonts[key], 'base64')
})

// Add Arial fonts (supports all Turkish characters: ş ğ ü ö ç ı İ)
// Located in C:\Windows\Fonts\ on Windows
function getArialFonts() {
  const windir = process.env.WINDIR || 'C:\\Windows'
  return {
    Arial: {
      normal: path.join(windir, 'Fonts', 'arial.ttf'),
      bold: path.join(windir, 'Fonts', 'arialbd.ttf'),
      italics: path.join(windir, 'Fonts', 'ariali.ttf'),
      bolditalics: path.join(windir, 'Fonts', 'arialbi.ttf'),
    },
  }
}

// Add Arial to vfs
const arialFonts = getArialFonts()
pdfmake.virtualfs.storage['Arial-Regular.ttf'] = fs.readFileSync(arialFonts.Arial.normal)
pdfmake.virtualfs.storage['Arial-Bold.ttf'] = fs.readFileSync(arialFonts.Arial.bold)
pdfmake.virtualfs.storage['Arial-Italic.ttf'] = fs.readFileSync(arialFonts.Arial.italics)
pdfmake.virtualfs.storage['Arial-BoldItalic.ttf'] = fs.readFileSync(arialFonts.Arial.bolditalics)

// Register fonts with pdfmake
pdfmake.setFonts({
  ...pdfmake.fonts,
  Arial: {
    normal: 'Arial-Regular.ttf',
    bold: 'Arial-Bold.ttf',
    italics: 'Arial-Italic.ttf',
    bolditalics: 'Arial-BoldItalic.ttf',
  },
})

export type PetitionDocDefinition = {
  title: string
  body: string
  variables: Record<string, string>
}

export async function generatePdfBuffer(docDefinition: any): Promise<Buffer> {
  const pdfDoc = pdfmake.createPdf(docDefinition)
  return pdfDoc.getBuffer() as Promise<Buffer>
}

/**
 * Converts simple HTML from Tiptap to pdfmake content array.
 * Handles: <p>, <strong>, <em>, <u>, <ul>, <ol>, <li>, <h1>, <h2>, <br>
 * Strips all other HTML tags.
 */
export function htmlToPdfmakeContent(html: string): any[] {
  const text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '') // Strip remaining tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim()
  
  return text.split('\n\n').filter(p => p.trim()).map(para => ({
    text: para.trim(),
    font: 'Arial',
  }))
}

/**
 * Builds a pdfmake document from HTML content (Tiptap output).
 * Supports simple HTML tags: p, strong, em, u, ul, ol, li, h1-h6, br
 */
export function buildPetitionDoc(htmlContent: string, title?: string): any {
  const content = htmlToPdfmakeContent(htmlContent)
  
  return {
    content: [
      ...(title ? [{ text: title, font: 'Arial', bold: true, fontSize: 16, margin: [0, 0, 0, 20] as [number,number,number,number] }] : []),
      ...content,
    ],
    defaultStyle: {
      font: 'Arial',
      fontSize: 12,
      lineHeight: 1.4,
    },
    pageSize: 'A4',
    pageMargins: [72, 72, 72, 72] as [number,number,number,number],
  }
}