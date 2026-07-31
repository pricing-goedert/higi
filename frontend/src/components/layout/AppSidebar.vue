<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { House, Briefcase, LayoutGrid, UserPlus, User, RefreshCw } from '@lucide/vue'
import { useLeadsPendentesCount } from '@/composables/useLeadsPendentesCount'
import { useSyncStore } from '@/stores/sync'
import { tempoRelativo } from '@/lib/format'

const route = useRoute()
const sync = useSyncStore()
const leadsPendentes = useLeadsPendentesCount()

// Same five destinations as BottomNav, in the same order — the two are the
// mobile and desktop faces of one navigation, so a route added to one has to
// be added to the other. Kept as separate components rather than one
// responsive component because the layouts share no markup: a horizontal
// icon-over-label strip versus a vertical icon-beside-label list.
const abas = [
  { nome: 'Home', rota: 'home', icone: House },
  { nome: 'Representantes', rota: 'representantes', icone: Briefcase },
  { nome: 'Clientes', rota: 'clientes', icone: LayoutGrid },
  { nome: 'Leads', rota: 'leads', icone: UserPlus },
  { nome: 'Perfil', rota: 'perfil', icone: User },
] as const

function estaAtiva(nomeRota: string) {
  return route.matched.some((registro) => registro.name === nomeRota)
}

// Mirrors HomeView's sync line: `conectadoServidor === null` is "not checked
// yet", deliberately not rendered as offline so a fresh load doesn't flash a
// false warning.
const semConexao = computed(() => !sync.online || sync.conectadoServidor === false)
</script>

<template>
  <aside class="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-divider bg-card lg:flex">
    <div class="px-6 py-7">
      <h1 class="text-[17px] font-bold text-primary">GoHub Higiexpo</h1>
      <p class="mt-1 text-[12.5px] text-muted">Central de atendimento</p>
    </div>

    <nav class="flex flex-1 flex-col gap-1 px-3">
      <RouterLink
        v-for="aba in abas"
        :key="aba.rota"
        :to="{ name: aba.rota }"
        class="flex items-center gap-3 rounded-field px-3 py-2.5 text-[14.5px] font-medium transition-colors"
        :class="estaAtiva(aba.rota) ? 'bg-icon-soft text-primary' : 'text-muted hover:bg-bg hover:text-ink'"
      >
        <component :is="aba.icone" :size="20" class="shrink-0" />
        <span class="flex-1">{{ aba.nome }}</span>
        <span
          v-if="aba.rota === 'leads' && leadsPendentes > 0"
          class="flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-[11px] font-semibold leading-none text-white"
        >
          {{ leadsPendentes }}
        </span>
      </RouterLink>
    </nav>

    <div class="p-3">
      <button
        type="button"
        :disabled="sync.sincronizando"
        class="flex w-full items-center justify-between gap-2 rounded-field bg-bg px-3 py-2.5 text-left disabled:opacity-70"
        @click="sync.sincronizar()"
      >
        <span class="text-[12.5px] leading-snug" :class="semConexao ? 'text-danger' : 'text-primary'">
          <template v-if="sync.sincronizando">Atualizando dados...</template>
          <template v-else-if="semConexao">Sem conexão</template>
          <template v-else-if="sync.erro">{{ sync.erro }}</template>
          <template v-else-if="sync.ultimaSincronizacao">Atualizado {{ tempoRelativo(sync.ultimaSincronizacao) }}</template>
          <template v-else>Não sincronizado</template>
        </span>
        <RefreshCw :size="15" class="shrink-0 text-primary" :class="sync.sincronizando ? 'animate-spin' : ''" />
      </button>
    </div>
  </aside>
</template>
