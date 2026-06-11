import { describe, it, expect, beforeAll } from 'vitest'
import { dosyaRouter, dosyaSchema } from '@/lib/trpc/routers/dosya'
import { muvekkillRouter } from '@/lib/trpc/routers/muvekkil'
import { createCallerFactory } from '@/lib/trpc/init'
import type { IronSession } from 'iron-session'
import type { SessionData } from '@/lib/session'

describe('dosya router: procedure existence', () => {
  it('has list procedure', () => {
    expect(dosyaRouter._def.procedures).toHaveProperty('list')
  })
  it('has getById procedure', () => {
    expect(dosyaRouter._def.procedures).toHaveProperty('getById')
  })
  it('has create procedure', () => {
    expect(dosyaRouter._def.procedures).toHaveProperty('create')
  })
  it('has update procedure', () => {
    expect(dosyaRouter._def.procedures).toHaveProperty('update')
  })
  it('has archive procedure', () => {
    expect(dosyaRouter._def.procedures).toHaveProperty('archive')
  })
  it('has delete procedure', () => {
    expect(dosyaRouter._def.procedures).toHaveProperty('delete')
  })
  it('has upsertTaraf procedure', () => {
    expect(dosyaRouter._def.procedures).toHaveProperty('upsertTaraf')
  })
})

// ── dosyaSchema validation (pure, no DB) ──────────────────────────────────────
// `create` auto-generates dosya_no (it is omitted from the create input), so the
// 50-char limit is enforced on the full dosyaSchema used by `update`.
describe('dosyaSchema constraints', () => {
  const base = { muvekkil_id: 1, dosya_no: '2024/1', tur: 'STK' as const }

  it('accepts a minimal valid dosya', () => {
    expect(dosyaSchema.safeParse(base).success).toBe(true)
  })
  it('rejects dosya_no longer than 50 chars', () => {
    expect(dosyaSchema.safeParse({ ...base, dosya_no: 'x'.repeat(51) }).success).toBe(false)
  })
  it('accepts dosya_no of exactly 50 chars', () => {
    expect(dosyaSchema.safeParse({ ...base, dosya_no: 'x'.repeat(50) }).success).toBe(true)
  })
  it('rejects empty dosya_no', () => {
    expect(dosyaSchema.safeParse({ ...base, dosya_no: '' }).success).toBe(false)
  })
  it('rejects tur values other than STK, AT, AH', () => {
    expect(dosyaSchema.safeParse({ ...base, tur: 'XX' }).success).toBe(false)
    expect(dosyaSchema.safeParse({ ...base, tur: 'stk' }).success).toBe(false)
  })
  it('accepts each valid tur', () => {
    for (const tur of ['STK', 'AT', 'AH'] as const) {
      expect(dosyaSchema.safeParse({ ...base, tur }).success).toBe(true)
    }
  })
  it('rejects kusur_orani_karsi outside 0..100', () => {
    expect(dosyaSchema.safeParse({ ...base, kusur_orani_karsi: 101 }).success).toBe(false)
    expect(dosyaSchema.safeParse({ ...base, kusur_orani_karsi: -1 }).success).toBe(false)
  })
  it('rejects non-positive talep_tutari', () => {
    expect(dosyaSchema.safeParse({ ...base, talep_tutari: 0 }).success).toBe(false)
    expect(dosyaSchema.safeParse({ ...base, talep_tutari: -5 }).success).toBe(false)
  })
})

