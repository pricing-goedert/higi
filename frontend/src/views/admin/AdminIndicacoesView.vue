<script setup lang="ts">
import AdminCrudView, { type CampoForm, type ColunaTabela } from '@/components/admin/AdminCrudView.vue'

const ROTULOS_CATEGORIA: Record<string, string> = {
  restaurante: 'Restaurante',
  farmacia_mercado: 'Farmácia/Mercado',
  transporte: 'Transporte',
  passeio: 'Passeio',
}

const campos: CampoForm[] = [
  {
    chave: 'categoria',
    rotulo: 'Categoria',
    tipo: 'select',
    obrigatorio: true,
    opcoes: Object.entries(ROTULOS_CATEGORIA).map(([valor, rotulo]) => ({ valor, rotulo })),
  },
  { chave: 'subcategoria', rotulo: 'Subcategoria' },
  { chave: 'nome', rotulo: 'Nome', obrigatorio: true },
  { chave: 'endereco', rotulo: 'Endereço' },
  { chave: 'horario', rotulo: 'Horário de atendimento', tipo: 'textarea' },
  { chave: 'telefone', rotulo: 'Telefone', mascara: 'telefone' },
  { chave: 'latitude', rotulo: 'Latitude', tipo: 'numero' },
  { chave: 'longitude', rotulo: 'Longitude', tipo: 'numero' },
  { chave: 'mapaUrl', rotulo: 'Link do mapa' },
  { chave: 'distanciaMetros', rotulo: 'Distância (metros)', tipo: 'numero' },
]

const colunas: ColunaTabela[] = [
  { rotulo: 'Nome', valor: (i) => i.nome as string },
  { rotulo: 'Categoria', valor: (i) => ROTULOS_CATEGORIA[i.categoria as string] ?? (i.categoria as string) },
  { rotulo: 'Endereço', valor: (i) => (i.endereco as string) ?? '—' },
  { rotulo: 'Telefone', valor: (i) => (i.telefone as string) ?? '—' },
]

function itemVazio() {
  return {
    categoria: 'restaurante',
    subcategoria: null,
    nome: '',
    endereco: null,
    horario: null,
    telefone: null,
    latitude: null,
    longitude: null,
    mapaUrl: null,
    distanciaMetros: null,
  }
}
</script>

<template>
  <AdminCrudView rotulo-item="Indicação" genero="a" api-base="/indicacoes" :colunas="colunas" :campos="campos" :item-vazio="itemVazio" />
</template>
