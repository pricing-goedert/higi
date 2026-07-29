<script setup lang="ts">
defineProps<{ modelValue: string; label?: string; opcoes: readonly string[]; placeholder?: string }>()
defineEmits<{ 'update:modelValue': [string] }>()
</script>

<template>
  <div>
    <label v-if="label" class="mb-1.5 block text-[13px] font-semibold text-muted">{{ label }}</label>
    <select
      :value="modelValue"
      class="h-14 w-full rounded-field border-[1.5px] border-divider bg-card px-3.5 text-ink outline-none focus:border-primary focus:shadow-focus-ring"
      @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option value="">{{ placeholder ?? 'Selecione' }}</option>
      <option v-for="opcao in opcoes" :key="opcao" :value="opcao">{{ opcao }}</option>
    </select>
  </div>
</template>
