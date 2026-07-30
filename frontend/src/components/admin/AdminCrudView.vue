<script setup lang="ts">
/**
 * Config-driven list+form for the collections behind backend's crudRouter
 * (and usuarios, which has the same shape plus a password field). One
 * component instead of one bespoke screen per collection — mirrors the
 * backend's own crudRouter factory.
 */
import { computed, onMounted, ref } from 'vue'
import { api } from '@/lib/api'
import { mascaraCnpj, mascaraTelefone, mascaraCep } from '@/lib/format'

export interface OpcaoCampo {
  valor: string
  rotulo: string
}

export interface CampoForm {
  chave: string
  rotulo: string
  tipo?: 'texto' | 'textarea' | 'numero' | 'checkbox' | 'select' | 'senha' | 'data' | 'hora'
  opcoes?: OpcaoCampo[]
  obrigatorio?: boolean
  obrigatorioSomenteNaCriacao?: boolean
  mascara?: 'cnpj' | 'telefone' | 'cep'
}

export interface ColunaTabela {
  rotulo: string
  valor: (item: Record<string, unknown>) => string
}

const props = defineProps<{
  rotuloItem: string
  apiBase: string
  colunas: ColunaTabela[]
  campos: CampoForm[]
  itemVazio: () => Record<string, unknown>
  filtro?: (item: Record<string, unknown>) => boolean
  antesDeSalvar?: (dados: Record<string, unknown>, modoEdicao: boolean) => Record<string, unknown>
  linkAbrir?: (item: Record<string, unknown>) => { name: string; params?: Record<string, string> }
  rotuloAbrir?: string
  /** "Novo X" vs "Nova X" — most rotuloItem values are masculine, so this defaults to 'o'. */
  genero?: 'o' | 'a'
}>()

const itens = ref<Record<string, unknown>[]>([])
const carregando = ref(true)
const erro = ref('')
const modalAberto = ref(false)
const modoEdicao = ref(false)
const salvando = ref(false)
const erroForm = ref('')
const form = ref<Record<string, unknown>>({})
const idEmEdicao = ref<string | null>(null)

const emit = defineEmits<{ alterou: [] }>()

const itensFiltrados = computed(() => (props.filtro ? itens.value.filter(props.filtro) : itens.value))

async function carregar() {
  carregando.value = true
  erro.value = ''
  try {
    itens.value = await api.get<Record<string, unknown>[]>(props.apiBase)
  } catch {
    erro.value = 'Não foi possível carregar os dados.'
  } finally {
    carregando.value = false
  }
}

onMounted(carregar)

function aplicarMascara(tipo: CampoForm['mascara'], valor: string) {
  if (tipo === 'cnpj') return mascaraCnpj(valor)
  if (tipo === 'telefone') return mascaraTelefone(valor)
  if (tipo === 'cep') return mascaraCep(valor)
  return valor
}

function aoDigitar(campo: CampoForm, evento: Event) {
  const valor = (evento.target as HTMLInputElement).value
  form.value[campo.chave] = campo.mascara ? aplicarMascara(campo.mascara, valor) : valor
}

function abrirNovo() {
  modoEdicao.value = false
  idEmEdicao.value = null
  form.value = { ...props.itemVazio() }
  erroForm.value = ''
  modalAberto.value = true
}

function abrirEdicao(item: Record<string, unknown>) {
  modoEdicao.value = true
  idEmEdicao.value = item.id as string
  const base = { ...item }
  for (const campo of props.campos) {
    if (campo.tipo === 'senha') base[campo.chave] = ''
    // The server returns a full ISO datetime (e.g. "2026-08-05T00:00:00.000Z")
    // but <input type="date"> only accepts a bare "YYYY-MM-DD" — otherwise it
    // silently renders empty.
    if (campo.tipo === 'data' && typeof base[campo.chave] === 'string') {
      base[campo.chave] = (base[campo.chave] as string).slice(0, 10)
    }
  }
  form.value = base
  erroForm.value = ''
  modalAberto.value = true
}

function fecharModal() {
  modalAberto.value = false
}

