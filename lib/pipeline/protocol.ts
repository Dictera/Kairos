import { z } from 'zod'

export const CommandEnvelopeSchema = z.object({
  command: z.enum(['extract-vars', 'render', 'convert', 'health-check', 'slug']),
  params: z.record(z.unknown()).default({}),
})
export type CommandEnvelope = z.infer<typeof CommandEnvelopeSchema>

export const CommandResultSchema = z.object({
  status: z.enum(['success', 'error']),
  result: z.unknown().optional(),
  code: z.number().int().optional(),
  message: z.string().optional(),
})
export type CommandResult = z.infer<typeof CommandResultSchema>

export const RenderParamsSchema = z.object({
  template_path: z.string(),
  output_path: z.string(),
  context: z.record(z.unknown()),
})
export type RenderParams = z.infer<typeof RenderParamsSchema>

export const ConvertParamsSchema = z.object({
  input_path: z.string(),
  output_dir: z.string(),
  libreoffice_path: z.string(),
  timeout: z.number().int().optional(),
})
export type ConvertParams = z.infer<typeof ConvertParamsSchema>