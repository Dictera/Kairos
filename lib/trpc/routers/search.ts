import { createTRPCRouter, protectedProcedure } from '@/lib/trpc/init'
import { db } from '@/lib/db'
import { dosya, muvekkil, sigortaTuru } from '@/lib/schema'
import { eq, sql, desc } from 'drizzle-orm'
import { z } from 'zod'
import { ftsMatchQuery } from '@/lib/turkish'

export const searchRouter = createTRPCRouter({
  global: protectedProcedure
    .input(z.object({
      query: z.string().min(1).max(100),
      limit: z.number().int().min(1).max(20).default(10),
    }))
    .query(async ({ input }) => {
      const { query, limit } = input
      const match = ftsMatchQuery(query)
      const likePattern = `%${query}%`

      // ≥3 chars → trigram FTS substring index. <3 chars → lower_tr LIKE scan.
      const dosyaWhere = match
        ? sql`${dosya.id} IN (SELECT rowid FROM dosya_fts WHERE dosya_fts MATCH ${match})`
        : sql`lower_tr(${dosya.dosya_no}) LIKE lower_tr(${likePattern})
            OR lower_tr(${muvekkil.ad} || ' ' || ${muvekkil.soyad}) LIKE lower_tr(${likePattern})
            OR lower_tr(COALESCE(${dosya.hasar_dosya_no},'')) LIKE lower_tr(${likePattern})
            OR lower_tr(COALESCE(${dosya.muvekkil_plaka},'')) LIKE lower_tr(${likePattern})`

      const muvekkilWhere = match
        ? sql`${muvekkil.id} IN (SELECT rowid FROM muvekkil_fts WHERE muvekkil_fts MATCH ${match})`
        : sql`lower_tr(${muvekkil.ad} || ' ' || ${muvekkil.soyad}) LIKE lower_tr(${likePattern})
            OR lower_tr(COALESCE(${muvekkil.tc_vergi_no},'')) LIKE lower_tr(${likePattern})
            OR lower_tr(COALESCE(${muvekkil.telefon},'')) LIKE lower_tr(${likePattern})`

      const [dosyaResults, muvekkilResults] = await Promise.all([
        db.select({
          id: dosya.id,
          dosya_no: dosya.dosya_no,
          tur: dosya.tur,
          durum: dosya.durum,
          muvekkil_ad: sql<string>`${muvekkil.ad} || ' ' || ${muvekkil.soyad}`,
          sigorta_turu_ad: sigortaTuru.ad,
          hasar_dosya_no: dosya.hasar_dosya_no,
          muvekkil_plaka: dosya.muvekkil_plaka,
        })
          .from(dosya)
          .leftJoin(muvekkil, eq(dosya.muvekkil_id, muvekkil.id))
          .leftJoin(sigortaTuru, eq(dosya.sigorta_turu_id, sigortaTuru.id))
          .where(dosyaWhere)
          .orderBy(desc(dosya.id))
          .limit(limit),
        db.select({
          id: muvekkil.id,
          ad: muvekkil.ad,
          soyad: muvekkil.soyad,
          telefon: muvekkil.telefon,
          tc_vergi_no: muvekkil.tc_vergi_no,
        })
          .from(muvekkil)
          .where(muvekkilWhere)
          .orderBy(desc(muvekkil.id))
          .limit(limit),
      ])

      return {
        dosyalar: dosyaResults,
        muvekkiller: muvekkilResults,
      }
    }),
})
