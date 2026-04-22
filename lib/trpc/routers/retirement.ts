import path from 'path'
import fs from 'fs'
import { createTRPCRouter, protectedProcedure } from '@/lib/trpc/init'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

export const retirementRouter = createTRPCRouter({
  checkLegacyTables: protectedProcedure.query(async () => {
    const tables = db.all<{ name: string }>(
      sql`SELECT name FROM sqlite_master WHERE type='table' AND name IN ('dilekce_sablonu', 'dilekce_odt_sablonu')`
    )
    return { hasLegacyTables: tables.length > 0 }
  }),

  executeRetirement: protectedProcedure.mutation(async () => {
    // 1. Delete uploads/odt-templates folder only (NOT the entire uploads/ directory)
    const uploadsDir = path.join(process.cwd(), 'uploads', 'odt-templates')
    if (fs.existsSync(uploadsDir)) {
      fs.rmSync(uploadsDir, { recursive: true, force: true })
    }

    // 2. Drop legacy tables (direct SQL for immediate effect)
    db.run(sql`DROP TABLE IF EXISTS "dilekce_sablonu"`)
    db.run(sql`DROP TABLE IF EXISTS "dilekce_odt_sablonu"`)

    // 3. Set retirement flag in app_settings table
    // Create the table if it doesn't exist
    db.run(sql`
      CREATE TABLE IF NOT EXISTS "app_settings" (
        "key" TEXT PRIMARY KEY NOT NULL,
        "value" TEXT NOT NULL,
        "updated_at" INTEGER DEFAULT (unixepoch())
      )
    `)
    // Upsert the retirement flag
    db.run(sql`
      INSERT INTO "app_settings" ("key", "value") VALUES ('retirement_v1_2_done', '1')
      ON CONFLICT("key") DO UPDATE SET "value" = '1', "updated_at" = unixepoch()
    `)

    return { success: true }
  }),
})