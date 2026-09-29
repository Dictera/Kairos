import fs from 'fs'
import { Readable } from 'stream'

// Shared helpers for the upload / download route handlers.

/** Multipart framing overhead allowed on top of the file-size cap. */
const MULTIPART_OVERHEAD = 64 * 1024

/**
 * True when the declared Content-Length already exceeds `maxFileSize` (plus
 * multipart overhead). Lets a route reject an oversized upload before
 * `request.formData()` buffers the whole body in memory.
 */
export function declaredBodyTooLarge(request: Request, maxFileSize: number): boolean {
  const raw = request.headers.get('content-length')
  if (!raw) return false
  const length = Number(raw)
  return Number.isFinite(length) && length > maxFileSize + MULTIPART_OVERHEAD
}

/** Reads the multipart body; null when it is malformed or truncated. */
export async function readFormData(request: Request): Promise<FormData | null> {
  try {
    return await request.formData()
  } catch {
    return null
  }
}

const OLE_SIGNATURE = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]
const ZIP_SIGNATURE = [0x50, 0x4b, 0x03, 0x04]

const SIGNATURES: Record<string, number[]> = {
  'application/pdf': [0x25, 0x50, 0x44, 0x46], // %PDF
  'application/msword': OLE_SIGNATURE,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ZIP_SIGNATURE,
  'image/jpeg': [0xff, 0xd8, 0xff],
  'image/png': [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
}

/** Canonical extension for each accepted MIME type. */
export const EXTENSION_FOR_MIME: Record<string, string> = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'image/jpeg': '.jpg',
  'image/png': '.png',
}

export const MIME_FOR_EXTENSION: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
}

/**
 * True when the file content starts with the magic bytes of `mimeType`.
 * The browser-supplied `File.type` is only a claim derived from the name.
 */
export function matchesSignature(bytes: Uint8Array, mimeType: string): boolean {
  const signature = SIGNATURES[mimeType]
  if (!signature || bytes.length < signature.length) return false
  return signature.every((b, i) => bytes[i] === b)
}

/** RFC 6266 Content-Disposition with an ASCII fallback and a UTF-8 `filename*`. */
export function contentDisposition(type: 'inline' | 'attachment', filename: string): string {
  const fallback = filename.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_')
  return `${type}; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`
}

/**
 * Streams a file from disk instead of reading it fully into memory.
 * `size` should come from the caller's `stat` so Content-Length is exact.
 */
export function fileResponse(
  filePath: string,
  opts: { size: number; contentType: string; filename: string },
): Response {
  const stream = Readable.toWeb(fs.createReadStream(filePath)) as ReadableStream<Uint8Array>
  return new Response(stream, {
    headers: {
      'Content-Type': opts.contentType,
      'Content-Length': String(opts.size),
      'Content-Disposition': contentDisposition('inline', opts.filename),
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, no-store',
    },
  })
}

/** stat() that returns null instead of throwing for a missing path. */
export async function statFile(filePath: string): Promise<fs.Stats | null> {
  try {
    const stat = await fs.promises.stat(filePath)
    return stat.isFile() ? stat : null
  } catch {
    return null
  }
}
