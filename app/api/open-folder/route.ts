import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { belge, dosya } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { getTurLabel, sanitizeFsSegment, resolveBelgelerBase } from '@/lib/belgeler-storage'
import { requireAuth } from '@/lib/auth-guard'
import path from 'path'
import { execFile } from 'child_process'

async function resolveDir(dosyaRow: {
  tur: string
  muvekkil_plaka: string | null
  muvekkil: { ad: string; soyad: string } | null
  sigortaTuru: { ad: string } | null
}): Promise<string> {
  const belgelerBase = resolveBelgelerBase()
  const turLabel = getTurLabel(dosyaRow.tur)
  const sigortaLabel = dosyaRow.sigortaTuru?.ad?.trim()
    ? sanitizeFsSegment(dosyaRow.sigortaTuru.ad)
    : 'Belirtilmemiş'
  const muvekkilBase = sanitizeFsSegment(
    dosyaRow.muvekkil
      ? `${dosyaRow.muvekkil.ad} ${dosyaRow.muvekkil.soyad}`.trim()
      : 'bilinmiyor'
  )
  const muvekkilLabel = dosyaRow.muvekkil_plaka?.trim()
    ? `${muvekkilBase} - ${sanitizeFsSegment(dosyaRow.muvekkil_plaka)}`
    : muvekkilBase

  const dir = path.resolve(path.join(belgelerBase, turLabel, sigortaLabel, muvekkilLabel))
  const base = path.resolve(belgelerBase)
  if (!dir.startsWith(base + path.sep) && dir !== base) throw new Error('forbidden')
  return dir
}

export async function GET(request: NextRequest) {
  const authError = await requireAuth()
  if (authError) return authError

  if (process.platform !== 'win32') {
    return NextResponse.json({ error: 'Bu özellik yalnızca Windows ortamında çalışır.' }, { status: 501 })
  }

  const params = request.nextUrl.searchParams
  const belgeIdRaw = params.get('belgeId')
  const dosyaIdRaw = params.get('dosyaId')

  if (belgeIdRaw) {
    const belgeId = parseInt(belgeIdRaw, 10)
    if (isNaN(belgeId)) return NextResponse.json({ error: 'Geçersiz belge ID' }, { status: 400 })

    const row = await db.query.belge.findFirst({
      where: eq(belge.id, belgeId),
      with: { dosya: { with: { muvekkil: true, sigortaTuru: true } } },
    })
    if (!row) return NextResponse.json({ error: 'Belge bulunamadı' }, { status: 404 })

    try {
      const dir = await resolveDir(row.dosya)
      execFile('explorer.exe', [dir])
      return NextResponse.json({ ok: true })
    } catch {
      return NextResponse.json({ error: 'Geçersiz dizin' }, { status: 403 })
    }
  }

  if (dosyaIdRaw) {
    const dosyaId = parseInt(dosyaIdRaw, 10)
    if (isNaN(dosyaId)) return NextResponse.json({ error: 'Geçersiz dosya ID' }, { status: 400 })

    const row = await db.query.dosya.findFirst({
      where: eq(dosya.id, dosyaId),
      with: { muvekkil: true, sigortaTuru: true },
    })
    if (!row) return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 404 })

    try {
      const dir = await resolveDir(row)
      execFile('explorer.exe', [dir])
      return NextResponse.json({ ok: true })
    } catch {
      return NextResponse.json({ error: 'Geçersiz dizin' }, { status: 403 })
    }
  }

  return NextResponse.json({ error: 'belgeId veya dosyaId gerekli' }, { status: 400 })
}
