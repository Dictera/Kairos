import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/lib/trpc/init'
import { db } from '@/lib/db'
import {
  dosya, muvekkil, finans_kalemi, sigortaSirketi, sigortaTuru, parseSurecDetay,
} from '@/lib/schema'

const MONTHS_TR   = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara']
const TUR_RENK: Record<string, string> = { STK:'#1c768f', AT:'#22c55e', AH:'#f97316' }
const TUR_LABEL: Record<string, string> = { STK:'STK', AT:'Asliye Ticaret', AH:'Asliye Hukuk' }

const DAVA_ASAMALARI = new Set(['BAŞVURU','ÖN_İNCELEME','BİLİRKİŞİ','ISLAH','KARAR','İTİRAZ','KESİNLEŞME'])

function daysBetween(from: string, to: Date = new Date()): number {
  const d = new Date(from)
  return Math.max(0, Math.ceil((to.getTime() - d.getTime()) / 86_400_000))
}

function ayLabel(ay: string): string {
  const [, m] = ay.split('-').map(Number)
  return MONTHS_TR[m - 1] ?? ay
}

function zaYil(tur: string, sigortaTuruAd?: string): number {
  if (sigortaTuruAd === 'Bedeni Hasar') return 10
  if (tur === 'AT') return 10
  return 2
}

function zaRisk(kalan: number): 'Acil' | 'Kritik' | 'Dikkat' | 'Güvenli' {
  if (kalan < 60) return 'Acil'
  if (kalan < 180) return 'Kritik'
  if (kalan < 365) return 'Dikkat'
  return 'Güvenli'
}

