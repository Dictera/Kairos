import { describe, it, expect } from 'vitest'
import { muvekkil } from '@/lib/schema'

describe('Schema: muvekkil table', () => {
  it('muvekkil table has correct columns and no email', () => {
    const expectedColumns = ['id', 'ad', 'soyad', 'telefon', 'tc_vergi_no', 'adres', 'notlar', 'created_at', 'updated_at']
    for (const col of expectedColumns) {
      expect(muvekkil).toHaveProperty(col)
    }
    // Explicit negative assertion — regression protection against re-adding email
    expect(muvekkil).not.toHaveProperty('email')
  })
  it.todo('dosya table has FK to muvekkil (muvekkil_id NOT NULL)')
  it.todo('taraf table has FK to dosya with ON DELETE CASCADE')
  it.todo('sigorta_turu table exists with id and ad columns')
  it.todo('sigorta_sirketi table exists with id and ad columns')
  it.todo('mahkeme table exists with id, ad, sehir columns')
})

describe('tRPC: muvekkil router', () => {
  it.todo('list returns paginated results with total count')
  it.todo('list with search filters by ad/soyad using lower_tr')
  it.todo('create inserts a new muvekkil and returns the row')
  it.todo('update modifies existing muvekkil')
  it.todo('delete with linked dosyalar throws PRECONDITION_FAILED')
  it.todo('delete without linked dosyalar succeeds')
})

describe('tRPC: ayarlar router', () => {
  it.todo('sigorta_sirketi.list returns all records')
  it.todo('sigorta_sirketi.create inserts record')
  it.todo('sigorta_sirketi.delete removes record')
  it.todo('mahkeme.list returns all records')
  it.todo('sigorta_turu.list returns seeded values (Kasko, Trafik/ZMSS, Sağlık, Hayat)')
})

describe('tRPC: dosya router', () => {
  it.todo('create inserts dosya with muvekkil_id FK')
  it.todo('list returns paginated dosyalar with muvekkil join')
  it.todo('list filters by tur (STK/AT/AH)')
  it.todo('list filters by durum (aktif/arsiv)')
  it.todo('archive sets durum to arsiv')
  it.todo('taraf.upsert creates or updates counter-party record for dosya')
})