// ── Router behavior against the shared in-memory test DB ───────────────────────
// setup.ts mocks @/lib/db with an in-memory SQLite (foreign_keys = ON) and exposes
// it via globalThis.__testSqlite. The create/delete mutations maintain dosya_fts,
// so the FTS virtual tables must exist (idempotent — 27-search-fts may create them too).
describe('dosya router: behavior', () => {
  const mockSession = { isLoggedIn: true } as unknown as IronSession<SessionData>
  const ctx = { session: mockSession, headers: new Headers() }
  const dosya = createCallerFactory(dosyaRouter)(ctx)
  const muvekkil = createCallerFactory(muvekkillRouter)(ctx)

  let muvekkilId: number

  beforeAll(async () => {
    globalThis.__testSqlite!.exec(`CREATE VIRTUAL TABLE IF NOT EXISTS dosya_fts USING fts5(txt, tokenize='trigram')`)
    globalThis.__testSqlite!.exec(`CREATE VIRTUAL TABLE IF NOT EXISTS muvekkil_fts USING fts5(txt, tokenize='trigram')`)
    const m = await muvekkil.create({ ad: 'DosyaTest', soyad: 'Sahibi' })
    muvekkilId = m.id
  })

  function tarafCount(dosyaId: number): number {
    const row = globalThis.__testSqlite!
      .prepare('SELECT COUNT(*) AS c FROM taraf WHERE dosya_id = ?')
      .get(dosyaId) as { c: number }
    return row.c
  }

  it('create auto-generates dosya_no in YYYY/N format', async () => {
    const row = await dosya.create({ muvekkil_id: muvekkilId, tur: 'STK' })
    expect(row.dosya_no).toMatch(new RegExp(`^${new Date().getFullYear()}/\\d+$`))
    expect(row.durum).toBe('aktif')
    await dosya.delete({ id: row.id })
  })

  it('create rejects tur values other than STK, AT, AH', async () => {
    // @ts-expect-error — exercising the runtime zod guard with an invalid enum value
    await expect(dosya.create({ muvekkil_id: muvekkilId, tur: 'ZZ' })).rejects.toThrow()
  })

  it('list pageSize cannot exceed 100', async () => {
    await expect(dosya.list({ pageSize: 101 })).rejects.toThrow()
    await expect(dosya.list({ pageSize: 100 })).resolves.toBeDefined()
  })

  it('archive sets durum to arsiv', async () => {
    const row = await dosya.create({ muvekkil_id: muvekkilId, tur: 'AT' })
    expect(row.durum).toBe('aktif')
    const archived = await dosya.archive({ id: row.id })
    expect(archived.durum).toBe('arsiv')
    await dosya.delete({ id: row.id })
  })

  it('archive throws NOT_FOUND for a missing dosya', async () => {
    await expect(dosya.archive({ id: 999999 })).rejects.toThrow(/bulunamadı/i)
  })

  it('upsertTaraf creates a taraf when none exists', async () => {
    const row = await dosya.create({ muvekkil_id: muvekkilId, tur: 'AH' })
    expect(tarafCount(row.id)).toBe(0)

    const taraf = await dosya.upsertTaraf({ dosya_id: row.id, karsitaraf_ad: 'Karşı A' })
    expect(taraf.dosya_id).toBe(row.id)
    expect(taraf.karsitaraf_ad).toBe('Karşı A')
    expect(tarafCount(row.id)).toBe(1)

    await dosya.delete({ id: row.id })
  })

  it('upsertTaraf updates the taraf when one already exists', async () => {
    const row = await dosya.create({ muvekkil_id: muvekkilId, tur: 'STK' })
    await dosya.upsertTaraf({ dosya_id: row.id, karsitaraf_ad: 'İlk Ad' })
    const updated = await dosya.upsertTaraf({ dosya_id: row.id, karsitaraf_ad: 'Yeni Ad' })

    expect(updated.karsitaraf_ad).toBe('Yeni Ad')
    expect(tarafCount(row.id)).toBe(1) // upsert, not insert — unique dosya_id

    await dosya.delete({ id: row.id })
  })

  it('delete cascades to taraf rows (FK onDelete cascade)', async () => {
    const row = await dosya.create({ muvekkil_id: muvekkilId, tur: 'STK' })
    await dosya.upsertTaraf({ dosya_id: row.id, karsitaraf_ad: 'Cascade Test' })
    expect(tarafCount(row.id)).toBe(1)

    await dosya.delete({ id: row.id })
    expect(tarafCount(row.id)).toBe(0)
  })

  it('getById throws NOT_FOUND after delete', async () => {
    const row = await dosya.create({ muvekkil_id: muvekkilId, tur: 'AT' })
    await dosya.delete({ id: row.id })
    await expect(dosya.getById({ id: row.id })).rejects.toThrow(/bulunamadı/i)
  })
})
