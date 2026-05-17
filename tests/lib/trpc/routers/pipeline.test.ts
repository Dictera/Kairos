import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetHealthStatus = vi.fn()
const mockGetSidecarPythonPath = vi.fn()
const mockGetLibreOfficePath = vi.fn()

vi.mock('@/lib/pipeline/health-check', () => ({
  getHealthStatus: mockGetHealthStatus,
}))

vi.mock('@/lib/pipeline/config', () => ({
  getPythonPath: mockGetSidecarPythonPath,
  getLibreOfficePath: mockGetLibreOfficePath,
  getSidecarPythonPath: mockGetSidecarPythonPath,
}))

describe('lib/trpc/routers/pipeline', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    mockGetHealthStatus.mockReset()
    mockGetSidecarPythonPath.mockReset()
    mockGetLibreOfficePath.mockReset()
  })

  it('pipelineRouter.healthCheck returns HealthStatus shape', async () => {
    const mockHealthStatus = {
      python: { accessible: true, version: '3.11.0', path: '/usr/bin/python3' },
      libreoffice: { accessible: false, version: null, path: null },
      lastChecked: new Date(),
    }
    mockGetHealthStatus.mockResolvedValue(mockHealthStatus)

    const { pipelineRouter } = await import('@/lib/trpc/routers/pipeline')

    const caller = pipelineRouter.createCaller({ session: { isLoggedIn: true } } as any)
    const result = await caller.healthCheck()

    expect(result.python.accessible).toBe(true)
    expect(result.libreoffice.accessible).toBe(false)
  })

  it('pipelineRouter.status returns path info for Python and LibreOffice', async () => {
    mockGetSidecarPythonPath.mockResolvedValue('/custom/python')
    mockGetLibreOfficePath.mockResolvedValue('C:\\Program Files\\LibreOffice\\program\\soffice.exe')

    const { pipelineRouter } = await import('@/lib/trpc/routers/pipeline')

    const caller = pipelineRouter.createCaller({ session: { isLoggedIn: true } } as any)
    const result = await caller.status()

    expect(result.python.path).toBe('/custom/python')
    expect(result.libreoffice.path).toContain('LibreOffice')
  })
})