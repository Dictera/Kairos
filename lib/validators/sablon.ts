import { z } from 'zod'
import { BELGE_KATEGORILER, SABLON_KATEGORILER } from '@/lib/schema'

export const sablonKategoriSchema = z.enum(SABLON_KATEGORILER)

export const sablonCreateSchema = z.object({
  ad: z.string().min(1, 'Ad zorunludur').max(200),
  kategori: sablonKategoriSchema,
  filename: z.string().min(1),
  fileName: z.string().min(1),
  fileSize: z.number().int().optional(),
  belge_turu: z.enum(BELGE_KATEGORILER).optional(),
})

export const sablonUpdateSchema = z.object({
  id: z.number().int(),
  filename: z.string().min(1),
  fileName: z.string().min(1),
  belge_turu: z.enum(BELGE_KATEGORILER).optional(),
})
