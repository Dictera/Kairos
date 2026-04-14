import { createTRPCRouter, protectedProcedure } from '@/lib/trpc/init'
import { TRPCError } from '@trpc/server'
import { db } from '@/lib/db'
import { muvekkil, dosya } from '@/lib/schema'
import { eq, count, desc, sql } from 'drizzle-orm'
import { z } from 'zod'

const muvekkilSchema = z.object({
  ad: z.string().min(1, 'Ad zorunludur').max(100),
  soyad: z.string().min(1, 'Soyad zorunludur').max(100),
  telefon: z
    .string()
    .regex(/^05[0-9]{9}$/, 'Geçersiz telefon formatı (05XXXXXXXXX gerekli)')
    .max(20)
    .optional()
    .or(z.literal('')),
  tc_vergi_no: z.string().max(11).optional().or(z.literal('')),
  adres: z.string().max(500).optional().or(z.literal('')),
  notlar: z.string().max(2000).optional().or(z.literal('')),
})

export const muvekkillRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({
      search: z.string().max(100).optional(),
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(100).default(25),
    }))
    .query(async ({ input }) => {
      const { search, page, pageSize } = input
      const offset = (page - 1) * pageSize

      // Turkish-aware search using lower_tr() registered in lib/db.ts
      const where = search
        ? sql`lower_tr(${muvekkil.ad} || ' ' || ${muvekkil.soyad}) LIKE lower_tr(${'%' + search + '%'}) OR lower_tr(${muvekkil.tc_vergi_no}) LIKE lower_tr(${'%' + search + '%'})`
        : undefined

      const [rows, totalResult] = await Promise.all([
        db.select({
          id: muvekkil.id,
          ad: muvekkil.ad,
          soyad: muvekkil.soyad,
          telefon: muvekkil.telefon,
          tc_vergi_no: muvekkil.tc_vergi_no,
          created_at: muvekkil.created_at,
        })
          .from(muvekkil)
          .where(where)
          .orderBy(desc(muvekkil.id))
          .limit(pageSize)
          .offset(offset),
        db.select({ total: count() }).from(muvekkil).where(where),
      ])

      // Add linked dosya count per muvekkil
      const ids = rows.map(r => r.id)
      let dosyaCounts: Record<number, number> = {}
      if (ids.length > 0) {
        const counts = await db
          .select({ muvekkil_id: dosya.muvekkil_id, cnt: count() })
          .from(dosya)
          .where(sql`${dosya.muvekkil_id} IN (${sql.raw(ids.join(','))})`)
          .groupBy(dosya.muvekkil_id)
        dosyaCounts = Object.fromEntries(counts.map(c => [c.muvekkil_id, c.cnt]))
      }

      const total = totalResult[0]?.total ?? 0
      return {
        rows: rows.map(r => ({ ...r, dosya_count: dosyaCounts[r.id] ?? 0 })),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      }
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ input }) => {
      const row = await db.query.muvekkil.findFirst({
        where: eq(muvekkil.id, input.id),
        with: {
          dosyalar: {
            columns: { id: true, dosya_no: true, tur: true, durum: true, talep_tutari: true },
            orderBy: desc(dosya.id),
          },
        },
      })
      if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'Müvekkil bulunamadı.' })
      return row
    }),

  create: protectedProcedure
    .input(muvekkilSchema)
    .mutation(async ({ input }) => {
      const [row] = await db.insert(muvekkil).values(input).returning()
      return row
    }),

  update: protectedProcedure
    .input(muvekkilSchema.extend({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input
      const [row] = await db
        .update(muvekkil)
        .set({ ...data, updated_at: sql`(datetime('now'))` })
        .where(eq(muvekkil.id, id))
        .returning()
      if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'Müvekkil bulunamadı.' })
      return row
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      // D-07: hard block if linked dosyalar exist
      const [{ linkedCount }] = await db
        .select({ linkedCount: count() })
        .from(dosya)
        .where(eq(dosya.muvekkil_id, input.id))

      if (linkedCount > 0) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: `Bu müvekkile ait ${linkedCount} dosya bulunuyor. Müvekkili silmek için önce tüm dosyaları silin veya arşivleyin.`,
        })
      }
      await db.delete(muvekkil).where(eq(muvekkil.id, input.id))
      return { success: true }
    }),
})
