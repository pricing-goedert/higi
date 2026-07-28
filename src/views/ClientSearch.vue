<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import type { Cliente } from '@/types/cliente'
import { seedClientesSeNecessario, listarClientes, filtrarClientes } from '@/services/db'

const clientes = ref<Cliente[]>([])
const busca = ref('')
const carregando = ref(true)
const erroCarregamento = ref<string | null>(null)

const clientesFiltrados = computed(() => filtrarClientes(clientes.value, busca.value))

onMounted(async () => {
  try {
    await seedClientesSeNecessario()
    clientes.value = await listarClientes()
  } catch (erro) {
    console.error('[ClientSearch] Falha ao carregar clientes:', erro)
    erroCarregamento.value = 'Não foi possível carregar os clientes. Tente novamente.'
  } finally {
    carregando.value = false
  }
})
</script>

<template>
  <main class="max-w-3xl mx-auto px-4 -mt-6 md:mt-8 p-7">
    <RouterLink
      to="/"
      class="flex items-center justify-center w-16 h-12 bg-gray-100 hover:bg-gray-200 text-blue-900 hover:text-blue-700 rounded-lg transition-colors mb-4"
      title="Voltar"
    >
      <span class="text-3xl font-semibold">&larr;</span>
    </RouterLink>

    <section class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
      <h2
        class="text-xs font-bold text-gray-500 tracking-wider uppercase mb-6 flex items-center gap-2"
      >
        <span class="w-2 h-2 rounded-full bg-[#0baaff]"></span>
        Pesquisa de Cliente
      </h2>

      <input
        v-model="busca"
        type="text"
        placeholder="Buscar por razão social, CNPJ ou cidade..."
        class="w-full rounded-xl bg-slate-50 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 border border-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0baaff]/40 focus:border-[#0baaff] mb-6"
      />

      <p v-if="carregando" class="text-sm text-gray-400">Carregando clientes...</p>

      <p v-else-if="erroCarregamento" class="text-sm text-red-600">{{ erroCarregamento }}</p>

      <p v-else-if="clientesFiltrados.length === 0" class="text-sm text-gray-400">
        Nenhum cliente encontrado.
      </p>

      <ul v-else class="space-y-3">
        <li
          v-for="cliente in clientesFiltrados"
          :key="cliente.id"
          class="rounded-xl border border-gray-100 p-4"
        >
          <p class="text-sm font-semibold text-gray-800">{{ cliente.razaoSocial }}</p>
          <p class="text-xs text-gray-500 mt-0.5">{{ cliente.cnpj }}</p>
          <p class="text-xs text-gray-500 mt-0.5">{{ cliente.cidade }}/{{ cliente.uf }}</p>
          <p v-if="cliente.telefone" class="text-xs text-gray-500 mt-0.5">
            {{ cliente.telefone }}
          </p>
        </li>
      </ul>
    </section>
  </main>
</template>
