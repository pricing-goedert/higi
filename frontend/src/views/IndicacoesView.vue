<script setup lang="ts">
import { Coffee, Navigation, ShoppingBag, Star } from '@lucide/vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import SectionLabel from '@/components/ui/SectionLabel.vue'
import RowCard from '@/components/ui/RowCard.vue'
</script>

<template>
  <AppHeader title="Indicações" />
  <div class="px-4">
    <SectionLabel>O que você procura?</SectionLabel>
    <div class="lg:grid lg:grid-cols-2 lg:gap-x-3.5">
      <RowCard
        :to="{ name: 'indicacoes-restaurantes' }"
        :icon="Coffee"
        title="Restaurantes"
        subtitle="Perto do hotel, por distância"
      />
      <RowCard :icon="ShoppingBag" title="Farmácias e Mercados" subtitle="Em breve" disabled />
      <RowCard :icon="Navigation" title="Transporte" subtitle="Em breve" disabled />
      <RowCard :icon="Star" title="Passeios" subtitle="Em breve" disabled />
    </div>
  </div>
</template>
