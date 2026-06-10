export interface VariableInfo {
  path: string
  tab: string
  label: string
}

export const VARIABLE_REGISTRY: VariableInfo[] = [
  // sistem — genel
  { path: 'bugun', tab: 'genel', label: 'Bugünün tarihi / düzenlenme tarihi (gg/aa/yyyy)' },

  // muvekkil — genel
  { path: 'muvekkil.ad', tab: 'genel', label: 'Müvekkil adı' },
  { path: 'muvekkil.soyad', tab: 'genel', label: 'Müvekkil soyadı' },
  { path: 'muvekkil.ad_soyad', tab: 'genel', label: 'Müvekkil adı soyadı' },
  { path: 'muvekkil.telefon', tab: 'genel', label: 'Müvekkil telefonu' },
  { path: 'muvekkil.tc_vergi_no', tab: 'genel', label: 'Müvekkil TC/Vergi No' },
  { path: 'muvekkil.adres', tab: 'genel', label: 'Müvekkil adresi' },
  { path: 'muvekkil.notlar', tab: 'genel', label: 'Müvekkil notları' },
  { path: 'muvekkil.iban', tab: 'genel', label: 'Müvekkil IBAN' },

  // dosya — genel
  { path: 'dosya.dosya_no', tab: 'genel', label: 'Dosya numarası' },
  { path: 'dosya.tur', tab: 'genel', label: 'Dosya türü' },
  { path: 'dosya.talep_tutari', tab: 'genel', label: 'Talep tutarı' },
  { path: 'dosya.muvekkil_plaka', tab: 'genel', label: 'Müvekkil plaka' },
  { path: 'dosya.hasar_dosya_no', tab: 'genel', label: 'Hasar dosya numarası' },
  { path: 'dosya.kaza_tarihi', tab: 'genel', label: 'Kaza tarihi' },
  { path: 'dosya.kusur_orani_karsi', tab: 'genel', label: 'Karşı taraf kusur oranı' },
  { path: 'dosya.durum', tab: 'genel', label: 'Dosya durumu' },
  { path: 'dosya.aciklama', tab: 'genel', label: 'Dosya açıklaması' },
  { path: 'dosya.karsitaraf_sigorta', tab: 'genel', label: 'Karşı taraf sigorta şirketi' },
  { path: 'dosya.muvekkil_sigorta', tab: 'genel', label: 'Müvekkil sigorta şirketi' },

  // taraf — taraflar
  { path: 'taraf.karsitaraf_ad', tab: 'taraflar', label: 'Karşı taraf adı' },
  { path: 'taraf.police_no', tab: 'taraflar', label: 'Karşı taraf poliçe no' },
  { path: 'taraf.karsitaraf_plaka', tab: 'taraflar', label: 'Karşı taraf plaka' },
  { path: 'taraf.surucu_ad', tab: 'taraflar', label: 'Sürücü adı' },
  { path: 'taraf.surucu_soyad', tab: 'taraflar', label: 'Sürücü soyadı' },
  { path: 'taraf.surucu_ad_soyad', tab: 'taraflar', label: 'Sürücü adı soyadı' },
  { path: 'taraf.surucu_plaka', tab: 'taraflar', label: 'Sürücü plaka' },
  { path: 'taraf.surucu_telefon', tab: 'taraflar', label: 'Sürücü telefonu' },
  { path: 'taraf.surucu_police_no', tab: 'taraflar', label: 'Sürücü poliçe no' },
  { path: 'taraf.karsitaraf_tc_vergi_no', tab: 'taraflar', label: 'Karşı taraf TC/Vergi No' },

  // stk — surec
  { path: 'stk.asama', tab: 'surec', label: 'STK aşaması' },
  { path: 'stk.ihtar_tarihi', tab: 'surec', label: 'İhtar tarihi' },
  { path: 'stk.arabuluculuk_son_tutanak_tarihi', tab: 'surec', label: 'Arabuluculuk son tutanak tarihi' },
  { path: 'stk.basvuru_tarihi', tab: 'surec', label: 'STK başvuru tarihi' },
  { path: 'stk.stk_esas_no', tab: 'surec', label: 'STK esas numarası' },
  { path: 'stk.stk_karar_no', tab: 'surec', label: 'STK karar numarası' },
  { path: 'stk.stk_itiraz_esas_no', tab: 'surec', label: 'STK itiraz esas no' },
  { path: 'stk.stk_itiraz_karar_no', tab: 'surec', label: 'STK itiraz karar no' },
  { path: 'stk.bilirkisi_ucret_talep_tarihi', tab: 'surec', label: 'Bilirkişi ücret talep tarihi' },
  { path: 'stk.bilirkisi_raporu_tebliğ_tarihi', tab: 'surec', label: 'Bilirkişi raporu tebliğ tarihi' },
  { path: 'stk.islah_tarihi', tab: 'surec', label: 'Islah tarihi' },
  { path: 'stk.karar_tarihi', tab: 'surec', label: 'STK karar tarihi' },
  { path: 'stk.kesinlesme_tarihi', tab: 'surec', label: 'STK kesinleşme tarihi' },

  // mahkeme — surec
  { path: 'mahkeme.asama', tab: 'surec', label: 'Mahkeme aşaması' },
  { path: 'mahkeme.ilk_derece_esas_no', tab: 'surec', label: 'İlk derece esas no' },
  { path: 'mahkeme.ilk_derece_karar_no', tab: 'surec', label: 'İlk derece karar no' },
  { path: 'mahkeme.ilk_derece_mahkeme_adi', tab: 'surec', label: 'İlk derece mahkeme adı' },
  { path: 'mahkeme.istinaf_esas_no', tab: 'surec', label: 'İstinaf esas no' },
  { path: 'mahkeme.istinaf_karar_no', tab: 'surec', label: 'İstinaf karar no' },
  { path: 'mahkeme.istinaf_mahkeme_adi', tab: 'surec', label: 'İstinaf mahkeme adı' },
  { path: 'mahkeme.temyiz_esas_no', tab: 'surec', label: 'Temyiz esas no' },
  { path: 'mahkeme.temyiz_karar_no', tab: 'surec', label: 'Temyiz karar no' },
  { path: 'mahkeme.temyiz_mahkeme_adi', tab: 'surec', label: 'Temyiz mahkeme adı' },
  { path: 'mahkeme.dava_dilekcesi_tebliğ_tarihi', tab: 'surec', label: 'Dava dilekçesi tebliğ tarihi' },
  { path: 'mahkeme.cevap_dilekcesi_tebliğ_tarihi', tab: 'surec', label: 'Cevap dilekçesi tebliğ tarihi' },
  { path: 'mahkeme.replik_dilekcesi_tebliğ_tarihi', tab: 'surec', label: 'Replik dilekçesi tebliğ tarihi' },
  { path: 'mahkeme.duplik_dilekcesi_tebliğ_tarihi', tab: 'surec', label: 'Duplik dilekçesi tebliğ tarihi' },
  { path: 'mahkeme.bilirkisi_ucret_talep_tarihi', tab: 'surec', label: 'Bilirkişi ücret talep tarihi' },
  { path: 'mahkeme.bilirkisi_raporu_tebliğ_tarihi', tab: 'surec', label: 'Bilirkişi raporu tebliğ tarihi' },
  { path: 'mahkeme.karar_tebliğ_tarihi', tab: 'surec', label: 'Karar tebliğ tarihi' },
  { path: 'mahkeme.istinaf_dilekcesi_tebliğ_tarihi', tab: 'surec', label: 'İstinaf dilekçesi tebliğ tarihi' },
  { path: 'mahkeme.istinaf_karar_tebliğ_tarihi', tab: 'surec', label: 'İstinaf karar tebliğ tarihi' },
  { path: 'mahkeme.temyiz_dilekcesi_tebliğ_tarihi', tab: 'surec', label: 'Temyiz dilekçesi tebliğ tarihi' },
  { path: 'mahkeme.temyiz_karar_tebliğ_tarihi', tab: 'surec', label: 'Temyiz karar tebliğ tarihi' },
  { path: 'mahkeme.kesinlesme_tarihi', tab: 'surec', label: 'Mahkeme kesinleşme tarihi' },

  // durusmalar — durusmalar
  { path: 'durusmalar[0].tarih', tab: 'durusmalar', label: 'Duruşma tarihi' },
  { path: 'durusmalar[0].saat', tab: 'durusmalar', label: 'Duruşma saati' },
  { path: 'durusmalar[0].mahkeme_kurum', tab: 'durusmalar', label: 'Duruşma mahkeme/kurum' },
  { path: 'durusmalar[0].tur', tab: 'durusmalar', label: 'Duruşma türü' },
  { path: 'durusmalar[0].notlar', tab: 'durusmalar', label: 'Duruşma notları' },

  // sureler — finans
  { path: 'sureler[0].ad', tab: 'finans', label: 'Süre adı' },
  { path: 'sureler[0].son_tarih', tab: 'finans', label: 'Süre son tarihi' },
  { path: 'sureler[0].tur', tab: 'finans', label: 'Süre türü' },
  { path: 'sureler[0].notlar', tab: 'finans', label: 'Süre notları' },

  // finans_kalemleri — finans
  { path: 'finans_kalemleri[0].tur', tab: 'finans', label: 'Finans kalemi türü' },
  { path: 'finans_kalemleri[0].tutar', tab: 'finans', label: 'Finans kalemi tutarı' },
  { path: 'finans_kalemleri[0].tarih', tab: 'finans', label: 'Finans kalemi tarihi' },
  { path: 'finans_kalemleri[0].aciklama', tab: 'finans', label: 'Finans kalemi açıklaması' },

  // notlar — notlar
  { path: 'notlar[0].icerik', tab: 'notlar', label: 'Not içeriği' },
  { path: 'notlar[0].created_at', tab: 'notlar', label: 'Not oluşturulma tarihi' },
]

