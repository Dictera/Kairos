import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { ARCHIVE_BASE } from '@/lib/docx/archive'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params

  const relativePath = slug.join('/')

  if (relativePath.includes('..')) {
    return NextResponse.json({ error: 'Geçersiz dosya yolu' }, { status: 400 })
  }

  const filePath = path.join(ARCHIVE_BASE, relativePath)
  const resolved = path.resolve(filePath)
  const baseResolved = path.resolve(ARCHIVE_BASE)
  const rel = path.relative(baseResolved, resolved)

  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    return NextResponse.json({ error: 'Geçersiz dosya yolu' }, { status: 400 })
  }

  if (!fs.existsSync(resolved)) {
    return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 404 })
  }

  const stat = fs.statSync(resolved)
  if (!stat.isFile()) {
    return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 404 })
  }

  const file = fs.readFileSync(resolved)
  const ext = path.extname(resolved).toLowerCase()

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
      'Content-Disposition': `inline; filename="${path.basename(resolved)}"`,
      'Content-Length': String(stat.size),
    },
  })
}