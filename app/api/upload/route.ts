import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
]
const MAX_SIZE = 20 * 1024 * 1024 // 20 MB
const BASE_PATH = 'E:/sigorta-belgeler'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const dosyaId = formData.get('dosyaId') as string | null
  const dosyaNo = formData.get('dosyaNo') as string | null

  if (!file || !dosyaId) {
    return NextResponse.json({ error: 'Eksik veri' }, { status: 400 })
  }

  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'İzin verilmeyen dosya türü' }, { status: 400 })
  }

  // Validate file size
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Dosya boyutu 20 MB\'ı aşamaz' }, { status: 400 })
  }

  // Create directory if not exists
  const uploadDir = path.join(BASE_PATH, dosyaId)
  fs.mkdirSync(uploadDir, { recursive: true })

  // Generate unique filename: timestamp + lowercase normalized original
  const timestamp = Date.now()
  const normalizedName = file.name.toLowerCase().replace(/\s+/g, '-')
  const filename = `${timestamp}-${normalizedName}`
  const filePath = path.join(uploadDir, filename)

  // Write file to E: drive
  const buffer = Buffer.from(await file.arrayBuffer())
  fs.writeFileSync(filePath, buffer)

  // Return file metadata for tRPC mutation
  return NextResponse.json({
    filename,
    dosya_yolu: `/api/files/${dosyaId}/${filename}`,
    dosya_boyutu: file.size,
    mime_tur: file.type,
    dosya_adi: file.name, // original name preserved
  })
}
