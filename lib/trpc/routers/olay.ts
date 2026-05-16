import { createTRPCRouter, protectedProcedure } from '@/lib/trpc/init'
import { db } from '@/lib/db'
import { olayGunlugu } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'
import { z } from 'zod'

export async function logOlay(dosya_id: number, olay_turu: string, aciklama: string) {
  await db.insert(olayGunlugu).values({ dosya_id, olay_turu, aciklama })
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
