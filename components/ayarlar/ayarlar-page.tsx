'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/context'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AyarlarCrudSection } from './ayarlar-crud-section'
import { SigortaSirketiSection } from './sigorta-sirketi-section'
import { PipelineStatus } from '@/components/pipeline/pipeline-status'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Check, X, FolderOpen, Pencil, Building2, List, Settings2 } from 'lucide-react'
import { toast } from 'sonner'

export function AyarlarPage() {
  const trpc = useTRPC()
  const qc = useQueryClient()

  // Mahkemeler
  const mahkemeOpts = trpc.ayarlar.mahkeme.list.queryOptions()
  const { data: mahkemeList, isLoading: mahkemeLoading } = useQuery(mahkemeOpts)
  const addMahkeme = useMutation(
    trpc.ayarlar.mahkeme.create.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: mahkemeOpts.queryKey }),
    })
  )
  const editMahkeme = useMutation(
    trpc.ayarlar.mahkeme.update.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: mahkemeOpts.queryKey }),
    })
  )
  const delMahkeme = useMutation(
    trpc.ayarlar.mahkeme.delete.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: mahkemeOpts.queryKey }),
    })
  )

  // Sigorta Türleri
  const sigortaTuruOpts = trpc.ayarlar.sigortaTuru.list.queryOptions()
  const { data: sigortaTuruList, isLoading: sigortaTuruLoading } = useQuery(sigortaTuruOpts)
  const addSigortaTuru = useMutation(
    trpc.ayarlar.sigortaTuru.create.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: sigortaTuruOpts.queryKey }),
    })
  )
  const editSigortaTuru = useMutation(
    trpc.ayarlar.sigortaTuru.update.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: sigortaTuruOpts.queryKey }),
    })
  )
  const delSigortaTuru = useMutation(
    trpc.ayarlar.sigortaTuru.delete.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: sigortaTuruOpts.queryKey }),
    })
  )

  // Belgeler Yolu
  const belgelerOpts = trpc.ayarlar.belgeler.getPath.queryOptions()
  const { data: belgelerData } = useQuery(belgelerOpts)
  const setBelgelerPath = useMutation(
    trpc.ayarlar.belgeler.setPath.mutationOptions({
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: belgelerOpts.queryKey })
        setEditingPath(false)
        toast.success('Klasör yolu güncellendi.')
      },
      onError: () => toast.error('Yol kaydedilemedi.'),
    })
  )
  const pickFolder = useMutation(
    trpc.ayarlar.belgeler.pickFolder.mutationOptions({
      onSuccess: (data) => {
        if (data.path) setBelgelerPath.mutate({ path: data.path })
      },
      onError: () => toast.error('Klasör seçilemedi.'),
    })
  )
  const [belgelerPath, setBelgelerPathInput] = useState('')
  const [editingPath, setEditingPath] = useState(false)

  function startManualEdit() {
    setBelgelerPathInput(belgelerData?.path ?? '')
    setEditingPath(true)
  }

  return (
    <Tabs defaultValue="kurumlar" className="space-y-6">
      <TabsList className="grid w-full grid-cols-3 max-w-md">
        <TabsTrigger value="kurumlar" className="gap-1.5">
          <Building2 className="h-3.5 w-3.5" />
          Kurumlar
        </TabsTrigger>
        <TabsTrigger value="listeler" className="gap-1.5">
          <List className="h-3.5 w-3.5" />
          Listeler
        </TabsTrigger>
        <TabsTrigger value="sistem" className="gap-1.5">
          <Settings2 className="h-3.5 w-3.5" />
          Sistem
        </TabsTrigger>
      </TabsList>

      {/* ── KURUMLAR ── */}
      <TabsContent value="kurumlar" className="space-y-6">
        <SigortaSirketiSection />
        <AyarlarCrudSection
          title="Mahkemeler / Kurumlar"
          description="Dosyalarda kullanılacak mahkeme ve kurum listesi."
          items={mahkemeList}
          isLoading={mahkemeLoading}
          onAdd={async (v) => { await addMahkeme.mutateAsync(v) }}
          onEdit={async (id, v) => { await editMahkeme.mutateAsync({ id, ...v }) }}
          onDelete={async (id) => { await delMahkeme.mutateAsync({ id }) }}
          showSehir={true}
        />
      </TabsContent>

      {/* ── LİSTELER ── */}
      <TabsContent value="listeler" className="space-y-6">
        <AyarlarCrudSection
          title="Sigorta Türleri"
          description="Dosya oluştururken seçilebilecek sigorta türleri."
          items={sigortaTuruList}
          isLoading={sigortaTuruLoading}
          onAdd={async (v) => { await addSigortaTuru.mutateAsync(v) }}
          onEdit={async (id, v) => { await editSigortaTuru.mutateAsync({ id, ...v }) }}
          onDelete={async (id) => { await delSigortaTuru.mutateAsync({ id }) }}
        />
      </TabsContent>

      {/* ── SİSTEM ── */}
      <TabsContent value="sistem" className="space-y-6">
        {/* Belgeler Yolu */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Belgeler Klasör Yolu</CardTitle>
            <CardDescription>
              Müvekkil belgelerinin kaydedileceği ana klasör. Yeni yüklemeler bu konuma gider.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!editingPath ? (
              <div className="flex items-center gap-3 rounded-md border bg-muted/40 px-3 py-2.5">
                <FolderOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate font-mono text-sm">
                  {belgelerData?.path ?? 'Henüz belirlenmedi'}
                </span>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => pickFolder.mutate()}
                    disabled={pickFolder.isPending || setBelgelerPath.isPending}
                  >
                    <FolderOpen className="mr-1.5 h-3.5 w-3.5" />
                    {pickFolder.isPending ? 'Seçiliyor…' : 'Klasör Seç'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={startManualEdit} title="Elle düzenle">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2 items-center">
                <Input
                  value={belgelerPath}
                  onChange={(e) => setBelgelerPathInput(e.target.value)}
                  placeholder="E:/sigorta-belgeler"
                  className="font-mono text-sm"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setBelgelerPath.mutate({ path: belgelerPath })
                    if (e.key === 'Escape') setEditingPath(false)
                  }}
                />
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => setBelgelerPath.mutate({ path: belgelerPath })}
                  disabled={setBelgelerPath.isPending}
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingPath(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Şifre Değiştirme */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Şifre Değiştirme</CardTitle>
            <CardDescription>
              Giriş şifresi yapılandırma dosyasında saklanır.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ol className="list-decimal list-inside space-y-2">
              <li>
                Proje klasöründeki{' '}
                <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">.env</code>{' '}
                dosyasını Not Defteri ile açın.
              </li>
              <li>
                <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">APP_PASSWORD=</code>
                {' '}satırındaki değeri yeni şifrenizle değiştirin.
              </li>
              <li>Dosyayı kaydedin ve uygulamayı yeniden başlatın.</li>
            </ol>
          </CardContent>
        </Card>

        {/* Pipeline */}
        <PipelineStatus />
      </TabsContent>
    </Tabs>
  )
}
