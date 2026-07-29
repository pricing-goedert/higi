<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Package } from '@lucide/vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import SectionLabel from '@/components/ui/SectionLabel.vue'
import RowCard from '@/components/ui/RowCard.vue'
import { getGrupo, listProdutos, listTipos } from '@/lib/data'
import type { Grupo, Produto, Tipo } from '@/types/domain'

const route = useRoute()
const id = computed(() => route.params.id as string)

const grupo = ref<Grupo | null>(null)
const todosTipos = ref<Tipo[]>([])
const todosProdutos = ref<Produto[]>([])
const carregando = ref(true)
const erro = ref('')

onMounted(async () => {
  try {
    const [g, tipos, produtos] = await Promise.all([getGrupo(id.value), listTipos(), listProdutos()])
    grupo.value = g
    todosTipos.value = tipos
    todosProdutos.value = produtos
  } catch {
    erro.value = 'Não foi possível carregar esta linha.'
  } finally {
    carregando.value = false
  }
})

const tipos = computed(() => todosTipos.value.filter((tipo) => tipo.grupoId === id.value))

function contarProdutos(tipoId: string): number {
  return todosProdutos.value.filter((produto) => produto.tipoId === tipoId).length
}
</script>

<template>
  <AppHeader :title="grupo?.nome ?? 'Linha'" />
  <div class="px-4">
    <SectionLabel>Tipos</SectionLabel>
    <p v-if="erro" class="text-danger">{{ erro }}</p>
    <p v-else-if="carregando" class="text-muted">Carregando...</p>
    <p v-else-if="tipos.length === 0" class="text-muted">Nenhum tipo cadastrado ainda.</p>
    <RowCard
      v-for="tipo in tipos"
      :key="tipo.id"
      :to="{ name: 'tipo-detalhe', params: { id: tipo.id } }"
      :icon="Package"
      :title="tipo.nome"
      :subtitle="`${contarProdutos(tipo.id)} produto${contarProdutos(tipo.id) === 1 ? '' : 's'}`"
    />
  </div>
</template>
