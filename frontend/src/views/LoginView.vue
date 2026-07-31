<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ApiError } from '@/lib/api'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const email = ref('')
const senha = ref('')
const erro = ref('')
const enviando = ref(false)

async function enviar() {
  erro.value = ''
  enviando.value = true
  try {
    await auth.login(email.value, senha.value)
    const destino = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    router.replace(destino)
  } catch (e) {
    erro.value = e instanceof ApiError && e.status === 401 ? 'Email ou senha incorretos.' : 'Não foi possível entrar. Tente novamente.'
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-bg px-4">
    <form class="w-full max-w-sm rounded-card bg-card p-7 shadow-card" @submit.prevent="enviar">
      <h1 class="text-lg font-bold text-primary">Higiexpo</h1>
      <p class="mt-1.5 mb-5 text-[13.5px] text-muted">Entre com sua conta para continuar.</p>

      <label class="mb-1.5 block text-[13px] font-semibold text-muted" for="email">Email</label>
      <input
        id="email"
        v-model="email"
        type="email"
        required
        autocomplete="username"
        class="mb-3.5 h-14 w-full rounded-field border-[1.5px] border-divider px-3.5 text-ink outline-hidden focus:border-primary focus:shadow-focus-ring"
      />

      <label class="mb-1.5 block text-[13px] font-semibold text-muted" for="senha">Senha</label>
      <input
        id="senha"
        v-model="senha"
        type="password"
        required
        autocomplete="current-password"
        class="h-14 w-full rounded-field border-[1.5px] border-divider px-3.5 text-ink outline-hidden focus:border-primary focus:shadow-focus-ring"
      />

      <p v-if="erro" class="mt-3 text-[13.5px] text-danger" role="alert">{{ erro }}</p>

      <button
        type="submit"
        :disabled="enviando"
        class="mt-5 h-14 w-full rounded-btn bg-primary font-semibold text-white disabled:opacity-60"
      >
        {{ enviando ? 'Entrando...' : 'Entrar' }}
      </button>
    </form>
  </div>
</template>
