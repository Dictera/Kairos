import { createTRPCRouter, protectedProcedure } from '@/lib/trpc/init'
import { getUpdateStatus, requestUpdate, isManaged } from '@/lib/update/git'

export const updateRouter = createTRPCRouter({
  getStatus: protectedProcedure.query(async () => {
    try {
      return await getUpdateStatus()
    } catch {
      // git yoksa / beklenmeyen hata: güncelleme UI'ı gizlensin
      return { supported: false as const, reason: 'no-git' as const, currentVersion: '0.0.0' }
    }
  }),

  run: protectedProcedure.mutation(async () => {
    const status = await getUpdateStatus()
    if (!status.supported) {
      return { ok: false as const, restarting: false, message: 'Bu kurulum git ile yönetilmiyor.' }
    }
    if (!status.remoteTrusted) {
      return { ok: false as const, restarting: false, message: 'Güncelleme kaynağı doğrulanamadı (origin resmi depo değil).' }
    }
    if (status.dirty) {
      return { ok: false as const, restarting: false, message: 'Yerel değişiklikler var; otomatik güncelleme yapılamaz.' }
    }
    if (!status.updateAvailable) {
      return { ok: false as const, restarting: false, message: 'Zaten güncel.' }
    }

    requestUpdate(status.remoteSha)

    if (isManaged()) {
      // Launcher (start-kairos) yönetiyor: süreçten çık -> launcher güncelleyip yeniden başlatır.
      // Yanıtın istemciye ulaşması için kısa gecikme.
      setTimeout(() => process.exit(0), 750)
      return { ok: true as const, restarting: true, message: 'Güncelleme uygulanıyor, sunucu yeniden başlatılıyor...' }
    }

    return {
      ok: true as const,
      restarting: false,
      message: 'Güncelleme planlandı. Uygulamayı kapatıp start-kairos ile yeniden başlatın.',
    }
  }),
})
