import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const BASE_PATH = 'E:/sigorta-belgeler'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dosyaId: string; filename: string }> }
) {
  const { dosyaId, filename } = await params
  
  // Security: prevent path traversal by checking filename
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return NextResponse.json({ error: 'Geçersiz dosya adı' }, { status: 400 })
  }
  
  const filePath = path.join(BASE_PATH, dosyaId, filename)
  
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 404 })
  }
  
  const file = fs.readFileSync(filePath)
  const ext = path.extname(filename).toLowerCase()
  
  const mimeTypes: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
  }
  
  return new NextResponse(file, {
    headers: { 
      'Content-Type': mimeTypes[ext] || 'application/octet-stream',
      'Content-Disposition': `inline; filename="${filename}"`,
    },
  })
}
