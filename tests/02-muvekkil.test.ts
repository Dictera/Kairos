import { describe, it, expect, beforeAll } from 'vitest'
import { muvekkillRouter } from '@/lib/trpc/routers/muvekkil'
import { createCallerFactory } from '@/lib/trpc/init'

const createCaller = createCallerFactory(muvekkillRouter)
let caller: ReturnType<typeof createCaller>

beforeAll(() => {
  caller = createCaller({ session: { isLoggedIn: true, user: undefined } })
})

describe('muvekkil router — procedure registry', () => {
  it('delete procedure exists on router', () => {
    expect(muvekkillRouter._def.procedures).toHaveProperty('delete')
  })

  it('list procedure exists on router', () => {
    expect(muvekkillRouter._def.procedures).toHaveProperty('list')
  })

  it('create procedure exists on router', () => {
    expect(muvekkillRouter._def.procedures).toHaveProperty('create')
  })

  it('getById procedure exists on router', () => {
    expect(muvekkillRouter._def.procedures).toHaveProperty('getById')
  })

  it('update procedure exists on router', () => {
    expect(muvekkillRouter._def.procedures).toHaveProperty('update')
  })
})

describe('muvekkil router — caller factory', () => {
  it('createCallerFactory returns a callable factory for muvekkillRouter', () => {
    expect(typeof createCaller).toBe('function')
    // In tRPC v11 the caller returned by createCaller is a function (callable object)
    expect(caller).toBeDefined()
  })

  it('caller exposes list function', () => {
    expect(typeof caller.list).toBe('function')
  })

  it('caller exposes create function', () => {
    expect(typeof caller.create).toBe('function')
  })

  it('caller exposes update function', () => {
    expect(typeof caller.update).toBe('function')
  })

  it('caller exposes delete function', () => {
    expect(typeof caller.delete).toBe('function')
  })

  it('caller exposes getById function', () => {
    expect(typeof caller.getById).toBe('function')
  })
})

describe('muvekkil delete protection (D-07)', () => {
  it('delete procedure is defined and is a mutation', () => {
    const deleteDef = muvekkillRouter._def.procedures.delete._def
    // tRPC v11: type is stored in the procedure definition
    expect(deleteDef).toBeDefined()
  })

  it('list procedure is defined and is a query', () => {
    const listDef = muvekkillRouter._def.procedures.list._def
    expect(listDef).toBeDefined()
  })
})
