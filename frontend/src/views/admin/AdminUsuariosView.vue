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
  { chave: 'nome', rotulo: 'Nome', obrigatorio: true },
  { chave: 'email', rotulo: 'Email', obrigatorio: true },
  { chave: 'password', rotulo: 'Senha', tipo: 'senha', obrigatorioSomenteNaCriacao: true },
  { chave: 'isAdmin', rotulo: 'Acesso de administrador', tipo: 'checkbox' },
  {
    chave: 'superiorId',
    rotulo: 'Superior (gerente)',
    tipo: 'select',
    opcoes: usuarios.value.map((u) => ({ valor: u.id, rotulo: u.nome })),
  },
  {
    chave: 'tipoRepresentante',
    rotulo: 'Tipo de representante',
    tipo: 'select',
    opcoes: [
      { valor: 'nacional', rotulo: 'Nacional' },
      { valor: 'exportacao', rotulo: 'Exportação' },
    ],
  },
  { chave: 'cnpj', rotulo: 'CNPJ', mascara: 'cnpj' },
  { chave: 'telefone', rotulo: 'Telefone', mascara: 'telefone' },
  { chave: 'whatsapp', rotulo: 'WhatsApp', mascara: 'telefone' },
  { chave: 'cidade', rotulo: 'Cidade' },
  { chave: 'uf', rotulo: 'UF', tipo: 'select', opcoes: UFS.map((uf) => ({ valor: uf, rotulo: uf })) },
  { chave: 'pais', rotulo: 'País' },
  { chave: 'endereco', rotulo: 'Endereço' },
])

const colunas: ColunaTabela[] = [
  { rotulo: 'Nome', valor: (i) => i.nome as string },
  { rotulo: 'Email', valor: (i) => i.email as string },
  { rotulo: 'Admin', valor: (i) => (i.isAdmin ? 'Sim' : 'Não') },
  { rotulo: 'Superior', valor: (i) => nomeUsuario(i.superiorId as string | null) },
]

function itemVazio() {
  return {
    nome: '',
    email: '',
    password: '',
    isAdmin: false,
    superiorId: null,
    tipoRepresentante: null,
    cnpj: null,
    telefone: null,
    whatsapp: null,
    cidade: null,
    uf: null,
    pais: null,
    endereco: null,
  }
}

function antesDeSalvar(dados: Record<string, unknown>, modoEdicao: boolean) {
  // Editing without typing a new password must not overwrite the existing
  // hash — the backend only re-hashes when `password` is truthy, so an
  // empty string here is already a no-op, but drop the key entirely on
  // create-vs-edit clarity.
  if (modoEdicao && !dados.password) {
    const { password: _password, ...resto } = dados
    return resto
  }
  return dados
}
</script>

<template>
  <AdminCrudView
    rotulo-item="Usuário"
    api-base="/usuarios"
    :colunas="colunas"
    :campos="campos"
    :item-vazio="itemVazio"
    :antes-de-salvar="antesDeSalvar"
    @alterou="carregarUsuarios"
  />
</template>
