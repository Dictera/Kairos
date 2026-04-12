import { MuvekkilList } from '@/components/muvekkil/muvekkil-list'

export default function MuvekkillerPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Müvekkiller</h1>
      </div>
      <MuvekkilList />
    </div>
  )
}
