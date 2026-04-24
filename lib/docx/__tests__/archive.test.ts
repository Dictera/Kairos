import { describe, it, expect, vi, beforeEach } from 'vitest'
import path from 'path'
import fs from 'fs'
import {
  ARCHIVE_BASE,
  buildArchivePath,
  generateSlugs,
  isReservedWindowsName,
  safeUnlinkArchive,
} from '@/lib/docx/archive'
import type { SidecarResult } from '@/lib/services/docx-pipeline'
import { TRPCError } from '@trpc/server'

vi.mock('@/lib/services/docx-pipeline', () => ({
  runSidecarCommand: vi.fn(),
}))

import { runSidecarCommand } from '@/lib/services/docx-pipeline'

function mockSuccess(slug: string): SidecarResult {
  return { status: 'success', result: { slug }, exitCode: 0 }
}

function mockError(message: string): SidecarResult {
  return { status: 'error', message, exitCode: 1 }
}

describe('isReservedWindowsName', () => {
  it('returns true for CON', () => {
    expect(isReservedWindowsName('CON')).toBe(true)
  })

  it('returns true for PRN', () => {
    expect(isReservedWindowsName('PRN')).toBe(true)
  })

  it('returns true for AUX', () => {
    expect(isReservedWindowsName('AUX')).toBe(true)
  })

  it('returns true for NUL', () => {
    expect(isReservedWindowsName('NUL')).toBe(true)
  })

  it('returns true for COM1 through COM9', () => {
    for (let i = 1; i <= 9; i++) {
      expect(isReservedWindowsName(`COM${i}`)).toBe(true)
    }
  })

  it('returns true for LPT1 through LPT9', () => {
    for (let i = 1; i <= 9; i++) {
      expect(isReservedWindowsName(`LPT${i}`)).toBe(true)
    }
  })

  it('returns true for lowercase variants', () => {
    expect(isReservedWindowsName('con')).toBe(true)
    expect(isReservedWindowsName('com1')).toBe(true)
    expect(isReservedWindowsName('lpt1')).toBe(true)
  })

  it('returns false for normal names', () => {
    expect(isReservedWindowsName('ali-veli')).toBe(false)
    expect(isReservedWindowsName('dosya-123')).toBe(false)
    expect(isReservedWindowsName('CON-belge')).toBe(false)
  })
})

describe('safeUnlinkArchive', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('deletes file inside ARCHIVE_BASE', () => {
    const target = path.join(ARCHIVE_BASE, 'STK', 'Değer Kaybı', 'test.pdf')
    const existsSpy = vi.spyOn(fs, 'existsSync').mockReturnValue(true)
    const unlinkSpy = vi.spyOn(fs, 'unlinkSync').mockImplementation(() => {})

    safeUnlinkArchive(target)

    expect(existsSpy).toHaveBeenCalledWith(target)
    expect(unlinkSpy).toHaveBeenCalledWith(target)
  })

  it('does not delete files outside ARCHIVE_BASE', () => {
    const target = path.resolve(process.cwd(), 'etc', 'passwd')
    const existsSpy = vi.spyOn(fs, 'existsSync').mockReturnValue(true)
    const unlinkSpy = vi.spyOn(fs, 'unlinkSync').mockImplementation(() => {})

    safeUnlinkArchive(target)

    expect(existsSpy).not.toHaveBeenCalled()
    expect(unlinkSpy).not.toHaveBeenCalled()
  })

  it('swallows errors gracefully', () => {
    const target = path.join(ARCHIVE_BASE, 'missing.pdf')
    vi.spyOn(fs, 'existsSync').mockImplementation(() => {
      throw new Error('disk error')
    })

    expect(() => safeUnlinkArchive(target)).not.toThrow()
  })
})

describe('buildArchivePath', () => {
  it('builds hierarchical dir for STK + sigorta türü + müvekkil with plaka', () => {
    const result = buildArchivePath({
      tur: 'STK',
      sigortaTuruAd: 'Değer Kaybı',
      muvekkilAd: 'Ali Veli',
      muvekkilPlaka: '34ABC123',
    })

    expect(result.dir).toBe(path.join(ARCHIVE_BASE, 'STK', 'Değer Kaybı', 'Ali Veli - 34ABC123'))
    expect(result.fileName).toMatch(/^[a-f0-9]{8}\.pdf$/)
    expect(result.filePath).toBe(path.join(result.dir, result.fileName))
  })

  it('omits plaka segment when muvekkilPlaka is null', () => {
    const result = buildArchivePath({
      tur: 'STK',
      sigortaTuruAd: 'Hasar',
      muvekkilAd: 'Mehmet Can',
      muvekkilPlaka: null,
    })

    expect(result.dir).toBe(path.join(ARCHIVE_BASE, 'STK', 'Hasar', 'Mehmet Can'))
  })

  it('uses Belirtilmemiş when sigortaTuruAd is null', () => {
    const result = buildArchivePath({
      tur: 'AT',
      sigortaTuruAd: null,
      muvekkilAd: 'Test Kişi',
      muvekkilPlaka: null,
    })

    expect(result.dir).toBe(
      path.join(ARCHIVE_BASE, 'Asliye Ticaret', 'Belirtilmemiş', 'Test Kişi')
    )
  })

  it('maps AT to Asliye Ticaret', () => {
    const result = buildArchivePath({ tur: 'AT', muvekkilAd: 'Test', muvekkilPlaka: null })
    expect(result.dir).toContain('Asliye Ticaret')
  })

  it('maps AH to Asliye Hukuk', () => {
    const result = buildArchivePath({ tur: 'AH', muvekkilAd: 'Test', muvekkilPlaka: null })
    expect(result.dir).toContain('Asliye Hukuk')
  })

  it('sanitizes path traversal attempts — result stays within ARCHIVE_BASE', () => {
    const result = buildArchivePath({
      tur: 'STK',
      sigortaTuruAd: '../../../evil',
      muvekkilAd: '..\\secret',
      muvekkilPlaka: null,
    })

    expect(result.dir.startsWith(path.resolve(ARCHIVE_BASE))).toBe(true)
    expect(result.dir).not.toContain('..')
  })
})

