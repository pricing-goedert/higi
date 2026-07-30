import { ref } from 'vue'
import { defineStore } from 'pinia'
import { syncAll } from '@/lib/db'
import { enviarPendentes } from '@/lib/outbox'

const CHAVE_ULTIMA_SINCRONIZACAO = 'higiexpo:ultima-sincronizacao'

/**
 * One button/action covers both directions per docs/PLAN.md's "Atualizar
 * dados" button and docs/ARCHITECTURE.md's "Sync now" for the leads outbox
 * — simpler than exposing two separate manual triggers for what a rep
 * experiences as one "sync" action.
 */
export const useSyncStore = defineStore('sync', () => {
  const sincronizando = ref(false)
  const erro = ref('')
  const ultimaSincronizacao = ref<string | null>(localStorage.getItem(CHAVE_ULTIMA_SINCRONIZACAO))

  async function sincronizar() {
    if (sincronizando.value) return
    sincronizando.value = true
    erro.value = ''
    try {
      await syncAll()
      ultimaSincronizacao.value = new Date().toISOString()
      localStorage.setItem(CHAVE_ULTIMA_SINCRONIZACAO, ultimaSincronizacao.value)
    } catch {
      // Most commonly "no connection" — the local (possibly stale) data
      // from the last successful sync stays usable either way.
      erro.value = 'Não foi possível atualizar os dados agora.'
    } finally {
      sincronizando.value = false
    }
    // Independent of whether the read-sync above succeeded — a failed
    // collections sync shouldn't skip trying to flush queued leads too.
    void enviarPendentes()
  }

  return { sincronizando, erro, ultimaSincronizacao, sincronizar }
})
