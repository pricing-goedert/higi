<script setup lang="ts">
/**
 * Bespoke rather than AdminCrudView: an Orientacao owns a nested, reorderable
 * list of secoes (title+text+ordem), which doesn't fit the generic
 * flat-field form. The backend replaces all secoes wholesale on PUT (see
 * routes/orientacoes.ts) so the form just sends the full array each save.
 */
import { onMounted, ref } from 'vue'
import { api } from '@/lib/api'
import type { Orientacao, OrientacaoSecao } from '@/types/domain'

type SecaoForm = Pick<OrientacaoSecao, 'titulo' | 'texto' | 'ordem'>

const orientacoes = ref<Orientacao[]>([])
const carregando = ref(true)
const erro = ref('')

const modalAberto = ref(false)
const modoEdicao = ref(false)
const idEmEdicao = ref<string | null>(null)
const salvando = ref(false)
const erroForm = ref('')

const titulo = ref('')
const descricao = ref('')
const ordem = ref(0)
const secoes = ref<SecaoForm[]>([])

async function carregar() {
  carregando.value = true
  erro.value = ''
  try {
    orientacoes.value = await api.get<Orientacao[]>('/orientacoes')
  } catch {
    erro.value = 'Não foi possível carregar os dados.'
  } finally {
    carregando.value = false
  }
}

onMounted(carregar)

function abrirNovo() {
  modoEdicao.value = false
  idEmEdicao.value = null
  titulo.value = ''
  descricao.value = ''
  ordem.value = 0
  secoes.value = []
  erroForm.value = ''
  modalAberto.value = true
}

function abrirEdicao(item: Orientacao) {
  modoEdicao.value = true
  idEmEdicao.value = item.id
  titulo.value = item.titulo
  descricao.value = item.descricao ?? ''
  ordem.value = item.ordem
  secoes.value = item.secoes.map((s) => ({ titulo: s.titulo, texto: s.texto, ordem: s.ordem }))
  erroForm.value = ''
  modalAberto.value = true
}

function fecharModal() {
  modalAberto.value = false
}

function adicionarSecao() {
  secoes.value.push({ titulo: null, texto: '', ordem: secoes.value.length })
}

function removerSecao(indice: number) {
  secoes.value.splice(indice, 1)
}

async function excluir(item: Orientacao) {
  if (!confirm(`Excluir orientação "${item.titulo}"?`)) return
  try {
    await api.delete(`/orientacoes/${item.id}`)
    await carregar()
  } catch {
    alert('Não foi possível excluir. Tente novamente.')
  }
}

async function salvar() {
  if (!titulo.value.trim()) {
    erroForm.value = 'Título é obrigatório.'
    return
  }
  if (secoes.value.some((s) => !s.texto.trim())) {
    erroForm.value = 'Toda seção precisa de um texto.'
    return
  }

  const dados = {
    titulo: titulo.value,
    descricao: descricao.value || null,
    ordem: ordem.value,
    secoes: secoes.value.map((s, i) => ({ titulo: s.titulo || null, texto: s.texto, ordem: i })),
  }

  salvando.value = true
  erroForm.value = ''
  try {
    if (modoEdicao.value && idEmEdicao.value) {
      await api.put(`/orientacoes/${idEmEdicao.value}`, dados)
    } else {
      await api.post('/orientacoes', dados)
    }
    modalAberto.value = false
    await carregar()
  } catch {
    erroForm.value = 'Não foi possível salvar. Tente novamente.'
  } finally {
    salvando.value = false
  }
}
</script>

