import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { belge } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { buildBelgelerDir, resolveBelgelerBase } from '@/lib/belgeler-storage'
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

  const belgelerBase = resolveBelgelerBase()

  const dir = buildBelgelerDir({
    tur: row.dosya.tur,
    sigortaTuruAd: row.dosya.sigortaTuru?.ad ?? null,
    muvekkilAd: row.dosya.muvekkil
      ? `${row.dosya.muvekkil.ad} ${row.dosya.muvekkil.soyad}`.trim()
      : null,
    muvekkilPlaka: row.dosya.muvekkil_plaka,
  })

  const resolvedDir = path.resolve(dir)
  const resolvedBase = path.resolve(belgelerBase)

  if (!resolvedDir.startsWith(resolvedBase + path.sep) && resolvedDir !== resolvedBase) {
    return NextResponse.json({ error: 'Geçersiz dizin' }, { status: 403 })
  }

  execFile('explorer.exe', [resolvedDir])

  return NextResponse.json({ ok: true })
}
