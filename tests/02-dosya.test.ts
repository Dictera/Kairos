import { describe, it, expect } from 'vitest'
import { dosyaRouter } from '@/lib/trpc/routers/dosya'

describe('dosya router: procedure existence', () => {
  it('has list procedure', () => {
    expect(dosyaRouter._def.procedures).toHaveProperty('list')
  })
  it('has getById procedure', () => {
    expect(dosyaRouter._def.procedures).toHaveProperty('getById')
  })
  it('has create procedure', () => {
    expect(dosyaRouter._def.procedures).toHaveProperty('create')
  })
  it('has update procedure', () => {
    expect(dosyaRouter._def.procedures).toHaveProperty('update')
  })
  it('has archive procedure', () => {
    expect(dosyaRouter._def.procedures).toHaveProperty('archive')
  })
  it('has delete procedure', () => {
    expect(dosyaRouter._def.procedures).toHaveProperty('delete')
  })
  it('has upsertTaraf procedure', () => {
    expect(dosyaRouter._def.procedures).toHaveProperty('upsertTaraf')
  })
})

describe('dosya schema constraints', () => {
  it.todo('create rejects dosya_no > 50 chars')
  it.todo('create rejects tur values other than STK, AT, AH')
  it.todo('list pageSize cannot exceed 100')
  it.todo('archive sets durum to arsiv')
  it.todo('delete cascades to taraf rows')
  it.todo('upsertTaraf creates taraf when none exists')
  it.todo('upsertTaraf updates taraf when one exists')
})