<template>
  <div>
    <div class="mb-4 flex flex-wrap items-center gap-3">
      <span class="text-[0.85rem] text-muted">{{ orientacoes.length }} orientação(ões)</span>
      <span class="flex-1" />
      <button type="button" class="rounded-[10px] bg-primary px-[18px] py-2.5 text-[0.85rem] font-semibold text-white" @click="abrirNovo">
        + Novo
      </button>
    </div>

    <p v-if="erro" class="text-[0.85rem] text-danger">{{ erro }}</p>
    <p v-else-if="carregando" class="text-[0.85rem] text-muted">Carregando...</p>
    <p v-else-if="!orientacoes.length" class="text-[0.85rem] text-muted">Nenhum registro ainda.</p>

    <div v-else class="overflow-x-auto rounded-2xl bg-card shadow-card">
      <table class="w-full border-collapse">
        <thead>
          <tr>
            <th class="bg-[#F1F5F9] px-3.5 py-3 text-left text-[0.7rem] font-normal uppercase tracking-wide text-muted">Título</th>
            <th class="bg-[#F1F5F9] px-3.5 py-3 text-left text-[0.7rem] font-normal uppercase tracking-wide text-muted">Seções</th>
            <th class="bg-[#F1F5F9] px-3.5 py-3" />
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in orientacoes" :key="item.id">
            <td class="border-t border-divider px-3.5 py-2.5 text-[0.85rem]">{{ item.titulo }}</td>
            <td class="border-t border-divider px-3.5 py-2.5 text-[0.85rem]">{{ item.secoes.length }}</td>
            <td class="whitespace-nowrap border-t border-divider px-3.5 py-2.5 text-right">
              <button type="button" class="mr-1.5 rounded-lg border-[1.5px] border-primary px-2.5 py-1 text-[0.75rem] font-semibold text-primary" @click="abrirEdicao(item)">
                Editar
              </button>
              <button type="button" class="rounded-lg bg-[#FEE2E2] px-2.5 py-1 text-[0.75rem] font-semibold text-danger" @click="excluir(item)">
                Excluir
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="modalAberto" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" @click.self="fecharModal">
      <form class="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-card p-6 shadow-card" @submit.prevent="salvar">
        <h2 class="mb-4 text-[1.05rem] font-bold text-ink">{{ modoEdicao ? 'Editar Orientação' : 'Nova Orientação' }}</h2>

        <div class="mb-3.5">
          <label class="mb-1.5 block text-[13px] font-semibold text-muted">Título</label>
          <input v-model="titulo" class="h-12 w-full rounded-field border-[1.5px] border-divider bg-card px-3.5 text-ink outline-none focus:border-primary" />
        </div>
        <div class="mb-3.5">
          <label class="mb-1.5 block text-[13px] font-semibold text-muted">Descrição</label>
          <textarea v-model="descricao" rows="2" class="w-full rounded-field border-[1.5px] border-divider bg-card px-3.5 py-2.5 text-ink outline-none focus:border-primary" />
        </div>
        <div class="mb-4">
          <label class="mb-1.5 block text-[13px] font-semibold text-muted">Ordem</label>
          <input v-model.number="ordem" type="number" class="h-12 w-full rounded-field border-[1.5px] border-divider bg-card px-3.5 text-ink outline-none focus:border-primary" />
        </div>

        <div class="mb-2 flex items-center justify-between">
          <span class="text-[13px] font-semibold text-muted">Seções</span>
          <button type="button" class="rounded-lg border-[1.5px] border-primary px-2.5 py-1 text-[0.75rem] font-semibold text-primary" @click="adicionarSecao">
            + Adicionar seção
          </button>
        </div>

        <div v-for="(secao, indice) in secoes" :key="indice" class="mb-3 rounded-xl border border-divider p-3">
          <div class="mb-2 flex items-center justify-between">
            <span class="text-[0.75rem] font-semibold text-muted">Seção {{ indice + 1 }}</span>
            <button type="button" class="text-[0.75rem] font-semibold text-danger" @click="removerSecao(indice)">Remover</button>
          </div>
          <input
            v-model="secao.titulo"
            placeholder="Título da seção (opcional)"
            class="mb-2 h-11 w-full rounded-field border-[1.5px] border-divider bg-card px-3 text-ink outline-none focus:border-primary"
          />
          <textarea
            v-model="secao.texto"
            placeholder="Texto"
            rows="2"
            class="w-full rounded-field border-[1.5px] border-divider bg-card px-3 py-2 text-ink outline-none focus:border-primary"
          />
        </div>
        <p v-if="!secoes.length" class="mb-3 text-[0.8rem] text-muted">Nenhuma seção ainda.</p>

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
