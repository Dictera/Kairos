import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core'

// Proof-of-concept table: proves generate+migrate workflow works end-to-end.
// Phase 2 adds all real entity tables (muvekkil, dosya, taraf, etc.).
export const schemaTest = sqliteTable('schema_test', {
  id: int().primaryKey({ autoIncrement: true }),
  value: text().notNull(),
})
