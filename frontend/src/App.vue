<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import BottomNav from '@/components/layout/BottomNav.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import { useAuthStore } from '@/stores/auth'
import { useSyncStore } from '@/stores/sync'
import { enviarPendentes } from '@/lib/outbox'

const route = useRoute()
const auth = useAuthStore()
const sync = useSyncStore()

// Fires on initial load if a session was already restored, and again right
// after a fresh login — the one moment reps are expected to have reliable
// connectivity (see docs/ARCHITECTURE.md's offline layer section). Also
// flushes any leads queued while offline, same as the reconnect handling in
// stores/sync.ts covers for a device that regains connectivity mid-session.
watch(
  () => auth.logado,
  (logado) => {
    if (logado) {
      sync.sincronizar()
      void enviarPendentes()
    }
  },
  { immediate: true },
)

// Tracks live connectivity (online/offline events + a periodic reachability
// ping) and re-syncs the moment the app actually regains a working
// connection — see stores/sync.ts for why this replaced a bare `online`
// listener here.
onMounted(() => sync.iniciarMonitoramento())
onUnmounted(() => sync.pararMonitoramento())
</script>

<template>
  <div v-if="auth.carregando" class="flex min-h-screen items-center justify-center bg-bg">
    <div class="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-primary" />
  </div>

  <RouterView v-else-if="route.meta.admin" />

  <!-- Login: no nav either way, so it keeps the phone-width shell centered on
       every viewport rather than stretching a lone form across a desktop. -->
  <div v-else-if="route.meta.semNav" class="mx-auto min-h-screen max-w-shell bg-bg shadow-shell">
    <RouterView />
  </div>

  <!-- Everything else. Below lg this is byte-for-byte the old shell: a 460px
       column with the bottom nav. From lg up the sidebar takes over (pl-64
       clears its fixed width), the shell stops constraining width, and the
       content re-centers in a wider column. -->
  <template v-else>
    <AppSidebar />
    <div class="mx-auto min-h-screen max-w-shell bg-bg shadow-shell lg:max-w-none lg:pl-64 lg:shadow-none">
      <div class="pb-24 lg:mx-auto lg:max-w-5xl lg:px-6 lg:pb-12">
        <RouterView />
      </div>
      <BottomNav />
    </div>
  </template>
</template>
