import { NextRequest, NextResponse } from 'next/server'
import { connection } from 'next/server'
import { db } from '@/lib/db'
import { dosya } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import {
  buildBelgelerDir,
  BELGELER_BASE,
  isInsideDir,
  sanitizeFsSegment,
} from '@/lib/belgeler-storage'
import { requireAuth } from '@/lib/auth-guard'
import {
  declaredBodyTooLarge,
  EXTENSION_FOR_MIME,
  matchesSignature,
  MIME_FOR_EXTENSION,
  readFormData,
} from '@/lib/file-transfer'
import { randomUUID } from 'crypto'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
]
const MAX_SIZE = 20 * 1024 * 1024 // 20 MB
const SIZE_ERROR = "Dosya boyutu 20 MB'ı aşamaz"

export async function POST(request: NextRequest) {
  await connection()
  const authError = await requireAuth()
  if (authError) return authError

  // Reject before buffering the body when the client already says it is too big.
  if (declaredBodyTooLarge(request, MAX_SIZE)) {
    return NextResponse.json({ error: SIZE_ERROR }, { status: 413 })
  }

  const formData = await readFormData(request)
  if (!formData) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 })
  }
  const file = formData.get('file')
  const dosyaIdRaw = formData.get('dosyaId')
  const dosyaId = typeof dosyaIdRaw === 'string' ? Number(dosyaIdRaw) : NaN
  const dosyaNo = formData.get('dosyaNo')
  const kategori = formData.get('kategori')

  if (!(file instanceof File) || typeof dosyaNo !== 'string' || !dosyaNo) {
    return NextResponse.json({ error: 'Eksik veri' }, { status: 400 })
  }

  if (!Number.isSafeInteger(dosyaId) || dosyaId <= 0) {
    return NextResponse.json({ error: 'Geçersiz dosya ID' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'İzin verilmeyen dosya türü' }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: SIZE_ERROR }, { status: 400 })
  }

  // file.type is only the browser's guess from the extension — check the content.
  const buffer = Buffer.from(await file.arrayBuffer())
  if (!matchesSignature(buffer, file.type)) {
    return NextResponse.json(
      { error: 'Dosya içeriği bildirilen dosya türüyle uyuşmuyor' },
      { status: 400 },
    )
  }

  // Look up dosya to build hierarchical directory
  const dosyaRow = await db.query.dosya.findFirst({
    where: eq(dosya.id, dosyaId),
    with: {
      muvekkil: true,
      sigortaTuru: true,
    },
  })

  if (!dosyaRow) {
    return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 404 })
  }

  const uploadDir = buildBelgelerDir({
    tur: dosyaRow.tur,
    sigortaTuruAd: dosyaRow.sigortaTuru?.ad ?? null,
    muvekkilAd: dosyaRow.muvekkil
      ? `${dosyaRow.muvekkil.ad} ${dosyaRow.muvekkil.soyad}`.trim()
      : null,
    muvekkilPlaka: dosyaRow.muvekkil_plaka,
  })

  // Verify resolved dir stays within BELGELER_BASE
  if (!isInsideDir(BELGELER_BASE, uploadDir)) {
    return NextResponse.json({ error: 'Geçersiz dizin' }, { status: 400 })
  }

  await fs.promises.mkdir(uploadDir, { recursive: true })

  const timestamp = Date.now()
  // file.name is client-controlled and may carry path segments ("../../x") —
  // keep only the final segment and strip unsafe characters.
  let originalName = sanitizeFsSegment(path.basename(file.name.replace(/\\/g, '/')))
  // The extension decides the Content-Type the file is served with later, so it
  // must agree with the verified content type.
  let ext = path.extname(originalName).toLowerCase()
  if (MIME_FOR_EXTENSION[ext] !== file.type) {
    ext = EXTENSION_FOR_MIME[file.type]
    originalName = `${path.basename(originalName, path.extname(originalName))}${ext}`
  }

  let filename: string
  let dosya_adi: string

  const safeKategori =
    typeof kategori === 'string' ? kategori.replace(/[^a-zA-Z0-9ÇçĞğıİÖöŞşÜü\s-]/g, '').trim() : ''
  if (safeKategori) {
    filename = `${timestamp}-${safeKategori}${ext}`
    dosya_adi = `${safeKategori}${ext}`
  } else {
    const normalizedName = originalName.toLowerCase().replace(/\s+/g, '-')
    filename = `${timestamp}-${normalizedName}`
    dosya_adi = originalName
  }

  const filePath = path.join(uploadDir, filename)
  if (!isInsideDir(uploadDir, filePath)) {
    return NextResponse.json({ error: 'Geçersiz dosya adı' }, { status: 400 })
  }

  // 'wx' never overwrites: two uploads in the same millisecond with the same
  // name must not clobber each other.
  try {
    await fs.promises.writeFile(filePath, buffer, { flag: 'wx' })
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'EEXIST') throw err
    filename = `${timestamp}-${randomUUID().slice(0, 8)}-${filename.slice(String(timestamp).length + 1)}`
    await fs.promises.writeFile(path.join(uploadDir, filename), buffer, { flag: 'wx' })
  }

  return NextResponse.json({
    filename,
    dosya_yolu: `/api/files/${dosyaId}/${filename}`,
    dosya_boyutu: file.size,
    mime_tur: file.type,
    dosya_adi,
  })
}
