import { describe, it, expect, afterAll, vi } from 'vitest'
import { readFileSync, rmSync, existsSync, readdirSync } from 'fs'
import path from 'path'

vi.mock('@/lib/auth-guard', () => ({
  requireAuth: vi.fn().mockResolvedValue(null),
}))

import { POST } from '@/app/api/templates/upload/route'

const ROUTE_PATH = 'app/api/templates/upload/route.ts'
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'templates')

function makeRequest(formData: FormData): Request {
  return new Request('http://localhost/api/templates/upload', {
    method: 'POST',
    body: formData,
  })
}

afterAll(() => {
  // Clean up only test-created files (those starting with our timestamp prefix from these tests).
  if (existsSync(UPLOAD_DIR)) {
    for (const f of readdirSync(UPLOAD_DIR)) {
      if (f.includes('_test-upload-')) {
        try { rmSync(path.join(UPLOAD_DIR, f)) } catch {}
      }
    }
  }
})

describe('Upload route source: SABLON-01 constants', () => {
  it('declares .docx as the only allowed extension', () => {
    const src = readFileSync(ROUTE_PATH, 'utf-8')
    expect(src).toContain("'.docx'")
  })
  it('declares 10 MB size cap', () => {
    const src = readFileSync(ROUTE_PATH, 'utf-8')
    expect(src).toContain('10 * 1024 * 1024')
  })
  it('uses uploads/templates as upload directory', () => {
    const src = readFileSync(ROUTE_PATH, 'utf-8')
    expect(src).toMatch(/uploads['"\s,]+['"\s,]*templates/)
  })
  it('contains path-traversal guard', () => {
    const src = readFileSync(ROUTE_PATH, 'utf-8')
    expect(src).toMatch(/path\.resolve\([^)]+\)\.startsWith/)
  })
})

describe('Upload route behavior: SABLON-01 validation', () => {
  it('returns 400 when no file', async () => {
    const fd = new FormData()
    const res = await POST(makeRequest(fd) as unknown as Parameters<typeof POST>[0])
    expect(res.status).toBe(400)
  })

  it('rejects .pdf with Turkish error', async () => {
    const fd = new FormData()
    fd.append('file', new File([new Uint8Array([0x25, 0x50, 0x44, 0x46])], 'test-upload-doc.pdf', { type: 'application/pdf' }))
    const res = await POST(makeRequest(fd) as unknown as Parameters<typeof POST>[0])
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/\.docx/)
  })

  it('accepts a small .docx and writes to uploads/templates/', async () => {
    // Build a minimal valid docx-like file (zip with word/document.xml).
    const docxBytes = readFileSync(path.join(process.cwd(), 'tests/fixtures/test-template.docx'))
    const fd = new FormData()
    fd.append('file', new File([docxBytes], 'test-upload-tiny.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    }))
    const res = await POST(makeRequest(fd) as unknown as Parameters<typeof POST>[0])
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.filename).toBeDefined()
    expect(body.fileName).toBe('test-upload-tiny.docx')
    expect(existsSync(path.join(UPLOAD_DIR, body.filename))).toBe(true)
  })

  it('rejects file larger than 10 MB', async () => {
    const big = new Uint8Array(11 * 1024 * 1024)
    const fd = new FormData()
    fd.append('file', new File([big], 'test-upload-big.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    }))
    const res = await POST(makeRequest(fd) as unknown as Parameters<typeof POST>[0])
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/10 MB/)
  })
})
