<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { DEFAULT_ID } from '@/constants/defaults'
import type { Lead, LeadFormErrors, LeadFormState, TipoLead } from '@/types/lead'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const tiposLead: { valor: TipoLead; rotulo: string }[] = [
  { valor: 'revenda', rotulo: 'Revenda' },
  { valor: 'empresa', rotulo: 'Empresas' },
  { valor: 'fornecedor', rotulo: 'Fornecedor' },
]

function estadoInicial(): LeadFormState {
  return {
    tipoLead: 'revenda',
    cnpj: '',
    razaoSocial: '',
    cep: '',
    contato: '',
    endereco: '',
    telefone: '',
    email: '',
    colaborador: '',
    observacoes: '',
  }
}

const form = ref<LeadFormState>(estadoInicial())
const errors = ref<LeadFormErrors>({})
const sucesso = ref(false)
const leadEnviado = ref<Lead | null>(null)

const inputBase =
  'w-full rounded-xl bg-slate-50 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 border transition-colors focus:outline-none focus:ring-2 focus:ring-[#0baaff]/40'
const inputNormal = 'border-gray-200 focus:border-[#0baaff]'
const inputErro = 'border-red-400 focus:border-red-500'

const aplicarMascaraCnpj = (event: Event) => {
  const input = event.target as HTMLInputElement
  let valor = input.value.replace(/\D/g, '');
  valor = valor.replace(/^(\d{2})(\d)/, "$1.$2");
  valor = valor.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
  valor = valor.replace(/\.(\d{3})(\d)/, ".$1/$2");
  valor = valor.replace(/(\d{4})(\d)/, "$1-$2");
  input.value = valor;
  form.value.cnpj = valor;
};

const aplicarMascaraCep = (event: Event) => {
  const input = event.target as HTMLInputElement
  let valor = input.value.replace(/\D/g, '');
  valor = valor.replace(/^(\d{5})(\d)/, "$1-$2");
  input.value = valor;
  form.value.cep = valor;
};

function validar(): LeadFormErrors {
  const novos: LeadFormErrors = {}

  if (!form.value.razaoSocial.trim()) {
    novos.razaoSocial = 'Informe a razão social.'
  }

  if (!form.value.email.trim()) {
    novos.email = 'Informe o e-mail.'
  } else if (!EMAIL_REGEX.test(form.value.email.trim())) {
    novos.email = 'Informe um e-mail válido.'
  }

  if (!form.value.telefone.trim()) {
    novos.telefone = 'Informe o telefone.'
  }

  return novos
}

function onSubmit() {
  sucesso.value = false
  errors.value = validar()

  if (Object.keys(errors.value).length > 0) return

  // Sem banco de dados ainda: o lead é apenas montado e exibido.
  const lead: Lead = {
    ...form.value,
    id: DEFAULT_ID,
    criadoEm: new Date().toISOString(),
  }

  console.log('Lead cadastrado:', lead)

  leadEnviado.value = lead
  sucesso.value = true
  form.value = estadoInicial()
}
</script>

<template>
  <main class="max-w-xl mx-auto px-4 -mt-6 md:mt-8 p-7">
    <RouterLink
  to="/"
  class="inline-flex gap-1 items-center justify-center text-blue-900 hover:text-blue-700 rounded-lg transition-colors mb-4"
  title="Voltar"
>
  <span class="text-4xl font-semibold">&larr;</span><p class="-ml-8 font-semibold translate-4">Voltar</p>
