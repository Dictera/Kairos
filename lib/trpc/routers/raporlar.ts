import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/lib/trpc/init'
import { db } from '@/lib/db'
import { and, eq, max } from 'drizzle-orm'
import {
  dosya,
  muvekkil,
  finans_kalemi,
  olayGunlugu,
  sigortaSirketi,
  sigortaTuru,
  parseSurecDetay,
  type SurecDetay,
} from '@/lib/schema'

const MONTHS_TR = [
  'Oca',
  'Şub',
  'Mar',
  'Nis',
  'May',
  'Haz',
  'Tem',
  'Ağu',
  'Eyl',
  'Eki',
  'Kas',
  'Ara',
]
const TUR_RENK: Record<string, string> = { STK: '#1c768f', AT: '#22c55e', AH: '#f97316' }
const TUR_LABEL: Record<string, string> = { STK: 'STK', AT: 'Asliye Ticaret', AH: 'Asliye Hukuk' }

const DAVA_ASAMALARI = new Set([
  'BAŞVURU',
  'ÖN_İNCELEME',
  'BİLİRKİŞİ',
  'ISLAH',
  'KARAR',
  'İTİRAZ',
  'KESİNLEŞME',
])

function daysBetween(from: string, to: Date | string = new Date()): number {
  const d = new Date(from)
  const end = typeof to === 'string' ? new Date(to) : to
  return Math.max(0, Math.ceil((end.getTime() - d.getTime()) / 86_400_000))
}

/** "2026-03" → "Mar'26" — same format as enrichAy on the client, so months of different years stay distinct. */
function ayLabel(ay: string): string {
  const [y, m] = ay.split('-').map(Number)
  const ad = MONTHS_TR[m - 1]
  return ad ? `${ad}'${String(y).slice(2)}` : ay
}

/**
 * When each archived dosya was closed: the latest "Dosya arşivlendi" entry in
 * the activity log. dosya.updated_at is not usable on its own because any
 * later edit moves it.
 */
async function arsivlenmeTarihleri(): Promise<Map<number, string>> {
  const rows = await db
    .select({ dosya_id: olayGunlugu.dosya_id, tarih: max(olayGunlugu.created_at) })
    .from(olayGunlugu)
    .where(
      and(
        eq(olayGunlugu.olay_turu, 'durum_degisikligi'),
        eq(olayGunlugu.aciklama, 'Dosya arşivlendi'),
      ),
    )
    .groupBy(olayGunlugu.dosya_id)
  return new Map(rows.flatMap((r) => (r.tarih ? [[r.dosya_id, r.tarih] as const] : [])))
}

/** Closing date of an archived dosya (null while active); updated_at for rows archived before logging. */
function kapanisTarihi(
  d: { id: number; durum: string; updated_at: string },
  arsivlenme: Map<number, string>,
): string | null {
  if (d.durum !== 'arsiv') return null
  return arsivlenme.get(d.id) ?? d.updated_at
}

/** Best available date of a case's outcome: the decision date when recorded, else the last edit. */
function sonucTarihi(surec: SurecDetay, updatedAt: string): string {
  return (
    surec.stk?.karar_tarihi ??
    surec.mahkeme?.karar_tebliğ_tarihi ??
    surec.stk?.kesinlesme_tarihi ??
    surec.mahkeme?.kesinlesme_tarihi ??
    updatedAt
  )
}

