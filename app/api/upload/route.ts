import { NextRequest, NextResponse } from 'next/server'
import { connection } from 'next/server'
import { db } from '@/lib/db'
import { belge, BELGE_KATEGORILER, dosya } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { buildBelgelerDir, BELGELER_BASE, isInsideDir } from '@/lib/belgeler-storage'
import { requireAuth } from '@/lib/auth-guard'
import { logOlayTx } from '@/lib/trpc/routers/olay'
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
const MAX_SIZE = 10 * 1024 * 1024 // 10 MB
const SIZE_ERROR = "Dosya boyutu 10 MB'ı aşamaz"

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
  const kategori = BELGE_KATEGORILER.find((k) => k === formData.get('kategori'))

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Eksik veri' }, { status: 400 })
  }

  if (!kategori) {
    return NextResponse.json({ error: 'Geçersiz kategori' }, { status: 400 })
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

  // The extension decides the Content-Type the file is served with later, so it
  // must agree with the verified content type; file.name itself is never used
  // as a path.
  let ext = path.extname(file.name).toLowerCase()
  if (MIME_FOR_EXTENSION[ext] !== file.type) ext = EXTENSION_FOR_MIME[file.type]

  const timestamp = Date.now()
  const safeKategori = kategori.replace(/[^a-zA-Z0-9ÇçĞğıİÖöŞşÜü\s-]/g, '').trim()
  const dosya_adi = `${safeKategori}${ext}`
  let filename = `${timestamp}-${dosya_adi}`

  let filePath = path.join(uploadDir, filename)
  if (!isInsideDir(uploadDir, filePath)) {
    return NextResponse.json({ error: 'Geçersiz dosya adı' }, { status: 400 })
  }

  // 'wx' never overwrites: two uploads in the same millisecond with the same
  // name must not clobber each other.
  try {
    await fs.promises.writeFile(filePath, buffer, { flag: 'wx' })
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'EEXIST') throw err
    filename = `${timestamp}-${randomUUID().slice(0, 8)}-${dosya_adi}`
    filePath = path.join(uploadDir, filename)
    await fs.promises.writeFile(filePath, buffer, { flag: 'wx' })
  }

  // The belge row is created here, in the same request as the file, so a
  // failed insert can remove the file instead of leaving it orphaned on disk.
  try {
    const row = db.transaction((tx) => {
      const inserted = tx
        .insert(belge)
        .values({
          dosya_id: dosyaId,
          dosya_no: dosyaRow.dosya_no,
          kategori,
          dosya_adi,
          dosya_yolu: `/api/files/${dosyaId}/${filename}`,
          dosya_boyutu: file.size,
          mime_tur: file.type,
        })
        .returning()
        .get()
      logOlayTx(tx, dosyaId, 'belge_eklendi', `Belge eklendi: ${dosya_adi}`)
      return inserted
    })
    return NextResponse.json(row)
  } catch (err) {
    await fs.promises.unlink(filePath).catch(() => {})
    console.error('[upload] belge kaydı oluşturulamadı:', err)
    return NextResponse.json({ error: 'Belge kaydedilemedi' }, { status: 500 })
  }
}