/**
 * Resolve a dot-notation path against an object, supporting optional array indexing.
 * Examples: 'a.b', 'arr[0].x'
 * Returns undefined if any segment is missing.
 */
export function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const segments = path.split('.')
  let current: unknown = obj

  for (const segment of segments) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined
    }

    const bracketIndex = segment.indexOf('[')
    if (bracketIndex !== -1 && segment.endsWith(']')) {
      const arrayKey = segment.slice(0, bracketIndex)
      const indexStr = segment.slice(bracketIndex + 1, -1)
      const index = Number(indexStr)

      const arr = (current as Record<string, unknown>)[arrayKey]
      if (!Array.isArray(arr) || Number.isNaN(index)) {
        return undefined
      }
      current = arr[index]
    } else {
      current = (current as Record<string, unknown>)[segment]
    }
  }

  return current
}

/**
 * Check which template variables are missing from the provided context.
 * Returns structured data with tab slug and Turkish label for each missing variable.
 */
export function getMissingVariables(
  templateVars: string[],
  context: Record<string, unknown>
): Array<{ var: string; tab: string; label: string }> {
  const missing: Array<{ var: string; tab: string; label: string }> = []
  const registryByPath = new Map(VARIABLE_REGISTRY.map((v) => [v.path, v]))

  for (const varPath of templateVars) {
    const basePath = varPath.includes('|') ? varPath.split('|')[0].trim() : varPath
    const value = getNestedValue(context, basePath)
    if (value === undefined || value === null || value === '') {
      const info = registryByPath.get(basePath)
      missing.push({
        var: varPath,
        tab: info?.tab ?? 'genel',
        label: info?.label ?? varPath,
      })
    }
  }

  return missing
}
