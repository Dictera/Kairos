// Edge-case coverage for the FTS5 trigram search subsystem:
//   - foldTr (Turkish normalization, the single source of truth)
//   - ftsMatchQuery (length boundary, quoting, trimming)
//   - dosyaFtsText / muvekkilFtsText (null filtering, folding)
//   - search-index helpers against a real FTS5 trigram table (substring,
//     fold-insensitive match, upsert/delete/rebuild lifecycle)
//
// Uses an ISOLATED in-memory DB (not the globally-mocked test db) so the
// real foldTr is exercised and there is zero cross-file pollution.
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { sql, eq } from 'drizzle-orm'
import path from 'path'
import fs from 'fs'
import * as schema from '@/lib/schema'
import { dosya, muvekkil } from '@/lib/schema'
import { foldTr, ftsMatchQuery, dosyaFtsText, muvekkilFtsText } from '@/lib/turkish'
import {
  upsertDosyaFts, deleteDosyaFts,
  upsertMuvekkilFts, deleteMuvekkilFts, rebuildMuvekkilDosyaFts,
} from '@/lib/search-index'
import { dosyaRouter } from '@/lib/trpc/routers/dosya'
import { muvekkillRouter } from '@/lib/trpc/routers/muvekkil'
import { searchRouter } from '@/lib/trpc/routers/search'
import { createCallerFactory } from '@/lib/trpc/init'
import type { IronSession } from 'iron-session'
import type { SessionData } from '@/lib/session'

// ── foldTr ────────────────────────────────────────────────────────────────
describe('foldTr — Turkish normalization', () => {
  it('lowercases ASCII', () => {
    expect(foldTr('ABCxyz')).toBe('abcxyz')
  })
  it('folds lowercase Turkish chars to ASCII', () => {
    expect(foldTr('şğüöçı')).toBe('sguoci')
  })
  it('folds uppercase Turkish chars to ASCII', () => {
    expect(foldTr('ŞĞÜÖÇ')).toBe('sguoc')
  })
  it('folds İ to a clean "i" without combining dot (U+0307)', () => {
    expect(foldTr('İ')).toBe('i')
    expect(foldTr('İ').length).toBe(1)
    expect(foldTr('İ')).not.toContain('̇')
  })
  it('uppercase and lowercase variants fold identically', () => {
    expect(foldTr('ŞİŞLİ')).toBe(foldTr('şişli'))
    expect(foldTr('ŞİŞLİ')).toBe('sisli')
  })
  it('folds ASCII I (JS lowercases to i) consistently', () => {
    expect(foldTr('IĞDIR')).toBe('igdir')
  })
  it('handles a full Turkish name', () => {
    expect(foldTr('Çağlar Öztürk')).toBe('caglar ozturk')
  })
  it('returns empty string for null / undefined', () => {
    expect(foldTr(null)).toBe('')
    expect(foldTr(undefined)).toBe('')
  })
  it('coerces numbers to string', () => {
    expect(foldTr(2024)).toBe('2024')
  })
  it('preserves digits, slashes and punctuation', () => {
    expect(foldTr('2024/5034-A')).toBe('2024/5034-a')
  })
})

// ── ftsMatchQuery ───────────────────────────────────────────────────────────
describe('ftsMatchQuery — trigram MATCH builder', () => {
  it('returns a quoted folded literal for >= 3 chars', () => {
    expect(ftsMatchQuery('Şişli')).toBe('"sisli"')
  })
  it('returns null below the 3-char minimum', () => {
    expect(ftsMatchQuery('ab')).toBeNull()
    expect(ftsMatchQuery('a')).toBeNull()
    expect(ftsMatchQuery('')).toBeNull()
  })
  it('uses exactly 3 chars as the boundary (inclusive)', () => {
    expect(ftsMatchQuery('abc')).toBe('"abc"')
  })
  it('trims before the length check', () => {
    expect(ftsMatchQuery('  ab  ')).toBeNull()
    expect(ftsMatchQuery('   ')).toBeNull()
  })
  it('counts folded length, not raw length', () => {
    // 3 Turkish chars fold to 3 ASCII chars → valid
    expect(ftsMatchQuery('şğü')).toBe('"sgu"')
  })
  it('escapes embedded double-quotes by doubling', () => {
    expect(ftsMatchQuery('a"b"c')).toBe('"a""b""c"')
  })
  it('keeps internal whitespace (multi-word substring)', () => {
    expect(ftsMatchQuery('İç Anadolu')).toBe('"ic anadolu"')
  })
})

