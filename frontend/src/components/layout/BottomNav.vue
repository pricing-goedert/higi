<script setup lang="ts">
import { useRoute } from 'vue-router'
import { House, Briefcase, LayoutGrid, UserPlus, User } from '@lucide/vue'
import { useLeadsPendentesCount } from '@/composables/useLeadsPendentesCount'

const route = useRoute()
const leadsPendentes = useLeadsPendentesCount()

// Icon choices mirror design-frame's actual SVGs exactly (verified path-by-path
// against docs/design-frame/index.html) where a design-frame equivalent
// exists; Perfil has no design-frame precedent (added post-launch), so it
// just uses a plain profile icon.
//
// A *ordem* aqui tem de bater com lib/navTabs.ts — é ela que define para que
// lado a tela desliza na troca de aba.
const abas = [
  { nome: 'Home', rota: 'home', icone: House },
  { nome: 'Repres.', rota: 'representantes', icone: Briefcase },
  { nome: 'Cliente', rota: 'clientes', icone: LayoutGrid },
  { nome: 'Leads', rota: 'leads', icone: UserPlus },
  { nome: 'Perfil', rota: 'perfil', icone: User },
] as const

function estaAtiva(nomeRota: string) {
  return route.matched.some((registro) => registro.name === nomeRota)
}
</script>

<template>
  <nav
    class="fixed inset-x-0 bottom-0 z-10 mx-auto flex max-w-shell justify-around border-t border-divider bg-card lg:hidden"
    style="padding-bottom: env(safe-area-inset-bottom)"
  >
    <RouterLink
      v-for="aba in abas"
      :key="aba.rota"
      :to="{ name: aba.rota }"
      class="relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium"
      :class="estaAtiva(aba.rota) ? 'text-primary' : 'text-faint'"
    >
      <span class="relative">
        <component :is="aba.icone" :size="22" />
        <span
          v-if="aba.rota === 'leads' && leadsPendentes > 0"
          class="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold leading-none text-white"
        >
          {{ leadsPendentes }}
        </span>
      </span>
      <span>{{ aba.nome }}</span>
    </RouterLink>
  </nav>
</template>
