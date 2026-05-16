import path from 'path'
import fs from 'fs'
import { randomUUID } from 'crypto'
import { db } from '@/lib/db'
import { belge, olayGunlugu } from '@/lib/schema'
import { TRPCError } from '@trpc/server'
import { runSidecarCommand } from '@/lib/services/docx-pipeline'
import {
  BELGELER_BASE,
  buildBelgelerDir,
  sanitizeFsSegment,
  type BelgeDosyaBilgi,
} from '@/lib/belgeler-storage'

// Re-exported for backward compatibility with tests
export { BELGELER_BASE as ARCHIVE_BASE }

const RESERVED_WINDOWS_NAMES = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i

export function isReservedWindowsName(name: string): boolean {
  return RESERVED_WINDOWS_NAMES.test(name)
}

export function safeUnlinkArchive(filePath: string): void {
  try {
    const resolved = path.resolve(filePath)
    const baseResolved = path.resolve(BELGELER_BASE)
    const rel = path.relative(baseResolved, resolved)
    if (rel.startsWith('..') || path.isAbsolute(rel)) {
      return
    }
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  } catch {
    // ignore
  }
}

export function buildArchivePath(
  dosyaBilgi: BelgeDosyaBilgi,
  displayName?: string
): { dir: string; filePath: string; fileName: string } {
  const dir = buildBelgelerDir(dosyaBilgi)

  const resolved = path.resolve(dir)
  const baseResolved = path.resolve(BELGELER_BASE)
  const rel = path.relative(baseResolved, resolved)
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Geçersiz arşiv yolu: dizin geçişi tespit edildi.',
    })
  }

  const suffix = randomUUID().slice(0, 8)
  const fileName = displayName
    ? `${sanitizeFsSegment(displayName).slice(0, 50)}-${suffix}.pdf`
    : `${suffix}.pdf`
  const filePath = path.join(dir, fileName)

  return { dir, filePath, fileName }
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
  dosyaBilgi: BelgeDosyaBilgi,
  displayName?: string
) {
  const { dir, filePath, fileName } = buildArchivePath(dosyaBilgi, displayName)

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

  const fileSize = fs.statSync(filePath).size

  try {
    const [insertedBelge] = await db
      .insert(belge)
      .values({
        dosya_id: dosyaId,
        dosya_no: dosyaNo,
        kategori: belgeTuru,
        dosya_adi: fileName,
        dosya_yolu: `/api/files/${dosyaId}/${fileName}`,
        dosya_boyutu: fileSize,
        mime_tur: 'application/pdf',
        sablon_id: sablonId,
      })
      .returning()

    await db.insert(olayGunlugu).values({
      dosya_id: dosyaId,
      olay_turu: 'belge',
      aciklama: `${sablonAdi} şablonundan PDF üretildi`,
    })

    return insertedBelge
  } catch (error) {
    safeUnlinkArchive(filePath)
    throw error
  }
}
