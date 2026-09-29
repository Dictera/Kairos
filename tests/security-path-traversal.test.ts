import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { NextRequest } from 'next/server'
import { muvekkil, dosya } from '@/lib/schema'
import { BELGELER_BASE, isInsideDir } from '@/lib/belgeler-storage'

vi.mock('@/lib/auth-guard', () => ({
  requireAuth: vi.fn().mockResolvedValue(null),
}))
vi.mock('next/server', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/server')>()),
  connection: vi.fn().mockResolvedValue(undefined),
}))

import { POST as upload } from '@/app/api/upload/route'
import { GET as getFile } from '@/app/api/files/[dosyaId]/[filename]/route'

// A directory next to BELGELER_BASE — anything landing here escaped the base.
const OUTSIDE = fs.mkdtempSync(path.join(os.tmpdir(), 'sigorta-test-outside-'))
let dosyaId: number

beforeAll(async () => {
  const db = globalThis.__testDb!
  const [m] = await db.insert(muvekkil).values({ ad: 'Guvenlik', soyad: 'Test' }).returning()
  const [d] = await db
    .insert(dosya)
    .values({ muvekkil_id: m.id, dosya_no: 'SEC-1', tur: 'STK' })
    .returning()
  dosyaId = d.id
})

afterAll(() => {
  fs.rmSync(OUTSIDE, { recursive: true, force: true })
})

const PDF_BYTES = new Uint8Array([0x25, 0x50, 0x44, 0x46])

function uploadRequest(
  fileName: string,
  extra: Record<string, string> = {},
  content: { bytes: Uint8Array<ArrayBuffer>; type: string } = {
    bytes: PDF_BYTES,
    type: 'application/pdf',
  },
) {
  const fd = new FormData()
  fd.append('file', new File([content.bytes], fileName, { type: content.type }))
  fd.append('dosyaId', String(dosyaId))
  fd.append('dosyaNo', 'SEC-1')
  for (const [k, v] of Object.entries(extra)) fd.append(k, v)
  return new NextRequest('http://localhost/api/upload', { method: 'POST', body: fd })
}

function listFilesRecursive(dir: string): string[] {
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => path.join(e.parentPath, e.name))
}

describe('isInsideDir', () => {
  it('accepts the base and paths beneath it', () => {
    expect(isInsideDir('/base', '/base')).toBe(true)
    expect(isInsideDir('/base', '/base/a/b.pdf')).toBe(true)
    expect(isInsideDir('/base', '/base/..hidden')).toBe(true)
  })
  it('rejects parents, siblings sharing a prefix and traversal', () => {
    expect(isInsideDir('/base', '/')).toBe(false)
    expect(isInsideDir('/base', '/base-evil/x')).toBe(false)
    expect(isInsideDir('/base', '/base/a/../../etc/passwd')).toBe(false)
  })
})

describe('POST /api/upload: path traversal', () => {
  const traversalNames = [
    `../../../../../../../${path.basename(OUTSIDE)}/evil.pdf`,
    '..\\..\\..\\..\\..\\..\\evil.pdf',
    '/etc/evil.pdf',
  ]

  for (const name of traversalNames) {
    it(`keeps "${name}" inside the case folder`, async () => {
      const res = await upload(uploadRequest(name))
      expect(res.status).toBe(200)
      const body = await res.json()

      expect(body.filename).not.toMatch(/[\\/]/)
      expect(body.dosya_adi).not.toMatch(/[\\/]/)
      expect(listFilesRecursive(OUTSIDE)).toEqual([])

      const written = listFilesRecursive(BELGELER_BASE).filter((f) => f.endsWith(body.filename))
      expect(written).toHaveLength(1)
      expect(isInsideDir(BELGELER_BASE, written[0])).toBe(true)
      fs.rmSync(written[0])
    })
  }

  it('still stores ordinary file names', async () => {
    const res = await upload(uploadRequest('Bilirkişi Raporu.pdf'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.filename).toMatch(/^\d+-bilirkişi-raporu\.pdf$/)
    expect(body.dosya_adi).toBe('Bilirkişi Raporu.pdf')
    const written = listFilesRecursive(BELGELER_BASE).filter((f) => f.endsWith(body.filename))
    expect(written).toHaveLength(1)
    fs.rmSync(written[0])
  })
})

describe('POST /api/upload: content validation', () => {
  it('rejects content that does not match the declared type', async () => {
    const html = new TextEncoder().encode('<html><script>alert(1)</script></html>')
    const res = await upload(
      uploadRequest('fatura.pdf', {}, { bytes: html, type: 'application/pdf' }),
    )
    expect(res.status).toBe(400)
  })

  it('stores the file with the extension of its verified type', async () => {
    const res = await upload(uploadRequest('rapor.html', { kategori: 'Dilekçe' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.filename).toMatch(/^\d+-Dilekçe\.pdf$/)
    expect(body.dosya_adi).toBe('Dilekçe.pdf')
    const written = listFilesRecursive(BELGELER_BASE).filter((f) => f.endsWith(body.filename))
    fs.rmSync(written[0])
  })

  it('rejects an oversized declared body before parsing it', async () => {
    const req = uploadRequest('a.pdf')
    req.headers.set('content-length', String(30 * 1024 * 1024))
    const res = await upload(req)
    expect(res.status).toBe(413)
  })
})

describe('GET /api/files/[dosyaId]/[filename]: path traversal', () => {
  const secret = path.join(OUTSIDE, 'secret.txt')

  beforeEach(() => {
    fs.writeFileSync(secret, 'TOP-SECRET')
  })

  function get(dosyaIdParam: string, filename: string) {
    return getFile(new NextRequest('http://localhost/api/files/x/y'), {
      params: Promise.resolve({ dosyaId: dosyaIdParam, filename }),
    })
  }

  it('ignores path segments smuggled through a URL-decoded dosyaId', async () => {
    // "/api/files/1%2F..%2F..%2F<outside>/secret.txt" decodes to this param
    const rel = path.relative(path.join(BELGELER_BASE, '1'), OUTSIDE)
    const res = await get(`1/${rel}`, 'secret.txt')
    expect(res.status).toBe(404)
    expect(await res.text()).not.toContain('TOP-SECRET')
  })

  it('rejects traversal in the filename', async () => {
    const res = await get('1', '../secret.txt')
    expect(res.status).toBe(400)
  })

  it('does not serve directories', async () => {
    fs.mkdirSync(path.join(BELGELER_BASE, '999999', 'klasor'), { recursive: true })
    const res = await get('999999', 'klasor')
    expect(res.status).toBe(404)
    fs.rmSync(path.join(BELGELER_BASE, '999999'), { recursive: true, force: true })
  })

  it('serves a file stored in the flat fallback folder', async () => {
    const dir = path.join(BELGELER_BASE, '999998')
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, 'ok.pdf'), 'PDF')
    const res = await get('999998', 'ok.pdf')
    expect(res.status).toBe(200)
    expect(res.headers.get('content-length')).toBe('3')
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
    expect(await res.text()).toBe('PDF')
    fs.rmSync(dir, { recursive: true, force: true })
  })
})
