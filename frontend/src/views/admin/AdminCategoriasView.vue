<script setup lang="ts">
import AdminCrudView, { type CampoForm, type ColunaTabela } from '@/components/admin/AdminCrudView.vue'

const campos: CampoForm[] = [
  { chave: 'nome', rotulo: 'Nome', obrigatorio: true },
  { chave: 'descricao', rotulo: 'Descrição', tipo: 'textarea' },
]

const colunas: ColunaTabela[] = [
  { rotulo: 'Nome', valor: (i) => i.nome as string },
  { rotulo: 'Descrição', valor: (i) => (i.descricao as string) ?? '—' },
]

function itemVazio() {
  return { nome: '', descricao: null }
}

function linkAbrir(item: Record<string, unknown>) {
  return { name: 'admin-produtos-categoria', params: { categoriaId: item.id as string } }
}
</script>

<template>
  <AdminCrudView
    rotulo-item="Categoria"
    genero="a"
    api-base="/categorias"
    :colunas="colunas"
    :campos="campos"
    :item-vazio="itemVazio"
    :link-abrir="linkAbrir"
  />
</template>
