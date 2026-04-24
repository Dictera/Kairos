import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { dosya } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { buildBelgelerDir, BELGELER_BASE } from '@/lib/belgeler-storage'
import fs from 'fs'
import path from 'path'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ dosyaId: string; filename: string }> }
) {
  const { dosyaId: dosyaIdStr, filename } = await params

  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return NextResponse.json({ error: 'Geçersiz dosya adı' }, { status: 400 })
  }

  const dosyaId = parseInt(dosyaIdStr, 10)
  if (isNaN(dosyaId)) {
    return NextResponse.json({ error: 'Geçersiz dosya ID' }, { status: 400 })
  }

  // Look up dosya to compute hierarchical disk path
  const dosyaRow = await db.query.dosya.findFirst({
    where: eq(dosya.id, dosyaId),
    with: {
      muvekkil: true,
      sigortaTuru: true,
    },
  })

  let filePath: string

  if (dosyaRow) {
    const dir = buildBelgelerDir({
      tur: dosyaRow.tur,
      sigortaTuruAd: dosyaRow.sigortaTuru?.ad ?? null,
      muvekkilAd: dosyaRow.muvekkil?.ad ?? null,
      muvekkilPlaka: dosyaRow.muvekkil_plaka,
    })
    filePath = path.join(dir, filename)

    // Fallback to old flat structure for files uploaded before the hierarchy change
    if (!fs.existsSync(filePath)) {
      filePath = path.join(BELGELER_BASE, dosyaIdStr, filename)
    }
  } else {
    filePath = path.join(BELGELER_BASE, dosyaIdStr, filename)
  }

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
