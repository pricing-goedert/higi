<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Clock, Coffee, Map, MapPin, Phone } from '@lucide/vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import ContactRow from '@/components/ui/ContactRow.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { getIndicacao } from '@/lib/data'
import type { Indicacao } from '@/types/domain'

const route = useRoute()
const id = computed(() => route.params.id as string)

const restaurante = ref<Indicacao | null>(null)
const carregando = ref(true)
const erro = ref('')

onMounted(async () => {
  try {
    restaurante.value = await getIndicacao(id.value)
  } catch {
    erro.value = 'Não foi possível carregar este restaurante.'
  } finally {
    carregando.value = false
  }
})

// Prefer an admin-provided map link; fall back to a Google Maps search built
// from coordinates if only those are set.
const linkMapa = computed(() => {
  const r = restaurante.value
  if (!r) return null
  if (r.mapaUrl) return r.mapaUrl
  if (r.latitude != null && r.longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${r.latitude},${r.longitude}`
  }
  return null
})
</script>

<template>
  <AppHeader title="Restaurante" />
  <div class="px-4">
    <p v-if="erro" class="text-danger">{{ erro }}</p>
    <p v-else-if="carregando" class="text-muted">Carregando...</p>

    <template v-else-if="restaurante">
      <div class="mb-5 flex flex-col items-center text-center">
        <div class="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-icon-soft text-primary">
          <Coffee :size="32" />
        </div>
        <div class="mt-3.5 text-[19px] font-bold text-ink">{{ restaurante.nome }}</div>
        <div class="mt-2.5 flex items-center gap-2.5">
          <span
            v-if="restaurante.subcategoria"
            class="rounded-chip bg-icon-soft px-3 py-1 text-[13px] font-medium text-primary"
          >
            {{ restaurante.subcategoria }}
          </span>
          <span v-if="restaurante.distanciaMetros != null" class="text-[13.5px] text-muted">
            {{ restaurante.distanciaMetros }} m do hotel
          </span>
        </div>
      </div>

      <div class="rounded-card bg-card px-[18px] shadow-card">
        <ContactRow v-if="restaurante.endereco" :icon="MapPin" label="Endereço" :value="restaurante.endereco" />
        <ContactRow
          v-if="restaurante.horario"
          :icon="Clock"
          label="Horário de atendimento"
          :value="restaurante.horario"
          multilinha
        />
        <ContactRow v-if="restaurante.telefone" :icon="Phone" label="Telefone" :value="restaurante.telefone" />
      </div>

      <AppButton v-if="linkMapa" variant="primary" :href="linkMapa" target="_blank" rel="noopener" class="mt-6">
        <Map :size="20" /> Ver no mapa
      </AppButton>
    </template>
  </div>
</template>
