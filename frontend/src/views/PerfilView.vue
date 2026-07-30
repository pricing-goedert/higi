<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import TextField from '@/components/ui/TextField.vue'
import SelectField from '@/components/ui/SelectField.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { useAuthStore } from '@/stores/auth'
import { api, ApiError } from '@/lib/api'
import { mascaraTelefone } from '@/lib/format'
import { UFS } from '@/lib/constants'
import type { Usuario } from '@/types/domain'

const auth = useAuthStore()
const router = useRouter()

const carregando = ref(true)
const salvando = ref(false)
const erro = ref('')
const mensagem = ref('')

const nome = ref('')
const email = ref('')
const telefone = ref('')
const whatsapp = ref('')
const endereco = ref('')
const cidade = ref('')
const uf = ref('')
const pais = ref('')

const senhaAtual = ref('')
const novaSenha = ref('')
const confirmarNovaSenha = ref('')

onMounted(async () => {
  try {
    const usuario = await api.get<Usuario>(`/usuarios/${auth.usuario!.id}`)
    preencherDe(usuario)
  } catch {
    erro.value = 'Não foi possível carregar seus dados.'
  } finally {
    carregando.value = false
  }
})

function preencherDe(usuario: Usuario) {
  nome.value = usuario.nome
  email.value = usuario.email
  telefone.value = usuario.telefone ? mascaraTelefone(usuario.telefone) : ''
  whatsapp.value = usuario.whatsapp ? mascaraTelefone(usuario.whatsapp) : ''
  endereco.value = usuario.endereco ?? ''
  cidade.value = usuario.cidade ?? ''
  uf.value = usuario.uf ?? ''
  pais.value = usuario.pais ?? ''
}

async function salvar() {
  erro.value = ''
  mensagem.value = ''

  if (!nome.value.trim() || !email.value.trim()) {
    erro.value = 'Nome e email são obrigatórios.'
    return
  }
  if (novaSenha.value && novaSenha.value !== confirmarNovaSenha.value) {
    erro.value = 'A confirmação da nova senha não confere.'
    return
  }

  const dados: Record<string, unknown> = {
    nome: nome.value,
    email: email.value,
    telefone: telefone.value || null,
    whatsapp: whatsapp.value || null,
    endereco: endereco.value || null,
    cidade: cidade.value || null,
    uf: uf.value || null,
    pais: pais.value || null,
  }
  if (novaSenha.value) {
    dados.senhaAtual = senhaAtual.value
    dados.novaSenha = novaSenha.value
  }

  salvando.value = true
  try {
    await api.put('/auth/me', dados)
    auth.atualizarNome(nome.value)
    mensagem.value = 'Dados atualizados com sucesso.'
    senhaAtual.value = ''
    novaSenha.value = ''
    confirmarNovaSenha.value = ''
  } catch (e) {
    erro.value = e instanceof ApiError ? e.message : 'Não foi possível salvar. Tente novamente.'
  } finally {
    salvando.value = false
  }
}

async function sair() {
  await auth.logout()
  router.replace({ name: 'login' })
}
</script>

<template>
  <AppHeader title="Meu perfil" />
  <form class="px-4 pb-8" @submit.prevent="salvar">
    <p v-if="carregando" class="text-muted">Carregando...</p>

    <template v-else>
      <div class="mb-3.5"><TextField v-model="nome" label="Nome" /></div>
      <div class="mb-3.5"><TextField v-model="email" label="Email" type="email" /></div>
      <div class="mb-3.5">
        <TextField :model-value="telefone" label="Telefone" @update:model-value="(v) => (telefone = mascaraTelefone(v))" />
      </div>
      <div class="mb-3.5">
        <TextField :model-value="whatsapp" label="WhatsApp" @update:model-value="(v) => (whatsapp = mascaraTelefone(v))" />
      </div>
      <div class="mb-3.5"><TextField v-model="endereco" label="Endereço" /></div>
      <div class="mb-3.5"><TextField v-model="cidade" label="Cidade" /></div>
      <div class="mb-3.5"><SelectField v-model="uf" label="UF" :opcoes="UFS" /></div>
      <div class="mb-5"><TextField v-model="pais" label="País" /></div>

      <p class="mb-2 text-[13px] font-semibold text-muted">Alterar senha (opcional)</p>
      <div class="mb-3.5"><TextField v-model="senhaAtual" label="Senha atual" type="password" /></div>
      <div class="mb-3.5"><TextField v-model="novaSenha" label="Nova senha" type="password" /></div>
      <div class="mb-5"><TextField v-model="confirmarNovaSenha" label="Confirmar nova senha" type="password" /></div>

      <p v-if="erro" class="mb-3 text-[13.5px] text-danger" role="alert">{{ erro }}</p>
      <p v-if="mensagem" class="mb-3 text-[13.5px] text-primary">{{ mensagem }}</p>

      <AppButton type="submit" :disabled="salvando">{{ salvando ? 'Salvando...' : 'Salvar' }}</AppButton>
      <div class="mt-3">
        <AppButton type="button" variant="secondary" @click="sair">Sair</AppButton>
      </div>
    </template>
  </form>
</template>