async function excluir(item: Record<string, unknown>) {
  if (!confirm(`Excluir ${props.rotuloItem.toLowerCase()} "${item.nome ?? item.razaoSocial ?? item.titulo ?? ''}"?`)) return
  try {
    await api.delete(`${props.apiBase}/${item.id}`)
    await carregar()
    emit('alterou')
  } catch {
    alert('Não foi possível excluir. Tente novamente.')
  }
}

function normalizarValor(campo: CampoForm, valor: unknown) {
  if (campo.tipo === 'numero') {
    if (valor === '' || valor === null || valor === undefined) return null
    return Number(valor)
  }
  if (campo.tipo === 'checkbox') return Boolean(valor)
  if (campo.tipo === 'data') {
    // Prisma's DateTime scalar rejects a bare "YYYY-MM-DD" (the raw value an
    // <input type="date"> gives us) — needs a full ISO-8601 string.
    if (!valor) return null
    return new Date(`${valor}T00:00:00`).toISOString()
  }
  if (valor === '') return null
  return valor
}

async function salvar() {
  for (const campo of props.campos) {
    const exige = campo.obrigatorio || (campo.obrigatorioSomenteNaCriacao && !modoEdicao.value)
    if (exige && !form.value[campo.chave]) {
      erroForm.value = `${campo.rotulo} é obrigatório.`
      return
    }
  }

  // Send every key currently in the form, not just the ones with a visible
  // field: itemVazio() uses extra keys (categoriaId/grupoId/tipoId) to scope
  // a new row to its parent in the drill-down views, and those need to reach
  // the API even though they're never edited directly. id/createdAt/updatedAt
  // ride along on `form` after abrirEdicao() copies the fetched item and must
  // never be sent back.
  const camposPorChave = new Map(props.campos.map((campo) => [campo.chave, campo]))
  const CHAVES_SOMENTE_LEITURA = new Set(['id', 'createdAt', 'updatedAt'])
  let dados: Record<string, unknown> = {}
  for (const chave of Object.keys(form.value)) {
    if (CHAVES_SOMENTE_LEITURA.has(chave)) continue
    const campo = camposPorChave.get(chave)
    dados[chave] = campo ? normalizarValor(campo, form.value[chave]) : form.value[chave]
  }
  if (props.antesDeSalvar) dados = props.antesDeSalvar(dados, modoEdicao.value)

  salvando.value = true
  erroForm.value = ''
  try {
    if (modoEdicao.value && idEmEdicao.value) {
      await api.put(`${props.apiBase}/${idEmEdicao.value}`, dados)
    } else {
      await api.post(props.apiBase, dados)
    }
    modalAberto.value = false
    await carregar()
    emit('alterou')
  } catch {
    erroForm.value = 'Não foi possível salvar. Verifique os dados e tente novamente.'
  } finally {
    salvando.value = false
  }
}

defineExpose({ carregar })
</script>

