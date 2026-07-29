<script setup lang="ts">
import { Search } from '@lucide/vue'

defineProps<{ modelValue: string; placeholder?: string }>()
defineEmits<{ 'update:modelValue': [string] }>()
</script>

<template>
  <div class="flex h-14 items-center gap-2.5 rounded-search border-[1.5px] border-divider bg-card px-4">
    <Search :size="18" class="shrink-0 text-faint" />
    <input
      :value="modelValue"
      :placeholder="placeholder"
      class="w-full bg-transparent text-ink outline-none placeholder:text-faint"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
  </div>
</template>
