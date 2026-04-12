'use client'

import { use } from 'react'
import { MuvekkilForm } from '@/components/muvekkil/muvekkil-form'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

export default function MuvekkilDuzenlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const muvekkilId = parseInt(id, 10)

  return (
    <div className="p-6 space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/muvekkiller">Müvekkiller</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/muvekkiller/${id}`}>Müvekkil Detayı</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Düzenle</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <h1 className="text-xl font-semibold">Müvekkil Düzenle</h1>
      <MuvekkilForm mode="edit" muvekkilId={muvekkilId} />
    </div>
  )
}
