import { createTRPCRouter, protectedProcedure } from '@/lib/trpc/init'
import { db } from '@/lib/db'
import { dosya, muvekkil, finans_kalemi, sigortaSirketi, sigortaTuru, parseSurecDetay } from '@/lib/schema'
import { eq } from 'drizzle-orm'

const TUR_LABEL: Record<string, string> = {
  STK: 'STK',
  AT: 'Asliye Ticaret',
  AH: 'Asliye Hukuk',
}

export const raporRouter = createTRPCRouter({

  yonetimOzeti: protectedProcedure.query(async () => {
    const [tumDosyalar, tumFinans, tumSirket] = await Promise.all([
      db.select().from(dosya),
      db.select().from(finans_kalemi),
      db.select().from(sigortaSirketi),
    ])

    const toplamTahsilat = tumFinans.filter(f => f.tur === 'Gelen').reduce((s, f) => s + (f.tutar || 0), 0)
    const toplamGider = tumFinans.filter(f => f.tur === 'Giden').reduce((s, f) => s + (f.tutar || 0), 0)
    const toplamMasraf = tumFinans.filter(f => f.tur === 'Masraf').reduce((s, f) => s + (f.tutar || 0), 0)
    const toplamTalep = tumDosyalar.reduce((s, d) => s + (d.talep_tutari || 0), 0)
    const toplamKarar = tumDosyalar.reduce((s, d) => s + (d.karar_tutari || 0), 0)

    const aktif = tumDosyalar.filter(d => d.durum === 'aktif').length
    const arsiv = tumDosyalar.filter(d => d.durum === 'arsiv').length
    const kazanilan = tumDosyalar.filter(d => d.sonuc === 'kazanıldı').length
    const uzlasma = tumDosyalar.filter(d => d.sonuc === 'uzlaşma').length
    const kaybedilen = tumDosyalar.filter(d => d.sonuc === 'kaybedildi').length
    const devam = tumDosyalar.length - kazanilan - uzlasma - kaybedilen

    const toplamKapali = kazanilan + uzlasma + kaybedilen
    const basariOrani = toplamKapali > 0 ? Math.round(((kazanilan + uzlasma) / toplamKapali) * 100) : 0

    const bugun = new Date()
    let acilZamanasimi = 0, kritikZamanasimi = 0
    tumDosyalar.filter(d => d.kaza_tarihi).forEach(d => {
      const yil = d.tur === 'AT' ? 10 : 2
      const son = new Date(d.kaza_tarihi!)
      son.setFullYear(son.getFullYear() + yil)
      const kalan = Math.ceil((son.getTime() - bugun.getTime()) / 86400000)
      if (kalan <= 60) acilZamanasimi++
      else if (kalan <= 180) kritikZamanasimi++
    })

    const sirketMap = Object.fromEntries(tumSirket.map(s => [s.id, s.ad]))
    const sirketAgg: Record<number, { ad: string; talep: number; karar: number; tahsilat: number; dosya: number }> = {}
    tumDosyalar.forEach(d => {
      if (!d.karsitaraf_sigorta_id) return
      const sid = d.karsitaraf_sigorta_id
      if (!sirketAgg[sid]) sirketAgg[sid] = { ad: sirketMap[sid] || '', talep: 0, karar: 0, tahsilat: 0, dosya: 0 }
      sirketAgg[sid].talep += d.talep_tutari || 0
      sirketAgg[sid].karar += d.karar_tutari || 0
      sirketAgg[sid].dosya++
    })
    tumFinans.filter(f => f.tur === 'Gelen').forEach(f => {
      const d = tumDosyalar.find(d => d.id === f.dosya_id)
      if (!d?.karsitaraf_sigorta_id) return
      sirketAgg[d.karsitaraf_sigorta_id].tahsilat += f.tutar || 0
    })
    const sirketOzet = Object.values(sirketAgg).sort((a, b) => b.tahsilat - a.tahsilat).slice(0, 8)

    const turOzet = ['STK', 'AT', 'AH'].map(tur => {
      const td = tumDosyalar.filter(d => d.tur === tur)
      const k = td.filter(d => d.sonuc === 'kazanıldı').length
      const u = td.filter(d => d.sonuc === 'uzlaşma').length
      const l = td.filter(d => d.sonuc === 'kaybedildi').length
      const dev = td.length - k - u - l
      const tot = k + u + l
      return { tur, label: TUR_LABEL[tur] || tur, kazanilan: k, uzlasma: u, kaybedilen: l, devam: dev, basari: tot > 0 ? Math.round(((k + u) / tot) * 100) : 0 }
    })

    const byMonth: Record<string, { gelen: number; giden: number; masraf: number; dosya: number }> = {}
    tumFinans.forEach(f => {
      const ay = f.tarih.substring(0, 7)
      if (!byMonth[ay]) byMonth[ay] = { gelen: 0, giden: 0, masraf: 0, dosya: 0 }
      if (f.tur === 'Gelen') byMonth[ay].gelen += f.tutar || 0
      if (f.tur === 'Giden') byMonth[ay].giden += f.tutar || 0
      if (f.tur === 'Masraf') byMonth[ay].masraf += f.tutar || 0
    })
    tumDosyalar.forEach(d => {
      const ay = d.created_at.substring(0, 7)
      if (!byMonth[ay]) byMonth[ay] = { gelen: 0, giden: 0, masraf: 0, dosya: 0 }
      byMonth[ay].dosya++
    })

    return {
      toplamDosya: tumDosyalar.length, aktif, arsiv,
      toplamTalep, toplamKarar, toplamTahsilat, toplamGider, toplamMasraf,
      net: toplamTahsilat - toplamGider - toplamMasraf,
      kazanilan, uzlasma, kaybedilen, devam, basariOrani,
      acilZamanasimi, kritikZamanasimi, sirketOzet, turOzet,
      aylikVeri: Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([ay, d]) => ({ ay, gelen: d.gelen, giden: d.giden, net: d.gelen - d.giden - d.masraf })),
    }
  }),

  genelBakis: protectedProcedure.query(async () => {
    const [tumFinans, tumDosyalar] = await Promise.all([
      db.select().from(finans_kalemi),
      db.select({ id: dosya.id, created_at: dosya.created_at }).from(dosya),
    ])

    const byMonth: Record<string, { gelen: number; giden: number; masraf: number; dosya: number }> = {}

    tumFinans.forEach(f => {
      const ay = f.tarih.substring(0, 7)
      if (!byMonth[ay]) byMonth[ay] = { gelen: 0, giden: 0, masraf: 0, dosya: 0 }
      if (f.tur === 'Gelen') byMonth[ay].gelen += f.tutar || 0
      if (f.tur === 'Giden') byMonth[ay].giden += f.tutar || 0
      if (f.tur === 'Masraf') byMonth[ay].masraf += f.tutar || 0
    })

    tumDosyalar.forEach(d => {
      const ay = d.created_at.substring(0, 7)
      if (!byMonth[ay]) byMonth[ay] = { gelen: 0, giden: 0, masraf: 0, dosya: 0 }
      byMonth[ay].dosya++
    })

    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([ay, d]) => ({ ay, ...d, net: d.gelen - d.giden - d.masraf }))
  }),

  tahsilat: protectedProcedure.query(async () => {
    const [tumDosyalar, tumFinans, tumMuvekkil, tumSirket] = await Promise.all([
      db.select().from(dosya),
      db.select().from(finans_kalemi),
      db.select().from(muvekkil),
      db.select().from(sigortaSirketi),
    ])

    const muvekkilMap = Object.fromEntries(tumMuvekkil.map(m => [m.id, `${m.ad} ${m.soyad}`]))
    const sirketMap = Object.fromEntries(tumSirket.map(s => [s.id, s.ad]))

    return tumDosyalar
      .map(d => {
        const dFinans = tumFinans.filter(f => f.dosya_id === d.id)
        const tahsilat = dFinans.filter(f => f.tur === 'Gelen').reduce((s, f) => s + (f.tutar || 0), 0)
        const talep = d.talep_tutari || 0
        const karar = d.karar_tutari || 0
        return {
          dosya_no: d.dosya_no,
          tur: d.tur,
          muvekkil: muvekkilMap[d.muvekkil_id] || '',
          karsitaraf_sigorta: d.karsitaraf_sigorta_id ? (sirketMap[d.karsitaraf_sigorta_id] || '') : '',
          talep_tutari: talep,
          karar_tutari: karar,
          tahsilat,
          fark: karar - tahsilat,
        }
      })
      .filter(d => d.talep_tutari > 0 || d.karar_tutari > 0 || d.tahsilat > 0)
      .sort((a, b) => b.talep_tutari - a.talep_tutari)
  }),

  sonucBasari: protectedProcedure.query(async () => {
    const tumDosyalar = await db.select().from(dosya)

    const sayim = { kazanildi: 0, uzlasma: 0, kaybedildi: 0, devam: 0 }
    tumDosyalar.forEach(d => {
      if (d.sonuc === 'kazanıldı') sayim.kazanildi++
      else if (d.sonuc === 'uzlaşma') sayim.uzlasma++
      else if (d.sonuc === 'kaybedildi') sayim.kaybedildi++
      else sayim.devam++
    })
    const toplamKapali = sayim.kazanildi + sayim.uzlasma + sayim.kaybedildi
    const basariOrani = toplamKapali > 0
      ? Math.round(((sayim.kazanildi + sayim.uzlasma) / toplamKapali) * 100) : 0

    const pieData = [
      { name: 'Kazanıldı', value: sayim.kazanildi, fill: '#22c55e' },
      { name: 'Uzlaşma', value: sayim.uzlasma, fill: '#3b82f6' },
      { name: 'Kaybedildi', value: sayim.kaybedildi, fill: '#ef4444' },
      { name: 'Devam', value: sayim.devam, fill: '#94a3b8' },
    ]

    return { ...sayim, basariOrani, pieData }
  }),

  arabuluculuk: protectedProcedure.query(async () => {
    const stkDosyalar = await db.select().from(dosya).where(eq(dosya.tur, 'STK'))

    const DAVA_ASAMALARI = new Set(['BAŞVURU', 'ÖN_İNCELEME', 'BİLİRKİŞİ', 'ISLAH', 'KARAR', 'İTİRAZ', 'KESİNLEŞME'])
    let arabuluculukta = 0, davayaGiden = 0, diger = 0

    stkDosyalar.forEach(d => {
      const surec = parseSurecDetay(d.surec_detay)
      const asama = surec.stk?.asama
      if (!asama || asama === 'İHTAR') {
        diger++
      } else if (asama === 'ARABULUCULUK') {
        arabuluculukta++
      } else if (DAVA_ASAMALARI.has(asama)) {
        davayaGiden++
      } else {
        diger++
      }
    })

    const pieData = [
      { name: 'Arabuluculuk', value: arabuluculukta, fill: '#3b82f6' },
      { name: 'Davaya Giden', value: davayaGiden, fill: '#ef4444' },
      { name: 'Diğer / İhtar', value: diger, fill: '#94a3b8' },
    ]

    return { toplamStk: stkDosyalar.length, arabuluculukta, davayaGiden, diger, pieData }
  }),

  zamanasimi: protectedProcedure.query(async () => {
    const [tumDosyalar, tumMuvekkil, tumSirket, tumSigortaTuru] = await Promise.all([
      db.select().from(dosya),
      db.select().from(muvekkil),
      db.select().from(sigortaSirketi),
      db.select().from(sigortaTuru),
    ])
    const muvekkilMap = Object.fromEntries(tumMuvekkil.map(m => [m.id, `${m.ad} ${m.soyad}`]))
    const sirketMap = Object.fromEntries(tumSirket.map(s => [s.id, s.ad]))
    const sigortaTuruMap = Object.fromEntries(tumSigortaTuru.map(t => [t.id, t.ad]))
    const bugun = new Date()

    const tumDosyalarMapped = tumDosyalar
      .filter(d => d.kaza_tarihi)
      .map(d => {
        const turAd = d.sigorta_turu_id ? sigortaTuruMap[d.sigorta_turu_id] : undefined
        const yil = turAd === 'Bedeni Hasar' ? 10 : 2
        const kazaTarihi = new Date(d.kaza_tarihi!)
        const sonTarih = new Date(kazaTarihi)
        sonTarih.setFullYear(sonTarih.getFullYear() + yil)
        const kalanGun = Math.ceil((sonTarih.getTime() - bugun.getTime()) / 86400000)

        let risk: 'kritik' | 'uyari' | 'normal'
        if (kalanGun <= 0) risk = 'kritik'
        else if (kalanGun <= 180) risk = 'uyari'
        else risk = 'normal'

        return {
          dosya_no: d.dosya_no,
          tur: turAd ?? d.tur,
          muvekkil: muvekkilMap[d.muvekkil_id] || '',
          kaza_tarihi: d.kaza_tarihi,
          yil,
          son_tarih: sonTarih.toISOString().split('T')[0],
          kalan_gun: kalanGun,
          risk,
          durum: d.durum,
        }
      })
      .sort((a, b) => a.kalan_gun - b.kalan_gun)

    const aktifDosyalar = tumDosyalarMapped.filter(d => d.durum === 'aktif')
    return {
      tumDosyalar: tumDosyalarMapped,
      kritik: aktifDosyalar.filter(d => d.risk === 'kritik').length,
      uyari: aktifDosyalar.filter(d => d.risk === 'uyari').length,
      normal: aktifDosyalar.filter(d => d.risk === 'normal').length,
    }
  }),

  dosyaRaporu: protectedProcedure.query(async () => {
    const [tumDosyalar, tumFinans, tumMuvekkil, tumSirket] = await Promise.all([
      db.select().from(dosya),
      db.select().from(finans_kalemi),
      db.select().from(muvekkil),
      db.select().from(sigortaSirketi),
    ])

    const muvekkilMap = Object.fromEntries(tumMuvekkil.map(m => [m.id, `${m.ad} ${m.soyad}`]))
    const sirketMap = Object.fromEntries(tumSirket.map(s => [s.id, s.ad]))

    return tumDosyalar
      .map(d => {
        const dFinans = tumFinans.filter(f => f.dosya_id === d.id)
        const gelen = dFinans.filter(f => f.tur === 'Gelen').reduce((s, f) => s + (f.tutar || 0), 0)
        const giden = dFinans.filter(f => f.tur === 'Giden').reduce((s, f) => s + (f.tutar || 0), 0)
        const masraf = dFinans.filter(f => f.tur === 'Masraf').reduce((s, f) => s + (f.tutar || 0), 0)
        return {
          id: d.id,
          dosya_no: d.dosya_no,
          tur: d.tur,
          durum: d.durum,
          muvekkil: muvekkilMap[d.muvekkil_id] || '',
          karsitaraf_sigorta: d.karsitaraf_sigorta_id ? (sirketMap[d.karsitaraf_sigorta_id] || '') : '',
          talep_tutari: d.talep_tutari || 0,
          karar_tutari: d.karar_tutari || 0,
          sonuc: d.sonuc || 'devam',
          tahsilat: gelen,
          gider: giden,
          masraf,
          net: gelen - giden - masraf,
          created_at: d.created_at,
        }
      })
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  }),

  muvekkilRaporu: protectedProcedure.query(async () => {
    const [tumMuvekkil, tumDosyalar, tumFinans] = await Promise.all([
      db.select().from(muvekkil),
      db.select().from(dosya),
      db.select().from(finans_kalemi),
    ])

    return tumMuvekkil
      .map(m => {
        const mDosyalar = tumDosyalar.filter(d => d.muvekkil_id === m.id)
        const mFinans = tumFinans.filter(f => mDosyalar.some(d => d.id === f.dosya_id))
        const tahsilat = mFinans.filter(f => f.tur === 'Gelen').reduce((s, f) => s + (f.tutar || 0), 0)
        const gider = mFinans.filter(f => f.tur === 'Giden').reduce((s, f) => s + (f.tutar || 0), 0)
        const masraf = mFinans.filter(f => f.tur === 'Masraf').reduce((s, f) => s + (f.tutar || 0), 0)
        return {
          id: m.id,
          ad: `${m.ad} ${m.soyad}`,
          telefon: m.telefon,
          dosya_sayisi: mDosyalar.length,
          aktif_dosya: mDosyalar.filter(d => d.durum === 'aktif').length,
          tahsilat,
          gider,
          masraf,
          net: tahsilat - gider - masraf,
        }
      })
      .filter(m => m.dosya_sayisi > 0)
      .sort((a, b) => b.tahsilat - a.tahsilat)
  }),

  davaSureci: protectedProcedure.query(async () => {
    const [tumDosyalar] = await Promise.all([
      db.select().from(dosya),
    ])
    const bugun = new Date()

    return tumDosyalar
      .map(d => {
        const surec = parseSurecDetay(d.surec_detay)
        const asama = d.tur === 'STK' ? surec.stk?.asama : surec.mahkeme?.asama
        const baslangic = new Date(surec.stk?.ihtar_tarihi ?? d.created_at)
        const bitis = bugun
        const gecenGun = Math.max(0, Math.ceil((bitis.getTime() - baslangic.getTime()) / 86400000))
        return {
          id: d.id,
          dosya_no: d.dosya_no,
          tur: d.tur,
          durum: d.durum,
          asama: asama || 'Başlangıç',
          olusturma_tarihi: d.created_at.split('T')[0],
          gecen_gun: gecenGun,
        }
      })
      .sort((a, b) => b.gecen_gun - a.gecen_gun)
  }),

  sirketAnalizi: protectedProcedure.query(async () => {
    const [tumSirket, tumDosyalar, tumFinans] = await Promise.all([
      db.select().from(sigortaSirketi),
      db.select().from(dosya),
      db.select().from(finans_kalemi),
    ])

    return tumSirket
      .map(s => {
        const sDosyalar = tumDosyalar.filter(d => d.karsitaraf_sigorta_id === s.id)
        const sFinans = tumFinans.filter(f => sDosyalar.some(d => d.id === f.dosya_id))
        const tahsilat = sFinans.filter(f => f.tur === 'Gelen').reduce((acc, f) => acc + (f.tutar || 0), 0)
        const talep = sDosyalar.reduce((sum, d) => sum + (d.talep_tutari || 0), 0)
        const karar = sDosyalar.reduce((sum, d) => sum + (d.karar_tutari || 0), 0)
        return {
          id: s.id,
          ad: s.ad,
          dosya_sayisi: sDosyalar.length,
          aktif: sDosyalar.filter(d => d.durum === 'aktif').length,
          toplam_talep: talep,
          toplam_karar: karar,
          tahsilat,
          tahsilat_orani: talep > 0 ? Math.round((tahsilat / talep) * 100) : 0,
        }
      })
      .filter(s => s.dosya_sayisi > 0)
      .sort((a, b) => b.tahsilat_orani - a.tahsilat_orani)
  }),
})
