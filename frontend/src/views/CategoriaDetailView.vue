<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Package } from '@lucide/vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import SectionLabel from '@/components/ui/SectionLabel.vue'
import RowCard from '@/components/ui/RowCard.vue'
import SearchField from '@/components/ui/SearchField.vue'
import { getCategoria, listGrupos, listProdutos, listTipos } from '@/lib/data'
import { correspondeABusca, somenteDigitos } from '@/lib/format'
import type { Categoria, Grupo, Produto, Tipo } from '@/types/domain'

const route = useRoute()
const id = computed(() => route.params.id as string)

const categoria = ref<Categoria | null>(null)
const todosGrupos = ref<Grupo[]>([])
const todosTipos = ref<Tipo[]>([])
const todosProdutos = ref<Produto[]>([])
const carregando = ref(true)
const erro = ref('')
const busca = ref('')

onMounted(async () => {
  try {
    const [cat, grupos, tipos, produtos] = await Promise.all([
      getCategoria(id.value),
      listGrupos(),
      listTipos(),
      listProdutos(),
    ])
    categoria.value = cat
    todosGrupos.value = grupos
    todosTipos.value = tipos
    todosProdutos.value = produtos
  } catch {
    erro.value = 'Não foi possível carregar esta categoria.'
  } finally {
    carregando.value = false
  }
})

const gruposDaCategoria = computed(() => todosGrupos.value.filter((grupo) => grupo.categoriaId === id.value))
// Flat categorias attach tipos directly (no grupo level) — see docs/SPECS.md.
const tiposDiretos = computed(() => todosTipos.value.filter((tipo) => tipo.categoriaId === id.value))

// Every tipo that ultimately belongs to this categoria, whether directly
// (flat categoria) or through one of its grupos — used to scope the
// "search by name or código" box to only this categoria's products.
const idsGruposDaCategoria = computed(() => new Set(gruposDaCategoria.value.map((grupo) => grupo.id)))
const idsTiposDaCategoria = computed(
  () =>
    new Set(
      todosTipos.value
        .filter((tipo) => tipo.categoriaId === id.value || (tipo.grupoId && idsGruposDaCategoria.value.has(tipo.grupoId)))
        .map((tipo) => tipo.id),
    ),
)

function contarProdutos(tipoId: string): number {
  return todosProdutos.value.filter((produto) => produto.tipoId === tipoId).length
}

function linhaOuCategoria(tipo: Tipo): string {
  if (tipo.grupoId) return todosGrupos.value.find((grupo) => grupo.id === tipo.grupoId)?.nome ?? ''
  return categoria.value?.nome ?? ''
}

function subtituloProduto(produto: Produto): string {
  const tipo = todosTipos.value.find((t) => t.id === produto.tipoId)
  return tipo ? `${produto.codigo} — ${linhaOuCategoria(tipo)} · ${tipo.nome}` : produto.codigo
}

const resultadosBusca = computed(() => {
  if (!busca.value.trim()) return []
  const digitos = somenteDigitos(busca.value)
  return todosProdutos.value.filter(
    (produto) =>
      idsTiposDaCategoria.value.has(produto.tipoId) &&
      (correspondeABusca(produto.nome, busca.value) ||
        correspondeABusca(produto.codigo, busca.value) ||
        (digitos && somenteDigitos(produto.codigo).includes(digitos))),
  )
})
</script>

<template>
  <AppHeader :title="categoria?.nome ?? 'Categoria'" />
  <div class="px-4">
    <SearchField v-model="busca" placeholder="Buscar por nome ou código..." />

    <p v-if="erro" class="mt-4 text-danger">{{ erro }}</p>
    <p v-else-if="carregando" class="mt-4 text-muted">Carregando...</p>

    <template v-else-if="busca.trim()">
      <p class="my-3 text-[13.5px] text-muted">
        {{ resultadosBusca.length }} resultado{{ resultadosBusca.length === 1 ? '' : 's' }}
      </p>
      <p v-if="resultadosBusca.length === 0" class="text-muted">Nenhum produto encontrado.</p>
      <RowCard
        v-for="produto in resultadosBusca"
        :key="produto.id"
        :to="{ name: 'produto-detalhe', params: { id: produto.id } }"
        :icon="Package"
        :title="produto.nome"
        :subtitle="subtituloProduto(produto)"
      />
    </template>

    <template v-else-if="gruposDaCategoria.length > 0">
      <SectionLabel>Linhas</SectionLabel>
      <RowCard
        v-for="grupo in gruposDaCategoria"
        :key="grupo.id"
        :to="{ name: 'grupo-detalhe', params: { id: grupo.id } }"
        :icon="Package"
        :title="grupo.nome"
      />
    </template>

    <template v-else>
      <SectionLabel>Tipos</SectionLabel>
      <p v-if="tiposDiretos.length === 0" class="text-muted">Nenhum tipo cadastrado ainda.</p>
      <RowCard
        v-for="tipo in tiposDiretos"
        :key="tipo.id"
        :to="{ name: 'tipo-detalhe', params: { id: tipo.id } }"
        :icon="Package"
        :title="tipo.nome"
        :subtitle="`${contarProdutos(tipo.id)} produto${contarProdutos(tipo.id) === 1 ? '' : 's'}`"
      />
    </template>
  </div>
</template>
