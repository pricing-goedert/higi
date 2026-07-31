<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Info } from '@lucide/vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import SectionLabel from '@/components/ui/SectionLabel.vue'
import RowCard from '@/components/ui/RowCard.vue'
import { listOrientacoes } from '@/lib/data'
import type { Orientacao } from '@/types/domain'

const todas = ref<Orientacao[]>([])
const carregando = ref(true)
const erro = ref('')

onMounted(async () => {
  try {
    todas.value = await listOrientacoes()
  } catch {
    erro.value = 'Não foi possível carregar as orientações.'
  } finally {
    carregando.value = false
  }
})

const orientacoes = computed(() => [...todas.value].sort((a, b) => a.ordem - b.ordem))
</script>

<template>
  <AppHeader title="Orientações" />
  <div class="px-4">
    <SectionLabel>Informações para a equipe</SectionLabel>
    <p v-if="erro" class="text-danger">{{ erro }}</p>
    <p v-else-if="carregando" class="text-muted">Carregando...</p>
    <p v-else-if="orientacoes.length === 0" class="text-muted">Nenhuma orientação cadastrada ainda.</p>
    <div class="lg:grid lg:grid-cols-2 lg:gap-x-3.5">
      <RowCard
        v-for="orientacao in orientacoes"
        :key="orientacao.id"
        :to="{ name: 'orientacao-detalhe', params: { id: orientacao.id } }"
        :icon="Info"
        :title="orientacao.titulo"
        :subtitle="orientacao.descricao ?? undefined"
      />
    </div>
  </div>
</template>
