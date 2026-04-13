'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/context'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'

const formSchema = z.object({
  ad: z.string().min(1, 'Ad zorunludur'),
  soyad: z.string().min(1, 'Soyad zorunludur'),
  telefon: z.string().max(20).optional().or(z.literal('')),
  email: z.string().email('Geçersiz e-posta formatı').optional().or(z.literal('')),
  tc_vergi_no: z.string().max(11).optional().or(z.literal('')),
  adres: z.string().max(500).optional().or(z.literal('')),
  notlar: z.string().max(2000).optional().or(z.literal('')),
})

type FormValues = z.infer<typeof formSchema>

interface MuvekkilFormProps {
  mode: 'create' | 'edit'
  defaultValues?: Partial<FormValues>
  muvekkilId?: number
}

function MuvekkilFormInner({ mode, defaultValues, muvekkilId }: MuvekkilFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const trpc = useTRPC()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ad: '',
      soyad: '',
      telefon: '',
      email: '',
      tc_vergi_no: '',
      adres: '',
      notlar: '',
      ...defaultValues,
    },
  })

  const createMutation = useMutation(
    trpc.muvekkil.create.mutationOptions({
      onSuccess: (row) => {
        toast.success('Müvekkil başarıyla oluşturuldu.')
        queryClient.invalidateQueries({ queryKey: ['muvekkil'] })
        router.push('/muvekkiller/' + row.id)
      },
      onError: () => {
        toast.error('Kaydedilemedi. Lütfen tekrar deneyin.')
      },
    })
  )

  const updateMutation = useMutation(
    trpc.muvekkil.update.mutationOptions({
      onSuccess: () => {
        toast.success('Kaydedildi.')
        queryClient.invalidateQueries({ queryKey: ['muvekkil'] })
        router.push('/muvekkiller/' + muvekkilId)
      },
      onError: () => {
        toast.error('Kaydedilemedi. Lütfen tekrar deneyin.')
      },
    })
  )

  const isPending = createMutation.isPending || updateMutation.isPending

  const onSubmit = (values: FormValues) => {
    if (mode === 'create') {
      createMutation.mutate(values)
    } else if (mode === 'edit' && muvekkilId !== undefined) {
      updateMutation.mutate({ id: muvekkilId, ...values })
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="ad"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Ad <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Ad" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="soyad"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Soyad <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Soyad" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="telefon"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefon</FormLabel>
                <FormControl>
                  <Input placeholder="Telefon numarası" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-posta</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="E-posta adresi" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tc_vergi_no"
            render={({ field }) => (
              <FormItem>
                <FormLabel>TC No / Vergi No</FormLabel>
                <FormControl>
                  <Input placeholder="TC Kimlik No veya Vergi No" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="adres"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Adres</FormLabel>
                <FormControl>
                  <Textarea placeholder="Adres bilgisi" rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notlar"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notlar</FormLabel>
                <FormControl>
                  <Textarea placeholder="İsteğe bağlı notlar" rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              disabled={isPending}
            >
              Vazgeç
            </Button>
            <Button
              type="submit"
              className="bg-primary text-primary-foreground"
              disabled={isPending}
            >
              {isPending ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

export function MuvekkilForm(props: MuvekkilFormProps) {
  const trpc = useTRPC()

  // In edit mode, fetch existing data to pre-populate
  const { data, isLoading } = useQuery({
    ...trpc.muvekkil.getById.queryOptions({ id: props.muvekkilId ?? 0 }),
    enabled: props.mode === 'edit' && props.muvekkilId !== undefined,
  })

  if (props.mode === 'edit' && isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  const defaultValues = props.mode === 'edit' && data
    ? {
        ad: data.ad,
        soyad: data.soyad,
        telefon: data.telefon ?? '',
        tc_vergi_no: data.tc_vergi_no ?? '',
        adres: data.adres ?? '',
        notlar: data.notlar ?? '',
      }
    : props.defaultValues

  return <MuvekkilFormInner {...props} defaultValues={defaultValues} />
}
