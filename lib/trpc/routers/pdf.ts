import { createTRPCRouter, protectedProcedure } from '@/lib/trpc/init'
import { TRPCError } from '@trpc/server'
import { db } from '@/lib/db'
import { dosya, docxSablon } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { pdfGenerateSchema } from '@/lib/validators/pdf'
import { runSidecarCommand } from '@/lib/services/docx-pipeline'
import { buildJinja2Context } from '@/lib/docx/context-builder'
import { getMissingVariables } from '@/lib/docx/variable-registry'
import { getLibreOfficePath } from '@/lib/pipeline/config'
import { getTurkishErrorMessage } from '@/lib/pipeline/error-codes'
import { archivePdfAndCreateBelge, generateSlugs } from '@/lib/docx/archive'
import { join } from 'path'
import { tmpdir } from 'os'
import { randomUUID } from 'crypto'
import fs from 'fs'

function tabLabel(tab: string): string {
  const labels: Record<string, string> = {
    genel: 'Genel',
    taraflar: 'Taraflar',
    surec: 'Süreç',
    durusmalar: 'Duruşmalar',
    finans: 'Finans',
    notlar: 'Notlar',
  }
  return labels[tab] ?? tab
}

export const pdfRouter = createTRPCRouter({
  generate: protectedProcedure
    .input(pdfGenerateSchema)
    .mutation(async ({ input }) => {
      // 1. Fetch template
      const [template] = await db
        .select()
        .from(docxSablon)
        .where(eq(docxSablon.id, input.sablonId))
      if (!template) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Şablon bulunamadı.',
        })
      }

      // 2. Fetch case data with ALL relations
      const rows = await db.query.dosya.findFirst({
        where: eq(dosya.id, input.dosyaId),
        with: {
          muvekkil: true,
          taraflar: { with: { sigortaSirketi: true, avukat: true } },
          durusmalar: true,
          sureler: true,
          finans_kalemleri: true,
          notlar: true,
          karsitarafSigorta: true,
          muvekkilSigorta: true,
        },
      })
      if (!rows) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Dosya bulunamadı.',
        })
      }

      // 3. Build Jinja2 context
      const context = buildJinja2Context(rows)

      // 4. Missing variable pre-check
      const templateVars = template.degiskenler as string[]
      const missing = getMissingVariables(templateVars, context)
      if (missing.length > 0) {
        const first = missing[0]
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `${first.label} henüz girilmemiş — ${tabLabel(first.tab)} sekmesinden ekleyin.`,
        })
      }

      // 5. Determine temp output paths
      const tempId = randomUUID()
      const renderedDocxPath = join(tmpdir(), `render-${tempId}.docx`)
      const pdfOutputDir = tmpdir()

      // 6. Call sidecar: render
      const libreofficePath = await getLibreOfficePath()
      if (!libreofficePath) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'LibreOffice bulunamadı.',
        })
      }

      const renderResult = await runSidecarCommand(
        {
          command: 'render',
          params: {
            template_path: template.dosya_yolu,
            output_path: renderedDocxPath,
            context,
          },
        },
        120_000
      )

      if (renderResult.status === 'error') {
        if (fs.existsSync(renderedDocxPath)) fs.unlinkSync(renderedDocxPath)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message:
            renderResult.message ??
            getTurkishErrorMessage(renderResult.code ?? 2),
        })
      }

      // 7. Call sidecar: convert
      const convertResult = await runSidecarCommand(
        {
          command: 'convert',
          params: {
            input_path: renderedDocxPath,
            output_dir: pdfOutputDir,
            libreoffice_path: libreofficePath,
            timeout: 120,
          },
        },
        180_000
      )

      if (convertResult.status === 'error') {
        if (fs.existsSync(renderedDocxPath)) fs.unlinkSync(renderedDocxPath)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message:
            convertResult.message ??
            getTurkishErrorMessage(convertResult.code ?? 3),
        })
      }

      const pdfPath = (convertResult.result as { output_path: string })
        .output_path

      // Clean up rendered DOCX (PDF is handed to Phase 18 for archiving)
      if (fs.existsSync(renderedDocxPath)) fs.unlinkSync(renderedDocxPath)

      const muvekkilAd = rows.muvekkil
        ? `${rows.muvekkil.ad} ${rows.muvekkil.soyad}`.trim()
        : null
      const plaka = rows.muvekkil_plaka || null
      const dosyaNo = rows.dosya_no

      let muvekkilSlug: string
      let plakaSlug: string | null
      try {
        const result = await generateSlugs(muvekkilAd, dosyaNo, plaka)
        muvekkilSlug = result.muvekkilSlug
        plakaSlug = result.plakaSlug
      } catch (e) {
        if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath)
        throw e
      }

      const belgeTuru = template.belge_turu ?? 'Diğer'
      const kategoriSlug = template.kategori.toLowerCase()

      try {
        const archivedBelge = await archivePdfAndCreateBelge(
          pdfPath,
          rows.id,
          dosyaNo,
          template.id,
          template.ad,
          belgeTuru,
          muvekkilSlug,
          plakaSlug,
          kategoriSlug
        )

        return { success: true, belge: archivedBelge }
      } catch (archiveError) {
        if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath)
        throw archiveError
      }
    }),
})