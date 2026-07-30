import { Router } from 'express'
import bcrypt from 'bcrypt'
import rateLimit from 'express-rate-limit'
import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { COOKIE_NAME, signToken } from '../lib/auth'
import { requireAuth } from '../middleware/auth'
import { ah } from '../lib/asyncHandler'
import { semSenha } from '../lib/semSenha'

const router = Router()

const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000

// Self-service profile edit: only these — a rep can change their own contact
// details, never isAdmin/superiorId/cnpj/tipoRepresentante (those stay
// admin-only, via the Usuarios CMS tab, to prevent self-escalation).
const CAMPOS_EDITAVEIS_PELO_PROPRIO = ['nome', 'email', 'telefone', 'whatsapp', 'endereco', 'cidade', 'uf', 'pais'] as const

// The one genuinely public, unauthenticated route (you need it to get a
// session at all) — rate limited since it can't be gated behind login.
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 })

router.post(
  '/login',
  loginLimiter,
  ah(async (req, res) => {
    const { email, password } = req.body ?? {}
    if (!email || !password) {
      res.status(400).json({ error: 'Email e senha são obrigatórios' })
      return
    }

    const usuario = await prisma.usuario.findUnique({ where: { email } })
    const senhaValida = usuario ? await bcrypt.compare(password, usuario.passwordHash) : false
    if (!usuario || !senhaValida) {
      res.status(401).json({ error: 'Credenciais inválidas' })
      return
    }

    const token = signToken({ id: usuario.id, isAdmin: usuario.isAdmin })
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: SESSION_MAX_AGE_MS,
    })
    res.json({ id: usuario.id, nome: usuario.nome, isAdmin: usuario.isAdmin })
  }),
)

router.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE_NAME)
  res.status(204).send()
})

// The frontend can't read the httpOnly cookie directly, so this is how it
// knows "am I still logged in" after a page reload. Also re-issues the
// cookie with a fresh expiry on every call — a sliding session, so a rep
// who opens the app daily (the existing offline-sync habit) never has to
// log in again mid-event. See docs/ARCHITECTURE.md's Auth section.
router.get(
  '/me',
  requireAuth,
  ah(async (req, res) => {
    const usuario = await prisma.usuario.findUnique({ where: { id: req.user!.id } })
    if (!usuario) {
      res.status(401).json({ error: 'Sessão inválida' })
      return
    }

    const token = signToken({ id: usuario.id, isAdmin: usuario.isAdmin })
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: SESSION_MAX_AGE_MS,
    })
    res.json({ id: usuario.id, nome: usuario.nome, isAdmin: usuario.isAdmin })
  }),
)

router.put(
  '/me',
  requireAuth,
  ah(async (req, res) => {
    const body = req.body ?? {}
    const dados: Record<string, unknown> = {}
    for (const campo of CAMPOS_EDITAVEIS_PELO_PROPRIO) {
      if (!(campo in body)) continue
      const valor = body[campo]
      if ((campo === 'nome' || campo === 'email') && !valor) {
        res.status(400).json({ error: campo === 'nome' ? 'Nome é obrigatório' : 'Email é obrigatório' })
        return
      }
      dados[campo] = valor || null
    }

    if (body.novaSenha) {
      if (!body.senhaAtual) {
        res.status(400).json({ error: 'Informe a senha atual para alterá-la' })
        return
      }
      const usuarioAtual = await prisma.usuario.findUniqueOrThrow({ where: { id: req.user!.id } })
      const senhaValida = await bcrypt.compare(body.senhaAtual, usuarioAtual.passwordHash)
      if (!senhaValida) {
        res.status(400).json({ error: 'Senha atual incorreta' })
        return
      }
      dados.passwordHash = await bcrypt.hash(body.novaSenha, 12)
    }

    try {
      const usuario = await prisma.usuario.update({ where: { id: req.user!.id }, data: dados })
      res.json(semSenha(usuario))
    } catch (erro) {
      if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === 'P2002') {
        res.status(409).json({ error: 'Este email já está em uso' })
        return
      }
      throw erro
    }
  }),
)

export default router