// ── text builders ────────────────────────────────────────────────────────────
describe('dosyaFtsText / muvekkilFtsText', () => {
  it('joins present fields and folds them', () => {
    expect(dosyaFtsText({
      dosya_no: '2024/5034', hasar_dosya_no: 'H-9', muvekkil_plaka: '34ABC',
      ad: 'Şişli', soyad: 'Öztürk',
    })).toBe('2024/5034 h-9 34abc sisli ozturk')
  })
  it('drops null / undefined / empty fields', () => {
    expect(dosyaFtsText({ dosya_no: '2024/1', hasar_dosya_no: null, muvekkil_plaka: '', ad: null, soyad: undefined }))
      .toBe('2024/1')
  })
  it('muvekkilFtsText folds name + tc + telefon', () => {
    expect(muvekkilFtsText({ ad: 'Çağlar', soyad: 'Ası', tc_vergi_no: '111', telefon: '0555' }))
      .toBe('caglar asi 111 0555')
  })
  it('muvekkilFtsText returns empty for all-null row', () => {
    expect(muvekkilFtsText({ ad: null, soyad: null, tc_vergi_no: null, telefon: null })).toBe('')
  })
})

// ── FTS integration (isolated DB) ────────────────────────────────────────────
describe('FTS5 trigram integration', () => {
  let sqlite: Database.Database
  let db: ReturnType<typeof drizzle<typeof schema>>

  // helper: run a dosya_fts substring search via the IN-subquery pattern routers use
  function searchDosya(query: string): number[] {
    const match = ftsMatchQuery(query)
    if (!match) return [-1] // caller would fall back to LIKE; sentinel for "no FTS"
    const rows = db.all(sql`SELECT rowid AS id FROM dosya_fts WHERE dosya_fts MATCH ${match} ORDER BY rowid`) as Array<{ id: number }>
    return rows.map(r => r.id)
  }
  function searchMuvekkil(query: string): number[] {
    const match = ftsMatchQuery(query)
    if (!match) return [-1]
    const rows = db.all(sql`SELECT rowid AS id FROM muvekkil_fts WHERE muvekkil_fts MATCH ${match} ORDER BY rowid`) as Array<{ id: number }>
    return rows.map(r => r.id)
  }

  beforeAll(() => {
    sqlite = new Database(':memory:')
    sqlite.pragma('foreign_keys = ON')
    sqlite.function('lower_tr', (s: unknown) => foldTr(s))

    // Apply real migrations so dosya/muvekkil tables exist (rebuild helper joins them)
    const migrationsDir = path.resolve(process.cwd(), 'drizzle')
    for (const file of fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort()) {
      const content = fs.readFileSync(path.join(migrationsDir, file), 'utf-8')
      for (const stmt of content.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean)) {
        try { sqlite.exec(stmt) } catch { /* ALTER ... DROP COLUMN etc. may fail on fresh DB */ }
      }
    }
    sqlite.exec(`CREATE VIRTUAL TABLE IF NOT EXISTS dosya_fts USING fts5(txt, tokenize='trigram')`)
    sqlite.exec(`CREATE VIRTUAL TABLE IF NOT EXISTS muvekkil_fts USING fts5(txt, tokenize='trigram')`)

    db = drizzle({ client: sqlite, schema })
  })

  afterAll(() => sqlite.close())

  it('matches a substring inside a token (trigram)', () => {
    const m = db.insert(muvekkil).values({ ad: 'Ahmet', soyad: 'Yılmaz' }).returning().get()
    const d = db.insert(dosya).values({ muvekkil_id: m.id, dosya_no: '2024/5034', tur: 'STK' }).returning().get()
    upsertDosyaFts(db, d.id, { ...d, ad: m.ad, soyad: m.soyad })

    expect(searchDosya('5034')).toContain(d.id)
    expect(searchDosya('034')).toContain(d.id)   // middle of token
    expect(searchDosya('024/50')).toContain(d.id) // spans the slash
  })

  it('matches Turkish text case- and accent-insensitively', () => {
    const m = db.insert(muvekkil).values({ ad: 'Şişli', soyad: 'Öztürk' }).returning().get()
    const d = db.insert(dosya).values({ muvekkil_id: m.id, dosya_no: '2024/77', tur: 'AT' }).returning().get()
    upsertMuvekkilFts(db, m.id, m)
    upsertDosyaFts(db, d.id, { ...d, ad: m.ad, soyad: m.soyad })

    expect(searchMuvekkil('şiş')).toContain(m.id)
    expect(searchMuvekkil('ŞİŞ')).toContain(m.id)   // uppercase İ
    expect(searchMuvekkil('sis')).toContain(m.id)   // already-folded
    expect(searchMuvekkil('öztürk')).toContain(m.id)
    expect(searchMuvekkil('OZTURK')).toContain(m.id)
    expect(searchDosya('ozturk')).toContain(d.id)    // name denormalized into dosya_fts
  })

  it('upsert replaces old content (no stale tokens)', () => {
    const m = db.insert(muvekkil).values({ ad: 'Eski', soyad: 'Ad' }).returning().get()
    upsertMuvekkilFts(db, m.id, m)
    expect(searchMuvekkil('eski')).toContain(m.id)

    upsertMuvekkilFts(db, m.id, { ...m, ad: 'Yeni' })
    expect(searchMuvekkil('yeni')).toContain(m.id)
    expect(searchMuvekkil('eski')).not.toContain(m.id) // old token gone
  })

  it('delete removes the row from the index', () => {
    const m = db.insert(muvekkil).values({ ad: 'Silinecek', soyad: 'Kisi' }).returning().get()
    upsertMuvekkilFts(db, m.id, m)
    expect(searchMuvekkil('silinecek')).toContain(m.id)

    deleteMuvekkilFts(db, m.id)
    expect(searchMuvekkil('silinecek')).not.toContain(m.id)
  })

  it('rebuildMuvekkilDosyaFts refreshes denormalized name in dosya_fts', () => {
    const m = db.insert(muvekkil).values({ ad: 'İlk', soyad: 'Soyad' }).returning().get()
    const d = db.insert(dosya).values({ muvekkil_id: m.id, dosya_no: '2024/900', tur: 'AH' }).returning().get()
    upsertDosyaFts(db, d.id, { ...d, ad: m.ad, soyad: m.soyad })
    expect(searchDosya('ilk')).toContain(d.id)

    // Name changes → must propagate to every dependent dosya_fts row
    db.update(muvekkil).set({ ad: 'Degisti' }).where(eq(muvekkil.id, m.id)).run()
    db.transaction((tx) => rebuildMuvekkilDosyaFts(tx, m.id))

    expect(searchDosya('degisti')).toContain(d.id)
    expect(searchDosya('ilk')).not.toContain(d.id)
  })

  it('dosya delete + deleteDosyaFts removes the entry', () => {
    const m = db.insert(muvekkil).values({ ad: 'Geçici', soyad: 'Dosya' }).returning().get()
    const d = db.insert(dosya).values({ muvekkil_id: m.id, dosya_no: '2024/Z', tur: 'STK' }).returning().get()
    upsertDosyaFts(db, d.id, { ...d, ad: m.ad, soyad: m.soyad })
    expect(searchDosya('2024/z')).toContain(d.id)

    db.transaction((tx) => {
      tx.delete(dosya).where(eq(dosya.id, d.id)).run()
      deleteDosyaFts(tx, d.id)
    })
    expect(searchDosya('2024/z')).not.toContain(d.id)
  })

  it('sub-3-char query yields no FTS match arg (caller falls back to LIKE)', () => {
    expect(ftsMatchQuery('ab')).toBeNull()
    // sentinel confirms the helper short-circuits rather than running MATCH
    expect(searchDosya('ab')).toEqual([-1])
  })
})

