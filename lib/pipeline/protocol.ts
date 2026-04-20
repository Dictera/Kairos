import { z } from 'zod'

export const CommandEnvelopeSchema = z.object({
  command: z.enum(['extract-vars', 'render', 'convert', 'health-check']),
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