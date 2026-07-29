<script setup lang="ts">
import { FileText, Star } from '@lucide/vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import SectionLabel from '@/components/ui/SectionLabel.vue'
import RowCard from '@/components/ui/RowCard.vue'
</script>

<template>
  <AppHeader title="Produtos" />
  <div class="px-4">
    <SectionLabel>Conheça nosso portfólio</SectionLabel>
    <RowCard
      :to="{ name: 'produtos-categorias' }"
      :icon="Star"
      title="Produtos em destaque"
      subtitle="Categorias, linhas e tipos de produtos"
    />
    <!-- No real fichas técnicas URL exists yet — disabled until one does,
         same "coming soon" treatment as Indicações' inactive sub-categories. -->
    <RowCard :icon="FileText" title="Fichas técnicas" subtitle="Documentos completos dos produtos" disabled />
  </div>
</template>
