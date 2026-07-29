<script setup lang="ts">
defineProps<{ modelValue: string; opcoes: { valor: string; rotulo: string }[] }>()
defineEmits<{ 'update:modelValue': [string] }>()
</script>

<template>
  <div class="flex rounded-btn bg-icon-soft p-1">
    <button
      v-for="opcao in opcoes"
      :key="opcao.valor"
      type="button"
      class="flex-1 rounded-field py-2 text-[13.5px] font-semibold transition-colors"
      :class="modelValue === opcao.valor ? 'bg-card text-primary shadow-card' : 'text-muted'"
      @click="$emit('update:modelValue', opcao.valor)"
    >
      {{ opcao.rotulo }}
    </button>
  </div>
</template>
