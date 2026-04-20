import { describe, it, expect, vi, beforeEach } from 'vitest'

// Simple tests for health-check that don't need complex execa mocking
describe('lib/pipeline/health-check', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getHealthStatus returns result structure with lastChecked', async () => {
    // Mock config and docx-pipeline to return accessible: true
    vi.mock('@/lib/pipeline/config', () => ({
      getSidecarPythonPath: async () => '/usr/bin/python3',
      getLibreOfficePath: async () => '/usr/bin/soffice',
      SIDECAR_DIR: '/mock/sidecar',
    }))

    vi.mock('@/lib/services/docx-pipeline', () => ({
      runSidecarCommand: async () => ({
        status: 'success',
        result: {
          python_version: '3.11.0',
          libreoffice_version: null,
          python_accessible: true,
          libreoffice_accessible: false,
        },
      }),
    }))

    const { getHealthStatus } = await import('@/lib/pipeline/health-check')

    const result = await getHealthStatus()
    expect(result.python.accessible).toBe(true)
    expect(result.python.version).toBe('3.11.0')
    expect(result.lastChecked).toBeInstanceOf(Date)
  })

  it('invalidateHealthCache is exported and callable', async () => {
    vi.mock('@/lib/pipeline/config', () => ({
      getSidecarPythonPath: async () => '/usr/bin/python3',
      getLibreOfficePath: async () => '/usr/bin/soffice',
      SIDECAR_DIR: '/mock/sidecar',
    }))

    vi.mock('@/lib/services/docx-pipeline', () => ({
      runSidecarCommand: async () => ({
        status: 'success',
        result: {
          python_version: '3.11.0',
          libreoffice_version: null,
          python_accessible: true,
          libreoffice_accessible: false,
        },
      }),
    }))

    const { invalidateHealthCache } = await import('@/lib/pipeline/health-check')

    // Just verify it doesn't throw
    expect(() => invalidateHealthCache()).not.toThrow()
  })
})