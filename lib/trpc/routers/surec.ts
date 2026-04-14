import { createTRPCRouter, protectedProcedure } from '@/lib/trpc/init'
import { TRPCError } from '@trpc/server'
import { db } from '@/lib/db'
import {
  dosya, durusma, sure,
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

function prevAsama<T extends string>(stages: readonly T[], current: T | null): T | null {
  if (!current) return null
  const idx = stages.indexOf(current)
  if (idx <= 0) return null
  return stages[idx - 1]
}

// ── Zod schemas ──────────────────────────────────────────────────────────────

const stkDataSchema = z.object({
  ihtar_tarihi: z.string().max(10).nullable().optional(),
  arabuluculuk_son_tutanak_tarihi: z.string().max(10).nullable().optional(),
  basvuru_tarihi: z.string().max(10).nullable().optional(),
  stk_esas_no: z.string().max(100).nullable().optional(),
  stk_karar_no: z.string().max(100).nullable().optional(),
  stk_itiraz_esas_no: z.string().max(100).nullable().optional(),
  stk_itiraz_karar_no: z.string().max(100).nullable().optional(),
  bilirkisi_ucret_talep_tarihi: z.string().max(10).nullable().optional(),
  bilirkisi_raporu_tebliğ_tarihi: z.string().max(10).nullable().optional(),
  islah_tarihi: z.string().max(10).nullable().optional(),
  karar_tarihi: z.string().max(10).nullable().optional(),
  kesinlesme_tarihi: z.string().max(10).nullable().optional(),
})

const mahkemeDataSchema = z.object({
  ilk_derece_esas_no: z.string().max(100).nullable().optional(),
  ilk_derece_karar_no: z.string().max(100).nullable().optional(),
  ilk_derece_mahkeme_adi: z.string().max(200).nullable().optional(),
  istinaf_esas_no: z.string().max(100).nullable().optional(),
  istinaf_karar_no: z.string().max(100).nullable().optional(),
  istinaf_mahkeme_adi: z.string().max(200).nullable().optional(),
  temyiz_esas_no: z.string().max(100).nullable().optional(),
  temyiz_karar_no: z.string().max(100).nullable().optional(),
  temyiz_mahkeme_adi: z.string().max(200).nullable().optional(),
  dava_dilekcesi_tebliğ_tarihi: z.string().max(10).nullable().optional(),
  cevap_dilekcesi_tebliğ_tarihi: z.string().max(10).nullable().optional(),
  replik_dilekcesi_tebliğ_tarihi: z.string().max(10).nullable().optional(),
  duplik_dilekcesi_tebliğ_tarihi: z.string().max(10).nullable().optional(),
  bilirkisi_ucret_talep_tarihi: z.string().max(10).nullable().optional(),
  bilirkisi_raporu_tebliğ_tarihi: z.string().max(10).nullable().optional(),
  karar_tebliğ_tarihi: z.string().max(10).nullable().optional(),
  istinaf_dilekcesi_tebliğ_tarihi: z.string().max(10).nullable().optional(),
  istinaf_karar_tebliğ_tarihi: z.string().max(10).nullable().optional(),
  temyiz_dilekcesi_tebliğ_tarihi: z.string().max(10).nullable().optional(),
  temyiz_karar_tebliğ_tarihi: z.string().max(10).nullable().optional(),
  kesinlesme_tarihi: z.string().max(10).nullable().optional(),
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
        stk: { ...(surec.stk ?? { asama: null, ihtar_tarihi: null, arabuluculuk_son_tutanak_tarihi: null, basvuru_tarihi: null, stk_esas_no: null, stk_karar_no: null, stk_itiraz_esas_no: null, stk_itiraz_karar_no: null, bilirkisi_ucret_talep_tarihi: null, bilirkisi_raporu_tebliğ_tarihi: null, islah_tarihi: null, karar_tarihi: null, kesinlesme_tarihi: null }), ...input.data } as StkSurecData,
      }
      await db.update(dosya)
        .set({ surec_detay: serializeSurecDetay(updated), updated_at: sql`(datetime('now'))` })
        .where(eq(dosya.id, input.dosya_id))

      // TODO: Re-enable deadline calculations with new field names
      // Deadline auto-calc disabled — new STK structure has different date fields

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
        stk: { ...(surec.stk ?? { asama: null, ihtar_tarihi: null, arabuluculuk_son_tutanak_tarihi: null, basvuru_tarihi: null, stk_esas_no: null, stk_karar_no: null, stk_itiraz_esas_no: null, stk_itiraz_karar_no: null, bilirkisi_ucret_talep_tarihi: null, bilirkisi_raporu_tebliğ_tarihi: null, islah_tarihi: null, karar_tarihi: null, kesinlesme_tarihi: null }), asama: next } as StkSurecData,
      }
      await db.update(dosya)
        .set({ surec_detay: serializeSurecDetay(updated), updated_at: sql`(datetime('now'))` })
        .where(eq(dosya.id, input.dosya_id))
      return { asama: next }
    }),

  // D-03: Step back STK stage
  stkGeriAl: protectedProcedure
    .input(z.object({ dosya_id: z.number().int() }))
    .mutation(async ({ input }) => {
      const row = await db.select({ surec_detay: dosya.surec_detay })
        .from(dosya).where(eq(dosya.id, input.dosya_id)).then(r => r[0])
      if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'Dosya bulunamadı.' })

      const surec = parseSurecDetay(row.surec_detay)
      const currentAsama = surec.stk?.asama ?? null
      if (!currentAsama) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Geri alınacak aşama yok.' })
      const prev = prevAsama(STK_ASAMALAR, currentAsama)
      if (!prev) throw new TRPCError({ code: 'BAD_REQUEST', message: 'İlk aşamaya geri dönülemez.' })

      const updated: SurecDetay = {
        ...surec,
        stk: { ...surec.stk, asama: prev } as StkSurecData,
      }
      await db.update(dosya)
        .set({ surec_detay: serializeSurecDetay(updated), updated_at: sql`(datetime('now'))` })
        .where(eq(dosya.id, input.dosya_id))
      return { asama: prev }
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
        mahkeme: { ...(surec.mahkeme ?? { asama: null, ilk_derece_esas_no: null, ilk_derece_karar_no: null, ilk_derece_mahkeme_adi: null, istinaf_esas_no: null, istinaf_karar_no: null, istinaf_mahkeme_adi: null, temyiz_esas_no: null, temyiz_karar_no: null, temyiz_mahkeme_adi: null, dava_dilekcesi_tebliğ_tarihi: null, cevap_dilekcesi_tebliğ_tarihi: null, replik_dilekcesi_tebliğ_tarihi: null, duplik_dilekcesi_tebliğ_tarihi: null, bilirkisi_ucret_talep_tarihi: null, bilirkisi_raporu_tebliğ_tarihi: null, karar_tebliğ_tarihi: null, istinaf_dilekcesi_tebliğ_tarihi: null, istinaf_karar_tebliğ_tarihi: null, temyiz_dilekcesi_tebliğ_tarihi: null, temyiz_karar_tebliğ_tarihi: null, kesinlesme_tarihi: null }), ...input.data } as MahkemeSurecData,
      }
      await db.update(dosya)
        .set({ surec_detay: serializeSurecDetay(updated), updated_at: sql`(datetime('now'))` })
        .where(eq(dosya.id, input.dosya_id))

      // TODO: Re-enable deadline calculations with new field names
      // Deadline auto-calc disabled — new Mahkeme structure has different date fields

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
        mahkeme: { ...(surec.mahkeme ?? { asama: null, ilk_derece_esas_no: null, ilk_derece_karar_no: null, ilk_derece_mahkeme_adi: null, istinaf_esas_no: null, istinaf_karar_no: null, istinaf_mahkeme_adi: null, temyiz_esas_no: null, temyiz_karar_no: null, temyiz_mahkeme_adi: null, dava_dilekcesi_tebliğ_tarihi: null, cevap_dilekcesi_tebliğ_tarihi: null, replik_dilekcesi_tebliğ_tarihi: null, duplik_dilekcesi_tebliğ_tarihi: null, bilirkisi_ucret_talep_tarihi: null, bilirkisi_raporu_tebliğ_tarihi: null, karar_tebliğ_tarihi: null, istinaf_dilekcesi_tebliğ_tarihi: null, istinaf_karar_tebliğ_tarihi: null, temyiz_dilekcesi_tebliğ_tarihi: null, temyiz_karar_tebliğ_tarihi: null, kesinlesme_tarihi: null }), asama: next } as MahkemeSurecData,
      }
      await db.update(dosya)
        .set({ surec_detay: serializeSurecDetay(updated), updated_at: sql`(datetime('now'))` })
        .where(eq(dosya.id, input.dosya_id))
      return { asama: next }
    }),

  // Step back Mahkeme stage
  mahkemeGeriAl: protectedProcedure
    .input(z.object({ dosya_id: z.number().int() }))
    .mutation(async ({ input }) => {
      const row = await db.select({ surec_detay: dosya.surec_detay })
        .from(dosya).where(eq(dosya.id, input.dosya_id)).then(r => r[0])
      if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'Dosya bulunamadı.' })

      const surec = parseSurecDetay(row.surec_detay)
      const currentAsama = surec.mahkeme?.asama ?? null
      if (!currentAsama) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Geri alınacak aşama yok.' })
      const prev = prevAsama(MAHKEME_ASAMALAR, currentAsama)
      if (!prev) throw new TRPCError({ code: 'BAD_REQUEST', message: 'İlk aşamaya geri dönülemez.' })

      const updated: SurecDetay = {
        ...surec,
        mahkeme: { ...surec.mahkeme, asama: prev } as MahkemeSurecData,
      }
      await db.update(dosya)
        .set({ surec_detay: serializeSurecDetay(updated), updated_at: sql`(datetime('now'))` })
        .where(eq(dosya.id, input.dosya_id))
      return { asama: prev }
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
        mahkeme: { asama: null, ilk_derece_esas_no: null, ilk_derece_karar_no: null, ilk_derece_mahkeme_adi: null, istinaf_esas_no: null, istinaf_karar_no: null, istinaf_mahkeme_adi: null, temyiz_esas_no: null, temyiz_karar_no: null, temyiz_mahkeme_adi: null, dava_dilekcesi_tebliğ_tarihi: null, cevap_dilekcesi_tebliğ_tarihi: null, replik_dilekcesi_tebliğ_tarihi: null, duplik_dilekcesi_tebliğ_tarihi: null, bilirkisi_ucret_talep_tarihi: null, bilirkisi_raporu_tebliğ_tarihi: null, karar_tebliğ_tarihi: null, istinaf_dilekcesi_tebliğ_tarihi: null, istinaf_karar_tebliğ_tarihi: null, temyiz_dilekcesi_tebliğ_tarihi: null, temyiz_karar_tebliğ_tarihi: null, kesinlesme_tarihi: null },
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
