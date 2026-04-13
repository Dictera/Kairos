'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Download, FileSpreadsheet } from 'lucide-react'
import { PortfyOzet } from '@/components/raporlar/portfy-ozet'
import { FinansOzet } from '@/components/raporlar/finans-ozet'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export default function RaporlarPage() {
  const trpc = useTRPC()
  const [finansView, setFinansView] = useState<'monthly' | 'yearly'>('monthly')

  const { data: portfyData, isLoading: portfyLoading } = useQuery(trpc.rapor.portfy.queryOptions())
  const { data: finansData, isLoading: finansLoading } = useQuery(trpc.rapor.finans.queryOptions())
  const { data: dosyaListesi, isLoading: dosyaLoading } = useQuery(trpc.rapor.dosyaListesi.queryOptions())

  const downloadPdf = (url: string, filename: string) => {
    window.open(url, '_blank')
  }

  const downloadExcel = (url: string, filename: string) => {
    window.open(url, '_blank')
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Raporlar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Portföy ve finansal raporlarınızı görüntüleyin ve dışa aktarın
          </p>
        </div>
      </div>

      <Tabs defaultValue="portfy" className="space-y-6">
        <TabsList>
          <TabsTrigger value="portfy">Portföy Raporu</TabsTrigger>
          <TabsTrigger value="finans">Finansal Rapor</TabsTrigger>
          <TabsTrigger value="dosya-listesi">Dosya Listesi</TabsTrigger>
        </TabsList>

        {/* PORTFÖY TAB */}
        <TabsContent value="portfy" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => downloadPdf('/api/raporlar/portfy/pdf', 'portfoy-raporu.pdf')}>
              <Download className="h-4 w-4 mr-2" />
              PDF İndir
            </Button>
          </div>

          {portfyLoading ? (
            <div className="py-12 text-center text-muted-foreground">Yükleniyor...</div>
          ) : portfyData ? (
            <PortfyOzet data={portfyData} />
          ) : (
            <div className="py-12 text-center text-muted-foreground">Veri bulunamadı</div>
          )}
        </TabsContent>

        {/* FİNANS TAB */}
        <TabsContent value="finans" className="space-y-4">
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => downloadPdf('/api/raporlar/finans/pdf', 'finansal-rapor.pdf')}>
              <Download className="h-4 w-4 mr-2" />
              PDF İndir
            </Button>
            <Button variant="outline" size="sm" onClick={() => downloadExcel('/api/raporlar/finans/excel', 'finansal-rapor.xlsx')}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Excel İndir
            </Button>
          </div>

          <div className="flex gap-2 mb-4">
            <Button
              variant={finansView === 'monthly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFinansView('monthly')}
            >
              Aylık
            </Button>
            <Button
              variant={finansView === 'yearly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFinansView('yearly')}
            >
              Yıllık
            </Button>
          </div>

          {finansLoading ? (
            <div className="py-12 text-center text-muted-foreground">Yükleniyor...</div>
          ) : finansData ? (
            <FinansOzet data={finansData} view={finansView} />
          ) : (
            <div className="py-12 text-center text-muted-foreground">Veri bulunamadı</div>
          )}
        </TabsContent>

        {/* DOSYA LİSTESİ TAB */}
        <TabsContent value="dosya-listesi" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => downloadExcel('/api/raporlar/dosya-listesi/excel', 'dosya-listesi.xlsx')}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Excel İndir
            </Button>
          </div>

          {dosyaLoading ? (
            <div className="py-12 text-center text-muted-foreground">Yükleniyor...</div>
          ) : dosyaListesi && dosyaListesi.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Dosya Listesi ({dosyaListesi.length} kayıt)</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dosya No</TableHead>
                      <TableHead>Tür</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead>Müşteri</TableHead>
                      <TableHead>Sigorta</TableHead>
                      <TableHead>Talep</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dosyaListesi.map((d: any) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-mono text-sm">{d.dosya_no}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{d.tur}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={d.durum === 'AKTIF' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {d.durum}
                          </Badge>
                        </TableCell>
                        <TableCell>{d.musteri_ad}</TableCell>
                        <TableCell>{d.sigorta_ad}</TableCell>
                        <TableCell className="text-right">
                          {d.basin_cumulative ? d.basin_cumulative.toLocaleString('tr-TR') : '-'} ₺
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <div className="py-12 text-center text-muted-foreground">Kayıt bulunamadı</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}