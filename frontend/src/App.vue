<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import BottomNav from '@/components/layout/BottomNav.vue'
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
  <RouterView v-if="route.meta.admin" />
  <div v-else class="relative mx-auto min-h-screen max-w-shell bg-bg shadow-shell">
    <div :class="route.meta.semNav ? '' : 'pb-24'">
      <RouterView />
    </div>
    <BottomNav v-if="!route.meta.semNav" />
  </div>
</template>
