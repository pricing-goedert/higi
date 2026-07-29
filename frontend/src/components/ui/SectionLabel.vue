<script setup lang="ts">
defineProps<{ dotClass?: string }>()
</script>

<template>
  <div class="mb-2 mt-6 flex items-center gap-1.5 text-[13px] font-semibold text-ink first:mt-0">
    <span v-if="dotClass" class="h-2 w-2 rounded-full" :class="dotClass" />
    <slot />
  </div>
</template>
