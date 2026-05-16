'use client'

import { use } from 'react'
import { RaporDetay } from '@/components/raporlar/rapor-detay'

export default function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  return <RaporDetay slug={slug} />
}
