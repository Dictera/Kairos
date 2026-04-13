// Predefined variables (D-04 from 07-RESEARCH.md)
export const DEGISKENLER = [
  'müvekkil_adı', 'müvekkil_soyadı', 'dosya_no', 'dava_no', 'stk_no',
  'mahkeme', 'durusma_tarihi', 'talep_tutari', 'sigorta_şirketi', 'karsitaraf',
  'karsitaraf_vekil', 'police_no', 'basvuru_tarihi', 'karar_tarihi', 'tebligat_tarihi',
] as const

export type VariableMap = Record<string, string>

/**
 * Substitutes {{variable}} placeholders in template content with values from variables map.
 * Preserves unknown variables as-is ({{unknown_var}} stays if not in map).
 */
export function substituteVariables(
  template: string,
  variables: VariableMap
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] ?? match
  })
}

/**
 * Extracts all variable names from a template string.
 * Returns array of unique variable names found in {{...}} patterns.
 */
export function extractVariables(template: string): string[] {
  const matches = template.matchAll(/\{\{(\w+)\}\}/g)
  return [...new Set([...matches].map(m => m[1]))]
}

/**
 * Validates that all variables in the template have values provided.
 * Returns array of missing variable names (empty if all present).
 */
export function validateVariables(
  template: string,
  variables: VariableMap
): string[] {
  const needed = extractVariables(template)
  return needed.filter(name => {
    const value = variables[name]
    return value === undefined || value === null || value === ''
  })
}

/**
 * Builds a variable map from case (dosya) data by extracting relevant fields.
 * Maps dosya/muvekkil fields to variable names.
 * 
 * Note: stk_no, dava_no, basvuru_tarihi, karar_tarihi, tebligat_tarihi are stored
 * in the surec_detay JSON column, not as direct columns on dosya.
 */
export function buildVariableMapFromDosya(dosya: any, muvekkil: any): VariableMap {
  const map: VariableMap = {}
  
  // Parse surec_detay if it exists
  let surecDetay: any = {}
  if (dosya.surec_detay) {
    try {
      surecDetay = JSON.parse(dosya.surec_detay) || {}
    } catch {
      surecDetay = {}
    }
  }
  
  // Predefined variables from D-04
  if (muvekkil) {
    map['müvekkil_adı'] = muvekkil.ad?.split(' ')[0] || ''
    map['müvekkil_soyadı'] = muvekkil.ad?.split(' ').slice(1).join(' ') || ''
  }
  
  map['dosya_no'] = dosya.dosya_no || ''
  
  // STK-specific fields from surec_detay.stk
  if (surecDetay.stk) {
    map['stk_no'] = surecDetay.stk.basvuru_no || ''
    map['basvuru_tarihi'] = surecDetay.stk.basvuru_tarihi || ''
    map['tebligat_tarihi'] = surecDetay.stk.tebligat_tarihi || ''
  }
  
  // Mahkeme-specific fields from surec_detay.mahkeme
  if (surecDetay.mahkeme) {
    map['dava_no'] = surecDetay.mahkeme.esas_no || ''
    map['karar_tarihi'] = surecDetay.mahkeme.karar_tarihi || ''
  }
  
  // mahkeme - return ID for now (would need join with mahkeme table for name)
  map['mahkeme'] = dosya.mahkeme_id?.toString() || ''
  
  // durusma_tarihi - next hearing date (would need query to durusma table)
  map['durusma_tarihi'] = ''
  
  map['talep_tutari'] = dosya.talep_tutari?.toString() || ''
  map['sigorta_şirketi'] = dosya.sigorta_sirketi_id?.toString() || ''
  map['karsitaraf'] = '' // From taraf table - populated separately
  map['karsitaraf_vekil'] = ''
  map['police_no'] = '' // From taraf table
  
  return map
}