import { createTRPCRouter, protectedProcedure } from '@/lib/trpc/init'
import { TRPCError } from '@trpc/server'
import { db } from '@/lib/db'
import { docxSablon } from '@/lib/schema'
import { sablonCreateSchema, sablonUpdateSchema } from '@/lib/validators/sablon'
import { eq, desc, sql } from 'drizzle-orm'
import { z } from 'zod'
import fs from 'fs'
import path from 'path'
import { runSidecarCommand } from '@/lib/services/docx-pipeline'

const TEMPLATES_BASE_PATH = path.resolve(process.cwd(), 'uploads', 'templates')

function safeUnlink(filePath: string) {
  try {
    if (!path.resolve(filePath).startsWith(TEMPLATES_BASE_PATH)) {
      console.error(`Path traversal attempt: ${filePath}`)
      return
    }
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  } catch (e) {
    console.error(`Failed to delete file from disk: ${filePath}`, e)
  }
}

export const sablonRouter = createTRPCRouter({
  list: protectedProcedure.query(async () => {
    return db.select().from(docxSablon).orderBy(desc(docxSablon.updated_at))
  }),

  create: protectedProcedure
    .input(sablonCreateSchema)
    .mutation(async ({ input }) => {
      const result = await runSidecarCommand({
        command: 'extract-vars',
        params: { file_path: input.filePath },
      })

      if (result.status === 'error') {
        safeUnlink(input.filePath)
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: result.message ?? 'Değişkenler çıkarılamadı.',
        })
      }

      const variables = (result.result as { variables: string[] }).variables

      const [row] = await db.insert(docxSablon).values({
        ad: input.ad,
        kategori: input.kategori,
        dosya_yolu: input.filePath,
        degiskenler: variables,
      }).returning()

      return row
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      const [template] = await db.select().from(docxSablon).where(eq(docxSablon.id, input.id))
      if (!template) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Şablon bulunamadı.' })
      }

      // DB delete first — SET NULL cascade fires on belge.sablon_id (D-08).
      await db.delete(docxSablon).where(eq(docxSablon.id, input.id))

      // Then remove file from disk (best effort, do not throw on failure).
      safeUnlink(template.dosya_yolu)

      return { success: true }
    }),

  update: protectedProcedure  // D-06: overwrite — same id, replace file
    .input(sablonUpdateSchema)
    .mutation(async ({ input }) => {
      const [existing] = await db.select().from(docxSablon).where(eq(docxSablon.id, input.id))
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Şablon bulunamadı.' })
      }

      const result = await runSidecarCommand({
        command: 'extract-vars',
        params: { file_path: input.filePath },
      })

      if (result.status === 'error') {
        safeUnlink(input.filePath)
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: result.message ?? 'Değişkenler çıkarılamadı.',
        })
      }

      const variables = (result.result as { variables: string[] }).variables

      // Remove old file BEFORE updating DB so a failed unlink leaves the old row pointing
      // at a still-valid file (replaced new file). safeUnlink swallows errors per pattern.
      safeUnlink(existing.dosya_yolu)

      const [updated] = await db.update(docxSablon)
        .set({
          dosya_yolu: input.filePath,
          degiskenler: variables,
          updated_at: sql`(datetime('now'))`,
        })
        .where(eq(docxSablon.id, input.id))
        .returning()

      return updated
    }),
})
