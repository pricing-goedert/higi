import { onUnmounted, ref } from 'vue'
import { liveQuery } from 'dexie'
import { db } from '@/lib/db'

/** Reactive count of the leads outbox — updates live as items are queued/flushed. */
export function useLeadsPendentesCount() {
  const contagem = ref(0)
  const assinatura = liveQuery(() => db.leadsOutbox.count()).subscribe({
    next: (valor) => (contagem.value = valor),
    error: () => {},
  })
  onUnmounted(() => assinatura.unsubscribe())
  return contagem
}
