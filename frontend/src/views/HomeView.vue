<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Briefcase, Calendar, Info, LayoutGrid, Map, Package, RefreshCw, Search, Settings, Star, UserPlus } from '@lucide/vue'
import SectionLabel from '@/components/ui/SectionLabel.vue'
import MenuCard from '@/components/ui/MenuCard.vue'
import { useAuthStore } from '@/stores/auth'
import { useSyncStore } from '@/stores/sync'
import { somenteDigitos, tempoRelativo } from '@/lib/format'

const router = useRouter()
const buscaGlobal = ref('')
const sync = useSyncStore()
const auth = useAuthStore()

// `conectadoServidor === null` means "not checked yet" — deliberately not
// treated as offline, so a fresh page load doesn't flash a false banner
// before the first reachability check resolves.
const semConexao = computed(() => !sync.online || sync.conectadoServidor === false)

// "routes to client or representative results depending on what's typed"
// (docs/SPECS.md) — a CNPJ-shaped (mostly numeric) query means client
// lookup, anything else is treated as a representante name/city search.
function buscar() {
  const texto = buscaGlobal.value.trim()
  if (!texto) return
  if (somenteDigitos(texto).length >= 4) {
    router.push({ name: 'clientes-lista', query: { cnpj: texto } })
  } else {
    router.push({ name: 'representantes-lista', query: { q: texto } })
  }
}

const slides = [
  { to: { name: 'mapa' }, icon: Map, titulo: 'Mapa da Feira 2026', texto: 'Confira a localização dos estandes' },
  { to: { name: 'leads' }, icon: UserPlus, titulo: 'Cadastre um Lead', texto: 'Registre novos clientes durante a feira' },
  { to: { name: 'programacao' }, icon: Calendar, titulo: 'Programação da Feira', texto: 'Palestras e atrações do dia' },
]

const carrosselRef = ref<HTMLElement | null>(null)
const slideAtivo = ref(0)

function aoRolar() {
  const el = carrosselRef.value
  if (!el || el.clientWidth === 0) return
  slideAtivo.value = Math.round(el.scrollLeft / el.clientWidth)
}
</script>

<template>
  <div class="rounded-b-hero bg-primary px-4 pb-9 pt-7 text-white">
    <h1 class="text-[20px] font-bold">GoHub Higiexpo</h1>
    <p class="mt-1 text-[14px] text-white/75">Nossa central de atendimento Goedert na palma da sua mão</p>
  </div>

  <form class="-mt-7 px-4" @submit.prevent="buscar">
    <div class="flex h-14 items-center gap-2.5 rounded-search bg-card px-4 shadow-search">
      <Search :size="20" class="shrink-0 text-faint" />
      <input
        v-model="buscaGlobal"
        placeholder="Buscar representante, cliente..."
        class="w-full bg-transparent text-ink outline-none placeholder:text-faint"
      />
    </div>
  </form>

  <div class="px-4">
    <button
      type="button"
      :disabled="sync.sincronizando"
      class="mb-4 mt-4 flex w-full items-center justify-between rounded-field bg-icon-soft px-3.5 py-2.5 text-left disabled:opacity-70"
      @click="sync.sincronizar()"
    >
      <span class="text-[13px]" :class="semConexao ? 'text-danger' : 'text-primary'">
        <template v-if="sync.sincronizando">Atualizando dados...</template>
        <template v-else-if="semConexao">Sem conexão</template>
        <template v-else-if="sync.erro">{{ sync.erro }}</template>
        <template v-else-if="sync.ultimaSincronizacao">Dados atualizados {{ tempoRelativo(sync.ultimaSincronizacao) }}</template>
        <template v-else>Dados ainda não sincronizados</template>
      </span>
      <RefreshCw :size="16" class="shrink-0 text-primary" :class="sync.sincronizando ? 'animate-spin' : ''" />
    </button>

    <SectionLabel>Destaques</SectionLabel>
    <div ref="carrosselRef" class="no-scrollbar flex snap-x snap-mandatory gap-3.5 overflow-x-auto" @scroll="aoRolar">
      <RouterLink
        v-for="slide in slides"
        :key="slide.titulo"
        :to="slide.to"
        class="flex w-full shrink-0 snap-start flex-col gap-1.5 rounded-card bg-primary p-5 text-white"
      >
        <component :is="slide.icon" :size="28" class="text-white/90" />
        <h3 class="text-[15.5px] font-semibold">{{ slide.titulo }}</h3>
        <p class="text-[13px] text-white/75">{{ slide.texto }}</p>
        <small class="mt-1 text-[11.5px] text-white/55">Toque para abrir</small>
      </RouterLink>
    </div>
    <div class="mt-3 flex justify-center gap-1.5">
      <div
        v-for="(slide, i) in slides"
        :key="slide.titulo"
        class="h-1.5 w-1.5 rounded-full transition-colors"
        :class="i === slideAtivo ? 'bg-primary' : 'bg-divider'"
      />
    </div>

    <SectionLabel dot-class="bg-comercial">Comercial</SectionLabel>
    <div class="grid grid-cols-2 gap-4">
      <MenuCard :to="{ name: 'representantes' }" :icon="Briefcase" icon-class="bg-comercial-soft text-comercial">
        Pesquisa de<br />Representante
      </MenuCard>
      <MenuCard :to="{ name: 'clientes' }" :icon="LayoutGrid" icon-class="bg-comercial-soft text-comercial">
        Pesquisa de<br />Cliente
      </MenuCard>
      <MenuCard :to="{ name: 'leads' }" :icon="UserPlus" icon-class="bg-comercial-soft text-comercial">
        Cadastro de<br />Leads
      </MenuCard>
    </div>

    <SectionLabel dot-class="bg-produtos">Produtos</SectionLabel>
    <div class="grid grid-cols-2 gap-4">
      <MenuCard :to="{ name: 'produtos' }" :icon="Package" icon-class="bg-produtos-soft text-produtos" full-width>
        Consulta de Produtos
      </MenuCard>
    </div>

    <SectionLabel dot-class="bg-conteudo">Conteúdo</SectionLabel>
    <div class="grid grid-cols-2 gap-4 pb-2">
      <MenuCard :to="{ name: 'programacao' }" :icon="Calendar" icon-class="bg-conteudo-soft text-conteudo">
        Programação<br />da Feira
      </MenuCard>
      <MenuCard :to="{ name: 'mapa' }" :icon="Map" icon-class="bg-conteudo-soft text-conteudo">
        Mapa da<br />Feira
      </MenuCard>
      <MenuCard :to="{ name: 'indicacoes' }" :icon="Star" icon-class="bg-conteudo-soft text-conteudo">
        Indicações
      </MenuCard>
      <MenuCard :to="{ name: 'orientacoes' }" :icon="Info" icon-class="bg-conteudo-soft text-conteudo">
        Orientações
      </MenuCard>
    </div>

    <template v-if="auth.usuario?.isAdmin">
      <SectionLabel dot-class="bg-comercial">Administração</SectionLabel>
      <div class="grid grid-cols-2 gap-4 pb-2">
        <MenuCard :to="{ name: 'admin-usuarios' }" :icon="Settings" icon-class="bg-comercial-soft text-comercial" full-width>
          Gestão de Conteúdo
        </MenuCard>
      </div>
    </template>
  </div>
</template>
