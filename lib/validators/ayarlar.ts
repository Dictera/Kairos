import { z } from 'zod'

export const sigortaSirketiSchema = z.object({
  ad: z.string().min(1, 'Ad zorunludur').max(200),
  mersis_no: z.string().max(50).optional().or(z.literal('')),
  vergi_no: z.string()
    .min(1, 'Vergi No zorunludur')
    .regex(/^(\d{10}|\d{11})$/, 'VKN/TCKN 10 veya 11 hane olmalıdır'),
  bagli_oldugu_vergi_dairesi: z.string().max(200).optional().or(z.literal('')),
  ihtar_mail: z.string().email('Geçerli e-posta giriniz').optional().or(z.literal('')),
  kep_mail: z.string().email('Geçerli e-posta giriniz').optional().or(z.literal('')),
})

export const avukatSchema = z.object({
  ad: z.string().min(1, 'Ad zorunludur').max(200),
  tbb_sicil_no: z.string().min(1, 'TBB Sicil No zorunludur').max(50),
  iban: z.string()
    .regex(/^TR\d{24}$/, 'Geçersiz IBAN formatı (TRXXXXXXXXXXXXXXXXXXXXXXXX gerekli)')
    .optional()
    .or(z.literal('')),
  eposta: z.string().email('Geçerli e-posta giriniz').optional().or(z.literal('')),
  telefon: z.string()
    .regex(/^05[0-9]{9}$/, 'Geçersiz telefon formatı (05XXXXXXXXX gerekli)')
    .optional()
    .or(z.literal('')),
})
