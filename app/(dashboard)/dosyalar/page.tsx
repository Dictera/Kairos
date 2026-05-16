import { DosyaList } from '@/components/dosya/dosya-list'
import { Suspense } from 'react'

export default function DosyalarPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dosyalar</h1>
      </div>
      <Suspense>
        <DosyaList />
      </Suspense>
    </div>
  )
}
