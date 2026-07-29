<script setup lang="ts">
import { computed } from 'vue'
import { iniciais } from '@/lib/format'

const props = withDefaults(defineProps<{ nome: string; size?: number }>(), { size: 48 })

const texto = computed(() => iniciais(props.nome))
</script>

<template>
  <div
    class="flex shrink-0 items-center justify-center rounded-full bg-icon-soft font-semibold text-primary"
    :style="{ width: `${size}px`, height: `${size}px`, fontSize: `${Math.round(size * 0.33)}px` }"
  >
    {{ texto }}
  </div>
</template>
