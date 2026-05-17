import { createTRPCRouter, protectedProcedure } from '@/lib/trpc/init'
import { getHealthStatus } from '@/lib/pipeline/health-check'
import { getLibreOfficePath, getSidecarPythonPath } from '@/lib/pipeline/config'

export const pipelineRouter = createTRPCRouter({
  healthCheck: protectedProcedure.query(async () => {
    return await getHealthStatus()
  }),

  status: protectedProcedure.query(async () => {
    const pythonPath = await getSidecarPythonPath()
    const libreofficePath = await getLibreOfficePath()
    return {
      python: { path: pythonPath ?? 'Bulunamadı' },
      libreoffice: { path: libreofficePath ?? 'Bulunamadı' },
    }
  }),
})