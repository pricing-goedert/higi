<script setup lang="ts">
import AdminCrudView, { type CampoForm, type ColunaTabela } from '@/components/admin/AdminCrudView.vue'

const campos: CampoForm[] = [
  { chave: 'dia', rotulo: 'Dia', tipo: 'data', obrigatorio: true },
  { chave: 'horario', rotulo: 'Horário', tipo: 'hora' },
  { chave: 'titulo', rotulo: 'Título', obrigatorio: true },
  { chave: 'descricao', rotulo: 'Descrição', tipo: 'textarea' },
]

const colunas: ColunaTabela[] = [
  { rotulo: 'Dia', valor: (i) => (i.dia as string).slice(0, 10) },
  { rotulo: 'Horário', valor: (i) => (i.horario as string) ?? '—' },
  { rotulo: 'Título', valor: (i) => i.titulo as string },
]

function itemVazio() {
  return { dia: '', horario: null, titulo: '', descricao: null }
}
</script>

<template>
  <AdminCrudView rotulo-item="Item da programação" api-base="/programacao" :colunas="colunas" :campos="campos" :item-vazio="itemVazio" />
</template>
