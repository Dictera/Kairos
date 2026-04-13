import { db } from '@/lib/db'
import { belge } from '@/lib/schema'
import { desc } from 'drizzle-orm'
import Link from 'next/link'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

export default async function BelgelerPage() {
  // Fetch all belgeler with dosya info
  const allBelgeler = await db
    .select({
      id: belge.id,
      dosya_adi: belge.dosya_adi,
      kategori: belge.kategori,
      dosya_yolu: belge.dosya_yolu,
      created_at: belge.created_at,
      dosya_id: belge.dosya_id,
      dosya_no: belge.dosya_no,
    })
    .from(belge)
    .orderBy(desc(belge.created_at))
    .limit(100) // Paginate in future
  
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-semibold mb-6">Tüm Belgeler</h1>
      
      {allBelgeler.length === 0 ? (
        <p className="text-muted-foreground">Henüz belge yüklenmedi.</p>
      ) : (
        <div className="space-y-2">
          {allBelgeler.map((belge) => (
            <div
              key={belge.id}
              className="flex justify-between items-start p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <Link
                href={`/dosyalar/${belge.dosya_id}`}
                className="flex-1 min-w-0"
              >
                <p className="font-medium">{belge.dosya_adi}</p>
                <p className="text-sm text-muted-foreground">
                  Dosya: {belge.dosya_no} • {belge.kategori} •{' '}
                  {format(new Date(belge.created_at), 'dd MMM yyyy', { locale: tr })}
                </p>
              </Link>
              <a
                href={belge.dosya_yolu}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline ml-4"
              >
                Görüntüle
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
