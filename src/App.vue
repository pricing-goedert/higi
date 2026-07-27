<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
</script>

<template>
  <div class="min-h-screen bg-slate-50 font-sans pb-12">
    <AppHeader />
    <RouterView />
  </div>
</template>
