import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import path from 'path'
import { copyFileSync, existsSync, mkdirSync, rmSync, readdirSync } from 'fs'
import { sablonRouter } from '@/lib/trpc/routers/sablon'
import { db } from '@/lib/db'
import { docxSablon, belge, muvekkil, dosya } from '@/lib/schema'
import { eq } from 'drizzle-orm'

const FIXTURE = path.resolve(process.cwd(), 'tests/fixtures/test-template.docx')
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'templates')

// Mock auth context — SessionData only requires isLoggedIn
const ctx = { session: { isLoggedIn: true } } as any

function copyFixtureForTest(suffix: string): string {
  if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true })
  const dest = path.join(UPLOAD_DIR, `${Date.now()}_router-test-${suffix}.docx`)
  copyFileSync(FIXTURE, dest)
  return dest
}

afterAll(() => {
  if (existsSync(UPLOAD_DIR)) {
    for (const f of readdirSync(UPLOAD_DIR)) {
      if (f.includes('_router-test-')) {
        try { rmSync(path.join(UPLOAD_DIR, f)) } catch {}
      }
    }
  }
})

describe('sablonRouter: procedure surface (SABLON-04, SABLON-05, SABLON-06)', () => {
  it('exposes list, create, delete, update', () => {
    const procs = sablonRouter._def.procedures as Record<string, unknown>
    expect(procs).toHaveProperty('list')
    expect(procs).toHaveProperty('create')
    expect(procs).toHaveProperty('delete')
    expect(procs).toHaveProperty('update')
  })
})

describe('sablonRouter.create: extract-vars + insert (SABLON-01, SABLON-03)', () => {
  it('inserts row with extracted variables for valid fixture', async () => {
    const filePath = copyFixtureForTest('create-ok')
    const caller = sablonRouter.createCaller(ctx)
    const row = await caller.create({
      ad: 'Test Şablon',
      kategori: 'STK',
      filename: path.basename(filePath),
      fileName: 'test.docx',
      fileSize: 1234,
    })
    expect(row.id).toBeGreaterThan(0)
    expect(row.degiskenler).toEqual(['taraf.karsitaraf_ad', 'dosya.dosya_no', 'muvekkil.ad'])
    // cleanup
    await caller.delete({ id: row.id })
  }, 30_000)

  it('throws BAD_REQUEST on non-existent file_path', async () => {
    const caller = sablonRouter.createCaller(ctx)
    await expect(
      caller.create({
        ad: 'Bogus',
        kategori: 'STK',
        filename: 'nonexistent-path.docx',
        fileName: 'x.docx',
        fileSize: 1,
      }),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' })
  }, 30_000)
})

describe('sablonRouter.delete: SET NULL FK on belge.sablon_id (SABLON-05, SABLON-08)', () => {
  let seededMuvekkilId: number
  let seededDosyaId: number

  beforeAll(async () => {
    // Reuse any existing muvekkil if present; otherwise insert a minimal one.
    const existingMuv = await db.query.muvekkil?.findFirst?.()
    if (existingMuv) {
      seededMuvekkilId = (existingMuv as any).id
    } else {
      const [m] = await db.insert(muvekkil).values({
        ad: 'fk-test-muvekkil',
        soyad: 'cascade',
      }).returning()
      seededMuvekkilId = m.id
    }

    const [d] = await db.insert(dosya).values({
      muvekkil_id: seededMuvekkilId,
      dosya_no: `fk-cascade-${Date.now()}`,
      tur: 'STK',
    }).returning()
    seededDosyaId = d.id
  })

  afterAll(async () => {
    if (seededDosyaId) {
      try { await db.delete(dosya).where(eq(dosya.id, seededDosyaId)) } catch {}
    }
  })

  it('sets belge.sablon_id to NULL when template is deleted (SET NULL FK)', async () => {
    const [tpl] = await db.insert(docxSablon).values({
      ad: 'FK-test',
      kategori: 'Genel',
      dosya_yolu: copyFixtureForTest('fk-test'),
      degiskenler: [],
    }).returning()

    const [b] = await db.insert(belge).values({
      dosya_id: seededDosyaId,
      dosya_no: `fk-cascade-${Date.now()}`,
      kategori: 'Diğer',
      dosya_adi: 'fk-test.pdf',
      dosya_yolu: '/tmp/fk-test.pdf',
      dosya_boyutu: 0,
      mime_tur: 'application/pdf',
      sablon_id: tpl.id,
    }).returning()

    expect(b.sablon_id).toBe(tpl.id)

    const caller = sablonRouter.createCaller(ctx)
    await caller.delete({ id: tpl.id })

    const after = await db.select().from(belge).where(eq(belge.id, b.id))
    expect(after.length).toBe(1)
    expect(after[0].sablon_id).toBeNull()
  }, 30_000)

  it('throws NOT_FOUND with Turkish message for missing id', async () => {
    const caller = sablonRouter.createCaller(ctx)
    await expect(caller.delete({ id: 999_999_999 })).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'Şablon bulunamadı.',
    })
  }, 30_000)
})
