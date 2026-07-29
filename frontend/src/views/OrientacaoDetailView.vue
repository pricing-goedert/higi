<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import { getOrientacao } from '@/lib/data'
import type { Orientacao } from '@/types/domain'

const route = useRoute()
const id = computed(() => route.params.id as string)

const orientacao = ref<Orientacao | null>(null)
const carregando = ref(true)
const erro = ref('')

onMounted(async () => {
  try {
    orientacao.value = await getOrientacao(id.value)
  } catch {
    erro.value = 'Não foi possível carregar esta orientação.'
  } finally {
    carregando.value = false
  }
})

const secoes = computed(() => [...(orientacao.value?.secoes ?? [])].sort((a, b) => a.ordem - b.ordem))
</script>

<template>
  <AppHeader :title="orientacao?.titulo ?? 'Orientação'" />
  <div class="px-4">
    <p v-if="erro" class="text-danger">{{ erro }}</p>
    <p v-else-if="carregando" class="text-muted">Carregando...</p>
    <p v-else-if="secoes.length === 0" class="text-muted">Nenhum conteúdo cadastrado ainda.</p>

    <div v-for="secao in secoes" :key="secao.id" class="mb-3.5 rounded-card bg-card p-[18px] shadow-card">
      <div v-if="secao.titulo" class="mb-2 text-[15.5px] font-bold text-primary">{{ secao.titulo }}</div>
      <div class="text-[14.5px] leading-[23px] text-muted">{{ secao.texto }}</div>
    </div>
  </div>
</template>
