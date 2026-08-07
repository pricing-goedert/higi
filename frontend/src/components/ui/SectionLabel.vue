<template>
  <!-- O prop `dot-class`, que punha uma bolinha colorida antes do rótulo, saiu
       junto com as seções por assunto da Home (Comercial/Produtos/Conteúdo) —
       era o único lugar que o usava. Agora quem separa as seções é o próprio
       espaçamento. -->
  <div class="mb-2 mt-6 text-[13px] font-semibold text-ink first:mt-0">
    <slot />
  </div>
</template>
