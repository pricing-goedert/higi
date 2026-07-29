<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Clock } from '@lucide/vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import SectionLabel from '@/components/ui/SectionLabel.vue'
import { listProgramacao } from '@/lib/data'
import type { Programacao } from '@/types/domain'

const itens = ref<Programacao[]>([])
const carregando = ref(true)
const erro = ref('')

onMounted(async () => {
  try {
    itens.value = await listProgramacao()
  } catch {
    erro.value = 'Não foi possível carregar a programação.'
  } finally {
    carregando.value = false
  }
})

function formatarDiaMes(dataIso: string): string {
  const data = new Date(dataIso)
  const dia = String(data.getUTCDate()).padStart(2, '0')
  const mes = String(data.getUTCMonth() + 1).padStart(2, '0')
  return `${dia}/${mes}`
}

// Grouped by the distinct sorted dates present in the data, labeled "Dia N"
// in order — not tied to specific calendar dates, since the event's actual
// dates aren't fixed in the schema.
const grupos = computed(() => {
  const ordenados = [...itens.value].sort((a, b) => {
    const porDia = a.dia.localeCompare(b.dia)
    return porDia !== 0 ? porDia : (a.horario ?? '').localeCompare(b.horario ?? '')
  })
  const dias = [...new Set(ordenados.map((item) => item.dia))]

  return dias.map((dia, indice) => ({
    chave: dia,
    rotulo: `Dia ${indice + 1} — ${formatarDiaMes(dia)}`,
    itens: ordenados.filter((item) => item.dia === dia),
  }))
})
</script>

<template>
  <AppHeader title="Programação da Feira" />
  <div class="px-4">
    <p v-if="erro" class="text-danger">{{ erro }}</p>
    <p v-else-if="carregando" class="text-muted">Carregando...</p>
    <p v-else-if="itens.length === 0" class="text-muted">Programação ainda não divulgada.</p>

    <div v-for="grupo in grupos" :key="grupo.chave" class="mb-6">
      <SectionLabel>{{ grupo.rotulo }}</SectionLabel>
      <div class="rounded-card bg-card shadow-card">
        <div
          v-for="item in grupo.itens"
          :key="item.id"
          class="flex items-center gap-3 border-b border-divider px-[18px] py-3.5 last:border-0"
        >
          <span v-if="item.horario" class="flex shrink-0 items-center gap-1.5 text-[13px] font-medium text-muted">
            <Clock :size="14" /> {{ item.horario }}
          </span>
          <span class="flex-1 text-[15px] font-medium text-ink">{{ item.titulo }}</span>
        </div>
      </div>
    </div>

    <p v-if="itens.length > 0" class="mb-4 text-[13px] text-faint">
      Programação sujeita a alterações. Confira as atualizações no estande da organização.
    </p>
  </div>
</template>
