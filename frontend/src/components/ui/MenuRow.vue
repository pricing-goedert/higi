<script setup lang="ts">
import type { Component } from 'vue'
import { ChevronRight } from '@lucide/vue'

defineProps<{
  to: { name: string }
  icon: Component
  label: string
}>()
</script>

<template>
  <!-- Linha de lista agrupada (padrão dos Ajustes de iOS/Android): peso visual
       baixo de propósito, porque a hierarquia da Home é dos Destaques. Quem
       desenha o cartão, o arredondamento e as divisórias é o contêiner —
       aqui é só a linha. -->
  <RouterLink :to="to" class="flex items-center gap-3.5 px-4 py-3.5 transition-colors active:bg-icon-soft">
    <!-- Mesmo chip azul do TileCard (ver o comentário de lá sobre por que a cor
         saiu da chamada e virou fixa), num degrau menor de tamanho. -->
    <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-chip bg-icon-soft text-primary">
      <component :is="icon" :size="18" />
    </span>
    <span class="min-w-0 flex-1 text-[15px] font-medium text-ink">{{ label }}</span>
    <ChevronRight :size="18" class="shrink-0 text-faint" />
  </RouterLink>
</template>
