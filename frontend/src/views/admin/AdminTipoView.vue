<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/lib/api'
import AdminCrudView, { type CampoForm, type ColunaTabela } from '@/components/admin/AdminCrudView.vue'
import type { Tipo } from '@/types/domain'

const route = useRoute()
const tipoId = route.params.tipoId as string
const tipo = ref<Tipo | null>(null)

onMounted(async () => {
  tipo.value = await api.get<Tipo>(`/tipos/${tipoId}`)
})

const campos: CampoForm[] = [
  { chave: 'codigo', rotulo: 'Código', obrigatorio: true },
  { chave: 'nome', rotulo: 'Nome', obrigatorio: true },
  { chave: 'descricao', rotulo: 'Descrição', tipo: 'textarea' },
  { chave: 'quantidadeCaixa', rotulo: 'Quantidade por caixa', tipo: 'numero' },
  { chave: 'dimensoes', rotulo: 'Dimensões' },
  { chave: 'composicao', rotulo: 'Composição' },
  { chave: 'foto', rotulo: 'URL da foto' },
]
const colunas: ColunaTabela[] = [
  { rotulo: 'Código', valor: (i) => i.codigo as string },
  { rotulo: 'Nome', valor: (i) => i.nome as string },
]
function itemVazio() {
  return {
    codigo: '',
    nome: '',
    descricao: null,
    quantidadeCaixa: null,
    dimensoes: null,
    composicao: null,
    foto: null,
    tipoId,
  }
}
function filtro(item: Record<string, unknown>) {
  return item.tipoId === tipoId
}
</script>

<template>
  <div>
    <RouterLink
      v-if="tipo?.grupoId"
      :to="{ name: 'admin-produtos-grupo', params: { grupoId: tipo.grupoId } }"
      class="mb-3 inline-block text-[0.85rem] text-primary no-underline"
    >
      &larr; Voltar
    </RouterLink>
    <RouterLink
      v-else-if="tipo?.categoriaId"
      :to="{ name: 'admin-produtos-categoria', params: { categoriaId: tipo.categoriaId } }"
      class="mb-3 inline-block text-[0.85rem] text-primary no-underline"
    >
      &larr; Voltar
    </RouterLink>
    <h2 class="mb-4 text-[1.05rem] font-bold text-ink">{{ tipo?.nome }}</h2>
    <AdminCrudView rotulo-item="Produto" api-base="/produtos" :colunas="colunas" :campos="campos" :item-vazio="itemVazio" :filtro="filtro" />
  </div>
</template>
