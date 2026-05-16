import { Suspense } from 'react'
import { MuvekkilList } from '@/components/muvekkil/muvekkil-list'

function MuvekkilListSkeleton() {
  return <div className="p-6">Yükleniyor...</div>
}

export default function MuvekkillerPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Müvekkiller</h1>
      </div>
      <Suspense fallback={<MuvekkilListSkeleton />}>
        <MuvekkilList />
      </Suspense>
    </div>
  )
}
