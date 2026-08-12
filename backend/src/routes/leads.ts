import { Router } from 'express'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middleware/auth'
import { ah } from '../lib/asyncHandler'

const router = Router()

const CAMPOS_OBRIGATORIOS_LABEL: Record<string, string> = {
  clientUuid: 'clientUuid',
  tipo: 'tipo',
  cnpj: 'cnpj',
  razaoSocial: 'razaoSocial',
  contato: 'contato',
  telefone: 'telefone',
}

const leadSchema = z.object({
  clientUuid: z.string().min(1),
  tipo: z.string().min(1),
  cnpj: z.string().min(1),
  razaoSocial: z.string().min(1),
  contato: z.string().min(1),
  telefone: z.string().min(1),
  cep: z.string().nullish(),
  endereco: z.string().nullish(),
  email: z.string().nullish(),
  observacoes: z.string().nullish(),
  clienteId: z.string().nullish(),
})

router.post(
  '/',
  requireAuth,
  ah(async (req, res) => {
    const parsed = leadSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      const faltando = [...new Set(parsed.error.issues.map((issue) => String(issue.path[0])))].map(
        (campo) => CAMPOS_OBRIGATORIOS_LABEL[campo] ?? campo,
      )
      res.status(400).json({ error: `Campos obrigatórios ausentes: ${faltando.join(', ')}` })
      return
    }
    const dados = parsed.data

    try {
      const lead = await prisma.lead.create({
        data: {
          clientUuid: dados.clientUuid,
          tipo: dados.tipo,
          cnpj: dados.cnpj,
          razaoSocial: dados.razaoSocial,
          contato: dados.contato,
          telefone: dados.telefone,
          cep: dados.cep ?? null,
          endereco: dados.endereco ?? null,
          email: dados.email ?? null,
          observacoes: dados.observacoes ?? null,
          clienteId: dados.clienteId ?? null,
          capturadoPorId: req.user!.id,
        },
      })
      res.status(201).json(lead)
    } catch (erro) {
      // Retry-safe: the outbox may resend the same lead (clientUuid) after a
      // flaky sync — treat a duplicate as "already saved", not an error.
      if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === 'P2002') {
        const existente = await prisma.lead.findUnique({ where: { clientUuid: dados.clientUuid } })
        res.status(200).json(existente)
        return
      }
      throw erro
    }
  }),
)

// Regular users see only leads they personally captured — admins see every
// lead (this is also where the Admin CMS's read-only Leads tab reads from).
router.get(
  '/',
  requireAuth,
  ah(async (req, res) => {
    const where = req.user!.isAdmin ? {} : { capturadoPorId: req.user!.id }
    res.json(await prisma.lead.findMany({ where, orderBy: { createdAt: 'desc' } }))
  }),
)

router.get(
  '/export.csv',
  requireAuth,
  ah(async (req, res) => {
    const where = req.user!.isAdmin ? {} : { capturadoPorId: req.user!.id }
    const leads = await prisma.lead.findMany({ where, orderBy: { createdAt: 'desc' } })
    const colunas = [
      'id',
      'clientUuid',
      'tipo',
      'cnpj',
      'razaoSocial',
      'contato',
      'telefone',
      'cep',
      'endereco',
      'email',
      'observacoes',
      'clienteId',
      'capturadoPorId',
      'createdAt',
    ] as const

    const linhas = [colunas.join(',')]
    for (const lead of leads) {
      const registro = lead as unknown as Record<string, unknown>
      linhas.push(colunas.map((coluna) => csvEscape(registro[coluna])).join(','))
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="leads.csv"')
    res.send(linhas.join('\n'))
  }),
)

function csvEscape(valor: unknown): string {
  if (valor === null || valor === undefined) return ''
  const texto = valor instanceof Date ? valor.toISOString() : String(valor)
  return /[",\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto
}

export default router
