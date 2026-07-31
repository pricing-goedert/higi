<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import RowCard from '@/components/ui/RowCard.vue'
import { listClientes } from '@/lib/data'
import { mascaraCnpj, somenteDigitos } from '@/lib/format'
import type { Cliente } from '@/types/domain'

const route = useRoute()
const todos = ref<Cliente[]>([])
const carregando = ref(true)
const erro = ref('')

onMounted(async () => {
  try {
    todos.value = await listClientes()
  } catch {
    erro.value = 'Não foi possível carregar os clientes.'
  } finally {
    carregando.value = false
  }
})

const resultados = computed(() => {
  const cnpj = typeof route.query.cnpj === 'string' ? somenteDigitos(route.query.cnpj) : ''
  if (!cnpj) return todos.value
  return todos.value.filter((cliente) => somenteDigitos(cliente.cnpj).includes(cnpj))
})
</script>

<template>
  <AppHeader title="Clientes" />
  <div class="px-4">
    <p v-if="erro" class="text-danger">{{ erro }}</p>
    <p v-else-if="carregando" class="text-muted">Carregando...</p>
    <template v-else>
      <p class="mb-3 text-[13.5px] text-muted">{{ resultados.length }} resultado{{ resultados.length === 1 ? '' : 's' }}</p>
      <p v-if="resultados.length === 0" class="text-muted">Nenhum cliente encontrado.</p>
      <div class="lg:grid lg:grid-cols-2 lg:gap-x-3.5 xl:grid-cols-3">
        <RowCard
          v-for="cliente in resultados"
          :key="cliente.id"
          :to="{ name: 'cliente-detalhe', params: { id: cliente.id } }"
          :title="cliente.razaoSocial"
          :subtitle="mascaraCnpj(cliente.cnpj)"
          :avatar-nome="cliente.razaoSocial"
        />
      </div>
    </template>
  </div>
</template>
