import { createTRPCRouter, protectedProcedure } from '@/lib/trpc/init'
import { db } from '@/lib/db'
import { dosya, muvekkil, finans_kalemi, sigortaSirketi, sigortaTuru } from '@/lib/schema'
import { eq, and, gte, lte } from 'drizzle-orm'
import { z } from 'zod'

export const raporRouter = createTRPCRouter({
  // Portfolio report data
  portfy: protectedProcedure.query(async () => {
    const allDosya = await db.select().from(dosya)
    
    // Count by status
    const aktifCount = allDosya.filter(d => d.durum === 'AKTIF').length
    const pasifCount = allDosya.filter(d => d.durum === 'PASIF').length
    
    // Count by type (STK vs Mahkeme)
    const stkCount = allDosya.filter(d => d.tur === 'STK').length
    const mahkemeCount = allDosya.filter(d => d.tur === 'Mahkeme').length
    
    // Count by insurance type
    const allSigortaTuru = await db.select().from(sigortaTuru)
    const sigortaTuruById = Object.fromEntries(allSigortaTuru.map(s => [s.id, s.ad]))
    const bySigortaType: Record<string, number> = {}
    allDosya.forEach(d => {
      if (d.sigorta_turu_id && sigortaTuruById[d.sigorta_turu_id]) {
        const name = sigortaTuruById[d.sigorta_turu_id]
        bySigortaType[name] = (bySigortaType[name] || 0) + 1
      }
    })
    
    // Count by stage (parse surec_detay JSON)
    const byStage: Record<string, number> = {}
    allDosya.forEach(d => {
      if (d.surec_detay) {
        try {
          const detay = JSON.parse(d.surec_detay)
          const stage = d.tur === 'STK' 
            ? detay.stk?.asama || 'BAŞVURU'
            : detay.mahkeme?.asama || 'DAVA_AÇILDI'
          byStage[stage] = (byStage[stage] || 0) + 1
        } catch {
          byStage['Bilinmiyor'] = (byStage['Bilinmiyor'] || 0) + 1
        }
      }
    })
    
    return {
      total: allDosya.length,
      aktif: aktifCount,
      pasif: pasifCount,
      byType: {
        stk: stkCount,
        mahkeme: mahkemeCount,
      },
      bySigortaType: Object.entries(bySigortaType).map(([name, count]) => ({ name, count })),
      byStage: Object.entries(byStage).map(([stage, count]) => ({ stage, count })),
    }
  }),

  // Financial report data
  finans: protectedProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      const { startDate, endDate } = input || {}
      
      let entries = await db.select().from(finans_kalemi)
      
      // Filter by date if provided
      if (startDate || endDate) {
        entries = entries.filter(e => {
          if (startDate && e.tarih < startDate) return false
          if (endDate && e.tarih > endDate) return false
          return true
        })
      }
      
      // Calculate totals by type
      const gelen = entries.filter(e => e.tur === 'Gelen').reduce((sum, e) => sum + (e.tutar || 0), 0)
      const giden = entries.filter(e => e.tur === 'Giden').reduce((sum, e) => sum + (e.tutar || 0), 0)
      const masraf = entries.filter(e => e.tur === 'Masraf').reduce((sum, e) => sum + (e.tutar || 0), 0)
      
      // Monthly breakdown
      const byMonth: Record<string, { gelen: number, giden: number, masraf: number }> = {}
      entries.forEach(e => {
        const month = e.tarih.substring(0, 7) // YYYY-MM
        if (!byMonth[month]) {
          byMonth[month] = { gelen: 0, giden: 0, masraf: 0 }
        }
        if (e.tur === 'Gelen') byMonth[month].gelen += e.tutar || 0
        if (e.tur === 'Giden') byMonth[month].giden += e.tutar || 0
        if (e.tur === 'Masraf') byMonth[month].masraf += e.tutar || 0
      })
      
      // Yearly breakdown
      const byYear: Record<string, { gelen: number, giden: number, masraf: number }> = {}
      entries.forEach(e => {
        const year = e.tarih.substring(0, 4) // YYYY
        if (!byYear[year]) {
          byYear[year] = { gelen: 0, giden: 0, masraf: 0 }
        }
        if (e.tur === 'Gelen') byYear[year].gelen += e.tutar || 0
        if (e.tur === 'Giden') byYear[year].giden += e.tutar || 0
        if (e.tur === 'Masraf') byYear[year].masraf += e.tutar || 0
      })
      
      return {
        total: { gelen, giden, masraf, net: gelen - giden - masraf },
        byMonth: Object.entries(byMonth)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, data]) => ({ month, ...data })),
        byYear: Object.entries(byYear)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([year, data]) => ({ year, ...data })),
        entryCount: entries.length,
      }
    }),

  // Case list with filters (for Excel export)
  dosyaListesi: protectedProcedure
    .input(z.object({
      tur: z.enum(['STK', 'Mahkeme']).optional(),
      durum: z.enum(['AKTIF', 'PASIF']).optional(),
      search: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      const { tur, durum, search } = input || {}
      
      let entries = await db.select().from(dosya)
      
      // Filter by type and status
      if (tur) entries = entries.filter(e => e.tur === tur)
      if (durum) entries = entries.filter(e => e.durum === durum)
      
      // Join with muvekkil for names
      const withMuvekkil = await Promise.all(
        entries.map(async (d) => {
          const [m] = await db.select().from(muvekkil).where(eq(muvekkil.id, d.muvekkil_id))
          const [sigorta] = d.karsitaraf_sigorta_id
            ? await db.select().from(sigortaSirketi).where(eq(sigortaSirketi.id, d.karsitaraf_sigorta_id))
            : [null]
          return {
            ...d,
            musteri_ad: m?.ad || '',
            sigorta_ad: sigorta?.ad || '',
          }
        })
      )
      
      // Apply search filter
      let filtered = withMuvekkil
      if (search) {
        const s = search.toLowerCase()
        filtered = filtered.filter(d =>
          d.dosya_no?.toLowerCase().includes(s) ||
          d.musteri_ad?.toLowerCase().includes(s) ||
          d.sigorta_ad?.toLowerCase().includes(s)
        )
      }
      
      return filtered
    }),
})