<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Briefcase, Mail, MapPin, Phone, User, UserPlus } from '@lucide/vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import Avatar from '@/components/ui/Avatar.vue'
import SectionLabel from '@/components/ui/SectionLabel.vue'
import ContactRow from '@/components/ui/ContactRow.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { getCliente, getUsuario } from '@/lib/data'
import { mascaraCnpj } from '@/lib/format'
import { registrarRecente } from '@/lib/recentes'
import type { Cliente, Usuario } from '@/types/domain'

const route = useRoute()
const id = computed(() => route.params.id as string)

const cliente = ref<Cliente | null>(null)
const representante = ref<Usuario | null>(null)
const gerente = ref<Usuario | null>(null)
const carregando = ref(true)
const erro = ref('')

async function carregar() {
  carregando.value = true
  erro.value = ''
  try {
    const encontrado = await getCliente(id.value)
    cliente.value = encontrado
    registrarRecente({ id: encontrado.id, cnpj: encontrado.cnpj, razaoSocial: encontrado.razaoSocial })

    if (encontrado.representanteId) {
      representante.value = await getUsuario(encontrado.representanteId)
      if (representante.value.superiorId) {
        gerente.value = await getUsuario(representante.value.superiorId)
      }
    }
  } catch {
    erro.value = 'Não foi possível carregar este cliente.'
  } finally {
    carregando.value = false
  }
}

onMounted(carregar)
</script>

<template>
  <AppHeader title="Cliente" />
  <div class="px-4">
    <p v-if="erro" class="text-danger">{{ erro }}</p>
    <p v-else-if="carregando" class="text-muted">Carregando...</p>

    <template v-else-if="cliente">
      <div class="mb-5 flex flex-col items-center text-center">
        <Avatar :nome="cliente.razaoSocial" :size="84" />
        <div class="mt-3.5 text-[19px] font-bold text-ink">{{ cliente.razaoSocial }}</div>
        <div v-if="cliente.nomeFantasia" class="mt-1 text-[14px] text-muted">{{ cliente.nomeFantasia }}</div>
        <div class="mt-2.5 rounded-chip bg-icon-soft px-3 py-1 text-[13px] font-medium text-primary">
          {{ mascaraCnpj(cliente.cnpj) }}
        </div>
      </div>

      <RouterLink
        v-if="representante"
        :to="{ name: 'representante-detalhe', params: { id: representante.id } }"
        class="mb-2 flex items-center gap-3.5 rounded-card bg-primary p-[18px] text-white"
      >
        <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15">
          <Briefcase :size="20" />
        </div>
        <div class="flex-1">
          <div class="text-[12px] font-semibold uppercase tracking-wide text-white/65">Representante que atende</div>
          <div class="mt-0.5 text-[15.5px] font-bold">{{ representante.nome }}</div>
        </div>
      </RouterLink>
      <RouterLink
        v-if="gerente"
        :to="{ name: 'representante-detalhe', params: { id: gerente.id } }"
        class="mb-5 block text-center text-[13px] text-muted underline"
      >
        Representante indisponível? Fale com o gerente {{ gerente.nome }}
      </RouterLink>

      <SectionLabel>Dados</SectionLabel>
      <div class="rounded-card bg-card px-[18px] shadow-card">
        <ContactRow v-if="cliente.endereco" :icon="MapPin" label="Endereço" :value="cliente.endereco" />
        <ContactRow v-if="cliente.contato" :icon="User" label="Contato" :value="cliente.contato" />
        <ContactRow v-if="cliente.telefone" :icon="Phone" label="Telefone" :value="cliente.telefone" />
        <ContactRow v-if="cliente.email" :icon="Mail" label="Email" :value="cliente.email" />
      </div>

      <AppButton
        variant="primary"
        class="mt-6"
        @click="$router.push({ name: 'leads', query: { clienteId: cliente.id } })"
      >
        <UserPlus :size="20" /> Cadastrar Lead vinculado
      </AppButton>
    </template>
  </div>
</template>
