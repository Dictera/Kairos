'use client'

import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowDownCircle, ArrowUpCircle, Receipt, MinusCircle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface FinansSummaryProps {
  dosyaId: number
}

export function FinansSummary({ dosyaId }: FinansSummaryProps) {
  const trpc = useTRPC()
  
  const { data, isLoading } = useQuery(
    trpc.finans.getSummary.queryOptions({ dosya_id: dosyaId })
  )
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    )
  }
  
  if (!data) return null
  
  const { gelen, giden, masraf, net } = data
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Gelen - green */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ArrowDownCircle className="h-4 w-4 text-green-600" />
            Gelen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-green-600">
            {gelen.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
          </p>
        </CardContent>
      </Card>
      
      {/* Giden - red */}
      <Card className="border-l-4 border-l-red-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ArrowUpCircle className="h-4 w-4 text-red-600" />
            Giden
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-red-600">
            {giden.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
          </p>
        </CardContent>
      </Card>
      
      {/* Masraf - orange */}
      <Card className="border-l-4 border-l-orange-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Receipt className="h-4 w-4 text-orange-600" />
            Masraf
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-orange-600">
            {masraf.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
          </p>
        </CardContent>
      </Card>
      
      {/* Net balance - color based on positive/negative */}
      <Card className={`border-l-4 ${net >= 0 ? 'border-l-blue-500' : 'border-l-gray-500'}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {net >= 0 ? (
              <MinusCircle className="h-4 w-4 text-blue-600" />
            ) : (
              <MinusCircle className="h-4 w-4 text-gray-600" />
            )}
            Net Bakiye
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`text-2xl font-bold ${net >= 0 ? 'text-blue-600' : 'text-gray-600'}`}>
            {net.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
