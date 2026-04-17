import { createTRPCRouter, protectedProcedure } from '@/lib/trpc/init'
import { TRPCError } from '@trpc/server'
import { db } from '@/lib/db'
import { sigortaSirketi, mahkeme, sigortaTuru, avukat, avukatSigortaSirketi, dosya, taraf } from '@/lib/schema'
import { eq, asc, and, sql } from 'drizzle-orm'
import { z } from 'zod'
import { sigortaSirketiSchema, avukatSchema } from '@/lib/validators/ayarlar'

// Re-export schemas so existing test imports continue to work
export { sigortaSirketiSchema, avukatSchema }

const adSchema = z.object({ ad: z.string().min(1, 'Ad zorunludur').max(200) })

// Mahkeme keeps its own schema (ad + sehir)
const mahkemeSchema = z.object({
  ad: z.string().min(1, 'Ad zorunludur').max(200),
  sehir: z.string().max(100).optional().or(z.literal('')),
})

// ── Generic CRUD helper (now narrowed to mahkeme | sigortaTuru only) ───────

function makeCrudRouter(
  table: typeof mahkeme | typeof sigortaTuru,
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

// ── Router ──────────────────────────────────────────────────────────────────

export const ayarlarRouter = createTRPCRouter({
  sigortaSirketi: createTRPCRouter({
    list: protectedProcedure.query(async () => {
      return db.select().from(sigortaSirketi).orderBy(asc(sigortaSirketi.ad))
    }),
    listWithAvukatlar: protectedProcedure.query(async () => {
      return db.query.sigortaSirketi.findMany({
        with: { avukatlar: { with: { avukat: true } } },
        orderBy: asc(sigortaSirketi.ad),
      })
    }),
    create: protectedProcedure.input(sigortaSirketiSchema).mutation(async ({ input }) => {
      const [row] = await db.insert(sigortaSirketi).values(input).returning()
      return row
    }),
    update: protectedProcedure
      .input(sigortaSirketiSchema.extend({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input
        const [row] = await db.update(sigortaSirketi).set(data).where(eq(sigortaSirketi.id, id)).returning()
        if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'Sigorta şirketi bulunamadı.' })
        return row
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        await db.update(dosya).set({ karsitaraf_sigorta_id: null }).where(eq(dosya.karsitaraf_sigorta_id, input.id))
        await db.update(taraf).set({ sigorta_sirketi_id: null }).where(eq(taraf.sigorta_sirketi_id, input.id))
        await db.delete(sigortaSirketi).where(eq(sigortaSirketi.id, input.id))
        return { success: true }
      }),
  }),

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

  avukat: createTRPCRouter({
    list: protectedProcedure.query(async () => {
      return db.select().from(avukat).orderBy(asc(avukat.ad))
    }),
    bySirket: protectedProcedure
      .input(z.object({ sigorta_sirketi_id: z.number().int() }))
      .query(async ({ input }) => {
        return db.select({
          id: avukat.id,
          ad: avukat.ad,
          tbb_sicil_no: avukat.tbb_sicil_no,
        })
          .from(avukatSigortaSirketi)
          .innerJoin(avukat, eq(avukatSigortaSirketi.avukat_id, avukat.id))
          .where(eq(avukatSigortaSirketi.sigorta_sirketi_id, input.sigorta_sirketi_id))
          .orderBy(asc(avukat.ad))
      }),
    create: protectedProcedure.input(avukatSchema).mutation(async ({ input }) => {
      const [row] = await db.insert(avukat).values(input).returning()
      return row
    }),
    update: protectedProcedure
      .input(avukatSchema.extend({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input
        const [row] = await db.update(avukat)
          .set({ ...data, updated_at: sql`(datetime('now'))` })
          .where(eq(avukat.id, id))
          .returning()
        if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'Avukat bulunamadı.' })
        return row
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        await db.delete(avukat).where(eq(avukat.id, input.id))
        return { success: true }
      }),
    addSirket: protectedProcedure
      .input(z.object({ avukat_id: z.number().int(), sigorta_sirketi_id: z.number().int() }))
      .mutation(async ({ input }) => {
        await db.insert(avukatSigortaSirketi).values(input).onConflictDoNothing()
        return { success: true }
      }),
    removeSirket: protectedProcedure
      .input(z.object({ avukat_id: z.number().int(), sigorta_sirketi_id: z.number().int() }))
      .mutation(async ({ input }) => {
        await db.delete(avukatSigortaSirketi).where(
          and(
            eq(avukatSigortaSirketi.avukat_id, input.avukat_id),
            eq(avukatSigortaSirketi.sigorta_sirketi_id, input.sigorta_sirketi_id),
          )
        )
        return { success: true }
      }),
  }),
})