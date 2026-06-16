import { NextResponse } from 'next/server'

// Hafif sağlık ucu: güncelleme sonrası sunucunun ayağa kalktığını yoklamak için.
export const dynamic = 'force-dynamic'

export function GET() {
  return NextResponse.json({ ok: true })
}
