import { db } from '@/lib/db'
import { dilekceOdtSablonu, dosya, muvekkil } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { extractStyledContentFromOdt, StyledBlock } from '@/lib/services/odt-to-pdf'
import { buildVariableMapFromDosya } from '@/lib/services/degisken-substitution'
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

export async function POST(
  req: Request
) {
  try {
    const { sablonId, dosyaId, customVariables } = await req.json()
    
    if (!sablonId || typeof sablonId !== 'number') {
      return Response.json({ error: 'Geçersiz şablon ID' }, { status: 400 })
    }
    
    const [sablon] = await db.select().from(dilekceOdtSablonu).where(eq(dilekceOdtSablonu.id, sablonId))
    if (!sablon) {
      return Response.json({ error: 'Şablon bulunamadı' }, { status: 404 })
    }
    
    if (!fs.existsSync(sablon.dosya_yolu)) {
      console.error('ODT file not found:', sablon.dosya_yolu)
      return Response.json({ error: 'Şablon dosyası bulunamadı' }, { status: 500 })
    }
    
    let autoVariables: Record<string, string> = {}
    if (dosyaId && typeof dosyaId === 'number') {
      const [dosyaData] = await db.select().from(dosya).where(eq(dosya.id, dosyaId))
      if (dosyaData) {
        const [muvekkilData] = await db.select().from(muvekkil).where(eq(muvekkil.id, dosyaData.muvekkil_id))
        autoVariables = buildVariableMapFromDosya(dosyaData, muvekkilData)
      }
    }
    
    const allVariables = { ...autoVariables, ...customVariables }
    
    const styledBlocks = await extractStyledContentFromOdt(sablon.dosya_yolu, allVariables)
    
    if (!styledBlocks || styledBlocks.length === 0) {
      return Response.json({ error: 'ODT dosyasından içerik okunamadı' }, { status: 500 })
    }
    
    const pdfBuffer = await generatePdfWithPython(styledBlocks, sablon.baslik || 'Dilekçe')
    
    const uint8Array = new Uint8Array(pdfBuffer)
    
    return new Response(uint8Array, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${sablon.baslik.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`,
      },
    })
  } catch (error: any) {
    console.error('ODT to PDF conversion failed:', error)
    return Response.json({ error: error.message || 'PDF oluşturulamadı' }, { status: 500 })
  }
}

async function generatePdfWithPython(styledBlocks: StyledBlock[], title: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), 'scripts', 'pdf_generator.py')
    
    const inputData = JSON.stringify({ blocks: styledBlocks, title }, null, 2)
    const inputFile = path.join(process.cwd(), 'temp_pdf_input.json')
    const outputFile = path.join(process.cwd(), 'temp_pdf_output.pdf')
    
    fs.writeFileSync(inputFile, inputData, 'utf-8')
    
    const python = spawn('python', [scriptPath, inputFile, outputFile], {
      stdio: ['pipe', 'pipe', 'pipe']
    })
    
    let stderr = ''
    
    python.stderr.on('data', (data: Buffer) => {
      stderr += data.toString()
    })
    
    python.on('close', (code: number) => {
      try {
        fs.unlinkSync(inputFile)
      } catch {}
      
      if (code !== 0) {
        console.error('Python script error:', stderr)
        try { fs.unlinkSync(outputFile) } catch {}
        reject(new Error(`Python script failed: ${stderr || 'Unknown error'}`))
        return
      }
      
      try {
        const pdfBuffer = fs.readFileSync(outputFile)
        fs.unlinkSync(outputFile)
        resolve(pdfBuffer)
      } catch (readErr) {
        reject(new Error(`Failed to read PDF output: ${readErr}`))
      }
    })
    
    python.on('error', (err: Error) => {
      try { fs.unlinkSync(inputFile) } catch {}
      try { fs.unlinkSync(outputFile) } catch {}
      reject(new Error(`Failed to spawn Python: ${err.message}`))
    })
  })
}
