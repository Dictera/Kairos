import { NextRequest, NextResponse } from 'next/server'
import { connection } from 'next/server'
import { db } from '@/lib/db'
import { dosya } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { buildBelgelerDir, BELGELER_BASE, isInsideDir } from '@/lib/belgeler-storage'
import { requireAuth } from '@/lib/auth-guard'
import { fileResponse, MIME_FOR_EXTENSION, statFile } from '@/lib/file-transfer'
import type { Stats } from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ dosyaId: string; filename: string }> },
) {
  await connection()
  const authError = await requireAuth()
  if (authError) return authError

  const { dosyaId: dosyaIdStr, filename } = await params

  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return NextResponse.json({ error: 'Geçersiz dosya adı' }, { status: 400 })
  }

  const dosyaId = parseInt(dosyaIdStr, 10)
  if (isNaN(dosyaId)) {
    return NextResponse.json({ error: 'Geçersiz dosya ID' }, { status: 400 })
  }

  // Look up dosya to compute hierarchical disk path; fall back to flat path on any error.
  // Use the parsed id, never the raw segment: params are URL-decoded, so
  // "1%2F..%2F.." would otherwise become "1/../.." and escape BELGELER_BASE.
  let filePath = path.join(BELGELER_BASE, String(dosyaId), filename)
  let stat: Stats | null = null

  try {
    const dosyaRow = await db.query.dosya.findFirst({
      where: eq(dosya.id, dosyaId),
      with: {
        muvekkil: true,
        sigortaTuru: true,
      },
    })

    if (dosyaRow) {
      const base = {
        tur: dosyaRow.tur,
        sigortaTuruAd: dosyaRow.sigortaTuru?.ad ?? null,
        muvekkilPlaka: dosyaRow.muvekkil_plaka,
      }
      const adSoyad = dosyaRow.muvekkil
        ? `${dosyaRow.muvekkil.ad} ${dosyaRow.muvekkil.soyad}`.trim()
        : null
      const adOnly = dosyaRow.muvekkil?.ad ?? null

      // Try full name first, then ad-only fallback (handles files uploaded before soyad was added)
      for (const muvekkilAd of [adSoyad, adOnly]) {
        const candidate = path.join(buildBelgelerDir({ ...base, muvekkilAd }), filename)
        stat = await statFile(candidate)
        if (stat) {
          filePath = candidate
          break
        }
      }
    }
  } catch {
    // DB lookup failed — serve from flat fallback path
  }

  if (!isInsideDir(BELGELER_BASE, filePath)) {
    return NextResponse.json({ error: 'Geçersiz dosya yolu' }, { status: 400 })
  }

  stat ??= await statFile(filePath)
  if (!stat) {
    return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 404 })
  }

  const ext = path.extname(filename).toLowerCase()
  return fileResponse(filePath, {
    size: stat.size,
    contentType: MIME_FOR_EXTENSION[ext] || 'application/octet-stream',
    filename,
  })
}
