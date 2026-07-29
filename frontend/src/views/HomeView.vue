<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-3 rounded-b-hero bg-primary px-4 py-16 text-white">
    <p class="text-lg font-semibold">Higiexpo</p>
    <p v-if="auth.usuario" class="text-sm text-white/70">Olá, {{ auth.usuario.nome }} — home chega na próxima etapa.</p>
  </div>
</template>
