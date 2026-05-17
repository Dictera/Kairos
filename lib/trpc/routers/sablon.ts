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
    const resolved = path.resolve(filePath)
    const baseResolved = path.resolve(TEMPLATES_BASE_PATH)
    const rel = path.relative(baseResolved, resolved)
    if (rel.startsWith('..') || path.isAbsolute(rel)) {
      return
    }
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  } catch (e) {
    // Swallow errors per pattern
  }
}

export const sablonRouter = createTRPCRouter({
  list: protectedProcedure.query(async () => {
    return db.select().from(docxSablon).orderBy(desc(docxSablon.updated_at))
  }),

  create: protectedProcedure
    .input(sablonCreateSchema)
    .mutation(async ({ input }) => {
      const filePath = path.join(TEMPLATES_BASE_PATH, path.basename(input.filename))
      if (!path.resolve(filePath).startsWith(TEMPLATES_BASE_PATH + path.sep)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Geçersiz şablon dosya yolu.' })
      }
      const result = await runSidecarCommand({
        command: 'extract-vars',
        params: { file_path: filePath },
      })

      if (result.status === 'error') {
        safeUnlink(filePath)
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: result.message ?? 'Değişkenler çıkarılamadı.',
        })
      }

      const variables = (result.result as { variables: string[] }).variables

      const [row] = await db.insert(docxSablon).values({
        ad: input.ad,
        kategori: input.kategori,
        dosya_yolu: filePath,
        degiskenler: variables,
        belge_turu: input.belge_turu ?? null,
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

      const newFilePath = path.join(TEMPLATES_BASE_PATH, path.basename(input.filename))
      if (!path.resolve(newFilePath).startsWith(TEMPLATES_BASE_PATH + path.sep)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Geçersiz şablon dosya yolu.' })
      }

      const result = await runSidecarCommand({
        command: 'extract-vars',
        params: { file_path: newFilePath },
      })

      if (result.status === 'error') {
        safeUnlink(newFilePath)
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
          dosya_yolu: newFilePath,
          degiskenler: variables,
          belge_turu: input.belge_turu ?? null,
          updated_at: sql`(datetime('now'))`,
        })
        .where(eq(docxSablon.id, input.id))
        .returning()

      return updated
    }),
})
