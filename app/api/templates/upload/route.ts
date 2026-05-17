import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'
import fs from 'fs'
import path from 'path'

const ALLOWED_EXTENSIONS = ['.docx'] as const
const ALLOWED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const
const MAX_SIZE = 10 * 1024 * 1024 // 10 MB (CONTEXT discretion)
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'templates') // D-04

export async function POST(request: NextRequest) {
  const authError = await requireAuth()
  if (authError) return authError

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'Eksik veri' }, { status: 400 })
  }

  // Validate extension AND MIME (defense in depth — spoofing mitigation)
  const ext = path.extname(file.name).toLowerCase()
  if (!ALLOWED_EXTENSIONS.includes(ext as typeof ALLOWED_EXTENSIONS[number])) {
    return NextResponse.json(
      { error: 'Sadece .docx dosyaları kabul edilir' },
      { status: 400 },
    )
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type as typeof ALLOWED_MIME_TYPES[number])) {
    return NextResponse.json(
      { error: 'Sadece .docx dosyaları kabul edilir' },
      { status: 400 },
    )
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "Dosya boyutu 10 MB'ı aşamaz" },
      { status: 400 },
    )
  }

  // Ensure upload directory exists.
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true })
  }

  // Path-traversal guard — sanitize filename, then verify resolved path is inside base.
  const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const filename = `${Date.now()}_${sanitized}`
  const filePath = path.join(UPLOAD_DIR, filename)

  const basePath = path.resolve(UPLOAD_DIR)
  if (!path.resolve(filePath).startsWith(basePath)) {
    return NextResponse.json({ error: 'Geçersiz dosya yolu' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  fs.writeFileSync(filePath, buffer)

  return NextResponse.json({
    filename,
    fileSize: file.size,
    fileName: file.name,
  })
}
