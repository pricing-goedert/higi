import { Router } from 'express'
import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { requireAuth, requireAdmin } from '../middleware/auth'

const router = Router()

const CAMPOS_OBRIGATORIOS = ['clientUuid', 'tipo', 'cnpj', 'razaoSocial', 'contato', 'telefone'] as const

router.post('/', requireAuth, async (req, res) => {
  const dados = req.body ?? {}
  const faltando = CAMPOS_OBRIGATORIOS.filter((campo) => !dados[campo])
  if (faltando.length > 0) {
    res.status(400).json({ error: `Campos obrigatórios ausentes: ${faltando.join(', ')}` })
    return
  }

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
})

router.get('/', requireAuth, requireAdmin, async (_req, res) => {
  res.json(await prisma.lead.findMany({ orderBy: { createdAt: 'desc' } }))
})

router.get('/export.csv', requireAuth, requireAdmin, async (_req, res) => {
  const leads = await prisma.lead.findMany({ orderBy: { createdAt: 'desc' } })
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
})

function csvEscape(valor: unknown): string {
  if (valor === null || valor === undefined) return ''
  const texto = valor instanceof Date ? valor.toISOString() : String(valor)
  return /[",\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto
}

export default router
