import { createTRPCRouter, protectedProcedure } from '@/lib/trpc/init'
import { db } from '@/lib/db'
import { dilekceSablonu } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'
import { z } from 'zod'

const sablonKategoriEnum = z.enum(['STK', 'Mahkeme', 'Genel'])

export const dilekceRouter = createTRPCRouter({
  list: protectedProcedure.query(async () => {
    return db.select().from(dilekceSablonu).orderBy(desc(dilekceSablonu.updated_at))
  }),

  byId: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const row = await db.select().from(dilekceSablonu).where(eq(dilekceSablonu.id, input.id))
      if (!row[0]) {
        throw new Error('Şablon bulunamadı.')
      }
      return row[0]
    }),

  create: protectedProcedure
    .input(z.object({
      baslik: z.string().min(1).max(200),
      icerik: z.string().min(1),
      kategori: sablonKategoriEnum,
      degiskenler: z.array(z.string()).default([]),
    }))
    .mutation(async ({ input }) => {
      const [row] = await db.insert(dilekceSablonu).values({
        ...input,
        degiskenler: JSON.stringify(input.degiskenler),
      }).returning()
      return row
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      baslik: z.string().min(1).max(200).optional(),
      icerik: z.string().min(1).optional(),
      kategori: sablonKategoriEnum.optional(),
      degiskenler: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...values } = input
      const updateData: Record<string, unknown> = { ...values }
      if (values.degiskenler !== undefined) {
        updateData.degiskenler = JSON.stringify(values.degiskenler)
      }
      updateData.updated_at = new Date().toISOString()
      
      const [row] = await db.update(dilekceSablonu).set(updateData)
        .where(eq(dilekceSablonu.id, id)).returning()
      return row
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.delete(dilekceSablonu).where(eq(dilekceSablonu.id, input.id))
      return { success: true }
    }),
})