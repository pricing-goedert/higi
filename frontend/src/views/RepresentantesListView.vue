<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import RowCard from '@/components/ui/RowCard.vue'
import SearchField from '@/components/ui/SearchField.vue'
import { listUsuarios } from '@/lib/data'
import { correspondeABusca, somenteDigitos } from '@/lib/format'
import type { Usuario } from '@/types/domain'

const route = useRoute()

const todos = ref<Usuario[]>([])
const carregando = ref(true)
const erro = ref('')
const refinar = ref('')

onMounted(async () => {
  // Global search from Home (Slice D) lands here with `q` instead of the
  // structured Nacional/Exportação filters from the dedicated search screen
  // — pre-fill the refine field with it so it flows through the same
  // nome/cidade matching below.
  if (typeof route.query.q === 'string') {
    refinar.value = route.query.q
  }

  try {
    todos.value = await listUsuarios()
  } catch {
    erro.value = 'Não foi possível carregar os representantes.'
  } finally {
    carregando.value = false
  }
})

const filtradosPelaBusca = computed(() => {
  const tipo = route.query.tipo
  if (typeof tipo !== 'string') {
    // No tipo means this came from Home's tipo-agnostic global search —
    // search across every representante (still excluding Gerentes/staff,
    // who have no tipoRepresentante), not just one Nacional/Exportação.
    return todos.value.filter((usuario) => usuario.tipoRepresentante !== null)
  }

  const cnpj = typeof route.query.cnpj === 'string' ? somenteDigitos(route.query.cnpj) : ''
  const cidade = typeof route.query.cidade === 'string' ? route.query.cidade : ''
  const uf = typeof route.query.uf === 'string' ? route.query.uf : ''
  const pais = typeof route.query.pais === 'string' ? route.query.pais : ''

  return todos.value.filter((usuario) => {
    if (usuario.tipoRepresentante !== tipo) return false
    if (cnpj && !somenteDigitos(usuario.cnpj ?? '').includes(cnpj)) return false
    if (cidade && !correspondeABusca(usuario.cidade ?? '', cidade)) return false
    if (uf && usuario.uf !== uf) return false
    if (pais && !correspondeABusca(usuario.pais ?? '', pais)) return false
    return true
  })
})

const resultados = computed(() =>
  filtradosPelaBusca.value.filter(
    (usuario) => correspondeABusca(usuario.nome, refinar.value) || correspondeABusca(usuario.cidade ?? '', refinar.value),
  ),
)

function subtitulo(usuario: Usuario): string {
  if (usuario.tipoRepresentante === 'exportacao') return usuario.pais ?? ''
  return [usuario.cidade, usuario.uf].filter(Boolean).join(' - ')
}
</script>

<template>
  <AppHeader title="Representantes" />
  <div class="px-4">
    <SearchField v-model="refinar" placeholder="Refinar busca por nome ou cidade..." />

    <p v-if="erro" class="mt-4 text-danger">{{ erro }}</p>
    <p v-else-if="carregando" class="mt-4 text-muted">Carregando...</p>
    <template v-else>
      <p class="my-3 text-[13.5px] text-muted">{{ resultados.length }} resultado{{ resultados.length === 1 ? '' : 's' }}</p>
      <p v-if="resultados.length === 0" class="text-muted">Nenhum representante encontrado.</p>
      <div class="lg:grid lg:grid-cols-2 lg:gap-x-3.5 xl:grid-cols-3">
        <RowCard
          v-for="usuario in resultados"
          :key="usuario.id"
          :to="{ name: 'representante-detalhe', params: { id: usuario.id } }"
          :title="usuario.nome"
          :subtitle="subtitulo(usuario)"
          :avatar-nome="usuario.nome"
        />
      </div>
    </template>
  </div>
</template>
