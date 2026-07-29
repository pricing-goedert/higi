import type { RequestHandler } from 'express'
import { COOKIE_NAME, verifyToken, type TokenPayload } from '../lib/auth'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: TokenPayload
    }
  }
}

export const requireAuth: RequestHandler = (req, res, next) => {
  const token = req.cookies?.[COOKIE_NAME]
  if (!token) {
    res.status(401).json({ error: 'Não autenticado' })
    return
  }

  try {
    req.user = verifyToken(token)
    next()
  } catch {
    res.status(401).json({ error: 'Sessão inválida ou expirada' })
  }
}

export const requireAdmin: RequestHandler = (req, res, next) => {
  if (!req.user?.isAdmin) {
    res.status(403).json({ error: 'Acesso restrito a administradores' })
    return
  }
  next()
}
