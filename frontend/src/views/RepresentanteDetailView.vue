<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Mail, MapPin, MessageCircle, Phone } from '@lucide/vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import Avatar from '@/components/ui/Avatar.vue'
import SectionLabel from '@/components/ui/SectionLabel.vue'
import ContactRow from '@/components/ui/ContactRow.vue'
import RowCard from '@/components/ui/RowCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { getUsuario, listUsuarios } from '@/lib/data'
import { mascaraCnpj, somenteDigitos } from '@/lib/format'
import type { Usuario } from '@/types/domain'

const route = useRoute()
const id = computed(() => route.params.id as string)

const representante = ref<Usuario | null>(null)
const gerente = ref<Usuario | null>(null)
const equipe = ref<Usuario[]>([])
const carregando = ref(true)
const erro = ref('')

async function carregar() {
  carregando.value = true
  erro.value = ''
  try {
    const [encontrado, todos] = await Promise.all([getUsuario(id.value), listUsuarios()])
    representante.value = encontrado
    equipe.value = todos.filter((usuario) => usuario.superiorId === encontrado.id)
    gerente.value = encontrado.superiorId ? (todos.find((usuario) => usuario.id === encontrado.superiorId) ?? null) : null
  } catch {
    erro.value = 'Não foi possível carregar este representante.'
  } finally {
    carregando.value = false
  }
}

onMounted(carregar)

const subtitulo = computed(() => {
  if (!representante.value) return ''
  if (representante.value.tipoRepresentante === 'exportacao') return representante.value.pais ?? ''
  return [representante.value.cidade, representante.value.uf].filter(Boolean).join(' - ')
})
</script>

<template>
  <AppHeader title="Representante" />
  <div class="px-4">
    <p v-if="erro" class="text-danger">{{ erro }}</p>
    <p v-else-if="carregando" class="text-muted">Carregando...</p>

    <template v-else-if="representante">
      <div class="mb-5 flex flex-col items-center text-center">
        <Avatar :nome="representante.nome" :size="84" />
        <div class="mt-3.5 text-[19px] font-bold text-ink">{{ representante.nome }}</div>
        <div v-if="subtitulo" class="mt-1 text-[14px] text-muted">{{ subtitulo }}</div>
        <div v-if="representante.cnpj" class="mt-2.5 rounded-chip bg-icon-soft px-3 py-1 text-[13px] font-medium text-primary">
          {{ mascaraCnpj(representante.cnpj) }}
        </div>
      </div>

      <template v-if="equipe.length > 0">
        <SectionLabel>Equipe</SectionLabel>
        <div class="no-scrollbar mb-3.5 flex gap-4 overflow-x-auto rounded-card bg-card p-[18px] shadow-card">
          <div v-for="membro in equipe" :key="membro.id" class="flex min-w-[64px] flex-col items-center gap-1.5">
            <Avatar :nome="membro.nome" :size="52" />
            <span class="text-center text-[12px] text-muted">{{ membro.nome }}</span>
          </div>
        </div>
      </template>

      <template v-if="gerente">
        <SectionLabel>Gerente responsável</SectionLabel>
        <RowCard
          :to="{ name: 'representante-detalhe', params: { id: gerente.id } }"
          :title="gerente.nome"
          subtitle="Fale com o gerente se este representante não estiver disponível"
          :avatar-nome="gerente.nome"
        />
      </template>

      <SectionLabel>Contato</SectionLabel>
      <div class="rounded-card bg-card px-[18px] shadow-card">
        <ContactRow v-if="representante.telefone" :icon="Phone" label="Telefone" :value="representante.telefone">
          <a
            v-if="representante.whatsapp"
            :href="`https://wa.me/55${somenteDigitos(representante.whatsapp)}`"
            target="_blank"
            rel="noopener"
            class="flex shrink-0 items-center gap-1 text-[13px] font-semibold text-primary"
          >
            <MessageCircle :size="16" /> WhatsApp
          </a>
        </ContactRow>
        <ContactRow v-else-if="representante.whatsapp" :icon="MessageCircle" label="WhatsApp" :value="representante.whatsapp" />
        <ContactRow v-if="representante.email" :icon="Mail" label="Email" :value="representante.email" />
        <ContactRow v-if="representante.endereco" :icon="MapPin" label="Localização" :value="representante.endereco" />
      </div>

      <AppButton variant="secondary" class="mt-6" @click="$router.push({ name: 'representantes' })">
        Voltar à pesquisa
      </AppButton>
    </template>
  </div>
</template>
