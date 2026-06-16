import { execFile } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'

const execFileAsync = promisify(execFile)

const REPO_ROOT = process.cwd()
const GIT_TIMEOUT = 20_000
/** Güncelleme yalnızca bu resmi depodan çekilebilir (kötü amaçlı 'origin' değişikliğine karşı). */
const EXPECTED_REMOTE = 'dictera/kairos'
/** Launcher (start-kairos) bu dosyayı görünce güncellemeyi uygular ve yeniden başlatır. */
export const UPDATE_FLAG_PATH = path.join(REPO_ROOT, 'data', '.update-requested')

/** Uygulamayı launcher (start-kairos) mı başlattı? Öyleyse buton ile yeniden başlatma yapılabilir. */
export function isManaged(): boolean {
  return process.env.KAIROS_MANAGED === '1'
}

async function git(args: string[]): Promise<string> {
  const { stdout } = await execFileAsync('git', args, {
    cwd: REPO_ROOT,
    timeout: GIT_TIMEOUT,
    windowsHide: true,
  })
  return stdout.trim()
}

function isGitRepo(): boolean {
  return fs.existsSync(path.join(REPO_ROOT, '.git'))
}

/** github.com remote URL'inden owner/repo çıkar (https ve ssh biçimleri). */
function parseRepoSlug(remoteUrl: string): string | null {
  // https://github.com/owner/repo(.git) ve git@github.com:owner/repo(.git)
  // Host sınırı (^|[/@]) — 'evilgithub.com' gibi benzer-host'lar reddedilir.
  const m = remoteUrl.match(/(?:^|[/@])github\.com[:/]([^/\s]+)\/([^/\s]+?)(?:\.git)?\/?$/i)
  return m ? `${m[1].toLowerCase()}/${m[2].toLowerCase()}` : null
}

/** origin uzak adresi TAM olarak resmi depoya mı işaret ediyor? (fork/benzer-host reddedilir) */
export async function isRemoteTrusted(): Promise<boolean> {
  try {
    const url = await git(['remote', 'get-url', 'origin'])
    return parseRepoSlug(url) === EXPECTED_REMOTE
  } catch {
    return false
  }
}

function currentVersion(): string {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf-8'))
    return typeof pkg.version === 'string' ? pkg.version : '0.0.0'
  } catch {
    return '0.0.0'
  }
}

export type UpdateStatus =
  | { supported: false; reason: 'no-git'; currentVersion: string }
  | {
      supported: true
      currentVersion: string
      currentSha: string
      remoteSha: string | null
      behind: number
      dirty: boolean
      offline: boolean
      updateAvailable: boolean
      managed: boolean
      remoteTrusted: boolean
    }

export async function getUpdateStatus(): Promise<UpdateStatus> {
  const version = currentVersion()
  if (!isGitRepo()) {
    return { supported: false, reason: 'no-git', currentVersion: version }
  }

  const currentSha = await git(['rev-parse', '--short', 'HEAD'])
  const dirty = (await git(['status', '--porcelain'])).length > 0
  const remoteTrusted = await isRemoteTrusted()

  // origin/main'i güncelle. Ağ yoksa sessizce offline işaretle (hata fırlatma).
  let offline = false
  try {
    await git(['fetch', '--quiet', 'origin', 'main'])
  } catch {
    offline = true
  }

  let remoteSha: string | null = null
  let behind = 0
  try {
    remoteSha = await git(['rev-parse', '--short', 'origin/main'])
    const count = await git(['rev-list', '--count', 'HEAD..origin/main'])
    behind = parseInt(count, 10) || 0
  } catch {
    // origin/main referansı yoksa (ilk fetch başarısız) — güncelleme bilgisi yok
  }

  return {
    supported: true,
    currentVersion: version,
    currentSha,
    remoteSha,
    behind,
    dirty,
    offline,
    updateAvailable: behind > 0 && !dirty && remoteTrusted,
    managed: isManaged(),
    remoteTrusted,
  }
}

/** Güncelleme bayrağını yaz; launcher bir sonraki başlatmada uygular. */
export function requestUpdate(targetSha: string | null): void {
  fs.mkdirSync(path.dirname(UPDATE_FLAG_PATH), { recursive: true })
  fs.writeFileSync(
    UPDATE_FLAG_PATH,
    JSON.stringify({ requestedAt: new Date().toISOString(), targetSha }, null, 2),
    'utf-8',
  )
}
