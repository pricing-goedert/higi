<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  to: { name: string }
  icon: Component
  label: string
}>()
</script>

<template>
  <!-- Degrau entre o HeroCard (foto, full-width) e o MenuRow (linha de lista):
       cartão próprio, ícone destacado no topo e área de toque de card inteiro.
       Não é o RowCard — aquele é linha horizontal de lista, com subtítulo,
       chevron e mb-2.5; aqui a caixa é vertical e vive dentro de uma grade.
       Sem chevron de propósito: o card todo é o alvo, e a seta só sobrecarrega
       uma caixa que já tem metade da largura da tela. -->
  <RouterLink
    :to="to"
    class="flex flex-col gap-3 rounded-card border border-divider bg-card p-4 shadow-card transition-transform duration-200 ease-out active:scale-[0.98]"
  >
    <!-- Cor do chip fixa no componente, não mais um prop `iconClass` por
         chamada: azul sobre azul-claro, o mesmo par do .icon-circle do
         design-frame (styles.css) que o resto do app já usa. A Home era a única
         tela com ícone verde e âmbar, e a cor não carregava informação nenhuma
         que o rótulo ao lado já não dissesse. -->
    <span class="flex h-11 w-11 items-center justify-center rounded-chip bg-icon-soft text-primary">
      <component :is="icon" :size="22" />
    </span>
    <!-- mt-auto alinha a base dos títulos mesmo quando um quebra em duas linhas
         e o outro não (a grade já iguala a altura dos dois cards). -->
    <span class="mt-auto text-[15px] font-semibold leading-snug text-ink">{{ label }}</span>
  </RouterLink>
</template>
