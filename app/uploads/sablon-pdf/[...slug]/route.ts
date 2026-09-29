import { NextRequest, NextResponse } from 'next/server'
import { connection } from 'next/server'
import path from 'path'
import { ARCHIVE_BASE } from '@/lib/docx/archive'
import { isInsideDir } from '@/lib/belgeler-storage'
import { requireAuth } from '@/lib/auth-guard'
import { fileResponse, MIME_FOR_EXTENSION, statFile } from '@/lib/file-transfer'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  await connection()
  const authError = await requireAuth()
  if (authError) return authError

  const { slug } = await params

  const relativePath = slug.join('/')

  if (relativePath.includes('..')) {
    return NextResponse.json({ error: 'Geçersiz dosya yolu' }, { status: 400 })
  }

  const resolved = path.resolve(ARCHIVE_BASE, relativePath)
  if (!isInsideDir(ARCHIVE_BASE, resolved)) {
    return NextResponse.json({ error: 'Geçersiz dosya yolu' }, { status: 400 })
  }

  const stat = await statFile(resolved)
  if (!stat) {
    return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 404 })
  }

  const ext = path.extname(resolved).toLowerCase()
  return fileResponse(resolved, {
    size: stat.size,
    contentType: MIME_FOR_EXTENSION[ext] || 'application/octet-stream',
    filename: path.basename(resolved),
  })
}
