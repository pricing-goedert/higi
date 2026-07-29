<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import SegmentedControl from '@/components/ui/SegmentedControl.vue'
import TextField from '@/components/ui/TextField.vue'
import SelectField from '@/components/ui/SelectField.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { mascaraCnpj } from '@/lib/format'
import { UFS } from '@/lib/constants'

const router = useRouter()

const tipo = ref<'nacional' | 'exportacao'>('nacional')
const cnpj = ref('')
const cidade = ref('')
const uf = ref('')
const pais = ref('')

function limparFiltros() {
  cnpj.value = ''
  cidade.value = ''
  uf.value = ''
  pais.value = ''
}

function buscar() {
  router.push({
    name: 'representantes-lista',
    query: {
      tipo: tipo.value,
      cnpj: cnpj.value || undefined,
      cidade: tipo.value === 'nacional' ? cidade.value || undefined : undefined,
      uf: tipo.value === 'nacional' ? uf.value || undefined : undefined,
      pais: tipo.value === 'exportacao' ? pais.value || undefined : undefined,
    },
  })
}
</script>

<template>
  <AppHeader title="Pesquisa de Representante" />
  <div class="flex flex-col gap-4 px-4">
    <SegmentedControl
      v-model="tipo"
      :opcoes="[
        { valor: 'nacional', rotulo: 'Nacional' },
        { valor: 'exportacao', rotulo: 'Exportação' },
      ]"
    />

    <TextField
      label="CNPJ"
      :model-value="cnpj"
      placeholder="00.000.000/0000-00"
      @update:model-value="cnpj = mascaraCnpj($event)"
    />

    <template v-if="tipo === 'nacional'">
      <TextField v-model="cidade" label="Cidade" placeholder="Ex: São Paulo" />
      <SelectField v-model="uf" label="Estado (UF)" :opcoes="UFS" />
    </template>
    <TextField v-else v-model="pais" label="País" placeholder="Ex: Argentina" />

    <div class="mt-2 flex flex-col gap-3.5">
      <AppButton variant="primary" @click="buscar">Buscar</AppButton>
      <AppButton variant="secondary" @click="limparFiltros">Limpar filtros</AppButton>
    </div>
  </div>
</template>
