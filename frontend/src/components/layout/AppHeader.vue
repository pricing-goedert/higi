<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ArrowLeft } from '@lucide/vue'

defineProps<{ title: string }>()

const router = useRouter()
</script>

<template>
  <header class="sticky top-0 z-10 flex items-center gap-3 bg-bg px-4 py-[18px]">
    <button
      type="button"
      aria-label="Voltar"
      class="flex h-9 w-9 shrink-0 items-center justify-center rounded-btn bg-card text-ink shadow-card"
      @click="router.back()"
    >
      <ArrowLeft :size="20" />
    </button>
    <h1 class="text-[17px] font-semibold text-ink">{{ title }}</h1>
  </header>
</template>
