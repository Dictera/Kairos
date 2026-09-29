import os from 'os'
import path from 'path'
import fs from 'fs'

const DEFAULT_BELGELER_BASE = path.join(os.homedir(), 'sigorta-belgeler')
const SETTINGS_PATH = path.join(process.cwd(), 'data', 'settings.json')

function readSettingsPath(): string {
  try {
    const raw = fs.readFileSync(SETTINGS_PATH, 'utf-8')
    const parsed = JSON.parse(raw)
    if (parsed.belgelerPath && typeof parsed.belgelerPath === 'string') {
      return parsed.belgelerPath
    }
  } catch {
    // settings.json yok veya okunamadı
  }
  return DEFAULT_BELGELER_BASE
}

export function resolveBelgelerBase(): string {
  return readSettingsPath()
}

// Backward compat: sync export for non-test callers
export const BELGELER_BASE = process.env.TEST_BELGELER_BASE
  ? process.env.TEST_BELGELER_BASE
  : readSettingsPath()

// Control characters are matched on purpose: Windows forbids them in file names.
// oxlint-disable-next-line no-control-regex
const WINDOWS_UNSAFE = /[<>:"/\\|?*\x00-\x1f]/g

export function sanitizeFsSegment(str: string): string {
  return (
    str
      .replace(WINDOWS_UNSAFE, '-')
      .replace(/\.\./g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .trim() || 'bilinmiyor'
  )
}

export function getTurLabel(tur: string): string {
  const labels: Record<string, string> = {
    STK: 'STK',
    AT: 'Asliye Ticaret',
    AH: 'Asliye Hukuk',
  }
  return sanitizeFsSegment(labels[tur] ?? tur)
}

export interface BelgeDosyaBilgi {
  tur: string
  sigortaTuruAd?: string | null
  muvekkilAd?: string | null
  muvekkilPlaka?: string | null
}

export function buildBelgelerDir(info: BelgeDosyaBilgi): string {
  const turLabel = getTurLabel(info.tur)
  const sigortaLabel = info.sigortaTuruAd?.trim()
    ? sanitizeFsSegment(info.sigortaTuruAd)
    : 'Belirtilmemiş'
  const muvekkilBase = sanitizeFsSegment(info.muvekkilAd?.trim() || 'bilinmiyor')
  const muvekkilLabel = info.muvekkilPlaka?.trim()
    ? `${muvekkilBase} - ${sanitizeFsSegment(info.muvekkilPlaka)}`
    : muvekkilBase
  return path.join(BELGELER_BASE, turLabel, sigortaLabel, muvekkilLabel)
}

/** True when `target` resolves to `baseDir` itself or a path beneath it. */
export function isInsideDir(baseDir: string, target: string): boolean {
  const rel = path.relative(path.resolve(baseDir), path.resolve(target))
  return rel !== '..' && !rel.startsWith('..' + path.sep) && !path.isAbsolute(rel)
}

export function safeDeleteBelge(filePath: string): void {
  try {
    if (!isInsideDir(BELGELER_BASE, filePath)) return
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  } catch {
    // ignore
  }
}
