import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/lib/api'
import { syncAll } from '@/lib/db'
import { enviarPendentes } from '@/lib/outbox'
import { precarregarFotosProdutos } from '@/lib/fotosCache'

const CHAVE_ULTIMA_SINCRONIZACAO = 'higiexpo:ultima-sincronizacao'
const INTERVALO_VERIFICACAO_MS = 30_000
// Rapid online/offline flapping on flaky venue wifi shouldn't fire a full
// resync every time — only worth repeating once this much time has passed
// since the last one completed.
const COOLDOWN_RECONEXAO_MS = 10_000

/**
 * One button/action covers both directions per docs/PLAN.md's "Atualizar
 * dados" button and docs/ARCHITECTURE.md's "Sync now" for the leads outbox
 * — simpler than exposing two separate manual triggers for what a rep
 * experiences as one "sync" action. Also tracks live connectivity (not just
 * the result of the last sync) and re-triggers itself the moment the app
 * actually regains a working connection, rather than on a fixed timer.
 */
export const useSyncStore = defineStore('sync', () => {
  const sincronizando = ref(false)
  const erro = ref('')
  const ultimaSincronizacao = ref<string | null>(localStorage.getItem(CHAVE_ULTIMA_SINCRONIZACAO))

  // Instant, free — the OS's own network-link signal.
  const online = ref(navigator.onLine)
  // Separate from `online`: a device can have wifi but still not be able to
  // reach this specific server (captive portals, the backend being briefly
  // down). `null` = not checked yet, deliberately not treated as "offline"
  // so a fresh page load doesn't flash a false "sem conexão" banner.
  const conectadoServidor = ref<boolean | null>(null)

  let intervalId: ReturnType<typeof setInterval> | undefined
  let ultimaConclusao = 0

  async function sincronizar() {
    if (sincronizando.value) return
    sincronizando.value = true
    erro.value = ''
    try {
      const { produtos } = await syncAll()
      ultimaSincronizacao.value = new Date().toISOString()
      localStorage.setItem(CHAVE_ULTIMA_SINCRONIZACAO, ultimaSincronizacao.value)
      // Deliberadamente não aguardado: baixar as fotos do catálogo inteiro
      // não deve atrasar o indicador de "sincronizado" nem bloquear o rep —
      // roda em segundo plano, mesmo espírito do enviarPendentes() abaixo.
      void precarregarFotosProdutos(produtos)
    } catch {
      // Most commonly "no connection" — the local (possibly stale) data
      // from the last successful sync stays usable either way.
      erro.value = 'Não foi possível atualizar os dados agora.'
    } finally {
      sincronizando.value = false
      ultimaConclusao = Date.now()
    }
    // Independent of whether the read-sync above succeeded — a failed
    // collections sync shouldn't skip trying to flush queued leads too.
    void enviarPendentes()
  }

  async function verificarServidor() {
    if (!online.value) {
      conectadoServidor.value = false
      return
    }
    const estavaConectado = conectadoServidor.value
    try {
      await api.get('/health')
      conectadoServidor.value = true
    } catch {
      conectadoServidor.value = false
      return
    }
    // The transition that actually matters: we just confirmed the server is
    // reachable and it wasn't a moment ago (covers the case where wifi never
    // dropped at all — only the backend was briefly unreachable — so the
    // browser's own `online` event never fires).
    if (estavaConectado !== true) aoReconectar()
  }

  function aoReconectar() {
    if (Date.now() - ultimaConclusao < COOLDOWN_RECONEXAO_MS) return
    void sincronizar()
  }

  function aoFicarOnline() {
    online.value = true
    void verificarServidor()
  }

  function aoFicarOffline() {
    online.value = false
    conectadoServidor.value = false
  }

  /** Called once from App.vue on mount. */
  function iniciarMonitoramento() {
    window.addEventListener('online', aoFicarOnline)
    window.addEventListener('offline', aoFicarOffline)
    void verificarServidor()
    intervalId = setInterval(verificarServidor, INTERVALO_VERIFICACAO_MS)
  }

  function pararMonitoramento() {
    window.removeEventListener('online', aoFicarOnline)
    window.removeEventListener('offline', aoFicarOffline)
    clearInterval(intervalId)
  }

  return {
    sincronizando,
    erro,
    ultimaSincronizacao,
    online,
    conectadoServidor,
    sincronizar,
    iniciarMonitoramento,
    pararMonitoramento,
  }
})
