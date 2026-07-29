<script setup lang="ts">
import { useRoute } from 'vue-router'
import BottomNav from '@/components/layout/BottomNav.vue'

const route = useRoute()
</script>

<template>
  <div class="relative mx-auto min-h-screen max-w-shell bg-bg shadow-shell">
    <div :class="route.meta.semNav ? '' : 'pb-24'">
      <RouterView />
    </div>
    <BottomNav v-if="!route.meta.semNav" />
  </div>
</template>
