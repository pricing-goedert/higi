<script setup lang="ts">
/**
 * Bulk CSV import for the ERP-sourced collections (docs/PLAN.md's Phase 8) —
 * desktop/online only by design, this is a developer/onboarding tool, not
 * part of the mobile app surface. Parsing happens client-side (Papa Parse);
 * the backend (backend/src/routes/importar.ts) owns every validation rule,
 * so this view only renders whatever it reports back.
 */
import { computed, ref } from 'vue'
import Papa from 'papaparse'
import { api, ApiError } from '@/lib/api'
import SegmentedControl from '@/components/ui/SegmentedControl.vue'

type Colecao = 'clientes' | 'usuarios' | 'produtos'

const COLECOES: { valor: Colecao; rotulo: string }[] = [
  { valor: 'clientes', rotulo: 'Clientes' },
  { valor: 'usuarios', rotulo: 'Usuários' },
  { valor: 'produtos', rotulo: 'Produtos' },
]

interface ResultadoLinha {
  linha: number
  status: 'criado' | 'atualizado' | 'erro'
  mensagem?: string
}

interface RespostaImportacao {
  confirmado: boolean
  resultados: ResultadoLinha[]
  resumo: { criados: number; atualizados: number; erros: number }
}

const colecao = ref<Colecao>('clientes')
const linhas = ref<Record<string, string>[]>([])
const resultado = ref<RespostaImportacao | null>(null)
const enviando = ref(false)
const erro = ref('')
const nomeArquivo = ref('')

const modeloUrl = computed(() => `/api/importar/${colecao.value}/modelo`)
const totalErros = computed(() => resultado.value?.resumo.erros ?? 0)

function reiniciar() {
  linhas.value = []
  resultado.value = null
  erro.value = ''
  nomeArquivo.value = ''
}

function trocarColecao(valor: string) {
  colecao.value = valor as Colecao
  reiniciar()
}

async function enviar(confirmarImportacao: boolean) {
  enviando.value = true
  erro.value = ''
  try {
    resultado.value = await api.post<RespostaImportacao>(`/importar/${colecao.value}`, {
      linhas: linhas.value,
      confirmar: confirmarImportacao,
    })
  } catch (e) {
    erro.value = e instanceof ApiError ? e.message : 'Não foi possível processar a importação.'
  } finally {
    enviando.value = false
  }
}

async function aoSelecionarArquivo(evento: Event) {
  const arquivo = (evento.target as HTMLInputElement).files?.[0]
  ;(evento.target as HTMLInputElement).value = ''
  if (!arquivo) return

  reiniciar()
  nomeArquivo.value = arquivo.name

  Papa.parse<Record<string, string>>(arquivo, {
    header: true,
    skipEmptyLines: true,
    complete: async (resultadoParse) => {
      if (!resultadoParse.data.length) {
        erro.value = 'O arquivo está vazio.'
        return
      }
      linhas.value = resultadoParse.data
      await enviar(false)
    },
    error: () => {
      erro.value = 'Não foi possível ler o arquivo. Confirme que é um CSV válido.'
    },
  })
}
</script>

<template>
  <div class="max-w-3xl">
    <p class="mb-4 text-[0.85rem] text-muted">
      Importa vários registros de uma vez a partir de um CSV. Baixe o modelo, preencha as colunas e envie — o
      sistema mostra uma prévia de cada linha antes de gravar qualquer coisa.
    </p>

    <SegmentedControl :model-value="colecao" :opcoes="COLECOES" @update:model-value="trocarColecao" />

    <div class="mt-5 flex flex-wrap items-center gap-3">
      <a
        :href="modeloUrl"
        download
        class="rounded-[10px] border-[1.5px] border-primary px-[18px] py-2.5 text-[0.85rem] font-semibold text-primary no-underline"
      >
        Baixar modelo CSV
      </a>
      <label class="cursor-pointer rounded-[10px] bg-primary px-[18px] py-2.5 text-[0.85rem] font-semibold text-white">
        Escolher arquivo
        <input type="file" accept=".csv" class="hidden" @change="aoSelecionarArquivo" />
      </label>
      <span v-if="nomeArquivo" class="text-[0.85rem] text-muted">{{ nomeArquivo }}</span>
    </div>

    <p class="mt-2 text-[0.75rem] text-muted">
      Salve o arquivo como CSV UTF-8 antes de enviar — outras codificações podem corromper acentos (ç, ã, õ).
    </p>

    <p v-if="erro" class="mt-3 text-[0.85rem] text-danger" role="alert">{{ erro }}</p>
    <p v-else-if="enviando" class="mt-3 text-[0.85rem] text-muted">Processando...</p>

    <div v-if="resultado" class="mt-5">
      <div class="mb-3 flex flex-wrap gap-4 text-[0.85rem]">
        <span class="font-semibold text-ink">{{ resultado.resumo.criados }} {{ resultado.confirmado ? 'criados' : 'a criar' }}</span>
        <span class="font-semibold text-ink">{{ resultado.resumo.atualizados }} {{ resultado.confirmado ? 'atualizados' : 'a atualizar' }}</span>
        <span class="font-semibold" :class="totalErros ? 'text-danger' : 'text-muted'">{{ totalErros }} com erro</span>
      </div>

      <div class="max-h-96 overflow-y-auto rounded-2xl bg-card shadow-card">
        <table class="w-full border-collapse">
          <thead>
            <tr>
              <th class="bg-[#F1F5F9] px-3.5 py-2.5 text-left text-[0.7rem] font-normal uppercase tracking-wide text-muted">Linha</th>
              <th class="bg-[#F1F5F9] px-3.5 py-2.5 text-left text-[0.7rem] font-normal uppercase tracking-wide text-muted">Status</th>
              <th class="bg-[#F1F5F9] px-3.5 py-2.5 text-left text-[0.7rem] font-normal uppercase tracking-wide text-muted">Mensagem</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="linha in resultado.resultados" :key="linha.linha">
              <td class="border-t border-divider px-3.5 py-2 text-[0.85rem]">{{ linha.linha }}</td>
              <td class="border-t border-divider px-3.5 py-2 text-[0.85rem] capitalize" :class="linha.status === 'erro' ? 'text-danger' : 'text-ink'">
                {{ linha.status }}
              </td>
              <td class="border-t border-divider px-3.5 py-2 text-[0.85rem] text-muted">{{ linha.mensagem }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-if="resultado.confirmado" class="mt-4 text-[0.85rem] font-semibold text-primary">Importação concluída.</p>

      <div class="mt-4 flex gap-2.5">
        <button
          v-if="!resultado.confirmado"
          type="button"
          :disabled="enviando || resultado.resumo.criados + resultado.resumo.atualizados === 0"
          class="rounded-[10px] bg-primary px-[18px] py-2.5 text-[0.85rem] font-semibold text-white disabled:opacity-60"
          @click="enviar(true)"
        >
          Confirmar importação
        </button>
        <button
          type="button"
          class="rounded-[10px] border-[1.5px] border-primary px-[18px] py-2.5 text-[0.85rem] font-semibold text-primary"
          @click="reiniciar"
        >
          {{ resultado.confirmado ? 'Nova importação' : 'Cancelar' }}
        </button>
      </div>
    </div>
  </div>
</template>
