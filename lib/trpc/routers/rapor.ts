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
    const [tumSirket, tumDosyalar, tumFinans] = await Promise.all([
      db.select().from(sigortaSirketi),
      db.select().from(dosya),
      db.select().from(finans_kalemi),
    ])

    const sirketler = tumSirket.map(s => {
      const sDosyalar = tumDosyalar.filter(d => d.karsitaraf_sigorta_id === s.id)
      const sGelen = tumFinans.filter(f => f.tur === 'Gelen' && sDosyalar.some(d => d.id === f.dosya_id))
      const tahsilat = sGelen.reduce((acc, f) => acc + (f.tutar || 0), 0)
      const talep = sDosyalar.reduce((sum, d) => sum + (d.talep_tutari || 0), 0)
      const karar = sDosyalar.reduce((sum, d) => sum + (d.karar_tutari || 0), 0)
      const kararOrani = talep > 0 ? (karar / talep) * 100 : 0
      const tahsilatOrani = karar > 0 ? (tahsilat / karar) * 100 : 0
      const asama_dagilim: Record<string, number> = {}
      sGelen.forEach(f => {
        const k = f.odeme_asamasi || 'Belirtilmemiş'
        asama_dagilim[k] = (asama_dagilim[k] || 0) + (f.tutar || 0)
      })
      return {
        ad: s.ad,
        dosya_sayisi: sDosyalar.length,
        talep, karar, tahsilat,
        karar_orani: kararOrani,
        tahsilat_orani: tahsilatOrani,
        toplam_kayip: talep - tahsilat,
        asama_dagilim,
      }
    }).filter(s => s.dosya_sayisi > 0).sort((a, b) => b.tahsilat - a.tahsilat)

    const toplamTalep = sirketler.reduce((s, x) => s + x.talep, 0)
    const toplamKarar = sirketler.reduce((s, x) => s + x.karar, 0)
    const toplamTahsilat = sirketler.reduce((s, x) => s + x.tahsilat, 0)

    const globalAsama: Record<string, number> = {}
    tumFinans.filter(f => f.tur === 'Gelen').forEach(f => {
      const k = f.odeme_asamasi || 'Belirtilmemiş'
      globalAsama[k] = (globalAsama[k] || 0) + (f.tutar || 0)
    })
    const odemeAsamalari = ['İhtar', 'Arabulucu', 'Bilirkişi', 'İcra', 'Belirtilmemiş']
      .map(asama => ({ asama, tutar: globalAsama[asama] || 0 }))
      .filter(a => a.tutar > 0)

    return { sirketler, toplamTalep, toplamKarar, toplamTahsilat, odemeAsamalari }
  }),

  sonucBasari: protectedProcedure.query(async () => {
    const [tumDosyalar, tumSirket] = await Promise.all([
      db.select().from(dosya),
      db.select().from(sigortaSirketi),
    ])

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

    const turOzet = ['STK', 'AT', 'AH'].map(tur => {
      const td = tumDosyalar.filter(d => d.tur === tur)
      const k = td.filter(d => d.sonuc === 'kazanıldı').length
      const u = td.filter(d => d.sonuc === 'uzlaşma').length
      const l = td.filter(d => d.sonuc === 'kaybedildi').length
      const dev = td.length - k - u - l
      const tot = k + u + l
      return { tur, label: TUR_LABEL[tur] || tur, kazanilan: k, uzlasma: u, kaybedilen: l, devam: dev, basari: tot > 0 ? Math.round(((k + u) / tot) * 100) : 0 }
    })

    const sirketOzet = tumSirket.map(s => {
      const sd = tumDosyalar.filter(d => d.karsitaraf_sigorta_id === s.id)
      return {
        ad: s.ad,
        kazanilan: sd.filter(d => d.sonuc === 'kazanıldı').length,
        uzlasma: sd.filter(d => d.sonuc === 'uzlaşma').length,
        kaybedilen: sd.filter(d => d.sonuc === 'kaybedildi').length,
      }
    }).filter(s => (s.kazanilan + s.uzlasma + s.kaybedilen) > 0)

    const aylikVeri: Record<string, { kazanildi: number; uzlasma: number; kaybedildi: number }> = {}
    tumDosyalar.forEach(d => {
      const ay = d.created_at.substring(0, 7)
      if (!aylikVeri[ay]) aylikVeri[ay] = { kazanildi: 0, uzlasma: 0, kaybedildi: 0 }
      if (d.sonuc === 'kazanıldı') aylikVeri[ay].kazanildi++
      else if (d.sonuc === 'uzlaşma') aylikVeri[ay].uzlasma++
      else if (d.sonuc === 'kaybedildi') aylikVeri[ay].kaybedildi++
    })

    const aylik = Object.entries(aylikVeri)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([ay, d]) => ({ ay, kazanildi: d.kazanildi, uzlasma: d.uzlasma, kaybedildi: d.kaybedildi }))

    return { ...sayim, basariOrani, turOzet, sirketOzet, aylikVeri: aylik }
  }),

  arabuluculuk: protectedProcedure.query(async () => {
    const stkDosyalar = await db.select().from(dosya).where(eq(dosya.tur, 'STK'))

    const DAVA_ASAMALARI = new Set(['BAŞVURU', 'ÖN_İNCELEME', 'BİLİRKİŞİ', 'ISLAH', 'KARAR', 'İTİRAZ', 'KESİNLEŞME'])
    let arabuluculukta = 0, arabuluculukCozulen = 0
    let davayaGiden = 0, davaCozulen = 0
    let diger = 0
    const araSureler: number[] = []
    const davaSureler: number[] = []

    stkDosyalar.forEach(d => {
      const surec = parseSurecDetay(d.surec_detay)
      const asama = surec.stk?.asama
      const arsiv = d.durum === 'arsiv'

      if (!asama || asama === 'İHTAR') {
        diger++
      } else if (asama === 'ARABULUCULUK') {
        arabuluculukta++
        if (arsiv) arabuluculukCozulen++
      } else if (DAVA_ASAMALARI.has(asama)) {
        davayaGiden++
        if (arsiv) davaCozulen++
      } else {
        diger++
      }

      if (arsiv && d.arsiv_tarihi && surec.stk?.ihtar_tarihi) {
        const gun = Math.max(0, Math.round(
          (new Date(d.arsiv_tarihi).getTime() - new Date(surec.stk.ihtar_tarihi).getTime()) / 86400000
        ))
        if (asama === 'İHTAR' || asama === 'ARABULUCULUK') araSureler.push(gun)
        else if (asama && DAVA_ASAMALARI.has(asama)) davaSureler.push(gun)
      }
    })

    const byMonth: Record<string, { arabuluculuk: number; dava: number; arabuluculukCoz: number; davaCoz: number }> = {}
    stkDosyalar.forEach(d => {
      const ay = d.created_at.substring(0, 7)
      if (!byMonth[ay]) byMonth[ay] = { arabuluculuk: 0, dava: 0, arabuluculukCoz: 0, davaCoz: 0 }
      const surec = parseSurecDetay(d.surec_detay)
      const asama = surec.stk?.asama
      if (asama === 'ARABULUCULUK') {
        byMonth[ay].arabuluculuk++
        if (d.durum === 'arsiv') byMonth[ay].arabuluculukCoz++
      } else if (asama && DAVA_ASAMALARI.has(asama)) {
        byMonth[ay].dava++
        if (d.durum === 'arsiv') byMonth[ay].davaCoz++
      }
    })

    const toplamStk = stkDosyalar.length
    const araBasari = arabuluculukta > 0 ? Math.round((arabuluculukCozulen / arabuluculukta) * 100) : 0
    const davaBasari = davayaGiden > 0 ? Math.round((davaCozulen / davayaGiden) * 100) : 0
    const ortAraSure = araSureler.length > 0
      ? Math.round(araSureler.reduce((s, g) => s + g, 0) / araSureler.length) : 0
    const ortDavaSure = davaSureler.length > 0
      ? Math.round(davaSureler.reduce((s, g) => s + g, 0) / davaSureler.length) : 0

    return {
      toplamStk, arabuluculukta, arabuluculukCozulen, davayaGiden, davaCozulen, diger,
      araBasari, davaBasari, ortAraSure, ortDavaSure,
      aylik: Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b)).map(([ay, d]) => ({ ay, ...d })),
    }
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

    const sonuclar = tumDosyalar
      .filter(d => d.kaza_tarihi)
      .map(d => {
        const turAd = d.sigorta_turu_id ? sigortaTuruMap[d.sigorta_turu_id] : undefined
        const yil = turAd === 'Bedeni Hasar' ? 10 : 2
        const kazaTarihi = new Date(d.kaza_tarihi!)
        const sonTarih = new Date(kazaTarihi)
        sonTarih.setFullYear(sonTarih.getFullYear() + yil)
        const kalanGun = Math.ceil((sonTarih.getTime() - bugun.getTime()) / 86400000)

        let risk: 'Acil' | 'Kritik' | 'Dikkat' | 'Güvenli' = 'Güvenli'
        if (kalanGun <= 60) risk = 'Acil'
        else if (kalanGun <= 180) risk = 'Kritik'
        else if (kalanGun <= 365) risk = 'Dikkat'

        return {
          dosya_no: d.dosya_no, tur: turAd ?? d.tur,
          muvekkil: muvekkilMap[d.muvekkil_id] || '',
          karsitaraf_sigorta: d.karsitaraf_sigorta_id ? (sirketMap[d.karsitaraf_sigorta_id] || '') : '',
          kaza_tarihi: d.kaza_tarihi!, yil,
          son_tarih: sonTarih.toISOString().split('T')[0],
          kalan_gun: kalanGun, risk, durum: d.durum,
        }
      })
      .sort((a, b) => a.kalan_gun - b.kalan_gun)

    const aktifSonuclar = sonuclar.filter(d => d.durum === 'aktif')
    return {
      tumDosyalar: sonuclar,
      acil: aktifSonuclar.filter(d => d.risk === 'Acil').length,
      kritik: aktifSonuclar.filter(d => d.risk === 'Kritik').length,
      dikkat: aktifSonuclar.filter(d => d.risk === 'Dikkat').length,
      guvenli: aktifSonuclar.filter(d => d.risk === 'Güvenli').length,
    }
  }),

  dosyaRaporu: protectedProcedure.query(async () => {
    const [tumDosyalar, tumFinans, tumSigortaTuru] = await Promise.all([
      db.select().from(dosya),
      db.select().from(finans_kalemi),
      db.select().from(sigortaTuru),
    ])

    const durumlar = [
      { durum: 'Aktif', adet: tumDosyalar.filter(d => d.durum === 'aktif').length, renk: '#22c55e' },
      { durum: 'Kapalı', adet: tumDosyalar.filter(d => d.durum === 'arsiv').length, renk: '#94a3b8' },
    ]

    const turler = ['STK', 'AT', 'AH'].map(tur => {
      const td = tumDosyalar.filter(d => d.tur === tur)
      const tFinans = tumFinans.filter(f => td.some(d => d.id === f.dosya_id))
      const gelen = tFinans.filter(f => f.tur === 'Gelen').reduce((s, f) => s + (f.tutar || 0), 0)
      const giden = tFinans.filter(f => f.tur === 'Giden').reduce((s, f) => s + (f.tutar || 0), 0)
      const masraf = tFinans.filter(f => f.tur === 'Masraf').reduce((s, f) => s + (f.tutar || 0), 0)
      const renkler: Record<string, string> = { STK: '#1c768f', AT: '#22c55e', AH: '#f97316' }
      return { tur, label: TUR_LABEL[tur] || tur, adet: td.length, gelen, giden, masraf, renk: renkler[tur] || '#746cac' }
    })

    const ALT_TUR_RENKLER: Record<string, string> = {
      'Bedeni Hasar': '#ef4444',
      'Hasar':        '#f97316',
      'Değer Kaybı':  '#1c768f',
      'İkame Araç':   '#8b5cf6',
    }
    const altTurler = tumSigortaTuru.map(t => {
      const td = tumDosyalar.filter(d => d.sigorta_turu_id === t.id)
      const tFinans = tumFinans.filter(f => td.some(d => d.id === f.dosya_id))
      const tahsilat = tFinans.filter(f => f.tur === 'Gelen').reduce((s, f) => s + (f.tutar || 0), 0)
      return {
        ad: t.ad,
        adet: td.length,
        tahsilat,
        renk: ALT_TUR_RENKLER[t.ad] || '#746cac',
      }
    }).filter(t => t.adet > 0)

    return { durumlar, turler, altTurler, toplamDosya: tumDosyalar.length }
  }),

  muvekkilRaporu: protectedProcedure.query(async () => {
    const [tumMuvekkil, tumDosyalar, tumFinans] = await Promise.all([
      db.select().from(muvekkil),
      db.select().from(dosya),
      db.select().from(finans_kalemi),
    ])

    const muvekkiller = tumMuvekkil.map(m => {
      const mDosyalar = tumDosyalar.filter(d => d.muvekkil_id === m.id)
      const mFinans = tumFinans.filter(f => mDosyalar.some(d => d.id === f.dosya_id))
      const tahsilat = mFinans.filter(f => f.tur === 'Gelen').reduce((s, f) => s + (f.tutar || 0), 0)
      const gider = mFinans.filter(f => f.tur === 'Giden').reduce((s, f) => s + (f.tutar || 0), 0)
      const masraf = mFinans.filter(f => f.tur === 'Masraf').reduce((s, f) => s + (f.tutar || 0), 0)
      const toplamTalep = mDosyalar.reduce((s, d) => s + (d.talep_tutari || 0), 0)
      const tahsilatOrani = toplamTalep > 0 ? Math.round((tahsilat / toplamTalep) * 100) : 0
      const sonAktivite = mDosyalar.length > 0
        ? mDosyalar.reduce((latest, d) => d.created_at > latest ? d.created_at : latest, mDosyalar[0].created_at).split('T')[0]
        : null

      return {
        id: m.id, ad: `${m.ad} ${m.soyad}`,
        dosya_sayisi: mDosyalar.length,
        aktif_dosya: mDosyalar.filter(d => d.durum === 'aktif').length,
        tahsilat, gider, masraf, net: tahsilat - gider - masraf,
        oran: tahsilatOrani,
        son_aktivite: sonAktivite,
        durum: mDosyalar.some(d => d.durum === 'aktif') ? 'Aktif' : 'Pasif',
      }
    }).filter(m => m.dosya_sayisi > 0)
      .sort((a, b) => b.tahsilat - a.tahsilat)

    return {
      toplamMuvekkil: muvekkiller.length,
      aktif: muvekkiller.filter(m => m.durum === 'Aktif').length,
      toplamTahsilat: muvekkiller.reduce((s, m) => s + m.tahsilat, 0),
      toplamDosya: muvekkiller.reduce((s, m) => s + m.dosya_sayisi, 0),
      ortTahsilatOrani: muvekkiller.length > 0 ? Math.round(muvekkiller.reduce((s, m) => s + m.oran, 0) / muvekkiller.length) : 0,
      dosyalar: muvekkiller,
    }
  }),

  davaSureci: protectedProcedure.query(async () => {
    const [tumDosyalar, tumSirket, tumFinans, tumMuvekkil] = await Promise.all([
      db.select().from(dosya),
      db.select().from(sigortaSirketi),
      db.select().from(finans_kalemi),
      db.select().from(muvekkil),
    ])
    const sirketMap = Object.fromEntries(tumSirket.map(s => [s.id, s.ad]))
    const muvekkilMap = Object.fromEntries(tumMuvekkil.map(m => [m.id, `${m.ad} ${m.soyad}`]))
    const bugun = new Date()

    const dosyalarWithGun = tumDosyalar.map(d => {
      const surec = parseSurecDetay(d.surec_detay)
      const asama = d.tur === 'STK' ? surec.stk?.asama : surec.mahkeme?.asama
      const baslangic = new Date(surec.stk?.ihtar_tarihi ?? d.created_at)
      const bitis = d.durum === 'arsiv' && d.arsiv_tarihi ? new Date(d.arsiv_tarihi) : bugun
      const gecenGun = Math.max(0, Math.ceil((bitis.getTime() - baslangic.getTime()) / 86400000))
      const dFinans = tumFinans.filter(f => f.dosya_id === d.id)
      const gelen = dFinans.filter(f => f.tur === 'Gelen').reduce((s, f) => s + (f.tutar || 0), 0)
      const giden = dFinans.filter(f => f.tur === 'Giden').reduce((s, f) => s + (f.tutar || 0), 0)
      const masraf = dFinans.filter(f => f.tur === 'Masraf').reduce((s, f) => s + (f.tutar || 0), 0)
      return {
        id: d.id, dosya_no: d.dosya_no, tur: d.tur, durum: d.durum,
        muvekkil_id: d.muvekkil_id,
        karsitaraf_sigorta: d.karsitaraf_sigorta_id ? (sirketMap[d.karsitaraf_sigorta_id] || '') : '',
        asama: asama || 'Başlangıç',
        olusturma_tarihi: d.created_at.split('T')[0],
        gecen_gun: gecenGun, net: gelen - giden - masraf,
      }
    }).sort((a, b) => b.gecen_gun - a.gecen_gun)

    const asamaMap: Record<string, number[]> = {}
    dosyalarWithGun.forEach(d => {
      if (!asamaMap[d.asama]) asamaMap[d.asama] = []
      asamaMap[d.asama].push(d.gecen_gun)
    })
    const asamaVeri = Object.entries(asamaMap)
      .map(([asama, gunler]) => ({
        asama,
        ortalama: Math.round(gunler.reduce((s, g) => s + g, 0) / gunler.length),
        minimum: Math.min(...gunler),
        maksimum: Math.max(...gunler),
        adet: gunler.length,
        renk: '#1c768f',
      }))
      .sort((a, b) => b.ortalama - a.ortalama)

    const sirketGunMap: Record<string, number[]> = {}
    dosyalarWithGun.forEach(d => {
      if (!d.karsitaraf_sigorta) return
      if (!sirketGunMap[d.karsitaraf_sigorta]) sirketGunMap[d.karsitaraf_sigorta] = []
      sirketGunMap[d.karsitaraf_sigorta].push(d.gecen_gun)
    })
    const sirketVeri = Object.entries(sirketGunMap)
      .map(([ad, gunler]) => ({
        ad,
        ortSure: Math.round(gunler.reduce((s, g) => s + g, 0) / gunler.length),
        hedef: 180,
      }))
      .sort((a, b) => b.ortSure - a.ortSure)

    const uzunDosyalar = dosyalarWithGun.filter(d => d.durum === 'aktif').slice(0, 6).map(d => ({
      dosya_no: d.dosya_no,
      muvekkil: muvekkilMap[d.muvekkil_id] || `Müvekkil ${d.muvekkil_id}`,
      sirket: d.karsitaraf_sigorta || '-',
      asama: d.asama,
      gun: d.gecen_gun,
      tutar: d.net,
    }))

    const toplamAktif = dosyalarWithGun.filter(d => d.durum === 'aktif').length
    const ortToplamSure = dosyalarWithGun.length > 0
      ? Math.round(dosyalarWithGun.reduce((s, d) => s + d.gecen_gun, 0) / dosyalarWithGun.length)
      : 0
    const enUzun = asamaVeri[0] || null

    return {
      ortToplamSure: ortToplamSure,
      enUzunAsama: enUzun?.asama || 'Yok',
      enUzunSure: enUzun?.ortalama || 0,
      aktifDosya: toplamAktif,
      kapananDosya: dosyalarWithGun.filter(d => d.durum === 'arsiv').length,
      asamaVeri,
      sirketVeri,
      uzunDosyalar,
    }
  }),

  sirketAnalizi: protectedProcedure.query(async () => {
    const [tumSirket, tumDosyalar, tumFinans] = await Promise.all([
      db.select().from(sigortaSirketi),
      db.select().from(dosya),
      db.select().from(finans_kalemi),
    ])

    const sirketler = tumSirket.map(s => {
      const sDosyalar = tumDosyalar.filter(d => d.karsitaraf_sigorta_id === s.id)
      const sFinans = tumFinans.filter(f => sDosyalar.some(d => d.id === f.dosya_id))
      const tahsilat = sFinans.filter(f => f.tur === 'Gelen').reduce((acc, f) => acc + (f.tutar || 0), 0)
      const talep = sDosyalar.reduce((sum, d) => sum + (d.talep_tutari || 0), 0)
      const karar = sDosyalar.reduce((sum, d) => sum + (d.karar_tutari || 0), 0)
      return {
        id: s.id, ad: s.ad,
        dosya_sayisi: sDosyalar.length,
        toplam_talep: talep, toplam_karar: karar, tahsilat,
        tahsilat_orani: talep > 0 ? (tahsilat / talep) * 100 : 0,
        karar_orani: karar > 0 ? (tahsilat / karar) * 100 : 0,
      }
    }).filter(s => s.dosya_sayisi > 0)
      .sort((a, b) => b.karar_orani - a.karar_orani)

    const toplamTalep = sirketler.reduce((s, x) => s + x.toplam_talep, 0)
    const toplamTahsilat = sirketler.reduce((s, x) => s + x.tahsilat, 0)

    const sirketMonthlyGelen: Record<number, Record<string, number>> = {}
    tumFinans.filter(f => f.tur === 'Gelen').forEach(f => {
      const d = tumDosyalar.find(d => d.id === f.dosya_id)
      if (!d?.karsitaraf_sigorta_id) return
      const sid = d.karsitaraf_sigorta_id
      const ay = f.tarih.substring(0, 7)
      if (!sirketMonthlyGelen[sid]) sirketMonthlyGelen[sid] = {}
      sirketMonthlyGelen[sid][ay] = (sirketMonthlyGelen[sid][ay] || 0) + (f.tutar || 0)
    })

    const allAylar = [...new Set(tumFinans.map(f => f.tarih.substring(0, 7)))].sort()
    const son6Ay = allAylar.slice(-6)
    const top4 = sirketler.slice(0, 4)

    const trendVeri = son6Ay.map(ay => {
      const row: { ay: string; [key: string]: string | number } = { ay }
      top4.forEach(s => {
        const cumGelen = allAylar
          .filter(a => a <= ay)
          .reduce((sum, a) => sum + (sirketMonthlyGelen[s.id]?.[a] || 0), 0)
        row[s.ad] = s.toplam_karar > 0
          ? Math.min(100, Math.round((cumGelen / s.toplam_karar) * 100))
          : 0
      })
      return row
    })

    return {
      sirketSayisi: sirketler.length,
      toplamTalep,
      toplamTahsilat,
      tahsilatOrani: toplamTalep > 0 ? Math.round((toplamTahsilat / toplamTalep) * 100) : 0,
      trendVeri,
      sirketler,
    }
  }),
})