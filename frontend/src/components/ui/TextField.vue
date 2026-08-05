<script setup lang="ts">
import { computed, ref } from 'vue'
import { Eye, EyeOff } from '@lucide/vue'

const props = withDefaults(defineProps<{ modelValue: string; label?: string; placeholder?: string; type?: string }>(), {
  type: 'text',
})
defineEmits<{ 'update:modelValue': [string] }>()

const senhaVisivel = ref(false)
const isPassword = computed(() => props.type === 'password')
const tipoInput = computed(() => (isPassword.value && senhaVisivel.value ? 'text' : props.type))
</script>

<template>
  <div>
    <label v-if="label" class="mb-1.5 block text-[13px] font-semibold text-muted">{{ label }}</label>
    <div class="relative">
      <input
        :type="tipoInput"
        :value="modelValue"
        :placeholder="placeholder"
        class="h-14 w-full rounded-field border-[1.5px] border-divider bg-card px-3.5 text-ink outline-hidden focus:border-primary focus:shadow-focus-ring"
        :class="isPassword ? 'pr-11' : ''"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
      <button
        v-if="isPassword"
        type="button"
        tabindex="-1"
        class="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-faint"
        :aria-label="senhaVisivel ? 'Ocultar senha' : 'Mostrar senha'"
        @click="senhaVisivel = !senhaVisivel"
      >
        <EyeOff v-if="senhaVisivel" :size="18" />
        <Eye v-else :size="18" />
      </button>
    </div>
  </div>
</template>
