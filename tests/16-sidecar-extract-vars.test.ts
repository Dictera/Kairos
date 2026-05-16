import { describe, it, expect } from 'vitest'
import path from 'path'
import { runSidecarCommand } from '@/lib/services/docx-pipeline'

const cleanFixture = path.resolve(process.cwd(), 'tests/fixtures/test-template.docx')
const fragmentedFixture = path.resolve(process.cwd(), 'tests/fixtures/test-template-fragmented.docx')

describe('Sidecar: extract-vars (SABLON-03)', () => {
  it('extracts {{var}} and {%p var%} placeholders, deduped (clean fixture)', async () => {
    const result = await runSidecarCommand({
      command: 'extract-vars',
      params: { file_path: cleanFixture },
    })
    expect(result.status).toBe('success')
    // @ts-expect-error narrow
    expect(result.result.variables).toEqual(['taraf.karsitaraf_ad', 'dosya.dosya_no', 'muvekkil.ad'])
  }, 30_000)

  it('handles Word-fragmented placeholders split across <w:t> nodes (RESEARCH Pitfall #1)', async () => {
    // The fragmented fixture has `{{ muvekkil_ad }}` split into 4 <w:t> siblings
    // inside one <w:r>. A naive XML-tree walker would only see the literal
    // sub-strings `{{`, ` muvekkil_`, `ad `, `}}` separately and silently miss
    // the placeholder. The text-strip+regex implementation MUST recover it.
    const result = await runSidecarCommand({
      command: 'extract-vars',
      params: { file_path: fragmentedFixture },
    })
    expect(result.status).toBe('success')
    // @ts-expect-error narrow
    expect(result.result.variables).toEqual(['muvekkil_ad', 'dosya_no'])
  }, 30_000)

  it('returns code=1 when file_path param is missing', async () => {
    const result = await runSidecarCommand({
      command: 'extract-vars',
      params: {},
    })
    expect(result.status).toBe('error')
    expect(result.code).toBe(1)
  }, 30_000)

  it('returns error when file does not exist', async () => {
    const result = await runSidecarCommand({
      command: 'extract-vars',
      params: { file_path: '/nonexistent/path.docx' },
    })
    expect(result.status).toBe('error')
  }, 30_000)
})
