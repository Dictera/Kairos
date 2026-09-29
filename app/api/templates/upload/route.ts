import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'
import { declaredBodyTooLarge, matchesSignature, readFormData } from '@/lib/file-transfer'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

const ALLOWED_EXTENSIONS = ['.docx'] as const
const ALLOWED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const
const MAX_SIZE = 10 * 1024 * 1024 // 10 MB (CONTEXT discretion)
const SIZE_ERROR = "Dosya boyutu 10 MB'ı aşamaz"
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'templates') // D-04

export async function POST(request: NextRequest) {
  const authError = await requireAuth()
  if (authError) return authError

  // Reject before buffering the body when the client already says it is too big.
  if (declaredBodyTooLarge(request, MAX_SIZE)) {
    return NextResponse.json({ error: SIZE_ERROR }, { status: 413 })
  }

  const formData = await readFormData(request)
  const file = formData?.get('file')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Eksik veri' }, { status: 400 })
  }

  // Validate extension AND MIME (defense in depth — spoofing mitigation)
  const ext = path.extname(file.name).toLowerCase()
  if (!ALLOWED_EXTENSIONS.includes(ext as (typeof ALLOWED_EXTENSIONS)[number])) {
    return NextResponse.json({ error: 'Sadece .docx dosyaları kabul edilir' }, { status: 400 })
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
    return NextResponse.json({ error: 'Sadece .docx dosyaları kabul edilir' }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: SIZE_ERROR }, { status: 400 })
  }

  // Both checks above are client claims; a .docx is a ZIP container.
  const buffer = Buffer.from(await file.arrayBuffer())
  if (!matchesSignature(buffer, file.type)) {
    return NextResponse.json({ error: 'Dosya geçerli bir .docx değil' }, { status: 400 })
  }

  await fs.promises.mkdir(UPLOAD_DIR, { recursive: true })

  // Path-traversal guard — sanitize filename, then verify resolved path is inside base.
  const sanitized = path.basename(file.name).replace(/[^a-zA-Z0-9._-]/g, '_')
  const filename = `${Date.now()}_${sanitized}`
  const filePath = path.join(UPLOAD_DIR, filename)

  const basePath = path.resolve(UPLOAD_DIR)
  if (!path.resolve(filePath).startsWith(basePath + path.sep)) {
    return NextResponse.json({ error: 'Geçersiz dosya yolu' }, { status: 400 })
  }

  await fs.promises.writeFile(filePath, buffer)

  return NextResponse.json({
    filename,
    fileSize: file.size,
    fileName: file.name,
  })
}
