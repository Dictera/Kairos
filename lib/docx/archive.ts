import path from 'path'
import fs from 'fs'
import { randomUUID } from 'crypto'
import { db } from '@/lib/db'
import { belge, olayGunlugu } from '@/lib/schema'
import { sql } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'
import { runSidecarCommand } from '@/lib/services/docx-pipeline'

export const ARCHIVE_BASE = path.resolve(process.cwd(), 'uploads', 'sablon-pdf')

const RESERVED_WINDOWS_NAMES = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i

export function isReservedWindowsName(name: string): boolean {
  return RESERVED_WINDOWS_NAMES.test(name)
}

export function safeUnlinkArchive(filePath: string): void {
  try {
    const resolved = path.resolve(filePath)
    const baseResolved = path.resolve(ARCHIVE_BASE)
    const rel = path.relative(baseResolved, resolved)
    if (rel.startsWith('..') || path.isAbsolute(rel)) {
      // Path traversal attempt
      return
    }
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  } catch (e) {
    // Failed to delete file from disk
  }
}

export function buildArchivePath(
  date: Date,
  kategoriSlug: string,
  muvekkilSlug: string,
  plakaSlug: string | null
): { dir: string; filePath: string; relativePath: string; fileName: string } {
  const year = String(date.getFullYear())
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const dir = path.join(ARCHIVE_BASE, year, month, kategoriSlug)

  // Reject path traversal attempts early (defense in depth)
  for (const segment of [kategoriSlug, muvekkilSlug, plakaSlug ?? '']) {
    if (segment.includes('..')) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Geçersiz arşiv yolu: dizin geçişi tespit edildi.',
      })
    }
  }

  let baseName = plakaSlug ? `${muvekkilSlug}-${plakaSlug}` : muvekkilSlug
  if (isReservedWindowsName(baseName)) {
    baseName = `${baseName}-belge`
  }

  const fileName = `${baseName}-${randomUUID().slice(0, 8)}.pdf`
  const filePath = path.join(dir, fileName)

  // Use path.relative approach for robust path traversal check
  const resolved = path.resolve(filePath)
  const baseResolved = path.resolve(ARCHIVE_BASE)
  const rel = path.relative(baseResolved, resolved)
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Geçersiz arşiv yolu: dizin geçişi tespit edildi.',
    })
  }

  const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/')

  return { dir, filePath, relativePath, fileName }
}

export async function generateSlugs(
  muvekkilAd: string | null,
  dosyaNo: string,
  plaka: string | null
): Promise<{ muvekkilSlug: string; plakaSlug: string | null }> {
  const muvekkilResult = await runSidecarCommand({
    command: 'slug',
    params: { text: muvekkilAd || `dosya-${dosyaNo}` },
  })

  if (muvekkilResult.status === 'error') {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Slug oluşturulamadı: ${muvekkilResult.message}`,
    })
  }

  const muvekkilSlug = String((muvekkilResult.result as { slug?: string })?.slug ?? '')
  if (!muvekkilSlug) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Müvekkil slug boş döndü.',
    })
  }

  let plakaSlug: string | null = null
  if (plaka && plaka.trim().length > 0) {
    const plakaResult = await runSidecarCommand({
      command: 'slug',
      params: { text: plaka },
    })

    if (plakaResult.status === 'error') {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Slug oluşturulamadı: ${plakaResult.message}`,
      })
    }

    plakaSlug = String((plakaResult.result as { slug?: string })?.slug ?? '')
    if (!plakaSlug) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Plaka slug boş döndü.',
      })
    }
  }

  return { muvekkilSlug, plakaSlug }
}

export async function archivePdfAndCreateBelge(
  tempPdfPath: string,
  dosyaId: number,
  dosyaNo: string,
  sablonId: number,
  sablonAdi: string,
  belgeTuru: string,
  muvekkilSlug: string,
  plakaSlug: string | null,
  kategoriSlug: string
) {
  const now = new Date()
  const { dir, filePath, relativePath, fileName } = buildArchivePath(
    now,
    kategoriSlug,
    muvekkilSlug,
    plakaSlug
  )

  fs.mkdirSync(dir, { recursive: true })

  try {
    fs.renameSync(tempPdfPath, filePath)
  } catch (error) {
    const err = error as NodeJS.ErrnoException
    if (err.code === 'EXDEV') {
      try {
        fs.copyFileSync(tempPdfPath, filePath)
        fs.unlinkSync(tempPdfPath)
      } catch (copyError) {
        safeUnlinkArchive(filePath)
        throw copyError
      }
    } else {
      throw error
    }
  }

  // Stat BEFORE transaction to avoid filesystem I/O inside DB transaction
  const fileSize = fs.statSync(filePath).size

  try {
    const insertedBelge = await db.transaction(
      async (tx) => {
        const [row] = await tx
          .insert(belge)
          .values({
            dosya_id: dosyaId,
            dosya_no: dosyaNo,
            kategori: belgeTuru,
            dosya_adi: fileName,
            dosya_yolu: relativePath,
            dosya_boyutu: fileSize,
            mime_tur: 'application/pdf',
            sablon_id: sablonId,
          })
          .returning()

        await tx.insert(olayGunlugu).values({
          dosya_id: dosyaId,
          olay_turu: 'belge',
          aciklama: `${sablonAdi} şablonundan PDF üretildi`,
        })

        return row
      },
      { behavior: 'immediate' }
    )

    return insertedBelge
  } catch (error) {
    safeUnlinkArchive(filePath)
    throw error
  }
}
