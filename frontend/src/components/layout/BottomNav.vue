<script setup lang="ts">
import { useRoute } from 'vue-router'
import { House, Users, Building2, UserPlus } from '@lucide/vue'

const route = useRoute()

const abas = [
  { nome: 'Home', rota: 'home', icone: House },
  { nome: 'Repres.', rota: 'representantes', icone: Users },
  { nome: 'Cliente', rota: 'clientes', icone: Building2 },
  { nome: 'Leads', rota: 'leads', icone: UserPlus },
] as const

function estaAtiva(nomeRota: string) {
  return route.matched.some((registro) => registro.name === nomeRota)
}
</script>

<template>
  <nav
    class="fixed inset-x-0 bottom-0 z-10 mx-auto flex max-w-shell justify-around border-t border-divider bg-card"
    style="padding-bottom: env(safe-area-inset-bottom)"
  >
    <RouterLink
      v-for="aba in abas"
      :key="aba.rota"
      :to="{ name: aba.rota }"
      class="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium"
      :class="estaAtiva(aba.rota) ? 'text-primary' : 'text-faint'"
    >
      <component :is="aba.icone" :size="22" />
      <span>{{ aba.nome }}</span>
    </RouterLink>
  </nav>
</template>
