import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/lib/api'

export interface UsuarioSessao {
  id: string
  nome: string
  isAdmin: boolean
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
    } catch {
      usuario.value = null
    } finally {
      carregando.value = false
    }
  }

  async function login(email: string, password: string) {
    usuario.value = await api.post<UsuarioSessao>('/auth/login', { email, password })
  }

  async function logout() {
    await api.post('/auth/logout')
    usuario.value = null
  }

  return { usuario, carregando, logado, restaurarSessao, login, logout }
})
