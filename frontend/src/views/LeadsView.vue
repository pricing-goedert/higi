<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { List, X } from '@lucide/vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import SegmentedControl from '@/components/ui/SegmentedControl.vue'
import TextField from '@/components/ui/TextField.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { getCliente, listClientes, criarLead } from '@/lib/data'
import { cnpjValido, mascaraCep, mascaraCnpj, mascaraTelefone, somenteDigitos } from '@/lib/format'
import type { Cliente, TipoLead } from '@/types/domain'

const route = useRoute()

const tipo = ref<TipoLead>('Revenda')
const cnpj = ref('')
const razaoSocial = ref('')
const cep = ref('')
const contato = ref('')
const endereco = ref('')
const telefone = ref('')
const email = ref('')
const observacoes = ref('')
const clienteVinculado = ref<Cliente | null>(null)
const clienteSugerido = ref<Cliente | null>(null)

const todosClientes = ref<Cliente[]>([])
const enviando = ref(false)
const tentouEnviar = ref(false)
const mensagem = ref('')
const erro = ref('')

onMounted(async () => {
  try {
    todosClientes.value = await listClientes()
  } catch {
    // Non-fatal: only affects the "CNPJ already a client" suggestion below.
  }

  const clienteId = route.query.clienteId
  if (typeof clienteId === 'string') {
    try {
      const cliente = await getCliente(clienteId)
      preencherDeCliente(cliente)
    } catch {
      erro.value = 'Não foi possível carregar os dados do cliente vinculado.'
    }
  }
})

function preencherDeCliente(cliente: Cliente) {
  clienteVinculado.value = cliente
  clienteSugerido.value = null
  cnpj.value = mascaraCnpj(cliente.cnpj)
  razaoSocial.value = cliente.razaoSocial
  contato.value = cliente.contato ?? contato.value
  telefone.value = cliente.telefone ? mascaraTelefone(cliente.telefone) : telefone.value
  endereco.value = cliente.endereco ?? endereco.value
}

// SPECS.md: "if a lead's CNPJ matches an existing client, the rep is
// offered the choice to link the lead to that client record."
watch(cnpj, (valor) => {
  if (clienteVinculado.value) return
  const digitos = somenteDigitos(valor)
  if (!cnpjValido(valor)) {
    clienteSugerido.value = null
    return
  }
  clienteSugerido.value = todosClientes.value.find((cliente) => somenteDigitos(cliente.cnpj) === digitos) ?? null
})

function desvincularCliente() {
  clienteVinculado.value = null
}

const erros = computed(() => ({
  cnpj: !cnpjValido(cnpj.value),
  razaoSocial: !razaoSocial.value.trim(),
  contato: !contato.value.trim(),
  telefone: somenteDigitos(telefone.value).length < 10,
}))

const valido = computed(() => !Object.values(erros.value).some(Boolean))

function limpar() {
  tipo.value = 'Revenda'
  cnpj.value = ''
  razaoSocial.value = ''
  cep.value = ''
  contato.value = ''
  endereco.value = ''
  telefone.value = ''
  email.value = ''
  observacoes.value = ''
  clienteVinculado.value = null
  clienteSugerido.value = null
  tentouEnviar.value = false
}

