import { createTRPCRouter, protectedProcedure } from '@/lib/trpc/init'
import { TRPCError } from '@trpc/server'
import { db } from '@/lib/db'
import { belge, BELGE_KATEGORILER } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'
import { z } from 'zod'
import fs from 'fs'
import path from 'path'

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
      return row
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      // Get file path first (need it for disk delete)
      const existing = await db.select().from(belge).where(eq(belge.id, input.id))
      if (!existing[0]) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Belge bulunamadı.' })
      }
      
      // Delete DB record first (has FK constraint)
      await db.delete(belge).where(eq(belge.id, input.id))
      
      // Then delete file from E: drive
      // Path: E:/sigorta-belgeler/{dosyaId}/{filename}
      const filePathParts = existing[0].dosya_yolu.replace('/api/files/', '').split('/')
      const fullPath = path.join('E:/sigorta-belgeler', ...filePathParts)
      try { 
        fs.unlinkSync(fullPath) 
      } catch (e) {
        // Log but don't throw — data integrity is primary
        console.error(`Failed to delete file from disk: ${fullPath}`, e)
      }
      
      return { success: true }
    }),
})
