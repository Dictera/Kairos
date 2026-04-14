import { createTRPCRouter, protectedProcedure } from '@/lib/trpc/init'
import { TRPCError } from '@trpc/server'
import { db } from '@/lib/db'
import { dosya, taraf, muvekkil, sigortaTuru, sigortaSirketi } from '@/lib/schema'
import { eq, count, desc, and, sql, inArray, aliasedTable } from 'drizzle-orm'
import { z } from 'zod'
import { logOlay } from './olay'

export const dosyaSchema = z.object({
  muvekkil_id: z.number().int(),
  dosya_no: z.string().min(1, 'Dosya numarası zorunludur').max(50),
  tur: z.enum(['STK', 'AT', 'AH']),
  sigorta_turu_id: z.number().int().nullable().optional(),
  karsitaraf_sigorta_id: z.number().int().nullable().optional(),
  talep_tutari: z.number().positive().nullable().optional(),
  muvekkil_plaka: z.string().max(10).nullable().optional().or(z.literal('')),
  hasar_dosya_no: z.string().max(200).nullable().optional().or(z.literal('')),
  kaza_tarihi: z.string().max(10).nullable().optional().or(z.literal('')),
  muvekkil_sigorta_id: z.number().int().nullable().optional(),
  kusur_orani_karsi: z.number().int().min(0).max(100).nullable().optional(),
  aciklama: z.string().max(2000).nullable().optional().or(z.literal('')),
  durum: z.enum(['aktif', 'arsiv']).default('aktif').optional(),
})

export const tarafSchema = z.object({
  dosya_id: z.number().int(),
  sigorta_sirketi_id: z.number().int().nullable().optional(),
  karsitaraf_ad: z.string().max(200).nullable().optional().or(z.literal('')),
  karsitaraf_vekil: z.string().max(200).nullable().optional().or(z.literal('')),
  police_no: z.string().max(100).nullable().optional().or(z.literal('')),
  karsitaraf_plaka: z.string().max(10).nullable().optional().or(z.literal('')),
  surucu_ad: z.string().max(200).nullable().optional().or(z.literal('')),
  surucu_soyad: z.string().max(200).nullable().optional().or(z.literal('')),
  surucu_plaka: z.string().max(10).nullable().optional().or(z.literal('')),
  surucu_telefon: z.string()
    .regex(/^05[0-9]{9}$/, 'Geçersiz telefon formatı (05XXXXXXXXX gerekli)')
    .nullable()
    .optional()
    .or(z.literal('')),
  surucu_police_no: z.string().max(100).nullable().optional().or(z.literal('')),
})

