import { existsSync } from 'fs'
import { join, resolve } from 'path'
import which from 'which'

/** Absolute path to the sidecar directory */
export const SIDECAR_DIR: string = resolve(process.cwd(), 'scripts/docx-pipeline')

/**
 * Returns PYTHON_PATH env var if set, otherwise searches PATH for python3 then python.
 * Returns null if no Python found.
 */
export async function getPythonPath(): Promise<string | null> {
  if (process.env.PYTHON_PATH) {
    return process.env.PYTHON_PATH
  }
  try {
    const python3 = await which('python3')
    if (python3) return python3
  } catch {
    // not found
  }
  try {
    const python = await which('python')
    if (python) return python
  } catch {
    // not found
  }
  return null
}

/**
 * Returns LIBREOFFICE_PATH env var if set, otherwise returns platform default path.
 * Returns null if the binary is not found.
 */
export async function getLibreOfficePath(): Promise<string | null> {
  if (process.env.LIBREOFFICE_PATH) {
    return process.env.LIBREOFFICE_PATH
  }

  let defaultPath: string
  if (process.platform === 'win32') {
    defaultPath = 'C:\\Program Files\\LibreOffice\\program\\soffice.exe'
  } else if (process.platform === 'darwin') {
    defaultPath = '/Applications/LibreOffice.app/Contents/MacOS/soffice'
  } else {
    defaultPath = '/usr/bin/soffice'
  }

  if (!existsSync(defaultPath)) {
    return null
  }

  return defaultPath
}

/**
 * Returns the Python interpreter to use for the sidecar.
 * If .venv exists in SIDECAR_DIR, uses the venv python.
 * Otherwise falls back to getPythonPath().
 */
export async function getSidecarPythonPath(): Promise<string | null> {
  const venvBase = SIDECAR_DIR

  let venvPython: string
  if (process.platform === 'win32') {
    venvPython = join(venvBase, '.venv', 'Scripts', 'python.exe')
  } else {
    venvPython = join(venvBase, '.venv', 'bin', 'python')
  }

  if (existsSync(venvPython)) {
    return venvPython
  }

  return getPythonPath()
}