import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { api, ApiError } from '@/lib/api'
import { limparCacheLeads } from '@/lib/db'

export interface UsuarioSessao {
  id: string
  nome: string
  isAdmin: boolean
}

const CHAVE_SESSAO_CACHE = 'higiexpo:sessao'

function salvarSessaoEmCache(usuario: UsuarioSessao | null) {
  if (usuario) {
    localStorage.setItem(CHAVE_SESSAO_CACHE, JSON.stringify(usuario))
  } else {
    localStorage.removeItem(CHAVE_SESSAO_CACHE)
  }
}

function obterSessaoEmCache(): UsuarioSessao | null {
  try {
    const bruto = localStorage.getItem(CHAVE_SESSAO_CACHE)
    return bruto ? JSON.parse(bruto) : null
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const usuario = ref<UsuarioSessao | null>(null)
  // Starts true: the router guard waits on this before deciding whether an
  // unauthenticated visitor gets redirected to /login, so a page refresh
  // with a still-valid session doesn't flash the login screen first.
  const carregando = ref(true)
  const logado = computed(() => usuario.value !== null)

  async function restaurarSessao() {
    carregando.value = true
    try {
      usuario.value = await api.get<UsuarioSessao>('/auth/me')
      salvarSessaoEmCache(usuario.value)
    } catch (erro) {
      if (erro instanceof ApiError && erro.status === 401) {
        // A real "you're not logged in" — no session, or it's expired/
        // invalidated server-side. Clears the leads cache too: the device
        // may be handed to a different rep next, and a stale cache from
        // whoever was logged in before must not linger (see lib/db.ts).
        usuario.value = null
        salvarSessaoEmCache(null)
        void limparCacheLeads()
      } else {
        // Couldn't even reach the server — offline, most likely. Trust the
        // last known session rather than bouncing an already-logged-in rep
        // to the login screen just because there's no connectivity right
        // now (see docs/PLAN.md's Phase 5 done-when criteria).
        usuario.value = obterSessaoEmCache()
      }
    } finally {
      carregando.value = false
    }
  }

  async function login(email: string, password: string) {
    // Defensive, not just belt-and-suspenders: a login on a shared device
    // must never risk surfacing whoever was cached from a previous session
    // that didn't go through a clean logout (e.g. an expired-but-uncleared
    // cache) even for an instant.
    await limparCacheLeads()
    usuario.value = await api.post<UsuarioSessao>('/auth/login', { email, password })
    salvarSessaoEmCache(usuario.value)
  }

  async function logout() {
    await api.post('/auth/logout')
    usuario.value = null
    salvarSessaoEmCache(null)
    await limparCacheLeads()
  }

  function atualizarNome(nome: string) {
    if (!usuario.value) return
    usuario.value = { ...usuario.value, nome }
    salvarSessaoEmCache(usuario.value)
  }

  return { usuario, carregando, logado, restaurarSessao, login, logout, atualizarNome }
})
