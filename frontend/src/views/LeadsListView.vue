<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Download } from '@lucide/vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { listLeads } from '@/lib/data'
import { listarPendentes } from '@/lib/outbox'
import { mascaraCnpj, mascaraTelefone, tempoRelativo } from '@/lib/format'
import type { Lead } from '@/types/domain'
import type { LeadPendente } from '@/lib/db'

interface ItemLead {
  chave: string
  razaoSocial: string
  tipo: string
  cnpj: string
  contato: string
  telefone: string
  quando: string
  pendente: boolean
}

const confirmados = ref<Lead[]>([])
const pendentes = ref<LeadPendente[]>([])
const carregando = ref(true)
const erro = ref('')

onMounted(async () => {
  // The outbox always loads — it's local. The server list is best-effort:
  // offline, it simply comes back empty rather than blocking the pending
  // items (which are the whole point of this screen while offline) from
  // showing at all.
  pendentes.value = await listarPendentes()
  try {
    confirmados.value = await listLeads()
  } catch {
    erro.value = 'Não foi possível carregar os leads já sincronizados.'
  } finally {
    carregando.value = false
  }
})

const itens = computed<ItemLead[]>(() => {
  const doOutbox = pendentes.value.map((lead) => ({
    chave: lead.clientUuid,
    razaoSocial: lead.razaoSocial,
    tipo: lead.tipo,
    cnpj: lead.cnpj,
    contato: lead.contato,
    telefone: lead.telefone,
    quando: lead.criadoEm,
    pendente: true,
  }))
  const doServidor = confirmados.value.map((lead) => ({
    chave: lead.id,
    razaoSocial: lead.razaoSocial,
    tipo: lead.tipo,
    cnpj: lead.cnpj,
    contato: lead.contato,
    telefone: lead.telefone,
    quando: lead.createdAt,
    pendente: false,
  }))
  return [...doOutbox, ...doServidor].sort((a, b) => b.quando.localeCompare(a.quando))
})
</script>

<template>
  <AppHeader title="Leads cadastrados" />
  <div class="px-4">
    <AppButton variant="secondary" href="/api/leads/export.csv" class="mb-3"><Download :size="18" /> Exportar CSV</AppButton>

    <p v-if="pendentes.length > 0" class="mb-3 text-[13px] text-muted">
      {{ pendentes.length }} lead{{ pendentes.length === 1 ? '' : 's' }} pendente{{ pendentes.length === 1 ? '' : 's' }} de
      sincronização
    </p>

    <p v-if="erro" class="text-danger">{{ erro }}</p>
    <p v-else-if="carregando" class="text-muted">Carregando...</p>
    <p v-else-if="itens.length === 0" class="text-muted">Nenhum lead cadastrado ainda.</p>

    <div v-for="item in itens" :key="item.chave" class="mb-3.5 rounded-card bg-card p-[18px] shadow-card">
      <div class="flex items-center gap-2.5">
        <div class="flex-1 text-[15.5px] font-semibold text-ink">{{ item.razaoSocial }}</div>
        <span class="rounded-chip bg-icon-soft px-2.5 py-1 text-[12.5px] font-medium text-primary">{{ item.tipo }}</span>
      </div>
      <div class="mt-1 text-[13.5px] text-muted">{{ mascaraCnpj(item.cnpj) }}</div>
      <div class="mt-1 text-[13.5px] text-muted">{{ item.contato }} · {{ mascaraTelefone(item.telefone) }}</div>
      <div class="mt-1.5 flex items-center gap-2 text-[12.5px] text-faint">
        <span>{{ tempoRelativo(item.quando) }}</span>
        <span v-if="item.pendente" class="rounded-chip bg-icon-soft px-2 py-0.5 font-medium text-primary">
          Pendente de sincronização
        </span>
      </div>
    </div>
  </div>
</template>
