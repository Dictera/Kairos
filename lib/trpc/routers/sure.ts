import { createTRPCRouter, protectedProcedure } from '@/lib/trpc/init'
import { TRPCError } from '@trpc/server'
import { db } from '@/lib/db'
import { sure } from '@/lib/schema'
import { eq, asc } from 'drizzle-orm'
import { z } from 'zod'

const dateRegex = /^\d{4}-\d{2}-\d{2}$/

const manuelSureCreateSchema = z.object({
  dosya_id: z.number().int(),
  ad: z.string().min(1).max(100),
  son_tarih: z.string().regex(dateRegex, 'Geçersiz tarih formatı (YYYY-MM-DD)'),
  notlar: z.string().max(500).optional().or(z.literal('')),
})

const manuelSureUpdateSchema = z.object({
  id: z.number().int(),
  ad: z.string().min(1).max(100),
  son_tarih: z.string().regex(dateRegex, 'Geçersiz tarih formatı (YYYY-MM-DD)'),
  notlar: z.string().max(500).optional().or(z.literal('')),
})

export const sureRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ dosya_id: z.number().int() }))
    .query(async ({ input }) => {
      return db.select().from(sure)
        .where(eq(sure.dosya_id, input.dosya_id))
        .orderBy(asc(sure.son_tarih))
    }),

  createManuel: protectedProcedure
    .input(manuelSureCreateSchema)
    .mutation(async ({ input }) => {
      const [row] = await db.insert(sure).values({
        dosya_id: input.dosya_id,
        ad: input.ad,
        son_tarih: input.son_tarih,
        tur: 'manuel',
        notlar: input.notlar || null,
      }).returning()
      return row
    }),

  updateManuel: protectedProcedure
    .input(manuelSureUpdateSchema)
    .mutation(async ({ input }) => {
      const { id, ...data } = input
      const [row] = await db.update(sure)
        .set({ ad: data.ad, son_tarih: data.son_tarih, notlar: data.notlar || null })
        .where(eq(sure.id, id))
        .returning()
      if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'Süre bulunamadı.' })
      return row
    }),

  deleteSure: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      await db.delete(sure).where(eq(sure.id, input.id))
      return { success: true }
    }),
})
