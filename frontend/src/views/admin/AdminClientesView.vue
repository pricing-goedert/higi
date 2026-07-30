<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { api } from '@/lib/api'
import AdminCrudView, { type CampoForm, type ColunaTabela } from '@/components/admin/AdminCrudView.vue'
import { UFS } from '@/lib/constants'
import type { Usuario } from '@/types/domain'

const usuarios = ref<Usuario[]>([])

async function carregarUsuarios() {
  usuarios.value = await api.get<Usuario[]>('/usuarios')
}

onMounted(carregarUsuarios)

function nomeUsuario(id: string | null) {
  if (!id) return '—'
  return usuarios.value.find((u) => u.id === id)?.nome ?? '—'
}

const campos = computed<CampoForm[]>(() => [
  { chave: 'razaoSocial', rotulo: 'Razão Social', obrigatorio: true },
  { chave: 'cnpj', rotulo: 'CNPJ', obrigatorio: true, mascara: 'cnpj' },
  { chave: 'nomeFantasia', rotulo: 'Nome Fantasia' },
  { chave: 'contato', rotulo: 'Contato' },
  { chave: 'telefone', rotulo: 'Telefone', mascara: 'telefone' },
  { chave: 'whatsapp', rotulo: 'WhatsApp', mascara: 'telefone' },
  { chave: 'email', rotulo: 'Email' },
  { chave: 'endereco', rotulo: 'Endereço' },
  { chave: 'cidade', rotulo: 'Cidade' },
  { chave: 'uf', rotulo: 'UF', tipo: 'select', opcoes: UFS.map((uf) => ({ valor: uf, rotulo: uf })) },
  {
    chave: 'representanteId',
    rotulo: 'Representante',
    tipo: 'select',
    opcoes: usuarios.value.map((u) => ({ valor: u.id, rotulo: u.nome })),
  },
])

const colunas: ColunaTabela[] = [
  { rotulo: 'Razão Social', valor: (i) => i.razaoSocial as string },
  { rotulo: 'CNPJ', valor: (i) => i.cnpj as string },
  { rotulo: 'Representante', valor: (i) => nomeUsuario(i.representanteId as string | null) },
  { rotulo: 'Telefone', valor: (i) => (i.telefone as string) ?? '—' },
]

function itemVazio() {
  return {
    razaoSocial: '',
    cnpj: '',
    nomeFantasia: null,
    contato: null,
    telefone: null,
    whatsapp: null,
    email: null,
    endereco: null,
    cidade: null,
    uf: null,
    representanteId: null,
  }
}
</script>

<template>
  <AdminCrudView rotulo-item="Cliente" api-base="/clientes" :colunas="colunas" :campos="campos" :item-vazio="itemVazio" />
</template>
