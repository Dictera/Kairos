import { createTRPCRouter, protectedProcedure } from '@/lib/trpc/init'
import { db, type Transaction } from '@/lib/db'
import { olayGunlugu } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'
import { z } from 'zod'

// Async standalone log — use when the write is NOT wrapped in a transaction.
export async function logOlay(dosya_id: number, olay_turu: string, aciklama: string) {
  await db.insert(olayGunlugu).values({ dosya_id, olay_turu, aciklama })
}

// Sync log — call INSIDE a db.transaction((tx) => …) so the mutation and its
// activity-log row commit (or roll back) atomically. Uses .run() (sync runner).
export function logOlayTx(tx: Transaction, dosya_id: number, olay_turu: string, aciklama: string) {
  tx.insert(olayGunlugu).values({ dosya_id, olay_turu, aciklama }).run()
}

export const olayRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ dosya_id: z.number().int() }))
    .query(async ({ input }) => {
      return db.select().from(olayGunlugu)
        .where(eq(olayGunlugu.dosya_id, input.dosya_id))
        .orderBy(desc(olayGunlugu.created_at))
    }),
})
