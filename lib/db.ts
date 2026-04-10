// IMPORTANT: This module is SERVER-ONLY. It must only be imported from server
// components, route handlers, and tRPC routers — never from client components.
// Next.js serverExternalPackages: ['better-sqlite3'] prevents client bundling.
// If 'server-only' package is added later, add: import 'server-only'

import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'

// globalThis singleton prevents multiple SQLite connections during Next.js hot reload.
// Each reload re-executes this module but reuses the existing connection.
const globalForDb = globalThis as unknown as {
  db: ReturnType<typeof drizzle<typeof schema>> | undefined
}

function createDb() {
  const sqlite = new Database('./data/db.sqlite')
  // WAL mode: must be set on instance, NOT in migration SQL (cannot run in transactions)
  sqlite.pragma('journal_mode = WAL')
  // busy_timeout: wait up to 5s when another writer holds the lock
  sqlite.pragma('busy_timeout = 5000')
  // foreign_keys: enforce FK constraints (SQLite disables them by default)
  sqlite.pragma('foreign_keys = ON')
  return drizzle({ client: sqlite, schema })
}

export const db = globalForDb.db ?? (globalForDb.db = createDb())
