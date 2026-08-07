<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Calendar, Info, Map, Package, RefreshCw, Search, Settings, Star } from '@lucide/vue'
import SectionLabel from '@/components/ui/SectionLabel.vue'
import HeroCard from '@/components/ui/HeroCard.vue'
import MenuRow from '@/components/ui/MenuRow.vue'
import TileCard from '@/components/ui/TileCard.vue'
import { useAuthStore } from '@/stores/auth'
import { useSyncStore } from '@/stores/sync'
import { somenteDigitos, tempoRelativo } from '@/lib/format'

// Fotos do estande, importadas (e não referenciadas por caminho) para o Vite
// as versionar no build e o precache do workbox as pegar junto com o resto do
// shell — o glob de vite.config.ts já inclui jpg.
//
// JPEG a 1200px de largura, não os PNG originais de 1535px/~1,8 MB: PNG é
// formato para gráfico com área plana, e usá-lo em fotografia custava 5,3 MB
// dos 7,3 MB do precache — download que o rep paga na rede da feira só para
// preencher um card de 128px de altura. 1200px cobre um card de 430px em tela
// de até ~2,8x, que é onde a foto aparece nítida e em cores no estado ativo.
// Os PNG seguem na pasta como original de trabalho, sem entrar no bundle
// (o Vite só emite o que é importado).
import fotoRepresentante from '@/components/images/pesquisa_representante.jpg'
import fotoCliente from '@/components/images/pesquisa_cliente.jpg'
import fotoLead from '@/components/images/cadastro_lead.jpg'

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

// "Consulta de Produtos" e "Programação da Feira" saíram da lista linear: são
// os dois que o rep abre de pé, andando pela feira, e como linha de menu
// ficavam com o mesmo peso de Orientações. Viram dois cards em coluna, um
// degrau abaixo dos Destaques.
const cardsSecundarios = [
  { to: { name: 'produtos' }, icon: Package, label: 'Consulta de Produtos' },
  { to: { name: 'programacao' }, icon: Calendar, label: 'Programação da Feira' },
]

// O resto segue em lista agrupada. Continua com ícone (é o que faz uma lista
// dessas ser varrida com o olho em vez de lida linha a linha), agora todos no
// mesmo azul: as cores por assunto que a Home herdou do design-frame — verde
// para Produtos, âmbar para Conteúdo — agrupavam visualmente coisas que os
// próprios rótulos já separam, e eram a única exceção ao azul do app.
const atalhos = [
  { to: { name: 'mapa' }, icon: Map, label: 'Mapa da Feira' },
  { to: { name: 'indicacoes' }, icon: Star, label: 'Indicações' },
  { to: { name: 'orientacoes' }, icon: Info, label: 'Orientações' },
]
</script>

<template>
  <!-- Cabeçalho: título, subtítulo, busca e status de sincronização moram todos
       dentro do mesmo bloco primário. Antes a busca era um cartão solto puxado
       para cima com -mt-7, atravessando a borda arredondada do bloco — em tela
       estreita ela aparecia cortada. -->
  <header class="rounded-b-hero bg-primary px-4 pb-4 pt-7 text-white">
    <h1 class="text-[21px] font-bold leading-tight">GoHub Higiexpo</h1>
    <p class="mt-1 text-[13.5px] leading-snug text-white/70">
      Nossa central de atendimento Goedert na palma da sua mão
    </p>

    <form class="mt-4" @submit.prevent="buscar">
      <div class="flex h-14 items-center gap-2.5 rounded-search bg-card px-4 shadow-search">
        <Search :size="20" class="shrink-0 text-faint" />
        <input
          v-model="buscaGlobal"
          enterkeyhint="search"
          autocomplete="off"
          placeholder="Buscar representante, cliente..."
          class="w-full min-w-0 bg-transparent text-ink outline-hidden placeholder:text-faint"
        />
      </div>
    </form>

    <!-- Dentro do cabeçalho, e não no corpo da página, para o corpo começar
         direto nos Destaques. No desktop o AppSidebar tem o seu próprio. -->
    <button
      type="button"
      :disabled="sync.sincronizando"
      class="mt-3 flex w-full items-center justify-between gap-2 rounded-field bg-white/10 px-3.5 py-2 text-left disabled:opacity-70 lg:hidden"
      @click="sync.sincronizar({ forcar: true })"
    >
      <span class="text-[12.5px]" :class="semConexao ? 'text-red-300' : 'text-white/70'">
        <template v-if="sync.sincronizando">Atualizando dados...</template>
        <template v-else-if="semConexao">Sem conexão</template>
        <template v-else-if="sync.erro">{{ sync.erro }}</template>
        <!-- Só o download das fotos é lento o bastante para o rep precisar
             saber que ainda está rolando — é o que faltava para dar pra
             confiar que o catálogo está pronto antes de perder a conexão. -->
        <template v-else-if="sync.baixandoFotos">Baixando fotos... {{ sync.fotosBaixadas }}/{{ sync.fotosTotal }}</template>
        <template v-else-if="sync.ultimaSincronizacao">Dados atualizados {{ tempoRelativo(sync.ultimaSincronizacao) }}</template>
        <template v-else>Dados ainda não sincronizados</template>
      </span>
      <RefreshCw
        :size="15"
        class="shrink-0 text-white/70"
        :class="sync.sincronizando || sync.baixandoFotos ? 'animate-spin' : ''"
      />
    </button>
  </header>

  <div class="px-4 pt-5 pb-2">
    <!-- Os três recursos que existem para ser usados de pé, no estande. São a
         peça central da tela: full-width, altura de sobra para o polegar, e
         Leads com mais altura ainda porque é o único dos três que gera dado
         novo. Empilhados em vez de em grade — grade de três em 460px produz
         exatamente o card espremido que essa tela tinha antes. -->
    <SectionLabel>Destaques</SectionLabel>
    <div class="flex flex-col gap-3 lg:grid lg:grid-cols-3">
      <HeroCard
        :to="{ name: 'representantes' }"
        titulo="Pesquisa de Representante"
        :imagem="fotoRepresentante"
      />
      <HeroCard :to="{ name: 'clientes' }" titulo="Pesquisa de Cliente" :imagem="fotoCliente" />
      <HeroCard :to="{ name: 'leads' }" titulo="Cadastro de Leads" :imagem="fotoLead" principal />
    </div>

    <SectionLabel>Mais recursos</SectionLabel>
    <div class="grid grid-cols-2 gap-3">
      <TileCard
        v-for="card in cardsSecundarios"
        :key="card.label"
        :to="card.to"
        :icon="card.icon"
        :label="card.label"
      />
    </div>

    <!-- mt-3 e não um SectionLabel novo: é a continuação de "Mais recursos", e
         um rótulo aqui criaria hierarquia que não existe. -->
    <div class="mt-3 divide-y divide-divider overflow-hidden rounded-card bg-card shadow-card">
      <MenuRow
        v-for="atalho in atalhos"
        :key="atalho.label"
        :to="atalho.to"
        :icon="atalho.icon"
        :label="atalho.label"
      />
    </div>

    <template v-if="auth.usuario?.isAdmin">
      <SectionLabel>Administração</SectionLabel>
      <div class="divide-y divide-divider overflow-hidden rounded-card bg-card shadow-card">
        <MenuRow
          :to="{ name: 'admin-usuarios' }"
          :icon="Settings"
          label="Gestão de Conteúdo"
        />
      </div>
    </template>
  </div>
</template>
