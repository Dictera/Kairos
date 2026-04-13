'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const COLORS = ['#10B981', '#EF4444', '#F59E0B']

type Props = {
  data: {
    total: { gelen: number, giden: number, masraf: number, net: number }
    byMonth: { month: string, gelen: number, giden: number, masraf: number }[]
    byYear: { year: string, gelen: number, giden: number, masraf: number }[]
  }
  view: 'monthly' | 'yearly'
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function FinansOzet({ data, view }: Props) {
  const chartData = (view === 'monthly' ? data.byMonth : data.byYear) as { month?: string; year?: string; gelen: number; giden: number; masraf: number }[]
  const xKey = view === 'monthly' ? 'month' : 'year'
  
  return (
    <div className="space-y-6">
      {/* Summary stats cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Gelen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(data.total.gelen)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Giden</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(data.total.giden)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Masraf</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(data.total.masraf)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net (Gelen - Giden - Masraf)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.total.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(data.total.net)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {view === 'monthly' ? 'Aylık' : 'Yıllık'} Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="gelen" name="Gelen" fill={COLORS[0]} />
              <Bar dataKey="giden" name="Giden" fill={COLORS[1]} />
              <Bar dataKey="masraf" name="Masraf" fill={COLORS[2]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}