import { db } from '@/lib/db'
import { dilekceSablonu, dosya, muvekkil } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { buildPetitionDoc, generatePdfBuffer } from '@/lib/pdf/pdf-generator'
import { substituteVariables, buildVariableMapFromDosya } from '@/lib/services/degisken-substitution'

export async function POST(
  req: Request
) {
  const { sablonId, dosyaId, customVariables } = await req.json()
  
  // 1. Fetch template
  const [sablon] = await db.select().from(dilekceSablonu).where(eq(dilekceSablonu.id, sablonId))
  if (!sablon) {
    return Response.json({ error: 'Şablon bulunamadı' }, { status: 404 })
  }
  
  // 2. Fetch case data
  const [dosyaData] = await db.select().from(dosya).where(eq(dosya.id, dosyaId))
  if (!dosyaData) {
    return Response.json({ error: 'Dosya bulunamadı' }, { status: 404 })
  }
  
  // 3. Fetch muvekkil
  const [muvekkilData] = await db.select().from(muvekkil).where(eq(muvekkil.id, dosyaData.muvekkil_id))
  
  // 4. Build variable map from case data
  const autoVariables = buildVariableMapFromDosya(dosyaData, muvekkilData)
  
  // 5. Merge with custom variables (custom overrides auto)
  const allVariables = { ...autoVariables, ...customVariables }
  
  // 6. Substitute variables in template content
  const filledContent = substituteVariables(sablon.icerik, allVariables)
  
  // 7. Build PDF document
  const docDefinition = buildPetitionDoc(filledContent, sablon.baslik)
  
  // 8. Generate PDF buffer
  const pdfBuffer = await generatePdfBuffer(docDefinition)
  
  // Return PDF as binary
  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${sablon.baslik.replace(/[^a-zA-Z0-9şğüöçıİŞĞÜÖÇ]/g, '_')}.pdf"`,
    },
  })
}