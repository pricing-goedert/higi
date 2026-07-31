<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Package } from '@lucide/vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import RowCard from '@/components/ui/RowCard.vue'
import { getCategoria, getGrupo, getTipo, listProdutos } from '@/lib/data'
import type { Produto, Tipo } from '@/types/domain'

const route = useRoute()
const id = computed(() => route.params.id as string)

const tipo = ref<Tipo | null>(null)
const linhaNome = ref('')
const produtos = ref<Produto[]>([])
const carregando = ref(true)
const erro = ref('')

onMounted(async () => {
  try {
    const [t, todosProdutos] = await Promise.all([getTipo(id.value), listProdutos()])
    tipo.value = t
    produtos.value = todosProdutos.filter((produto) => produto.tipoId === t.id)
    if (t.grupoId) {
      linhaNome.value = (await getGrupo(t.grupoId)).nome
    } else if (t.categoriaId) {
      linhaNome.value = (await getCategoria(t.categoriaId)).nome
    }
  } catch {
    erro.value = 'Não foi possível carregar este tipo.'
  } finally {
    carregando.value = false
  }
})

function subtitulo(produto: Produto): string {
  return `${produto.codigo} — ${linhaNome.value} · ${tipo.value?.nome ?? ''}`
}
</script>

<template>
  <AppHeader :title="tipo?.nome ?? 'Tipo'" />
  <div class="px-4">
    <p v-if="erro" class="text-danger">{{ erro }}</p>
    <p v-else-if="carregando" class="text-muted">Carregando...</p>
    <template v-else>
      <p class="mb-3 text-[13.5px] text-muted">{{ produtos.length }} produto{{ produtos.length === 1 ? '' : 's' }}</p>
      <p v-if="produtos.length === 0" class="text-muted">Nenhum produto cadastrado ainda.</p>
      <div class="lg:grid lg:grid-cols-2 lg:gap-x-3.5 xl:grid-cols-3">
        <RowCard
          v-for="produto in produtos"
          :key="produto.id"
          :to="{ name: 'produto-detalhe', params: { id: produto.id } }"
          :icon="Package"
          :title="produto.nome"
          :subtitle="subtitulo(produto)"
        />
      </div>
    </template>
  </div>
</template>
