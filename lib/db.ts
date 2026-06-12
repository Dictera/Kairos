// IMPORTANT: This module is SERVER-ONLY. It must only be imported from server
// components, route handlers, and tRPC routers — never from client components.
// Next.js serverExternalPackages: ['better-sqlite3'] prevents client bundling.
// If 'server-only' package is added later, add: import 'server-only'

import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'
import { foldTr, dosyaFtsText, muvekkilFtsText } from './turkish'

const globalForDb = globalThis as unknown as {
  db: ReturnType<typeof drizzle<typeof schema>> | undefined
}

const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build'

function createDb() {
  const sqlite = new Database('./data/db.sqlite')
  // WAL mode: must be set on instance, NOT in migration SQL (cannot run in transactions)
  sqlite.pragma('journal_mode = WAL')
  // synchronous = NORMAL: safe with WAL (only loses last txn on OS crash, never corrupts),
  // and faster than the better-sqlite3 default of FULL. Single-user local app — no data-loss risk.
  sqlite.pragma('synchronous = NORMAL')
  // cache_size: negative = KiB. -16000 ≈ 16 MB page cache (default is ~2 MB).
  sqlite.pragma('cache_size = -16000')
  // temp_store = MEMORY: keep temp B-trees / sort buffers in RAM, not on disk.
  sqlite.pragma('temp_store = MEMORY')
  // mmap_size: 256 MB memory-mapped I/O — fewer read() syscalls on hot pages.
  sqlite.pragma('mmap_size = 268435456')
  // busy_timeout: wait up to 5s when another writer holds the lock
  sqlite.pragma('busy_timeout = 5000')
  // foreign_keys: enforce FK constraints (SQLite disables them by default)
  sqlite.pragma('foreign_keys = ON')
  // lower_tr: Turkish-aware lowercase for case-insensitive LIKE search.
  // SQLite LIKE is ASCII-only; foldTr covers ş→s, ğ→g, ü→u, ö→o, ç→c, ı→i, İ→i.
  // Used in the <3-char LIKE fallback: sql`lower_tr(col) LIKE lower_tr(${pattern})`
  // IMPORTANT: must be registered BEFORE drizzle() wraps the connection.
  // Shares foldTr() with the FTS index so both normalize text identically.
  sqlite.function('lower_tr', (s: unknown) => foldTr(s))

  // FTS5 trigram indexes and backfill are WRITE operations that cause SQLITE_BUSY
  // when Next.js build spawns multiple workers that import this module concurrently.
  // Skip all FTS setup during build; it will run on first request at runtime.
  if (!isBuildPhase) {
    sqlite.exec(`CREATE VIRTUAL TABLE IF NOT EXISTS dosya_fts USING fts5(txt, tokenize='trigram')`)
    sqlite.exec(`CREATE VIRTUAL TABLE IF NOT EXISTS muvekkil_fts USING fts5(txt, tokenize='trigram')`)
    backfillFts(sqlite)
  }

  return drizzle({ client: sqlite, schema })
}

// One-time population of the FTS tables when empty but the source tables are not
// (first run after this feature ships, or after a manual rebuild). Cheap no-op
// afterwards — just two COUNT checks. All ongoing sync happens in tRPC mutations.
function backfillFts(sqlite: Database.Database) {
  // The base tables may not exist yet — e.g. during `next build` page-data
  // collection on CI, where the module is imported against a fresh db.sqlite
  // before migrations run. Backfill is a best-effort optimization, so skip a
  // table until it is present rather than throwing "no such table".
  const hasTable = (name: string) =>
    sqlite.prepare(`SELECT 1 FROM sqlite_master WHERE type='table' AND name=?`).get(name) !== undefined

  if (hasTable('dosya')) {
    const dosyaNeeds = sqlite.prepare(
      `SELECT (SELECT count(*) FROM dosya_fts) = 0 AND (SELECT count(*) FROM dosya) > 0 AS n`
    ).get() as { n: number }
    if (dosyaNeeds.n) {
      const rows = sqlite.prepare(
        `SELECT d.id, d.dosya_no, d.hasar_dosya_no, d.muvekkil_plaka, m.ad, m.soyad
           FROM dosya d LEFT JOIN muvekkil m ON m.id = d.muvekkil_id`
      ).all() as Array<{ id: number; dosya_no: string | null; hasar_dosya_no: string | null; muvekkil_plaka: string | null; ad: string | null; soyad: string | null }>
      const ins = sqlite.prepare(`INSERT INTO dosya_fts(rowid, txt) VALUES (?, ?)`)
      sqlite.transaction(() => { for (const r of rows) ins.run(r.id, dosyaFtsText(r)) })()
    }
  }

  if (hasTable('muvekkil')) {
    const muvekkilNeeds = sqlite.prepare(
      `SELECT (SELECT count(*) FROM muvekkil_fts) = 0 AND (SELECT count(*) FROM muvekkil) > 0 AS n`
    ).get() as { n: number }
    if (muvekkilNeeds.n) {
      const rows = sqlite.prepare(
        `SELECT id, ad, soyad, tc_vergi_no, telefon FROM muvekkil`
      ).all() as Array<{ id: number; ad: string | null; soyad: string | null; tc_vergi_no: string | null; telefon: string | null }>
      const ins = sqlite.prepare(`INSERT INTO muvekkil_fts(rowid, txt) VALUES (?, ?)`)
      sqlite.transaction(() => { for (const r of rows) ins.run(r.id, muvekkilFtsText(r)) })()
    }
  }
}

// Lazy getter: the db connection is only created when first accessed, not at
// module import time. During `next build`, multiple workers import this module
// to collect page data; a static `export const db = createDb()` would fire
// immediately and WRITE-lock the SQLite database (FTS setup + backfill),
// causing SQLITE_BUSY. With the getter, the connection is deferred until an
// actual request hits a route handler — build workers never trigger it.
export const db: ReturnType<typeof createDb> = new Proxy({} as ReturnType<typeof createDb>, {
  get(_target, prop, receiver) {
    if (!globalForDb.db) globalForDb.db = createDb()
    return Reflect.get(globalForDb.db, prop, receiver)
  },
})

// Transaction client type — the `tx` passed into db.transaction((tx) => …).
// better-sqlite3 transactions are SYNCHRONOUS: the callback must not be async,
// and queries inside it use the sync runners (.run()/.get()/.all()), never await.
export type Transaction = Parameters<Parameters<ReturnType<typeof createDb>['transaction']>[0]>[0]
