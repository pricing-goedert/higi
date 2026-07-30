import 'dotenv/config'
import path from 'node:path'
import fs from 'node:fs'
import express from 'express'
import cookieParser from 'cookie-parser'

import { crudRouter } from './lib/crudRouter'
import authRouter from './routes/auth'
import usuariosRouter from './routes/usuarios'
import orientacoesRouter from './routes/orientacoes'
import leadsRouter from './routes/leads'

export const app = express()

app.use(express.json())
app.use(cookieParser())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRouter)
app.use('/api/usuarios', usuariosRouter)
app.use('/api/clientes', crudRouter('cliente'))
app.use('/api/categorias', crudRouter('categoria'))
app.use('/api/grupos', crudRouter('grupo'))
app.use('/api/tipos', crudRouter('tipo'))
app.use('/api/produtos', crudRouter('produto'))
app.use('/api/indicacoes', crudRouter('indicacao'))
app.use('/api/orientacoes', orientacoesRouter)
app.use('/api/programacao', crudRouter('programacao'))
app.use('/api/leads', leadsRouter)

// Only present in the production image (see the Dockerfile) — the frontend's
// built assets land as a sibling of this compiled dist/ dir. In local dev
// this directory doesn't exist, so Vite's own dev server + the /api proxy in
// vite.config.ts keeps handling the frontend, unchanged.
const PUBLIC_DIR = path.join(__dirname, '../public')
if (fs.existsSync(PUBLIC_DIR)) {
  app.use(express.static(PUBLIC_DIR))
  // SPA fallback for Vue Router's history mode — but a genuinely unmatched
  // /api/* path must still 404, not silently return index.html.
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      next()
      return
    }
    res.sendFile(path.join(PUBLIC_DIR, 'index.html'))
  })
}

// Last resort: any route handler wrapped in `ah()` (see lib/asyncHandler)
// forwards unexpected errors here instead of crashing the process — an
// admin typo or a bad FK must return a 500 to that one request, not take
// the whole app down for every rep at the event.
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'Erro interno' })
})
