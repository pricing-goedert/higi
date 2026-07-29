import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth, requireAdmin } from '../middleware/auth'

const router = Router()

router.get('/', requireAuth, async (_req, res) => {
  const orientacoes = await prisma.orientacao.findMany({
    include: { secoes: { orderBy: { ordem: 'asc' } } },
    orderBy: { ordem: 'asc' },
  })
  res.json(orientacoes)
})

router.get('/:id', requireAuth, async (req, res) => {
  const orientacao = await prisma.orientacao.findUnique({
    where: { id: req.params.id },
    include: { secoes: { orderBy: { ordem: 'asc' } } },
  })
  if (!orientacao) {
    res.status(404).json({ error: 'Não encontrado' })
    return
  }
  res.json(orientacao)
})

router.post('/', requireAuth, requireAdmin, async (req, res) => {
  const { secoes, ...dados } = req.body ?? {}
  const orientacao = await prisma.orientacao.create({
    data: { ...dados, secoes: { create: secoes ?? [] } },
    include: { secoes: true },
  })
  res.status(201).json(orientacao)
})

router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  const { secoes, ...dados } = req.body ?? {}
  // Replace-all is simplest and safe here: an admin editing an Orientacao's
  // sections is always online and always sends the full section list, so
  // there's no offline/partial-update case to reconcile.
  await prisma.orientacaoSecao.deleteMany({ where: { orientacaoId: req.params.id } })
  const orientacao = await prisma.orientacao.update({
    where: { id: req.params.id },
    data: { ...dados, secoes: { create: secoes ?? [] } },
    include: { secoes: true },
  })
  res.json(orientacao)
})

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  await prisma.orientacao.delete({ where: { id: req.params.id } })
  res.status(204).send()
})

export default router
