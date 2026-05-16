import { createTRPCRouter, protectedProcedure } from '@/lib/trpc/init'
import { db } from '@/lib/db'
import { dosya, muvekkil, sigortaSirketi, sigortaTuru } from '@/lib/schema'
import { eq, sql, desc } from 'drizzle-orm'
import { z } from 'zod'

export const searchRouter = createTRPCRouter({
  global: protectedProcedure
    .input(z.object({
      query: z.string().min(1).max(100),
      limit: z.number().int().min(1).max(20).default(10),
    }))
    .query(async ({ input }) => {
      const { query, limit } = input
      const likePattern = `%${query}%`

      // Dosya arama
      const dosyaResults = await db.select({
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
        .where(
          sql`lower_tr(${dosya.dosya_no}) LIKE lower_tr(${likePattern})
            OR lower_tr(${muvekkil.ad} || ' ' || ${muvekkil.soyad}) LIKE lower_tr(${likePattern})
            OR lower_tr(COALESCE(${dosya.hasar_dosya_no},'')) LIKE lower_tr(${likePattern})
            OR lower_tr(COALESCE(${dosya.muvekkil_plaka},'')) LIKE lower_tr(${likePattern})`
        )
        .orderBy(desc(dosya.id))
        .limit(limit)

      // Müvekkil arama
      const muvekkilResults = await db.select({
        id: muvekkil.id,
        ad: muvekkil.ad,
        soyad: muvekkil.soyad,
        telefon: muvekkil.telefon,
        tc_vergi_no: muvekkil.tc_vergi_no,
      })
        .from(muvekkil)
        .where(
          sql`lower_tr(${muvekkil.ad} || ' ' || ${muvekkil.soyad}) LIKE lower_tr(${likePattern})
            OR lower_tr(COALESCE(${muvekkil.tc_vergi_no},'')) LIKE lower_tr(${likePattern})
            OR lower_tr(COALESCE(${muvekkil.telefon},'')) LIKE lower_tr(${likePattern})`
        )
        .orderBy(desc(muvekkil.id))
        .limit(limit)

      return {
        dosyalar: dosyaResults,
        muvekkiller: muvekkilResults,
      }
    }),
})
