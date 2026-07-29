import { Router } from 'express'
import { prisma } from './prisma'
import { requireAuth, requireAdmin } from '../middleware/auth'

// Straightforward collections (no password hashing, no nested writes) share
// this one shape: list/get behind login, write behind isAdmin. Usuario and
// Orientacao need custom handling instead (see routes/usuarios.ts,
// routes/orientacoes.ts) and don't use this factory.
type SimpleModel = 'cliente' | 'categoria' | 'grupo' | 'tipo' | 'produto' | 'indicacao' | 'programacao'

export function crudRouter(modelName: SimpleModel) {
  const router = Router()
  const model = prisma[modelName] as unknown as {
    findMany: (args?: unknown) => Promise<unknown[]>
    findUnique: (args: { where: { id: string } }) => Promise<unknown>
    create: (args: { data: unknown }) => Promise<unknown>
    update: (args: { where: { id: string }; data: unknown }) => Promise<unknown>
    delete: (args: { where: { id: string } }) => Promise<unknown>
  }

  router.get('/', requireAuth, async (_req, res) => {
    res.json(await model.findMany())
  })

  router.get('/:id', requireAuth, async (req, res) => {
    const item = await model.findUnique({ where: { id: req.params.id } })
    if (!item) {
      res.status(404).json({ error: 'Não encontrado' })
      return
    }
    res.json(item)
  })

  router.post('/', requireAuth, requireAdmin, async (req, res) => {
    const item = await model.create({ data: req.body })
    res.status(201).json(item)
  })

  router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
    const item = await model.update({ where: { id: req.params.id }, data: req.body })
    res.json(item)
  })

  router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
    await model.delete({ where: { id: req.params.id } })
    res.status(204).send()
  })

  return router
}
