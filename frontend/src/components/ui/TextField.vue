<script setup lang="ts">
withDefaults(defineProps<{ modelValue: string; label?: string; placeholder?: string; type?: string }>(), {
  type: 'text',
})
defineEmits<{ 'update:modelValue': [string] }>()
</script>

<template>
  <div>
    <label v-if="label" class="mb-1.5 block text-[13px] font-semibold text-muted">{{ label }}</label>
    <input
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      class="h-14 w-full rounded-field border-[1.5px] border-divider bg-card px-3.5 text-ink outline-none focus:border-primary focus:shadow-focus-ring"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
  </div>
</template>
