import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockWhichFn = vi.fn()

vi.mock('which', () => ({
  default: mockWhichFn,
  which: mockWhichFn,
}))

vi.mock('fs', () => ({
  existsSync: vi.fn(),
  access: vi.fn((_path: string, _mode: number, cb: (err: NodeJS.ErrnoException | null) => void) => cb(null)),
}))

describe('lib/pipeline/config', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    mockWhichFn.mockReset()
  })

  it('getPythonPath returns env override when PYTHON_PATH is set', async () => {
    process.env.PYTHON_PATH = '/custom/python.exe'

    const { getPythonPath } = await import('@/lib/pipeline/config')
    const result = await getPythonPath()
    expect(result).toBe('/custom/python.exe')

    delete process.env.PYTHON_PATH
  })

  it('getPythonPath falls back to which(python3) when PYTHON_PATH not set', async () => {
    delete process.env.PYTHON_PATH
    mockWhichFn.mockResolvedValue('/usr/bin/python3')

    const { getPythonPath } = await import('@/lib/pipeline/config')
    const result = await getPythonPath()
    expect(result).toBe('/usr/bin/python3')
  })

  it('getPythonPath falls back to which(python) when python3 not found', async () => {
    delete process.env.PYTHON_PATH
    mockWhichFn.mockImplementation(async (cmd: string) => {
      if (cmd === 'python3') return null
      if (cmd === 'python') return '/usr/bin/python'
      return null
    })

    const { getPythonPath } = await import('@/lib/pipeline/config')
    const result = await getPythonPath()
    expect(result).toBe('/usr/bin/python')
  })

  it('getPythonPath returns null when no python found', async () => {
    delete process.env.PYTHON_PATH
    mockWhichFn.mockResolvedValue(null)

    const { getPythonPath } = await import('@/lib/pipeline/config')
    const result = await getPythonPath()
    expect(result).toBeNull()
  })

  it('getLibreOfficePath returns env override when LIBREOFFICE_PATH is set', async () => {
    process.env.LIBREOFFICE_PATH = 'C:\\Custom\\LibreOffice\\soffice.exe'

    const { getLibreOfficePath } = await import('@/lib/pipeline/config')
    const result = await getLibreOfficePath()
    expect(result).toBe('C:\\Custom\\LibreOffice\\soffice.exe')

    delete process.env.LIBREOFFICE_PATH
  })

  it('getLibreOfficePath returns platform default when not set', async () => {
    delete process.env.LIBREOFFICE_PATH

    const originalPlatform = process.platform
    Object.defineProperty(process, 'platform', { value: 'win32' })

    const { existsSync } = await import('fs')
    vi.mocked(existsSync).mockImplementation((path: string) => {
      if (path === 'C:\\Program Files\\LibreOffice\\program\\soffice.exe') return true
      return false
    })

    const { getLibreOfficePath } = await import('@/lib/pipeline/config')
    const result = await getLibreOfficePath()
    expect(result).toBe('C:\\Program Files\\LibreOffice\\program\\soffice.exe')

    Object.defineProperty(process, 'platform', { value: originalPlatform })
  })

  it('getLibreOfficePath returns null when platform default not found', async () => {
    delete process.env.LIBREOFFICE_PATH

    const originalPlatform = process.platform
    Object.defineProperty(process, 'platform', { value: 'win32' })

    const { existsSync } = await import('fs')
    vi.mocked(existsSync).mockReturnValue(false)

    const { getLibreOfficePath } = await import('@/lib/pipeline/config')
    const result = await getLibreOfficePath()
    expect(result).toBeNull()

    Object.defineProperty(process, 'platform', { value: originalPlatform })
  })

  it('SIDECAR_DIR resolves to absolute path of scripts/docx-pipeline', async () => {
    const { SIDECAR_DIR } = await import('@/lib/pipeline/config')
    expect(SIDECAR_DIR).toContain('scripts')
    expect(SIDECAR_DIR).toContain('docx-pipeline')
  })

  it('getSidecarPythonPath returns venv path when .venv exists', async () => {
    const { existsSync } = await import('fs')
    vi.mocked(existsSync).mockImplementation((path: string) => {
      if (path.includes('.venv')) return true
      return false
    })

    const { getSidecarPythonPath } = await import('@/lib/pipeline/config')
    const result = await getSidecarPythonPath()
    expect(result).toContain('.venv')
  })

  it('getSidecarPythonPath falls back to getPythonPath when venv missing', async () => {
    const { existsSync } = await import('fs')
    vi.mocked(existsSync).mockReturnValue(false)
    process.env.PYTHON_PATH = '/system/python'

    const { getSidecarPythonPath } = await import('@/lib/pipeline/config')
    const result = await getSidecarPythonPath()
    expect(result).toBe('/system/python')

    delete process.env.PYTHON_PATH
  })
})