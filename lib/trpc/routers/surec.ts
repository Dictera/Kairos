import { createTRPCRouter, protectedProcedure } from '@/lib/trpc/init'
import { TRPCError } from '@trpc/server'
import { db } from '@/lib/db'
import {
  dosya, durusma,
  STK_ASAMALAR, MAHKEME_ASAMALAR,
  parseSurecDetay, serializeSurecDetay,
  type SurecDetay, type StkSurecData, type MahkemeSurecData,
} from '@/lib/schema'
import { eq, asc, sql } from 'drizzle-orm'
import { z } from 'zod'

// ── Helpers ──────────────────────────────────────────────────────────────────

function nextAsama<T extends string>(stages: readonly T[], current: T | null): T | null {
  if (!current) return stages[0]
  const idx = stages.indexOf(current)
  if (idx === -1 || idx === stages.length - 1) return null
  return stages[idx + 1]
}

// ── Zod schemas ──────────────────────────────────────────────────────────────

const stkDataSchema = z.object({
  basvuru_no: z.string().max(100).nullable().optional(),
  basvuru_tarihi: z.string().max(10).nullable().optional(),
  kabul_tarihi: z.string().max(10).nullable().optional(),
  raportor_adi: z.string().max(200).nullable().optional(),
  bilirkisi: z.string().max(200).nullable().optional(),
  hakem_karar_tarihi: z.string().max(10).nullable().optional(),
  tebligat_tarihi: z.string().max(10).nullable().optional(),
  itiraz_tarihi: z.string().max(10).nullable().optional(),
})

const mahkemeDataSchema = z.object({
  esas_no: z.string().max(100).nullable().optional(),
  karar_no: z.string().max(100).nullable().optional(),
  mahkeme_adi: z.string().max(200).nullable().optional(),
  dava_tarihi: z.string().max(10).nullable().optional(),
  tebligat_tarihi: z.string().max(10).nullable().optional(),
  karar_tarihi: z.string().max(10).nullable().optional(),
})

const durusmaCreateSchema = z.object({
  dosya_id: z.number().int(),
  tarih: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Geçersiz tarih formatı'),
  saat: z.string().max(10).optional().or(z.literal('')),
  mahkeme_kurum: z.string().max(200).optional().or(z.literal('')),
  tur: z.string().max(100).optional().or(z.literal('')),
  notlar: z.string().max(2000).optional().or(z.literal('')),
})

const durusmaUpdateSchema = z.object({
  id: z.number().int(),
  tarih: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Geçersiz tarih formatı'),
  saat: z.string().max(10).optional().or(z.literal('')),
  mahkeme_kurum: z.string().max(200).optional().or(z.literal('')),
  tur: z.string().max(100).optional().or(z.literal('')),
  notlar: z.string().max(2000).optional().or(z.literal('')),
})

// ── Router ───────────────────────────────────────────────────────────────────

