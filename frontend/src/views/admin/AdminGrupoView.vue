<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/lib/api'
import AdminCrudView, { type CampoForm, type ColunaTabela } from '@/components/admin/AdminCrudView.vue'
import type { Grupo } from '@/types/domain'

const route = useRoute()
const grupoId = route.params.grupoId as string
const grupo = ref<Grupo | null>(null)

onMounted(async () => {
  grupo.value = await api.get<Grupo>(`/grupos/${grupoId}`)
})

const campos: CampoForm[] = [{ chave: 'nome', rotulo: 'Nome', obrigatorio: true }]
const colunas: ColunaTabela[] = [{ rotulo: 'Nome', valor: (i) => i.nome as string }]
function itemVazio() {
  return { nome: '', grupoId, categoriaId: null }
}
function filtro(item: Record<string, unknown>) {
  return item.grupoId === grupoId
}
function linkAbrir(item: Record<string, unknown>) {
  return { name: 'admin-produtos-tipo', params: { tipoId: item.id as string } }
}
</script>

<template>
  <div>
    <RouterLink
      v-if="grupo"
      :to="{ name: 'admin-produtos-categoria', params: { categoriaId: grupo.categoriaId } }"
      class="mb-3 inline-block text-[0.85rem] text-primary no-underline"
    >
      &larr; Voltar
    </RouterLink>
    <h2 class="mb-4 text-[1.05rem] font-bold text-ink">{{ grupo?.nome }}</h2>
    <AdminCrudView
      rotulo-item="Tipo"
      api-base="/tipos"
      :colunas="colunas"
      :campos="campos"
      :item-vazio="itemVazio"
      :filtro="filtro"
      :link-abrir="linkAbrir"
    />
  </div>
</template>
