import { z } from 'zod'
import { SABLON_KATEGORILER } from '@/lib/schema'

export const sablonKategoriSchema = z.enum(SABLON_KATEGORILER)

export const sablonCreateSchema = z.object({
  ad: z.string().min(1, 'Ad zorunludur').max(200),
  kategori: sablonKategoriSchema,
  filePath: z.string().min(1),
  fileName: z.string().min(1),
  fileSize: z.number().int().nonnegative(),
})

export const sablonUpdateSchema = z.object({
  id: z.number().int(),
  filePath: z.string().min(1),
  fileName: z.string().min(1),
})
