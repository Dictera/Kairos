import { describe, it, expect } from 'vitest'
import { ayarlarRouter } from '@/lib/trpc/routers/ayarlar'

// tRPC v11: createTRPCRouter returns an object where sub-routers are accessed
// via _def.record, and each sub-router exposes procedures as direct keys on the object.

describe('ayarlar router: sub-router structure', () => {
  it('has sigortaSirketi sub-router', () => {
    expect(ayarlarRouter._def.record).toHaveProperty('sigortaSirketi')
  })
  it('has mahkeme sub-router', () => {
    expect(ayarlarRouter._def.record).toHaveProperty('mahkeme')
  })
  it('has sigortaTuru sub-router', () => {
    expect(ayarlarRouter._def.record).toHaveProperty('sigortaTuru')
  })
})

describe('ayarlar router: sigortaSirketi procedures', () => {
  const ss = ayarlarRouter._def.record.sigortaSirketi as Record<string, unknown>

  it('has list procedure', () => {
    expect(ss).toHaveProperty('list')
  })
  it('has create procedure', () => {
    expect(ss).toHaveProperty('create')
  })
  it('has update procedure', () => {
    expect(ss).toHaveProperty('update')
  })
  it('has delete procedure', () => {
    expect(ss).toHaveProperty('delete')
  })
})

describe('ayarlar router: mahkeme procedures', () => {
  const mh = ayarlarRouter._def.record.mahkeme as Record<string, unknown>

  it('has list procedure', () => {
    expect(mh).toHaveProperty('list')
  })
  it('has create procedure', () => {
    expect(mh).toHaveProperty('create')
  })
  it('has update procedure', () => {
    expect(mh).toHaveProperty('update')
  })
  it('has delete procedure', () => {
    expect(mh).toHaveProperty('delete')
  })
})

describe('ayarlar router: sigortaTuru procedures', () => {
  const st = ayarlarRouter._def.record.sigortaTuru as Record<string, unknown>

  it('has list procedure', () => {
    expect(st).toHaveProperty('list')
  })
  it('has create procedure', () => {
    expect(st).toHaveProperty('create')
  })
  it('has update procedure', () => {
    expect(st).toHaveProperty('update')
  })
  it('has delete procedure', () => {
    expect(st).toHaveProperty('delete')
  })
})
