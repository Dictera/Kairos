import { parseSurecDetay } from '@/lib/schema'
import type { InferSelectModel } from 'drizzle-orm'
import {
  dosya,
  muvekkil,
  taraf,
  durusma,
  sure,
  finans_kalemi,
  dosyaNot,
  sigortaSirketi,
  avukat,
} from '@/lib/schema'

type DosyaRow = InferSelectModel<typeof dosya>
type MuvekkilRow = InferSelectModel<typeof muvekkil>
type TarafRow = InferSelectModel<typeof taraf>
type DurusmaRow = InferSelectModel<typeof durusma>
type SureRow = InferSelectModel<typeof sure>
type FinansKalemiRow = InferSelectModel<typeof finans_kalemi>
type DosyaNotRow = InferSelectModel<typeof dosyaNot>
type SigortaSirketiRow = InferSelectModel<typeof sigortaSirketi>
type AvukatRow = InferSelectModel<typeof avukat>

export interface DosyaWithRelations extends DosyaRow {
  muvekkil: MuvekkilRow | null
  taraflar: Array<
    TarafRow & {
      sigortaSirketi: SigortaSirketiRow | null
      avukat: AvukatRow | null
    }
  >
  durusmalar: Array<DurusmaRow>
  sureler: Array<SureRow>
  finans_kalemleri: Array<FinansKalemiRow>
  notlar: Array<DosyaNotRow>
}

export function buildJinja2Context(
  dosya: DosyaWithRelations
): Record<string, unknown> {
  const surecDetay = parseSurecDetay(dosya.surec_detay)

  const rawContext = {
    muvekkil: dosya.muvekkil
      ? {
          ad: dosya.muvekkil.ad,
          soyad: dosya.muvekkil.soyad,
          telefon: dosya.muvekkil.telefon,
          tc_vergi_no: dosya.muvekkil.tc_vergi_no,
          adres: dosya.muvekkil.adres,
          notlar: dosya.muvekkil.notlar,
          iban: dosya.muvekkil.iban,
        }
      : null,
    dosya: {
      dosya_no: dosya.dosya_no,
      tur: dosya.tur,
      talep_tutari: dosya.talep_tutari,
      muvekkil_plaka: dosya.muvekkil_plaka,
      hasar_dosya_no: dosya.hasar_dosya_no,
      kaza_tarihi: dosya.kaza_tarihi,
      kusur_orani_karsi: dosya.kusur_orani_karsi,
      durum: dosya.durum,
      aciklama: dosya.aciklama,
    },
    taraf: dosya.taraflar[0]
      ? {
          karsitaraf_ad: dosya.taraflar[0].karsitaraf_ad,
          police_no: dosya.taraflar[0].police_no,
          karsitaraf_plaka: dosya.taraflar[0].karsitaraf_plaka,
          surucu_ad: dosya.taraflar[0].surucu_ad,
          surucu_soyad: dosya.taraflar[0].surucu_soyad,
          surucu_plaka: dosya.taraflar[0].surucu_plaka,
          surucu_telefon: dosya.taraflar[0].surucu_telefon,
          surucu_police_no: dosya.taraflar[0].surucu_police_no,
          sigorta_sirketi: dosya.taraflar[0].sigortaSirketi
            ? {
                ad: dosya.taraflar[0].sigortaSirketi.ad,
              }
            : null,
          avukat: dosya.taraflar[0].avukat
            ? {
                ad: dosya.taraflar[0].avukat.ad,
                tbb_sicil_no: dosya.taraflar[0].avukat.tbb_sicil_no,
              }
            : null,
        }
      : null,
    stk: surecDetay.stk ?? null,
    mahkeme: surecDetay.mahkeme ?? null,
    durusmalar: dosya.durusmalar.map((d) => ({
      tarih: d.tarih,
      saat: d.saat,
      mahkeme_kurum: d.mahkeme_kurum,
      tur: d.tur,
      notlar: d.notlar,
    })),
    sureler: dosya.sureler.map((s) => ({
      ad: s.ad,
      son_tarih: s.son_tarih,
      tur: s.tur,
      notlar: s.notlar,
    })),
    finans_kalemleri: dosya.finans_kalemleri.map((f) => ({
      tur: f.tur,
      tutar: f.tutar,
      tarih: f.tarih,
      aciklama: f.aciklama,
    })),
    notlar: dosya.notlar.map((n) => ({
      icerik: n.icerik,
      created_at: n.created_at,
    })),
  }

  return sanitizeForJinja2(rawContext) as Record<string, unknown>
}

function sanitizeForJinja2(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return ''
  }
  if (typeof obj === 'string') {
    return obj
  }
  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForJinja2)
  }
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      result[key] = sanitizeForJinja2(value)
    }
    return result
  }
  return ''
}
