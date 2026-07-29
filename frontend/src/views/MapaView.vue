<script setup lang="ts">
import { ref } from 'vue'
import { Minus, Plus } from '@lucide/vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import mapaFeira from '@/assets/mapa-feira.jpg'

// Real zoom, not decorative buttons — docs/PLAN.md explicitly flags the
// static design-frame's zoom buttons as non-functional and calls out real
// pinch-zoom/pan as something the actual build needs to implement.
const ZOOM_MIN = 1
const ZOOM_MAX = 3
const ZOOM_PASSO = 0.5

const zoom = ref(ZOOM_MIN)

function aumentar() {
  zoom.value = Math.min(ZOOM_MAX, zoom.value + ZOOM_PASSO)
}
function diminuir() {
  zoom.value = Math.max(ZOOM_MIN, zoom.value - ZOOM_PASSO)
}
</script>

<template>
  <AppHeader title="Mapa da Feira" />
  <div class="px-4">
    <div class="mb-3 flex justify-end gap-2">
      <button
        type="button"
        aria-label="Diminuir zoom"
        class="flex h-10 w-10 items-center justify-center rounded-btn bg-card text-ink shadow-card disabled:opacity-40"
        :disabled="zoom <= ZOOM_MIN"
        @click="diminuir"
      >
        <Minus :size="18" />
      </button>
      <button
        type="button"
        aria-label="Aumentar zoom"
        class="flex h-10 w-10 items-center justify-center rounded-btn bg-card text-ink shadow-card disabled:opacity-40"
        :disabled="zoom >= ZOOM_MAX"
        @click="aumentar"
      >
        <Plus :size="18" />
      </button>
    </div>
    <div class="max-h-[70vh] overflow-auto rounded-card shadow-card">
      <img
        :src="mapaFeira"
        alt="Mapa da feira"
        class="max-w-none transition-[width] duration-150"
        :style="{ width: `${zoom * 100}%` }"
      />
    </div>
  </div>
</template>