export const raporlarRouter = createTRPCRouter({
  // ── Yönetim Özeti ──────────────────────────────────────────────────────────
  yonetimOzeti: protectedProcedure.query(async () => {
    const [tumDosyalar, tumFinans, tumSirket] = await Promise.all([
      db.select().from(dosya),
      db.select().from(finans_kalemi),
      db.select().from(sigortaSirketi),
    ])

    const sirketMap = Object.fromEntries(tumSirket.map((s) => [s.id, s.ad]))

    // ayBuYil — monthly rows of the current year
    const yil = String(new Date().getFullYear())
    const byMonth: Record<string, { gelen: number; giden: number; masraf: number; dosya: number }> =
      {}
    tumFinans.forEach((f) => {
      if (!f.tarih.startsWith(yil)) return
      const ay = f.tarih.substring(0, 7)
      if (!byMonth[ay]) byMonth[ay] = { gelen: 0, giden: 0, masraf: 0, dosya: 0 }
      if (f.tur === 'Gelen') byMonth[ay].gelen += f.tutar ?? 0
      if (f.tur === 'Giden') byMonth[ay].giden += f.tutar ?? 0
      if (f.tur === 'Masraf') byMonth[ay].masraf += f.tutar ?? 0
    })
    tumDosyalar.forEach((d) => {
      if (!d.created_at.startsWith(yil)) return
      const ay = d.created_at.substring(0, 7)
      if (!byMonth[ay]) byMonth[ay] = { gelen: 0, giden: 0, masraf: 0, dosya: 0 }
      byMonth[ay].dosya++
    })
    const ayBuYil = Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([ay, d]) => ({ ay, ...d }))

    // toplam — portfolio-wide totals. sirketler below is cut to the top 8 and
    // skips dosyalar without a karşı taraf şirket, so KPIs must not sum it.
    const toplam = {
      talep: tumDosyalar.reduce((a, d) => a + (d.talep_tutari ?? 0), 0),
      karar: tumDosyalar.reduce((a, d) => a + (d.karar_tutari ?? 0), 0),
      tahsilat: tumFinans.reduce((a, f) => a + (f.tur === 'Gelen' ? (f.tutar ?? 0) : 0), 0),
    }

    // sirketler — per company talep/karar/tahsilat
    const sirketAgg: Record<
      number,
      { ad: string; talep: number; karar: number; tahsilat: number; dosya: number; tur: string }
    > = {}
    tumDosyalar.forEach((d) => {
      if (!d.karsitaraf_sigorta_id) return
      const sid = d.karsitaraf_sigorta_id
      if (!sirketAgg[sid])
        sirketAgg[sid] = {
          ad: sirketMap[sid] ?? '',
          talep: 0,
          karar: 0,
          tahsilat: 0,
          dosya: 0,
          tur: d.tur,
        }
      sirketAgg[sid].talep += d.talep_tutari ?? 0
      sirketAgg[sid].karar += d.karar_tutari ?? 0
      sirketAgg[sid].dosya++
    })
    const dosyaById = new Map(tumDosyalar.map((d) => [d.id, d]))
    tumFinans.forEach((f) => {
      if (f.tur !== 'Gelen') return
      const d = dosyaById.get(f.dosya_id)
      if (!d?.karsitaraf_sigorta_id) return
      sirketAgg[d.karsitaraf_sigorta_id].tahsilat += f.tutar ?? 0
    })
    const sirketler = Object.values(sirketAgg)
      .sort((a, b) => b.talep - a.talep)
      .slice(0, 8)

    // sonucTur — by dosya.tur
    const sonucTur = ['STK', 'AT', 'AH'].map((tur) => {
      const td = tumDosyalar.filter((d) => d.tur === tur)
      const kazan = td.filter((d) => d.sonuc === 'kazanıldı').length
      const uzlasma = td.filter((d) => d.sonuc === 'uzlaşma').length
      const kaybet = td.filter((d) => d.sonuc === 'kaybedildi').length
      const devam = td.length - kazan - uzlasma - kaybet
      return {
        tur: TUR_LABEL[tur] ?? tur,
        kazan,
        uzlasma,
        kaybet,
        devam,
        renk: TUR_RENK[tur] ?? '#94a3b8',
      }
    })

    // dosyaStatus
    const statusAgg: Record<string, number> = {}
    tumDosyalar.forEach((d) => {
      statusAgg[d.durum] = (statusAgg[d.durum] ?? 0) + 1
    })
    const STATUS_RENK: Record<string, string> = { aktif: '#22c55e', arsiv: '#94a3b8' }
    const dosyaStatus = Object.entries(statusAgg).map(([durum, adet]) => ({
      durum: durum === 'aktif' ? 'Aktif' : durum === 'arsiv' ? 'Arşiv' : durum,
      adet,
      renk: STATUS_RENK[durum] ?? '#1c768f',
    }))

    return { yil, ayBuYil, toplam, sirketler, sonucTur, dosyaStatus }
  }),

  // ── Genel Bakış ────────────────────────────────────────────────────────────
  genelBakis: protectedProcedure
    .input(z.object({ yil: z.union([z.literal('all'), z.string().regex(/^\d{4}$/)]) }))
    .query(async ({ input }) => {
      const [tumFinans, tumDosyalar] = await Promise.all([
        db.select().from(finans_kalemi),
        db.select({ id: dosya.id, created_at: dosya.created_at }).from(dosya),
      ])

      const byMonth: Record<
        string,
        { gelen: number; giden: number; masraf: number; dosya: number }
      > = {}
      tumFinans.forEach((f) => {
        if (input.yil !== 'all' && !f.tarih.startsWith(input.yil)) return
        const ay = f.tarih.substring(0, 7)
        if (!byMonth[ay]) byMonth[ay] = { gelen: 0, giden: 0, masraf: 0, dosya: 0 }
        if (f.tur === 'Gelen') byMonth[ay].gelen += f.tutar ?? 0
        if (f.tur === 'Giden') byMonth[ay].giden += f.tutar ?? 0
        if (f.tur === 'Masraf') byMonth[ay].masraf += f.tutar ?? 0
      })
      tumDosyalar.forEach((d) => {
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

    const sirketMap = Object.fromEntries(tumSirket.map((s) => [s.id, s.ad]))
    const sirketAgg: Record<
      number,
      { ad: string; talep: number; karar: number; tahsilat: number; dosya: number; tur: string }
    > = {}

    tumDosyalar.forEach((d) => {
      if (!d.karsitaraf_sigorta_id) return
      const sid = d.karsitaraf_sigorta_id
      if (!sirketAgg[sid])
        sirketAgg[sid] = {
          ad: sirketMap[sid] ?? '',
          talep: 0,
          karar: 0,
          tahsilat: 0,
          dosya: 0,
          tur: d.tur,
        }
      sirketAgg[sid].talep += d.talep_tutari ?? 0
      sirketAgg[sid].karar += d.karar_tutari ?? 0
      sirketAgg[sid].dosya++
    })
    const dosyaById = new Map(tumDosyalar.map((d) => [d.id, d]))
    tumFinans.forEach((f) => {
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

    const sirketMap = Object.fromEntries(tumSirket.map((s) => [s.id, s.ad]))

    // by tur
    const tur = ['STK', 'AT', 'AH'].map((t) => {
      const td = tumDosyalar.filter((d) => d.tur === t)
      const kazan = td.filter((d) => d.sonuc === 'kazanıldı').length
      const uzlasma = td.filter((d) => d.sonuc === 'uzlaşma').length
      const kaybet = td.filter((d) => d.sonuc === 'kaybedildi').length
      const devam = td.length - kazan - uzlasma - kaybet
      return {
        tur: TUR_LABEL[t] ?? t,
        kazan,
        uzlasma,
        kaybet,
        devam,
        renk: TUR_RENK[t] ?? '#94a3b8',
      }
    })

    // by sirket
    const sirketAgg: Record<
      number,
      { ad: string; kazan: number; uzlasma: number; kaybet: number }
    > = {}
    tumDosyalar.forEach((d) => {
      if (!d.karsitaraf_sigorta_id) return
      const sid = d.karsitaraf_sigorta_id
      if (!sirketAgg[sid])
        sirketAgg[sid] = { ad: sirketMap[sid] ?? '', kazan: 0, uzlasma: 0, kaybet: 0 }
      if (d.sonuc === 'kazanıldı') sirketAgg[sid].kazan++
      else if (d.sonuc === 'uzlaşma') sirketAgg[sid].uzlasma++
      else if (d.sonuc === 'kaybedildi') sirketAgg[sid].kaybet++
    })
    const sirket = Object.values(sirketAgg).sort(
      (a, b) => b.kazan + b.uzlasma - a.kazan - a.uzlasma,
    )

    // by month
    const aylikAgg: Record<string, { kazan: number; uzlasma: number; kaybet: number }> = {}
    tumDosyalar.forEach((d) => {
      if (!d.sonuc || d.sonuc === 'devam') return
      const ay = sonucTarihi(parseSurecDetay(d.surec_detay), d.updated_at).substring(0, 7)
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
    const stkDosyalar = tumDosyalar.filter((d) => d.tur === 'STK')

    const aylikAgg: Record<
      string,
      {
        ara: number
        dava: number
        araCoz: number
        davaCoz: number
        araSureToplam: number
        araSureAdet: number
        davaSureToplam: number
        davaSureAdet: number
      }
    > = {}

    stkDosyalar.forEach((d) => {
      const surec = parseSurecDetay(d.surec_detay)
      const asama = surec.stk?.asama
      const ay = d.created_at.substring(0, 7)
      if (!aylikAgg[ay])
        aylikAgg[ay] = {
          ara: 0,
          dava: 0,
          araCoz: 0,
          davaCoz: 0,
          araSureToplam: 0,
          araSureAdet: 0,
          davaSureToplam: 0,
          davaSureAdet: 0,
        }

      const isAra = asama === 'ARABULUCULUK'
      const isDava = asama ? DAVA_ASAMALARI.has(asama) : false
      const cozuldu = !!d.sonuc && d.sonuc !== 'devam'

      if (isAra) {
        aylikAgg[ay].ara++
        if (cozuldu) aylikAgg[ay].araCoz++
        const basTarih = surec.stk?.ihtar_tarihi ?? d.created_at
        // Ends at the final mediation minutes when recorded; open files count to today.
        const sure = daysBetween(basTarih, surec.stk?.arabuluculuk_son_tutanak_tarihi ?? bugun)
        aylikAgg[ay].araSureToplam += sure
        aylikAgg[ay].araSureAdet++
      } else if (isDava) {
        aylikAgg[ay].dava++
        if (cozuldu) aylikAgg[ay].davaCoz++
        const basTarih = surec.stk?.basvuru_tarihi ?? surec.stk?.ihtar_tarihi ?? d.created_at
        const bitis = surec.stk?.kesinlesme_tarihi ?? surec.stk?.karar_tarihi ?? bugun
        const sure = daysBetween(basTarih, bitis)
        aylikAgg[ay].davaSureToplam += sure
        aylikAgg[ay].davaSureAdet++
      }
    })

    const aylik = Object.entries(aylikAgg)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([ay, d]) => ({
        ay: ayLabel(ay),
        ara: d.ara,
        dava: d.dava,
        araCoz: d.araCoz,
        davaCoz: d.davaCoz,
        araSure: d.araSureAdet > 0 ? Math.round(d.araSureToplam / d.araSureAdet) : null,
        davaSure: d.davaSureAdet > 0 ? Math.round(d.davaSureToplam / d.davaSureAdet) : null,
      }))

    // Overall averages weighted by case count. Averaging the monthly averages
    // would count a month without any case as 0 days.
    const toplamlar = Object.values(aylikAgg).reduce(
      (a, d) => ({
        araGun: a.araGun + d.araSureToplam,
        araAdet: a.araAdet + d.araSureAdet,
        davaGun: a.davaGun + d.davaSureToplam,
        davaAdet: a.davaAdet + d.davaSureAdet,
      }),
      { araGun: 0, araAdet: 0, davaGun: 0, davaAdet: 0 },
    )
    const ozet = {
      araSure: toplamlar.araAdet > 0 ? Math.round(toplamlar.araGun / toplamlar.araAdet) : null,
      davaSure: toplamlar.davaAdet > 0 ? Math.round(toplamlar.davaGun / toplamlar.davaAdet) : null,
    }

    return { aylik, ozet }
  }),

  // ── Dosya Raporu ───────────────────────────────────────────────────────────
  dosya: protectedProcedure.query(async () => {
    const [tumDosyalar, tumFinans, tumSigortaTuru] = await Promise.all([
      db.select().from(dosya),
      db.select().from(finans_kalemi),
      db.select().from(sigortaTuru),
    ])

    const sigortaTuruMap = Object.fromEntries(tumSigortaTuru.map((t) => [t.id, t.ad]))

    // status breakdown
    const statusAgg: Record<string, number> = {}
    tumDosyalar.forEach((d) => {
      statusAgg[d.durum] = (statusAgg[d.durum] ?? 0) + 1
    })
    const STATUS_RENK: Record<string, string> = { aktif: '#22c55e', arsiv: '#94a3b8' }
    const status = Object.entries(statusAgg).map(([durum, adet]) => ({
      durum: durum === 'aktif' ? 'Aktif' : durum === 'arsiv' ? 'Arşiv' : durum,
      adet,
      renk: STATUS_RENK[durum] ?? '#1c768f',
    }))

    // tur breakdown with financials
    const TUR_COLORS = ['#1c768f', '#22c55e', '#f97316', '#746cac', '#ef4444', '#f59e0b']
    const turAgg: Record<
      string,
      { label: string; gelen: number; giden: number; masraf: number; adet: number; renk: string }
    > = {}

    tumDosyalar.forEach((d) => {
      const turKey = d.sigorta_turu_id ? String(d.sigorta_turu_id) : d.tur
      const turLabel = d.sigorta_turu_id
        ? sigortaTuruMap[d.sigorta_turu_id]
        : (TUR_LABEL[d.tur] ?? d.tur)
      if (!turAgg[turKey]) {
        turAgg[turKey] = {
          label: turLabel ?? turKey,
          gelen: 0,
          giden: 0,
          masraf: 0,
          adet: 0,
          renk: TUR_COLORS[Object.keys(turAgg).length % TUR_COLORS.length],
        }
      }
      turAgg[turKey].adet++
    })
    const dosyaById = new Map(tumDosyalar.map((d) => [d.id, d]))
    tumFinans.forEach((f) => {
      const d = dosyaById.get(f.dosya_id)
      if (!d) return
      const turKey = d.sigorta_turu_id ? String(d.sigorta_turu_id) : d.tur
      if (!turAgg[turKey]) return
      if (f.tur === 'Gelen') turAgg[turKey].gelen += f.tutar ?? 0
      if (f.tur === 'Giden') turAgg[turKey].giden += f.tutar ?? 0
      if (f.tur === 'Masraf') turAgg[turKey].masraf += f.tutar ?? 0
    })

    const tur = Object.entries(turAgg).map(([key, v]) => ({
      tur: key,
      label: v.label,
      gelen: v.gelen,
      giden: v.giden,
      masraf: v.masraf,
      adet: v.adet,
      renk: v.renk,
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

    const MONTHS_TR_IDX = [
      'Oca',
      'Şub',
      'Mar',
      'Nis',
      'May',
      'Haz',
      'Tem',
      'Ağu',
      'Eyl',
      'Eki',
      'Kas',
      'Ara',
    ]

    // Index once: O(d + f) instead of O(müvekkil × dosya × finans) nested scans.
    const dosyalarByMuvekkil = new Map<number, typeof tumDosyalar>()
    for (const d of tumDosyalar) {
      const arr = dosyalarByMuvekkil.get(d.muvekkil_id)
      if (arr) arr.push(d)
      else dosyalarByMuvekkil.set(d.muvekkil_id, [d])
    }
    const finansByDosya = new Map<number, typeof tumFinans>()
    for (const f of tumFinans) {
      const arr = finansByDosya.get(f.dosya_id)
      if (arr) arr.push(f)
      else finansByDosya.set(f.dosya_id, [f])
    }

    const rows = tumMuvekkil.flatMap((m) => {
      const mDosyalar = dosyalarByMuvekkil.get(m.id) ?? []
      if (!mDosyalar.length) return []
      const mFinans = mDosyalar.flatMap((d) => finansByDosya.get(d.id) ?? [])
      const tahsilat = mFinans
        .filter((f) => f.tur === 'Gelen')
        .reduce((s, f) => s + (f.tutar ?? 0), 0)
      const topTalep = mDosyalar.reduce((s, d) => s + (d.talep_tutari ?? 0), 0)
      const oran = topTalep > 0 ? Math.round((tahsilat / topTalep) * 100) : 0
      const aktif = mDosyalar.some((d) => d.durum === 'aktif')
      const lastFinans = mFinans.length
        ? mFinans.reduce((a, b) => (b.tarih > a.tarih ? b : a))
        : undefined
      let son = ''
      if (lastFinans) {
        const [y, mo] = lastFinans.tarih.substring(0, 7).split('-').map(Number)
        son = `${MONTHS_TR_IDX[mo - 1]} ${y}`
      }
      return [
        {
          ad: `${m.ad} ${m.soyad}`,
          dosya: mDosyalar.length,
          tahsilat,
          oran,
          durum: aktif ? ('Aktif' as const) : ('Pasif' as const),
          son,
        },
      ]
    })

    rows.sort((a, b) => b.tahsilat - a.tahsilat)
    return { rows }
  }),

  // ── Dava Süreci ────────────────────────────────────────────────────────────
  davaSureci: protectedProcedure.query(async () => {
    const [tumDosyalar, tumMuvekkil, tumSirket, arsivlenme] = await Promise.all([
      db.select().from(dosya),
      db.select().from(muvekkil),
      db.select().from(sigortaSirketi),
      arsivlenmeTarihleri(),
    ])

    const muvekkilMap = Object.fromEntries(tumMuvekkil.map((m) => [m.id, `${m.ad} ${m.soyad}`]))
    const sirketMap = Object.fromEntries(tumSirket.map((s) => [s.id, s.ad]))
    const bugun = new Date()
    const yil = String(bugun.getFullYear())

    // Every STK_ASAMALAR and MAHKEME_ASAMALAR value maps to a group.
    const ASAMA_GRUBU: Record<string, string> = {
      İHTAR: 'Başvuru',
      BAŞVURU: 'Başvuru',
      ARABULUCULUK: 'Uzlaşma',
      DAVA_DİLEKÇESİ_TEBLİĞ: 'Dava',
      CEVAP_DİLEKÇESİ_TEBLİĞ: 'Dava',
      REPLİK_DİLEKÇESİ_TEBLİĞ: 'Dava',
      DUPLİK_DİLEKÇESİ_TEBLİĞ: 'Dava',
      ÖN_İNCELEME: 'Dava',
      BİLİRKİŞİ: 'Dava',
      ISLAH: 'Dava',
      DURUŞMALAR: 'Dava',
      KARAR: 'Karar & Tahsilat',
      KARAR_TEBLİĞ: 'Karar & Tahsilat',
      KESİNLEŞME: 'Karar & Tahsilat',
      İTİRAZ: 'Kanun Yolu',
      İSTİNAF: 'Kanun Yolu',
      TEMYİZ: 'Kanun Yolu',
    }

    // Per dosya: stage group and days elapsed — to today while active, to the
    // closing date once archived (otherwise closed files keep "ageing").
    const dosyaInfo = tumDosyalar.map((d) => {
      const surec = parseSurecDetay(d.surec_detay)
      const asama = d.tur === 'STK' ? surec.stk?.asama : surec.mahkeme?.asama
      const start = surec.stk?.ihtar_tarihi ?? d.created_at
      const kapanis = kapanisTarihi(d, arsivlenme)
      return {
        no: d.dosya_no,
        muvekkil: muvekkilMap[d.muvekkil_id] ?? '',
        sirket: d.karsitaraf_sigorta_id ? (sirketMap[d.karsitaraf_sigorta_id] ?? '') : '',
        asama: asama ? (ASAMA_GRUBU[asama] ?? 'Belge Toplama') : 'Başvuru',
        gun: daysBetween(start, kapanis ?? bugun),
        tutar: d.karar_tutari ?? d.talep_tutari ?? 0,
        aktif: d.durum === 'aktif',
        kapanis,
        sid: d.karsitaraf_sigorta_id,
      }
    })
    const aktifDosyalar = dosyaInfo.filter((d) => d.aktif)
    const kapananDosyalar = dosyaInfo.filter((d) => d.kapanis !== null)

    // asamalar — how long active files have been open, grouped by current stage
    const STAGE_RENK: Record<string, string> = {
      Başvuru: '#1c768f',
      'Belge Toplama': '#22c55e',
      Uzlaşma: '#746cac',
      Dava: '#ef4444',
      'Kanun Yolu': '#0ea5e9',
      'Karar & Tahsilat': '#f59e0b',
    }
    const STAGES = ['Başvuru', 'Belge Toplama', 'Uzlaşma', 'Dava', 'Kanun Yolu', 'Karar & Tahsilat']
    const asamaAgg: Record<string, number[]> = {}
    aktifDosyalar.forEach((d) => {
      if (!asamaAgg[d.asama]) asamaAgg[d.asama] = []
      asamaAgg[d.asama].push(d.gun)
    })
    const asamalar = STAGES.flatMap((a) => {
      const gunler = asamaAgg[a] ?? []
      if (!gunler.length) return []
      return [
        {
          asama: a,
          ort: Math.round(gunler.reduce((s, g) => s + g, 0) / gunler.length),
          min: Math.min(...gunler),
          max: Math.max(...gunler),
          adet: gunler.length,
          renk: STAGE_RENK[a] ?? '#94a3b8',
        },
      ]
    })

    // uzunDosyalar
    const uzunDosyalar = aktifDosyalar
      .toSorted((a, b) => b.gun - a.gun)
      .slice(0, 10)
      .map((d) => ({
        no: d.no,
        muvekkil: d.muvekkil,
        sirket: d.sirket,
        asama: d.asama,
        gun: d.gun,
        tutar: d.tutar,
      }))

    // sirketSureleri — resolution time: opening to closing of closed files
    const sirketGunAgg: Record<number, number[]> = {}
    kapananDosyalar.forEach((d) => {
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

    const ortKapanisGun = kapananDosyalar.length
      ? Math.round(kapananDosyalar.reduce((s, d) => s + d.gun, 0) / kapananDosyalar.length)
      : null
    const kapananYil = kapananDosyalar.filter((d) => d.kapanis?.startsWith(yil)).length

    return {
      asamalar,
      uzunDosyalar,
      sirketSureleri,
      yil,
      kapananYil,
      aktifDosya: aktifDosyalar.length,
      ortKapanisGun,
    }
  }),

  // ── Şirket Analizi ─────────────────────────────────────────────────────────
  sirket: protectedProcedure.query(async () => {
    const [tumDosyalar, tumFinans, tumSirket] = await Promise.all([
      db.select().from(dosya),
      db.select().from(finans_kalemi),
      db.select().from(sigortaSirketi),
    ])

    const sirketMap = Object.fromEntries(tumSirket.map((s) => [s.id, s.ad]))
    const sirketAgg: Record<
      number,
      { ad: string; talep: number; karar: number; tahsilat: number; dosya: number; tur: string }
    > = {}
    tumDosyalar.forEach((d) => {
      if (!d.karsitaraf_sigorta_id) return
      const sid = d.karsitaraf_sigorta_id
      const ad = sirketMap[sid] ?? ''
      if (!sirketAgg[sid])
        sirketAgg[sid] = { ad, talep: 0, karar: 0, tahsilat: 0, dosya: 0, tur: d.tur }
      sirketAgg[sid].talep += d.talep_tutari ?? 0
      sirketAgg[sid].karar += d.karar_tutari ?? 0
      sirketAgg[sid].dosya++
    })
    const dosyaById = new Map(tumDosyalar.map((d) => [d.id, d]))
    tumFinans.forEach((f) => {
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
    tumFinans.forEach((f) => {
      if (f.tur !== 'Gelen') return
      const d = dosyaById.get(f.dosya_id)
      if (!d?.karsitaraf_sigorta_id) return
      if (!top4Ids.includes(d.karsitaraf_sigorta_id)) return
      const ay = f.tarih.substring(0, 7)
      const ad = sirketAgg[d.karsitaraf_sigorta_id]?.ad ?? ''
      if (!trendAgg[ay]) trendAgg[ay] = {}
      trendAgg[ay][ad] = (trendAgg[ay][ad] ?? 0) + (f.tutar ?? 0)
    })

    // convert to percent rates
    const oranTrend = Object.entries(trendAgg)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([ay, vals]) => {
        const row: Record<string, number | string> = { ay: ayLabel(ay) }
        top4.forEach((s) => {
          const talep = s.talep || 1
          row[s.ad] = Math.round(((vals[s.ad] ?? 0) / talep) * 100)
        })
        return row
      })

    const trendSeries = top4.map((s) => s.ad)
    return { sirketler, oranTrend, trendSeries }
  }),
})
