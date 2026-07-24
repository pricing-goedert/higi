<script setup lang="ts">
</script>

<template>
  <section class="hero">
    <p class="eyebrow">Projeto iniciado do zero</p>
    <h2>Bem-vindo ao seu novo projeto Vue</h2>
    <p class="description">
      Esta é uma base limpa para você começar a construir sem depender de componentes padrão
      ou de ícones que não serão usados.
    </p>

    <div class="cards">
      <article class="card">
        <h3>Estrutura simples</h3>
        <p>Rotas e páginas organizadas para crescer com o projeto.</p>
      </article>
      <article class="card">
        <h3>Pronto para customizar</h3>
        <p>Adicione telas, estilos e lógica sem precisar remover componentes antigos.</p>
      </article>
    </div>
  </section>
</template>

<style scoped>
.hero {
  max-width: 960px;
  margin: 0 auto;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-size: 0.8rem;
  color: #475569;
  margin-bottom: 0.5rem;
}

h2 {
  font-size: 2rem;
  margin-bottom: 0.75rem;
}

.description {
  font-size: 1rem;
  line-height: 1.6;
  color: #334155;
  margin-bottom: 1.5rem;
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.card {
  background: #fff;
  padding: 1.25rem;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
}

.card h3 {
  margin-top: 0;
  margin-bottom: 0.5rem;
}

.card p {
  margin: 0;
  color: #475569;
}
</style>
