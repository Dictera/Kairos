import { createTRPCRouter, protectedProcedure } from '@/lib/trpc/init'
import { TRPCError } from '@trpc/server'
import { db } from '@/lib/db'
import { belge, BELGE_KATEGORILER } from '@/lib/schema'
import { logOlay } from './olay'
import { eq, desc } from 'drizzle-orm'
import { z } from 'zod'
import fs from 'fs'
import path from 'path'
import { ARCHIVE_BASE, safeUnlinkArchive } from '@/lib/docx/archive'

const belgeKategoriEnum = z.enum(BELGE_KATEGORILER)

export const belgeRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ dosya_id: z.number().int() }))
    .query(async ({ input }) => {
      return db.select().from(belge)
        .where(eq(belge.dosya_id, input.dosya_id))
        .orderBy(desc(belge.created_at))
    }),

  create: protectedProcedure
    .input(z.object({
      dosya_id: z.number().int(),
      dosya_no: z.string(),
      kategori: belgeKategoriEnum,
      dosya_adi: z.string(),
      dosya_yolu: z.string(),
      dosya_boyutu: z.number().int(),
      mime_tur: z.string(),
    }))
    .mutation(async ({ input }) => {
      const [row] = await db.insert(belge).values(input).returning()
      await logOlay(input.dosya_id, 'belge_eklendi', `Belge eklendi: ${input.dosya_adi}`)
      return row
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      const existing = await db.select().from(belge).where(eq(belge.id, input.id))
      if (!existing[0]) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Belge bulunamadı.' })
      }

      await db.delete(belge).where(eq(belge.id, input.id))

      const dosyaYolu = existing[0].dosya_yolu
      if (dosyaYolu) {
        const cleanPath = dosyaYolu.startsWith('/') ? dosyaYolu.slice(1) : dosyaYolu
        const fullPath = path.join(ARCHIVE_BASE, cleanPath)
        safeUnlinkArchive(fullPath)
      }

      await logOlay(existing[0].dosya_id, 'belge_silindi', `Belge silindi: ${existing[0].dosya_adi}`)
      return { success: true }
    }),
})
