<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/lib/api'
import AdminCrudView, { type CampoForm, type ColunaTabela } from '@/components/admin/AdminCrudView.vue'
import type { Categoria, Grupo } from '@/types/domain'

const route = useRoute()
const categoriaId = route.params.categoriaId as string

const categoria = ref<Categoria | null>(null)
// Mirrors the public app's branching (ProdutosCategoriasView/CategoriaDetailView):
// a categoria with any Grupos manages Grupos here; a flat categoria skips
// straight to managing its Tipos.
const temGrupos = ref(false)
const carregando = ref(true)

onMounted(async () => {
  const [cat, grupos] = await Promise.all([api.get<Categoria>(`/categorias/${categoriaId}`), api.get<Grupo[]>('/grupos')])
  categoria.value = cat
  temGrupos.value = grupos.some((g) => g.categoriaId === categoriaId)
  carregando.value = false
})

const camposGrupo: CampoForm[] = [{ chave: 'nome', rotulo: 'Nome', obrigatorio: true }]
const colunasGrupo: ColunaTabela[] = [{ rotulo: 'Nome', valor: (i) => i.nome as string }]
function itemVazioGrupo() {
  return { nome: '', categoriaId }
}
function filtroGrupo(item: Record<string, unknown>) {
  return item.categoriaId === categoriaId
}
function linkAbrirGrupo(item: Record<string, unknown>) {
  return { name: 'admin-produtos-grupo', params: { grupoId: item.id as string } }
}

const camposTipo: CampoForm[] = [{ chave: 'nome', rotulo: 'Nome', obrigatorio: true }]
const colunasTipo: ColunaTabela[] = [{ rotulo: 'Nome', valor: (i) => i.nome as string }]
function itemVazioTipo() {
  return { nome: '', categoriaId, grupoId: null }
}
function filtroTipoFlat(item: Record<string, unknown>) {
  return item.categoriaId === categoriaId && !item.grupoId
}
function linkAbrirTipo(item: Record<string, unknown>) {
  return { name: 'admin-produtos-tipo', params: { tipoId: item.id as string } }
}
</script>

<template>
  <div>
    <RouterLink :to="{ name: 'admin-produtos' }" class="mb-3 inline-block text-[0.85rem] text-primary no-underline">&larr; Categorias</RouterLink>
    <h2 class="mb-4 text-[1.05rem] font-bold text-ink">{{ categoria?.nome }}</h2>

    <p v-if="carregando" class="text-[0.85rem] text-muted">Carregando...</p>
    <AdminCrudView
      v-else-if="temGrupos"
      rotulo-item="Grupo"
      api-base="/grupos"
      :colunas="colunasGrupo"
      :campos="camposGrupo"
      :item-vazio="itemVazioGrupo"
      :filtro="filtroGrupo"
      :link-abrir="linkAbrirGrupo"
    />
    <AdminCrudView
      v-else
      rotulo-item="Tipo"
      api-base="/tipos"
      :colunas="colunasTipo"
      :campos="camposTipo"
      :item-vazio="itemVazioTipo"
      :filtro="filtroTipoFlat"
      :link-abrir="linkAbrirTipo"
    />
  </div>
</template>
