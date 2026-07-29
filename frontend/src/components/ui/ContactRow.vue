<script setup lang="ts">
import type { Component } from 'vue'

withDefaults(defineProps<{ icon: Component; label: string; value: string; multilinha?: boolean }>(), {
  multilinha: false,
})
</script>

<template>
  <div class="flex items-center gap-3.5 border-b border-divider py-3.5 last:border-0">
    <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-icon-soft text-primary">
      <component :is="icon" :size="20" />
    </div>
    <div class="min-w-0 flex-1">
      <div class="text-[12px] font-medium text-muted">{{ label }}</div>
      <div class="mt-0.5 text-[14.5px] text-ink" :class="multilinha ? 'whitespace-pre-line' : 'truncate'">{{ value }}</div>
    </div>
    <slot />
  </div>
</template>
