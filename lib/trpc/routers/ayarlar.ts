import { createTRPCRouter, protectedProcedure } from '@/lib/trpc/init'
import { TRPCError } from '@trpc/server'
import { db } from '@/lib/db'
import { sigortaSirketi, mahkeme, sigortaTuru, avukat, avukatSigortaSirketi } from '@/lib/schema'
import { eq, asc, and, sql } from 'drizzle-orm'
import { z } from 'zod'

// ── Schemas ────────────────────────────────────────────────────────────────

const adSchema = z.object({ ad: z.string().min(1, 'Ad zorunludur').max(200) })

export const sigortaSirketiSchema = z.object({
  ad: z.string().min(1, 'Ad zorunludur').max(200),
  mersis_no: z.string().max(50).optional().or(z.literal('')),
  vergi_no: z.string()
    .min(1, 'Vergi No zorunludur')
    .regex(/^(\d{10}|\d{11})$/, 'VKN/TCKN 10 veya 11 hane olmalıdır'),
  bagli_oldugu_vergi_dairesi: z.string().max(200).optional().or(z.literal('')),
  ihtar_mail: z.string().email('Geçerli e-posta giriniz').optional().or(z.literal('')),
  kep_mail: z.string().email('Geçerli e-posta giriniz').optional().or(z.literal('')),
})

export const avukatSchema = z.object({
  ad: z.string().min(1, 'Ad zorunludur').max(200),
  tbb_sicil_no: z.string().min(1, 'TBB Sicil No zorunludur').max(50),
  iban: z.string()
    .regex(/^TR\d{24}$/, 'Geçersiz IBAN formatı (TRXXXXXXXXXXXXXXXXXXXXXXXX gerekli)')
    .optional()
    .or(z.literal('')),
  eposta: z.string().email('Geçerli e-posta giriniz').optional().or(z.literal('')),
  telefon: z.string()
    .regex(/^05[0-9]{9}$/, 'Geçersiz telefon formatı (05XXXXXXXXX gerekli)')
    .optional()
    .or(z.literal('')),
})

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