export const raporlarRouter = createTRPCRouter({

  // ── Yönetim Özeti ──────────────────────────────────────────────────────────
  yonetimOzeti: protectedProcedure.query(async () => {
    const [tumDosyalar, tumFinans, tumSirket, tumMuvekkil, tumSigortaTuru] = await Promise.all([
      db.select().from(dosya),
      db.select().from(finans_kalemi),
      db.select().from(sigortaSirketi),
      db.select().from(muvekkil),
      db.select().from(sigortaTuru),
    ])

    const sirketMap    = Object.fromEntries(tumSirket.map(s => [s.id, s.ad]))
    const muvekkilMap  = Object.fromEntries(tumMuvekkil.map(m => [m.id, `${m.ad} ${m.soyad}`]))
    const sigortaTuruMap = Object.fromEntries(tumSigortaTuru.map(t => [t.id, t.ad]))

    // ay2026 — monthly rows filtered to 2026
    const byMonth2026: Record<string, { gelen: number; giden: number; masraf: number; dosya: number }> = {}
    tumFinans.forEach(f => {
      if (!f.tarih.startsWith('2026')) return
      const ay = f.tarih.substring(0, 7)
      if (!byMonth2026[ay]) byMonth2026[ay] = { gelen: 0, giden: 0, masraf: 0, dosya: 0 }
      if (f.tur === 'Gelen')  byMonth2026[ay].gelen  += f.tutar ?? 0
      if (f.tur === 'Giden')  byMonth2026[ay].giden  += f.tutar ?? 0
      if (f.tur === 'Masraf') byMonth2026[ay].masraf += f.tutar ?? 0
    })
    tumDosyalar.forEach(d => {
      if (!d.created_at.startsWith('2026')) return
      const ay = d.created_at.substring(0, 7)
      if (!byMonth2026[ay]) byMonth2026[ay] = { gelen: 0, giden: 0, masraf: 0, dosya: 0 }
      byMonth2026[ay].dosya++
    })
    const ay2026 = Object.entries(byMonth2026)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([ay, d]) => ({ ay, ...d }))

    // sirketler — per company talep/karar/tahsilat
    const sirketAgg: Record<number, { ad: string; talep: number; karar: number; tahsilat: number; dosya: number; tur: string }> = {}
    tumDosyalar.forEach(d => {
      if (!d.karsitaraf_sigorta_id) return
      const sid = d.karsitaraf_sigorta_id
      if (!sirketAgg[sid]) sirketAgg[sid] = { ad: sirketMap[sid] ?? '', talep: 0, karar: 0, tahsilat: 0, dosya: 0, tur: d.tur }
      sirketAgg[sid].talep += d.talep_tutari ?? 0
      sirketAgg[sid].karar += d.karar_tutari ?? 0
      sirketAgg[sid].dosya++
    })
    const dosyaById = new Map(tumDosyalar.map(d => [d.id, d]))
    tumFinans.forEach(f => {
      if (f.tur !== 'Gelen') return
      const d = dosyaById.get(f.dosya_id)
      if (!d?.karsitaraf_sigorta_id) return
      sirketAgg[d.karsitaraf_sigorta_id].tahsilat += f.tutar ?? 0
    })
    const sirketler = Object.values(sirketAgg).sort((a, b) => b.talep - a.talep).slice(0, 8)

    // sonucTur — by dosya.tur
    const sonucTur = ['STK', 'AT', 'AH'].map(tur => {
      const td = tumDosyalar.filter(d => d.tur === tur)
      const kazan   = td.filter(d => d.sonuc === 'kazanıldı').length
      const uzlasma = td.filter(d => d.sonuc === 'uzlaşma').length
      const kaybet  = td.filter(d => d.sonuc === 'kaybedildi').length
      const devam   = td.length - kazan - uzlasma - kaybet
      return { tur: TUR_LABEL[tur] ?? tur, kazan, uzlasma, kaybet, devam, renk: TUR_RENK[tur] ?? '#94a3b8' }
    })

    // dosyaStatus
    const statusAgg: Record<string, number> = {}
    tumDosyalar.forEach(d => { statusAgg[d.durum] = (statusAgg[d.durum] ?? 0) + 1 })
    const STATUS_RENK: Record<string, string> = { aktif: '#22c55e', arsiv: '#94a3b8' }
    const dosyaStatus = Object.entries(statusAgg).map(([durum, adet]) => ({
      durum: durum === 'aktif' ? 'Aktif' : durum === 'arsiv' ? 'Arşiv' : durum,
      adet,
      renk: STATUS_RENK[durum] ?? '#1c768f',
    }))

    // zamanasimı
    const bugun = new Date()
    const zamanasimıRows = tumDosyalar
      .flatMap(d => {
        if (!d.kaza_tarihi) return []
        const turuAd = d.sigorta_turu_id ? sigortaTuruMap[d.sigorta_turu_id] : undefined
        const yil = zaYil(d.tur, turuAd)
        const son = new Date(d.kaza_tarihi)
        son.setFullYear(son.getFullYear() + yil)
        const kalan = Math.ceil((son.getTime() - bugun.getTime()) / 86_400_000)
        const risk  = zaRisk(kalan)
        return [{
          no: d.dosya_no,
          muvekkil: muvekkilMap[d.muvekkil_id] ?? '',
          sirket: d.karsitaraf_sigorta_id ? (sirketMap[d.karsitaraf_sigorta_id] ?? '') : '',
          tur: turuAd ?? TUR_LABEL[d.tur] ?? d.tur,
          basTarih: d.kaza_tarihi,
          zamanasimıYil: yil,
          kalanGun: kalan,
          risk,
        }]
      })
      .sort((a, b) => a.kalanGun - b.kalanGun)

    return { ay2026, sirketler, sonucTur, dosyaStatus, zamanasimı: zamanasimıRows }
  }),

  // ── Genel Bakış ────────────────────────────────────────────────────────────
  genelBakis: protectedProcedure
    .input(z.object({ yil: z.enum(['all', '2025', '2026']) }))
    .query(async ({ input }) => {
      const [tumFinans, tumDosyalar] = await Promise.all([
        db.select().from(finans_kalemi),
        db.select({ id: dosya.id, created_at: dosya.created_at }).from(dosya),
      ])

      const byMonth: Record<string, { gelen: number; giden: number; masraf: number; dosya: number }> = {}
      tumFinans.forEach(f => {
        if (input.yil !== 'all' && !f.tarih.startsWith(input.yil)) return
        const ay = f.tarih.substring(0, 7)
        if (!byMonth[ay]) byMonth[ay] = { gelen: 0, giden: 0, masraf: 0, dosya: 0 }
        if (f.tur === 'Gelen')  byMonth[ay].gelen  += f.tutar ?? 0
        if (f.tur === 'Giden')  byMonth[ay].giden  += f.tutar ?? 0
        if (f.tur === 'Masraf') byMonth[ay].masraf += f.tutar ?? 0
      })
      tumDosyalar.forEach(d => {
        if (input.yil !== 'all' && !d.created_at.startsWith(input.yil)) return
        const ay = d.created_at.substring(0, 7)
        if (!byMonth[ay]) byMonth[ay] = { gelen: 0, giden: 0, masraf: 0, dosya: 0 }
        byMonth[ay].dosya++
      })

      const rows = Object.entries(byMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([ay, d]) => ({ ay, ...d }))

      return { rows }
    }),

  // ── Tahsilat ───────────────────────────────────────────────────────────────
  tahsilat: protectedProcedure.query(async () => {
    const [tumDosyalar, tumFinans, tumSirket] = await Promise.all([
      db.select().from(dosya),
      db.select().from(finans_kalemi),
      db.select().from(sigortaSirketi),
    ])

    const sirketMap = Object.fromEntries(tumSirket.map(s => [s.id, s.ad]))
    const sirketAgg: Record<number, { ad: string; talep: number; karar: number; tahsilat: number; dosya: number; tur: string }> = {}

    tumDosyalar.forEach(d => {
      if (!d.karsitaraf_sigorta_id) return
      const sid = d.karsitaraf_sigorta_id
      if (!sirketAgg[sid]) sirketAgg[sid] = { ad: sirketMap[sid] ?? '', talep: 0, karar: 0, tahsilat: 0, dosya: 0, tur: d.tur }
      sirketAgg[sid].talep += d.talep_tutari ?? 0
      sirketAgg[sid].karar += d.karar_tutari ?? 0
      sirketAgg[sid].dosya++
    })
    const dosyaById = new Map(tumDosyalar.map(d => [d.id, d]))
    tumFinans.forEach(f => {
      if (f.tur !== 'Gelen') return
      const d = dosyaById.get(f.dosya_id)
      if (!d?.karsitaraf_sigorta_id) return
      sirketAgg[d.karsitaraf_sigorta_id].tahsilat += f.tutar ?? 0
    })

    const sirketler = Object.values(sirketAgg).sort((a, b) => b.talep - a.talep)
    return { sirketler }
  }),

  // ── Sonuç & Başarı ─────────────────────────────────────────────────────────
  sonucBasari: protectedProcedure.query(async () => {
    const [tumDosyalar, tumSirket] = await Promise.all([
      db.select().from(dosya),
      db.select().from(sigortaSirketi),
    ])

    const sirketMap = Object.fromEntries(tumSirket.map(s => [s.id, s.ad]))

    // by tur
    const tur = ['STK', 'AT', 'AH'].map(t => {
      const td = tumDosyalar.filter(d => d.tur === t)
      const kazan   = td.filter(d => d.sonuc === 'kazanıldı').length
      const uzlasma = td.filter(d => d.sonuc === 'uzlaşma').length
      const kaybet  = td.filter(d => d.sonuc === 'kaybedildi').length
      const devam   = td.length - kazan - uzlasma - kaybet
      return { tur: TUR_LABEL[t] ?? t, kazan, uzlasma, kaybet, devam, renk: TUR_RENK[t] ?? '#94a3b8' }
    })

    // by sirket
    const sirketAgg: Record<number, { ad: string; kazan: number; uzlasma: number; kaybet: number }> = {}
    tumDosyalar.forEach(d => {
      if (!d.karsitaraf_sigorta_id) return
      const sid = d.karsitaraf_sigorta_id
      if (!sirketAgg[sid]) sirketAgg[sid] = { ad: sirketMap[sid] ?? '', kazan: 0, uzlasma: 0, kaybet: 0 }
      if (d.sonuc === 'kazanıldı') sirketAgg[sid].kazan++
      else if (d.sonuc === 'uzlaşma') sirketAgg[sid].uzlasma++
      else if (d.sonuc === 'kaybedildi') sirketAgg[sid].kaybet++
    })
    const sirket = Object.values(sirketAgg).sort((a, b) => b.kazan + b.uzlasma - a.kazan - a.uzlasma)

    // by month
    const aylikAgg: Record<string, { kazan: number; uzlasma: number; kaybet: number }> = {}
    tumDosyalar.forEach(d => {
      if (!d.sonuc || d.sonuc === 'devam') return
      const ay = d.updated_at?.substring(0, 7) ?? d.created_at.substring(0, 7)
      if (!aylikAgg[ay]) aylikAgg[ay] = { kazan: 0, uzlasma: 0, kaybet: 0 }
      if (d.sonuc === 'kazanıldı') aylikAgg[ay].kazan++
      else if (d.sonuc === 'uzlaşma') aylikAgg[ay].uzlasma++
      else if (d.sonuc === 'kaybedildi') aylikAgg[ay].kaybet++
    })
    const aylik = Object.entries(aylikAgg)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([ay, d]) => ({ ay: ayLabel(ay), ...d }))

    return { sirket, tur, aylik }
  }),

  // ── Arabuluculuk ───────────────────────────────────────────────────────────
  arabuluculuk: protectedProcedure.query(async () => {
    const tumDosyalar = await db.select().from(dosya)
    const bugun = new Date()

    // Monthly breakdown (group by created_at month, STK dosyalar)
    const stkDosyalar = tumDosyalar.filter(d => d.tur === 'STK')

    const aylikAgg: Record<string, {
      ara: number; dava: number
      araCoz: number; davaCoz: number
      araSureToplam: number; araSureAdet: number
      davaSureToplam: number; davaSureAdet: number
    }> = {}

    stkDosyalar.forEach(d => {
      const surec = parseSurecDetay(d.surec_detay)
      const asama = surec.stk?.asama
      const ay    = d.created_at.substring(0, 7)
      if (!aylikAgg[ay]) aylikAgg[ay] = { ara:0, dava:0, araCoz:0, davaCoz:0, araSureToplam:0, araSureAdet:0, davaSureToplam:0, davaSureAdet:0 }

      const isAra  = asama === 'ARABULUCULUK'
      const isDava = asama ? DAVA_ASAMALARI.has(asama) : false
      const cozuldu = !!d.sonuc && d.sonuc !== 'devam'

      if (isAra) {
        aylikAgg[ay].ara++
        if (cozuldu) aylikAgg[ay].araCoz++
        const basTarih = surec.stk?.ihtar_tarihi ?? d.created_at
        const sure = daysBetween(basTarih, bugun)
        aylikAgg[ay].araSureToplam += sure
        aylikAgg[ay].araSureAdet++
      } else if (isDava) {
        aylikAgg[ay].dava++
        if (cozuldu) aylikAgg[ay].davaCoz++
        const basTarih = surec.stk?.basvuru_tarihi ?? surec.stk?.ihtar_tarihi ?? d.created_at
        const sure = daysBetween(basTarih, bugun)
        aylikAgg[ay].davaSureToplam += sure
        aylikAgg[ay].davaSureAdet++
      }
    })

    const aylik = Object.entries(aylikAgg)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([ay, d]) => ({
        ay: ayLabel(ay),
        ara:  d.ara,
        dava: d.dava,
        araCoz:  d.araCoz,
        davaCoz: d.davaCoz,
        araSure:  d.araSureAdet  > 0 ? Math.round(d.araSureToplam  / d.araSureAdet)  : 0,
        davaSure: d.davaSureAdet > 0 ? Math.round(d.davaSureToplam / d.davaSureAdet) : 0,
      }))

    return { aylik }
  }),

  // ── Zamanaşımı ─────────────────────────────────────────────────────────────
  zamanasimi: protectedProcedure.query(async () => {
    const [tumDosyalar, tumMuvekkil, tumSirket, tumSigortaTuru] = await Promise.all([
      db.select().from(dosya),
      db.select().from(muvekkil),
      db.select().from(sigortaSirketi),
      db.select().from(sigortaTuru),
    ])

    const muvekkilMap  = Object.fromEntries(tumMuvekkil.map(m => [m.id, `${m.ad} ${m.soyad}`]))
    const sirketMap    = Object.fromEntries(tumSirket.map(s => [s.id, s.ad]))
    const sigortaTuruMap = Object.fromEntries(tumSigortaTuru.map(t => [t.id, t.ad]))
    const bugun = new Date()

    const dosyalar = tumDosyalar
      .flatMap(d => {
        if (!d.kaza_tarihi || d.durum !== 'aktif') return []
        const turuAd = d.sigorta_turu_id ? sigortaTuruMap[d.sigorta_turu_id] : undefined
        const yil  = zaYil(d.tur, turuAd)
        const son  = new Date(d.kaza_tarihi)
        son.setFullYear(son.getFullYear() + yil)
        const kalan = Math.ceil((son.getTime() - bugun.getTime()) / 86_400_000)
        return [{
          no: d.dosya_no,
          muvekkil: muvekkilMap[d.muvekkil_id] ?? '',
          sirket: d.karsitaraf_sigorta_id ? (sirketMap[d.karsitaraf_sigorta_id] ?? '') : '',
          tur: turuAd ?? TUR_LABEL[d.tur] ?? d.tur,
          basTarih: d.kaza_tarihi,
          zamanasimıYil: yil,
          kalanGun: kalan,
          risk: zaRisk(kalan),
        }]
      })
      .sort((a, b) => a.kalanGun - b.kalanGun)

    return { dosyalar }
  }),

  // ── Dosya Raporu ───────────────────────────────────────────────────────────
  dosya: protectedProcedure.query(async () => {
    const [tumDosyalar, tumFinans, tumSigortaTuru] = await Promise.all([
      db.select().from(dosya),
      db.select().from(finans_kalemi),
      db.select().from(sigortaTuru),
    ])

    const sigortaTuruMap = Object.fromEntries(tumSigortaTuru.map(t => [t.id, t.ad]))

    // status breakdown
    const statusAgg: Record<string, number> = {}
    tumDosyalar.forEach(d => { statusAgg[d.durum] = (statusAgg[d.durum] ?? 0) + 1 })
    const STATUS_RENK: Record<string, string> = { aktif: '#22c55e', arsiv: '#94a3b8' }
    const status = Object.entries(statusAgg).map(([durum, adet]) => ({
      durum: durum === 'aktif' ? 'Aktif' : durum === 'arsiv' ? 'Arşiv' : durum,
      adet,
      renk: STATUS_RENK[durum] ?? '#1c768f',
    }))

    // tur breakdown with financials
    const TUR_COLORS = ['#1c768f','#22c55e','#f97316','#746cac','#ef4444','#f59e0b']
    const turAgg: Record<string, { label: string; gelen: number; giden: number; masraf: number; adet: number; renk: string }> = {}

    tumDosyalar.forEach((d) => {
      const turKey   = d.sigorta_turu_id ? String(d.sigorta_turu_id) : d.tur
      const turLabel = d.sigorta_turu_id ? sigortaTuruMap[d.sigorta_turu_id] : (TUR_LABEL[d.tur] ?? d.tur)
      if (!turAgg[turKey]) {
        turAgg[turKey] = { label: turLabel ?? turKey, gelen: 0, giden: 0, masraf: 0, adet: 0, renk: TUR_COLORS[Object.keys(turAgg).length % TUR_COLORS.length] }
      }
      turAgg[turKey].adet++
    })
    const dosyaById = new Map(tumDosyalar.map(d => [d.id, d]))
    tumFinans.forEach(f => {
      const d = dosyaById.get(f.dosya_id)
      if (!d) return
      const turKey = d.sigorta_turu_id ? String(d.sigorta_turu_id) : d.tur
      if (!turAgg[turKey]) return
      if (f.tur === 'Gelen')  turAgg[turKey].gelen  += f.tutar ?? 0
      if (f.tur === 'Giden')  turAgg[turKey].giden  += f.tutar ?? 0
      if (f.tur === 'Masraf') turAgg[turKey].masraf += f.tutar ?? 0
    })

    const tur = Object.entries(turAgg).map(([key, v]) => ({
      tur: key, label: v.label, gelen: v.gelen, giden: v.giden, masraf: v.masraf, adet: v.adet, renk: v.renk,
    }))

    return { status, tur }
  }),

  // ── Müvekkil Raporu ────────────────────────────────────────────────────────
  muvekkil: protectedProcedure.query(async () => {
    const [tumMuvekkil, tumDosyalar, tumFinans] = await Promise.all([
      db.select().from(muvekkil),
      db.select().from(dosya),
      db.select().from(finans_kalemi),
    ])

    const MONTHS_TR_IDX = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara']

    // Index once: O(d + f) instead of O(müvekkil × dosya × finans) nested scans.
    const dosyalarByMuvekkil = new Map<number, typeof tumDosyalar>()
    for (const d of tumDosyalar) {
      const arr = dosyalarByMuvekkil.get(d.muvekkil_id)
      if (arr) arr.push(d); else dosyalarByMuvekkil.set(d.muvekkil_id, [d])
    }
    const finansByDosya = new Map<number, typeof tumFinans>()
    for (const f of tumFinans) {
      const arr = finansByDosya.get(f.dosya_id)
      if (arr) arr.push(f); else finansByDosya.set(f.dosya_id, [f])
    }

    const rows = tumMuvekkil
      .flatMap(m => {
        const mDosyalar = dosyalarByMuvekkil.get(m.id) ?? []
        if (!mDosyalar.length) return []
        const mFinans   = mDosyalar.flatMap(d => finansByDosya.get(d.id) ?? [])
        const tahsilat  = mFinans.filter(f => f.tur === 'Gelen').reduce((s, f) => s + (f.tutar ?? 0), 0)
        const topTalep  = mDosyalar.reduce((s, d) => s + (d.talep_tutari ?? 0), 0)
        const oran      = topTalep > 0 ? Math.round((tahsilat / topTalep) * 100) : 0
        const aktif     = mDosyalar.some(d => d.durum === 'aktif')
        const lastFinans = mFinans.length
          ? mFinans.reduce((a, b) => (b.tarih > a.tarih ? b : a))
          : undefined
        let son = ''
        if (lastFinans) {
          const [y, mo] = lastFinans.tarih.substring(0, 7).split('-').map(Number)
          son = `${MONTHS_TR_IDX[mo - 1]} ${y}`
        }
        return [{
          ad: `${m.ad} ${m.soyad}`,
          dosya: mDosyalar.length,
          tahsilat,
          oran,
          durum: aktif ? ('Aktif' as const) : ('Pasif' as const),
          son,
        }]
      })

    rows.sort((a, b) => b.tahsilat - a.tahsilat)
    return { rows }
  }),

  // ── Dava Süreci ────────────────────────────────────────────────────────────
  davaSureci: protectedProcedure.query(async () => {
    const [tumDosyalar, tumMuvekkil, tumSirket] = await Promise.all([
      db.select().from(dosya),
      db.select().from(muvekkil),
      db.select().from(sigortaSirketi),
    ])

    const muvekkilMap = Object.fromEntries(tumMuvekkil.map(m => [m.id, `${m.ad} ${m.soyad}`]))
    const sirketMap   = Object.fromEntries(tumSirket.map(s => [s.id, s.ad]))
    const bugun       = new Date()
    const thisYear    = bugun.getFullYear()

    // Compute per-dosya: asama + elapsed days
    const dosyaInfo = tumDosyalar.map(d => {
      const surec  = parseSurecDetay(d.surec_detay)
      const asama  = d.tur === 'STK' ? surec.stk?.asama : surec.mahkeme?.asama
      const start  = surec.stk?.ihtar_tarihi ?? d.created_at
      const gun    = daysBetween(start, bugun)
      const tutar  = (d.talep_tutari ?? 0) + (d.karar_tutari ?? 0)
      const asamaLabel: string = (() => {
        if (!asama) return 'Başvuru'
        const map: Record<string, string> = {
          'İHTAR': 'Başvuru', 'ARABULUCULUK': 'Uzlaşma', 'BAŞVURU': 'Başvuru',
          'ÖN_İNCELEME': 'Dava', 'BİLİRKİŞİ': 'Dava', 'ISLAH': 'Dava',
          'KARAR': 'Karar & Tahsilat', 'İTİRAZ': 'Karar & Tahsilat',
          'KESİNLEŞME': 'Karar & Tahsilat',
          'DAVA_DİLEKÇESİ_TEBLİĞ': 'Dava', 'CEVAP_DİLEKÇESİ_TEBLİĞ': 'Dava',
          'DURUŞMALAR': 'Dava',
        }
        return map[asama] ?? 'Belge Toplama'
      })()
      return {
        no: d.dosya_no,
        muvekkil: muvekkilMap[d.muvekkil_id] ?? '',
        sirket: d.karsitaraf_sigorta_id ? (sirketMap[d.karsitaraf_sigorta_id] ?? '') : '',
        asama: asamaLabel,
        gun,
        tutar,
        durum: d.durum,
        sid: d.karsitaraf_sigorta_id,
        created_at: d.created_at,
      }
    })

    // asamalar
    const STAGE_RENK: Record<string, string> = {
      'Başvuru': '#1c768f', 'Belge Toplama': '#22c55e', 'Şirket Görüşme': '#f97316',
      'Uzlaşma': '#746cac', 'Dava': '#ef4444', 'Karar & Tahsilat': '#f59e0b',
    }
    const STAGES = ['Başvuru', 'Belge Toplama', 'Uzlaşma', 'Dava', 'Karar & Tahsilat']
    const asamaAgg: Record<string, number[]> = {}
    dosyaInfo.forEach(d => {
      if (!asamaAgg[d.asama]) asamaAgg[d.asama] = []
      asamaAgg[d.asama].push(d.gun)
    })
    const asamalar = STAGES.flatMap(a => {
      const gunler = asamaAgg[a] ?? []
      if (!gunler.length) return []
      return [{
        asama: a,
        ort: Math.round(gunler.reduce((s, g) => s + g, 0) / gunler.length),
        min: Math.min(...gunler),
        max: Math.max(...gunler),
        adet: gunler.length,
        renk: STAGE_RENK[a] ?? '#94a3b8',
      }]
    })

    // uzunDosyalar
    const uzunDosyalar = dosyaInfo
      .filter(d => d.durum === 'aktif')
      .sort((a, b) => b.gun - a.gun)
      .slice(0, 10)
      .map(d => ({ no: d.no, muvekkil: d.muvekkil, sirket: d.sirket, asama: d.asama, gun: d.gun, tutar: d.tutar }))

    // sirketSureleri
    const sirketGunAgg: Record<number, number[]> = {}
    dosyaInfo.forEach(d => {
      if (!d.sid) return
      if (!sirketGunAgg[d.sid]) sirketGunAgg[d.sid] = []
      sirketGunAgg[d.sid].push(d.gun)
    })
    const sirketSureleri = Object.entries(sirketGunAgg)
      .map(([sid, gunler]) => ({
        ad: sirketMap[Number(sid)] ?? '',
        ortGun: Math.round(gunler.reduce((s, g) => s + g, 0) / gunler.length),
      }))
      .sort((a, b) => b.ortGun - a.ortGun)

    // kapananYil
    const kapananYil = tumDosyalar.filter(d =>
      d.durum === 'arsiv' && d.updated_at?.startsWith(String(thisYear))
    ).length

    return { asamalar, uzunDosyalar, sirketSureleri, kapananYil }
  }),

  // ── Şirket Analizi ─────────────────────────────────────────────────────────
  sirket: protectedProcedure.query(async () => {
    const [tumDosyalar, tumFinans, tumSirket] = await Promise.all([
      db.select().from(dosya),
      db.select().from(finans_kalemi),
      db.select().from(sigortaSirketi),
    ])

    const sirketMap = Object.fromEntries(tumSirket.map(s => [s.id, s.ad]))
    const sirketAgg: Record<number, { ad: string; talep: number; karar: number; tahsilat: number; dosya: number; tur: string }> = {}
    tumDosyalar.forEach(d => {
      if (!d.karsitaraf_sigorta_id) return
      const sid = d.karsitaraf_sigorta_id
      const ad  = sirketMap[sid] ?? ''
      if (!sirketAgg[sid]) sirketAgg[sid] = { ad, talep: 0, karar: 0, tahsilat: 0, dosya: 0, tur: d.tur }
      sirketAgg[sid].talep += d.talep_tutari ?? 0
      sirketAgg[sid].karar += d.karar_tutari ?? 0
      sirketAgg[sid].dosya++
    })
    const dosyaById = new Map(tumDosyalar.map(d => [d.id, d]))
    tumFinans.forEach(f => {
      if (f.tur !== 'Gelen') return
      const d = dosyaById.get(f.dosya_id)
      if (!d?.karsitaraf_sigorta_id) return
      sirketAgg[d.karsitaraf_sigorta_id].tahsilat += f.tutar ?? 0
    })
    const sirketler = Object.values(sirketAgg).sort((a, b) => {
      const ra = a.karar > 0 ? a.tahsilat / a.karar : 0
      const rb = b.karar > 0 ? b.tahsilat / b.karar : 0
      return rb - ra
    })

    // trend by month (top 4 companies)
    const top4 = sirketler.slice(0, 4)
    const top4Ids = Object.entries(sirketAgg)
      .sort(([, a], [, b]) => {
        const ra = a.karar > 0 ? a.tahsilat / a.karar : 0
        const rb = b.karar > 0 ? b.tahsilat / b.karar : 0
        return rb - ra
      })
      .slice(0, 4)
      .map(([id]) => Number(id))

    // monthly tahsilat per company
    const trendAgg: Record<string, Record<string, number>> = {}
    tumFinans.forEach(f => {
      if (f.tur !== 'Gelen') return
      const d = dosyaById.get(f.dosya_id)
      if (!d?.karsitaraf_sigorta_id) return
      if (!top4Ids.includes(d.karsitaraf_sigorta_id)) return
      const ay  = f.tarih.substring(0, 7)
      const ad  = sirketAgg[d.karsitaraf_sigorta_id]?.ad ?? ''
      if (!trendAgg[ay]) trendAgg[ay] = {}
      trendAgg[ay][ad] = (trendAgg[ay][ad] ?? 0) + (f.tutar ?? 0)
    })

    // convert to percent rates
    const oranTrend = Object.entries(trendAgg)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([ay, vals]) => {
        const row: Record<string, number | string> = { ay: ayLabel(ay) }
        top4.forEach(s => {
          const talep = s.talep || 1
          row[s.ad] = Math.round(((vals[s.ad] ?? 0) / talep) * 100)
        })
        return row
      })

    const trendSeries = top4.map(s => s.ad)
    return { sirketler, oranTrend, trendSeries }
  }),
})
