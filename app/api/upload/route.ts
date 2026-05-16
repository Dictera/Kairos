import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { dosya } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { buildBelgelerDir, BELGELER_BASE } from '@/lib/belgeler-storage'
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

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const dosyaIdRaw = formData.get('dosyaId') as string | null
  const dosyaId = parseInt(dosyaIdRaw ?? '', 10)
  const dosyaNo = formData.get('dosyaNo') as string | null
  const kategori = formData.get('kategori') as string | null

  if (!file || !dosyaNo) {
    return NextResponse.json({ error: 'Eksik veri' }, { status: 400 })
  }

  if (isNaN(dosyaId)) {
    return NextResponse.json({ error: 'Geçersiz dosya ID' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'İzin verilmeyen dosya türü' }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Dosya boyutu 20 MB\'ı aşamaz' }, { status: 400 })
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
  if (!path.resolve(uploadDir).startsWith(path.resolve(BELGELER_BASE))) {
    return NextResponse.json({ error: 'Geçersiz dizin' }, { status: 400 })
  }

  fs.mkdirSync(uploadDir, { recursive: true })

  const timestamp = Date.now()
  const ext = path.extname(file.name)

  let filename: string
  let dosya_adi: string

  if (kategori) {
    const safeKategori = kategori.replace(/[^a-zA-Z0-9ÇçĞğıİÖöŞşÜü\s-]/g, '').trim()
    filename = `${timestamp}-${safeKategori}${ext}`
    dosya_adi = `${safeKategori}${ext}`
  } else {
    const normalizedName = file.name.toLowerCase().replace(/\s+/g, '-')
    filename = `${timestamp}-${normalizedName}`
    dosya_adi = file.name
  }

  const filePath = path.join(uploadDir, filename)
  const buffer = Buffer.from(await file.arrayBuffer())
  fs.writeFileSync(filePath, buffer)

  return NextResponse.json({
    filename,
    dosya_yolu: `/api/files/${dosyaId}/${filename}`,
    dosya_boyutu: file.size,
    mime_tur: file.type,
    dosya_adi,
  })
}
