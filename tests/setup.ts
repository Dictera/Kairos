// Shared test setup — in-memory SQLite with all migrations
import { beforeAll, afterAll, vi } from 'vitest'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from '@/lib/schema'
import path from 'path'
import fs from 'fs'
import os from 'os'

// Set test-specific env vars before importing any module that reads them
process.env.TEST_BELGELER_BASE = path.join(os.tmpdir(), 'sigorta-test-belgeler')
fs.mkdirSync(process.env.TEST_BELGELER_BASE, { recursive: true })

// Global test DB — in-memory SQLite with migrations applied
declare global {
  var __testDb: ReturnType<typeof drizzle<typeof schema>> | undefined
  var __testSqlite: Database.Database | undefined
}

const migrationsDir = path.resolve(process.cwd(), 'drizzle')

const migrationFiles = fs
  .readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql'))
  .sort()

function applyMigrations(sqlite: Database.Database) {
  for (const file of migrationFiles) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8')
    const statements = sql
      .split('--> statement-breakpoint')
      .map((s) => s.trim())
      .filter(Boolean)
    for (const stmt of statements) {
      try {
        sqlite.exec(stmt)
      } catch {
        // Some migrations may fail on in-memory DB (e.g. ALTER TABLE DROP COLUMN)
      }
    }
  }
}

// Create in-memory DB once at module load (before vi.mock hoisting)
const testSqlite = new Database(':memory:')
testSqlite.pragma('foreign_keys = ON')
testSqlite.function('lower_tr', (s: unknown) =>
  String(s ?? '')
    .toLowerCase()
    .replace(/ş/g, 's').replace(/Ş/g, 's')
    .replace(/ğ/g, 'g').replace(/Ğ/g, 'g')
    .replace(/ü/g, 'u').replace(/Ü/g, 'u')
    .replace(/ö/g, 'o').replace(/Ö/g, 'o')
    .replace(/ç/g, 'c').replace(/Ç/g, 'c')
    .replace(/ı/g, 'i').replace(/İ/g, 'i')
)

applyMigrations(testSqlite)

const testDb = drizzle({ client: testSqlite, schema })
globalThis.__testDb = testDb
globalThis.__testSqlite = testSqlite

// Mock @/lib/db at module level (hoisted to top by vitest)
vi.mock('@/lib/db', () => ({ db: testDb }))

beforeAll(() => {
  // DB already created at module level
})

afterAll(() => {
  globalThis.__testSqlite?.close()
  globalThis.__testDb = undefined
  globalThis.__testSqlite = undefined
})
