import { jsPDF } from 'jspdf'

export type PetitionDocDefinition = {
  title: string
  body: string
  variables: Record<string, string>
}

// Legacy pdfmake-style doc definition for backwards compatibility
export type LegacyDocDefinition = {
  content: any[]
  defaultStyle?: {
    font?: string
    fontSize?: number
  }
}

/**
 * Generates a PDF buffer from text content using jspdf.
 * jspdf has proper Unicode/Turkish character support.
 */
export async function generatePdfBuffer(docDefinition: PetitionDocDefinition | LegacyDocDefinition): Promise<Buffer> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  // Check if this is a legacy pdfmake-style document
  if ('content' in docDefinition && Array.isArray(docDefinition.content)) {
    // Legacy pdfmake-style document
    doc.setFont('helvetica')
    
    let y = 20
    for (const item of docDefinition.content) {
      if (item.bold) {
        doc.setFont('helvetica', 'bold')
      } else {
        doc.setFont('helvetica', 'normal')
      }
      if (item.fontSize) {
        doc.setFontSize(item.fontSize)
      } else {
        doc.setFontSize(12)
      }
      
      const text = item.text || ''
      const lines = doc.splitTextToSize(text, 170)
      const marginLeft = item.margin?.[0] || 20
      doc.text(lines, marginLeft, y)
      y += lines.length * 6 + (item.margin?.[1] || 5)
    }
  } else {
    // New jspdf-style document - cast to PetitionDocDefinition
    const newStyleDef = docDefinition as PetitionDocDefinition
    doc.setFont('helvetica')

    // Add title if present
    if (newStyleDef.title) {
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      const titleLines = doc.splitTextToSize(newStyleDef.title, 170)
      doc.text(titleLines, 20, 20)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(12)
    }

    // Add body text
    doc.setFontSize(12)
    const bodyLines = doc.splitTextToSize(newStyleDef.body, 170)
    doc.text(bodyLines, 20, newStyleDef.title ? 35 : 20)
  }

  // Return the PDF as a Buffer
  const pdfOutput = doc.output('arraybuffer')
  return Buffer.from(pdfOutput)
}

/**
 * Converts HTML content to plain text for PDF generation
 */
export function htmlToPdfmakeContent(html: string): string {
  const text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim()

  return text.split('\n\n').filter(p => p.trim()).join('\n\n')
}

/**
 * Builds a petition document definition from HTML content
 */
export function buildPetitionDoc(htmlContent: string, title?: string): PetitionDocDefinition {
  const body = htmlToPdfmakeContent(htmlContent)
  
  return {
    title: title || '',
    body,
    variables: {},
  }
}