export const surecRouter = createTRPCRouter({
  // D-06: Update STK data fields independently of stage
  updateStkData: protectedProcedure
    .input(z.object({ dosya_id: z.number().int(), data: stkDataSchema }))
    .mutation(async ({ input }) => {
      const row = await db.select({ surec_detay: dosya.surec_detay })
        .from(dosya).where(eq(dosya.id, input.dosya_id)).then(r => r[0])
      if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'Dosya bulunamadı.' })

      const surec = parseSurecDetay(row.surec_detay)
      const updated: SurecDetay = {
        ...surec,
        stk: { ...(surec.stk ?? { asama: null, basvuru_no: null, basvuru_tarihi: null, kabul_tarihi: null, raportor_adi: null, bilirkisi: null, hakem_karar_tarihi: null, tebligat_tarihi: null, itiraz_tarihi: null }), ...input.data } as StkSurecData,
      }
      await db.update(dosya)
        .set({ surec_detay: serializeSurecDetay(updated), updated_at: sql`(datetime('now'))` })
        .where(eq(dosya.id, input.dosya_id))
      return { success: true }
    }),

  // D-03, D-04: Advance STK stage sequentially, no back-step
  stkIleriAl: protectedProcedure
    .input(z.object({ dosya_id: z.number().int() }))
    .mutation(async ({ input }) => {
      const row = await db.select({ surec_detay: dosya.surec_detay })
        .from(dosya).where(eq(dosya.id, input.dosya_id)).then(r => r[0])
      if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'Dosya bulunamadı.' })

      const surec = parseSurecDetay(row.surec_detay)
      const currentAsama = surec.stk?.asama ?? null
      const next = nextAsama(STK_ASAMALAR, currentAsama)
      if (!next) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Son aşamaya ulaşıldı.' })

      const updated: SurecDetay = {
        ...surec,
        stk: { ...(surec.stk ?? { basvuru_no: null, basvuru_tarihi: null, kabul_tarihi: null, raportor_adi: null, bilirkisi: null, hakem_karar_tarihi: null, tebligat_tarihi: null, itiraz_tarihi: null }), asama: next } as StkSurecData,
      }
      await db.update(dosya)
        .set({ surec_detay: serializeSurecDetay(updated), updated_at: sql`(datetime('now'))` })
        .where(eq(dosya.id, input.dosya_id))
      return { asama: next }
    }),

  // D-06: Update Mahkeme data fields independently of stage
  updateMahkemeData: protectedProcedure
    .input(z.object({ dosya_id: z.number().int(), data: mahkemeDataSchema }))
    .mutation(async ({ input }) => {
      const row = await db.select({ surec_detay: dosya.surec_detay })
        .from(dosya).where(eq(dosya.id, input.dosya_id)).then(r => r[0])
      if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'Dosya bulunamadı.' })

      const surec = parseSurecDetay(row.surec_detay)
      const updated: SurecDetay = {
        ...surec,
        mahkeme: { ...(surec.mahkeme ?? { asama: null, esas_no: null, karar_no: null, mahkeme_adi: null, dava_tarihi: null, tebligat_tarihi: null, karar_tarihi: null }), ...input.data } as MahkemeSurecData,
      }
      await db.update(dosya)
        .set({ surec_detay: serializeSurecDetay(updated), updated_at: sql`(datetime('now'))` })
        .where(eq(dosya.id, input.dosya_id))
      return { success: true }
    }),

  // Advance Mahkeme stage sequentially
  mahkemeIleriAl: protectedProcedure
    .input(z.object({ dosya_id: z.number().int() }))
    .mutation(async ({ input }) => {
      const row = await db.select({ surec_detay: dosya.surec_detay })
        .from(dosya).where(eq(dosya.id, input.dosya_id)).then(r => r[0])
      if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'Dosya bulunamadı.' })

      const surec = parseSurecDetay(row.surec_detay)
      const currentAsama = surec.mahkeme?.asama ?? null
      const next = nextAsama(MAHKEME_ASAMALAR, currentAsama)
      if (!next) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Son aşamaya ulaşıldı.' })

      const updated: SurecDetay = {
        ...surec,
        mahkeme: { ...(surec.mahkeme ?? { esas_no: null, karar_no: null, mahkeme_adi: null, dava_tarihi: null, tebligat_tarihi: null, karar_tarihi: null }), asama: next } as MahkemeSurecData,
      }
      await db.update(dosya)
        .set({ surec_detay: serializeSurecDetay(updated), updated_at: sql`(datetime('now'))` })
        .where(eq(dosya.id, input.dosya_id))
      return { asama: next }
    }),

  // D-01: Initialize mahkeme section for STK files
  initMahkemeSurec: protectedProcedure
    .input(z.object({ dosya_id: z.number().int() }))
    .mutation(async ({ input }) => {
      const row = await db.select({ surec_detay: dosya.surec_detay })
        .from(dosya).where(eq(dosya.id, input.dosya_id)).then(r => r[0])
      if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'Dosya bulunamadı.' })

      const surec = parseSurecDetay(row.surec_detay)
      if (surec.mahkeme) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Mahkeme süreci zaten başlatılmış.' })

      const updated: SurecDetay = {
        ...surec,
        mahkeme: { asama: null, esas_no: null, karar_no: null, mahkeme_adi: null, dava_tarihi: null, tebligat_tarihi: null, karar_tarihi: null },
      }
      await db.update(dosya)
        .set({ surec_detay: serializeSurecDetay(updated), updated_at: sql`(datetime('now'))` })
        .where(eq(dosya.id, input.dosya_id))
      return { success: true }
    }),

  // SUREC-05: Durusma CRUD
  durusmaList: protectedProcedure
    .input(z.object({ dosya_id: z.number().int() }))
    .query(async ({ input }) => {
      return db.select().from(durusma)
        .where(eq(durusma.dosya_id, input.dosya_id))
        .orderBy(asc(durusma.tarih))
    }),

  durusmaCreate: protectedProcedure
    .input(durusmaCreateSchema)
    .mutation(async ({ input }) => {
      const [row] = await db.insert(durusma).values(input).returning()
      return row
    }),

  durusmaUpdate: protectedProcedure
    .input(durusmaUpdateSchema)
    .mutation(async ({ input }) => {
      const { id, ...data } = input
      const [row] = await db.update(durusma).set(data).where(eq(durusma.id, id)).returning()
      if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'Duruşma bulunamadı.' })
      return row
    }),

  durusmaDelete: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      await db.delete(durusma).where(eq(durusma.id, input.id))
      return { success: true }
    }),
})
