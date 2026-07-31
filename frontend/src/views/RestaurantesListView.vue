<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ChevronRight, Coffee } from '@lucide/vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import SectionLabel from '@/components/ui/SectionLabel.vue'
import { listIndicacoes } from '@/lib/data'
import type { Indicacao } from '@/types/domain'

const restaurantes = ref<Indicacao[]>([])
const carregando = ref(true)
const erro = ref('')

onMounted(async () => {
  try {
    const todas = await listIndicacoes()
    restaurantes.value = todas
      .filter((indicacao) => indicacao.categoria === 'restaurante')
      .sort((a, b) => (a.distanciaMetros ?? Infinity) - (b.distanciaMetros ?? Infinity))
  } catch {
    erro.value = 'Não foi possível carregar os restaurantes.'
  } finally {
    carregando.value = false
  }
})
</script>

<template>
  <AppHeader title="Restaurantes" />
  <div class="px-4">
    <SectionLabel>Perto do hotel, por distância</SectionLabel>
    <p v-if="erro" class="text-danger">{{ erro }}</p>
    <p v-else-if="carregando" class="text-muted">Carregando...</p>
    <p v-else-if="restaurantes.length === 0" class="text-muted">Nenhum restaurante cadastrado ainda.</p>

    <div class="lg:grid lg:grid-cols-2 lg:gap-3.5 xl:grid-cols-3">
      <RouterLink
        v-for="restaurante in restaurantes"
        :key="restaurante.id"
        :to="{ name: 'restaurante-detalhe', params: { id: restaurante.id } }"
        class="mb-2.5 flex items-center gap-3.5 rounded-card bg-card p-[18px] shadow-card active:opacity-80 lg:mb-0"
      >
        <Coffee :size="24" class="shrink-0 text-ink" />
        <div class="min-w-0 flex-1">
          <div class="truncate text-[15.5px] font-semibold text-ink">{{ restaurante.nome }}</div>
          <div class="mt-1.5 flex items-center gap-2">
            <span
              v-if="restaurante.subcategoria"
              class="rounded-chip bg-icon-soft px-2.5 py-1 text-[12px] font-medium text-primary"
            >
              {{ restaurante.subcategoria }}
            </span>
            <span v-if="restaurante.distanciaMetros != null" class="text-[13px] text-muted">
              {{ restaurante.distanciaMetros }} m
            </span>
          </div>
        </div>
        <ChevronRight :size="20" class="shrink-0 text-faint" />
      </RouterLink>
    </div>
  </div>
</template>
