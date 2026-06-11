import { createTRPCRouter, protectedProcedure } from '@/lib/trpc/init'
import { TRPCError } from '@trpc/server'
import { db } from '@/lib/db'
import { belge, dosya, muvekkil, sigortaTuru, BELGE_KATEGORILER } from '@/lib/schema'
import { logOlayTx } from './olay'
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
      return db.transaction((tx) => {
        const row = tx.insert(belge).values(input).returning().get()
        logOlayTx(tx, input.dosya_id, 'belge_eklendi', `Belge eklendi: ${input.dosya_adi}`)
        return row
      })
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      const existing = await db.select().from(belge).where(eq(belge.id, input.id)).then(r => r[0])
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Belge bulunamadı.' })
      }

      const dosyaYolu = existing.dosya_yolu
      const apiMatch = dosyaYolu?.match(/^\/api\/files\/(\d+)\/(.+)$/)

      // Resolve filesystem target(s) BEFORE the transaction (this read is async).
      const fsTargets: string[] = []
      if (apiMatch) {
        const fileDosyaId = parseInt(apiMatch[1], 10)
        const filename = apiMatch[2]

        const dosyaRow = await db.query.dosya.findFirst({
          where: eq(dosya.id, fileDosyaId),
          with: { muvekkil: true, sigortaTuru: true },
        })

        if (dosyaRow) {
          const base = {
            tur: dosyaRow.tur,
            sigortaTuruAd: dosyaRow.sigortaTuru?.ad ?? null,
            muvekkilPlaka: dosyaRow.muvekkil_plaka,
          }
          const adSoyad = dosyaRow.muvekkil
            ? `${dosyaRow.muvekkil.ad} ${dosyaRow.muvekkil.soyad}`.trim()
            : null
          const adOnly = dosyaRow.muvekkil?.ad ?? null

          for (const muvekkilAd of [adSoyad, adOnly]) {
            fsTargets.push(path.join(buildBelgelerDir({ ...base, muvekkilAd }), filename))
          }
        }
      }

      // DB delete + activity log commit atomically.
      db.transaction((tx) => {
        tx.delete(belge).where(eq(belge.id, input.id)).run()
        logOlayTx(tx, existing.dosya_id, 'belge_silindi', `Belge silindi: ${existing.dosya_adi}`)
      })

      // Filesystem cleanup AFTER commit — never orphan the DB row if a file
      // delete fails, and never delete files for a rolled-back transaction.
      if (apiMatch) {
        for (const candidate of fsTargets) safeDeleteBelge(candidate)
      } else if (dosyaYolu) {
        // Legacy path format — attempt delete via archive guard (silently fails if outside base)
        const cleanPath = dosyaYolu.startsWith('/') ? dosyaYolu.slice(1) : dosyaYolu
        safeUnlinkArchive(path.join(process.cwd(), cleanPath))
      }

      return { success: true }
    }),
})
