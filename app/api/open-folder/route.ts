import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { belge } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { buildBelgelerDir, BELGELER_BASE } from '@/lib/belgeler-storage'
import path from 'path'
import { execFile } from 'child_process'

export async function GET(request: NextRequest) {
  const belgeIdRaw = request.nextUrl.searchParams.get('belgeId')
  const belgeId = parseInt(belgeIdRaw ?? '', 10)

  if (isNaN(belgeId)) {
    return NextResponse.json({ error: 'Geçersiz belge ID' }, { status: 400 })
  }

  const row = await db.query.belge.findFirst({
    where: eq(belge.id, belgeId),
    with: {
      dosya: {
        with: {
          muvekkil: true,
          sigortaTuru: true,
        },
      },
    },
  })

  if (!row) {
    return NextResponse.json({ error: 'Belge bulunamadı' }, { status: 404 })
  }

  const filename = row.dosya_yolu.split('/').pop()
  if (!filename) {
    return NextResponse.json({ error: 'Dosya yolu geçersiz' }, { status: 400 })
  }

  const dir = buildBelgelerDir({
    tur: row.dosya.tur,
    sigortaTuruAd: row.dosya.sigortaTuru?.ad ?? null,
    muvekkilAd: row.dosya.muvekkil
      ? `${row.dosya.muvekkil.ad} ${row.dosya.muvekkil.soyad}`.trim()
      : null,
    muvekkilPlaka: row.dosya.muvekkil_plaka,
  })

  const absolutePath = path.join(dir, filename)
  const resolvedPath = path.resolve(absolutePath)
  const resolvedBase = path.resolve(BELGELER_BASE)

  if (!resolvedPath.startsWith(resolvedBase + path.sep) && resolvedPath !== resolvedBase) {
    return NextResponse.json({ error: 'Geçersiz dizin' }, { status: 403 })
  }

  execFile('explorer.exe', [`/select,${resolvedPath}`])

  return NextResponse.json({ ok: true })
}
