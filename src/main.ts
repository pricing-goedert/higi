import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// Loga qualquer erro não tratado de componentes/renderização com o contexto de onde ocorreu.
app.config.errorHandler = (erro, _instance, info) => {
  console.error(`[Vue] Erro não tratado (${info}):`, erro)
}

app.mount('#app')

// Reduz o risco de o navegador (principalmente Safari) apagar o IndexedDB por inatividade.
if (navigator.storage?.persist) {
  navigator.storage.persist()
}
