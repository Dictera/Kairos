import { describe, it, expect } from 'vitest'
import { db } from '@/lib/db'
import { sigortaSirketi, avukat, avukatSigortaSirketi, taraf, dosya, muvekkil } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'

describe('Phase 14 — avukat ↔ sigorta_sirketi many-to-many', () => {
  it('Test 1: db.query findMany with nested relations returns joined rows', async () => {
    const [s] = await db.insert(sigortaSirketi).values({ ad: 'TestSirket-' + Date.now(), vergi_no: '1234567890' }).returning()
    const [a1] = await db.insert(avukat).values({ ad: 'Av.A-' + Date.now(), tbb_sicil_no: 'T1' }).returning()
    const [a2] = await db.insert(avukat).values({ ad: 'Av.B-' + Date.now(), tbb_sicil_no: 'T2' }).returning()
    await db.insert(avukatSigortaSirketi).values([
      { avukat_id: a1.id, sigorta_sirketi_id: s.id },
      { avukat_id: a2.id, sigorta_sirketi_id: s.id },
    ])
    const rows = await db.query.sigortaSirketi.findMany({
      where: eq(sigortaSirketi.id, s.id),
      with: { avukatlar: { with: { avukat: true } } },
    })
    expect(rows.length).toBe(1)
    expect(rows[0].avukatlar.length).toBe(2)
    expect(rows[0].avukatlar[0].avukat).toBeTruthy()
    // cleanup
    await db.delete(sigortaSirketi).where(eq(sigortaSirketi.id, s.id))
    await db.delete(avukat).where(eq(avukat.id, a1.id))
    await db.delete(avukat).where(eq(avukat.id, a2.id))
  })

  it('Test 2: deleting sigortaSirketi cascades the join row, avukat survives', async () => {
    const [s] = await db.insert(sigortaSirketi).values({ ad: 'CascadeS-' + Date.now(), vergi_no: '1234567890' }).returning()
    const [a] = await db.insert(avukat).values({ ad: 'CascadeA-' + Date.now(), tbb_sicil_no: 'C1' }).returning()
    await db.insert(avukatSigortaSirketi).values({ avukat_id: a.id, sigorta_sirketi_id: s.id })
    await db.delete(sigortaSirketi).where(eq(sigortaSirketi.id, s.id))
    const joins = await db.select().from(avukatSigortaSirketi).where(eq(avukatSigortaSirketi.avukat_id, a.id))
    const avs = await db.select().from(avukat).where(eq(avukat.id, a.id))
    expect(joins.length).toBe(0)
    expect(avs.length).toBe(1)
    await db.delete(avukat).where(eq(avukat.id, a.id))
  })

  it('Test 3: deleting avukat cascades the join row, sirketi survives', async () => {
    const [s] = await db.insert(sigortaSirketi).values({ ad: 'CascadeS2-' + Date.now(), vergi_no: '1234567890' }).returning()
    const [a] = await db.insert(avukat).values({ ad: 'CascadeA2-' + Date.now(), tbb_sicil_no: 'C2' }).returning()
    await db.insert(avukatSigortaSirketi).values({ avukat_id: a.id, sigorta_sirketi_id: s.id })
    await db.delete(avukat).where(eq(avukat.id, a.id))
    const joins = await db.select().from(avukatSigortaSirketi).where(eq(avukatSigortaSirketi.sigorta_sirketi_id, s.id))
    const ss = await db.select().from(sigortaSirketi).where(eq(sigortaSirketi.id, s.id))
    expect(joins.length).toBe(0)
    expect(ss.length).toBe(1)
    await db.delete(sigortaSirketi).where(eq(sigortaSirketi.id, s.id))
  })

  it('Test 4: deleting avukat sets taraf.avukat_id to NULL (not cascade)', async () => {
    // Need a valid muvekkil + dosya FK chain
    const [m] = await db.insert(muvekkil).values({ ad: 'MTest', soyad: 'Test' }).returning()
    const [d] = await db.insert(dosya).values({ dosya_no: 'DOSYA-T-' + Date.now(), muvekkil_id: m.id, tur: 'STK' }).returning()
    const [a] = await db.insert(avukat).values({ ad: 'AvSetNull-' + Date.now(), tbb_sicil_no: 'SN1' }).returning()
    const [t] = await db.insert(taraf).values({ dosya_id: d.id, avukat_id: a.id }).returning()
    await db.delete(avukat).where(eq(avukat.id, a.id))
    const tRows = await db.select().from(taraf).where(eq(taraf.id, t.id))
    expect(tRows.length).toBe(1)
    expect(tRows[0].avukat_id).toBeNull()
    // cleanup (dosya cascades taraf)
    await db.delete(dosya).where(eq(dosya.id, d.id))
    await db.delete(muvekkil).where(eq(muvekkil.id, m.id))
  })

  it('Test 5: onConflictDoNothing prevents duplicate join rows', async () => {
    const [s] = await db.insert(sigortaSirketi).values({ ad: 'DupSirket-' + Date.now(), vergi_no: '1234567890' }).returning()
    const [a] = await db.insert(avukat).values({ ad: 'DupAvukat-' + Date.now(), tbb_sicil_no: 'D1' }).returning()
    await db.insert(avukatSigortaSirketi).values({ avukat_id: a.id, sigorta_sirketi_id: s.id })
    await db.insert(avukatSigortaSirketi).values({ avukat_id: a.id, sigorta_sirketi_id: s.id }).onConflictDoNothing()
    const joins = await db.select().from(avukatSigortaSirketi).where(
      and(eq(avukatSigortaSirketi.avukat_id, a.id), eq(avukatSigortaSirketi.sigorta_sirketi_id, s.id))
    )
    expect(joins.length).toBe(1)
    await db.delete(sigortaSirketi).where(eq(sigortaSirketi.id, s.id))
    await db.delete(avukat).where(eq(avukat.id, a.id))
  })
})