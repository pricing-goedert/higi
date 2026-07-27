<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { DEFAULT_ID } from '@/constants/defaults'
import type { Lead, LeadFormErrors, LeadFormState } from '@/types/lead'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function estadoInicial(): LeadFormState {
  return {
    nome: '',
    empresa: '',
    email: '',
    telefone: '',
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

function validar(): LeadFormErrors {
  const novos: LeadFormErrors = {}

  if (!form.value.nome.trim()) {
    novos.nome = 'Informe o nome do lead.'
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
  <main class="max-w-3xl mx-auto px-4 -mt-6 md:mt-8 p-7">
    <RouterLink
      to="/"
      class="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-[#193A4C] transition-colors mb-4"
    >
      &larr; Voltar
    </RouterLink>

    <section class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
      <h2
        class="text-xs font-bold text-gray-500 tracking-wider uppercase mb-6 flex items-center gap-2"
      >
        <span class="w-2 h-2 rounded-full bg-[#0baaff]"></span>
        Cadastro de Leads
      </h2>

      <form class="space-y-5" novalidate @submit.prevent="onSubmit">
        <div>
          <label for="nome" class="block text-sm font-semibold text-gray-800 mb-1.5">Nome *</label>
          <input
            id="nome"
            v-model="form.nome"
            type="text"
            placeholder="Nome do contato"
            :aria-invalid="Boolean(errors.nome)"
            :class="[inputBase, errors.nome ? inputErro : inputNormal]"
          />
          <p v-if="errors.nome" class="mt-1.5 text-xs text-red-600">{{ errors.nome }}</p>
        </div>

        <div>
          <label for="empresa" class="block text-sm font-semibold text-gray-800 mb-1.5">
            Empresa
          </label>
          <input
            id="empresa"
            v-model="form.empresa"
            type="text"
            placeholder="Nome da empresa"
            :class="[inputBase, inputNormal]"
          />
        </div>

        <div class="grid gap-5 md:grid-cols-2">
          <div>
            <label for="email" class="block text-sm font-semibold text-gray-800 mb-1.5">
              E-mail *
            </label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              placeholder="contato@empresa.com.br"
              :aria-invalid="Boolean(errors.email)"
              :class="[inputBase, errors.email ? inputErro : inputNormal]"
            />
            <p v-if="errors.email" class="mt-1.5 text-xs text-red-600">{{ errors.email }}</p>
          </div>

          <div>
            <label for="telefone" class="block text-sm font-semibold text-gray-800 mb-1.5">
              Telefone *
            </label>
            <input
              id="telefone"
              v-model="form.telefone"
              type="tel"
              placeholder="(47) 90000-0000"
              :aria-invalid="Boolean(errors.telefone)"
              :class="[inputBase, errors.telefone ? inputErro : inputNormal]"
            />
            <p v-if="errors.telefone" class="mt-1.5 text-xs text-red-600">{{ errors.telefone }}</p>
          </div>
        </div>

        <div>
          <label for="observacoes" class="block text-sm font-semibold text-gray-800 mb-1.5">
            Observações
          </label>
          <textarea
            id="observacoes"
            v-model="form.observacoes"
            rows="4"
            placeholder="Detalhes do contato, interesse, próximos passos..."
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
