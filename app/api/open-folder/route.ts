import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { belge } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { getTurLabel, sanitizeFsSegment, resolveBelgelerBase } from '@/lib/belgeler-storage'
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

  const turLabel = getTurLabel(row.dosya.tur)
  const sigortaLabel = row.dosya.sigortaTuru?.ad?.trim()
    ? sanitizeFsSegment(row.dosya.sigortaTuru.ad)
    : 'Belirtilmemiş'
  const muvekkilBase = sanitizeFsSegment(
    row.dosya.muvekkil
      ? `${row.dosya.muvekkil.ad} ${row.dosya.muvekkil.soyad}`.trim()
      : 'bilinmiyor'
  )
  const muvekkilLabel = row.dosya.muvekkil_plaka?.trim()
    ? `${muvekkilBase} - ${sanitizeFsSegment(row.dosya.muvekkil_plaka)}`
    : muvekkilBase

  const dir = path.join(belgelerBase, turLabel, sigortaLabel, muvekkilLabel)

  const resolvedDir = path.resolve(dir)
  const resolvedBase = path.resolve(belgelerBase)

  if (!resolvedDir.startsWith(resolvedBase + path.sep) && resolvedDir !== resolvedBase) {
    return NextResponse.json({ error: 'Geçersiz dizin' }, { status: 403 })
  }

  execFile('explorer.exe', [resolvedDir])

  return NextResponse.json({ ok: true })
}
