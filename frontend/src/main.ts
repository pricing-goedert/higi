import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import './style.css'

// Asks the browser to exempt this origin from best-effort eviction. Without
// it, a phone under storage pressure can drop the whole origin — the synced
// catalog in IndexedDB and every cached photo at once — and the rep finds out
// at the stand, offline. docs/PLAN.md flags this as a Phase 5 risk; nothing
// depends on the answer, so it's fire-and-forget.
void navigator.storage?.persist?.()

const app = createApp(App)

app.use(createPinia())
app.use(router)

router.isReady().then(() => {
  app.mount('#app')
})