export const dosyaRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({
      search: z.string().max(100).optional(),
      tur: z.enum(['STK', 'AT', 'AH']).optional(),
      durum: z.enum(['aktif', 'arsiv']).optional(),
      tarih_baslangic: z.string().optional(),
      tarih_bitis: z.string().optional(),
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(100).default(25),
    }))
    .query(async ({ input }) => {
      const { search, tur, durum, tarih_baslangic, tarih_bitis, page, pageSize } = input
      const offset = (page - 1) * pageSize

      const conditions = []

      if (search) {
        conditions.push(
          sql`lower_tr(${dosya.dosya_no}) LIKE lower_tr(${'%' + search + '%'}) OR lower_tr(${muvekkil.ad} || ' ' || ${muvekkil.soyad}) LIKE lower_tr(${'%' + search + '%'})`
        )
      }
      if (tur) conditions.push(eq(dosya.tur, tur))
      if (durum) conditions.push(eq(dosya.durum, durum))
      if (tarih_baslangic) conditions.push(sql`${dosya.created_at} >= ${tarih_baslangic}`)
      if (tarih_bitis) conditions.push(sql`${dosya.created_at} <= ${tarih_bitis + 'T23:59:59'}`)

      const where = conditions.length > 0 ? and(...conditions) : undefined

      // Left join muvekkil + sigortaTuru + sigortaSirketi for list display (D-03 columns)
      // Aliased table for muvekkil_sigorta_id (second FK to sigortaSirketi)
      const muvekkilSirketi = aliasedTable(sigortaSirketi, 'muvekkil_sirketi')

      const [rows, totalResult] = await Promise.all([
        db.select({
          id: dosya.id,
          dosya_no: dosya.dosya_no,
          tur: dosya.tur,
          durum: dosya.durum,
          muvekkil_id: dosya.muvekkil_id,
          muvekkil_ad: sql<string>`${muvekkil.ad} || ' ' || ${muvekkil.soyad}`,
          sigorta_turu_ad: sigortaTuru.ad,
          karsitaraf_sigorta_ad: sigortaSirketi.ad,
          hasar_dosya_no: dosya.hasar_dosya_no,
          kaza_tarihi: dosya.kaza_tarihi,
          kusur_orani_karsi: dosya.kusur_orani_karsi,
          muvekkil_sigorta_ad: muvekkilSirketi.ad,
          created_at: dosya.created_at,
        })
          .from(dosya)
          .leftJoin(muvekkil, eq(dosya.muvekkil_id, muvekkil.id))
          .leftJoin(sigortaTuru, eq(dosya.sigorta_turu_id, sigortaTuru.id))
          .leftJoin(sigortaSirketi, eq(dosya.karsitaraf_sigorta_id, sigortaSirketi.id))
          .leftJoin(muvekkilSirketi, eq(dosya.muvekkil_sigorta_id, muvekkilSirketi.id))
          .where(where)
          .orderBy(desc(dosya.id))
          .limit(pageSize)
          .offset(offset),
        db.select({ total: count() })
          .from(dosya)
          .leftJoin(muvekkil, eq(dosya.muvekkil_id, muvekkil.id))
          .where(where),
      ])

      // Fetch police_no from taraf for D-03 column
      const ids = rows.map(r => r.id)
      let policeNos: Record<number, string | null> = {}
      if (ids.length > 0) {
        const tarafRows = await db
          .select({ dosya_id: taraf.dosya_id, police_no: taraf.police_no })
          .from(taraf)
          .where(inArray(taraf.dosya_id, ids))
        policeNos = Object.fromEntries(tarafRows.map(t => [t.dosya_id, t.police_no]))
      }

      const total = totalResult[0]?.total ?? 0
      return {
        rows: rows.map(r => ({ ...r, police_no: policeNos[r.id] ?? null })),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      }
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ input }) => {
      const row = await db.query.dosya.findFirst({
        where: eq(dosya.id, input.id),
        with: {
          muvekkil: { columns: { id: true, ad: true, soyad: true } },
          sigortaTuru: { columns: { id: true, ad: true } },
          karsitarafSigorta: { columns: { id: true, ad: true } },
          muvekkilSigorta: { columns: { id: true, ad: true } },
          taraflar: true,
        },
      })
      if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'Dosya bulunamadı.' })
      return row
    }),

  create: protectedProcedure
    .input(dosyaSchema)
    .mutation(async ({ input }) => {
      // Uniqueness check for dosya_no (Claude's discretion — CONTEXT.md)
      const existing = await db.select({ id: dosya.id }).from(dosya).where(eq(dosya.dosya_no, input.dosya_no))
      if (existing.length > 0) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Bu dosya numarası zaten kullanılıyor.',
        })
      }
      const [row] = await db.insert(dosya).values(input).returning()
      await logOlay(row.id, 'olusturma', 'Dosya oluşturuldu')
      return row
    }),

  update: protectedProcedure
    .input(dosyaSchema.extend({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input
      // Uniqueness check (exclude self)
      if (data.dosya_no) {
        const existing = await db
          .select({ id: dosya.id })
          .from(dosya)
          .where(and(eq(dosya.dosya_no, data.dosya_no), sql`${dosya.id} != ${id}`))
        if (existing.length > 0) {
          throw new TRPCError({ code: 'CONFLICT', message: 'Bu dosya numarası zaten kullanılıyor.' })
        }
      }
      const [row] = await db
        .update(dosya)
        .set({ ...data, updated_at: sql`(datetime('now'))` })
        .where(eq(dosya.id, id))
        .returning()
      if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'Dosya bulunamadı.' })
      return row
    }),

  archive: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      const [row] = await db
        .update(dosya)
        .set({ durum: 'arsiv', updated_at: sql`(datetime('now'))` })
        .where(eq(dosya.id, input.id))
        .returning()
      if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'Dosya bulunamadı.' })
      await logOlay(input.id, 'durum_degisikligi', 'Dosya arşivlendi')
      return row
    }),

  unarchive: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      const [row] = await db
        .update(dosya)
        .set({ durum: 'aktif', updated_at: sql`(datetime('now'))` })
        .where(eq(dosya.id, input.id))
        .returning()
      if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'Dosya bulunamadı.' })
      await logOlay(input.id, 'durum_degisikligi', 'Dosya aktif hale getirildi')
      return row
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      // taraf rows cascade-delete via FK (onDelete: 'cascade')
      await db.delete(dosya).where(eq(dosya.id, input.id))
      return { success: true }
    }),

  // Upsert taraf (counter-party) for a dosya — DOSYA-05
  upsertTaraf: protectedProcedure
    .input(tarafSchema)
    .mutation(async ({ input }) => {
      const { dosya_id, ...data } = input
      const [row] = await db.insert(taraf)
        .values({ dosya_id, ...data })
        .onConflictDoUpdate({ target: taraf.dosya_id, set: data })
        .returning()
      return row
    }),
})
