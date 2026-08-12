<script setup lang="ts">
import type { Component } from 'vue'
import { ChevronRight } from '@lucide/vue'
import Avatar from './Avatar.vue'

withDefaults(
  defineProps<{
    to?: string | { name: string; params?: Record<string, string>; query?: Record<string, string> }
    title: string
    subtitle?: string
    avatarNome?: string
    /**
     * Bare icon (design-frame's catalog/hub rows) — an alternative to avatarNome's initials circle.
     *
     * Pintado em text-primary, não text-ink: sem o círculo de fundo do Avatar, o
     * azul é o que separa o ícone do título ao lado (também text-ink) e o mantém
     * no mesmo padrão dos chips do TileCard/MenuRow. É o que o design-frame faz
     * em indicacoes.html, onde estes mesmos ícones vivem num .icon-circle azul.
     */
    icon?: Component
    disabled?: boolean
  }>(),
  { disabled: false },
)
</script>

<template>
  <component
    :is="disabled ? 'div' : 'RouterLink'"
    :to="disabled ? undefined : to"
    class="mb-2.5 flex items-center gap-3.5 rounded-card bg-card p-18px shadow-card"
    :class="disabled ? 'opacity-55' : 'active:opacity-80'"
  >
    <Avatar v-if="avatarNome" :nome="avatarNome" />
    <component :is="icon" v-else-if="icon" :size="24" class="shrink-0 text-primary" />
    <div class="min-w-0 flex-1">
      <div class="truncate text-[15.5px] font-semibold text-ink">{{ title }}</div>
      <div v-if="subtitle" class="mt-0.5 truncate text-[13.5px] text-muted">{{ subtitle }}</div>
    </div>
    <ChevronRight v-if="!disabled" :size="20" class="shrink-0 text-faint" />
  </component>
</template>
