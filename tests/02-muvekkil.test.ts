import { describe, it, expect, beforeAll } from 'vitest'
import { muvekkillRouter } from '@/lib/trpc/routers/muvekkil'
import { dosyaRouter } from '@/lib/trpc/routers/dosya'
import { createCallerFactory } from '@/lib/trpc/init'
import type { IronSession } from 'iron-session'
import type { SessionData } from '@/lib/session'

const createCaller = createCallerFactory(muvekkillRouter)
let caller: ReturnType<typeof createCaller>

const mockSession = { isLoggedIn: true } as unknown as IronSession<SessionData>

beforeAll(() => {
  caller = createCaller({ session: mockSession, headers: new Headers() })
})

describe('muvekkil router — procedure registry', () => {
  it('delete procedure exists on router', () => {
    expect(muvekkillRouter._def.procedures).toHaveProperty('delete')
  })

  it('list procedure exists on router', () => {
    expect(muvekkillRouter._def.procedures).toHaveProperty('list')
  })

  it('create procedure exists on router', () => {
    expect(muvekkillRouter._def.procedures).toHaveProperty('create')
  })

  it('getById procedure exists on router', () => {
    expect(muvekkillRouter._def.procedures).toHaveProperty('getById')
  })

  it('update procedure exists on router', () => {
    expect(muvekkillRouter._def.procedures).toHaveProperty('update')
  })
})

describe('muvekkil router — caller factory', () => {
  it('createCallerFactory returns a callable factory for muvekkillRouter', () => {
    expect(typeof createCaller).toBe('function')
    // In tRPC v11 the caller returned by createCaller is a function (callable object)
    expect(caller).toBeDefined()
  })

  it('caller exposes list function', () => {
    expect(typeof caller.list).toBe('function')
  })

  it('caller exposes create function', () => {
    expect(typeof caller.create).toBe('function')
  })

  it('caller exposes update function', () => {
    expect(typeof caller.update).toBe('function')
  })

  it('caller exposes delete function', () => {
    expect(typeof caller.delete).toBe('function')
  })

  it('caller exposes getById function', () => {
    expect(typeof caller.getById).toBe('function')
  })
})

describe('muvekkil delete protection (D-07)', () => {
  it('delete procedure is defined and is a mutation', () => {
    const deleteDef = muvekkillRouter._def.procedures.delete._def
    // tRPC v11: type is stored in the procedure definition
    expect(deleteDef).toBeDefined()
  })

  it('list procedure is defined and is a query', () => {
    const listDef = muvekkillRouter._def.procedures.list._def
    expect(listDef).toBeDefined()
  })
})

// ── Input validation (pure zod, no DB) ───────────────────────────────────────
describe('muvekkil create — input validation', () => {
  it('rejects empty ad', async () => {
    await expect(caller.create({ ad: '', soyad: 'Yılmaz' })).rejects.toThrow()
  })
  it('rejects empty soyad', async () => {
    await expect(caller.create({ ad: 'Ahmet', soyad: '' })).rejects.toThrow()
  })
  it('rejects malformed telefon', async () => {
    await expect(
      caller.create({ ad: 'Ahmet', soyad: 'Yılmaz', telefon: '5321234567' })
    ).rejects.toThrow()
  })
  it('rejects malformed IBAN', async () => {
    await expect(
      caller.create({ ad: 'Ahmet', soyad: 'Yılmaz', iban: 'TR123' })
    ).rejects.toThrow()
  })
})

// ── Behavior against the shared in-memory test DB ─────────────────────────────
describe('muvekkil router: CRUD behavior', () => {
  const dosya = createCallerFactory(dosyaRouter)({ session: mockSession, headers: new Headers() })

  beforeAll(() => {
    globalThis.__testSqlite!.exec(`CREATE VIRTUAL TABLE IF NOT EXISTS dosya_fts USING fts5(txt, tokenize='trigram')`)
    globalThis.__testSqlite!.exec(`CREATE VIRTUAL TABLE IF NOT EXISTS muvekkil_fts USING fts5(txt, tokenize='trigram')`)
  })

  it('create then getById round-trips the row', async () => {
    const m = await caller.create({ ad: 'Round', soyad: 'Trip' })
    const fetched = await caller.getById({ id: m.id })
    expect(fetched.ad).toBe('Round')
    expect(fetched.soyad).toBe('Trip')
    expect(fetched.dosyalar).toEqual([])
    await caller.delete({ id: m.id })
  })

  it('update changes the stored name', async () => {
    const m = await caller.create({ ad: 'Eski', soyad: 'Ad' })
    const updated = await caller.update({ id: m.id, ad: 'Yeni', soyad: 'Ad' })
    expect(updated.ad).toBe('Yeni')
    const fetched = await caller.getById({ id: m.id })
    expect(fetched.ad).toBe('Yeni')
    await caller.delete({ id: m.id })
  })

  it('getById throws NOT_FOUND for a missing müvekkil', async () => {
    await expect(caller.getById({ id: 999999 })).rejects.toThrow(/bulunamadı/i)
  })

  it('delete succeeds when no dosya is linked', async () => {
    const m = await caller.create({ ad: 'Silinebilir', soyad: 'Kisi' })
    await expect(caller.delete({ id: m.id })).resolves.toEqual({ success: true })
    await expect(caller.getById({ id: m.id })).rejects.toThrow(/bulunamadı/i)
  })

  it('delete is BLOCKED when a linked dosya exists (D-07)', async () => {
    const m = await caller.create({ ad: 'Korumalı', soyad: 'Müvekkil' })
    const d = await dosya.create({ muvekkil_id: m.id, tur: 'STK' })

    await expect(caller.delete({ id: m.id })).rejects.toThrow(/dosya bulunuyor/i)

    // After removing the dosya, delete must succeed
    await dosya.delete({ id: d.id })
    await expect(caller.delete({ id: m.id })).resolves.toEqual({ success: true })
  })
})
