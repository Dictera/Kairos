import { createTRPCRouter, protectedProcedure } from '@/lib/trpc/init'
import { TRPCError } from '@trpc/server'
import { db } from '@/lib/db'
import { sigortaSirketi, mahkeme, sigortaTuru } from '@/lib/schema'
import { eq, asc } from 'drizzle-orm'
import { z } from 'zod'

const adSchema = z.object({ ad: z.string().min(1, 'Ad zorunludur').max(200) })

function makeCrudRouter(
  table: typeof sigortaSirketi | typeof mahkeme | typeof sigortaTuru,
  entityName: string
) {
  return createTRPCRouter({
    list: protectedProcedure.query(async () => {
      return db.select().from(table).orderBy(asc(table.ad))
    }),
    create: protectedProcedure.input(adSchema).mutation(async ({ input }) => {
      const [row] = await db.insert(table).values(input).returning()
      return row
    }),
    update: protectedProcedure
      .input(adSchema.extend({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input
        const [row] = await db.update(table).set(data).where(eq(table.id, id)).returning()
        if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: `${entityName} bulunamadı.` })
        return row
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        await db.delete(table).where(eq(table.id, input.id))
        return { success: true }
      }),
  })
}

// Mahkeme has an extra 'sehir' field — needs custom handling
const mahkemeSchema = z.object({
  ad: z.string().min(1, 'Ad zorunludur').max(200),
  sehir: z.string().max(100).optional().or(z.literal('')),
})

export const ayarlarRouter = createTRPCRouter({
  sigortaSirketi: makeCrudRouter(sigortaSirketi, 'Sigorta şirketi'),
  sigortaTuru: makeCrudRouter(sigortaTuru, 'Sigorta türü'),
  mahkeme: createTRPCRouter({
    list: protectedProcedure.query(async () =>
      db.select().from(mahkeme).orderBy(asc(mahkeme.ad))
    ),
    create: protectedProcedure.input(mahkemeSchema).mutation(async ({ input }) => {
      const [row] = await db.insert(mahkeme).values(input).returning()
      return row
    }),
    update: protectedProcedure
      .input(mahkemeSchema.extend({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input
        const [row] = await db.update(mahkeme).set(data).where(eq(mahkeme.id, id)).returning()
        if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'Mahkeme bulunamadı.' })
        return row
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        await db.delete(mahkeme).where(eq(mahkeme.id, input.id))
        return { success: true }
      }),
  }),
})
