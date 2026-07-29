<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Package } from '@lucide/vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import SectionLabel from '@/components/ui/SectionLabel.vue'
import RowCard from '@/components/ui/RowCard.vue'
import { listCategorias } from '@/lib/data'
import type { Categoria } from '@/types/domain'

const categorias = ref<Categoria[]>([])
const carregando = ref(true)
const erro = ref('')

onMounted(async () => {
  try {
    categorias.value = await listCategorias()
  } catch {
    erro.value = 'Não foi possível carregar as categorias.'
  } finally {
    carregando.value = false
  }
})
</script>

<template>
  <AppHeader title="Produtos em destaque" />
  <div class="px-4">
    <SectionLabel>Categorias</SectionLabel>
    <p v-if="erro" class="text-danger">{{ erro }}</p>
    <p v-else-if="carregando" class="text-muted">Carregando...</p>
    <p v-else-if="categorias.length === 0" class="text-muted">Nenhuma categoria cadastrada ainda.</p>
    <RowCard
      v-for="categoria in categorias"
      :key="categoria.id"
      :to="{ name: 'categoria-detalhe', params: { id: categoria.id } }"
      :icon="Package"
      :title="categoria.nome"
      :subtitle="categoria.descricao ?? undefined"
    />
  </div>
</template>