// ── Router wiring end-to-end (uses the globally-mocked test db) ───────────────
// Proves the mutations actually maintain the FTS index and that search reads it.
// Unique token + cleanup keep the shared in-memory db unpolluted for other files.
describe('router wiring: mutations ↔ FTS ↔ search', () => {
  const mockSession = { isLoggedIn: true } as unknown as IronSession<SessionData>
  const ctx = { session: mockSession, headers: new Headers() }
  const muvekkilCaller = createCallerFactory(muvekkillRouter)(ctx)
  const dosyaCaller = createCallerFactory(dosyaRouter)(ctx)
  const searchCaller = createCallerFactory(searchRouter)(ctx)

  const TOKEN = 'ftswiretoken' // unique, ≥3 chars, won't collide with other fixtures

  beforeAll(() => {
    // setup.ts builds the shared db but doesn't create the FTS tables.
    globalThis.__testSqlite!.exec(`CREATE VIRTUAL TABLE IF NOT EXISTS dosya_fts USING fts5(txt, tokenize='trigram')`)
    globalThis.__testSqlite!.exec(`CREATE VIRTUAL TABLE IF NOT EXISTS muvekkil_fts USING fts5(txt, tokenize='trigram')`)
  })

  it('muvekkil.create indexes the row; search.global finds it', async () => {
    const m = await muvekkilCaller.create({ ad: TOKEN, soyad: 'Bir' })
    const res = await searchCaller.global({ query: TOKEN })
    expect(res.muvekkiller.map(r => r.id)).toContain(m.id)
    await muvekkilCaller.delete({ id: m.id })
  })

  it('dosya.create denormalizes müvekkil name; search finds dosya by name', async () => {
    const m = await muvekkilCaller.create({ ad: TOKEN, soyad: 'Iki' })
    const d = await dosyaCaller.create({ muvekkil_id: m.id, tur: 'STK' })
    const res = await searchCaller.global({ query: TOKEN })
    expect(res.dosyalar.map(r => r.id)).toContain(d.id)
    await dosyaCaller.delete({ id: d.id })
    await muvekkilCaller.delete({ id: m.id })
  })

  it('muvekkil.update propagates the new name into dependent dosya_fts', async () => {
    const m = await muvekkilCaller.create({ ad: 'OldWireName', soyad: 'Uc' })
    const d = await dosyaCaller.create({ muvekkil_id: m.id, tur: 'AT' })
    await muvekkilCaller.update({ id: m.id, ad: 'NewWireName', soyad: 'Uc' })

    const hit = await searchCaller.global({ query: 'newwirename' })
    expect(hit.dosyalar.map(r => r.id)).toContain(d.id)
    const miss = await searchCaller.global({ query: 'oldwirename' })
    expect(miss.dosyalar.map(r => r.id)).not.toContain(d.id)

    await dosyaCaller.delete({ id: d.id })
    await muvekkilCaller.delete({ id: m.id })
  })

  it('dosya.delete removes it from search results', async () => {
    const m = await muvekkilCaller.create({ ad: TOKEN, soyad: 'Dort' })
    const d = await dosyaCaller.create({ muvekkil_id: m.id, tur: 'AH' })
    await dosyaCaller.delete({ id: d.id })

    const res = await searchCaller.global({ query: TOKEN })
    expect(res.dosyalar.map(r => r.id)).not.toContain(d.id)
    await muvekkilCaller.delete({ id: m.id })
  })
})
