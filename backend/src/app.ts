import './env'

import path from 'node:path'
import fs from 'node:fs'
import express from 'express'
import cookieParser from 'cookie-parser'
import compression from 'compression'
import helmet from 'helmet'

import { crudRouter } from './lib/crudRouter'
import authRouter from './routes/auth'
import usuariosRouter from './routes/usuarios'
import orientacoesRouter from './routes/orientacoes'
import leadsRouter from './routes/leads'
import importarRouter from './routes/importar'
import produtosRouter from './routes/produtos'

export const app = express()

// Any PaaS host that sits behind its own reverse proxy (Render, Heroku, and
// eventually Azure Container Apps) sets X-Forwarded-For on every request.
// Without this, Express doesn't know it can trust that header, and
// express-rate-limit refuses to compute a client IP from it at all — which
// broke the rate-limited /api/auth/login route entirely in production.
// `1` trusts exactly one hop (the platform's own proxy), not an arbitrary
// chain a client could spoof.
app.set('trust proxy', 1)

// Defaults only: no external scripts/fonts/CDNs anywhere in the frontend, so
// helmet's default CSP (which already allows the inline splash-screen
// <style> via 'unsafe-inline' on style-src) needs no tuning here.
app.use(helmet())

// Every syncAll() resync re-fetches the full JSON list of every collection —
// they compress very well given how repetitive the shape is, so this
// shrinks the real bytes-on-wire cost without needing per-collection delta
// sync (which would need updatedAt/deletion tracking added to most tables).
app.use(compression())

// Express's 100kb default was fine until bulk import: an 806-row product CSV
// turned into JSON is already ~340kb. 10mb comfortably covers a full catalog
// re-import without opening the door to arbitrarily large bodies.
app.use(express.json({ limit: '10mb' }))
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
// Not crudRouter directly like its siblings: produtos also serves the
// resized product photo at /:id/foto — see routes/produtos.ts.
app.use('/api/produtos', produtosRouter)
app.use('/api/indicacoes', crudRouter('indicacao'))
app.use('/api/orientacoes', orientacoesRouter)
app.use('/api/programacao', crudRouter('programacao'))
app.use('/api/leads', leadsRouter)
app.use('/api/importar', importarRouter)

// Only present in the production image (see the Dockerfile) — the frontend's
// built assets land as a sibling of this compiled dist/ dir. In local dev
// this directory doesn't exist, so Vite's own dev server + the /api proxy in
// vite.config.ts keeps handling the frontend, unchanged.
const PUBLIC_DIR = path.join(__dirname, '../public')
if (fs.existsSync(PUBLIC_DIR)) {
  app.use(
    express.static(PUBLIC_DIR, {
      setHeaders(res, filePath) {
        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
        }
      },
    }),
  )
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
