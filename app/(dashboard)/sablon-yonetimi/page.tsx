import SablonYonetimiSection from '@/components/ayarlar/sablon-yonetimi-section'
import { CheatSheetSummaryCard } from '@/components/ayarlar/cheat-sheet-summary-card'
import { Separator } from '@/components/ui/separator'

export default function SablonYonetimiPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Şablon Yönetimi</h1>
      <SablonYonetimiSection />

      <Separator />

      <CheatSheetSummaryCard />
    </div>
  )
}