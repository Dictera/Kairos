export const PIPELINE_EXIT_CODES = {
  0: 'Başarılı',
  1: 'Doğrulama hatası',
  2: 'Şablon doldurma hatası',
  3: 'PDF dönüştürme hatası',
  4: 'Arşivleme hatası',
} as const

type PipelineExitCode = keyof typeof PIPELINE_EXIT_CODES

export function getTurkishErrorMessage(exitCode: number): string {
  return PIPELINE_EXIT_CODES[exitCode as PipelineExitCode] ?? `Bilinmeyen hata (kod: ${exitCode})`
}