async function salvar() {
  tentouEnviar.value = true
  erro.value = ''
  if (!valido.value) return

  enviando.value = true
  try {
    await criarLead({
      clientUuid: crypto.randomUUID(),
      tipo: tipo.value,
      cnpj: somenteDigitos(cnpj.value),
      razaoSocial: razaoSocial.value.trim(),
      contato: contato.value.trim(),
      telefone: somenteDigitos(telefone.value),
      cep: cep.value ? somenteDigitos(cep.value) : undefined,
      endereco: endereco.value.trim() || undefined,
      email: email.value.trim() || undefined,
      observacoes: observacoes.value.trim() || undefined,
      clienteId: clienteVinculado.value?.id ?? null,
    })
    mensagem.value = 'Lead salvo com sucesso!'
    limpar()
    setTimeout(() => (mensagem.value = ''), 4000)
  } catch {
    erro.value = 'Não foi possível salvar o lead. Tente novamente.'
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <AppHeader title="Cadastro de Leads" />
  <div class="flex flex-col gap-4 px-4">
    <RouterLink :to="{ name: 'leads-lista' }" class="flex items-center gap-1.5 text-[14px] font-semibold text-primary">
      <List :size="16" /> Ver leads cadastrados
    </RouterLink>

    <p v-if="mensagem" class="rounded-field bg-produtos-soft px-3.5 py-2.5 text-[14px] font-medium text-produtos">
      {{ mensagem }}
    </p>
    <p v-if="erro" class="text-danger">{{ erro }}</p>

    <div>
      <label class="mb-1.5 block text-[13px] font-semibold text-muted">Tipo de Lead *</label>
      <SegmentedControl
        v-model="tipo"
        :opcoes="[
          { valor: 'Revenda', rotulo: 'Revenda' },
          { valor: 'Empresas', rotulo: 'Empresas' },
          { valor: 'Fornecedor', rotulo: 'Fornecedor' },
        ]"
      />
    </div>

    <div v-if="clienteVinculado" class="flex items-center gap-2 rounded-field bg-icon-soft px-3.5 py-2.5">
      <span class="flex-1 text-[13.5px] text-primary">Vinculado a <strong>{{ clienteVinculado.razaoSocial }}</strong></span>
      <button type="button" aria-label="Remover vínculo" @click="desvincularCliente"><X :size="16" class="text-muted" /></button>
    </div>
    <div v-else-if="clienteSugerido" class="rounded-field bg-icon-soft px-3.5 py-2.5">
      <p class="text-[13.5px] text-ink">Este CNPJ já é cliente: <strong>{{ clienteSugerido.razaoSocial }}</strong></p>
      <button type="button" class="mt-1.5 text-[13.5px] font-semibold text-primary" @click="preencherDeCliente(clienteSugerido)">
        Vincular a este cliente
      </button>
    </div>

    <div>
      <TextField
        label="CNPJ *"
        :model-value="cnpj"
        placeholder="00.000.000/0000-00"
        @update:model-value="cnpj = mascaraCnpj($event)"
      />
      <p v-if="tentouEnviar && erros.cnpj" class="mt-1 text-[12.5px] text-danger">Informe um CNPJ válido.</p>
    </div>

    <div>
      <TextField v-model="razaoSocial" label="Razão Social *" placeholder="Nome da empresa" />
      <p v-if="tentouEnviar && erros.razaoSocial" class="mt-1 text-[12.5px] text-danger">Campo obrigatório.</p>
    </div>

    <div class="flex gap-3">
      <TextField
        class="flex-1"
        label="CEP"
        :model-value="cep"
        placeholder="00000-000"
        @update:model-value="cep = mascaraCep($event)"
      />
      <div class="flex-[1.4]">
        <TextField v-model="contato" label="Contato *" placeholder="Nome completo" />
        <p v-if="tentouEnviar && erros.contato" class="mt-1 text-[12.5px] text-danger">Campo obrigatório.</p>
      </div>
    </div>

    <TextField v-model="endereco" label="Endereço" placeholder="Rua, número, bairro" />

    <div class="flex gap-3">
      <div class="flex-1">
        <TextField
          label="Telefone *"
          :model-value="telefone"
          placeholder="(00) 00000-0000"
          @update:model-value="telefone = mascaraTelefone($event)"
        />
        <p v-if="tentouEnviar && erros.telefone" class="mt-1 text-[12.5px] text-danger">Telefone inválido.</p>
      </div>
      <TextField class="flex-[1.2]" v-model="email" label="Email" placeholder="nome@email.com" type="email" />
    </div>

    <div>
      <label class="mb-1.5 block text-[13px] font-semibold text-muted">Observações</label>
      <textarea
        v-model="observacoes"
        placeholder="Digite suas observações..."
        rows="3"
        class="w-full rounded-field border-[1.5px] border-divider bg-card px-3.5 py-3 text-ink outline-none focus:border-primary focus:shadow-focus-ring"
      />
    </div>

    <AppButton variant="primary" :disabled="enviando" class="mb-6" @click="salvar">
      {{ enviando ? 'Salvando...' : 'Salvar Lead' }}
    </AppButton>
  </div>
</template>