describe('generateSlugs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns correct slugs when sidecar responds with success', async () => {
    vi.mocked(runSidecarCommand)
      .mockResolvedValueOnce(mockSuccess('ali-veli'))
      .mockResolvedValueOnce(mockSuccess('34-abc-123'))

    const result = await generateSlugs('Ali Veli', '12345', '34 ABC 123')

    expect(result.muvekkilSlug).toBe('ali-veli')
    expect(result.plakaSlug).toBe('34-abc-123')
    expect(runSidecarCommand).toHaveBeenNthCalledWith(1, {
      command: 'slug',
      params: { text: 'Ali Veli' },
    })
    expect(runSidecarCommand).toHaveBeenNthCalledWith(2, {
      command: 'slug',
      params: { text: '34 ABC 123' },
    })
  })

  it('uses dosya-{dosyaNo} fallback when muvekkilAd is null', async () => {
    vi.mocked(runSidecarCommand).mockResolvedValueOnce(mockSuccess('dosya-12345'))

    const result = await generateSlugs(null, '12345', null)

    expect(result.muvekkilSlug).toBe('dosya-12345')
    expect(result.plakaSlug).toBeNull()
    expect(runSidecarCommand).toHaveBeenCalledWith({
      command: 'slug',
      params: { text: 'dosya-12345' },
    })
  })

  it('uses dosya-{dosyaNo} fallback when muvekkilAd is empty string', async () => {
    vi.mocked(runSidecarCommand).mockResolvedValueOnce(mockSuccess('dosya-999'))

    const result = await generateSlugs('', '999', null)

    expect(result.muvekkilSlug).toBe('dosya-999')
    expect(result.plakaSlug).toBeNull()
  })

  it('does not call sidecar for plaka when plaka is null', async () => {
    vi.mocked(runSidecarCommand).mockResolvedValueOnce(mockSuccess('muvekkil-slug'))

    const result = await generateSlugs('Muvekkil', '123', null)

    expect(result.plakaSlug).toBeNull()
    expect(runSidecarCommand).toHaveBeenCalledTimes(1)
  })

  it('does not call sidecar for plaka when plaka is empty string', async () => {
    vi.mocked(runSidecarCommand).mockResolvedValueOnce(mockSuccess('muvekkil-slug'))

    const result = await generateSlugs('Muvekkil', '123', '')

    expect(result.plakaSlug).toBeNull()
    expect(runSidecarCommand).toHaveBeenCalledTimes(1)
  })

  it('throws TRPCError when sidecar returns error for muvekkil', async () => {
    vi.mocked(runSidecarCommand).mockResolvedValueOnce(mockError('slug failed'))

    await expect(generateSlugs('Ali', '123', null)).rejects.toThrow(TRPCError)
  })

  it('throws TRPCError when sidecar returns error for plaka', async () => {
    vi.mocked(runSidecarCommand)
      .mockResolvedValueOnce(mockSuccess('ali'))
      .mockResolvedValueOnce(mockError('plaka slug failed'))

    await expect(generateSlugs('Ali', '123', '34 ABC')).rejects.toThrow(TRPCError)
  })
})

describe('filename format', () => {
  it('generates an 8-char hex UUID filename', () => {
    const result = buildArchivePath({ tur: 'STK', muvekkilAd: 'Test', muvekkilPlaka: null })
    expect(result.fileName).toMatch(/^[a-f0-9]{8}\.pdf$/)
  })

  it('each call produces a unique filename', () => {
    const r1 = buildArchivePath({ tur: 'STK', muvekkilAd: 'Test', muvekkilPlaka: null })
    const r2 = buildArchivePath({ tur: 'STK', muvekkilAd: 'Test', muvekkilPlaka: null })
    expect(r1.fileName).not.toBe(r2.fileName)
  })
})
