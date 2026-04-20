import { describe, it, expect, vi, beforeEach } from 'vitest'

// Test the error path that doesn't need execa mocking
describe('lib/services/docx-pipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('runSidecarCommand throws descriptive Turkish error when Python path is null', async () => {
    vi.mock('@/lib/pipeline/config', () => ({
      getSidecarPythonPath: async () => null,
      SIDECAR_DIR: '/mock/sidecar',
    }))

    const { runSidecarCommand } = await import('@/lib/services/docx-pipeline')

    await expect(runSidecarCommand({ command: 'health-check', params: {} })).rejects.toThrow('Python bulunamadı')
  })
})