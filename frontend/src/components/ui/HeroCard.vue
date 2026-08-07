<script setup lang="ts">
withDefaults(
  defineProps<{
    to: { name: string }
    titulo: string
    /** URL já resolvida pelo Vite (import do .png), aplicada em background-image. */
    imagem: string
    /** O destaque de maior valor da tela: mais alto, título maior e com anel de contorno. */
    principal?: boolean
  }>(),
  { principal: false },
)
</script>

<template>
  <!-- Só título + foto: sem ícone e sem texto auxiliar de propósito. O que
       comunica que o card é tocável é a própria reação visual dele. -->
  <RouterLink
    :to="to"
    class="group relative flex items-end overflow-hidden rounded-card bg-primary shadow-card transition-transform duration-200 ease-out active:scale-[0.98]"
    :class="principal ? 'h-44 ring-2 ring-primary/60 ring-offset-2 ring-offset-bg lg:h-64' : 'h-32 lg:h-64'"
  >
    <!-- Repouso: cinza, apagada e levemente desfocada. Ativa (hover no desktop,
         toque no mobile): cor, nitidez e opacidade totais + zoom.
         O scale-110 de repouso existe porque blur() amostra fora da caixa da
         imagem e deixaria uma borda translúcida nas quatro laterais.
         No Tailwind 4 `hover:` já vem embrulhado em @media (hover: hover), então
         group-hover não "cola" em tela de toque — quem cobre o toque é
         group-active. -->
    <div
      class="absolute inset-0 scale-110 bg-cover bg-center opacity-40 grayscale transition-all duration-500 ease-out group-hover:scale-[1.18] group-hover:opacity-100 group-hover:blur-0 group-hover:grayscale-0 group-active:scale-[1.18] group-active:opacity-100 group-active:blur-0 group-active:grayscale-0"
      :style="{ backgroundImage: `url(${imagem})` }"
    />
    <!-- Fora da div da imagem para não herdar grayscale/blur: é o que garante
         o contraste do título branco quando a foto está em cores e nítida. -->
    <div class="absolute inset-0 bg-linear-to-t from-black/85 via-black/45 to-black/10" />

    <h3
      class="relative p-5 font-bold leading-tight text-white drop-shadow-sm"
      :class="principal ? 'text-[20px]' : 'text-[17px]'"
    >
      {{ titulo }}
    </h3>
  </RouterLink>
</template>