</RouterLink>

    <section class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
      <h2
        class="text-xs font-bold text-gray-500 tracking-wider uppercase mb-6 flex items-center gap-2"
      >
        <span class="w-2 h-2 rounded-full bg-[#0baaff]"></span>
        Cadastro de Leads
      </h2>

      <form class="space-y-5" validate @submit.prevent="onSubmit">

        <div>
          <label class="block text-sm font-semibold text-gray-800 mb-2">Tipo de Lead *</label>
          <div
            role="group"
            aria-label="Tipo de lead"
            class="inline-flex w-full rounded-xl bg-slate-100 p-1 gap-1"
          >
            <button
              v-for="opcao in tiposLead"
              :key="opcao.valor"
              type="button"
              :aria-pressed="form.tipoLead === opcao.valor"
              @click="form.tipoLead = opcao.valor"
              class="flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#0baaff]/40"
              :class="
                form.tipoLead === opcao.valor
                  ? 'bg-[#193A4C] text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              "
            >
              {{ opcao.rotulo }}
            </button>
          </div>
        </div>

        <div>
          <label for="cnpj" class="block text-sm font-semibold text-gray-800 mb-1.5">
            CNPJ
          </label>
          <input
            id="cnpj"
            v-model="form.cnpj"
            type="text"
            maxlength="18"
            placeholder="00.000.000/0000-00"
            @input="aplicarMascaraCnpj($event)"
            :class="[inputBase, inputNormal]"
          />
        </div>

        <div>
          <label for="razaoSocial" class="block text-sm font-semibold text-gray-800 mb-1.5">
            Razão Social*
          </label>
          <input
            id="razaoSocial"
            v-model="form.razaoSocial"
            type="text"
            placeholder="Nome da empresa"
            maxlenght="150"
            :aria-invalid="Boolean(errors.razaoSocial)"
            :class="[inputBase, errors.razaoSocial ? inputErro : inputNormal]"
          />
          <p v-if="errors.razaoSocial" class="mt-1.5 text-xs text-red-600">
            {{ errors.razaoSocial }}
          </p>
        </div>

        <div class="grid gap-5 md:grid-cols-2">
          <div>
            <label for="CEP" class="block text-sm font-semibold text-gray-800 mb-1.5">
              CEP
            </label>
            <input
              id="CEP"
              v-model="form.cep"
              type="text"
              placeholder="00000-000"
              maxlength="9"
              @input="aplicarMascaraCep($event)"
              :class="[inputBase, inputNormal]"
            />
          </div>
          
          <div>
            <label for="contato" class="block text-sm font-semibold text-gray-800 mb-1.5">Contato</label>
            <input
              id="contato"
              v-model="form.contato"
              type="text"
              maxlength="100"
              placeholder="Nome Completo"
              :class="[inputBase, inputNormal]"
            />
          </div>
        </div>
        
        <div>
          <label for="endereco" class="block text-sm font-semibold text-gray-800">
            Endereço
          </label>
          <input
          id="endereco"
          v-model="form.endereco"
          type="text"
          placeholder="Rua, número, bairro"
          maxlength="150"
          :class="[inputBase, inputNormal]"
          />
        </div>

        <div class="grid gap-5 md:grid-cols-2">
          <div>
            <label for="telefone" class="block text-sm font-semibold text-gray-800 mb-1.5">
              Telefone *
            </label>
            <input
              id="telefone"
              v-model="form.telefone"
              type="tel"
              placeholder="(00) 00000-0000"
              :aria-invalid="Boolean(errors.telefone)"
              :class="[inputBase, errors.telefone ? inputErro : inputNormal]"
            />
            <p v-if="errors.telefone" class="mt-1.5 text-xs text-red-600">{{ errors.telefone }}</p>
          </div>
          <div>
            <label for="email" class="block text-sm font-semibold text-gray-800 mb-1.5">
              E-mail *
            </label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              placeholder="contato@empresa.com.br"
              maxlength="100"
              :aria-invalid="Boolean(errors.email)"
              :class="[inputBase, errors.email ? inputErro : inputNormal]"
            />
            <p v-if="errors.email" class="mt-1.5 text-xs text-red-600">{{ errors.email }}</p>
          </div>
        </div>

        <div>
          <label for="colaborador" class="block text-sm font-semibold text-gray-800 mb-1.5">
            Colaborador
          </label>
          <input
            id="colaborador"
            v-model="form.colaborador"
            type="text"
            placeholder="Nome do vendedor/expositor"
            maxlength="100"
            :class="[inputBase, inputNormal]"
          />
        </div>
        <div>
          <label for="observacoes" class="block text-sm font-semibold text-gray-800 mb-1.5">
            Observações
          </label>
          <textarea
            id="observacoes"
            v-model="form.observacoes"
            rows="4"
            placeholder="Digite suas observações..."
            maxlength="250"
            :class="[inputBase, inputNormal, 'resize-y']"
          ></textarea>
        </div>

        <div class="flex items-center gap-3 pt-2">
          <button
            type="submit"
            class="bg-[#193A4C] text-white text-sm font-semibold px-6 py-3 rounded-xl shadow-sm hover:shadow-md transition-shadow"
          >
            Cadastrar lead
          </button>
          <span class="text-xs text-gray-400">* campos obrigatórios</span>
        </div>
      </form>

      <div
        v-if="sucesso && leadEnviado"
        class="mt-6 rounded-xl border border-green-200 bg-green-50 p-4"
      >
        <p class="text-sm font-semibold text-green-800">Lead cadastrado com sucesso!</p>
        <p class="mt-1 text-xs text-green-700">
          Ainda não há banco de dados. O objeto abaixo é o que o formulário gerou — o
          <code class="font-mono">id</code> vem de <code class="font-mono">DEFAULT_ID</code> em
          <code class="font-mono">src/constants/defaults.ts</code>.
        </p>
        <pre
          class="mt-3 overflow-x-auto rounded-lg bg-white border border-green-100 p-3 text-xs text-gray-700"
          >{{ JSON.stringify(leadEnviado, null, 2) }}</pre>
      </div>
    </section>
  </main>
</template>
