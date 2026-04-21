import { execa } from 'execa'
import { join } from 'path'
import { getSidecarPythonPath, SIDECAR_DIR } from '@/lib/pipeline/config'
import { CommandEnvelope, CommandResult, CommandResultSchema } from '@/lib/pipeline/protocol'

export interface SidecarResult extends CommandResult {
  exitCode: number
}

/**
 * Run a command via the Python sidecar using JSON stdin/stdout protocol.
 * Uses reject:false to capture exit codes without throwing.
 */
export async function runSidecarCommand(
  envelope: CommandEnvelope,
  timeout?: number
): Promise<SidecarResult> {
  const pythonPath = await getSidecarPythonPath()

  if (!pythonPath) {
    throw new Error(
      'Python bulunamadı. PYTHON_PATH ortam değişkenini ayarlayın veya Python\'u PATH\'e ekleyin.'
    )
  }

  const mainPy = join(SIDECAR_DIR, 'main.py')
  const { stdout, stderr, exitCode } = await execa(pythonPath, [mainPy], {
    cwd: SIDECAR_DIR,
    input: JSON.stringify(envelope),
    timeout: timeout ?? 30_000,
    reject: false,
  })

  // Log stderr lines from structlog JSONL output
  if (stderr) {
    for (const line of stderr.split('\n').filter(Boolean)) {
      console.error('[sidecar]', line)
    }
  }

  // Try to parse stdout as JSON
  let result: CommandResult
  try {
    result = CommandResultSchema.parse(JSON.parse(stdout))
  } catch {
    return {
      status: 'error',
      code: 99,
      message: `Yanıt ayrıştırılamadı: ${stdout.slice(0, 200)}`,
      exitCode: exitCode ?? 99,
    }
  }

  return { ...result, exitCode: exitCode ?? 99 }
}