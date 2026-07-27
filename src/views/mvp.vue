<script setup lang="ts">
</script>

<template>
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
</template>