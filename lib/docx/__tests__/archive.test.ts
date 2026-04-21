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
import { TRPCError } from '@trpc/server'

vi.mock('@/lib/services/docx-pipeline', () => ({
  runSidecarCommand: vi.fn(),
}))

import { runSidecarCommand } from '@/lib/services/docx-pipeline'

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
    const target = path.join(ARCHIVE_BASE, '2026', '04', 'stk', 'test.pdf')
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
  it('returns dir ending in YYYY/AA/kategori-slug with plaka', () => {
    const date = new Date(2026, 3, 15) // April
    const result = buildArchivePath(date, 'stk', 'ali-veli', '34-abc-123', 5)

    expect(result.dir).toBe(path.join(ARCHIVE_BASE, '2026', '04', 'stk'))
    expect(result.fileName).toBe('ali-veli-34-abc-123-5.pdf')
    expect(result.filePath).toBe(path.join(ARCHIVE_BASE, '2026', '04', 'stk', 'ali-veli-34-abc-123-5.pdf'))
    expect(result.relativePath).toMatch(/uploads\/sablon-pdf\/2026\/04\/stk\/ali-veli-34-abc-123-5\.pdf$/)
  })

  it('returns filename with only muvekkil slug when plaka is null', () => {
    const date = new Date(2026, 3, 15)
    const result = buildArchivePath(date, 'stk', 'mehmet-can', null, 1)

    expect(result.fileName).toBe('mehmet-can-1.pdf')
    expect(result.fileName).not.toContain('--')
  })

  it('appends -belge suffix for reserved Windows names', () => {
    const date = new Date(2026, 3, 15)
    const result = buildArchivePath(date, 'stk', 'CON', null, 1)

    expect(result.fileName).toBe('CON-belge-1.pdf')
  })

  it('appends -belge suffix for reserved Windows names with plaka', () => {
    const date = new Date(2026, 3, 15)
    const result = buildArchivePath(date, 'stk', 'COM1', 'LPT1', 2)

    // Combined base "COM1-LPT1" does not match reserved name regex,
    // so no suffix is appended (per spec: final base must exact-match)
    expect(result.fileName).toBe('COM1-LPT1-2.pdf')
  })

  it('throws TRPCError for path traversal via kategoriSlug', () => {
    const date = new Date(2026, 3, 15)
    // ../../../etc from ARCHIVE_BASE/2026/04 goes up past ARCHIVE_BASE
    expect(() => buildArchivePath(date, '../../../etc', 'muvekkil', null, 1)).toThrow(TRPCError)
  })

  it('throws TRPCError for path traversal via muvekkilSlug', () => {
    const date = new Date(2026, 3, 15)
    // ../../../../etc in filename normalizes past ARCHIVE_BASE
    expect(() => buildArchivePath(date, 'stk', '../../../../etc', null, 1)).toThrow(TRPCError)
  })

  it('throws TRPCError for path traversal via plakaSlug', () => {
    const date = new Date(2026, 3, 15)
    expect(() => buildArchivePath(date, 'stk', 'muvekkil', '../../../../etc', 1)).toThrow(TRPCError)
  })

  it('produces relativePath with forward slashes', () => {
    const date = new Date(2026, 3, 15)
    const result = buildArchivePath(date, 'stk', 'muvekkil', null, 1)

    expect(result.relativePath).not.toContain('\\')
    expect(result.relativePath).toMatch(/uploads\/sablon-pdf\/2026\/04\/stk\/muvekkil-1\.pdf$/)
  })
})

describe('generateSlugs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns correct slugs when sidecar responds with success', async () => {
    vi.mocked(runSidecarCommand)
      .mockResolvedValueOnce({ status: 'success', result: 'ali-veli', exitCode: 0 })
      .mockResolvedValueOnce({ status: 'success', result: '34-abc-123', exitCode: 0 })

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
    vi.mocked(runSidecarCommand)
      .mockResolvedValueOnce({ status: 'success', result: 'dosya-12345', exitCode: 0 })

    const result = await generateSlugs(null, '12345', null)

    expect(result.muvekkilSlug).toBe('dosya-12345')
    expect(result.plakaSlug).toBeNull()
    expect(runSidecarCommand).toHaveBeenCalledWith({
      command: 'slug',
      params: { text: 'dosya-12345' },
    })
  })

  it('uses dosya-{dosyaNo} fallback when muvekkilAd is empty string', async () => {
    vi.mocked(runSidecarCommand)
      .mockResolvedValueOnce({ status: 'success', result: 'dosya-999', exitCode: 0 })

    const result = await generateSlugs('', '999', null)

    expect(result.muvekkilSlug).toBe('dosya-999')
    expect(result.plakaSlug).toBeNull()
  })

  it('does not call sidecar for plaka when plaka is null', async () => {
    vi.mocked(runSidecarCommand)
      .mockResolvedValueOnce({ status: 'success', result: 'muvekkil-slug', exitCode: 0 })

    const result = await generateSlugs('Muvekkil', '123', null)

    expect(result.plakaSlug).toBeNull()
    expect(runSidecarCommand).toHaveBeenCalledTimes(1)
  })

  it('does not call sidecar for plaka when plaka is empty string', async () => {
    vi.mocked(runSidecarCommand)
      .mockResolvedValueOnce({ status: 'success', result: 'muvekkil-slug', exitCode: 0 })

    const result = await generateSlugs('Muvekkil', '123', '')

    expect(result.plakaSlug).toBeNull()
    expect(runSidecarCommand).toHaveBeenCalledTimes(1)
  })

  it('throws TRPCError when sidecar returns error for muvekkil', async () => {
    vi.mocked(runSidecarCommand).mockResolvedValueOnce({
      status: 'error',
      message: 'slug failed',
      exitCode: 1,
    })

    await expect(generateSlugs('Ali', '123', null)).rejects.toThrow(TRPCError)
  })

  it('throws TRPCError when sidecar returns error for plaka', async () => {
    vi.mocked(runSidecarCommand)
      .mockResolvedValueOnce({ status: 'success', result: 'ali', exitCode: 0 })
      .mockResolvedValueOnce({ status: 'error', message: 'plaka slug failed', exitCode: 1 })

    await expect(generateSlugs('Ali', '123', '34 ABC')).rejects.toThrow(TRPCError)
  })
})

describe('filename format', () => {
  it('matches {slug}-{seq}.pdf without plaka', () => {
    const date = new Date(2026, 3, 15)
    const result = buildArchivePath(date, 'stk', 'mehmet-can', null, 7)

    expect(result.fileName).toMatch(/^mehmet-can-7\.pdf$/)
  })

  it('matches {slug}-{slug}-{seq}.pdf with plaka', () => {
    const date = new Date(2026, 3, 15)
    const result = buildArchivePath(date, 'stk', 'mehmet-can', '34-abc', 7)

    expect(result.fileName).toMatch(/^mehmet-can-34-abc-7\.pdf$/)
  })

  it('does not contain double dashes', () => {
    const date = new Date(2026, 3, 15)
    const result1 = buildArchivePath(date, 'stk', 'mehmet', null, 1)
    expect(result1.fileName).not.toContain('--')

    const result2 = buildArchivePath(date, 'stk', 'mehmet', '34-abc', 1)
    expect(result2.fileName).not.toContain('--')
  })
})
