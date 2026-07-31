import { Router } from 'express'
import { requireAuth, requireAdmin } from '../middleware/auth'
import { ah } from './asyncHandler'

export type LinhaImportacao = Record<string, unknown>

/**
 * Cache válido para uma única request de importação — permite que
 * resolverFks evite repetir a mesma consulta/criação para linhas que
 * compartilham a mesma referência (ex.: centenas de produtos sob a mesma
 * categoria). Criado do zero a cada POST, nunca reaproveitado entre
 * requests, então uma categoria renomeada por fora nunca fica presa nele.
 */
export type CacheImportacao = Map<string, unknown>

export interface ColunaImportacao {
  chave: string
  obrigatorio?: boolean
}

export interface ModelDelegate {
  findUnique: (args: { where: Record<string, unknown> }) => Promise<Record<string, unknown> | null>
  create: (args: { data: Record<string, unknown> }) => Promise<unknown>
  update: (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => Promise<unknown>
}

export interface ConfigImportacao {
  /** Nome do arquivo de modelo baixado, ex.: "clientes". */
  nome: string
  model: ModelDelegate
  /** Colunas esperadas no CSV, na ordem em que aparecem no modelo baixável. */
  colunas: ColunaImportacao[]
  /** Campo usado para decidir se a linha cria um registro novo ou atualiza um existente. */
  chaveUnica: string
  /**
   * Resolve chaves naturais (ex.: e-mail de um representante) para os IDs
   * reais que o Prisma espera. Deve lançar um Error com mensagem amigável
   * quando a referência não existe e não pode ser criada.
   *
   * Recebe `confirmar` para os casos em que a própria resolução pode
   * precisar criar um registro (ex.: categoria/tipo do catálogo) — na
   * pré-visualização (confirmar=false) isso não deve gravar nada, só
   * indicar que a linha é válida.
   */
  resolverFks?: (linha: LinhaImportacao, confirmar: boolean, cache: CacheImportacao) => Promise<LinhaImportacao>
  /**
   * Última transformação antes de gravar — ex.: transformar uma senha em
   * texto puro no hash que o banco espera. Recebe o registro existente
   * (ou null, se a linha for uma criação) para decidir o que é obrigatório
   * em cada caso.
   */
  antesDeSalvar?: (linha: LinhaImportacao, existente: Record<string, unknown> | null) => Promise<LinhaImportacao>
}

interface ResultadoLinha {
  linha: number
  status: 'criado' | 'atualizado' | 'erro'
  mensagem?: string
}

// Keeps only the columns the config declares (drops stray CSV columns) and
// turns blank cells into null — a bulk import is the whole source of truth
// for a row, not a partial patch, so "blank" means "no value" rather than
// "leave whatever was there before".
function normalizarLinha(linha: LinhaImportacao, colunas: ColunaImportacao[]): LinhaImportacao {
  const normalizada: LinhaImportacao = {}
  for (const coluna of colunas) {
    const bruto = linha[coluna.chave]
    const valor = typeof bruto === 'string' ? bruto.trim() : bruto
    normalizada[coluna.chave] = valor === '' || valor === undefined ? null : valor
  }
  return normalizada
}

function validarObrigatorios(linha: LinhaImportacao, colunas: ColunaImportacao[]) {
  for (const coluna of colunas) {
    if (coluna.obrigatorio && !linha[coluna.chave]) {
      throw new Error(`Campo "${coluna.chave}" é obrigatório`)
    }
  }
}

async function processarLinha(
  config: ConfigImportacao,
  linhaOriginal: LinhaImportacao,
  confirmar: boolean,
  cache: CacheImportacao,
): Promise<ResultadoLinha['status'] | { erro: string }> {
  let linha = normalizarLinha(linhaOriginal, config.colunas)
  validarObrigatorios(linha, config.colunas)

  if (config.resolverFks) linha = await config.resolverFks(linha, confirmar, cache)

  const valorChave = linha[config.chaveUnica]
  const existente = await config.model.findUnique({ where: { [config.chaveUnica]: valorChave } })

  if (config.antesDeSalvar) linha = await config.antesDeSalvar(linha, existente)

  if (!confirmar) return existente ? 'atualizado' : 'criado'

  if (existente) {
    await config.model.update({ where: { [config.chaveUnica]: valorChave }, data: linha })
    return 'atualizado'
  }
  await config.model.create({ data: linha })
  return 'criado'
}

/**
 * Fábrica genérica de importação em massa — mesma ideia do crudRouter, mas
 * para "muitas linhas de uma vez" em vez de um registro por request. Cada
 * linha é processada de forma independente: uma linha ruim vira um "erro"
 * no resultado, não derruba o lote inteiro (mesmo princípio do tratamento
 * de duplicidade em POST /api/leads).
 */
export function bulkImportRouter(config: ConfigImportacao) {
  const router = Router()

  router.get(
    '/modelo',
    requireAuth,
    requireAdmin,
    (_req, res) => {
      const cabecalho = config.colunas.map((coluna) => coluna.chave).join(',')
      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.setHeader('Content-Disposition', `attachment; filename="modelo-${config.nome}.csv"`)
      res.send(`${cabecalho}\n`)
    },
  )

  router.post(
    '/',
    requireAuth,
    requireAdmin,
    ah(async (req, res) => {
      const linhas = req.body?.linhas
      if (!Array.isArray(linhas) || linhas.length === 0) {
        res.status(400).json({ error: 'Nenhuma linha para importar' })
        return
      }

      const confirmar = req.body?.confirmar === true
      const resultados: ResultadoLinha[] = []
      const cache: CacheImportacao = new Map()

      for (const [indice, linha] of linhas.entries()) {
        const numeroLinha = indice + 1
        try {
          const status = await processarLinha(config, linha, confirmar, cache)
          resultados.push({ linha: numeroLinha, status: status as ResultadoLinha['status'] })
        } catch (erro) {
          resultados.push({
            linha: numeroLinha,
            status: 'erro',
            mensagem: erro instanceof Error ? erro.message : 'Erro desconhecido',
          })
        }
      }

      const resumo = {
        criados: resultados.filter((r) => r.status === 'criado').length,
        atualizados: resultados.filter((r) => r.status === 'atualizado').length,
        erros: resultados.filter((r) => r.status === 'erro').length,
      }

      res.json({ confirmado: confirmar, resultados, resumo })
    }),
  )

  return router
}
