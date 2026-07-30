import { Router } from 'express'
import bcrypt from 'bcrypt'
import { prisma } from '../lib/prisma'
import { requireAuth, requireAdmin } from '../middleware/auth'
import { ah } from '../lib/asyncHandler'
import { semSenha } from '../lib/semSenha'

const router = Router()

router.get(
  '/',
  requireAuth,
  ah(async (_req, res) => {
    const usuarios = await prisma.usuario.findMany()
    res.json(usuarios.map(semSenha))
  }),
)

router.get(
  '/:id',
  requireAuth,
  ah(async (req, res) => {
    const usuario = await prisma.usuario.findUnique({ where: { id: req.params.id } })
    if (!usuario) {
      res.status(404).json({ error: 'Não encontrado' })
      return
    }
    res.json(semSenha(usuario))
  }),
)

router.post(
  '/',
  requireAuth,
  requireAdmin,
  ah(async (req, res) => {
    const { password, ...dados } = req.body ?? {}
    if (!password) {
      res.status(400).json({ error: 'Senha é obrigatória' })
      return
    }
    const passwordHash = await bcrypt.hash(password, 12)
    const usuario = await prisma.usuario.create({ data: { ...dados, passwordHash } })
    res.status(201).json(semSenha(usuario))
  }),
)

router.put(
  '/:id',
  requireAuth,
  requireAdmin,
  ah(async (req, res) => {
    const { password, ...dados } = req.body ?? {}
    const data: Record<string, unknown> = { ...dados }
    if (password) {
      data.passwordHash = await bcrypt.hash(password, 12)
    }
    const usuario = await prisma.usuario.update({ where: { id: req.params.id }, data })
    res.json(semSenha(usuario))
  }),
)

router.delete(
  '/:id',
  requireAuth,
  requireAdmin,
  ah(async (req, res) => {
    await prisma.usuario.delete({ where: { id: req.params.id } })
    res.status(204).send()
  }),
)

export default router
