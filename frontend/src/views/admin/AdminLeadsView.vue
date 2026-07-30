<script setup lang="ts">
// Read-only: leads are captured only from the mobile lead form, never
// created/edited here. requireAdmin on the backend route is what actually
// makes this show every lead instead of just the caller's own.
import { onMounted, ref } from 'vue'
import { api } from '@/lib/api'
import type { Lead, Usuario } from '@/types/domain'

const leads = ref<Lead[]>([])
const usuarios = ref<Usuario[]>([])
const carregando = ref(true)
const erro = ref('')

onMounted(async () => {
  try {
    const [dadosLeads, dadosUsuarios] = await Promise.all([api.get<Lead[]>('/leads'), api.get<Usuario[]>('/usuarios')])
    leads.value = dadosLeads
    usuarios.value = dadosUsuarios
  } catch {
    erro.value = 'Não foi possível carregar os leads.'
  } finally {
    carregando.value = false
  }
})

function nomeCapturadoPor(id: string | null) {
  if (!id) return '—'
  return usuarios.value.find((u) => u.id === id)?.nome ?? '—'
}

function dataFormatada(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR')
}
</script>

<template>
  <div>
    <div class="mb-4 flex flex-wrap items-center gap-3">
      <span class="text-[0.85rem] text-muted">{{ leads.length }} lead(s)</span>
      <span class="flex-1" />
      <a href="/api/leads/export.csv" class="rounded-[10px] bg-primary px-[18px] py-2.5 text-[0.85rem] font-semibold text-white no-underline">
        Exportar CSV
      </a>
    </div>

    <p v-if="erro" class="text-[0.85rem] text-danger">{{ erro }}</p>
    <p v-else-if="carregando" class="text-[0.85rem] text-muted">Carregando...</p>
    <p v-else-if="!leads.length" class="text-[0.85rem] text-muted">Nenhum lead cadastrado ainda.</p>

    <div v-else class="overflow-x-auto rounded-2xl bg-card shadow-card">
      <table class="w-full border-collapse">
        <thead>
          <tr>
            <th class="bg-[#F1F5F9] px-3.5 py-3 text-left text-[0.7rem] font-normal uppercase tracking-wide text-muted">Tipo</th>
            <th class="bg-[#F1F5F9] px-3.5 py-3 text-left text-[0.7rem] font-normal uppercase tracking-wide text-muted">Razão Social</th>
            <th class="bg-[#F1F5F9] px-3.5 py-3 text-left text-[0.7rem] font-normal uppercase tracking-wide text-muted">CNPJ</th>
            <th class="bg-[#F1F5F9] px-3.5 py-3 text-left text-[0.7rem] font-normal uppercase tracking-wide text-muted">Contato</th>
            <th class="bg-[#F1F5F9] px-3.5 py-3 text-left text-[0.7rem] font-normal uppercase tracking-wide text-muted">Telefone</th>
            <th class="bg-[#F1F5F9] px-3.5 py-3 text-left text-[0.7rem] font-normal uppercase tracking-wide text-muted">Capturado por</th>
            <th class="bg-[#F1F5F9] px-3.5 py-3 text-left text-[0.7rem] font-normal uppercase tracking-wide text-muted">Data</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="lead in leads" :key="lead.id">
            <td class="border-t border-divider px-3.5 py-2.5 text-[0.85rem]">{{ lead.tipo }}</td>
            <td class="border-t border-divider px-3.5 py-2.5 text-[0.85rem]">{{ lead.razaoSocial }}</td>
            <td class="border-t border-divider px-3.5 py-2.5 text-[0.85rem]">{{ lead.cnpj }}</td>
            <td class="border-t border-divider px-3.5 py-2.5 text-[0.85rem]">{{ lead.contato }}</td>
            <td class="border-t border-divider px-3.5 py-2.5 text-[0.85rem]">{{ lead.telefone }}</td>
            <td class="border-t border-divider px-3.5 py-2.5 text-[0.85rem]">{{ nomeCapturadoPor(lead.capturadoPorId) }}</td>
            <td class="border-t border-divider px-3.5 py-2.5 text-[0.85rem]">{{ dataFormatada(lead.createdAt) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
