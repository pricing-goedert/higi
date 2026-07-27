<script setup lang="ts">
import { RouterLink } from 'vue-router'

// Cards ainda sem destino: seguem desabilitados até as telas existirem.
const cardBase =
  'bg-white p-12 rounded-2xl shadow-sm transition-shadow flex flex-col items-center text-center gap-3 group border border-gray-100'
const iconeBase =
  'w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 transition-colors'
</script>

<template>
  <main class="max-w-6xl mx-auto px-4 -mt-6 md:mt-8 space-y-8 p-7">
    <section>
      <h2
        class="text-xs font-bold text-gray-500 tracking-wider uppercase mb-3 flex items-center gap-2"
      >
        <span class="w-2 h-2 rounded-full bg-[#0baaff]"></span>
        Comercial
      </h2>

      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-10">
        <!-- Card 1 -->
        <button type="button" disabled :class="[cardBase, 'cursor-not-allowed opacity-60']">
          <div :class="iconeBase"></div>
          <span class="text-xs md:text-sm font-semibold text-gray-800">
            Pesquisa de Representante
          </span>
        </button>

        <!-- Card 2 -->
        <button type="button" disabled :class="[cardBase, 'cursor-not-allowed opacity-60']">
          <div :class="iconeBase"></div>
          <span class="text-xs md:text-sm font-semibold text-gray-800">Pesquisa de Cliente</span>
        </button>

        <!-- Card 3 -->
        <RouterLink to="/leads/novo" :class="[cardBase, 'hover:shadow-md']">
          <div :class="[iconeBase, 'group-hover:bg-[#193A4C] group-hover:text-white']"></div>
          <span class="text-xs md:text-sm font-semibold text-gray-800">Cadastro de Leads</span>
        </RouterLink>
      </div>
    </section>
  </main>
</template>
