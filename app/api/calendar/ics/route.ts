import { requireAuth } from '@/lib/auth-guard'
import { db } from '@/lib/db'
import { dosya, muvekkil, sure, durusma } from '@/lib/schema'
import { eq, sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

// RFC 5545 iCalendar helpers

/** Fold a single iCal property line at 75 octets (CRLF + space continuation) */
function foldLine(line: string): string {
  const maxLen = 75
  if (line.length <= maxLen) return line
  let result = ''
  let remaining = line
  let first = true
  while (remaining.length > 0) {
    const chunk = first ? remaining.slice(0, maxLen) : remaining.slice(0, maxLen - 1)
    result += (first ? '' : '\r\n ') + chunk
    remaining = first ? remaining.slice(maxLen) : remaining.slice(maxLen - 1)
    first = false
  }
  return result
}

/** Escape special characters in iCal text values (DESCRIPTION, SUMMARY) */
function escapeText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '')
}

/** Format a Date as iCal UTC timestamp: YYYYMMDDTHHMMSSZ */
function formatDtstamp(date: Date): string {
  const y = date.getUTCFullYear()
  const mo = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  const h = String(date.getUTCHours()).padStart(2, '0')
  const mi = String(date.getUTCMinutes()).padStart(2, '0')
  const s = String(date.getUTCSeconds()).padStart(2, '0')
  return `${y}${mo}${d}T${h}${mi}${s}Z`
}

/** Convert YYYY-MM-DD to YYYYMMDD */
function dateToIcal(date: string): string {
  return date.replace(/-/g, '')
}

/** Add one day to a YYYY-MM-DD string for all-day DTEND */
function nextDay(date: string): string {
  const d = new Date(date + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + 1)
  const y = d.getUTCFullYear()
  const mo = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}${mo}${day}`
}

/** Build a VEVENT block from raw values */
function buildVevent(params: {
  uid: string
  summary: string
  dtstart: string
  dtend: string
  dtstamp: string
  description?: string
  location?: string
}): string {
  const lines: string[] = [
    'BEGIN:VEVENT',
    foldLine(`UID:${params.uid}`),
    foldLine(`SUMMARY:${escapeText(params.summary)}`),
    foldLine(`DTSTART${params.dtstart}`),
    foldLine(`DTEND${params.dtend}`),
    foldLine(`DTSTAMP:${params.dtstamp}`),
  ]
  if (params.description) {
    lines.push(foldLine(`DESCRIPTION:${escapeText(params.description)}`))
  }
  if (params.location) {
    lines.push(foldLine(`LOCATION:${escapeText(params.location)}`))
  }
  lines.push('END:VEVENT')
  return lines.join('\r\n')
}

export async function GET(): Promise<Response> {
  const authError = await requireAuth()
  if (authError) return authError

  const now = new Date()
  const dtstamp = formatDtstamp(now)

  // Fetch all duruşma rows with dosya + muvekkil
  const durusmaRows = await db
    .select({
      id: durusma.id,
      tarih: durusma.tarih,
      saat: durusma.saat,
      mahkeme_kurum: durusma.mahkeme_kurum,
      tur: durusma.tur,
      notlar: durusma.notlar,
      dosya_no: dosya.dosya_no,
      muvekkil_ad: sql<string>`${muvekkil.ad} || ' ' || ${muvekkil.soyad}`,
    })
    .from(durusma)
    .innerJoin(dosya, eq(durusma.dosya_id, dosya.id))
    .innerJoin(muvekkil, eq(dosya.muvekkil_id, muvekkil.id))
    .orderBy(durusma.tarih)

  // Fetch all süre rows with dosya + muvekkil
  const sureRows = await db
    .select({
      id: sure.id,
      son_tarih: sure.son_tarih,
      ad: sure.ad,
      notlar: sure.notlar,
      dosya_no: dosya.dosya_no,
      muvekkil_ad: sql<string>`${muvekkil.ad} || ' ' || ${muvekkil.soyad}`,
    })
    .from(sure)
    .innerJoin(dosya, eq(sure.dosya_id, dosya.id))
    .innerJoin(muvekkil, eq(dosya.muvekkil_id, muvekkil.id))
    .orderBy(sure.son_tarih)

  const vevents: string[] = []

  // Build VEVENT for each duruşma
  for (const row of durusmaRows) {
    const eventLabel = row.tur ?? row.mahkeme_kurum ?? 'Duruşma'
    const summary = `[${row.dosya_no}] ${row.muvekkil_ad} — ${eventLabel}`

    let dtstart: string
    let dtend: string

    if (row.saat) {
      // Timed event: TZID=Europe/Istanbul
      const timePart = row.saat.replace(':', '') + '00' // HHmm -> HHmmss
      dtstart = `;TZID=Europe/Istanbul:${dateToIcal(row.tarih)}T${timePart}`
      // DTEND = DTSTART + 1 hour
      const [hh, mm] = row.saat.split(':').map(Number)
      const endHh = String((hh + 1) % 24).padStart(2, '0')
      const endMm = String(mm).padStart(2, '0')
      dtend = `;TZID=Europe/Istanbul:${dateToIcal(row.tarih)}T${endHh}${endMm}00`
    } else {
      // All-day event
      dtstart = `;VALUE=DATE:${dateToIcal(row.tarih)}`
      dtend = `;VALUE=DATE:${nextDay(row.tarih)}`
    }

    const descParts: string[] = []
    if (row.notlar) descParts.push(row.notlar)
    descParts.push(`Dosya: ${row.dosya_no}`)
    const description = descParts.join('\n')

    vevents.push(
      buildVevent({
        uid: `durusma-${row.id}@sigorta-takip`,
        summary,
        dtstart,
        dtend,
        dtstamp,
        description,
        location: row.mahkeme_kurum ?? undefined,
      })
    )
  }

  // Build VEVENT for each süre
  for (const row of sureRows) {
    const summary = `[${row.dosya_no}] ${row.muvekkil_ad} — ${row.ad}`
    const dtstart = `;VALUE=DATE:${dateToIcal(row.son_tarih)}`
    const dtend = `;VALUE=DATE:${nextDay(row.son_tarih)}`

    const descParts: string[] = []
    if (row.notlar) descParts.push(row.notlar)
    descParts.push(`Dosya: ${row.dosya_no}`)
    const description = descParts.join('\n')

    vevents.push(
      buildVevent({
        uid: `sure-${row.id}@sigorta-takip`,
        summary,
        dtstart,
        dtend,
        dtstamp,
        description,
      })
    )
  }

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Sigorta Takip//TR',
    'CALSCALE:GREGORIAN',
    'X-WR-CALNAME:Sigorta Takvimi',
    'X-WR-TIMEZONE:Europe/Istanbul',
    ...vevents,
    'END:VCALENDAR',
  ].join('\r\n') + '\r\n'

  return new Response(icsContent, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="sigorta-takvimi.ics"',
    },
  })
}
