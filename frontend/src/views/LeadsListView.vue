<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Download } from '@lucide/vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { listLeads } from '@/lib/data'
import { mascaraCnpj, mascaraTelefone, tempoRelativo } from '@/lib/format'
import type { Lead } from '@/types/domain'

const leads = ref<Lead[]>([])
const carregando = ref(true)
const erro = ref('')

onMounted(async () => {
  try {
    leads.value = await listLeads()
  } catch {
    erro.value = 'Não foi possível carregar os leads.'
  } finally {
    carregando.value = false
  }
})
</script>

<template>
  <AppHeader title="Leads cadastrados" />
  <div class="px-4">
    <AppButton variant="secondary" href="/api/leads/export.csv" class="mb-5"><Download :size="18" /> Exportar CSV</AppButton>

    <p v-if="erro" class="text-danger">{{ erro }}</p>
    <p v-else-if="carregando" class="text-muted">Carregando...</p>
    <p v-else-if="leads.length === 0" class="text-muted">Nenhum lead cadastrado ainda.</p>

    <div v-for="lead in leads" :key="lead.id" class="mb-3.5 rounded-card bg-card p-[18px] shadow-card">
      <div class="flex items-center gap-2.5">
        <div class="flex-1 text-[15.5px] font-semibold text-ink">{{ lead.razaoSocial }}</div>
        <span class="rounded-chip bg-icon-soft px-2.5 py-1 text-[12.5px] font-medium text-primary">{{ lead.tipo }}</span>
      </div>
      <div class="mt-1 text-[13.5px] text-muted">{{ mascaraCnpj(lead.cnpj) }}</div>
      <div class="mt-1 text-[13.5px] text-muted">{{ lead.contato }} · {{ mascaraTelefone(lead.telefone) }}</div>
      <div class="mt-1.5 text-[12.5px] text-faint">{{ tempoRelativo(lead.createdAt) }}</div>
    </div>
  </div>
</template>
