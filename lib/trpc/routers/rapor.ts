import { createTRPCRouter, protectedProcedure } from '@/lib/trpc/init'
import { db } from '@/lib/db'
import { dosya, muvekkil, finans_kalemi, sigortaSirketi, parseSurecDetay } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export const raporRouter = createTRPCRouter({

  // 1. Yönetim Özeti — KPI aggregate
  yonetimOzeti: protectedProcedure.query(async () => {
    const tumDosyalar = await db.select().from(dosya)
    const tumFinans = await db.select().from(finans_kalemi)
    const toplamTahsilat = tumFinans.filter(f => f.tur === 'Gelen').reduce((s, f) => s + (f.tutar || 0), 0)
    const toplamGider = tumFinans.filter(f => f.tur === 'Giden').reduce((s, f) => s + (f.tutar || 0), 0)
    const toplamMasraf = tumFinans.filter(f => f.tur === 'Masraf').reduce((s, f) => s + (f.tutar || 0), 0)
    const aktif = tumDosyalar.filter(d => d.durum === 'aktif').length
    const arsiv = tumDosyalar.filter(d => d.durum === 'arsiv').length
    const kazanilan = tumDosyalar.filter(d => d.sonuc === 'kazanıldı').length
    const uzlasma = tumDosyalar.filter(d => d.sonuc === 'uzlaşma').length
    const kaybedilen = tumDosyalar.filter(d => d.sonuc === 'kaybedildi').length
    return {
      toplamDosya: tumDosyalar.length, aktif, arsiv,
      toplamTahsilat, toplamGider, toplamMasraf, net: toplamTahsilat - toplamGider - toplamMasraf,
      kazanilan, uzlasma, kaybedilen,
    }
  }),

  // 2. Genel Bakış — aylık gelen/giden/masraf
  genelBakis: protectedProcedure.query(async () => {
    const tumFinans = await db.select().from(finans_kalemi)
    const byMonth: Record<string, { gelen: number; giden: number; masraf: number }> = {}
    tumFinans.forEach(f => {
      const ay = f.tarih.substring(0, 7)
      if (!byMonth[ay]) byMonth[ay] = { gelen: 0, giden: 0, masraf: 0 }
      if (f.tur === 'Gelen') byMonth[ay].gelen += f.tutar || 0
      if (f.tur === 'Giden') byMonth[ay].giden += f.tutar || 0
      if (f.tur === 'Masraf') byMonth[ay].masraf += f.tutar || 0
    })
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([ay, d]) => ({ ay, ...d, net: d.gelen - d.giden - d.masraf }))
  }),

  // 3. Tahsilat — dosya bazında talep/karar/tahsilat
  tahsilat: protectedProcedure.query(async () => {
    const tumDosyalar = await db.select({
      id: dosya.id, dosya_no: dosya.dosya_no, tur: dosya.tur,
      talep_tutari: dosya.talep_tutari, karar_tutari: dosya.karar_tutari,
      muvekkil_id: dosya.muvekkil_id, karsitaraf_sigorta_id: dosya.karsitaraf_sigorta_id,
    }).from(dosya)
    const tumFinans = await db.select().from(finans_kalemi)
    const tumMuvekkil = await db.select().from(muvekkil)
    const tumSirket = await db.select().from(sigortaSirketi)

    const muvekkilMap = Object.fromEntries(tumMuvekkil.map(m => [m.id, `${m.ad} ${m.soyad}`]))
    const sirketMap = Object.fromEntries(tumSirket.map(s => [s.id, s.ad]))

    return tumDosyalar.map(d => {
      const tahsilat = tumFinans
        .filter(f => f.dosya_id === d.id && f.tur === 'Gelen')
        .reduce((s, f) => s + (f.tutar || 0), 0)
      const karar = d.karar_tutari || 0
      return {
        dosya_no: d.dosya_no, tur: d.tur,
        muvekkil: muvekkilMap[d.muvekkil_id] || '',
        karsitaraf_sigorta: d.karsitaraf_sigorta_id ? (sirketMap[d.karsitaraf_sigorta_id] || '') : '',
        talep_tutari: d.talep_tutari || 0,
        karar_tutari: karar,
        tahsilat,
        fark: karar - tahsilat,
      }
    })
  }),

  // 4. Sonuç & Başarı — sonuc alanına göre dağılım
  sonucBasari: protectedProcedure.query(async () => {
    const tumDosyalar = await db.select({ sonuc: dosya.sonuc, durum: dosya.durum }).from(dosya)
    const sayim = { kazanildi: 0, uzlasma: 0, kaybedildi: 0, devam: 0 }
    tumDosyalar.forEach(d => {
      if (d.sonuc === 'kazanıldı') sayim.kazanildi++
      else if (d.sonuc === 'uzlaşma') sayim.uzlasma++
      else if (d.sonuc === 'kaybedildi') sayim.kaybedildi++
      else sayim.devam++
    })
    const toplamKapali = sayim.kazanildi + sayim.uzlasma + sayim.kaybedildi
    const basariOrani = toplamKapali > 0
      ? Math.round(((sayim.kazanildi + sayim.uzlasma) / toplamKapali) * 100)
      : 0
    const pieData = [
      { name: 'Kazanıldı', value: sayim.kazanildi, fill: '#22c55e' },
      { name: 'Uzlaşma', value: sayim.uzlasma, fill: '#3b82f6' },
      { name: 'Kaybedildi', value: sayim.kaybedildi, fill: '#ef4444' },
      { name: 'Devam', value: sayim.devam, fill: '#94a3b8' },
    ]
    return { ...sayim, basariOrani, pieData }
  }),

  // 5. Arabuluculuk — STK dosyalarında arabuluculuk vs dava aşaması
  arabuluculuk: protectedProcedure.query(async () => {
    const stkDosyalar = await db.select().from(dosya).where(eq(dosya.tur, 'STK'))
    let arabuluculukta = 0, davayaGiden = 0, diger = 0
    const DAVA_SONRASI = ['BAŞVURU', 'ÖN_İNCELEME', 'BİLİRKİŞİ', 'ISLAH', 'KARAR', 'İTİRAZ', 'KESİNLEŞME']
    stkDosyalar.forEach(d => {
      const surec = parseSurecDetay(d.surec_detay)
      const asama = surec.stk?.asama
      if (!asama || asama === 'İHTAR') diger++
      else if (asama === 'ARABULUCULUK') arabuluculukta++
      else if (DAVA_SONRASI.includes(asama)) davayaGiden++
      else diger++
    })
    return {
      toplamStk: stkDosyalar.length, arabuluculukta, davayaGiden, diger,
      pieData: [
        { name: 'Arabuluculukta', value: arabuluculukta, fill: '#3b82f6' },
        { name: 'Davaya Giden', value: davayaGiden, fill: '#ef4444' },
        { name: 'Diğer/İhtar', value: diger, fill: '#94a3b8' },
      ],
    }
  }),

  // 6. Zamanaşımı Riski — Türk hukuku zamanaşımı hesabı
  zamanasimi: protectedProcedure.query(async () => {
    const tumDosyalar = await db.select({
      id: dosya.id, dosya_no: dosya.dosya_no, tur: dosya.tur,
      kaza_tarihi: dosya.kaza_tarihi, muvekkil_id: dosya.muvekkil_id,
      surec_detay: dosya.surec_detay, durum: dosya.durum,
    }).from(dosya)
    const tumMuvekkil = await db.select().from(muvekkil)
    const muvekkilMap = Object.fromEntries(tumMuvekkil.map(m => [m.id, `${m.ad} ${m.soyad}`]))
    const bugun = new Date()

    const sonuclar = tumDosyalar
      .filter(d => d.kaza_tarihi)
      .map(d => {
        // AT (Araç Trafik): 10 yıl (trafik yaralanma); AH (Araç Hasar): 2 yıl; STK: 2 yıl
        let yil = 2
        if (d.tur === 'AT') yil = 10

        const kazaTarihi = new Date(d.kaza_tarihi!)
        const sonTarih = new Date(kazaTarihi)
        sonTarih.setFullYear(sonTarih.getFullYear() + yil)
        const kalanGun = Math.ceil((sonTarih.getTime() - bugun.getTime()) / (1000 * 60 * 60 * 24))

        let risk: 'kritik' | 'uyari' | 'normal' = 'normal'
        if (kalanGun < 0) risk = 'kritik'
        else if (kalanGun < 180) risk = 'uyari'

        return {
          dosya_no: d.dosya_no, tur: d.tur,
          muvekkil: muvekkilMap[d.muvekkil_id] || '',
          kaza_tarihi: d.kaza_tarihi, yil, son_tarih: sonTarih.toISOString().split('T')[0],
          kalan_gun: kalanGun, risk, durum: d.durum,
        }
      })
      .sort((a, b) => a.kalan_gun - b.kalan_gun)

    return {
      tumDosyalar: sonuclar,
      kritik: sonuclar.filter(d => d.risk === 'kritik').length,
      uyari: sonuclar.filter(d => d.risk === 'uyari').length,
      normal: sonuclar.filter(d => d.risk === 'normal').length,
    }
  }),

  // 7. Dosya Raporu — dosya listesi + finans aggregation
  dosyaRaporu: protectedProcedure.query(async () => {
    const tumDosyalar = await db.select().from(dosya)
    const tumFinans = await db.select().from(finans_kalemi)
    const tumMuvekkil = await db.select().from(muvekkil)
    const tumSirket = await db.select().from(sigortaSirketi)
    const muvekkilMap = Object.fromEntries(tumMuvekkil.map(m => [m.id, `${m.ad} ${m.soyad}`]))
    const sirketMap = Object.fromEntries(tumSirket.map(s => [s.id, s.ad]))

    return tumDosyalar.map(d => {
      const dosyaFinans = tumFinans.filter(f => f.dosya_id === d.id)
      const tahsilat = dosyaFinans.filter(f => f.tur === 'Gelen').reduce((s, f) => s + (f.tutar || 0), 0)
      const gider = dosyaFinans.filter(f => f.tur === 'Giden').reduce((s, f) => s + (f.tutar || 0), 0)
      const masraf = dosyaFinans.filter(f => f.tur === 'Masraf').reduce((s, f) => s + (f.tutar || 0), 0)
      return {
        id: d.id, dosya_no: d.dosya_no, tur: d.tur, durum: d.durum,
        muvekkil: muvekkilMap[d.muvekkil_id] || '',
        karsitaraf_sigorta: d.karsitaraf_sigorta_id ? (sirketMap[d.karsitaraf_sigorta_id] || '') : '',
        talep_tutari: d.talep_tutari || 0,
        karar_tutari: d.karar_tutari || 0,
        sonuc: d.sonuc || 'devam',
        tahsilat, gider, masraf, net: tahsilat - gider - masraf,
        created_at: d.created_at,
      }
    })
  }),

  // 8. Müvekkil Raporu — müvekkil bazında özet
  muvekkilRaporu: protectedProcedure.query(async () => {
    const tumMuvekkil = await db.select().from(muvekkil)
    const tumDosyalar = await db.select().from(dosya)
    const tumFinans = await db.select().from(finans_kalemi)

    return tumMuvekkil.map(m => {
      const mDosyalar = tumDosyalar.filter(d => d.muvekkil_id === m.id)
      const mFinans = tumFinans.filter(f => mDosyalar.some(d => d.id === f.dosya_id))
      const tahsilat = mFinans.filter(f => f.tur === 'Gelen').reduce((s, f) => s + (f.tutar || 0), 0)
      const gider = mFinans.filter(f => f.tur === 'Giden').reduce((s, f) => s + (f.tutar || 0), 0)
      const masraf = mFinans.filter(f => f.tur === 'Masraf').reduce((s, f) => s + (f.tutar || 0), 0)
      return {
        id: m.id, ad: `${m.ad} ${m.soyad}`, telefon: m.telefon,
        dosya_sayisi: mDosyalar.length,
        aktif_dosya: mDosyalar.filter(d => d.durum === 'aktif').length,
        tahsilat, gider, masraf, net: tahsilat - gider - masraf,
      }
    }).filter(m => m.dosya_sayisi > 0)
      .sort((a, b) => b.tahsilat - a.tahsilat)
  }),

  // 9. Dava Süreci — dosya oluşturma tarihi vs mevcut aşama, süreç gün hesabı
  davaSureci: protectedProcedure.query(async () => {
    const tumDosyalar = await db.select().from(dosya)
    const bugun = new Date()

    return tumDosyalar.map(d => {
      const surec = parseSurecDetay(d.surec_detay)
      const asama = d.tur === 'STK' ? surec.stk?.asama : surec.mahkeme?.asama
      const olusturma = new Date(d.created_at)
      const gecenGun = Math.ceil((bugun.getTime() - olusturma.getTime()) / (1000 * 60 * 60 * 24))
      return {
        id: d.id, dosya_no: d.dosya_no, tur: d.tur, durum: d.durum,
        asama: asama || 'Başlangıç',
        olusturma_tarihi: d.created_at.split('T')[0],
        gecen_gun: gecenGun,
      }
    }).sort((a, b) => b.gecen_gun - a.gecen_gun)
  }),

  // 10. Şirket Analizi — karşı taraf sigorta şirketi bazında analiz
  sirketAnalizi: protectedProcedure.query(async () => {
    const tumSirket = await db.select().from(sigortaSirketi)
    const tumDosyalar = await db.select().from(dosya)
    const tumFinans = await db.select().from(finans_kalemi)

    return tumSirket.map(s => {
      const sDosyalar = tumDosyalar.filter(d => d.karsitaraf_sigorta_id === s.id)
      const sFinans = tumFinans.filter(f => sDosyalar.some(d => d.id === f.dosya_id))
      const tahsilat = sFinans.filter(f => f.tur === 'Gelen').reduce((acc, f) => acc + (f.tutar || 0), 0)
      const toplamTalep = sDosyalar.reduce((sum, d) => sum + (d.talep_tutari || 0), 0)
      const toplamKarar = sDosyalar.reduce((sum, d) => sum + (d.karar_tutari || 0), 0)
      return {
        id: s.id, ad: s.ad,
        dosya_sayisi: sDosyalar.length,
        aktif: sDosyalar.filter(d => d.durum === 'aktif').length,
        toplam_talep: toplamTalep,
        toplam_karar: toplamKarar,
        tahsilat,
        tahsilat_orani: toplamKarar > 0 ? Math.round((tahsilat / toplamKarar) * 100) : 0,
      }
    }).filter(s => s.dosya_sayisi > 0)
      .sort((a, b) => b.tahsilat - a.tahsilat)
  }),
})
