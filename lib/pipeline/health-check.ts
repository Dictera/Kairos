import { execa } from 'execa'
import { getSidecarPythonPath, getLibreOfficePath } from '@/lib/pipeline/config'
import { runSidecarCommand } from '@/lib/services/docx-pipeline'

const CACHE_TTL_MS = 5 * 60 * 1000

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

/**
 * Returns the cached health status if still valid, otherwise runs fresh checks.
 * Cache TTL is 5 minutes. Uses pending promise to prevent concurrent redundant checks.
 */
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

/**
 * Runs fresh health checks for Python sidecar and LibreOffice binary.
 */
export async function runHealthChecks(): Promise<HealthStatus> {
  const pythonPath = await getSidecarPythonPath()
  const libreofficePath = await getLibreOfficePath()

  let pythonAccessible = false
  let pythonVersion: string | null = null

  if (pythonPath) {
    try {
      const libreofficePath = await getLibreOfficePath()
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
    try {
      const { stdout } = await execa(libreofficePath, ['--version'], {
        timeout: 5_000,
        reject: false,
      })
      libreofficeVersion = stdout.trim() || null
      libreofficeAccessible = true
    } catch {
      libreofficeAccessible = false
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
}