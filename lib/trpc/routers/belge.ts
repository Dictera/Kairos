import { createTRPCRouter, protectedProcedure } from '@/lib/trpc/init'
import { TRPCError } from '@trpc/server'
import { db } from '@/lib/db'
import { belge, dosya, muvekkil, sigortaTuru, BELGE_KATEGORILER } from '@/lib/schema'
import { logOlay } from './olay'
import { eq, desc } from 'drizzle-orm'
import { z } from 'zod'
import path from 'path'
import { safeUnlinkArchive } from '@/lib/docx/archive'
import { buildBelgelerDir, safeDeleteBelge } from '@/lib/belgeler-storage'

const belgeKategoriEnum = z.enum(BELGE_KATEGORILER)

export const belgeRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ dosya_id: z.number().int() }))
    .query(async ({ input }) => {
      return db.select().from(belge)
        .where(eq(belge.dosya_id, input.dosya_id))
        .orderBy(desc(belge.created_at))
    }),

  treeList: protectedProcedure
    .query(async () => {
      return db
        .select({
          id: belge.id,
          dosya_id: belge.dosya_id,
          dosya_adi: belge.dosya_adi,
          dosya_yolu: belge.dosya_yolu,
          dosya_boyutu: belge.dosya_boyutu,
          kategori: belge.kategori,
          created_at: belge.created_at,
          sablon_id: belge.sablon_id,
          tur: dosya.tur,
          dosya_no: dosya.dosya_no,
          muvekkil_plaka: dosya.muvekkil_plaka,
          muvekkil_ad: muvekkil.ad,
          muvekkil_soyad: muvekkil.soyad,
          sigorta_turu_ad: sigortaTuru.ad,
        })
        .from(belge)
        .innerJoin(dosya, eq(belge.dosya_id, dosya.id))
        .innerJoin(muvekkil, eq(dosya.muvekkil_id, muvekkil.id))
        .leftJoin(sigortaTuru, eq(dosya.sigorta_turu_id, sigortaTuru.id))
        .orderBy(desc(belge.created_at))
    }),

  create: protectedProcedure
    .input(z.object({
      dosya_id: z.number().int(),
      dosya_no: z.string(),
      kategori: belgeKategoriEnum,
      dosya_adi: z.string(),
      dosya_yolu: z.string(),
      dosya_boyutu: z.number().int(),
      mime_tur: z.string(),
    }))
    .mutation(async ({ input }) => {
      const [row] = await db.insert(belge).values(input).returning()
      await logOlay(input.dosya_id, 'belge_eklendi', `Belge eklendi: ${input.dosya_adi}`)
      return row
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      const existing = await db.select().from(belge).where(eq(belge.id, input.id))
      if (!existing[0]) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Belge bulunamadı.' })
      }

      await db.delete(belge).where(eq(belge.id, input.id))

      const dosyaYolu = existing[0].dosya_yolu
      const apiMatch = dosyaYolu?.match(/^\/api\/files\/(\d+)\/(.+)$/)

      if (apiMatch) {
        const fileDosyaId = parseInt(apiMatch[1], 10)
        const filename = apiMatch[2]

        const dosyaRow = await db.query.dosya.findFirst({
          where: eq(dosya.id, fileDosyaId),
          with: { muvekkil: true, sigortaTuru: true },
        })

        if (dosyaRow) {
          const dir = buildBelgelerDir({
            tur: dosyaRow.tur,
            sigortaTuruAd: dosyaRow.sigortaTuru?.ad ?? null,
            muvekkilAd: dosyaRow.muvekkil?.ad ?? null,
            muvekkilPlaka: dosyaRow.muvekkil_plaka,
          })
          safeDeleteBelge(path.join(dir, filename))
        }
      } else if (dosyaYolu) {
        // Legacy path format — attempt delete via archive guard (silently fails if outside base)
        const cleanPath = dosyaYolu.startsWith('/') ? dosyaYolu.slice(1) : dosyaYolu
        safeUnlinkArchive(path.join(process.cwd(), cleanPath))
      }

      await logOlay(existing[0].dosya_id, 'belge_silindi', `Belge silindi: ${existing[0].dosya_adi}`)
      return { success: true }
    }),
})
