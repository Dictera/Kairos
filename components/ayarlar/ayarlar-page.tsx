'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/context'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AyarlarCrudSection } from './ayarlar-crud-section'
import { SigortaSirketiSection } from './sigorta-sirketi-section'
import SablonYonetimiSection from './sablon-yonetimi-section'
import { CheatSheetSummaryCard } from './cheat-sheet-summary-card'
import { PipelineStatus } from '@/components/pipeline/pipeline-status'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Check, X } from 'lucide-react'

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
      onSuccess: () => qc.invalidateQueries({ queryKey: belgelerOpts.queryKey }),
    })
  )
  const [belgelerPath, setBelgelerPathInput] = useState(belgelerData?.path ?? '')
  const [editingPath, setEditingPath] = useState(false)

  return (
    <div className="space-y-8">
      <SigortaSirketiSection />

      <Separator />

      {/* Belgeler Yolu Ayarı */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Belgeler Klasör Yolu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Müvekkil belgelerinin kaydedileceği ana klasör yolunu belirleyin.
          </p>
          <div className="flex gap-2 items-center">
            <Input
              value={editingPath ? belgelerPath : (belgelerData?.path ?? '')}
              onChange={(e) => { setBelgelerPathInput(e.target.value); setEditingPath(true) }}
              placeholder="E:/sigorta-belgeler"
              className="font-mono text-sm"
              disabled={!editingPath}
            />
            {editingPath ? (
              <>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => {
                    setBelgelerPath.mutate({ path: belgelerPath })
                    setEditingPath(false)
                  }}
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setBelgelerPathInput(belgelerData?.path ?? '')
                    setEditingPath(false)
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setBelgelerPathInput(belgelerData?.path ?? '')
                  setEditingPath(true)
                }}
              >
                Düzenle
              </Button>
            )}
          </div>
          {setBelgelerPath.isSuccess && (
            <p className="text-xs text-green-600">Yol güncellendi. Yeni yüklemeler bu klasöre kaydedilecektir.</p>
          )}
        </CardContent>
      </Card>

      <Separator />

      <AyarlarCrudSection
        title="Mahkemeler / Kurumlar"
        items={mahkemeList}
        isLoading={mahkemeLoading}
        onAdd={async (v) => { await addMahkeme.mutateAsync(v) }}
        onEdit={async (id, v) => { await editMahkeme.mutateAsync({ id, ...v }) }}
        onDelete={async (id) => { await delMahkeme.mutateAsync({ id }) }}
        showSehir={true}
      />

      <Separator />

      <AyarlarCrudSection
        title="Sigorta Türleri"
        items={sigortaTuruList}
        isLoading={sigortaTuruLoading}
        onAdd={async (v) => { await addSigortaTuru.mutateAsync(v) }}
        onEdit={async (id, v) => { await editSigortaTuru.mutateAsync({ id, ...v }) }}
        onDelete={async (id) => { await delSigortaTuru.mutateAsync({ id }) }}
      />

      <Separator />

      {/* AYAR-03: Statik şifre değiştirme kılavuzu — backend yok, mutation yok */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Şifre Değiştirme</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Uygulama şifresi{' '}
            <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">.env</code>{' '}
            dosyasında{' '}
            <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">APP_PASSWORD</code>{' '}
            değişkeni olarak saklanmaktadır.
          </p>
          <p>Şifreyi değiştirmek için:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>
              Proje klasöründeki{' '}
              <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">.env</code>{' '}
              dosyasını bir metin editörüyle açın.
            </li>
            <li>
              <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">
                APP_PASSWORD=yeni_şifreniz
              </code>{' '}
              satırını güncelleyin.
            </li>
            <li>Dosyayı kaydedin.</li>
            <li>
              Terminalde{' '}
              <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">npm run dev</code>{' '}
              komutunu yeniden başlatın.
            </li>
            <li>Tarayıcıda çıkış yapıp yeni şifrenizle giriş yapın.</li>
          </ol>
          <p className="text-xs">
            Not:{' '}
            <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">.env</code>{' '}
            dosyası asla kaynak kod deposuna eklenmemelidir.
          </p>
        </CardContent>
      </Card>

      <Separator />

      <SablonYonetimiSection />

      <Separator />

      <CheatSheetSummaryCard />

      <Separator />

      <PipelineStatus />
    </div>
  )
}
