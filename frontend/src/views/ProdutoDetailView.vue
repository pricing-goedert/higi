<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Camera } from '@lucide/vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import SectionLabel from '@/components/ui/SectionLabel.vue'
import { getProduto } from '@/lib/data'
import type { Produto } from '@/types/domain'

const route = useRoute()
const id = computed(() => route.params.id as string)

const produto = ref<Produto | null>(null)
const carregando = ref(true)
const erro = ref('')

onMounted(async () => {
  try {
    produto.value = await getProduto(id.value)
  } catch {
    erro.value = 'Não foi possível carregar este produto.'
  } finally {
    carregando.value = false
  }
})
</script>

<template>
  <AppHeader title="Produto" />
  <div class="px-4">
    <p v-if="erro" class="text-danger">{{ erro }}</p>
    <p v-else-if="carregando" class="text-muted">Carregando...</p>

    <template v-else-if="produto">
      <img v-if="produto.foto" :src="produto.foto" :alt="produto.nome" class="h-48 w-full rounded-card object-cover" />
      <div v-else class="flex h-48 flex-col items-center justify-center gap-2 rounded-card bg-icon-soft text-faint">
        <Camera :size="34" />
        <span class="text-[13.5px]">Foto em breve</span>
      </div>

      <div class="mt-5">
        <span class="rounded-chip bg-icon-soft px-3 py-1 text-[13px] font-medium text-primary">{{ produto.codigo }}</span>
        <div class="mt-2.5 text-[20px] font-bold text-ink">{{ produto.nome }}</div>
        <p v-if="produto.descricao" class="mt-2 text-[14.5px] leading-[23px] text-muted">{{ produto.descricao }}</p>
      </div>

      <template v-if="produto.quantidadeCaixa || produto.dimensoes || produto.composicao">
        <SectionLabel>Informações</SectionLabel>
        <div class="rounded-card bg-card px-[18px] shadow-card">
          <div v-if="produto.quantidadeCaixa" class="flex justify-between border-b border-divider py-3 text-[14px] last:border-0">
            <span class="text-muted">Quantidade caixa master</span>
            <span class="font-medium text-ink">{{ produto.quantidadeCaixa }} unidades</span>
          </div>
          <div v-if="produto.dimensoes" class="flex justify-between border-b border-divider py-3 text-[14px] last:border-0">
            <span class="text-muted">Dimensões</span>
            <span class="font-medium text-ink">{{ produto.dimensoes }}</span>
          </div>
          <div v-if="produto.composicao" class="flex justify-between gap-4 py-3 text-[14px] last:border-0">
            <span class="shrink-0 text-muted">Composição</span>
            <span class="text-right font-medium text-ink">{{ produto.composicao }}</span>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>
