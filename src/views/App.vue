<script setup lang="ts">
</script>

<template>
  <div class="min-h-screen bg-slate-50 font-sans pb-12">
   
    <!-- cabeçalho -->
  <header class="bg-[#193A4C] text-white pt-3 pb-12 px-4 rounded-b-[2rem] md:rounded-b-none md:pb-3">
    <div class="w-full mx-auto md:flex md:items-center md:gap-3">
      
      <a href="/" class="flex-shrink-0">
        <img src="../images/goedert-icon.png" alt="Logo Goedert" class="bg-white rounded-lg h-12 w-12 object-contain" />
      </a>
      <div>
        <h1 class="text-2xl md:text-2xl font-bold">GoHub Higiexpo</h1>
        <p class="text-gray-300 text-sm mt-1 gap-9">Nossa central de atendimento Goedert na palma da sua mão</p>
      </div>

      <div class="mt-6 md:mt-0 w-full md:w-80 lg:w-96 ml-auto">
        <div class="relative">
          <span class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400 ">
          
          </span>
          <input 
            type="text" 
            placeholder="Buscar representante, cliente..." 
            class="w-full pl-10 pr-4 py-3 bg-white rounded-2xl text-gray-800 placeholder-gray-400 shadow-md focus:outline-none text-sm "
          />
        </div>
      </div>

    </div>
  </header>

  <main class="max-w-6xl mx-auto px-4 -mt-6 md:mt-8 space-y-8 p-7">
    <section>
      <h2 class="text-xs font-bold text-gray-500 tracking-wider uppercase mb-3 flex items-center gap-2 ">
        <span class="w-2 h-2 rounded-full bg-[#0baaff]"></span>
        Comercial
      </h2>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-10">
        
        <!-- Card 1 -->
        <button class="bg-white p-12 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center gap- group border border-gray-100">
          <div class="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 group-hover:bg-[#193A4C] group-hover:text-white transition-colors">
            
          </div>
          <span class="text-xs md:text-sm font-semibold text-gray-800">Pesquisa de Representante</span>
        </button>

        <!-- Card 2 -->
        <button class="bg-white p-12 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center gap-3 group border border-gray-100">
          <div class="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 group-hover:bg-[#193A4C] group-hover:text-white transition-colors">
            
          </div>
          <span class="text-xs md:text-sm font-semibold text-gray-800">Pesquisa de Cliente</span>
        </button>

        <!-- Card 3 -->
        <button class="bg-white p-12 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center gap- group border border-gray-100">
          <div class="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 group-hover:bg-[#193A4C] group-hover:text-white transition-colors">
            
          </div>
          <span class="text-xs md:text-sm font-semibold text-gray-800">Cadastro de Leads</span>
        </button>

      </div>
    </section>

  </main>
</div>
</template>

