import { describe, it, expect } from 'vitest'
import { dashboardRouter } from '@/lib/trpc/routers/dashboard'

describe('dashboard router: procedure existence (DASH-01)', () => {
  it('has dashboardStats procedure', () => {
    expect(dashboardRouter._def.procedures).toHaveProperty('dashboardStats')
  })
})
