<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import TextField from '@/components/ui/TextField.vue'
import AppButton from '@/components/ui/AppButton.vue'
import SectionLabel from '@/components/ui/SectionLabel.vue'
import RowCard from '@/components/ui/RowCard.vue'
import { mascaraCnpj } from '@/lib/format'
import { obterRecentes } from '@/lib/recentes'

const router = useRouter()
const cnpj = ref('')
const recentes = obterRecentes()

function buscar() {
  router.push({ name: 'clientes-lista', query: { cnpj: cnpj.value || undefined } })
}
</script>

<template>
  <AppHeader title="Pesquisa de Cliente" />
  <div class="px-4">
    <TextField
      label="CNPJ"
      :model-value="cnpj"
      placeholder="00.000.000/0000-00"
      @update:model-value="cnpj = mascaraCnpj($event)"
    />
    <AppButton variant="primary" class="mt-7" @click="buscar">Buscar</AppButton>

    <template v-if="recentes.length > 0">
      <SectionLabel>Buscas recentes</SectionLabel>
      <div class="lg:grid lg:grid-cols-2 lg:gap-x-3.5 xl:grid-cols-3">
        <RowCard
          v-for="recente in recentes"
          :key="recente.id"
          :to="{ name: 'cliente-detalhe', params: { id: recente.id } }"
          :title="recente.razaoSocial"
          :subtitle="mascaraCnpj(recente.cnpj)"
        />
      </div>
    </template>
  </div>
</template>
