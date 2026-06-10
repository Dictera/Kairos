import { existsSync, readFileSync } from 'fs'
import { dirname, join } from 'path'
import { getSidecarPythonPath, getLibreOfficePath } from '@/lib/pipeline/config'
import { runSidecarCommand } from '@/lib/services/docx-pipeline'

const CACHE_TTL_MS = 2 * 60 * 60 * 1000

function readLibreOfficeVersionFromIni(libreofficePath: string): string | null {
  try {
    const loDir = dirname(libreofficePath)
    const versionIni = join(loDir, 'version.ini')
    if (!existsSync(versionIni)) return null

    const content = readFileSync(versionIni, 'utf-8')
    const buildIdMatch = content.match(/buildid=(.+)/i)
    if (buildIdMatch) {
      return `LibreOffice ${buildIdMatch[1].trim()}`
    }
    return null
  } catch {
    return null
  }
}

interface HealthStatus {
  python: {
    accessible: boolean
    version: string | null
    path: string | null
  }
  libreoffice: {
    accessible: boolean
    version: string | null
    path: string | null
  }
  lastChecked: Date | null
}

interface HealthCache {
  result: HealthStatus
  expiresAt: number
}

let healthCache: HealthCache | null = null
let healthPending: Promise<HealthStatus> | null = null

export async function getHealthStatus(): Promise<HealthStatus> {
  if (healthCache && Date.now() < healthCache.expiresAt) {
    return healthCache.result
  }

  if (healthPending) {
    return healthPending
  }

  healthPending = runHealthChecks().then((result) => {
    healthCache = { result, expiresAt: Date.now() + CACHE_TTL_MS }
    healthPending = null
    return result
  })

  return healthPending
}

async function runHealthChecks(): Promise<HealthStatus> {
  const [pythonPath, libreofficePath] = await Promise.all([
    getSidecarPythonPath(),
    getLibreOfficePath(),
  ])

  let pythonAccessible = false
  let pythonVersion: string | null = null

  if (pythonPath) {
    try {
      const result = await runSidecarCommand({ command: 'health-check', params: { libreoffice_path: libreofficePath ?? undefined } })
      if (result.status === 'success' && result.result) {
        const r = result.result as { python_version?: string; python_accessible?: boolean }
        pythonVersion = r.python_version ?? null
        pythonAccessible = r.python_accessible ?? false
      }
    } catch {
      pythonAccessible = false
    }
  }

  let libreofficeAccessible = false
  let libreofficeVersion: string | null = null

  if (libreofficePath) {
    libreofficeAccessible = true
    if (process.platform === 'win32') {
      libreofficeVersion = readLibreOfficeVersionFromIni(libreofficePath)
    } else {
      try {
        const { execa } = await import('execa')
        const { stdout } = await execa(libreofficePath, ['--version'], {
          timeout: 5_000,
          reject: false,
        })
        libreofficeVersion = stdout.trim() || null
      } catch {
        libreofficeVersion = null
      }
    }
  }

  return {
    python: {
      accessible: pythonAccessible,
      version: pythonVersion,
      path: pythonPath,
    },
    libreoffice: {
      accessible: libreofficeAccessible,
      version: libreofficeVersion,
      path: libreofficePath,
    },
    lastChecked: new Date(),
  }
}

/**
 * Invalidates the health check cache, forcing a fresh check on the next call.
 */
export function invalidateHealthCache(): void {
  healthCache = null
  healthPending = null
}