<template>
  <div>
    <div class="mb-4 flex flex-wrap items-center gap-3">
      <span class="text-[0.85rem] text-muted">{{ itensFiltrados.length }} {{ rotuloItem.toLowerCase() }}(s)</span>
      <span class="flex-1" />
      <button
        type="button"
        class="rounded-[10px] bg-primary px-[18px] py-2.5 text-[0.85rem] font-semibold text-white"
        @click="abrirNovo"
      >
        + Novo
      </button>
    </div>

    <p v-if="erro" class="text-[0.85rem] text-danger">{{ erro }}</p>
    <p v-else-if="carregando" class="text-[0.85rem] text-muted">Carregando...</p>
    <p v-else-if="!itensFiltrados.length" class="text-[0.85rem] text-muted">Nenhum registro ainda.</p>

    <div v-else class="overflow-x-auto rounded-2xl bg-card shadow-card">
      <table class="w-full border-collapse">
        <thead>
          <tr>
            <th
              v-for="coluna in colunas"
              :key="coluna.rotulo"
              class="bg-[#F1F5F9] px-3.5 py-3 text-left text-[0.7rem] font-normal uppercase tracking-wide text-muted"
            >
              {{ coluna.rotulo }}
            </th>
            <th class="bg-[#F1F5F9] px-3.5 py-3" />
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in itensFiltrados" :key="item.id as string">
            <td v-for="coluna in colunas" :key="coluna.rotulo" class="border-t border-divider px-3.5 py-2.5 align-top text-[0.85rem]">
              {{ coluna.valor(item) }}
            </td>
            <td class="whitespace-nowrap border-t border-divider px-3.5 py-2.5 text-right align-top">
              <RouterLink
                v-if="linkAbrir"
                :to="linkAbrir(item)"
                class="mr-1.5 inline-block rounded-lg border-[1.5px] border-primary px-2.5 py-1 text-[0.75rem] font-semibold text-primary no-underline"
              >
                {{ rotuloAbrir ?? 'Abrir' }}
              </RouterLink>
              <button
                type="button"
                class="mr-1.5 rounded-lg border-[1.5px] border-primary px-2.5 py-1 text-[0.75rem] font-semibold text-primary"
                @click="abrirEdicao(item)"
              >
                Editar
              </button>
              <button
                type="button"
                class="rounded-lg bg-[#FEE2E2] px-2.5 py-1 text-[0.75rem] font-semibold text-danger"
                @click="excluir(item)"
              >
                Excluir
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="modalAberto" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" @click.self="fecharModal">
      <form class="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-card p-6 shadow-card" @submit.prevent="salvar">
        <h2 class="mb-4 text-[1.05rem] font-bold text-ink">
          {{ modoEdicao ? `Editar ${rotuloItem}` : `${genero === 'a' ? 'Nova' : 'Novo'} ${rotuloItem}` }}
        </h2>

        <div v-for="campo in campos" :key="campo.chave" class="mb-3.5">
          <label v-if="campo.tipo !== 'checkbox'" class="mb-1.5 block text-[13px] font-semibold text-muted">{{ campo.rotulo }}</label>

          <textarea
            v-if="campo.tipo === 'textarea'"
            :value="(form[campo.chave] as string) ?? ''"
            rows="3"
            class="w-full rounded-field border-[1.5px] border-divider bg-card px-3.5 py-2.5 text-ink outline-none focus:border-primary"
            @input="form[campo.chave] = ($event.target as HTMLTextAreaElement).value"
          />

          <select
            v-else-if="campo.tipo === 'select'"
            :value="(form[campo.chave] as string) ?? ''"
            class="h-12 w-full rounded-field border-[1.5px] border-divider bg-card px-3.5 text-ink outline-none focus:border-primary"
            @change="form[campo.chave] = ($event.target as HTMLSelectElement).value || null"
          >
            <option value="">Nenhum</option>
            <option v-for="opcao in campo.opcoes" :key="opcao.valor" :value="opcao.valor">{{ opcao.rotulo }}</option>
          </select>

          <label v-else-if="campo.tipo === 'checkbox'" class="flex items-center gap-2 text-[0.9rem] text-ink">
            <input
              type="checkbox"
              :checked="Boolean(form[campo.chave])"
              class="h-4 w-4"
              @change="form[campo.chave] = ($event.target as HTMLInputElement).checked"
            />
            {{ campo.rotulo }}
          </label>

          <input
            v-else
            :type="
              campo.tipo === 'senha'
                ? 'password'
                : campo.tipo === 'numero'
                  ? 'number'
                  : campo.tipo === 'data'
                    ? 'date'
                    : campo.tipo === 'hora'
                      ? 'time'
                      : 'text'
            "
            :value="(form[campo.chave] as string) ?? ''"
            :placeholder="campo.tipo === 'senha' && modoEdicao ? 'Deixe em branco para manter a atual' : undefined"
            class="h-12 w-full rounded-field border-[1.5px] border-divider bg-card px-3.5 text-ink outline-none focus:border-primary"
            @input="aoDigitar(campo, $event)"
          />
        </div>

        <p v-if="erroForm" class="mb-3 text-[0.85rem] text-danger" role="alert">{{ erroForm }}</p>

        <div class="mt-4 flex justify-end gap-2.5">
          <button type="button" class="rounded-[10px] border-[1.5px] border-primary px-[18px] py-2.5 text-[0.85rem] font-semibold text-primary" @click="fecharModal">
            Cancelar
          </button>
          <button type="submit" :disabled="salvando" class="rounded-[10px] bg-primary px-[18px] py-2.5 text-[0.85rem] font-semibold text-white disabled:opacity-60">
            {{ salvando ? 'Salvando...' : 'Salvar' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
