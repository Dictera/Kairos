'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/context'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { YonetimOzeti } from '@/components/raporlar/yonetim-ozeti'
import { GenelBakis } from '@/components/raporlar/genel-bakis'
import { TahsilatRaporu } from '@/components/raporlar/tahsilat-raporu'
import { SonucBasari } from '@/components/raporlar/sonuc-basari'
import { Arabuluculuk } from '@/components/raporlar/arabuluculuk'
import { ZamanasimRiski } from '@/components/raporlar/zamanasimi-riski'
import { DosyaRaporu } from '@/components/raporlar/dosya-raporu'
import { MuvekkilRaporu } from '@/components/raporlar/muvekkil-raporu'
import { DavaSureci } from '@/components/raporlar/dava-sureci'
import { SirketAnalizi } from '@/components/raporlar/sirket-analizi'

export default function RaporlarPage() {
  const trpc = useTRPC()
  const [aktifSekme, setAktifSekme] = useState('yonetim-ozeti')

  const { data: yonetimData, isLoading: yonetimLoading } = useQuery({
    ...trpc.rapor.yonetimOzeti.queryOptions(),
    enabled: aktifSekme === 'yonetim-ozeti',
  })
  const { data: genelData, isLoading: genelLoading } = useQuery({
    ...trpc.rapor.genelBakis.queryOptions(),
    enabled: aktifSekme === 'genel-bakis',
  })
  const { data: tahsilatData, isLoading: tahsilatLoading } = useQuery({
    ...trpc.rapor.tahsilat.queryOptions(),
    enabled: aktifSekme === 'tahsilat',
  })
  const { data: sonucData, isLoading: sonucLoading } = useQuery({
    ...trpc.rapor.sonucBasari.queryOptions(),
    enabled: aktifSekme === 'sonuc-basari',
  })
  const { data: arabuluculukData, isLoading: arabuluculukLoading } = useQuery({
    ...trpc.rapor.arabuluculuk.queryOptions(),
    enabled: aktifSekme === 'arabuluculuk',
  })
  const { data: zamanasimData, isLoading: zamanasimLoading } = useQuery({
    ...trpc.rapor.zamanasimi.queryOptions(),
    enabled: aktifSekme === 'zamanasimi',
  })
  const { data: dosyaData, isLoading: dosyaLoading } = useQuery({
    ...trpc.rapor.dosyaRaporu.queryOptions(),
    enabled: aktifSekme === 'dosya-raporu',
  })
  const { data: muvekkilData, isLoading: muvekkilLoading } = useQuery({
    ...trpc.rapor.muvekkilRaporu.queryOptions(),
    enabled: aktifSekme === 'muvekkil-raporu',
  })
  const { data: davaData, isLoading: davaLoading } = useQuery({
    ...trpc.rapor.davaSureci.queryOptions(),
    enabled: aktifSekme === 'dava-sureci',
  })
  const { data: sirketData, isLoading: sirketLoading } = useQuery({
    ...trpc.rapor.sirketAnalizi.queryOptions(),
    enabled: aktifSekme === 'sirket-analizi',
  })

  const yukleniyorDiv = (
    <div className="py-12 text-center text-muted-foreground">Yükleniyor...</div>
  )

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Raporlar</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Portföy performansı, tahsilat durumu ve risk analizi
        </p>
      </div>

      <Tabs value={aktifSekme} onValueChange={setAktifSekme}>
        <TabsList className="flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="yonetim-ozeti">Yönetim Özeti</TabsTrigger>
          <TabsTrigger value="genel-bakis">Genel Bakış</TabsTrigger>
          <TabsTrigger value="tahsilat">Tahsilat</TabsTrigger>
          <TabsTrigger value="sonuc-basari">Sonuç & Başarı</TabsTrigger>
          <TabsTrigger value="arabuluculuk">Arabuluculuk</TabsTrigger>
          <TabsTrigger value="zamanasimi">Zamanaşımı Riski</TabsTrigger>
          <TabsTrigger value="dosya-raporu">Dosya Raporu</TabsTrigger>
          <TabsTrigger value="muvekkil-raporu">Müvekkil Raporu</TabsTrigger>
          <TabsTrigger value="dava-sureci">Dava Süreci</TabsTrigger>
          <TabsTrigger value="sirket-analizi">Şirket Analizi</TabsTrigger>
        </TabsList>

        <TabsContent value="yonetim-ozeti" className="mt-4">
          {yonetimLoading ? yukleniyorDiv : yonetimData ? <YonetimOzeti data={yonetimData} /> : yukleniyorDiv}
        </TabsContent>
        <TabsContent value="genel-bakis" className="mt-4">
          {genelLoading ? yukleniyorDiv : genelData ? <GenelBakis data={genelData} /> : yukleniyorDiv}
        </TabsContent>
        <TabsContent value="tahsilat" className="mt-4">
          {tahsilatLoading ? yukleniyorDiv : tahsilatData ? <TahsilatRaporu data={tahsilatData} /> : yukleniyorDiv}
        </TabsContent>
        <TabsContent value="sonuc-basari" className="mt-4">
          {sonucLoading ? yukleniyorDiv : sonucData ? <SonucBasari data={sonucData} /> : yukleniyorDiv}
        </TabsContent>
        <TabsContent value="arabuluculuk" className="mt-4">
          {arabuluculukLoading ? yukleniyorDiv : arabuluculukData ? <Arabuluculuk data={arabuluculukData} /> : yukleniyorDiv}
        </TabsContent>
        <TabsContent value="zamanasimi" className="mt-4">
          {zamanasimLoading ? yukleniyorDiv : zamanasimData ? <ZamanasimRiski data={zamanasimData} /> : yukleniyorDiv}
        </TabsContent>
        <TabsContent value="dosya-raporu" className="mt-4">
          {dosyaLoading ? yukleniyorDiv : dosyaData ? <DosyaRaporu data={dosyaData} /> : yukleniyorDiv}
        </TabsContent>
        <TabsContent value="muvekkil-raporu" className="mt-4">
          {muvekkilLoading ? yukleniyorDiv : muvekkilData ? <MuvekkilRaporu data={muvekkilData} /> : yukleniyorDiv}
        </TabsContent>
        <TabsContent value="dava-sureci" className="mt-4">
          {davaLoading ? yukleniyorDiv : davaData ? <DavaSureci data={davaData} /> : yukleniyorDiv}
        </TabsContent>
        <TabsContent value="sirket-analizi" className="mt-4">
          {sirketLoading ? yukleniyorDiv : sirketData ? <SirketAnalizi data={sirketData} /> : yukleniyorDiv}
        </TabsContent>
      </Tabs>
    </div>
  )
}
