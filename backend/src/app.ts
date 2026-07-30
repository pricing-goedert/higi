import 'dotenv/config'
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

// Last resort: any route handler wrapped in `ah()` (see lib/asyncHandler)
// forwards unexpected errors here instead of crashing the process — an
// admin typo or a bad FK must return a 500 to that one request, not take
// the whole app down for every rep at the event.
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'Erro interno' })
})
