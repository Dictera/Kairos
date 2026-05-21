import { createTRPCRouter, protectedProcedure } from '@/lib/trpc/init'
import { TRPCError } from '@trpc/server'
import { db } from '@/lib/db'
import { sigortaSirketi, mahkeme, sigortaTuru, avukat, avukatSigortaSirketi, dosya, taraf } from '@/lib/schema'
import { eq, asc, and, sql } from 'drizzle-orm'
import { z } from 'zod'
import { sigortaSirketiSchema, avukatSchema } from '@/lib/validators/ayarlar'
import os from 'os'
import path from 'path'
import fs from 'fs'

const SETTINGS_PATH = path.join(process.cwd(), 'data', 'settings.json')

function readSettings() {
  try {
    const raw = fs.readFileSync(SETTINGS_PATH, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function writeSettings(data: Record<string, unknown>) {
  fs.mkdirSync(path.dirname(SETTINGS_PATH), { recursive: true })
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(data, null, 2), 'utf-8')
}

// Re-export schemas so existing test imports continue to work
export { sigortaSirketiSchema, avukatSchema }

const adSchema = z.object({ ad: z.string().min(1, 'Ad zorunludur').max(200) })

// Mahkeme keeps its own schema (ad + sehir)
const mahkemeSchema = z.object({
  ad: z.string().min(1, 'Ad zorunludur').max(200),
  sehir: z.string().max(100).optional().or(z.literal('')),
})

// ── Generic CRUD helper (now narrowed to mahkeme | sigortaTuru only) ───────

function makeCrudRouter(
  table: typeof mahkeme | typeof sigortaTuru,
  entityName: string
) {
  return createTRPCRouter({
    list: protectedProcedure.query(async () => {
      return db.select().from(table).orderBy(asc(table.ad))
    }),
    create: protectedProcedure.input(adSchema).mutation(async ({ input }) => {
      const [row] = await db.insert(table).values(input).returning()
      return row
    }),
    update: protectedProcedure
      .input(adSchema.extend({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input
        const [row] = await db.update(table).set(data).where(eq(table.id, id)).returning()
        if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: `${entityName} bulunamadı.` })
        return row
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        await db.delete(table).where(eq(table.id, input.id))
        return { success: true }
      }),
  })
}

// ── Router ──────────────────────────────────────────────────────────────────

export const ayarlarRouter = createTRPCRouter({
  sigortaSirketi: createTRPCRouter({
    list: protectedProcedure.query(async () => {
      return db.select().from(sigortaSirketi).orderBy(asc(sigortaSirketi.ad))
    }),
    listWithAvukatlar: protectedProcedure.query(async () => {
      return db.query.sigortaSirketi.findMany({
        with: { avukatlar: { with: { avukat: true } } },
        orderBy: asc(sigortaSirketi.ad),
      })
    }),
    create: protectedProcedure.input(sigortaSirketiSchema).mutation(async ({ input }) => {
      const [row] = await db.insert(sigortaSirketi).values(input).returning()
      return row
    }),
    update: protectedProcedure
      .input(sigortaSirketiSchema.extend({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input
        const [row] = await db.update(sigortaSirketi).set(data).where(eq(sigortaSirketi.id, id)).returning()
        if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'Sigorta şirketi bulunamadı.' })
        return row
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        await db.update(dosya).set({ karsitaraf_sigorta_id: null }).where(eq(dosya.karsitaraf_sigorta_id, input.id))
        await db.update(taraf).set({ sigorta_sirketi_id: null }).where(eq(taraf.sigorta_sirketi_id, input.id))
        await db.delete(sigortaSirketi).where(eq(sigortaSirketi.id, input.id))
        return { success: true }
      }),
  }),

  sigortaTuru: makeCrudRouter(sigortaTuru, 'Sigorta türü'),

  mahkeme: createTRPCRouter({
    list: protectedProcedure.query(async () =>
      db.select().from(mahkeme).orderBy(asc(mahkeme.ad))
    ),
    create: protectedProcedure.input(mahkemeSchema).mutation(async ({ input }) => {
      const [row] = await db.insert(mahkeme).values(input).returning()
      return row
    }),
    update: protectedProcedure
      .input(mahkemeSchema.extend({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input
        const [row] = await db.update(mahkeme).set(data).where(eq(mahkeme.id, id)).returning()
        if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'Mahkeme bulunamadı.' })
        return row
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        await db.delete(mahkeme).where(eq(mahkeme.id, input.id))
        return { success: true }
      }),
  }),

  avukat: createTRPCRouter({
    list: protectedProcedure.query(async () => {
      return db.select().from(avukat).orderBy(asc(avukat.ad))
    }),
    bySirket: protectedProcedure
      .input(z.object({ sigorta_sirketi_id: z.number().int() }))
      .query(async ({ input }) => {
        return db.select({
          id: avukat.id,
          ad: avukat.ad,
          tbb_sicil_no: avukat.tbb_sicil_no,
        })
          .from(avukatSigortaSirketi)
          .innerJoin(avukat, eq(avukatSigortaSirketi.avukat_id, avukat.id))
          .where(eq(avukatSigortaSirketi.sigorta_sirketi_id, input.sigorta_sirketi_id))
          .orderBy(asc(avukat.ad))
      }),
    create: protectedProcedure.input(avukatSchema).mutation(async ({ input }) => {
      const [row] = await db.insert(avukat).values(input).returning()
      return row
    }),
    update: protectedProcedure
      .input(avukatSchema.extend({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input
        const [row] = await db.update(avukat)
          .set({ ...data, updated_at: sql`(datetime('now'))` })
          .where(eq(avukat.id, id))
          .returning()
        if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'Avukat bulunamadı.' })
        return row
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        await db.delete(avukat).where(eq(avukat.id, input.id))
        return { success: true }
      }),
    addSirket: protectedProcedure
      .input(z.object({ avukat_id: z.number().int(), sigorta_sirketi_id: z.number().int() }))
      .mutation(async ({ input }) => {
        await db.insert(avukatSigortaSirketi).values(input).onConflictDoNothing()
        return { success: true }
      }),
    removeSirket: protectedProcedure
      .input(z.object({ avukat_id: z.number().int(), sigorta_sirketi_id: z.number().int() }))
      .mutation(async ({ input }) => {
        await db.delete(avukatSigortaSirketi).where(
          and(
            eq(avukatSigortaSirketi.avukat_id, input.avukat_id),
            eq(avukatSigortaSirketi.sigorta_sirketi_id, input.sigorta_sirketi_id),
          )
        )
        return { success: true }
      }),
  }),

  takvim: createTRPCRouter({
    getExportGoster: protectedProcedure.query(() => {
      const settings = readSettings()
      const goster: boolean = settings.takvimExportGoster !== undefined ? Boolean(settings.takvimExportGoster) : true
      return { goster }
    }),
    setExportGoster: protectedProcedure
      .input(z.object({ value: z.boolean() }))
      .mutation(({ input }) => {
        const settings = readSettings()
        settings.takvimExportGoster = input.value
        writeSettings(settings)
        return { success: true }
      }),
  }),

  getChangelog: protectedProcedure.query(() => {
    const changelogPath = path.join(process.cwd(), 'CHANGELOG.md')
    try {
      return { content: fs.readFileSync(changelogPath, 'utf-8') }
    } catch {
      return { content: '' }
    }
  }),

  belgeler: createTRPCRouter({
    getPath: protectedProcedure.query(() => {
      const settings = readSettings()
      return { path: settings.belgelerPath ?? path.join(os.homedir(), 'sigorta-belgeler').replace(/\\/g, '/') }
    }),
    setPath: protectedProcedure
      .input(z.object({ path: z.string().min(1, 'Yol zorunludur') }))
      .mutation(({ input }) => {
        const resolved = path.resolve(input.path)
        const dataDir = path.resolve(process.cwd(), 'data')
        if (resolved === dataDir || resolved.startsWith(dataDir + path.sep)) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Geçersiz yol.' })
        }
        const normalized = resolved.replace(/\\/g, '/')
        const settings = readSettings()
        settings.belgelerPath = normalized
        writeSettings(settings)
        return { success: true, path: normalized }
      }),
    pickFolder: protectedProcedure.mutation(async () => {
      const { spawn } = await import('child_process')

      return new Promise<{ path: string | null }>((resolve) => {
        let cmd: string
        let args: string[]

        if (process.platform === 'win32') {
          const script = [
            'Add-Type -AssemblyName System.Windows.Forms',
            '$d = New-Object System.Windows.Forms.FolderBrowserDialog',
            '$d.Description = "Belgeler klasorunu secin"',
            '$d.ShowNewFolderButton = $true',
            'if ($d.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { Write-Output $d.SelectedPath }',
          ].join('; ')
          cmd = 'powershell'
          args = ['-NoProfile', '-NonInteractive', '-Command', script]
        } else if (process.platform === 'darwin') {
          cmd = 'osascript'
          args = ['-e', 'POSIX path of (choose folder with prompt "Belgeler klasorunu secin")']
        } else {
          // Linux: try zenity, fall back to kdialog, fall back to null
          cmd = 'zenity'
          args = ['--file-selection', '--directory', '--title=Belgeler klasorunu secin']
        }

        const proc = spawn(cmd, args, { windowsHide: false })
        let output = ''
        proc.stdout.on('data', (data: Buffer) => { output += data.toString() })
        proc.on('close', () => {
          const picked = output.trim()
          resolve({ path: picked ? picked.replace(/\\/g, '/').replace(/\n$/, '') : null })
        })
        proc.on('error', () => {
          if (process.platform === 'linux') {
            // zenity not found, try kdialog
            const kd = spawn('kdialog', ['--getexistingdirectory', os.homedir()])
            let kdOut = ''
            kd.stdout.on('data', (d: Buffer) => { kdOut += d.toString() })
            kd.on('close', () => resolve({ path: kdOut.trim() || null }))
            kd.on('error', () => resolve({ path: null }))
          } else {
            resolve({ path: null })
          }
        })
        setTimeout(() => { proc.kill(); resolve({ path: null }) }, 300000)
      })
    }),
  }),
})