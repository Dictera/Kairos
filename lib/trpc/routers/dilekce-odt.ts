import { createTRPCRouter, protectedProcedure } from '@/lib/trpc/init'
import { db } from '@/lib/db'
import { dilekceOdtSablonu } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'
import { z } from 'zod'
import fs from 'fs'
import path from 'path'
import { extractVariablesFromOdt } from '@/lib/services/odt-to-pdf'

const odtKategoriEnum = z.enum(['STK', 'Mahkeme', 'Genel'])

export const dilekceOdtRouter = createTRPCRouter({
  list: protectedProcedure.query(async () => {
    return db.select().from(dilekceOdtSablonu).orderBy(desc(dilekceOdtSablonu.updated_at))
  }),

  byId: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const row = await db.select().from(dilekceOdtSablonu).where(eq(dilekceOdtSablonu.id, input.id))
      if (!row[0]) {
        throw new Error('Şablon bulunamadı.')
      }
      return row[0]
    }),

  upload: protectedProcedure
    .input(z.object({
      baslik: z.string().min(1).max(200),
      kategori: odtKategoriEnum,
      dosyaAdi: z.string(),
      dosyaData: z.string(), // base64 encoded .odt file
      customVariables: z.array(z.string()).default([]), // user-defined custom variables
    }))
    .mutation(async ({ input }) => {
      const uploadsDir = path.join(process.cwd(), 'uploads', 'odt-templates')
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true })
      }
      
      const fileName = `${Date.now()}_${input.dosyaAdi.replace(/[^a-zA-Z0-9._-]/g, '_')}`
      const filePath = path.join(uploadsDir, fileName)
      
      const buffer = Buffer.from(input.dosyaData, 'base64')
      fs.writeFileSync(filePath, buffer)
      
      let extractedVars: string[] = []
      try {
        extractedVars = await extractVariablesFromOdt(filePath)
      } catch (e) {
        console.error('Failed to extract variables from ODT:', e)
      }
      
      const allVariables = [...new Set([...extractedVars, ...input.customVariables])]
      
      const [row] = await db.insert(dilekceOdtSablonu).values({
        baslik: input.baslik,
        kategori: input.kategori,
        dosya_adi: input.dosyaAdi,
        dosya_yolu: filePath,
        degiskenler: JSON.stringify(allVariables),
      }).returning()
      
      return row
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const [template] = await db.select().from(dilekceOdtSablonu).where(eq(dilekceOdtSablonu.id, input.id))
      
      if (template && fs.existsSync(template.dosya_yolu)) {
        fs.unlinkSync(template.dosya_yolu)
      }
      
      await db.delete(dilekceOdtSablonu).where(eq(dilekceOdtSablonu.id, input.id))
      return { success: true }
    }),
})
