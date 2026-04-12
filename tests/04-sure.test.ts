import { describe, it, expect } from 'vitest'
import { sureRouter } from '@/lib/trpc/routers/sure'

describe('sure router: procedure existence (SURE-04)', () => {
  it('has list procedure', () => {
    expect(sureRouter._def.procedures).toHaveProperty('list')
  })
  it('has createManuel procedure', () => {
    expect(sureRouter._def.procedures).toHaveProperty('createManuel')
  })
  it('has updateManuel procedure', () => {
    expect(sureRouter._def.procedures).toHaveProperty('updateManuel')
  })
  it('has deleteSure procedure', () => {
    expect(sureRouter._def.procedures).toHaveProperty('deleteSure')
  })
})
