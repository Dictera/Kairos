'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/context'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AyarlarCrudSection } from './ayarlar-crud-section'
import { SigortaSirketiSection } from './sigorta-sirketi-section'
import SablonYonetimiSection from './sablon-yonetimi-section'
import { PipelineStatus } from '@/components/pipeline/pipeline-status'

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

  return (
    <div className="space-y-8">
      <SigortaSirketiSection />

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

      <PipelineStatus />
    </div>
  )
}
