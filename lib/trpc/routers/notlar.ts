import { createTRPCRouter, protectedProcedure } from '@/lib/trpc/init'
import { TRPCError } from '@trpc/server'
import { db } from '@/lib/db'
import { dosyaNot } from '@/lib/schema'
import { eq, desc, sql } from 'drizzle-orm'
import { z } from 'zod'
import { logOlayTx } from './olay'

export const notlarRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ dosya_id: z.number().int() }))
    .query(async ({ input }) => {
      return db.select().from(dosyaNot)
        .where(eq(dosyaNot.dosya_id, input.dosya_id))
        .orderBy(desc(dosyaNot.created_at))
    }),

  create: protectedProcedure
    .input(z.object({
      dosya_id: z.number().int(),
      icerik: z.string().min(1, 'Not içeriği zorunludur').max(5000),
    }))
    .mutation(async ({ input }) => {
      return db.transaction((tx) => {
        const row = tx.insert(dosyaNot).values(input).returning().get()
        logOlayTx(tx, input.dosya_id, 'not', 'Not eklendi')
        return row
      })
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number().int(),
      icerik: z.string().min(1, 'Not içeriği zorunludur').max(5000),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input
      return db.transaction((tx) => {
        // Get the note's dosya_id before updating
        const existing = tx.select({ dosya_id: dosyaNot.dosya_id })
          .from(dosyaNot).where(eq(dosyaNot.id, id)).get()
        if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'Not bulunamadı.' })
        const row = tx
          .update(dosyaNot)
          .set({ ...data, updated_at: sql`(datetime('now'))` })
          .where(eq(dosyaNot.id, id))
          .returning()
          .get()
        if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'Not bulunamadı.' })
        logOlayTx(tx, existing.dosya_id, 'not', 'Not güncellendi')
        return row
      })
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      return db.transaction((tx) => {
        // Get the note's dosya_id before deleting
        const existing = tx.select({ dosya_id: dosyaNot.dosya_id })
          .from(dosyaNot).where(eq(dosyaNot.id, input.id)).get()
        if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'Not bulunamadı.' })
        tx.delete(dosyaNot).where(eq(dosyaNot.id, input.id)).run()
        logOlayTx(tx, existing.dosya_id, 'not', 'Not silindi')
        return { success: true }
      })
    }),
})
