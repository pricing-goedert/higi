<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const auth = useAuthStore()

const abas = [
  { rota: 'admin-usuarios', rotulo: 'Usuários' },
  { rota: 'admin-clientes', rotulo: 'Clientes' },
  { rota: 'admin-indicacoes', rotulo: 'Indicações' },
  { rota: 'admin-programacao', rotulo: 'Programação' },
  { rota: 'admin-produtos', rotulo: 'Produtos' },
  { rota: 'admin-orientacoes', rotulo: 'Orientações' },
  { rota: 'admin-leads', rotulo: 'Leads' },
  { rota: 'admin-importar', rotulo: 'Importação' },
] as const

function abaAtiva(rota: string) {
  return route.matched.some((r) => r.name === rota)
}
</script>

<template>
  <div class="min-h-screen bg-bg text-ink">
    <div class="flex items-center gap-3.5 bg-primary px-7 py-4 text-white">
      <img src="/goedert-icon.png" alt="" class="h-[34px] w-[34px] rounded-lg bg-white p-[3px]" />
      <h1 class="text-[1.05rem] font-bold">
        GoHub Higiexpo <span class="font-normal text-white/60">&middot; Gestão de Conteúdo do App</span>
      </h1>
      <span class="ml-auto text-[0.8rem] text-white/75">{{ auth.usuario?.nome }} (admin)</span>
      <RouterLink :to="{ name: 'home' }" class="ml-3.5 text-[0.8rem] text-white/75 no-underline">&larr; Voltar ao app</RouterLink>
    </div>

    <div class="flex flex-wrap gap-1.5 border-b border-divider bg-card px-7 pt-3.5">
      <RouterLink
        v-for="aba in abas"
        :key="aba.rota"
        :to="{ name: aba.rota }"
        class="inline-block rounded-t-[10px] border-b-[3px] px-[18px] py-2.5 text-[0.9rem] font-semibold no-underline"
        :class="
          abaAtiva(aba.rota)
            ? 'border-primary bg-[#E7EEF3] text-primary'
            : 'border-transparent text-muted'
        "
      >
        {{ aba.rotulo }}
      </RouterLink>
    </div>

    <div class="mx-auto max-w-[1200px] px-7 py-6">
      <RouterView :key="route.fullPath" />
    </div>
  </div>
</template>
