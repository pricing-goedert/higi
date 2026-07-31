<script setup lang="ts">
import type { Component } from 'vue'

withDefaults(
  defineProps<{
    to: { name: string }
    icon: Component
    iconClass: string
    fullWidth?: boolean
  }>(),
  { fullWidth: false },
)
</script>

<template>
  <RouterLink
    :to="to"
    class="flex flex-col items-center justify-center gap-2.5 rounded-card bg-card p-[18px] text-center shadow-card active:opacity-80"
    :class="fullWidth ? 'col-span-2 flex-row justify-start text-left lg:col-span-4' : ''"
  >
    <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full" :class="iconClass">
      <component :is="icon" :size="24" />
    </div>
    <span class="text-[13.5px] font-medium leading-tight text-ink"><slot /></span>
  </RouterLink>
</template>
