import { z } from 'zod'

export const pdfGenerateSchema = z.object({
  dosyaId: z.number().int(),
  sablonId: z.number().int(),
})
